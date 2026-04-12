import JsBarcode from 'jsbarcode';
import { DOMImplementation, XMLSerializer } from 'xmldom';

export interface BarcodeOptions {
  format?: 'CODE128' | 'EAN13' | 'EAN8' | 'UPC' | 'CODE39' | 'ITF14';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  lineColor?: string;
}

export const barcodeService = {
  /**
   * Generates a barcode as an SVG string.
   * Pure JS implementation with no canvas or DOM dependencies.
   */
  generateSVG(text: string, options: BarcodeOptions = {}): string {
    const {
      format = 'CODE128',
      width = 2,
      height = 100,
      displayValue = true,
      fontSize = 20,
      margin = 10,
      lineColor = '#000'
    } = options;

    const document = new DOMImplementation().createDocument(
      'http://www.w3.org/1999/xhtml',
      'html',
      null
    );

    const svgNode = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    JsBarcode(svgNode, text, {
      xmlDocument: document,
      format,
      width,
      height,
      displayValue,
      fontSize,
      margin,
      lineColor
    });

    return new XMLSerializer().serializeToString(svgNode);
  }
};
