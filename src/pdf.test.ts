import { describe, it, expect, vi, beforeEach } from 'vitest';
import puppeteer from 'puppeteer';
import { PDFService } from './pdf';

vi.mock('puppeteer', () => ({
  default: {
    launch: vi.fn().mockResolvedValue({
      newPage: vi.fn().mockResolvedValue({
        setContent: vi.fn(),
        pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf')),
        close: vi.fn()
      }),
      close: vi.fn()
    })
  }
}));

describe('PDF Service', () => {
  let pdfService: PDFService;

  beforeEach(() => {
    pdfService = new PDFService();
    vi.clearAllMocks();
  });

  it('should initialize the browser correctly', async () => {
    await pdfService.init();
    expect(puppeteer.launch).toHaveBeenCalledWith(expect.objectContaining({
      headless: true
    }));
  });

  it('should generate a PDF and process the queue', async () => {
    await pdfService.init();
    const pdfBuffer = await pdfService.generateFromHtml('<h1>Test</h1>');
    
    expect(pdfBuffer.toString()).toBe('mock-pdf');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    expect(page.setContent).toHaveBeenCalledWith('<h1>Test</h1>', expect.any(Object));
    expect(page.pdf).toHaveBeenCalled();
  });

  it('should handle multiple requests in sequence using the queue', async () => {
    await pdfService.init();
    
    // Fire off multiple requests at once
    const p1 = pdfService.generateFromHtml('<h1>1</h1>');
    const p2 = pdfService.generateFromHtml('<h1>2</h1>');
    
    const [res1, res2] = await Promise.all([p1, p2]);
    
    expect(res1.toString()).toBe('mock-pdf');
    expect(res2.toString()).toBe('mock-pdf');
    
    const browser = await puppeteer.launch();
    expect(browser.newPage).toHaveBeenCalledTimes(2);
  });

  it('should throw error if not initialized', async () => {
    await expect(pdfService.generateFromHtml('<h1>Test</h1>')).rejects.toThrow('PDFService is not initialized');
  });
});
