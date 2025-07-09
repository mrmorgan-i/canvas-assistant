import { NextRequest, NextResponse } from "next/server";
// LTI login utilities (not needed for current implementation)
import { env } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // DEBUG: Log all parameters received
    console.log("=== LTI LOGIN DEBUG (GET) ===");
    console.log("URL:", request.url);
    console.log("All search params:", Object.fromEntries(searchParams.entries()));
    console.log("Headers:", Object.fromEntries(request.headers.entries()));
    
    // Extract required OIDC parameters
    const iss = searchParams.get("iss");
    const login_hint = searchParams.get("login_hint");
    const target_link_uri = searchParams.get("target_link_uri");
    const lti_message_hint = searchParams.get("lti_message_hint");
    const client_id = searchParams.get("client_id");

    console.log("Extracted params:", { iss, login_hint, target_link_uri, lti_message_hint, client_id });
    
    return handleLogin({ iss, login_hint, target_link_uri, lti_message_hint, client_id });
  } catch (error) {
    console.error("LTI login error (GET):", error);
    return NextResponse.json(
      { error: "Internal server error during LTI login" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // DEBUG: Log all information about the POST request
    console.log("=== LTI LOGIN DEBUG (POST) ===");
    console.log("URL:", request.url);
    console.log("Headers:", Object.fromEntries(request.headers.entries()));
    console.log("Content-Type:", request.headers.get("content-type"));
    
    // Try to get parameters from both query string and form data
    const searchParams = request.nextUrl.searchParams;
    console.log("Search params:", Object.fromEntries(searchParams.entries()));
    
    let formData: FormData | null = null;
    let formParams: Record<string, string> = {};
    
    try {
      const contentType = request.headers.get("content-type");
      if (contentType?.includes("application/x-www-form-urlencoded")) {
        formData = await request.formData();
        formParams = Object.fromEntries(formData.entries()) as Record<string, string>;
        console.log("Form data:", formParams);
      } else if (contentType?.includes("application/json")) {
        const jsonData = await request.json();
        console.log("JSON data:", jsonData);
        formParams = jsonData;
      } else {
        console.log("Unknown content type, trying to read as text...");
        const body = await request.text();
        console.log("Raw body:", body);
      }
    } catch (e) {
      console.log("Error reading request body:", e);
    }
    
    // Extract OIDC parameters from either source
    const iss = searchParams.get("iss") || formParams.iss;
    const login_hint = searchParams.get("login_hint") || formParams.login_hint;
    const target_link_uri = searchParams.get("target_link_uri") || formParams.target_link_uri;
    const lti_message_hint = searchParams.get("lti_message_hint") || formParams.lti_message_hint;
    const client_id = searchParams.get("client_id") || formParams.client_id;

    console.log("Final extracted params:", { iss, login_hint, target_link_uri, lti_message_hint, client_id });
    
    return handleLogin({ iss, login_hint, target_link_uri, lti_message_hint, client_id });
  } catch (error) {
    console.error("LTI login error (POST):", error);
    return NextResponse.json(
      { error: "Internal server error during LTI login" },
      { status: 500 }
    );
  }
}

async function handleLogin(
  params: {
    iss: string | null;
    login_hint: string | null;
    target_link_uri: string | null;
    lti_message_hint: string | null;
    client_id: string | null;
  }
) {
  const { iss, login_hint, target_link_uri, lti_message_hint, client_id } = params;
  
  console.log("Environment LTI_ISSUER:", process.env.LTI_ISSUER);
  console.log("Environment LTI_CLIENT_ID:", process.env.LTI_CLIENT_ID);

  // Validate required parameters
  if (!iss || !login_hint || !target_link_uri) {
    console.log("Missing params - iss:", !!iss, "login_hint:", !!login_hint, "target_link_uri:", !!target_link_uri);
    return NextResponse.json(
      { 
        error: "Missing required OIDC parameters",
        received: { iss: !!iss, login_hint: !!login_hint, target_link_uri: !!target_link_uri },
        details: { iss, login_hint, target_link_uri, lti_message_hint, client_id }
      },
      { status: 400 }
    );
  }

  // Validate issuer
  if (iss !== env.LTI_ISSUER) {
    return NextResponse.json(
      { error: "Invalid issuer", expected: env.LTI_ISSUER, received: iss },
      { status: 400 }
    );
  }

  // Generate authorization request
  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();
  
  // Build authorization URL
  const authParams = new URLSearchParams({
    response_type: "id_token",
    scope: "openid",
    client_id: client_id || env.LTI_CLIENT_ID || "",
    redirect_uri: env.LTI_LAUNCH_URL,
    login_hint,
    state,
    nonce,
    response_mode: "form_post",
    prompt: "none",
  });

  if (lti_message_hint) {
    authParams.append("lti_message_hint", lti_message_hint);
  }

  // Canvas authorization endpoint
  const authUrl = `${iss}/api/lti/authorize_redirect?${authParams.toString()}`;
  
  console.log("Redirecting to:", authUrl);
  
  // Store state and nonce in session/cookies for validation
  const response = NextResponse.redirect(authUrl);
  
  console.log("Setting cookies - state:", state, "nonce:", nonce);
  
  // Set cookies with security attributes for iframe context
  response.cookies.set("lti_state", state, {
    httpOnly: true,
    secure: false, // Using HTTP in development
    sameSite: "lax", // Works for same-origin (localhost to localhost)
    maxAge: 600, // 10 minutes
    path: "/",
  });
  
  response.cookies.set("lti_nonce", nonce, {
    httpOnly: true,
    secure: false, // Using HTTP in development
    sameSite: "lax", // Works for same-origin (localhost to localhost)
    maxAge: 600, // 10 minutes
    path: "/",
  });

  console.log("✅ Cookies set, redirecting to Canvas authorization");
  return response;
} 