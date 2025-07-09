import { NextRequest, NextResponse } from "next/server";
import { validateLTIToken, isInstructor, isLearner, extractCourseInfo, extractUserInfo } from "@/lib/lti";
import { db } from "@/db";
import { professors, courses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { findOrCreateSession, getSessionCookieOptions } from "@/lib/sessions";

export async function POST(request: NextRequest) {
  try {
    // DEBUG: Log all information about the launch request
    console.log("=== LTI LAUNCH DEBUG ===");
    console.log("URL:", request.url);
    console.log("Headers:", Object.fromEntries(request.headers.entries()));
    
    const formData = await request.formData();
    const id_token = formData.get("id_token") as string;
    const state = formData.get("state") as string;

    console.log("Form data keys:", Array.from(formData.keys()));
    console.log("Received state:", state);
    console.log("Received id_token length:", id_token?.length || 0);

    // Debug cookies
    const allCookies = request.cookies.getAll();
    console.log("All cookies received:", allCookies.map(c => ({ name: c.name, value: c.value?.substring(0, 20) + "..." })));
    
    const storedState = request.cookies.get("lti_state")?.value;
    const storedNonce = request.cookies.get("lti_nonce")?.value;
    
    console.log("Stored state:", storedState);
    console.log("Stored nonce:", storedNonce);
    console.log("State match:", state === storedState);

    // Validate required parameters
    if (!id_token) {
      console.log("ERROR: Missing id_token");
      return new NextResponse("Missing id_token", { status: 400 });
    }

    // Verify state matches our stored state (CSRF protection)
    if (!storedState || state !== storedState) {
      console.log("ERROR: State validation failed");
      console.log("Expected:", storedState);
      console.log("Received:", state);
      return new NextResponse("Invalid state parameter", { status: 400 });
    }

    console.log("✅ State validation passed");

    // Validate and decode the JWT token
    const claims = await validateLTIToken(id_token);
    console.log("✅ JWT token validated");
    console.log("Claims nonce:", claims.nonce);

    // Verify nonce matches our stored nonce
    if (!storedNonce || claims.nonce !== storedNonce) {
      console.log("ERROR: Nonce validation failed");
      console.log("Expected:", storedNonce);
      console.log("Received:", claims.nonce);
      return new NextResponse("Invalid nonce", { status: 400 });
    }

    console.log("✅ Nonce validation passed");

    // Note: In development, Canvas may not send user name/email fields
    // This will be available in production Canvas instances

    // Extract user and course information
    const userInfo = extractUserInfo(claims);
    const courseInfo = extractCourseInfo(claims);

    console.log("Extracted user info:", userInfo);
    console.log("Extracted course info:", courseInfo);

    // Check message type
    const messageType = claims["https://purl.imsglobal.org/spec/lti/claim/message_type"];
    console.log("Message type:", messageType);

    // Handle different user roles
    if (isInstructor(claims)) {
      console.log("🎓 Handling instructor launch");
      // Handle instructor launch
      await handleInstructorLaunch(userInfo, courseInfo);
      
      // Check for existing valid session first
      const sessionToken = await findOrCreateSession({
        ltiUserId: userInfo.lti_user_id,
        canvasUserId: userInfo.canvas_user_id,
        canvasCourseId: courseInfo.canvas_course_id,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userRoles: userInfo.roles,
        courseName: courseInfo.course_name,
        deploymentId: courseInfo.deployment_id,
        userAgent: request.headers.get("user-agent") || undefined,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
      });
      
      // Redirect to professor dashboard
      const response = NextResponse.redirect(new URL("/dashboard", request.url));
      
      // Set session cookie (just the token)
      response.cookies.set("lti_session", sessionToken, getSessionCookieOptions());

      console.log("✅ Redirecting instructor to dashboard with session:", sessionToken.substring(0, 8) + "...");
      return response;
    } 
    
    else if (isLearner(claims)) {
      console.log("👨‍🎓 Handling student launch");
      // Handle student launch
      const course = await getCourseByCanvasId(courseInfo.canvas_course_id);
      
      if (!course || !course.is_active) {
        console.log("❌ Course not found or inactive");
        return new NextResponse(
          `<html><body><h2>AI Assistant Not Available</h2><p>This course's AI assistant hasn't been set up yet. Please contact your instructor.</p></body></html>`,
          { 
            status: 200,
            headers: { "Content-Type": "text/html" }
          }
        );
      }

      // Check if course has completed setup (configuration is per-course)
      if (!course.is_setup_complete || !course.openai_api_key) {
        console.log("❌ Professor setup incomplete");
        return new NextResponse(
          `<html><body><h2>AI Assistant Not Ready</h2><p>Your instructor is still setting up the AI assistant. Please try again later.</p></body></html>`,
          { 
            status: 200,
            headers: { "Content-Type": "text/html" }
          }
        );
      }

      // Check for existing valid session first (students too)
      const sessionToken = await findOrCreateSession({
        ltiUserId: userInfo.lti_user_id,
        canvasUserId: userInfo.canvas_user_id,
        canvasCourseId: courseInfo.canvas_course_id,
        userName: userInfo.name,
        userEmail: userInfo.email,
        userRoles: userInfo.roles,
        courseName: courseInfo.course_name,
        deploymentId: courseInfo.deployment_id,
        userAgent: request.headers.get("user-agent") || undefined,
        ipAddress: request.headers.get("x-forwarded-for") || undefined,
      });

      // Redirect to chat interface
      const response = NextResponse.redirect(new URL("/chat", request.url));
      
      // Set session cookie (just the token)
      response.cookies.set("lti_session", sessionToken, getSessionCookieOptions());

      console.log("✅ Redirecting student to chat with session:", sessionToken.substring(0, 8) + "...");
      return response;
    }
    
    else {
      console.log("❌ Unauthorized role");
      return new NextResponse("Unauthorized role", { status: 403 });
    }

  } catch (error) {
    console.error("LTI launch error:", error);
    return new NextResponse("Authentication failed", { status: 401 });
  }
}

async function handleInstructorLaunch(
  userInfo: { lti_user_id: string; canvas_user_id: string; name: string; email: string },
  courseInfo: { canvas_course_id: string; course_name: string; deployment_id: string }
) {
  try {
    // Find or create professor
    let professor = await db.query.professors.findFirst({
      where: eq(professors.lti_user_id, userInfo.lti_user_id)
    });

    if (!professor) {
      // Create new professor
      const [newProfessor] = await db.insert(professors).values({
        lti_user_id: userInfo.lti_user_id,
        canvas_user_id: userInfo.canvas_user_id,
        name: userInfo.name,
        email: userInfo.email,
        last_login: new Date(),
      }).returning();
      
      professor = newProfessor;
    } else {
      // Update last login
      await db.update(professors)
        .set({ 
          last_login: new Date(),
          name: userInfo.name, // Update name in case it changed
          email: userInfo.email, // Update email in case it changed
        })
        .where(eq(professors.id, professor.id));
    }

    // Find or create course
    const course = await db.query.courses.findFirst({
      where: and(
        eq(courses.canvas_course_id, courseInfo.canvas_course_id),
        eq(courses.professor_id, professor.id)
      )
    });

    if (!course) {
      // Create new course
      await db.insert(courses).values({
        canvas_course_id: courseInfo.canvas_course_id,
        course_name: courseInfo.course_name,
        professor_id: professor.id,
        deployment_id: courseInfo.deployment_id,
      });
    } else {
      // Update course name in case it changed
      await db.update(courses)
        .set({ 
          course_name: courseInfo.course_name,
          updated_at: new Date(),
        })
        .where(eq(courses.id, course.id));
    }

  } catch (error) {
    console.error("Error handling instructor launch:", error);
    throw error;
  }
}

async function getCourseByCanvasId(canvasId: string) {
  return await db.query.courses.findFirst({
    where: eq(courses.canvas_course_id, canvasId)
  });
} 