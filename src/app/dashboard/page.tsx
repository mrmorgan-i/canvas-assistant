import { redirect } from "next/navigation";
import { db } from "@/db";
import { professors, courses } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionFromRequest, isInstructorSession } from "@/lib/sessions";
import DashboardClient from "./components/DashboardClient";

export default async function DashboardPage() {
  // Get session from database
  const session = await getSessionFromRequest();

  if (!session || !isInstructorSession(session)) {
    console.log("❌ No valid instructor session found");
    redirect("/");
  }

  // Get professor and course data from session
  const professor = await db.query.professors.findFirst({
    where: eq(professors.lti_user_id, session.lti_user_id)
  });

  const course = await db.query.courses.findFirst({
    where: and(
      eq(courses.canvas_course_id, session.canvas_course_id),
      eq(courses.professor_id, professor?.id || "")
    )
  });

  if (!professor || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-700">Unable to load your profile. Please try launching again from Canvas.</p>
        </div>
      </div>
    );
  }

  const isSetupComplete = course.is_setup_complete && course.openai_api_key;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Assistant Dashboard</h1>
              <p className="text-gray-600">{course.course_name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                <p>Professor: {professor.name}</p>
                <p>Status: {isSetupComplete ? "✅ Active" : "🔧 Setup Required"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isSetupComplete ? (
          <SetupWizard course={course} />
        ) : (
          <DashboardClient course={course} />
        )}
      </div>
    </div>
  );
}

function SetupWizard({ course }: { course: typeof courses.$inferSelect }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Canvas AI Assistant!</h2>
        <p className="text-gray-600">
                      Let&apos;s set up your custom AI assistant for {course.course_name}. This will allow your students 
          to interact with an AI tutor directly within Canvas.
        </p>
      </div>

      <div className="space-y-6">
        {/* Step 1: OpenAI API Key */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Step 1: Configure OpenAI API Key
          </h3>
          <p className="text-gray-600 mb-4">
            You&apos;ll need an OpenAI API key to power your AI assistant. 
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline ml-1"
            >
              Get one here
            </a>
          </p>
          
          <form action="/api/dashboard/setup" method="POST" className="space-y-4">
            <input type="hidden" name="action" value="api_key" />
            
            <div>
              <label htmlFor="api_key" className="block text-sm font-medium text-gray-700 mb-2">
                OpenAI API Key
              </label>
              <input
                type="password"
                id="api_key"
                name="api_key"
                placeholder={course.openai_api_key ? "••••••••••••••••" : "sk-..."}
                defaultValue={course.openai_api_key ? "••••••••••••••••" : ""}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                required={!course.openai_api_key}
              />
              {course.openai_api_key && (
                <p className="text-sm text-green-600 mt-1">✅ API key configured</p>
              )}
            </div>
            
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!!course.openai_api_key}
            >
              {course.openai_api_key ? "API Key Saved" : "Save API Key"}
            </button>
          </form>
        </div>

        {/* Step 2: System Instructions */}
        <div className={`border rounded-lg p-6 ${
          course.openai_api_key 
            ? 'border-green-200 bg-green-50' 
            : 'border-gray-200'
        }`}>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Step 2: Customize Your AI Assistant
            {course.openai_api_key && <span className="text-green-600 ml-2">✓</span>}
          </h3>
          <p className="text-gray-600 mb-4">
            Define how your AI assistant should behave and what it should know about your course.
          </p>
          
          {!course.openai_api_key && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
              <p className="text-amber-800 text-sm">
                ⚠️ Complete Step 1 first to configure your AI assistant instructions.
              </p>
            </div>
          )}
          
          <form action="/api/dashboard/setup" method="POST" className="space-y-4">
            <input type="hidden" name="action" value="system_instructions" />
            
            <div>
              <label htmlFor="system_instructions" className="block text-sm font-medium text-gray-700 mb-2">
                System Instructions
              </label>
              <textarea
                id="system_instructions"
                name="system_instructions"
                rows={8}
                placeholder="You are an AI teaching assistant for the course '{course.course_name}'. Help students understand course concepts, answer questions about assignments, and provide study guidance. Be encouraging and educational. If you don't know something specific about the course, admit it and suggest the student ask their professor."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
                defaultValue={course.system_instructions || `You are an AI teaching assistant for the course '${course.course_name}'. Help students understand course concepts, answer questions about assignments, and provide study guidance. Be encouraging and educational. If you don't know something specific about the course, admit it and suggest the student ask their professor.`}
              />
            </div>
            
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!course.openai_api_key}
            >
              {course.system_instructions ? "Update Instructions" : "Save Instructions & Activate"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

