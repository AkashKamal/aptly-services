import * as QRCode from 'qrcode';

/**
 * QR Code Service specifically targeted for the MSME Restaurant Inventory workflow.
 * Completely stateless to allow rapid dataURL generation on demand.
 */
export const qrService = {
  /**
   * Generates a base64 encoded data URI string of the QR code.
   * Format: `data:image/png;base64,...`
   */
  async generateDataUri(data: string, options?: QRCode.QRCodeToDataURLOptions): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300,
        ...options,
      });
    } catch (error) {
      console.error('QR Generation ERror:', error);
      throw new Error('Failed to generate QR Code Data URI');
    }
  },

  /**
   * Generates raw buffer representation of a QR Code png.
   */
  async generateBuffer(data: string, options?: QRCode.QRCodeToBufferOptions): Promise<Buffer> {
    try {
      return await QRCode.toBuffer(data, {
        errorCorrectionLevel: 'H',
        margin: 1,
        width: 300,
        ...options,
      });
    } catch (error) {
      console.error('QR Generation Buffer Error:', error);
      throw new Error('Failed to generate QR Code Buffer');
    }
  }
};
