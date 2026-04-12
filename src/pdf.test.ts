import { describe, it, expect, beforeEach } from 'vitest';
import { PDFService } from './pdf';

describe('PDF Service using pdfmake', () => {
  let pdfService: PDFService;

  beforeEach(() => {
    pdfService = new PDFService();
  });

  it('should generate a PDF buffer from a valid document definition', async () => {
    const docDefinition = {
      content: ['Hello World']
    };
    
    const pdfBuffer = await pdfService.generateDocument(docDefinition);
    
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    // PDF magic number check
    expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
  });

  it('should generate a PDF with tables and custom styles', async () => {
    const docDefinition = {
      content: [
        { text: 'Header', style: 'header' },
        {
          table: {
            body: [['C1', 'C2'], ['V1', 'V2']]
          }
        }
      ],
      styles: {
        header: { fontSize: 20, bold: true }
      }
    };
    
    const pdfBuffer = await pdfService.generateDocument(docDefinition);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
  });

  it('should handle images in content', async () => {
    // Note: We use a placeholder image URL for testing
    // pdfmake normally fetches images, but we'll use a dataURI for stability in tests
    const docDefinition = {
      content: [
        { image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }
      ]
    };
    
    const pdfBuffer = await pdfService.generateDocument(docDefinition);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
  });
});
