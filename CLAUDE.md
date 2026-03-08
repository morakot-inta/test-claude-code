# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Hono-based REST API for user authentication, running on Bun. Provides JWT login and protected routes.

## Commands

```bash
bun run index.ts        # start server (port 3000)
bun --hot index.ts      # start with hot reload
bun test                # run tests
```

## Architecture

All logic lives in `index.ts`. The app uses:
- **Hono** as the HTTP framework (not Express or `Bun.serve` directly)
- **hono/jwt** for JWT signing (`sign`) and middleware (`jwt`) — always pass `alg: "HS256"` to the `jwt()` middleware
- **@hono/zod-validator** + **zod** for request body validation

Route pattern: register middleware before the handler on the same path (e.g., `app.use("/me", jwt(...))` then `app.get("/me", ...)`).

JWT payload shape: `{ sub: number, username: string, role: string, exp: number }`. Access via `c.get("jwtPayload")` inside protected handlers.

The user store is currently an in-memory array — replace with a real database when needed.

## Bun conventions

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```
