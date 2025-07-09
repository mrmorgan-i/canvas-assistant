'use client';

import { useChat } from 'ai/react';
import { useEffect, useState, useRef } from 'react';

interface ChatInterfaceProps {
  courseName: string;
  assistantName: string;
  isInstructor: boolean;
}

// Custom scrollbar styling
const scrollbarStyles = `
  /* Main Chat Area Scrollbar */
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0);
    border-radius: 20px;
    border: 3px solid transparent;
  }
  .custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(156, 163, 175, 0.7);
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
  }

  /* Textarea Scrollbar */
  .textarea-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .textarea-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .textarea-scrollbar::-webkit-scrollbar-thumb {
    background-color: #d1d5db; /* gray-300 */
    border-radius: 6px;
  }
  .textarea-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #9ca3af; /* gray-400 */
  }
  .textarea-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db transparent;
  }
`;

export default function ChatInterface({ courseName, assistantName, isInstructor }: ChatInterfaceProps) {
  const [isClient, setIsClient] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      // Only scroll to bottom if user is already near the bottom (e.g., within 150px)
      if (scrollHeight - scrollTop - clientHeight <= 150) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  }, [messages]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // Reset textarea height when input is cleared
  useEffect(() => {
    if (textareaRef.current && input === '') {
      textareaRef.current.style.height = 'auto';
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, allow new line with Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (e.currentTarget.form) {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        e.currentTarget.form.dispatchEvent(event);
      }
    }
  };



  // Only render on client to avoid hydration issues
  if (!isClient) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading Assistant...</div>
      </div>
    );
  }

     const renderChatInput = () => (
     <div className={`w-full max-w-4xl px-4 ${messages.length > 0 ? 'pt-3 pb-2' : ''}`}>
       <form onSubmit={handleSubmit}>
         <div className="border border-gray-300 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
           <div className="flex flex-col">
             {/* Textarea Section */}
             <div className="flex-1">
               <textarea
                 ref={textareaRef}
                 rows={1}
                 value={input}
                 onChange={handleTextareaChange}
                 onKeyDown={handleKeyDown}
                 placeholder={`Ask me anything about ${courseName}...`}
                 className="w-full px-4 py-3 border-0 rounded-t-2xl focus:outline-none resize-none bg-transparent leading-6 overflow-y-auto max-h-40 text-gray-900 placeholder:text-gray-400"
                 style={{
                   scrollbarWidth: 'none',
                   msOverflowStyle: 'none'
                 }}
                 disabled={isLoading}
               />
               <style jsx>{`
                 textarea::-webkit-scrollbar {
                   width: 0px;
                   background: transparent;
                 }
                 textarea:hover::-webkit-scrollbar {
                   width: 6px;
                 }
                 textarea:hover::-webkit-scrollbar-track {
                   background: #f1f5f9;
                   border-radius: 3px;
                 }
                 textarea:hover::-webkit-scrollbar-thumb {
                   background: #cbd5e1;
                   border-radius: 3px;
                 }
               `}</style>
             </div>
             
             {/* Button Section */}
             <div className="flex justify-end p-2">
               <button
                 type="submit"
                 disabled={isLoading || !input.trim()}
                 className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center w-8 h-8"
               >
                 <svg 
                   width="16" 
                   height="16" 
                   viewBox="0 0 24 24" 
                   fill="none" 
                   stroke="currentColor" 
                   strokeWidth="2" 
                   strokeLinecap="round" 
                   strokeLinejoin="round"
                 >
                   <path d="M12 19V5M5 12l7-7 7 7" />
                 </svg>
               </button>
             </div>
           </div>
         </div>
       </form>
     </div>
   );

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assistantName}</h1>
              <p className="text-gray-600 mt-1">A custom AI assistant for {courseName}</p>
            </div>
            {isInstructor && (
              <a 
                href="/dashboard"
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                ← Dashboard
              </a>
            )}
          </div>
        </div>

        {/* Conditional Layout */}
        {messages.length === 0 && !isLoading ? (
          // Centered layout for when there are no messages
          <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mb-8">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">👋 Welcome!</h2>
              <p className="text-blue-800">
                I&apos;m your AI assistant for {courseName}. Ask me any questions about the material, assignments, or concepts we&apos;re covering.
              </p>
            </div>
            {renderChatInput()}
          </div>
        ) : (
          // Standard chat layout
          <>
            {/* Chat Messages Area */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="max-w-4xl mx-auto space-y-4">
                {/* Error message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">
                      ❌ {error.message.includes('not configured') || error.message.includes('not been set up') 
                          ? "🔧 AI Assistant not configured yet. Please ask your professor to complete the setup."
                          : `Error: ${error.message}`}
                    </p>
                  </div>
                )}

                {/* Chat messages */}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl px-4 py-3 rounded-lg shadow-sm ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="text-sm font-medium mb-1">
                        {message.role === 'user' ? 'You' : assistantName}
                      </div>
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
                      <div className="text-sm font-medium mb-1">{assistantName}</div>
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-gray-600">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Input Area */}
            <div className="flex-shrink-0 flex justify-center border-t border-gray-200">
              {renderChatInput()}
            </div>
          </>
        )}
      </div>
    </>
  );
} 