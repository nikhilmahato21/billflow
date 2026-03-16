import "dotenv/config";
import { createApp } from "./app";
import { env } from "./shared/config/env";

// Start workers (import side-effects register BullMQ processors)
import "./shared/workers/invoiceWorker";
import "./shared/workers/notificationWorker";
import "./shared/workers/reminderWorker";

const PORT = parseInt(env.PORT, 10);
const app  = createApp();

const server = app.listen(PORT, () => {
  console.log(`\n🚀 BillFlow API listening on port ${PORT}`);
  console.log(`   Environment : ${env.NODE_ENV}`);
  console.log(`   Frontend URL: ${env.FRONTEND_URL}`);
  console.log(`   Workers     : invoice · notification · reminder\n`);
});

async function shutdown(signal: string) {
  console.log(`\n[${signal}] Shutting down gracefully…`);
  server.close(async () => {
    const { prisma }             = await import("./shared/prisma");
    const { redis }              = await import("./shared/redis");
    const { invoiceWorker }      = await import("./shared/workers/invoiceWorker");
    const { notificationWorker } = await import("./shared/workers/notificationWorker");
    const { reminderWorker }     = await import("./shared/workers/reminderWorker");

    await Promise.all([invoiceWorker.close(), notificationWorker.close(), reminderWorker.close()]);
    await prisma.$disconnect();
    redis.disconnect();
    console.log("✅  Shutdown complete");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
