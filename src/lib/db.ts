import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Get database path from environment variable or use default
function getDatabasePath(): string {
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    // Remove 'file:' prefix if present
    return dbUrl.replace(/^file:/, '');
  }
  // Default for local development
  return process.cwd() + '/dev.db';
}

const dbPath = getDatabasePath();

const adapter = new PrismaBetterSqlite3({
  url: dbPath
});

export const prisma = globalThis.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
