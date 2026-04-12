var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/pdf.ts
import * as pdfmakeImport from "pdfmake";
import path from "path";
var pdfmake = pdfmakeImport.default || pdfmakeImport;
var pdfKitPath = path.dirname(__require.resolve("pdfkit/package.json"));
var fontsDir = path.join(pdfKitPath, "js/data");
var fonts = {
  Helvetica: {
    normal: path.join(fontsDir, "Helvetica.afm"),
    bold: path.join(fontsDir, "Helvetica-Bold.afm"),
    italics: path.join(fontsDir, "Helvetica-Oblique.afm"),
    bolditalics: path.join(fontsDir, "Helvetica-BoldOblique.afm")
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