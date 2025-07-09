# Canvas AI Assistant

A Canvas LTI 1.3 application that enables professors to share custom AI assistants (like ChatGPT's Custom GPTs) directly within Canvas, allowing students to access AI assistance without leaving their learning environment.

## Features

- 🎓 **Canvas LTI 1.3 Integration** - Seamless integration with Canvas LMS
- 🤖 **Custom AI Assistants** - Professors can configure OpenAI models with custom instructions
- 💬 **In-Canvas Chat** - Students chat with AI without leaving Canvas
- 📊 **Usage Analytics** - Dashboard showing student engagement and chat metrics
- 🔒 **Secure Authentication** - Full LTI 1.3 OIDC compliance
- 📁 **File Support** - Upload reference materials for AI context
- 🎨 **Modern UI** - Clean, responsive interface built with Next.js and Tailwind

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Canvas LMS instance (local or hosted)
- OpenAI API access

### 1. Installation

```bash
git clone <your-repo-url>
cd canvaslti
npm install
```

### 2. Generate LTI Keys

```bash
npm run generate-keys
```

Copy the generated environment variables to your `.env.local` file.

### 3. Generate Encryption Secret

```bash
npm run generate-encryption-secret
```

Copy the generated `ENCRYPTION_SECRET` to your `.env.local` file. This is used to encrypt OpenAI API keys in the database.

### 4. Environment Setup

Create `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/canvas_assistant"

# Canvas LTI Configuration
LTI_ISSUER="https://canvas.instructure.com"
LTI_CLIENT_ID="your_canvas_developer_key_client_id"
LTI_KEY_SET_URL="https://canvas.instructure.com/api/lti/security/jwks"

# LTI Endpoints
LTI_LOGIN_URL="http://localhost:3000/api/lti/login"
LTI_LAUNCH_URL="http://localhost:3000/api/lti/launch"
LTI_JWKS_URL="http://localhost:3000/api/lti/jwks"

# App Configuration
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Encryption (for API key security)
ENCRYPTION_SECRET="your-64-character-encryption-secret-here"

# LTI JWT Keys (generated from step 2)
LTI_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
LTI_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
LTI_KID="unique-key-id"
```

### 5. Database Setup

```bash
# Generate migration
npm run db:generate

# Run migration (requires DATABASE_URL to be set)
npm run db:migrate
```

### 6. Development Server

```bash
npm run dev
```

Your app will be available at `http://localhost:3000`

## Canvas Developer Key Configuration

### 1. Create Developer Key

In your Canvas admin panel, go to:
**Admin** → **Developer Keys** → **+ Developer Key** → **+ LTI Key**

### 2. Configure Settings

**Key Settings:**
- **Key Name:** Canvas AI Assistant
- **Owner Email:** your-email@domain.com
- **Redirect URIs:** 
  ```
  http://localhost:3000/api/lti/launch
  https://yourdomain.com/api/lti/launch
  ```

**Method:** Public JWK URL
**Public JWK URL:** `http://localhost:3000/api/lti/jwks`

**LTI Advantage Services:** (all checked)
- ✅ Can create and view assignment data in the gradebook associated with the tool
- ✅ Can view assignment data in the gradebook associated with the tool
- ✅ Can view submission data for assignments associated with the tool
- ✅ Can create and update submission results for assignments associated with the tool
- ✅ Can retrieve user data associated with the context the tool is installed in
- ✅ Can lookup Account information
- ✅ Can lookup user information

**Additional Settings:**
- **Title:** Canvas AI Assistant
- **Description:** Custom AI assistant for course-specific help
- **Target Link URI:** `http://localhost:3000/api/lti/launch`
- **OpenID Connect Initiation Url:** `http://localhost:3000/api/lti/login`

### 3. Placements

Add placements for:
- **Course Navigation** (main placement for professors and students)
- **Assignment Selection** (optional, for future assignment integration)

### 4. Update Environment Variables

After creating the Developer Key, update your `.env.local`:
- `LTI_CLIENT_ID` = The Client ID from your Developer Key

Note: `DEPLOYMENT_ID` is automatically extracted from LTI launch claims and doesn't need to be configured as an environment variable.

## Usage Flow

### For Professors

1. **First Launch**: Professor clicks the app in Canvas course navigation
2. **Setup Wizard**: Configure OpenAI API key, system instructions, and model settings
3. **Dashboard**: View student usage analytics and manage settings
4. **Test Mode**: Switch to student view to test the assistant

### For Students

1. **Access**: Click the AI Assistant in course navigation
2. **Chat Interface**: Send messages and receive AI responses
3. **Context Aware**: AI has access to course-specific instructions and files
4. **Conversation History**: Previous messages in session are maintained

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/
│   │   └── lti/        # LTI endpoints (login, launch, jwks)
│   ├── dashboard/      # Professor dashboard
│   └── chat/           # Student chat interface
├── db/                 # Database layer
│   ├── schema/         # Drizzle schema definitions
│   └── index.ts        # Database connection
├── lib/                # Utilities
│   ├── lti.ts          # LTI 1.3 utilities
│   └── env.ts          # Environment validation
└── components/         # React components
```

## Development Commands

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:generate     # Generate migration from schema
npm run db:migrate      # Apply migrations to database
npm run db:studio       # Open Drizzle Studio

# LTI & Security
npm run generate-keys           # Generate RSA key pair for JWT signing
npm run generate-encryption-secret  # Generate encryption secret for API keys
```

## Security Features

- ✅ **LTI 1.3 OIDC** - Secure authentication flow
- ✅ **JWT Validation** - All tokens verified against Canvas public keys
- ✅ **CSRF Protection** - State parameter validation
- ✅ **Nonce Verification** - Prevents replay attacks
- ✅ **Role-based Access** - Different interfaces for instructors vs students
- ✅ **Secure Cookies** - HttpOnly, Secure, SameSite=None for iframe context

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Update Canvas Developer Key with production URLs
4. Deploy!

### Manual Deployment

1. Build the application: `npm run build`
2. Set up PostgreSQL database
3. Configure environment variables
4. Start the server: `npm run start`

## Troubleshooting

### Common Issues

**"Invalid state parameter"**
- Check that cookies are enabled
- Verify SameSite=None settings for iframe context

**"Authentication failed"**
- Verify LTI_ISSUER matches Canvas domain
- Check JWT key configuration
- Ensure Canvas Developer Key is properly configured

**Database connection errors**
- Verify DATABASE_URL is correct
- Check that database exists and is accessible
- Run migrations: `npm run db:migrate`

### Support

For issues and questions:
1. Check the troubleshooting section above
2. Review Canvas LTI 1.3 documentation
3. Open an issue on GitHub

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

---

**Built with ❤️ for education**
