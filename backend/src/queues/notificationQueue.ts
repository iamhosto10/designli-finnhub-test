import { Queue, Worker, Job } from "bullmq";
import { getMessaging } from "firebase-admin/messaging";
import { Redis } from "ioredis";

/**
 * Redis connection used by both the Queue and the Worker.
 * Supports a REDIS_URL string (e.g. Render's internal Redis)
 * or individual host/port environment variables for local Docker setup.
 */
const connectionOptions = process.env.REDIS_URL
  ? process.env.REDIS_URL
  : {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
    };

const connection = new Redis(connectionOptions as any, {
  // Required by BullMQ — disables the default blocking behavior
  // that conflicts with the queue's internal job polling mechanism.
  maxRetriesPerRequest: null,
});

/**
 * BullMQ queue for outbound FCM push notifications.
 * Jobs are added here by the alert evaluation service (finnhub.ts)
 * and consumed asynchronously by the worker below.
 *
 * Using a queue instead of direct FCM calls provides:
 * - Retry logic on transient Firebase failures
 * - Decoupling between alert evaluation and notification delivery
 * - Visibility into failed jobs for debugging
 */
export const notificationQueue = new Queue("push-notifications", {
  connection,
});

/**
 * BullMQ worker that processes FCM push notification jobs.
 * Each job is expected to contain:
 * - fcmToken: the recipient device's Firebase token
 * - title: notification title
 * - body: notification body text
 *
 * Configured with 3 retry attempts and a fixed 5-second backoff
 * to handle transient FCM delivery failures gracefully.
 */
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
      console.log(
        `✅ [Worker] Push sent successfully. Message ID: ${response}`,
      );
    } catch (error) {
      console.error(
        `❌ [Worker] FCM delivery failed for job ${job.id}:`,
        error,
      );
      // Re-throwing causes BullMQ to retry the job according to
      // the attempts and backoff config set when the job was added.
      throw error;
    }
  },
  { connection },
);

worker.on("completed", (job) => {
  console.log(`🚀 [Worker] Job ${job.id} completed successfully.`);
});

worker.on("failed", (job, err) => {
  console.error(
    `⚠️ [Worker] Job ${job?.id} failed after all attempts:`,
    err.message,
  );
});
