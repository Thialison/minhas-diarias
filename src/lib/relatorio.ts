// Monta o texto do relatório que vai para o WhatsApp.
// O WhatsApp mostra em negrito o que está entre *asteriscos*.

import { MESES, parseYmd, ultimoDiaDoMes, ymd } from './datas.ts';
import { brlCentavos } from './dinheiro.ts';

export type PeriodoRelatorio = 'q1' | 'q2' | 'mes';

export interface ItemRelatorio {
  data: string; // AAAA-MM-DD
  valor: number;
  local: string; // nome do local
}

export interface Linha {
  texto: string;
  negrito: boolean;
}

export interface Relatorio {
  linhas: Linha[];
  /** Texto pronto para o WhatsApp, com *negrito*. */
  texto: string;
  quantidade: number;
  total: number;
}

const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const dois = (n: number) => String(n).padStart(2, '0');
const qtd = (n: number) => `${n} ${n === 1 ? 'faxina' : 'faxinas'}`;
const soma = (itens: ItemRelatorio[]) => Math.round(itens.reduce((s, i) => s + i.valor, 0) * 100) / 100;

function linhaItem(i: ItemRelatorio): Linha {
  const d = parseYmd(i.data);
  return {
    texto: `${dois(d.getDate())}/${dois(d.getMonth() + 1)} (${DIAS_CURTOS[d.getDay()]}) – ${i.local} – ${brlCentavos(i.valor)}`,
    negrito: false,
  };
}

/** Dias (início e fim) do período dentro do mês. */
export function diasDoPeriodo(periodo: PeriodoRelatorio, ano: number, mes: number): [number, number] {
  const ult = ultimoDiaDoMes(ano, mes);
  if (periodo === 'q1') return [1, 15];
  if (periodo === 'q2') return [16, ult];
  return [1, ult];
}

export function gerarRelatorio(itens: ItemRelatorio[], periodo: PeriodoRelatorio, ano: number, mes: number): Relatorio {
  const [ini, fim] = diasDoPeriodo(periodo, ano, mes);
  const inicio = ymd(ano, mes, ini);
  const final = ymd(ano, mes, fim);
  const doPeriodo = itens
    .filter((i) => i.data >= inicio && i.data <= final)
    .sort((a, b) => (a.data === b.data ? a.local.localeCompare(b.local) : a.data.localeCompare(b.data)));
  const nomeMes = `${MESES[mes - 1]}/${ano}`;
  const vazio: Linha = { texto: '', negrito: false };
  const L: Linha[] = [];

  if (periodo === 'mes') {
    L.push({ texto: `Faxinas – ${nomeMes}`, negrito: true });
    const ult = ultimoDiaDoMes(ano, mes);
    const quinzenas: [string, number, number][] = [
      ['1ª quinzena (01 a 15)', 1, 15],
      [`2ª quinzena (16 a ${ult})`, 16, ult],
    ];
    for (const [titulo, de, ate] of quinzenas) {
      const q = doPeriodo.filter((i) => {
        const dia = Number(i.data.slice(8));
        return dia >= de && dia <= ate;
      });
      L.push(vazio, { texto: titulo, negrito: true });
      if (q.length === 0) L.push({ texto: 'Nenhuma faxina', negrito: false });
      L.push(...q.map(linhaItem));
      L.push({ texto: `Subtotal: ${qtd(q.length)} – ${brlCentavos(soma(q))}`, negrito: false });
    }
    L.push(vazio, { texto: `Total do mês: ${qtd(doPeriodo.length)} – ${brlCentavos(soma(doPeriodo))}`, negrito: true });
  } else {
    L.push({ texto: `Faxinas – ${periodo === 'q1' ? '1ª' : '2ª'} quinzena de ${nomeMes}`, negrito: true });
    L.push({ texto: `${dois(ini)}/${dois(mes)} a ${dois(fim)}/${dois(mes)}`, negrito: false });
    L.push(vazio);
    if (doPeriodo.length === 0) L.push({ texto: 'Nenhuma faxina neste período', negrito: false });
    L.push(...doPeriodo.map(linhaItem));
    L.push(vazio, { texto: `Total: ${qtd(doPeriodo.length)} – ${brlCentavos(soma(doPeriodo))}`, negrito: true });
  }

  const texto = L.map((l) => (l.negrito && l.texto ? `*${l.texto}*` : l.texto)).join('\n');
  return { linhas: L, texto, quantidade: doPeriodo.length, total: soma(doPeriodo) };
}

export function linkWhatsApp(texto: string): string {
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}
