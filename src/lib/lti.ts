import * as jose from "jose";
import { env } from "./env";

// LTI 1.3 Claims
export interface LTIClaims {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  nonce: string;
  "https://purl.imsglobal.org/spec/lti/claim/message_type": string;
  "https://purl.imsglobal.org/spec/lti/claim/version": string;
  "https://purl.imsglobal.org/spec/lti/claim/deployment_id": string;
  "https://purl.imsglobal.org/spec/lti/claim/target_link_uri": string;
  "https://purl.imsglobal.org/spec/lti/claim/resource_link": {
    id: string;
    title?: string;
    description?: string;
  };
  "https://purl.imsglobal.org/spec/lti/claim/context": {
    id: string;
    title: string;
    type: string[];
  };
  "https://purl.imsglobal.org/spec/lti/claim/tool_platform": {
    name: string;
    version: string;
    product_family_code: string;
  };
  "https://purl.imsglobal.org/spec/lti/claim/launch_presentation": {
    document_target: string;
    return_url?: string;
  };
  "https://purl.imsglobal.org/spec/lti/claim/custom"?: Record<string, string>;
  name?: string;
  email?: string;
  picture?: string;
  "https://purl.imsglobal.org/spec/lti/claim/roles": string[];
}

// LTI Message Types
export const LTI_MESSAGE_TYPES = {
  RESOURCE_LINK_REQUEST: "LtiResourceLinkRequest",
  DEEP_LINKING_REQUEST: "LtiDeepLinkingRequest",
  DEEP_LINKING_RESPONSE: "LtiDeepLinkingResponse",
} as const;

// LTI Roles
export const LTI_ROLES = {
  INSTRUCTOR: "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor",
  LEARNER: "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner",
  TEACHING_ASSISTANT: "http://purl.imsglobal.org/vocab/lis/v2/membership#TeachingAssistant",
} as const;

/**
 * Generate LTI login redirect URL
 */
export function generateLTILoginURL(params: {
  iss: string;
  login_hint: string;
  target_link_uri: string;
  lti_message_hint?: string;
  client_id?: string;
}): string {
  const { iss, login_hint, target_link_uri, lti_message_hint, client_id } = params;
  
  const loginParams = new URLSearchParams({
    iss,
    login_hint,
    target_link_uri,
    client_id: client_id || env.LTI_CLIENT_ID || "",
  });

  if (lti_message_hint) {
    loginParams.append("lti_message_hint", lti_message_hint);
  }

  return `${env.LTI_LOGIN_URL}?${loginParams.toString()}`;
}

/**
 * Development-only: Manual JWT verification for smaller keys
 */
async function validateLTITokenDev(token: string): Promise<LTIClaims> {
  console.log("🔧 Using development JWT validation for smaller keys");
  
  try {
    // For development, we'll do basic validation without strict key size checks
    const decoded = jose.decodeJwt(token);
    const header = jose.decodeProtectedHeader(token);
    
    console.log("JWT Header:", header);
    console.log("JWT Payload:", decoded);
    
    // Basic validation checks
    if (decoded.iss !== env.LTI_ISSUER) {
      throw new Error(`Invalid issuer. Expected: ${env.LTI_ISSUER}, Got: ${decoded.iss}`);
    }
    
    if (decoded.aud !== env.LTI_CLIENT_ID) {
      throw new Error(`Invalid audience. Expected: ${env.LTI_CLIENT_ID}, Got: ${decoded.aud}`);
    }
    
    // Check expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      throw new Error("Token has expired");
    }
    
    console.log("✅ Development JWT validation passed (without signature verification)");
    return decoded as unknown as LTIClaims;
    
  } catch (error) {
    console.error("Development JWT validation failed:", error);
    throw error;
  }
}

/**
 * Validate and decode LTI JWT token
 */
export async function validateLTIToken(token: string): Promise<LTIClaims> {
  try {
    // Get Canvas public keys with more lenient options for development
    const keySet = await jose.createRemoteJWKSet(
      new URL(env.LTI_KEY_SET_URL),
      {
        // Allow smaller keys for local development Canvas instances
        cooldownDuration: 30000,
        cacheMaxAge: 600000,
      }
    );
    
    // Verify and decode the JWT with additional options
    const { payload } = await jose.jwtVerify(token, keySet, {
      issuer: env.LTI_ISSUER,
      audience: env.LTI_CLIENT_ID,
      // More lenient options for development
      clockTolerance: 30, // Allow 30 seconds clock skew
    });

    return payload as unknown as LTIClaims;
  } catch (error) {
    console.error("LTI token validation failed:", error);
    
    // In development, log more details for debugging
    if (process.env.NODE_ENV === "development") {
      console.log("Token details for debugging:");
      try {
        const decoded = jose.decodeJwt(token);
        console.log("Decoded JWT headers:", jose.decodeProtectedHeader(token));
        console.log("Decoded JWT payload:", decoded);
      } catch (decodeError) {
        console.log("Could not decode token for debugging:", decodeError);
      }
      
      // If it's a key size error and we're in development, try manual validation
      if (error instanceof Error && error.message.includes("modulusLength")) {
        console.log("🔧 Detected small key size - falling back to development validation");
        return await validateLTITokenDev(token);
      }
    }
    
    throw new Error("Invalid LTI token");
  }
}

/**
 * Check if user has instructor role
 */
export function isInstructor(claims: LTIClaims): boolean {
  const roles = claims["https://purl.imsglobal.org/spec/lti/claim/roles"] || [];
  return roles.some(role => 
    role.includes("Instructor") || 
    role.includes("TeachingAssistant") ||
    role === LTI_ROLES.INSTRUCTOR ||
    role === LTI_ROLES.TEACHING_ASSISTANT
  );
}

/**
 * Check if user has learner role
 */
export function isLearner(claims: LTIClaims): boolean {
  const roles = claims["https://purl.imsglobal.org/spec/lti/claim/roles"] || [];
  return roles.some(role => 
    role.includes("Learner") || 
    role === LTI_ROLES.LEARNER
  );
}

/**
 * Extract course information from LTI claims
 */
export function extractCourseInfo(claims: LTIClaims) {
  const context = claims["https://purl.imsglobal.org/spec/lti/claim/context"];
  const deployment_id = claims["https://purl.imsglobal.org/spec/lti/claim/deployment_id"];
  
  return {
    canvas_course_id: context.id,
    course_name: context.title,
    deployment_id,
    course_type: context.type,
  };
}

/**
 * Extract user information from LTI claims
 */
export function extractUserInfo(claims: LTIClaims) {
  // Cast to unknown first, then to Record for accessing dynamic LTI claim fields
  const claimsAny = claims as unknown as Record<string, unknown>;
  
  // Try multiple possible sources for user name and email
  const possibleNames = [
    claims.name,
    claimsAny["given_name"] && claimsAny["family_name"] ? 
      claimsAny["given_name"] + " " + claimsAny["family_name"] : null,
    (claimsAny["https://purl.imsglobal.org/spec/lti/claim/lis"] as Record<string, unknown>)?.["person_name_full"],
    claims["https://purl.imsglobal.org/spec/lti/claim/custom"]?.["person_name_full"],
    claimsAny["given_name"],
    claimsAny["family_name"],
  ].filter(Boolean);

  const possibleEmails = [
    claims.email,
    (claimsAny["https://purl.imsglobal.org/spec/lti/claim/lis"] as Record<string, unknown>)?.["person_contact_email_primary"],
    claims["https://purl.imsglobal.org/spec/lti/claim/custom"]?.["person_contact_email_primary"],
    claimsAny["person_contact_email_primary"],
  ].filter(Boolean);

  // Note: Local Canvas development may not include user PII
  // In production, these fields will typically be populated

  return {
    lti_user_id: claims.sub,
    canvas_user_id: claims.sub, // In Canvas, sub is the user ID
    name: (possibleNames[0] as string) || "Unknown User",
    email: (possibleEmails[0] as string) || "",
    picture: claims.picture,
    roles: claims["https://purl.imsglobal.org/spec/lti/claim/roles"] || [],
  };
}

/**
 * Generate JWKS for our LTI tool
 */
export async function generateJWKS() {
  if (!env.LTI_PUBLIC_KEY || !env.LTI_KID) {
    throw new Error("LTI public key and key ID are required");
  }

  const publicKey = await jose.importSPKI(env.LTI_PUBLIC_KEY, "RS256");
  const jwk = await jose.exportJWK(publicKey);
  
  return {
    keys: [
      {
        ...jwk,
        kid: env.LTI_KID,
        alg: "RS256",
        use: "sig",
      },
    ],
  };
}

/**
 * Create a deep linking response
 */
export async function createDeepLinkingResponse(params: {
  deployment_id: string;
  deep_link_return_url: string;
  content_items: Array<{
    type: string;
    title: string;
    url: string;
    icon?: {
      url: string;
      width?: number;
      height?: number;
    };
  }>;
}) {
  if (!env.LTI_PRIVATE_KEY || !env.LTI_KID || !env.LTI_CLIENT_ID) {
    throw new Error("LTI private key, key ID, and client ID are required for deep linking");
  }

  const privateKey = await jose.importPKCS8(env.LTI_PRIVATE_KEY, "RS256");
  
  const payload = {
    iss: env.LTI_CLIENT_ID,
    aud: env.LTI_ISSUER,
    exp: Math.floor(Date.now() / 1000) + 600, // 10 minutes
    iat: Math.floor(Date.now() / 1000),
    nonce: crypto.randomUUID(),
    "https://purl.imsglobal.org/spec/lti/claim/message_type": LTI_MESSAGE_TYPES.DEEP_LINKING_RESPONSE,
    "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
    "https://purl.imsglobal.org/spec/lti/claim/deployment_id": params.deployment_id,
    "https://purl.imsglobal.org/spec/lti-dl/claim/content_items": params.content_items,
  };

  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "RS256", kid: env.LTI_KID })
    .sign(privateKey);

  return jwt;
} 