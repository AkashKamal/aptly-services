import * as QRCode from 'qrcode';

/**
 * QR Code Service specifically targeted for the MSME Restaurant Inventory workflow.
 * Completely stateless to allow rapid dataURL generation on demand.
 */
declare const qrService: {
    /**
     * Generates a base64 encoded data URI string of the QR code.
     * Format: `data:image/png;base64,...`
     */
    generateDataUri(data: string, options?: QRCode.QRCodeToDataURLOptions): Promise<string>;
    /**
     * Generates raw buffer representation of a QR Code png.
     */
    generateBuffer(data: string, options?: QRCode.QRCodeToBufferOptions): Promise<Buffer>;
};

export { qrService };
