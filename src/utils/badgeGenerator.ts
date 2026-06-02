import jsPDF from 'jspdf';
import { imageUrlToDataUrl } from './athletePhoto';

export interface BadgeAthlete {
  id: string;
  nome: string;
  foto_url?: string | null;
  instituicao?: string | null;
  curso?: string | null;
  campus?: string | null;
  modalidade?: string | null;
  modalidades?: string[] | null;
  numero_atleta?: string | null;
  eventName?: string;
}

// Página A4 em mm. Crachá 85x110mm, 2 colunas x 2 linhas = 4 por página
const PAGE_W = 210, PAGE_H = 297;
const CARD_W = 90, CARD_H = 130;
const COLS = 2, ROWS = 2;
const MARGIN_X = (PAGE_W - COLS * CARD_W) / (COLS + 1);
const MARGIN_Y = (PAGE_H - ROWS * CARD_H) / (ROWS + 1);

const FALLBACK_PHOTO =
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="55%" font-family="Arial" font-size="80" text-anchor="middle" fill="#9ca3af">?</text></svg>`
  );

async function loadPhoto(url?: string | null): Promise<string> {
  if (!url) return FALLBACK_PHOTO;
  try { return await imageUrlToDataUrl(url); } catch { return FALLBACK_PHOTO; }
}

function drawCard(pdf: jsPDF, x: number, y: number, a: BadgeAthlete, photoData: string) {
  // Borda
  pdf.setDrawColor(15, 23, 42);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(x, y, CARD_W, CARD_H, 3, 3, 'S');

  // Cabeçalho
  pdf.setFillColor(15, 23, 42);
  pdf.rect(x, y, CARD_W, 14, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(a.eventName || 'EVENTO ESPORTIVO', x + CARD_W / 2, y + 9, { align: 'center' });

  // Foto
  const photoSize = 45;
  const px = x + (CARD_W - photoSize) / 2;
  const py = y + 18;
  try { pdf.addImage(photoData, 'JPEG', px, py, photoSize, photoSize); } catch { /* noop */ }
  pdf.setDrawColor(100); pdf.rect(px, py, photoSize, photoSize, 'S');

  // Nome
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  const nome = (a.nome || '').toUpperCase();
  const lines = pdf.splitTextToSize(nome, CARD_W - 8);
  pdf.text(lines.slice(0, 2), x + CARD_W / 2, y + 72, { align: 'center' });

  // Dados
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  let dy = y + 84;
  const line = (label: string, value?: string | null) => {
    if (!value) return;
    pdf.setFont('helvetica', 'bold'); pdf.text(`${label}:`, x + 4, dy);
    pdf.setFont('helvetica', 'normal');
    const v = pdf.splitTextToSize(value, CARD_W - 28);
    pdf.text(v[0] || '', x + 24, dy);
    dy += 5;
  };
  line('Instituição', a.instituicao);
  line('Campus', a.campus);
  line('Curso', a.curso);
  const mods = a.modalidades?.length ? a.modalidades.join(', ') : a.modalidade || '';
  line('Modalidade', mods);

  // Número/ID
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(80);
  const code = a.numero_atleta || a.id.slice(0, 8).toUpperCase();
  pdf.text(`Nº ${code}`, x + CARD_W / 2, y + CARD_H - 4, { align: 'center' });
}

export async function generateBadgesPDF(athletes: BadgeAthlete[], filename = 'crachas.pdf') {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const photos = await Promise.all(athletes.map(a => loadPhoto(a.foto_url)));
  athletes.forEach((a, idx) => {
    const posIdx = idx % (COLS * ROWS);
    if (idx > 0 && posIdx === 0) pdf.addPage();
    const col = posIdx % COLS;
    const row = Math.floor(posIdx / COLS);
    const x = MARGIN_X + col * (CARD_W + MARGIN_X);
    const y = MARGIN_Y + row * (CARD_H + MARGIN_Y);
    drawCard(pdf, x, y, a, photos[idx]);
  });
  pdf.save(filename);
}
