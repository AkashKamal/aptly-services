import { TDocumentDefinitions } from 'pdfmake/interfaces';

declare class PDFService {
    constructor();
    /**
     * Generates a PDF from a pdfmake document definition.
     */
    generateDocument(docDefinition: TDocumentDefinitions): Promise<Buffer>;
    /**
     * Graceful shutdown. No-op for pdfmake, but kept for backwards compatibility.
     */
    close(): Promise<void>;
}
/**
 * Singleton instance to be used across the application.
 */
declare const pdfService: PDFService;

export { PDFService, pdfService };
