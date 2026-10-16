import type { Ymd } from '../lib/datas';

export type TipoLocal = 'apto' | 'casa' | 'loja';

export const TIPOS: { id: TipoLocal; nome: string }[] = [
  { id: 'apto', nome: 'Apto' },
  { id: 'casa', nome: 'Casa' },
  { id: 'loja', nome: 'Loja' },
];

export const nomeTipo = (t: TipoLocal) => TIPOS.find((x) => x.id === t)?.nome ?? t;

export interface Local {
  id: string;
  nome: string;
  tipo: TipoLocal;
  valor_padrao: number;
  arquivado: boolean;
  created_at: string;
}

export interface Faxina {
  id: string;
  local_id: string;
  data: Ymd;
  valor: number;
  observacao: string | null;
  criado_por_nome: string | null;
  created_at: string;
}

export interface NovoLocal {
  id?: string;
  nome: string;
  tipo: TipoLocal;
  valor_padrao: number;
}

export interface NovaFaxina {
  id?: string;
  local_id: string;
  data: Ymd;
  valor: number;
  observacao: string | null;
  criado_por_nome?: string | null;
}

export interface Backend {
  modo: 'nuvem' | 'demo';
  carregar(): Promise<{ locais: Local[]; faxinas: Faxina[] }>;
  salvarLocal(l: NovoLocal): Promise<void>;
  arquivarLocal(id: string, arquivado: boolean): Promise<void>;
  excluirLocal(id: string): Promise<void>;
  salvarFaxina(f: NovaFaxina): Promise<void>;
  excluirFaxina(id: string): Promise<void>;
  /** Avisa quando algo mudou em outro celular. Retorna a função para parar. */
  assinar(aoMudar: () => void): () => void;
}
