function milhar(inteiro: number): string {
  return String(inteiro).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 2430 → "R$ 2.430" · 180.5 → "R$ 180,50" */
export function brl(valor: number): string {
  const negativo = valor < 0;
  const centavos = Math.round(Math.abs(valor) * 100);
  const inteiro = Math.floor(centavos / 100);
  const resto = centavos % 100;
  const texto = resto === 0 ? milhar(inteiro) : `${milhar(inteiro)},${String(resto).padStart(2, '0')}`;
  return `${negativo ? '-' : ''}R$ ${texto}`;
}

/** Valor para preencher o campo: 180 → "180,00" */
export function valorParaTexto(valor: number): string {
  const centavos = Math.round(valor * 100);
  return `${milhar(Math.floor(centavos / 100))},${String(centavos % 100).padStart(2, '0')}`;
}

/** Aceita "180", "180,50", "1.200,00", "R$ 1200.5". Retorna null se não for número. */
export function lerValor(texto: string): number | null {
  let t = texto.replace(/R\$|\s/g, '');
  if (!t) return null;
  if (t.includes(',')) {
    t = t.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, '');
  }
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Math.round(Number(t) * 100) / 100;
}

export function somar<T extends { valor: number }>(itens: T[]): number {
  return Math.round(itens.reduce((s, i) => s + i.valor, 0) * 100) / 100;
}
