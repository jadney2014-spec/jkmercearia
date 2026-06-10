export async function compressImageFile(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    mimeType?: 'image/jpeg' | 'image/webp';
  }
): Promise<File> {
  const maxWidth = options?.maxWidth ?? 1600;
  const maxHeight = options?.maxHeight ?? 1600;
  const quality = options?.quality ?? 0.82;
  const mimeType = options?.mimeType ?? 'image/jpeg';

  if (!file.type.startsWith('image/')) {
    return file;
  }

  const bitmap = await createImageBitmap(file);

  let { width, height } = bitmap;
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (!b) return reject(new Error('Falha ao comprimir imagem'));
        resolve(b);
      },
      mimeType,
      quality
    );
  });

  const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
  const outName = file.name.replace(/\.[^.]+$/, '') + `.${ext}`;
  return new File([blob], outName, { type: mimeType });
}
