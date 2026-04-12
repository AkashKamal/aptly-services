// src/pdf.ts
import * as pdfmakeImport from "pdfmake";
var pdfmake = pdfmakeImport.default || pdfmakeImport;
var fonts = {
  Helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italics: "Helvetica-Oblique",
    bolditalics: "Helvetica-BoldOblique"
  }
};
var PDFService = class {
  constructor() {
    pdfmake.setFonts(fonts);
  }
  /**
   * Generates a PDF from a pdfmake document definition.
   */
  async generateDocument(docDefinition) {
    try {
      const def = {
        ...docDefinition,
        defaultStyle: {
          font: "Helvetica",
          ...docDefinition.defaultStyle
        }
      };
      const pdfDoc = pdfmake.createPdf(def);
      return await pdfDoc.getBuffer();
    } catch (error) {
      console.error("[@aptly/services] PDF Generation Error:", error);
      throw error;
    }
  }
  /**
   * Graceful shutdown. No-op for pdfmake, but kept for backwards compatibility.
   */
  async close() {
  }
};
var pdfService = new PDFService();
export {
  PDFService,
  pdfService
};
//# sourceMappingURL=pdf.mjs.map