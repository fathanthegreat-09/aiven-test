import { NextResponse } from 'next/server';

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

    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Harap unggah file gambar.' },
        { status: 400 }
      );
    }

    // Konversi buffer file ke base64 (tidak perlu write ke server disk / EROFS safe)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const mimeType = file.type || 'image/jpeg';
    const base64Data = `data:${mimeType};base64,${buffer.toString('base64')}`;

    return NextResponse.json({ url: base64Data }, { status: 201 });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Gagal memproses gambar: ' + error.message },
      { status: 500 }
    );
  }
}
