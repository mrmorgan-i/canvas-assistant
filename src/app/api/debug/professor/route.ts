import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { professors, courses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionFromRequest } from "@/lib/sessions";

export async function GET(request: NextRequest) {
  try {
    // Get session to identify the user
    const session = await getSessionFromRequest(request);
    
    if (!session) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    // Find the professor by LTI user ID from session
    const professor = await db.query.professors.findFirst({
      where: eq(professors.lti_user_id, session.lti_user_id)
    });

    if (!professor) {
      return NextResponse.json({ 
        error: "Professor not found",
        session: {
          lti_user_id: session.lti_user_id,
          canvas_course_id: session.canvas_course_id,
          deployment_id: session.deployment_id,
          user_name: session.user_name,
        }
      }, { status: 404 });
    }

    // Get course configuration for this session
    const course = await db.query.courses.findFirst({
      where: and(
        eq(courses.canvas_course_id, session.canvas_course_id),
        eq(courses.professor_id, professor.id)
      )
    });

    return NextResponse.json({
      professor: {
        id: professor.id,
        lti_user_id: professor.lti_user_id,
        name: professor.name,
        email: professor.email,
        created_at: professor.created_at,
        updated_at: professor.updated_at,
      },
      course: course ? {
        id: course.id,
        canvas_course_id: course.canvas_course_id,
        course_name: course.course_name,
        deployment_id: course.deployment_id,
        has_api_key: !!course.openai_api_key,
        api_key_length: course.openai_api_key?.length || 0,
        api_key_encrypted: course.openai_api_key ? course.openai_api_key.length > 100 : false, // Encrypted keys are much longer
        has_system_instructions: !!course.system_instructions,
        system_instructions_length: course.system_instructions?.length || 0,
        is_setup_complete: course.is_setup_complete,
        model: course.model,
        temperature: course.temperature,
        max_tokens: course.max_tokens,
        created_at: course.created_at,
        updated_at: course.updated_at,
      } : null,
      session: {
        lti_user_id: session.lti_user_id,
        canvas_course_id: session.canvas_course_id,
        deployment_id: session.deployment_id,
        user_name: session.user_name,
        course_name: session.course_name,
      }
    });

  } catch (error) {
    console.error("Debug route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 