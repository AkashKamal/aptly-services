import cron from 'node-cron';

/**
 * A lightweight task scheduling service wrapping node-cron.
 * Ideal for executing nightly aggregation tasks (CA Deadlines, daily inventory emails).
 * In an isolated Coolify architecture, ensure only ONE container (or worker) is running these crons,
 * to avoid duplicate executions.
 */
export const cronService = {
  /**
   * Schedule a task based on standard Cron expressions.
   * Format `* * * * *` (minute, hour, day of month, month, day of week)
   * Example: `0 8 * * *` = Run every day at 8:00 AM
   * 
   * @returns A Task object that can be `.stop()`ped later if needed.
   */
  scheduleTask(cronExpression: string, taskFunction: () => void | Promise<void>) {
    const valid = cron.validate(cronExpression);
    if (!valid) {
      throw new Error(`Invalid cron expression provided: ${cronExpression}`);
    }

    // Schedule the async task and catch top level errors to prevent crashing the container
    const scheduledJob = cron.schedule(cronExpression, async () => {
      try {
        await taskFunction();
      } catch (e) {
        console.error(`Error executing cron task [${cronExpression}]:`, e);
      }
    });

    return scheduledJob;
  }
};
