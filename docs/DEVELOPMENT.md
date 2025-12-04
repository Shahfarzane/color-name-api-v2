# Development Guide

Guide for setting up and developing the Color Name API locally.

## Prerequisites

- [Bun](https://bun.sh) >= 1.0 (recommended) or Node.js >= 20.11.0
- Git

## Quick Start

```bash
# Clone the repository
git clone https://github.com/meodai/color-name-api.git
cd color-name-api

# Install dependencies
bun install

# Copy environment template
cp .env.example .env

# Start development server with hot reload
bun run dev
```

The API will be available at `http://localhost:8080`.

---

## Development Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with hot reload |
| `bun run start:bun` | Start production server with Bun |
| `npm run start` | Start production server with Node.js |
| `bun run test` | Run all tests |
| `bun run typecheck` | TypeScript type checking |
| `bun run lint` | Run ESLint |
| `bun run lint:fix` | Fix linting issues |
| `bun run format` | Format code with Prettier |

---

## Testing

### Run All Tests

```bash
bun run test
```

### Individual Test Suites

```bash
# Core API tests
bun run test:local

# VP-Tree algorithm tests
bun run test:vptree

# Palette name generation tests
bun run test:palette-name

# Compare with live API
bun run test:compare-api

# Gzip header tests
bun run test:gzip-headers

# Concurrent users simulation
bun run test:concurrent

# Live API test (against Fly.io)
bun run test:live
```

### Writing Tests

Tests are located in the `test/` directory. The project uses Bun's built-in test runner.

Example test:
```typescript
import { expect, test } from "bun:test";

test("should return color names", async () => {
  const response = await fetch("http://localhost:8080/v1/?values=ff0000");
  const data = await response.json();

  expect(data.colors).toHaveLength(1);
  expect(data.colors[0].name).toBeDefined();
});
```

---

## Project Structure

```
color-name-api/
├── src/
│   ├── index.ts          # Entry point
│   ├── app.ts            # Hono app configuration
│   ├── lib/              # Core libraries
│   │   ├── FindColors.ts # Color matching logic
│   │   └── VPTree.ts     # VP-Tree implementation
│   ├── middleware/       # Custom middleware
│   │   ├── logger.ts
│   │   └── rateLimit.ts
│   ├── routes/           # API routes
│   │   ├── colors.ts     # Main color lookup
│   │   ├── names.ts      # Name search
│   │   ├── lists.ts      # Color list info
│   │   └── swatch.ts     # SVG swatch generation
│   ├── services/         # Business logic
│   │   ├── colorService.ts
│   │   ├── cacheService.ts
│   │   ├── socketService.ts
│   │   └── geoipService.ts
│   └── types/            # TypeScript types
├── test/                 # Test files
├── docs/                 # Documentation
├── .env.example          # Environment template
└── package.json
```

---

## Environment Setup

### Minimal Development Setup

For basic development, you don't need a database:

```bash
# .env
NODE_ENV=development
PORT=8080
NODB=true
```

### Full Development Setup

For testing all features including database:

```bash
# .env
NODE_ENV=development
PORT=8080
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SOCKET=true
```

---

## API Endpoints

### Color Lookup
```bash
# Single color
curl "http://localhost:8080/v1/?values=ff0000"

# Multiple colors
curl "http://localhost:8080/v1/?values=ff0000,00ff00,0000ff"

# With options
curl "http://localhost:8080/v1/?values=ff0000&list=bestOf&noduplicates=true"
```

### Name Search
```bash
curl "http://localhost:8080/v1/names/blue"
curl "http://localhost:8080/v1/names/?name=ocean&maxResults=10"
```

### Color Lists
```bash
curl "http://localhost:8080/v1/lists/"
```

### SVG Swatch
```bash
curl "http://localhost:8080/v1/swatch/?color=ff0000"
```

---

## Debugging

### Enable Debug Logging

```bash
DEBUG=true bun run dev
```

### VS Code Launch Config

Add to `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "bun",
      "request": "launch",
      "name": "Debug API",
      "program": "${workspaceFolder}/src/index.ts",
      "cwd": "${workspaceFolder}",
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "true"
      }
    }
  ]
}
```

---

## Code Style

The project uses:
- **ESLint** for linting
- **Prettier** for formatting
- **Biome** for additional checks

```bash
# Check formatting
bun run format:check

# Fix formatting
bun run format

# Lint
bun run lint

# Fix lint issues
bun run lint:fix
```

---

## Type Checking

```bash
bun run typecheck
```

This runs TypeScript in check mode without emitting files.

---

## Common Development Tasks

### Adding a New Route

1. Create route file in `src/routes/`
2. Export and add to `src/routes/index.ts`
3. Mount in `src/app.ts`

### Adding a New Environment Variable

1. Add to `.env.example` with documentation
2. Update `docs/CONFIGURATION.md`
3. Use with fallback: `process.env.VAR_NAME || "default"`

### Updating Color Data

Color data comes from the `color-name-list` npm package:
```bash
bun update color-name-list
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Kill it
kill -9 <PID>
```

### TypeScript Errors

```bash
# Clear Bun cache
rm -rf node_modules/.cache
bun install
```

### Tests Failing

Make sure the dev server is running:
```bash
# Terminal 1
bun run dev

# Terminal 2
bun run test:local
```
