import { Queue, Worker, Job } from "bullmq";
import { getMessaging } from "firebase-admin/messaging";
import { Redis } from "ioredis";

const connectionOptions = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    };

const connection = new Redis(connectionOptions as any, {
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
      console.log(`✅ [Worker] Push sent successfully. ID: ${response}`);
    } catch (error) {
      console.error(`❌ [Worker] Error in Firebase:`, error);

      throw error;
    }
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`🚀 [Worker] Job ${job.id} completed.`);
});

worker.on("failed", (job, err) => {
  console.error(`⚠️ [Worker] Job failed:`, err.message);
});
