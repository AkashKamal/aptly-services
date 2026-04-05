// src/pdf.ts
var puppeteer = null;
async function loadPuppeteer() {
  if (puppeteer) return puppeteer;
  try {
    puppeteer = await import("puppeteer");
    return puppeteer;
  } catch {
    throw new Error(
      '[@aptly/services] PDF generation requires "puppeteer" to be installed.\nInstall it with: npm install puppeteer\nIt is listed as an optional dependency and is only needed if you use pdfService.'
    );
  }
}
var PDFService = class {
  constructor() {
    this.browser = null;
    this.isGenerating = false;
    this.queue = [];
  }
  /**
   * Initialize the headless browser. 
   * This should be called once on application startup.
   * Throws a clear error if puppeteer is not installed.
   */
  async init() {
    if (!this.browser) {
      const pptr = await loadPuppeteer();
      this.browser = await pptr.default.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          // critical for Docker memory environments like Coolify
          "--disable-gpu"
        ]
      });
    }
  }
  /**
   * Process the internal queue to ensure we don't open 100 pages at once.
   */
  async processQueue() {
    if (this.isGenerating || this.queue.length === 0) return;
    this.isGenerating = true;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (err) {
        console.error("PDF Worker Queue Error:", err);
      }
    }
    this.isGenerating = false;
    this.processQueue();
  }
  /**
   * Generates a PDF from an HTML string using a queue mechanism.
   * Only one PDF is generated at a time by this instance to guarantee stable memory.
   */
  async generateFromHtml(html) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        if (!this.browser) {
          return reject(new Error("PDFService is not initialized. Call init() first."));
        }
        let page;
        try {
          page = await this.browser.newPage();
          await page.setContent(html, { waitUntil: "networkidle0" });
          const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: { top: "1cm", right: "1cm", bottom: "1cm", left: "1cm" }
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
};
var pdfService = new PDFService();
export {
  PDFService,
  pdfService
};
//# sourceMappingURL=pdf.mjs.map