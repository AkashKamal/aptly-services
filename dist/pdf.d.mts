/**
 * A lightweight PDF generator that uses a single persistent Browser instance
 * to prevent massive memory spikes associated with creating new browser instances
 * for every PDF request.
 *
 * IMPORTANT: `puppeteer` is an optional dependency (~200MB).
 * It is ONLY installed if you use this module. If your application does not
 * need PDF generation, you can safely ignore it — the rest of @aptly/services
 * will work without it.
 */
declare class PDFService {
    private browser;
    private isGenerating;
    private queue;
    /**
     * Initialize the headless browser.
     * This should be called once on application startup.
     * Throws a clear error if puppeteer is not installed.
     */
    init(): Promise<void>;
    /**
     * Process the internal queue to ensure we don't open 100 pages at once.
     */
    private processQueue;
    /**
     * Generates a PDF from an HTML string using a queue mechanism.
     * Only one PDF is generated at a time by this instance to guarantee stable memory.
     */
    generateFromHtml(html: string): Promise<Buffer>;
    /**
     * Graceful shutdown function to close the browser cleanly.
     */
    close(): Promise<void>;
}
/**
 * Singleton instance to be used across the application.
 */
declare const pdfService: PDFService;

export { PDFService, pdfService };
