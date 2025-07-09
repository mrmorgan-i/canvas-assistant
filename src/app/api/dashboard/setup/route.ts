import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { professors, courses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionFromRequest, isInstructorSession } from "@/lib/sessions";
import { encrypt } from "@/lib/crypto";

export async function POST(request: NextRequest) {
  try {
    // Validate session
    const session = await getSessionFromRequest(request);
    
    if (!session || !isInstructorSession(session)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const action = formData.get("action") as string;

    // Find the professor by LTI user ID from session
    const professor = await db.query.professors.findFirst({
      where: eq(professors.lti_user_id, session.lti_user_id)
    });

    if (!professor) {
      return new NextResponse("Professor not found", { status: 404 });
    }

    // Find the course for this specific session
    const course = await db.query.courses.findFirst({
      where: and(
        eq(courses.canvas_course_id, session.canvas_course_id),
        eq(courses.professor_id, professor.id)
      )
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    if (action === "api_key") {
      const apiKey = formData.get("api_key") as string;
      
      if (!apiKey || !apiKey.startsWith("sk-")) {
        return new NextResponse("Invalid API key format", { status: 400 });
      }

      // Update the course's API key (per-course configuration)
      // Encrypt the API key before storing in database
      const encryptedApiKey = encrypt(apiKey);
      
      await db.update(courses)
        .set({ 
          openai_api_key: encryptedApiKey,
          updated_at: new Date(),
        })
        .where(eq(courses.id, course.id));

      console.log(`✅ API key saved for course ${course.id} (${course.course_name})`);
      
      // Stay on setup wizard - don't redirect until both steps are complete
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    if (action === "system_instructions") {
      const systemInstructions = formData.get("system_instructions") as string;
      
      if (!systemInstructions) {
        return new NextResponse("System instructions are required", { status: 400 });
      }

      // Update the course's system instructions
      await db.update(courses)
        .set({ 
          system_instructions: systemInstructions,
          updated_at: new Date(),
        })
        .where(eq(courses.id, course.id));

      // Check if setup is now complete (both API key and instructions)
      const updatedCourse = await db.query.courses.findFirst({
        where: eq(courses.id, course.id)
      });

      if (updatedCourse?.openai_api_key && updatedCourse?.system_instructions) {
        await db.update(courses)
          .set({ 
            is_setup_complete: true,
            updated_at: new Date(),
          })
          .where(eq(courses.id, course.id));
        
        console.log(`✅ Setup completed for course ${course.id} (${course.course_name})`);
      } else {
        console.log(`⚠️ Setup incomplete for course ${course.id} - missing API key`);
      }
      
      // Redirect back to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return new NextResponse("Invalid action", { status: 400 });

  } catch (error) {
    console.error("Dashboard setup error:", error);
    return new NextResponse("Setup failed", { status: 500 });
  }
} 