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
  tipo_sanguineo?: string | null;
  contato_emergencia?: string | null;
  alergias?: string | null;
  enfermidades?: string | null;
  observacoes?: string | null;
  eventName?: string;
}

// A4 retrato, 2 colunas x 2 linhas = 4 crachás por página.
const PAGE_W = 210, PAGE_H = 297;
const CARD_W = 90, CARD_H = 130;
const COLS = 2, ROWS = 2;
const MARGIN_X = (PAGE_W - COLS * CARD_W) / (COLS + 1);
const MARGIN_Y = (PAGE_H - ROWS * CARD_H) / (ROWS + 1);
const PRIMARY: [number, number, number] = [15, 23, 42];
const ACCENT: [number, number, number] = [37, 99, 235];

const FALLBACK_PHOTO =
  'data:image/svg+xml;utf8,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="55%" font-family="Arial" font-size="80" text-anchor="middle" fill="#9ca3af">?</text></svg>`
  );

async function loadPhoto(url?: string | null): Promise<string> {
  if (!url) return FALLBACK_PHOTO;
  try { return await imageUrlToDataUrl(url); } catch { return FALLBACK_PHOTO; }
}

function cardOrigin(posIdx: number, mirror = false) {
  const col = posIdx % COLS;
  const row = Math.floor(posIdx / COLS);
  const effectiveCol = mirror ? (COLS - 1 - col) : col;
  const x = MARGIN_X + effectiveCol * (CARD_W + MARGIN_X);
  const y = MARGIN_Y + row * (CARD_H + MARGIN_Y);
  return { x, y };
}

function drawFront(pdf: jsPDF, x: number, y: number, a: BadgeAthlete, photoData: string) {
  pdf.setDrawColor(...PRIMARY);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(x, y, CARD_W, CARD_H, 3, 3, 'S');

  // Cabeçalho
  pdf.setFillColor(...PRIMARY);
  pdf.rect(x, y, CARD_W, 14, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text(a.eventName || 'EVENTO ESPORTIVO', x + CARD_W / 2, y + 9, { align: 'center' });

  // Foto
  const photoSize = 45;
  const px = x + (CARD_W - photoSize) / 2;
  const py = y + 18;
  try { pdf.addImage(photoData, 'JPEG', px, py, photoSize, photoSize); } catch { /* noop */ }
  pdf.setDrawColor(100); pdf.rect(px, py, photoSize, photoSize, 'S');

  // Nome
  pdf.setTextColor(...PRIMARY);
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
  pdf.text(`No ${code}`, x + CARD_W / 2, y + CARD_H - 4, { align: 'center' });
}

function drawBack(pdf: jsPDF, x: number, y: number, a: BadgeAthlete) {
  pdf.setDrawColor(...PRIMARY);
  pdf.setLineWidth(0.4);
  pdf.roundedRect(x, y, CARD_W, CARD_H, 3, 3, 'S');

  // Cabeçalho
  pdf.setFillColor(...PRIMARY);
  pdf.rect(x, y, CARD_W, 10, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('INFORMAÇÕES DE EMERGÊNCIA', x + CARD_W / 2, y + 6.5, { align: 'center' });

  // Bloco de tipo sanguíneo (caixa destacada)
  const ts = a.tipo_sanguineo?.trim() || '—';
  pdf.setFillColor(220, 38, 38);
  pdf.roundedRect(x + 4, y + 13, 26, 18, 1.5, 1.5, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text('TIPO SANGUÍNEO', x + 17, y + 18, { align: 'center' });
  pdf.setFontSize(14);
  pdf.text(ts, x + 17, y + 27, { align: 'center' });

  // Contato emergência (caixa)
  pdf.setTextColor(...PRIMARY);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.text('CONTATO DE EMERGÊNCIA', x + 33, y + 17);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  const ce = a.contato_emergencia || 'Não informado';
  const ceLines = pdf.splitTextToSize(ce, CARD_W - 36);
  pdf.text(ceLines.slice(0, 2), x + 33, y + 22);

  // Linhas detalhadas
  let dy = y + 38;
  const section = (label: string, value?: string | null, maxLines = 2) => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7);
    pdf.setTextColor(...ACCENT);
    pdf.text(label.toUpperCase(), x + 4, dy);
    dy += 3.2;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...PRIMARY);
    const lines = pdf.splitTextToSize(value && value.trim() ? value : 'Nenhum(a) informado(a).', CARD_W - 8);
    const shown = lines.slice(0, maxLines);
    pdf.text(shown, x + 4, dy);
    dy += shown.length * 3.6 + 2;
  };
  section('Alergias', a.alergias);
  section('Enfermidades / Condições', a.enfermidades);
  section('Observações', a.observacoes, 4);

  // Identificação inferior
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(...PRIMARY);
  pdf.text((a.nome || '').toUpperCase().slice(0, 30), x + 4, y + CARD_H - 12);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(6);
  pdf.setTextColor(120);
  const code = a.numero_atleta || a.id.slice(0, 8).toUpperCase();
  pdf.text(`ID ${code}`, x + 4, y + CARD_H - 7);
  pdf.text(a.eventName || '', x + 4, y + CARD_H - 3);
}

export async function generateBadgesPDF(athletes: BadgeAthlete[], filename = 'crachas.pdf') {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const photos = await Promise.all(athletes.map(a => loadPhoto(a.foto_url)));

  const perPage = COLS * ROWS;
  const totalGroups = Math.ceil(athletes.length / perPage);

  for (let g = 0; g < totalGroups; g++) {
    if (g > 0) pdf.addPage();
    // FRENTE
    for (let i = 0; i < perPage; i++) {
      const idx = g * perPage + i;
      if (idx >= athletes.length) break;
      const { x, y } = cardOrigin(i, false);
      drawFront(pdf, x, y, athletes[idx], photos[idx]);
    }
    // VERSO (nova página, espelhada)
    pdf.addPage();
    for (let i = 0; i < perPage; i++) {
      const idx = g * perPage + i;
      if (idx >= athletes.length) break;
      const { x, y } = cardOrigin(i, true);
      drawBack(pdf, x, y, athletes[idx]);
    }
  }

  pdf.save(filename);
}
