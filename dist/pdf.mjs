// src/pdf.ts
import * as pdfmakeImport from "pdfmake";
import * as vfsFontsImport from "pdfmake/build/vfs_fonts";
var pdfmake = pdfmakeImport.default || pdfmakeImport;
var vfsFonts = vfsFontsImport.pdfMake?.vfs || vfsFontsImport.default || vfsFontsImport;
var fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf"
  }
};
var PDFService = class {
  constructor() {
    if (vfsFonts && typeof vfsFonts === "object" && pdfmake.virtualfs) {
      for (const key of Object.keys(vfsFonts)) {
        if (typeof vfsFonts[key] === "string") {
          pdfmake.virtualfs.writeFileSync(key, Buffer.from(vfsFonts[key], "base64"));
        }
      }
    }
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
          font: "Roboto",
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