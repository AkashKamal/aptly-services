import { describe, it, expect } from 'vitest';
import { barcodeService } from './index';

describe('Barcode Service', () => {
  it('should generate an SVG string for CODE128', () => {
    const svg = barcodeService.generateSVG('APTLY123');
    expect(svg).toContain('<svg');
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('APTLY123'); // jsbarcode includes text in SVG titles or comments usually
  });

  it('should generate an EAN13 barcode', () => {
    // EAN13 requires exactly 12 or 13 digits
    const svg = barcodeService.generateSVG('123456789012', { format: 'EAN13' });
    expect(svg).toContain('<svg');
  });

  it('should apply custom dimensions', () => {
    const svg = barcodeService.generateSVG('TEST', { height: 50, width: 4 });
    expect(svg).toContain('height="50"');
    // width is a multiplier in jsbarcode, not the total SVG width
  });
});
