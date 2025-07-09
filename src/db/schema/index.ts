// Export all tables
export * from "./professors.schema";
export * from "./courses.schema";
export * from "./chat_sessions.schema";
export * from "./sessions.schema";

// Export all relations
export * from "./relations";

// Import for database initialization
import { professors } from "./professors.schema";
import { courses } from "./courses.schema";
import { chat_sessions } from "./chat_sessions.schema";
import { sessions } from "./sessions.schema";
import { 
  professorsRelations, 
  coursesRelations 
} from "./relations";
import { chatSessionsRelations } from "./chat_sessions.schema";

// Export schema object for drizzle
export const schema = {
  professors,
  courses,
  chat_sessions,
  sessions,
  professorsRelations,
  coursesRelations,
  chatSessionsRelations,
}; 