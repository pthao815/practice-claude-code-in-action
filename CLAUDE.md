# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server on localhost:3000 (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all tests (Vitest)
npm run test -- --reporter=verbose <path>  # Run a single test file
npm run db:reset     # Reset the SQLite database
npx prisma migrate dev   # Apply new schema changes
npx prisma generate      # Regenerate Prisma client after schema changes
```

## Environment

Copy `.env.example` to `.env`. `ANTHROPIC_API_KEY` is optional — without it, the app uses a `MockLanguageModel` that returns dummy components. `JWT_SECRET` has a development fallback.

## Architecture

UIGen is an AI-powered React component generator. Users describe a component in chat; Claude generates and edits files in a virtual (in-memory) file system; a live preview renders the result in an iframe.

### Key data flow

1. **Chat → API → AI tools → File system → Preview**
   - `ChatInterface` uses `chat-context.tsx` (wraps Vercel AI SDK `useChat()`)
   - Sends to `POST /api/chat/route.ts` which calls `streamText()` with two tools:
     - `str_replace_editor` — create/overwrite/patch individual files
     - `file_manager` — create directories, delete files/dirs
   - Tool results update the `FileSystemContext` (in-memory virtual FS)
   - `PreviewFrame` watches the FS and re-renders into an iframe using Babel standalone + an import map

2. **Persistence**
   - On stream completion the API route upserts a `Project` row (Prisma/SQLite)
   - `messages` and file system `data` are serialized as JSON strings
   - Anonymous users get a project too; it can be claimed on sign-up

3. **Auth**
   - JWT sessions via `src/lib/auth.ts` — httpOnly cookies, 7-day expiry
   - Server Actions in `src/actions/` handle signUp/signIn/signOut/getUser
   - `src/middleware.ts` protects `/api/projects` and `/api/filesystem`

### Layout

`main-content.tsx` is a `ResizablePanelGroup`:
- **Left (35%):** `ChatInterface`
- **Right (65%):** tabbed between `PreviewFrame` and `FileTree` + `CodeEditor`

### LLM provider

`src/lib/provider.ts` returns `anthropic("claude-haiku-4-5")` when `ANTHROPIC_API_KEY` is set, otherwise a `MockLanguageModel`. The system prompt lives in `src/lib/prompts/generation.tsx` and instructs the AI to always create `/App.jsx` as the entry point and use the `@/` import alias.

### Virtual file system

`src/lib/file-system.ts` is a pure in-memory FS (no disk I/O). `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) exposes it to the component tree and triggers preview refreshes on change.

### Preview rendering

`PreviewFrame.tsx` takes the virtual FS, finds the JSX/TSX entry point, transforms it with Babel standalone (`jsx-transformer.ts`), injects an import map for CDN-hosted React/Tailwind, and writes it into a sandboxed iframe.

### Database schema

Two models in `prisma/schema.prisma`:
- `User` — email + hashed password
- `Project` — belongs to optional `User`; stores `messages` (JSON) and `data` (file system JSON)

### UI components

shadcn/ui (new-york style, neutral palette) in `src/components/ui/`. Add new components with `npx shadcn@latest add <component>`.

### Testing

Vitest + React Testing Library. Tests live next to source in `__tests__/` directories. The jsdom environment is configured in `vitest.config.mts`.
