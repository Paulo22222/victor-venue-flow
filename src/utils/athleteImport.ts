import * as XLSX from 'xlsx';

export interface ImportRow {
  nome: string;
  telefone?: string;
  rg?: string;
  data_nascimento?: string;
  campus?: string;
  modalidade?: string;
  instituicao?: string;
  curso?: string;
  genero?: string;
}

export interface ParseResult {
  rows: ImportRow[];
  errors: { row: number; message: string }[];
}

const KEYS: Record<string, keyof ImportRow> = {
  'nome': 'nome', 'nome completo': 'nome',
  'telefone': 'telefone', 'celular': 'telefone',
  'rg': 'rg',
  'data nascimento': 'data_nascimento', 'data_nascimento': 'data_nascimento', 'nascimento': 'data_nascimento',
  'campus': 'campus', 'unidade': 'campus',
  'modalidade': 'modalidade', 'esporte': 'modalidade',
  'instituicao': 'instituicao', 'instituição': 'instituicao',
  'curso': 'curso',
  'genero': 'genero', 'gênero': 'genero', 'sexo': 'genero',
};

export async function parseAthletesFile(file: File): Promise<ParseResult> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const rows: ImportRow[] = [];
  const errors: { row: number; message: string }[] = [];
  raw.forEach((r, idx) => {
    const mapped: any = {};
    Object.keys(r).forEach(k => {
      const norm = String(k).trim().toLowerCase();
      const key = KEYS[norm];
      if (key) mapped[key] = String(r[k] ?? '').trim();
    });
    if (!mapped.nome) {
      errors.push({ row: idx + 2, message: 'Nome ausente' });
      return;
    }
    rows.push(mapped);
  });
  return { rows, errors };
}

export function downloadTemplate() {
  const ws = XLSX.utils.json_to_sheet([{
    nome: 'João da Silva', telefone: '11999990000', rg: '12.345.678-9',
    data_nascimento: '2003-05-10', campus: 'Campus Central',
    modalidade: 'FUTSAL', instituicao: 'IFXX', curso: 'Informática', genero: 'masculino',
  }]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Atletas');
  XLSX.writeFile(wb, 'modelo-atletas.xlsx');
}
