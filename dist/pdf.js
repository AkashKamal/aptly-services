"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/pdf.ts
var pdf_exports = {};
__export(pdf_exports, {
  PDFService: () => PDFService,
  pdfService: () => pdfService
});
module.exports = __toCommonJS(pdf_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PDFService,
  pdfService
});
//# sourceMappingURL=pdf.js.map