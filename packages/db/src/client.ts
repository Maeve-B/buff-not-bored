import { PrismaClient } from "@prisma/client";

/**
 * Single shared PrismaClient instance for this package. Repositories import
 * this rather than constructing their own client, and it's the only file in
 * `packages/db` that touches `@prisma/client` directly outside the
 * mappers/repositories that need its generated row types.
 */
export const prisma = new PrismaClient();
