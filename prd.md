# Canvas AI Assistant - Product Requirements Document

## Project Overview

**Project Name:** Canvas AI Assistant  
**Version:** 1.0 MVP  
**Type:** Canvas LTI 1.3 Application  
**Framework:** Next.js 15.3.5 with TypeScript  
**Target:** Open-source for educational institutions  
**Developer:** Newman University (starting institution)

## Vision Statement

Enable professors to share custom AI assistants (similar to ChatGPT's Custom GPTs) directly within Canvas LMS, allowing students to access AI assistance without leaving their learning environment or requiring paid ChatGPT subscriptions.

## Problem Statement

- Professors create valuable Custom GPTs in ChatGPT but can't share them with students on free accounts
- Students must leave Canvas to access AI assistance on external platforms
- No way to provide course-specific AI assistance within the LMS environment
- Lack of usage analytics for educational AI interactions

## Core User Flow

### 1. Initial Setup (Canvas Admin)
- Install LTI 1.3 app in Canvas instance
- Configure developer API keys and redirect URLs
- Enable app for specific courses upon professor request

### 2. Professor Configuration
- Access app for first time (triggers setup wizard)
- Input OpenAI API key
- Configure system instructions for the AI assistant
- Upload optional reference files
- Test the assistant configuration
- Publish to students (app appears in course navigation)

### 3. Student Interaction
- See "AI Assistant" in Canvas course side navigation
- Click to open chat interface within Canvas
- Send messages to AI assistant
- Receive responses based on professor's configuration
- Continue conversations with chat history preserved

### 4. Professor Monitoring
- View usage dashboard with student interaction metrics
- Access chat transcripts for evaluation
- Switch to "student view" to test the assistant
- Modify configuration as needed

## Technical Requirements

### Canvas Integration
- **LTI 1.3 Compliance:** Full specification implementation
- **Deep Linking:** Integration with Canvas course navigation
- **Canvas API:** Course and user data access
- **Security:** JWT validation, role-based access control

### Core Features
- **OpenAI Integration:** API key management, streaming responses
- **File Storage:** Support for professor-uploaded reference materials
- **Chat System:** Real-time messaging with conversation history
- **Configuration Management:** System instructions and settings
- **Analytics Dashboard:** Usage metrics and transcript access

### Technical Stack
- **Frontend:** Next.js 15.3.5, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** PostgreSQL with Drizzle ORM
- **External APIs:** OpenAI API, Canvas LTI/API
- **Deployment:** Vercel/Railway (development), cloud provider (production)

## Database Schema

```sql
-- Users (Canvas users who access the app)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canvas_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL, -- 'instructor', 'student'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course configurations (one per course)
CREATE TABLE course_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id VARCHAR(255) UNIQUE NOT NULL,
    instructor_id UUID REFERENCES users(id),
    openai_api_key_encrypted TEXT NOT NULL,
    system_instructions TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reference files uploaded by instructors
CREATE TABLE reference_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_config_id UUID REFERENCES course_configs(id),
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat sessions and messages
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    course_id VARCHAR(255) NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage analytics
CREATE TABLE usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    course_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'message_sent', 'session_started'
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### LTI Integration
- `POST /api/lti/login` - OIDC login initiation
- `POST /api/lti/launch` - LTI launch handling  
- `GET /api/lti/jwks` - JSON Web Key Set
- `POST /api/lti/deep-linking` - Deep linking response

### Core Functionality
- `GET /api/config/:courseId` - Get course configuration
- `POST /api/config/:courseId` - Save course configuration
- `POST /api/chat/:courseId` - Send chat message
- `GET /api/chat/:courseId/history` - Get chat history
- `POST /api/files/:courseId` - Upload reference files
- `GET /api/analytics/:courseId` - Get usage analytics

## User Interface Requirements

### Professor Setup Wizard
- Welcome screen with project explanation
- OpenAI API key input with validation
- System instructions text area with preview
- File upload interface for reference materials
- Configuration test interface
- Activation confirmation

### Professor Dashboard
- Usage metrics (daily/weekly active users, message counts)
- Top students by engagement
- Recent chat transcript access
- Configuration management panel
- "Switch to Student View" toggle

### Student Chat Interface
- Clean, simple chat interface within Canvas iframe
- Message input with send button
- Streaming response display
- Chat history preservation within session
- Loading states and error handling

## Development Phases

### Phase 1: Core LTI Integration (Weeks 1-2)
- [ ] LTI 1.3 authentication and launch
- [ ] Canvas API integration
- [ ] Basic database schema
- [ ] User role management

### Phase 2: Configuration System (Week 3)
- [ ] Professor setup wizard
- [ ] OpenAI API key encryption and storage
- [ ] System instructions management
- [ ] Configuration testing interface

### Phase 3: Chat Interface (Week 4)
- [ ] Student chat UI within Canvas
- [ ] OpenAI API integration with streaming
- [ ] Message history persistence
- [ ] Context management (system instructions + history)

### Phase 4: File Storage & Analytics (Week 5)
- [ ] Reference file upload and storage
- [ ] Basic usage analytics
- [ ] Professor dashboard
- [ ] Student view toggle for professors

### Phase 5: Polish & Testing (Week 6)
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] Security review
- [ ] Documentation for deployment

## Security Considerations

- **API Key Protection:** Encrypt OpenAI API keys at rest
- **Canvas Integration:** Validate all LTI launches and JWT tokens
- **Access Control:** Ensure students only access their course's assistant
- **Data Privacy:** Secure chat transcript storage
- **Input Validation:** Sanitize all user inputs

## Success Metrics

- **Setup Completion:** 80% of professors complete initial setup
- **Student Adoption:** 50% of course students use the assistant
- **Performance:** < 2 second response times for chat messages
- **Reliability:** 99% uptime during business hours

## Open Source Considerations

- **MIT License** for broad adoption
- **Documentation:** Comprehensive setup guide for other institutions
- **Environment Variables:** All sensitive config externalized
- **Docker Support:** Containerized deployment option
- **Canvas Compatibility:** Support for standard Canvas cloud instances

## Risks & Mitigations

**High Risk:**
- LTI 1.3 complexity → Start with thorough Canvas LTI documentation
- OpenAI API costs → Implement usage monitoring and limits

**Medium Risk:**  
- File storage costs → Start with basic file support, optimize later
- Canvas API changes → Use stable API endpoints, monitor deprecations

**Low Risk:**
- User adoption → Focus on simple, intuitive interface
- Performance → Start simple, optimize based on usage patterns

---

This focused approach eliminates unnecessary complexity while delivering the core value proposition: enabling professors to share AI assistants with students directly within Canvas. 