import puppeteer, { Browser } from 'puppeteer';

/**
 * A lightweight PDF generator that uses a single persistent Browser instance
 * to prevent massive memory spikes associated with creating new browser instances
 * for every PDF request.
 */
export class PDFService {
  private browser: Browser | null = null;
  private isGenerating = false;
  private queue: Array<() => Promise<void>> = [];

  /**
   * Initialize the headless browser. 
   * This should be called once on application startup.
   */
  async init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // critical for Docker memory environments like Coolify
          '--disable-gpu'
        ]
      });
    }
  }

  /**
   * Process the internal queue to ensure we don't open 100 pages at once.
   */
  private async processQueue() {
    if (this.isGenerating || this.queue.length === 0) return;
    
    this.isGenerating = true;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (err) {
        console.error('PDF Worker Queue Error:', err);
      }
    }
    
    this.isGenerating = false;
    this.processQueue();
  }

  /**
   * Generates a PDF from an HTML string using a queue mechanism.
   * Only one PDF is generated at a time by this instance to guarantee stable memory.
   */
  async generateFromHtml(html: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        if (!this.browser) {
           return reject(new Error('PDFService is not initialized. Call init() first.'));
        }

        let page;
        try {
          page = await this.browser.newPage();
          await page.setContent(html, { waitUntil: 'networkidle0' });
          const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
          });
          
          resolve(Buffer.from(pdfBuffer));
        } catch (error) {
          reject(error);
        } finally {
          if (page) {
            await page.close();
          }
        }
      });
      
      this.processQueue();
    });
  }

  /**
   * Graceful shutdown function to close the browser cleanly.
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

/**
 * Singleton instance to be used across the application.
 */
export const pdfService = new PDFService();
