// src/cron.ts
import cron from "node-cron";
var cronService = {
  /**
   * Schedule a task based on standard Cron expressions.
   * Format `* * * * *` (minute, hour, day of month, month, day of week)
   * Example: `0 8 * * *` = Run every day at 8:00 AM
   * 
   * @returns A Task object that can be `.stop()`ped later if needed.
   */
  scheduleTask(cronExpression, taskFunction) {
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
    return scheduledJob;
  }
};
export {
  cronService
};
//# sourceMappingURL=cron.mjs.map