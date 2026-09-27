import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // ล็อก pool เล็กกัน pooler เต็ม (เคยล่มด้วย EMAXCONNSESSION 15 sessions)
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    }),
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma
