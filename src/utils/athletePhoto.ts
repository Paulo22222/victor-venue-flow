import { supabase } from '@/integrations/supabase/client';

const MAX_DIM = 500;
const QUALITY = 0.82;

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

export async function uploadAthletePhoto(file: File, athleteKey: string): Promise<string> {
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Formato inválido. Use JPG, PNG ou WEBP.');
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('Arquivo maior que 5MB.');
  const blob = await compressImage(file);
  const path = `${athleteKey}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('athlete-photos').upload(path, blob, {
    contentType: 'image/jpeg', upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('athlete-photos').getPublicUrl(path);
  return data.publicUrl;
}

export function imageUrlToDataUrl(url: string): Promise<string> {
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
