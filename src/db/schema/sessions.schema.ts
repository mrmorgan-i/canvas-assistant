import { 
  pgTable, 
  text, 
  timestamp, 
  boolean,
  uuid
} from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  
  // Session identification
  session_token: text("session_token").notNull().unique(), // httpOnly cookie value
  
  // LTI session data
  lti_user_id: text("lti_user_id").notNull(),
  canvas_user_id: text("canvas_user_id").notNull(),
  canvas_course_id: text("canvas_course_id").notNull(),
  
  // User info from LTI claims
  user_name: text("user_name"),
  user_email: text("user_email"),
  user_roles: text("user_roles").array(), // JSON array of LTI roles
  
  // Course info from LTI claims  
  course_name: text("course_name"),
  deployment_id: text("deployment_id"),
  
  // Session metadata
  user_agent: text("user_agent"),
  ip_address: text("ip_address"),
  
  // Session state
  is_active: boolean("is_active").default(true),
  last_activity: timestamp("last_activity").defaultNow(),
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
  expires_at: timestamp("expires_at").notNull(),
}); 