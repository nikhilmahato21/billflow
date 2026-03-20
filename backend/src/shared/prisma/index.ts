import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../generated/prisma/client";
import { env } from "../config/env";
import { pgPool } from "./connection";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaAdapter: PrismaPg | undefined;
};

const prismaAdapter = globalForPrisma.prismaAdapter ?? new PrismaPg(pgPool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: prismaAdapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    transactionOptions: {
      maxWait: env.PRISMA_TRANSACTION_MAX_WAIT_MS,
      timeout: env.PRISMA_TRANSACTION_TIMEOUT_MS,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaAdapter = prismaAdapter;
}
