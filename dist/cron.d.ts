import { ScheduledTask } from 'node-cron';

declare const cronService: {
    /**
     * Schedule a task based on standard Cron expressions.
     * Format `* * * * *` (minute, hour, day of month, month, day of week)
     *
     * @param cronExpression Standard cron string
     * @param taskFunction Async function to execute
     * @param name Optional unique name for the task (allows stopping it later)
     * @returns The node-cron job object
     */
    scheduleTask(cronExpression: string, taskFunction: () => void | Promise<void>, name?: string): ScheduledTask;
    /**
     * Stop and remove a named task.
     */
    stopTask(name: string): void;
};

export { cronService };
