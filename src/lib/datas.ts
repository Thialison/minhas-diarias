// Datas sempre como texto 'AAAA-MM-DD' (dia local, sem fuso).
// Assim uma faxina de "16/10" continua sendo 16/10 em qualquer celular.

export type Ymd = string;
export type Periodo = 'dia' | 'semana' | 'q1' | 'q2' | 'mes';
export interface Intervalo {
  inicio: Ymd;
  fim: Ymd;
}

export const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
const MESES_CURTOS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const DIAS_CURTOS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
export const LETRAS_SEMANA = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const dois = (n: number) => String(n).padStart(2, '0');

export function toYmd(d: Date): Ymd {
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}`;
}

export function parseYmd(s: Ymd): Date {
  const [a, m, d] = s.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function hoje(agora: Date = new Date()): Ymd {
  return toYmd(agora);
}

export function addDias(s: Ymd, n: number): Ymd {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return toYmd(d);
}

/** mes de 1 a 12 */
export function ultimoDiaDoMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

export function anoMes(s: Ymd): { ano: number; mes: number } {
  const [a, m] = s.split('-').map(Number);
  return { ano: a, mes: m };
}

export function ymd(ano: number, mes: number, dia: number): Ymd {
  return `${ano}-${dois(mes)}-${dois(dia)}`;
}

/** Semana de domingo a sábado, quinzenas 1–15 e 16–último dia. */
export function intervalo(periodo: Periodo, ref: Ymd): Intervalo {
  const { ano, mes } = anoMes(ref);
  const ultimo = ultimoDiaDoMes(ano, mes);
  switch (periodo) {
    case 'dia':
      return { inicio: ref, fim: ref };
    case 'semana': {
      const dow = parseYmd(ref).getDay();
      return { inicio: addDias(ref, -dow), fim: addDias(ref, 6 - dow) };
    }
    case 'q1':
      return { inicio: ymd(ano, mes, 1), fim: ymd(ano, mes, 15) };
    case 'q2':
      return { inicio: ymd(ano, mes, 16), fim: ymd(ano, mes, ultimo) };
    case 'mes':
      return { inicio: ymd(ano, mes, 1), fim: ymd(ano, mes, ultimo) };
  }
}

export function dentro(data: Ymd, i: Intervalo): boolean {
  return data >= i.inicio && data <= i.fim;
}

export function mudarMes(ano: number, mes: number, delta: number): { ano: number; mes: number } {
  const d = new Date(ano, mes - 1 + delta, 1);
  return { ano: d.getFullYear(), mes: d.getMonth() + 1 };
}

const maiuscula = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function nomeMes(ano: number, mes: number): string {
  return `${maiuscula(MESES[mes - 1])} ${ano}`;
}

/** "Sexta, 16 de outubro" */
export function tituloDia(s: Ymd): string {
  const d = parseYmd(s);
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/** "SEX, 16 OUT · HOJE" */
export function rotuloGrupo(s: Ymd, hojeYmd: Ymd): string {
  const d = parseYmd(s);
  const base = `${DIAS_CURTOS[d.getDay()]}, ${d.getDate()} ${MESES_CURTOS[d.getMonth()]}`;
  if (s === hojeYmd) return `${base} · HOJE`;
  if (s === addDias(hojeYmd, -1)) return `${base} · ONTEM`;
  return base;
}

/** "Hoje", "Ontem" ou "12/10" */
export function quando(s: Ymd, hojeYmd: Ymd): string {
  if (s === hojeYmd) return 'Hoje';
  if (s === addDias(hojeYmd, -1)) return 'Ontem';
  const d = parseYmd(s);
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}`;
}

/** Células do calendário (domingo primeiro): null = espaço vazio. */
export function gradeDoMes(ano: number, mes: number): (Ymd | null)[] {
  const primeiroDow = new Date(ano, mes - 1, 1).getDay();
  const total = ultimoDiaDoMes(ano, mes);
  const celulas: (Ymd | null)[] = Array(primeiroDow).fill(null);
  for (let dia = 1; dia <= total; dia++) celulas.push(ymd(ano, mes, dia));
  while (celulas.length % 7 !== 0) celulas.push(null);
  return celulas;
}

export function saudacao(agora: Date = new Date()): string {
  const h = agora.getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}
