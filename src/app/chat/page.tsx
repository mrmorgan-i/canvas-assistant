// Removed redirect import - using error pages instead
import { db } from "@/db";
import { courses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionFromRequest, isInstructorSession } from "@/lib/sessions";
import ChatInterface from "./components/ChatInterface";

export default async function ChatPage() {
  try {
    // Get session from database - CRITICAL: Server-side validation
    const session = await getSessionFromRequest();

    if (!session) {
      console.log("❌ No valid session found for chat access");
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
            <p className="text-gray-700">You must access this AI assistant through Canvas.</p>
            <p className="text-gray-500 text-sm mt-4">Please launch the AI Assistant from your Canvas course.</p>
          </div>
        </div>
      );
    }

  console.log(`🔍 Chat page access from user ${session.lti_user_id} in course ${session.canvas_course_id}`);

  // Find the course configuration with professor info (using relations)
  // Note: Using canvas_course_id only since deployment_id can vary between professor/student access
  const course = await db.query.courses.findFirst({
    where: eq(courses.canvas_course_id, session.canvas_course_id),
    with: {
      professor: true
    }
  });

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Course Not Found</h1>
          <p className="text-gray-700">This course has not been set up with an AI assistant yet. Please contact your instructor.</p>
          <p className="text-gray-500 text-sm mt-4">Please try launching again from Canvas.</p>
        </div>
      </div>
    );
  }

  if (!course.professor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700">Course professor not found. Please contact your administrator.</p>
        </div>
      </div>
    );
  }

  // Check if course has completed setup
  if (!course.is_setup_complete || !course.openai_api_key || !course.system_instructions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-yellow-600 mb-4">AI Assistant Not Ready</h1>
          <p className="text-gray-700">Your instructor is still setting up the AI assistant for this course.</p>
          <p className="text-gray-600 text-sm mt-4">Please try again later or contact your instructor.</p>
        </div>
      </div>
    );
  }

      // Pass course info to client component
    return (
      <ChatInterface 
        courseName={course.course_name}
        assistantName={course.assistant_name || "AI Assistant"}
        isInstructor={isInstructorSession(session)}
      />
    );
  } catch (error) {
    console.error("Chat page error:", error);
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">Unable to load the AI assistant. Please try again.</p>
          <p className="text-gray-500 text-sm mt-4">If the problem persists, please contact your instructor.</p>
        </div>
      </div>
    );
  }
} 