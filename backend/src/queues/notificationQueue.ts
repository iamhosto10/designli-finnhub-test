import { Queue, Worker, Job } from "bullmq";
import { getMessaging } from "firebase-admin/messaging";
import { Redis } from "ioredis";

const connection = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
});

export const notificationQueue = new Queue("push-notifications", {
  connection,
});

const worker = new Worker(
  "push-notifications",
  async (job: Job) => {
    const { fcmToken, title, body } = job.data;

    const message = {
      notification: { title, body },
      token: fcmToken,
    };

    try {
      const response = await getMessaging().send(message);
      console.log(`✅ [Worker] Push enviada con éxito. ID: ${response}`);
    } catch (error) {
      console.error(`❌ [Worker] Error en Firebase:`, error);

      throw error;
    }
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`🚀 [Worker] Trabajo ${job.id} completado.`);
});

worker.on("failed", (job, err) => {
  console.error(`⚠️ [Worker] Trabajo falló:`, err.message);
});
