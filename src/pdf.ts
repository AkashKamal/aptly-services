import * as pdfmakeImport from 'pdfmake';
import * as vfsFontsImport from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';

const pdfmake: any = (pdfmakeImport as any).default || pdfmakeImport;

// Extract VFS from the pdfmake/build/vfs_fonts.js export
const vfsFonts = (vfsFontsImport as any).pdfMake?.vfs || (vfsFontsImport as any).default || vfsFontsImport;

const fonts = {
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
};

export class PDFService {
  constructor() {
    // Populate the virtual filesystem with the base64 fonts
    if (vfsFonts && typeof vfsFonts === 'object' && pdfmake.virtualfs) {
      for (const key of Object.keys(vfsFonts)) {
        if (typeof (vfsFonts as any)[key] === 'string') {
          pdfmake.virtualfs.writeFileSync(key, Buffer.from((vfsFonts as any)[key], 'base64'));
        }
      }
    }
    pdfmake.setFonts(fonts);
  }

  /**
   * Generates a PDF from a pdfmake document definition.
   */
  async generateDocument(docDefinition: TDocumentDefinitions): Promise<Buffer> {
    try {
      // Ensure Roboto is used if not specified to avoid Helvetica AFM errors
      const def = {
          ...docDefinition,
          defaultStyle: {
              font: 'Roboto',
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
