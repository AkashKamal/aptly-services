import cron from 'node-cron';

/**
 * A lightweight task scheduling service wrapping node-cron.
 * Ideal for executing nightly aggregation tasks (CA Deadlines, daily inventory emails).
 * In an isolated Coolify architecture, ensure only ONE container (or worker) is running these crons,
 * to avoid duplicate executions.
 */
const taskRegistry = new Map<string, cron.ScheduledTask>();

export const cronService = {
  /**
   * Schedule a task based on standard Cron expressions.
   * Format `* * * * *` (minute, hour, day of month, month, day of week)
   * 
   * @param cronExpression Standard cron string
   * @param taskFunction Async function to execute
   * @param name Optional unique name for the task (allows stopping it later)
   * @returns The node-cron job object
   */
  scheduleTask(
    cronExpression: string, 
    taskFunction: () => void | Promise<void>,
    name?: string
  ) {
    const valid = cron.validate(cronExpression);
    if (!valid) {
      throw new Error(`Invalid cron expression provided: ${cronExpression}`);
    }

    const scheduledJob = cron.schedule(cronExpression, async () => {
      try {
        await taskFunction();
      } catch (e) {
        console.error(`Error executing cron task [${cronExpression}]:`, e);
      }
    });

    if (name) {
      taskRegistry.set(name, scheduledJob);
    }

    return scheduledJob;
  },

  /**
   * Stop and remove a named task.
   */
  stopTask(name: string) {
    const task = taskRegistry.get(name);
    if (!task) {
      throw new Error(`Cron task [${name}] not found`);
    }
    task.stop();
    taskRegistry.delete(name);
  }
};
