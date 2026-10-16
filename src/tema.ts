import type { TipoLocal } from './data/tipos';

export const cor = {
  primaria: '#2B6CD4',
  primariaEscura: '#2257AD',
  primariaSuave: '#E1ECFC',
  fundo: '#F4F8FE',
  superficie: '#FFFFFF',
  borda: '#DCE6F4',
  texto: '#16202F',
  suave: '#586579',
  destaque: '#F2B33D',
  radio: '#9FB0C8',
  alca: '#D4DEED',
  divisoria: '#EEF3FA',
  perigo: '#B42318',
  branco: '#FFFFFF',
  sombra: 'rgba(22, 32, 47, 0.45)',
};

export const fonte = {
  regular: 'AtkinsonHyperlegible_400Regular',
  negrito: 'AtkinsonHyperlegible_700Bold',
  titulo: 'BricolageGrotesque_800ExtraBold',
};

export const tintaTipo: Record<TipoLocal, { fundo: string; frente: string }> = {
  apto: { fundo: '#E1ECFC', frente: '#2B6CD4' },
  casa: { fundo: '#FCEFD3', frente: '#8A5A00' },
  loja: { fundo: '#ECE4F8', frente: '#5B3A99' },
};

/** Largura máxima do conteúdo em telas grandes (computador/tablet). */
export const LARGURA_MAX = 560;
