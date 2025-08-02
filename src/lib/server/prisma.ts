import { PrismaClient } from '@prisma/client';
import { dev } from '$app/environment';

// Singleton pattern for Prisma Client
// Ensures only one connection is created for the entire app
declare global {
  var __prisma: PrismaClient | undefined;
}

// Create or reuse the Prisma client
const prisma = globalThis.__prisma || new PrismaClient({
  log: dev ? ['query', 'error', 'warn'] : ['error'],
});

// In development, store the client globally to prevent multiple instances
// during hot reloads
if (dev) {
  globalThis.__prisma = prisma;
}

export default prisma;
