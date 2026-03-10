# Contributing to UIGen

## Development Setup

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later

### Installation

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd uigen
   ```

2. Install dependencies, generate the Prisma client, and run migrations:
   ```bash
   npm run setup
   ```

3. Configure your environment:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set `ANTHROPIC_API_KEY` to your Anthropic API key.
   - If the key is empty or missing, the app falls back to a `MockLanguageModel` that returns hardcoded demo components — useful for UI work without incurring API costs.

4. Start the development server:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run test` | Run all tests (Vitest) |
| `npm run lint` | Run ESLint |
| `npm run setup` | Install deps + generate Prisma client + run migrations |
| `npm run db:reset` | Reset database (drops all data) |
| `npx prisma studio` | Open Prisma GUI to inspect the DB |
| `npx vitest run <file>` | Run a single test file |

## Project Structure

- `src/app/api/chat/route.ts` — Core AI streaming endpoint
- `src/lib/` — Business logic: virtual file system, AI tools, JSX transformer, auth
- `src/lib/contexts/` — React context providers (chat, file system)
- `src/components/` — UI components (chat, editor, preview, auth)
- `src/actions/` — Next.js server actions for project CRUD

See `CLAUDE.md` for a full architecture overview.

## Making Changes

- **UI changes**: Work in `src/components/`. The preview iframe re-renders automatically via `PreviewFrame.tsx`.
- **AI behavior**: Edit the system prompt in `src/lib/prompts/generation.tsx` or the tools in `src/lib/tools/`.
- **Database changes**: Edit `prisma/schema.prisma`, then run `npx prisma migrate dev`.

## Running Tests

```bash
npm run test               # Run all tests
npx vitest run <file>      # Run a single test file
```

Tests live alongside source files in `__tests__/` subdirectories.

## Database

```bash
npm run db:reset     # Reset database (drops all data)
npx prisma studio    # Open Prisma GUI to inspect the DB
```

## Pull Request Guidelines

- Keep changes focused — one feature or fix per PR.
- Add or update tests for any logic changes in `src/lib/`.
- Ensure `npm run build` and `npm run test` pass before submitting.
