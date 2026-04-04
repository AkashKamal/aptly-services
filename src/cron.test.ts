import { describe, it, expect, vi } from 'vitest';
import cron from 'node-cron';
import { cronService } from './cron';

vi.mock('node-cron', () => ({
  default: {
    validate: vi.fn().mockImplementation((val) => val === '* * * * *'),
    schedule: vi.fn()
  }
}));

describe('Cron Service', () => {
  it('should schedule a valid task', () => {
    const task = () => {};
    cronService.scheduleTask('* * * * *', task);
    expect(cron.schedule).toHaveBeenCalledWith('* * * * *', expect.any(Function));
  });

  it('should throw an error for invalid cron expressions', () => {
    expect(() => cronService.scheduleTask('invalid', () => {})).toThrow('Invalid cron expression');
  });
});
