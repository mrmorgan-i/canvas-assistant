import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq, and, gt, lt, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import crypto from "crypto";

// Session duration: 24 hours
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SESSION_COOKIE_NAME = "lti_session";

/**
 * Generate a cryptographically secure session token
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create a new session in the database
 */
export async function createSession(params: {
  ltiUserId: string;
  canvasUserId: string;
  canvasCourseId: string;
  userName?: string;
  userEmail?: string;
  userRoles: string[];
  courseName: string;
  deploymentId: string;
  userAgent?: string;
  ipAddress?: string;
}): Promise<string> {
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await db.insert(sessions).values({
    session_token: sessionToken,
    lti_user_id: params.ltiUserId,
    canvas_user_id: params.canvasUserId,
    canvas_course_id: params.canvasCourseId,
    user_name: params.userName,
    user_email: params.userEmail,
    user_roles: params.userRoles,
    course_name: params.courseName,
    deployment_id: params.deploymentId,
    user_agent: params.userAgent,
    ip_address: params.ipAddress,
    expires_at: expiresAt,
  });

  console.log(`✅ Created session for user ${params.ltiUserId}, expires at ${expiresAt.toISOString()}`);
  
  return sessionToken;
}

/**
 * Find existing valid session or create new one (prevents duplicate sessions)
 */
export async function findOrCreateSession(params: {
  ltiUserId: string;
  canvasUserId: string;
  canvasCourseId: string;
  userName?: string;
  userEmail?: string;
  userRoles: string[];
  courseName: string;
  deploymentId: string;
  userAgent?: string;
  ipAddress?: string;
}): Promise<string> {
  // First, try to find an existing valid session for this user and course
  const existingSession = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.lti_user_id, params.ltiUserId),
      eq(sessions.canvas_course_id, params.canvasCourseId),
      eq(sessions.is_active, true),
      gt(sessions.expires_at, new Date()) // Not expired
    ),
    orderBy: [desc(sessions.created_at)] // Get most recent
  });

  if (existingSession) {
    // Extend the existing session and update activity
    await extendSession(existingSession.session_token);
    console.log(`🔄 Reusing existing session for user ${params.ltiUserId}: ${existingSession.session_token.substring(0, 8)}...`);
    return existingSession.session_token;
  }

  // No valid session found, create a new one
  console.log(`🆕 Creating new session for user ${params.ltiUserId}`);
  return await createSession(params);
}

/**
 * Get session data by session token
 */
export async function getSession(sessionToken: string) {
  if (!sessionToken) {
    return null;
  }

  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.session_token, sessionToken),
      eq(sessions.is_active, true),
      gt(sessions.expires_at, new Date()) // expires_at > now (not expired)
    )
  });

  if (session) {
    // Update last activity
    await db.update(sessions)
      .set({ last_activity: new Date() })
      .where(eq(sessions.session_token, sessionToken));
  }

  return session;
}

/**
 * Get session from request cookies
 */
export async function getSessionFromRequest(request?: NextRequest) {
  let sessionToken: string | undefined;

  if (request) {
    // Server-side API route
    sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  } else {
    // Server component
    const cookieStore = await cookies();
    sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  }

  if (!sessionToken) {
    return null;
  }

  return await getSession(sessionToken);
}

/**
 * Invalidate a session
 */
export async function invalidateSession(sessionToken: string): Promise<void> {
  await db.update(sessions)
    .set({ 
      is_active: false,
      last_activity: new Date()
    })
    .where(eq(sessions.session_token, sessionToken));

  console.log(`✅ Invalidated session ${sessionToken}`);
}

/**
 * Clean up expired sessions (call this periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const now = new Date();
  const result = await db.update(sessions)
    .set({ is_active: false })
    .where(and(
      eq(sessions.is_active, true),
      lt(sessions.expires_at, now) // expires_at < now (expired)
    ));

  console.log(`✅ Cleaned up expired sessions`);
  return result.length || 0;
}

/**
 * Extend session expiration
 */
export async function extendSession(sessionToken: string): Promise<void> {
  const newExpiresAt = new Date(Date.now() + SESSION_DURATION);
  
  await db.update(sessions)
    .set({ 
      expires_at: newExpiresAt,
      last_activity: new Date()
    })
    .where(eq(sessions.session_token, sessionToken));

  console.log(`✅ Extended session ${sessionToken} until ${newExpiresAt.toISOString()}`);
}

/**
 * Create session cookie options
 */
export function getSessionCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "none" | "lax";
  maxAge: number;
  path: string;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
    path: "/",
  };
}

/**
 * Get user roles from session
 */
export function getUserRoles(session: { user_roles?: string[] | null } | null): string[] {
  return session?.user_roles || [];
}

/**
 * Check if session user is instructor
 */
export function isInstructorSession(session: { user_roles?: string[] | null } | null): boolean {
  const roles = getUserRoles(session);
  return roles.some(role => 
    role.includes("Instructor") || 
    role.includes("TeachingAssistant")
  );
}

/**
 * Check if session user is learner
 */
export function isLearnerSession(session: { user_roles?: string[] | null } | null): boolean {
  const roles = getUserRoles(session);
  return roles.some(role => 
    role.includes("Learner")
  );
} 