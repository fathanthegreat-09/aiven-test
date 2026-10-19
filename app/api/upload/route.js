import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'Tidak ada file gambar yang diunggah' },
        { status: 400 }
      );
    }

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Harap unggah file gambar (JPG, PNG, WebP, GIF).' },
        { status: 400 }
      );
    }

    // Batasi ukuran file (maks 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimal 5MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ambil ekstensi asli yang aman
    const originalExt = path.extname(file.name) || '.jpg';
    const cleanExt = originalExt.toLowerCase().replace(/[^a-z0-9.]/g, '');
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${cleanExt}`;

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${filename}`;

    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Gagal mengunggah gambar: ' + error.message },
      { status: 500 }
    );
  }
}
