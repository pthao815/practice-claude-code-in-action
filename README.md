# UIGen

AI-powered React component generator with live preview.

## Prerequisites

- Node.js 18+
- npm

## Setup

1. **Optional** Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=your-api-key-here
```

The project will run without an API key. Rather than using a LLM to generate components, static code will be returned instead.

2. Install dependencies and initialize database

```bash
npm run setup
```

This command will:

- Install all dependencies
- Generate Prisma client
- Run database migrations

## Running the Application

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Usage

1. Sign up or continue as anonymous user
2. Describe the React component you want to create in the chat
3. View generated components in real-time preview
4. Switch to Code view to see and edit the generated files
5. Continue iterating with the AI to refine your components

## Features

- AI-powered component generation using Claude
- Live preview with hot reload
- Virtual file system (no files written to disk)
- Syntax highlighting and code editor
- Component persistence for registered users
- Export generated code

## Architecture

User prompts flow through a streaming AI pipeline and render live in the browser:

```
User prompt → ChatProvider → POST /api/chat
  → Claude streams tool calls (str_replace_editor, file_manager)
  → FileSystemProvider applies changes to VirtualFileSystem (in-memory)
  → PreviewFrame compiles JSX with Babel → renders in sandboxed iframe
  → On completion: project saved to SQLite via Prisma
```

**Key abstractions:**

- **VirtualFileSystem** — an in-memory JSON file store sent with every request; nothing is written to disk
- **AI Tools** — two Zod-validated tools Claude calls to create/patch files (`str_replace_editor`) or rename/delete them (`file_manager`)
- **PreviewFrame** — compiles JSX in-browser using Babel standalone and renders it in a sandboxed iframe with no build step
- **Contexts** — `FileSystemProvider` owns VFS state; `ChatProvider` wraps Vercel AI SDK `useChat()` and keeps the two in sync

## Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Prisma with SQLite
- Anthropic Claude AI
- Vercel AI SDK
