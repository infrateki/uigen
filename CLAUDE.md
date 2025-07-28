# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Setup and Installation
```bash
npm run setup
```
This command installs dependencies, generates Prisma client, and runs database migrations.

### Development Server
```bash
npm run dev          # Start development server with Turbopack
npm run dev:daemon   # Start server in background, logs to logs.txt
```

### Build and Production
```bash
npm run build        # Build production bundle
npm start           # Start production server
```

### Code Quality
```bash
npm run lint        # Run ESLint
```

### Testing
```bash
npm test            # Run tests with Vitest
```

### Database Operations
```bash
npm run db:reset    # Reset database with --force flag
npx prisma generate # Regenerate Prisma client (after schema changes)
npx prisma migrate dev # Apply pending migrations
```

## Architecture Overview

UIGen is an AI-powered React component generator with these key architectural patterns:

### Core Components
- **Virtual File System**: In-memory file system (`src/lib/file-system.ts`) that doesn't write to disk
- **Chat Interface**: AI-powered component generation using Anthropic Claude via Vercel AI SDK
- **Live Preview**: Real-time rendering of generated components using Monaco Editor and Babel
- **Project Persistence**: SQLite database with Prisma for user projects and file state

### Key Contexts
- **FileSystemContext** (`src/lib/contexts/file-system-context.tsx`): Manages virtual file operations and tool calls
- **ChatContext** (`src/lib/contexts/chat-context.tsx`): Handles AI chat integration and anonymous work tracking

### AI Integration
- Main chat API endpoint: `src/app/api/chat/route.ts`
- Uses custom tools: `str_replace_editor` and `file_manager` for file operations
- System prompt in `src/lib/prompts/generation.tsx`
- Supports both authenticated users and anonymous sessions

### Database Schema
- **User**: Authentication with email/password using bcrypt
- **Project**: Stores chat messages and virtual file system state as JSON
- Prisma client generated to `src/generated/prisma/`

### Authentication
- Custom JWT-based auth in `src/lib/auth.ts`
- Middleware in `src/middleware.ts` handles route protection
- Anonymous users can work without account but data isn't persisted

### File Structure Patterns
- Components in `src/components/` organized by feature (auth, chat, editor, preview, ui)
- Server actions in `src/actions/` for database operations
- Utility libraries in `src/lib/` with comprehensive test coverage
- UI components use Radix UI primitives with Tailwind CSS v4

### Testing Setup
- Vitest with React Testing Library
- JSDOM environment for component testing
- Test files co-located with source files in `__tests__/` directories

## Environment Configuration

The application works without API keys by falling back to mock responses:
- `ANTHROPIC_API_KEY`: Optional, enables actual AI generation
- Without API key: Returns static code instead of AI-generated components

## Development Notes

- Uses Next.js 15 App Router with React 19
- Tailwind CSS v4 with custom configuration
- TypeScript strict mode enabled
- Virtual file system prevents actual file writes during development
- Hot reload works for both code editor and preview pane

## Code Documentation

- Use comments sparingly. Only comment complex code.

## Important References

- The database schema is defined in the @prisma\schema.prisma file. Reference it anytime you need to understand the structure of data stored in the database.

## Configuration Details

- Vitest config is in vitest.config.mts