'use client';

import { useState } from 'react';
import { useRouter } from "next/navigation";
import { courses } from "@/db/schema";

type Course = typeof courses.$inferSelect;

interface DashboardClientProps {
  course: Course;
}

export default function DashboardClient({ course }: DashboardClientProps) {
  const [isApiKeyModalOpen, setApiKeyModalOpen] = useState(false);
  const [isInstructionsModalOpen, setInstructionsModalOpen] = useState(false);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Assistant Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">AI Assistant Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-green-600 font-semibold">✅ Active</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Course:</span>
              <span className="font-medium">{course.course_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Updated:</span>
              <span className="text-sm text-gray-500">
                {new Date(course.updated_at || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button onClick={() => setInstructionsModalOpen(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-left cursor-pointer">
              📝 Edit System Instructions
            </button>
            <button onClick={() => setApiKeyModalOpen(true)} className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-left cursor-pointer">
              🔑 Update API Key
            </button>
            <a 
              href="/chat"
              className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-left block text-center"
            >
              👁️ Test Student View
            </a>
          </div>
        </div>

        {/* Recent Activity (Placeholder) */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Student Interactions</h2>
          <div className="text-center py-8 text-gray-500">
            <p>Analytics and chat logs will appear here once students start using the AI assistant.</p>
          </div>
        </div>
      </div>

      {isApiKeyModalOpen && (
        <Modal title="Update OpenAI API Key" onClose={() => setApiKeyModalOpen(false)}>
          <ApiKeyForm course={course} isModal={true} onClose={() => setApiKeyModalOpen(false)} />
        </Modal>
      )}

      {isInstructionsModalOpen && (
        <Modal title="Edit System Instructions" onClose={() => setInstructionsModalOpen(false)}>
          <SystemInstructionsForm course={course} isModal={true} onClose={() => setInstructionsModalOpen(false)} />
        </Modal>
      )}
    </>
  );
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50" 
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)' }}
      onClick={onClose}
    >
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 cursor-pointer text-2xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ApiKeyForm({ course, isModal = false, onClose }: { course: Course, isModal?: boolean, onClose?: () => void }) {
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await fetch('/api/dashboard/setup', { method: 'POST', body: formData });
    router.refresh();
    onClose?.();
  };

  return (
    <div className={!isModal ? "border border-gray-200 rounded-lg p-6" : ""}>
      {!isModal && <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 1: Configure OpenAI API Key</h3>}
      <p className="text-gray-600 mb-4">
        You&apos;ll need an OpenAI API key to power your AI assistant. 
        <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline ml-1">Get one here</a>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="action" value="api_key" />
        <div>
          <label htmlFor="api_key" className="block text-sm font-medium text-gray-700 mb-2">OpenAI API Key</label>
          <input
            type="password"
            id="api_key"
            name="api_key"
            placeholder="sk-..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
            required
          />
          {course.openai_api_key && !isModal && <p className="text-sm text-green-600 mt-1">✅ API key configured</p>}
        </div>
        <div className="flex justify-end space-x-3">
          {isModal && <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium cursor-pointer">Cancel</button>}
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium cursor-pointer">
            {isModal ? 'Update API Key' : (course.openai_api_key ? 'API Key Saved' : 'Save API Key')}
          </button>
        </div>
      </form>
    </div>
  );
}

function SystemInstructionsForm({ course, isModal = false, onClose }: { course: Course, isModal?: boolean, onClose?: () => void }) {
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await fetch('/api/dashboard/setup', { method: 'POST', body: formData });
    router.refresh();
    onClose?.();
  };

  const isApiKeySet = !!course.openai_api_key;

  return (
    <div className={!isModal ? `border rounded-lg p-6 ${isApiKeySet ? 'border-green-200 bg-green-50' : 'border-gray-200'}` : ""}>
      {!isModal && <h3 className="text-lg font-semibold text-gray-900 mb-3">Step 2: Customize Your AI Assistant</h3>}
      <p className="text-gray-600 mb-4">Define how your AI assistant should behave and what it should know about your course.</p>
      {!isApiKeySet && !isModal && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-4">
          <p className="text-amber-800 text-sm">⚠️ Complete Step 1 first to configure your AI assistant instructions.</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="action" value="system_instructions" />
        <div>
          <label htmlFor="system_instructions" className="block text-sm font-medium text-gray-700 mb-2">System Instructions</label>
          <textarea
            id="system_instructions"
            name="system_instructions"
            rows={8}
            placeholder="You are a helpful teaching assistant..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder:text-gray-400"
            defaultValue={course.system_instructions || ``}
            disabled={!isApiKeySet && !isModal}
          />
        </div>
        <div className="flex justify-end space-x-3">
           {isModal && <button type="button" onClick={onClose} className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md font-medium cursor-pointer">Cancel</button>}
          <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            disabled={!isApiKeySet && !isModal}
          >
            {isModal ? 'Update Instructions' : (course.system_instructions ? 'Update Instructions' : 'Save & Activate')}
          </button>
        </div>
      </form>
    </div>
  );
}