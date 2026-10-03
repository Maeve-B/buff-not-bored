import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

/**
 * Loads this package's own `.env` by file path rather than relying on the
 * caller's cwd. Prisma's CLI (and @prisma/client, when a process happens to
 * be run from inside packages/db) auto-load `.env` relative to cwd, but once
 * another workspace package (e.g. apps/web) imports this client, the cwd is
 * that caller's — never packages/db — so DATABASE_URL would otherwise go
 * unset. `override: false` keeps a real deployment env var taking
 * precedence over this file.
 */
config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"), override: false });

/**
 * Single shared PrismaClient instance for this package. Repositories import
 * this rather than constructing their own client, and it's the only file in
 * `packages/db` that touches `@prisma/client` directly outside the
 * mappers/repositories that need its generated row types.
 */
export const prisma = new PrismaClient();
