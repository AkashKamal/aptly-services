import { describe, it, expect, vi } from 'vitest';
import * as QRCode from 'qrcode';
import { qrService } from './qr';

vi.mock('qrcode', () => ({
  toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mock-data'),
  toBuffer: vi.fn().mockResolvedValue(Buffer.from('mock-buffer'))
}));

describe('QR Module', () => {
  it('should generate a data URI', async () => {
    const dataUri = await qrService.generateDataUri('https://test.com');
    expect(dataUri).toBe('data:image/png;base64,mock-data');
    expect(QRCode.toDataURL).toHaveBeenCalledWith('https://test.com', expect.any(Object));
  });

  it('should generate a buffer', async () => {
    const buffer = await qrService.generateBuffer('https://test.com');
    expect(buffer.toString()).toBe('mock-buffer');
    expect(QRCode.toBuffer).toHaveBeenCalledWith('https://test.com', expect.any(Object));
  });
});
