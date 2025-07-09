import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessions';
import { db } from '@/db';
import { courses } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt, isEncrypted } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  try {
    // Get session to identify the user and course
    const session = await getSessionFromRequest(req);
    
    if (!session) {
      return new Response('Unauthorized - No valid session', { status: 401 });
    }

    console.log(`💬 Chat request from user ${session.lti_user_id} in course ${session.canvas_course_id}`);

    // Get the request body
    const { messages } = await req.json();

    // Find the course configuration with professor info (using relations)
    const whereConditions = [eq(courses.canvas_course_id, session.canvas_course_id)];
    
    // Add deployment_id to query if available
    if (session.deployment_id) {
      whereConditions.push(eq(courses.deployment_id, session.deployment_id));
    }
    
    const course = await db.query.courses.findFirst({
      where: and(...whereConditions),
      with: {
        professor: true
      }
    });
    
    if (!course) {
      return new Response(JSON.stringify({
        error: 'course_not_found',
        message: 'This course has not been set up with an AI assistant yet.'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!course.professor) {
      return new Response(JSON.stringify({
        error: 'professor_not_found',
        message: 'Course professor not found.'
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const professor = course.professor;

    // Check if course has completed setup
    if (!course.openai_api_key || !course.system_instructions) {
      return new Response(JSON.stringify({
        error: 'not_configured',
        message: 'AI assistant not configured. Please ask your professor to complete the setup.'
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`🤖 Using model: ${course.model}, temperature: ${course.temperature}`);
    console.log(`📚 Course: ${course.course_name}`);

    // Decrypt API key if it's encrypted (handles both new encrypted keys and legacy plain text)
    let apiKey: string;
    try {
      if (isEncrypted(course.openai_api_key)) {
        apiKey = decrypt(course.openai_api_key);
        console.log('✅ API key decrypted successfully');
      } else {
        // Legacy support for unencrypted keys (should be re-encrypted on next save)
        apiKey = course.openai_api_key;
        console.log('⚠️ Using legacy unencrypted API key - will be encrypted on next update');
      }
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return new Response(JSON.stringify({
        error: 'decryption_failed',
        message: 'Failed to decrypt API key. Please update your configuration.'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create OpenAI client with decrypted API key
    const openai = createOpenAI({
      apiKey: apiKey,
    });

    // Prepare system message with professor's instructions and course context
    const systemMessage = {
      role: 'system' as const,
      content: `You are an AI assistant for the course "${course.course_name}". 

Course Context:
- Course: ${course.course_name}
- Assistant Name: ${course.assistant_name}
- Professor: ${professor.name}

Professor's Instructions:
${course.system_instructions}

You are embedded within Canvas LMS and helping a student in this course. Be helpful, accurate, and follow the professor's instructions above.`
    };

    // Combine system message with conversation history
    const allMessages = [systemMessage, ...messages];

    console.log(`🔄 Processing ${messages.length} messages with system instructions`);

    // Use Vercel AI SDK to stream the response
    const result = await streamText({
      model: openai(course.model || 'gpt-4'),
      messages: allMessages,
      temperature: parseFloat(course.temperature || '0.7'),
      maxTokens: parseInt(course.max_tokens || '1000'),
    });

    console.log(`✅ Streaming response started`);

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    
    if (error instanceof Error) {
      // Handle specific OpenAI errors
      if (error.message.includes('API key')) {
        return new Response('Invalid OpenAI API key. Please check your configuration.', { status: 400 });
      }
      if (error.message.includes('quota')) {
        return new Response('OpenAI API quota exceeded. Please contact your professor.', { status: 429 });
      }
    }
    
    return new Response('Internal server error', { status: 500 });
  }
} 