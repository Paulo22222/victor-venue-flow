import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompetitionState, Jogo } from '@/types/competition';

export const generateCompetitionPDF = (state: CompetitionState) => {
  const doc = new jsPDF();
  const { evento, competidores, jogos, resultados, disputa, logistica } = state;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('IF Competition 2026', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Relatório Oficial da Competição', 105, 27, { align: 'center' });

  // Line separator
  doc.setDrawColor(34, 139, 94);
  doc.setLineWidth(0.5);
  doc.line(20, 32, 190, 32);

  // Event info
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Dados do Evento', 20, 42);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const info = [
    ['Evento', evento.nome || '—'],
    ['Data', evento.data || '—'],
    ['Horário', evento.horario || '—'],
    ['Local', evento.local || logistica.local || '—'],
    ['Modalidade', evento.modalidade || '—'],
    ['Organizador(es)', evento.organizadores || '—'],
    ['Sistema de Disputa', disputa.sistema || '—'],
    ['Tipo', competidores.tipo || '—'],
  ];

  autoTable(doc, {
    startY: 46,
    head: [],
    body: info,
    theme: 'plain',
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 45 },
      1: { cellWidth: 120 },
    },
    margin: { left: 20 },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 10;

  // Matches results
  if (jogos.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resultados dos Jogos', 20, currentY);
    currentY += 4;

    const matchData = jogos.map(j => {
      const r = resultados[j.id];
      return [
        `${j.rodada}`,
        j.participanteA,
        r ? `${r.placarA}` : '-',
        'x',
        r ? `${r.placarB}` : '-',
        j.participanteB,
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Rd', 'Participante A', 'Placar', '', 'Placar', 'Participante B']],
      body: matchData,
      theme: 'striped',
      styles: { fontSize: 9, halign: 'center' },
      headStyles: { fillColor: [34, 139, 94], textColor: 255 },
      columnStyles: {
        1: { halign: 'left' },
        5: { halign: 'left' },
      },
      margin: { left: 20 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Ranking
  const pontos: Record<string, number> = {};
  const nomes = competidores.tipo === 'individual'
    ? competidores.atletas.map(a => a.nome)
    : competidores.equipes.map(e => e.nome);
  nomes.forEach(n => (pontos[n] = 0));
  jogos.forEach(j => {
    const r = resultados[j.id];
    if (r) {
      if (r.placarA > r.placarB) pontos[j.participanteA] = (pontos[j.participanteA] || 0) + 3;
      else if (r.placarB > r.placarA) pontos[j.participanteB] = (pontos[j.participanteB] || 0) + 3;
      else {
        pontos[j.participanteA] = (pontos[j.participanteA] || 0) + 1;
        pontos[j.participanteB] = (pontos[j.participanteB] || 0) + 1;
      }
    }
  });

  const ranking = Object.entries(pontos).sort((a, b) => b[1] - a[1]);

  if (ranking.length > 0) {
    // Check if we need a new page
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Classificação Final', 20, currentY);
    currentY += 4;

    const rankData = ranking.map(([nome, pts], i) => [
      `${i + 1}º`,
      nome,
      `${pts}`,
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Pos.', 'Participante', 'Pontos']],
      body: rankData,
      theme: 'striped',
      styles: { fontSize: 9, halign: 'center' },
      headStyles: { fillColor: [34, 139, 94], textColor: 255 },
      columnStyles: {
        1: { halign: 'left' },
      },
      margin: { left: 20 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128);
    doc.text(
      `IF Competition 2026 — Prof. Marcos Roberto dos Santos — IFTM, Paracatu, MG — Página ${i}/${pageCount}`,
      105,
      290,
      { align: 'center' }
    );
  }

  doc.save(`Relatorio_${evento.nome || 'Competicao'}.pdf`);
};
