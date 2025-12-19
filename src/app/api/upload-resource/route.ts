import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Configure API route to accept larger bodies for file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const classId = formData.get('classId') as string || 'assignments';

        console.log(`[Upload API] Processing upload. File: ${file?.name}, Size: ${file?.size}, ClassId: ${classId}`);


        if (!file) {
            return NextResponse.json(
                { error: 'Missing file' },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename with timestamp
        const timestamp = Date.now();
        const fileExt = file.name.split('.').pop();
        const fileName = `${timestamp}.${fileExt}`;

        // Create directory if it doesn't exist
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', classId);
        if (!existsSync(uploadDir)) {
            await mkdir(uploadDir, { recursive: true });
        }

        // Write file
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);

        // Return public URL
        const fileUrl = `/uploads/${classId}/${fileName}`;

        return NextResponse.json({ fileUrl });
    } catch (error) {
        console.error('File upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
