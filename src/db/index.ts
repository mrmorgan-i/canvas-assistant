import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schema } from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Create postgres client
const client = postgres(process.env.DATABASE_URL, {
  max: 1,
});

// Create drizzle database instance
export const db = drizzle(client, { schema });

// Export types
export type DB = typeof db;

// Helper function to close connection (useful for serverless)
export const closeConnection = () => client.end(); 