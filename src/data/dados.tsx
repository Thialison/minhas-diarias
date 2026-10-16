import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState, Platform } from 'react-native';
import { backendDemo, backendNuvem } from './backends';
import { useSessao } from './sessao';
import { supabase } from './supabase';
import type { Backend, Faxina, Local, NovaFaxina, NovoLocal } from './tipos';

interface Dados {
  carregando: boolean;
  erro: string | null;
  locais: Local[];
  locaisAtivos: Local[];
  localPorId: Map<string, Local>;
  faxinas: Faxina[];
  recarregar(): Promise<void>;
  salvarLocal(l: NovoLocal): Promise<void>;
  /** Exclui se não tiver faxinas; senão arquiva (some das listas, mas o histórico continua). */
  removerLocal(id: string): Promise<'excluido' | 'arquivado'>;
  reativarLocal(id: string): Promise<void>;
  salvarFaxina(f: NovaFaxina): Promise<void>;
  excluirFaxina(id: string): Promise<void>;
}

const Contexto = createContext<Dados | null>(null);

export function DadosProvider({ children }: { children: ReactNode }) {
  const { logado, nome } = useSessao();
  const backend = useMemo<Backend>(() => (supabase ? backendNuvem(supabase) : backendDemo()), []);
  const [locais, setLocais] = useState<Local[]>([]);
  const [faxinas, setFaxinas] = useState<Faxina[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const pedido = useRef(0);

  const recarregar = useCallback(async () => {
    const meu = ++pedido.current;
    try {
      const r = await backend.carregar();
      if (meu !== pedido.current) return;
      setLocais(r.locais);
      setFaxinas(r.faxinas);
      setErro(null);
    } catch (e: any) {
      if (meu === pedido.current) setErro('Não foi possível carregar os dados. Verifique a internet.');
      console.warn(e);
    } finally {
      if (meu === pedido.current) setCarregando(false);
    }
  }, [backend]);

  useEffect(() => {
    if (!logado) {
      setLocais([]);
      setFaxinas([]);
      setCarregando(true);
      return;
    }
    recarregar();
    const parar = backend.assinar(() => recarregar());
    // Ao voltar para o app, busca de novo (o outro celular pode ter registrado algo).
    const sub = AppState.addEventListener('change', (estado) => estado === 'active' && recarregar());
    const aoVoltar = () => document.visibilityState === 'visible' && recarregar();
    if (Platform.OS === 'web') document.addEventListener('visibilitychange', aoVoltar);
    return () => {
      parar();
      sub.remove();
      if (Platform.OS === 'web') document.removeEventListener('visibilitychange', aoVoltar);
    };
  }, [logado, backend, recarregar]);

  const valor = useMemo<Dados>(() => {
    const localPorId = new Map(locais.map((l) => [l.id, l]));
    const depois = async <T,>(p: Promise<T>) => {
      const r = await p;
      await recarregar();
      return r;
    };
    return {
      carregando,
      erro,
      locais,
      locaisAtivos: locais.filter((l) => !l.arquivado),
      localPorId,
      faxinas,
      recarregar,
      salvarLocal: (l) => depois(backend.salvarLocal(l)),
      removerLocal: async (id) => {
        if (faxinas.some((f) => f.local_id === id)) {
          await depois(backend.arquivarLocal(id, true));
          return 'arquivado';
        }
        await depois(backend.excluirLocal(id));
        return 'excluido';
      },
      reativarLocal: (id) => depois(backend.arquivarLocal(id, false)),
      salvarFaxina: (f) => depois(backend.salvarFaxina({ ...f, criado_por_nome: f.id ? undefined : nome })),
      excluirFaxina: (id) => depois(backend.excluirFaxina(id)),
    };
  }, [carregando, erro, locais, faxinas, recarregar, backend, nome]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useDados(): Dados {
  const d = useContext(Contexto);
  if (!d) throw new Error('useDados fora do DadosProvider');
  return d;
}
