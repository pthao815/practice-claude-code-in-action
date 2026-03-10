# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # Install deps + generate Prisma client + run migrations
npm run dev            # Start dev server (Next.js with Turbopack)
npm run build          # Production build
npm run test           # Run all tests (Vitest)
npx vitest run <file>  # Run a single test file
npm run db:reset       # Reset database (drops all data)
npx prisma studio      # Open Prisma GUI to inspect DB
```

### Running the Development Server

```bash
npm run dev
```

- Starts Next.js on **http://localhost:3000** with Turbopack for fast hot reload.
- Requires `ANTHROPIC_API_KEY` in `.env` for real AI responses. If missing, the app uses a `MockLanguageModel` returning hardcoded demo components.
- The script loads `node-compat.cjs` via `NODE_OPTIONS` to polyfill Node.js globals — **do not remove this**.

To run in the background and write logs to `logs.txt`:

```bash
npm run dev:daemon
```

First-time setup before running the server:

```bash
npm run setup   # installs deps, generates Prisma client, runs DB migrations
cp .env .env.local
# then set ANTHROPIC_API_KEY in .env
```

## Environment

- Copy `.env` to `.env.local` and set `ANTHROPIC_API_KEY` for real AI responses.
- If `ANTHROPIC_API_KEY` is empty/missing, the app falls back to a `MockLanguageModel` that returns hardcoded demo components — useful for UI work without API costs.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in chat; Claude generates them in real-time via tool calls that operate on an in-memory virtual file system. The result renders live in an iframe preview.

### Core Data Flow

```
User prompt → ChatProvider (useChat) → POST /api/chat
  → Claude API with tools (str_replace_editor, file_manager)
  → Tool calls stream back to client
  → FileSystemProvider applies tool calls to VirtualFileSystem
  → PreviewFrame re-renders (Babel transforms JSX → iframe HTML)
  → On finish: project saved to SQLite via Prisma
```

### Key Abstractions

**VirtualFileSystem** (`src/lib/file-system.ts`): In-memory file store. Serialized as JSON and sent with every `/api/chat` request so the server can reconstruct state. No disk writes.

**AI Tools** (`src/lib/tools/`): Two Zod-validated tools Claude calls:
- `str_replace_editor` — create or patch file contents
- `file_manager` — rename or delete files

**Contexts** (`src/lib/contexts/`):
- `FileSystemProvider` — owns `VirtualFileSystem` state, applies tool calls
- `ChatProvider` — wraps Vercel AI SDK `useChat()`, syncs file system state to chat

**Preview** (`src/components/preview/PreviewFrame.tsx`): Uses Babel standalone (`jsx-transformer.ts`) to compile JSX and build an import map, then renders into a sandboxed iframe.

**Auth** (`src/lib/auth.ts`, `src/actions/index.ts`): JWT sessions in httpOnly cookies (jose + bcrypt). Middleware at `src/middleware.ts` protects API routes.

### Tech Stack

- **Next.js 15** (App Router) + **React 19**
- **Vercel AI SDK** (`ai` + `@ai-sdk/anthropic`) for streaming tool-use
- **Prisma** + **SQLite** (`prisma/dev.db`) — models: `User`, `Project`
- **Tailwind CSS v4**, Radix UI primitives, shadcn/ui components
- **Monaco Editor** for code view, React Resizable Panels for layout
- **Vitest** + Testing Library for tests

### Database Schema

```
User    id, email, password (bcrypt), createdAt, updatedAt
Project id, name, userId (FK), messages (JSON), data (JSON), createdAt, updatedAt
```

`messages` stores the full chat history; `data` stores the serialized `VirtualFileSystem`.

### Path Alias

`@/*` maps to `./src/*` (defined in `tsconfig.json`).
