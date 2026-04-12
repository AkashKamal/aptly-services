import { describe, it, expect, vi } from 'vitest';
import cron from 'node-cron';
import { cronService } from './cron';

vi.mock('node-cron', () => ({
  default: {
    validate: vi.fn().mockImplementation((val) => val === '* * * * *'),
    schedule: vi.fn().mockReturnValue({
      stop: vi.fn(),
      start: vi.fn()
    })
  }
}));

describe('Cron Service', () => {
  it('should schedule a valid task', () => {
    const task = () => {};
    cronService.scheduleTask('* * * * *', task);
    expect(cron.schedule).toHaveBeenCalledWith('* * * * *', expect.any(Function));
  });

  it('should allow stopping a scheduled task', async () => {
    const jobName = 'stoppable-job';
    
    cronService.scheduleTask('* * * * *', () => {}, jobName);
    cronService.stopTask(jobName);
    
    expect(cron.schedule).toHaveBeenCalled();
  });

  it('should throw error when stopping non-existent task', () => {
    expect(() => cronService.stopTask('ghost')).toThrow();
  });

  it('should throw an error for invalid cron expressions', () => {
    expect(() => cronService.scheduleTask('invalid', () => {})).toThrow('Invalid cron expression');
  });
});
