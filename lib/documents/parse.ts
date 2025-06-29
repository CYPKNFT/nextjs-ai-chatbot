import pdfParse from 'pdf-parse';

/**
 * Extracts text from a file buffer based on its MIME type or extension.
 * Supports PDF, TXT, and MD files.
 * @param file - The file as a Buffer
 * @param type - The MIME type (e.g., 'application/pdf', 'text/plain', 'text/markdown')
 * @param name - (Optional) The file name (for extension fallback)
 * @returns The extracted text as a string
 */
export async function extractTextFromFile(
  file: Buffer,
  type: string,
  name?: string,
): Promise<string> {
  // Normalize type and extension
  const ext = name ? name.split('.').pop()?.toLowerCase() : undefined;

  if (type === 'application/pdf' || ext === 'pdf') {
    return extractTextFromPDF(file);
  }
  if (type === 'text/plain' || ext === 'txt') {
    return extractTextFromPlain(file);
  }
  if (type === 'text/markdown' || ext === 'md') {
    return extractTextFromPlain(file); // treat MD as plain text
  }
  throw new Error('Unsupported file type');
}

async function extractTextFromPDF(file: Buffer): Promise<string> {
  try {
    const data = await pdfParse(file);
    return data.text;
  } catch (err) {
    throw new Error('Failed to extract text from PDF');
  }
}

function extractTextFromPlain(file: Buffer): string {
  try {
    return file.toString('utf-8');
  } catch (err) {
    throw new Error('Failed to extract text from plain text file');
  }
}
