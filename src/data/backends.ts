import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Backend, Faxina, Local } from './tipos';

const porData = (a: Faxina, b: Faxina) =>
  a.data === b.data ? b.created_at.localeCompare(a.created_at) : b.data.localeCompare(a.data);

function normalizarLocal(r: any): Local {
  return { ...r, valor_padrao: Number(r.valor_padrao), arquivado: Boolean(r.arquivado) };
}
function normalizarFaxina(r: any): Faxina {
  return { ...r, valor: Number(r.valor) };
}

async function todasAsLinhas(sb: SupabaseClient, tabela: string, ordem: string): Promise<any[]> {
  const pagina = 1000;
  const linhas: any[] = [];
  for (let de = 0; ; de += pagina) {
    const { data, error } = await sb.from(tabela).select('*').order(ordem).range(de, de + pagina - 1);
    if (error) throw error;
    linhas.push(...(data ?? []));
    if (!data || data.length < pagina) return linhas;
  }
}

export function backendNuvem(sb: SupabaseClient): Backend {
  const ok = ({ error }: { error: unknown }) => {
    if (error) throw error;
  };
  return {
    modo: 'nuvem',
    async carregar() {
      const [locais, faxinas] = await Promise.all([
        todasAsLinhas(sb, 'locais', 'nome'),
        todasAsLinhas(sb, 'faxinas', 'data'),
      ]);
      return { locais: locais.map(normalizarLocal), faxinas: faxinas.map(normalizarFaxina).sort(porData) };
    },
    async salvarLocal({ id, ...campos }) {
      ok(id ? await sb.from('locais').update(campos).eq('id', id) : await sb.from('locais').insert(campos));
    },
    async arquivarLocal(id, arquivado) {
      ok(await sb.from('locais').update({ arquivado }).eq('id', id));
    },
    async excluirLocal(id) {
      ok(await sb.from('locais').delete().eq('id', id));
    },
    async salvarFaxina({ id, criado_por_nome, ...campos }) {
      ok(
        id
          ? await sb.from('faxinas').update(campos).eq('id', id)
          : await sb.from('faxinas').insert({ ...campos, criado_por_nome }),
      );
    },
    async excluirFaxina(id) {
      ok(await sb.from('faxinas').delete().eq('id', id));
    },
    assinar(aoMudar) {
      const canal = sb
        .channel('diarias-mudancas')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'faxinas' }, aoMudar)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'locais' }, aoMudar)
        .subscribe();
      return () => {
        sb.removeChannel(canal);
      };
    },
  };
}

const CHAVE_DEMO = 'diarias-demo-v1';
const novoId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

/** Guarda tudo só neste aparelho. Usado quando o Supabase ainda não foi configurado. */
export function backendDemo(): Backend {
  async function ler(): Promise<{ locais: Local[]; faxinas: Faxina[] }> {
    try {
      const bruto = await AsyncStorage.getItem(CHAVE_DEMO);
      if (bruto) return JSON.parse(bruto);
    } catch {}
    return { locais: [], faxinas: [] };
  }
  async function gravar(db: { locais: Local[]; faxinas: Faxina[] }) {
    await AsyncStorage.setItem(CHAVE_DEMO, JSON.stringify(db));
  }
  return {
    modo: 'demo',
    async carregar() {
      const db = await ler();
      return {
        locais: [...db.locais].sort((a, b) => a.nome.localeCompare(b.nome)),
        faxinas: [...db.faxinas].sort(porData),
      };
    },
    async salvarLocal({ id, ...campos }) {
      const db = await ler();
      if (id) db.locais = db.locais.map((l) => (l.id === id ? { ...l, ...campos } : l));
      else db.locais.push({ id: novoId(), arquivado: false, created_at: new Date().toISOString(), ...campos });
      await gravar(db);
    },
    async arquivarLocal(id, arquivado) {
      const db = await ler();
      db.locais = db.locais.map((l) => (l.id === id ? { ...l, arquivado } : l));
      await gravar(db);
    },
    async excluirLocal(id) {
      const db = await ler();
      if (db.faxinas.some((f) => f.local_id === id)) throw new Error('Local tem faxinas registradas.');
      db.locais = db.locais.filter((l) => l.id !== id);
      await gravar(db);
    },
    async salvarFaxina({ id, criado_por_nome, ...campos }) {
      const db = await ler();
      if (id) db.faxinas = db.faxinas.map((f) => (f.id === id ? { ...f, ...campos } : f));
      else
        db.faxinas.push({
          id: novoId(),
          created_at: new Date().toISOString(),
          criado_por_nome: criado_por_nome ?? null,
          ...campos,
        });
      await gravar(db);
    },
    async excluirFaxina(id) {
      const db = await ler();
      db.faxinas = db.faxinas.filter((f) => f.id !== id);
      await gravar(db);
    },
    assinar() {
      return () => {};
    },
  };
}
