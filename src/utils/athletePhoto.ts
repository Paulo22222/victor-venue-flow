// Compressão de fotos de atletas — armazenadas como data URL (base64)
// Evita dependência de bucket público e garante exibição em crachás, perfis e listagens.

const MAX_DIM = 480;
const QUALITY = 0.78;

export async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(MAX_DIM / bitmap.width, MAX_DIM / bitmap.height, 1);
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Falha na compressão')), 'image/jpeg', QUALITY);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Falha ao ler imagem'));
    r.readAsDataURL(blob);
  });
}

/**
 * Comprime a imagem e devolve um data URL pronto para ser salvo na coluna foto_url.
 * O parâmetro athleteKey é mantido por compatibilidade mas não é usado.
 */
export async function uploadAthletePhoto(file: File, _athleteKey: string): Promise<string> {
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Formato inválido. Use JPG, PNG ou WEBP.');
  }
  if (file.size > 8 * 1024 * 1024) throw new Error('Arquivo maior que 8MB.');
  const blob = await compressImage(file);
  return await blobToDataUrl(blob);
}

/**
 * Garante que uma URL/foto possa ser desenhada em canvas/PDF retornando um data URL.
 * Aceita data URLs (retorna direto) e URLs http(s) (faz fetch + canvas).
 */
export function imageUrlToDataUrl(url: string): Promise<string> {
  if (url.startsWith('data:')) return Promise.resolve(url);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      c.getContext('2d')!.drawImage(img, 0, 0);
      try { resolve(c.toDataURL('image/jpeg', 0.9)); } catch (e) { reject(e); }
    };
    img.onerror = () => reject(new Error('Falha ao carregar imagem'));
    img.src = url;
  });
}
