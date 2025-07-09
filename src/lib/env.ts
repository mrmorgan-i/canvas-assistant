import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // LTI Configuration
  LTI_ISSUER: z.string().min(1, "LTI_ISSUER is required"),
  LTI_CLIENT_ID: z.string().optional(),
  LTI_KEY_SET_URL: z.string().url("LTI_KEY_SET_URL must be a valid URL"),

  // LTI Endpoints
  LTI_LOGIN_URL: z.string().url("LTI_LOGIN_URL must be a valid URL"),
  LTI_LAUNCH_URL: z.string().url("LTI_LAUNCH_URL must be a valid URL"),
  LTI_JWKS_URL: z.string().url("LTI_JWKS_URL must be a valid URL"),

  // OpenAI API
  OPENAI_API_URL: z.string().url("OPENAI_API_URL must be a valid URL").default("https://api.openai.com/v1"),

  // App Configuration
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET is required"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  
  // Encryption
  ENCRYPTION_SECRET: z.string().min(32, "ENCRYPTION_SECRET must be at least 32 characters long"),

  // JWT Keys for LTI
  LTI_PRIVATE_KEY: z.string().optional(),
  LTI_PUBLIC_KEY: z.string().optional(),
  LTI_KID: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function getEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.'));
      throw new Error(
        `Missing or invalid environment variables: ${missingVars.join(', ')}\n` +
        'Please check your .env.local file'
      );
    }
    throw error;
  }
}

export const env = getEnv();
export type Env = z.infer<typeof envSchema>; 