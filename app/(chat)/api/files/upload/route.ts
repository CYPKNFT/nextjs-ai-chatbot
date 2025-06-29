import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/app/(auth)/auth';
import { extractTextFromFile } from '@/lib/documents/parse';

// Accept images and document types
const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'text/plain',
  'text/markdown',
];

const FileSchema = z.object({
  file: z
    .instanceof(Blob)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'File size should be less than 5MB',
    })
    .refine((file) => ACCEPTED_TYPES.includes(file.type), {
      message: 'File type should be JPEG, PNG, PDF, TXT, or MD',
    }),
});

export async function POST(request: Request) {
  console.log('[UPLOAD] Received request');
  const session = await auth();

  if (!session) {
    console.log('[UPLOAD] Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.body === null) {
    console.log('[UPLOAD] Request body is empty');
    return new Response('Request body is empty', { status: 400 });
  }

  try {
    const formData = await request.formData();
    console.log('[UPLOAD] Extracted formData:', formData);
    const file = formData.get('file') as Blob;
    console.log('[UPLOAD] Extracted file:', file);

    if (!file) {
      console.log('[UPLOAD] No file uploaded');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const validatedFile = FileSchema.safeParse({ file });
    console.log('[UPLOAD] Validation result:', validatedFile);

    if (!validatedFile.success) {
      const errorMessage = validatedFile.error.errors
        .map((error) => error.message)
        .join(', ');
      console.log('[UPLOAD] Validation failed:', errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    const filename = (formData.get('file') as File).name;
    console.log('[UPLOAD] Filename:', filename);
    const fileBuffer = await file.arrayBuffer();
    console.log('[UPLOAD] File buffer length:', fileBuffer.byteLength);

    let extractedText: string | undefined = undefined;
    // Only extract text for document types
    if (
      ['application/pdf', 'text/plain', 'text/markdown'].includes(file.type) ||
      /\.(pdf|txt|md)$/i.test(filename)
    ) {
      try {
        extractedText = await extractTextFromFile(
          Buffer.from(fileBuffer),
          file.type,
          filename,
        );
        console.log('[UPLOAD] Extracted text length:', extractedText.length);
      } catch (err) {
        console.log('[UPLOAD] Text extraction failed:', err);
        // Optionally, you can return an error or just skip text extraction
      }
    }

    try {
      console.log('[UPLOAD] Uploading to Vercel Blob...');
      const data = await put(`${filename}`, fileBuffer, {
        access: 'public',
      });
      console.log('[UPLOAD] Upload successful:', data);
      return NextResponse.json({ ...data, extractedText });
    } catch (error) {
      console.log('[UPLOAD] Upload failed:', error);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
  } catch (error) {
    console.log('[UPLOAD] Failed to process request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 },
    );
  }
}
