// src/qr.ts
import * as QRCode from "qrcode";
var qrService = {
  /**
   * Generates a base64 encoded data URI string of the QR code.
   * Format: `data:image/png;base64,...`
   */
  async generateDataUri(data, options) {
    try {
      return await QRCode.toDataURL(data, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
        ...options
      });
    } catch (error) {
      console.error("QR Generation ERror:", error);
      throw new Error("Failed to generate QR Code Data URI");
    }
  },
  /**
   * Generates raw buffer representation of a QR Code png.
   */
  async generateBuffer(data, options) {
    try {
      return await QRCode.toBuffer(data, {
        errorCorrectionLevel: "H",
        margin: 1,
        width: 300,
        ...options
      });
    } catch (error) {
      console.error("QR Generation Buffer Error:", error);
      throw new Error("Failed to generate QR Code Buffer");
    }
  }
};
export {
  qrService
};
//# sourceMappingURL=qr.mjs.map