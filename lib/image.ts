const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.72;

/** Downscale + re-encode a photo as JPEG before upload, so reports submit quickly on mobile networks. */
export function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      if (Math.max(width, height) > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) return resolve(file);
          resolve(new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }));
        },
        'image/jpeg',
        JPEG_QUALITY
      );
    };

    img.onerror = () => resolve(file);
    img.src = url;
  });
}
