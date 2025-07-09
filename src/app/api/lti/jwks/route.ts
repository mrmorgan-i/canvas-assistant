import { NextResponse } from "next/server";
import { generateJWKS } from "@/lib/lti";

export async function GET() {
  try {
    const jwks = await generateJWKS();
    
    return NextResponse.json(jwks, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("JWKS generation error:", error);
    
    // Return empty keys set if key generation fails
    return NextResponse.json(
      { keys: [] },
      { 
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
} 