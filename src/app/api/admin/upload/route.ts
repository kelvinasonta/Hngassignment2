import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getAuthenticatedUser } from '@/lib/server-auth';
import { apiSuccess, apiError, ApiErrorCode } from '@/lib/api-response';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const authResult = await getAuthenticatedUser(request);
    if (!authResult.isAuthenticated || (!authResult.isAdmin && !authResult.isStaff)) {
      return apiError('Staff or Administrator credentials required', ApiErrorCode.FORBIDDEN, 403);
    }

    const contentType = request.headers.get('content-type') || '';

    // 1. Handle multipart/form-data
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return apiError('No file provided in form-data payload', ApiErrorCode.BAD_REQUEST, 400);
      }

      // Validate mime type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(jpg|jpeg|png|webp|gif|avif|svg)$/i)) {
        return apiError('Invalid file type. Only JPEG, PNG, WEBP, GIF, and AVIF are supported.', ApiErrorCode.VALIDATION_ERROR, 422);
      }

      // Max size: 10MB
      if (file.size > 10 * 1024 * 1024) {
        return apiError('File size exceeds the 10MB limit.', ApiErrorCode.VALIDATION_ERROR, 422);
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name).toLowerCase() || '.jpg';
      const cleanName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
      const uniqueFilename = `aether-${cleanName}-${Date.now()}${ext}`;

      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, uniqueFilename);
      await fs.writeFile(filePath, buffer);

      const publicUrl = `/uploads/${uniqueFilename}`;

      // Optional: dual-upload to Supabase storage if available
      try {
        const supabase = getSupabaseServerClient();
        if (supabase) {
          await supabase.storage.from('products').upload(uniqueFilename, buffer, {
            contentType: file.type,
            upsert: true,
          });
        }
      } catch {
        // Local upload succeeded, Supabase storage optional
      }

      return apiSuccess({
        url: publicUrl,
        filename: uniqueFilename,
        size: file.size,
        type: file.type,
      }, 'Image uploaded successfully');
    }

    // 2. Handle base64 JSON payload
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => null);
      if (!body || !body.imageBase64) {
        return apiError('imageBase64 string required in JSON body', ApiErrorCode.BAD_REQUEST, 400);
      }

      const matches = body.imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return apiError('Invalid base64 Data URL format', ApiErrorCode.VALIDATION_ERROR, 422);
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      let ext = '.jpg';
      if (mimeType.includes('png')) ext = '.png';
      else if (mimeType.includes('webp')) ext = '.webp';
      else if (mimeType.includes('svg')) ext = '.svg';

      const uniqueFilename = `aether-upload-${Date.now()}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });

      const filePath = path.join(uploadDir, uniqueFilename);
      await fs.writeFile(filePath, buffer);

      return apiSuccess({
        url: `/uploads/${uniqueFilename}`,
        filename: uniqueFilename,
        size: buffer.length,
      }, 'Image uploaded successfully');
    }

    return apiError('Unsupported content type. Send multipart/form-data or application/json', ApiErrorCode.BAD_REQUEST, 400);
  } catch (error: any) {
    console.error('Image upload failed:', error);
    return apiError('Image processing failed: ' + error.message, ApiErrorCode.INTERNAL_ERROR, 500);
  }
}
