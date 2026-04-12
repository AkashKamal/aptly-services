import * as pdfmakeImport from 'pdfmake';
const pdfmake: any = (pdfmakeImport as any).default || pdfmakeImport;
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

// Using standard PDF fonts, no need to load TTF files.
const fonts = {
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique'
  }
};

export class PDFService {
  constructor() {
    pdfmake.setFonts(fonts);
  }

  /**
   * Generates a PDF from a pdfmake document definition.
   */
  async generateDocument(docDefinition: TDocumentDefinitions): Promise<Buffer> {
    try {
      // Ensure Helvetica is used if not specified to avoid font errors
      const def = {
          ...docDefinition,
          defaultStyle: {
              font: 'Helvetica',
              ...(docDefinition.defaultStyle as any),
          }
      };

      const pdfDoc = pdfmake.createPdf(def);
      return await pdfDoc.getBuffer();
    } catch (error) {
      console.error('[@aptly/services] PDF Generation Error:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown. No-op for pdfmake, but kept for backwards compatibility.
   */
  async close() {
    // nothing to close for pdfmake
  }
}

/**
 * Singleton instance to be used across the application.
 */
export const pdfService = new PDFService();
