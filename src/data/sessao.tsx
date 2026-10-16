import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { nuvemConfigurada, supabase } from './supabase';

interface Sessao {
  carregando: boolean;
  modo: 'nuvem' | 'demo';
  logado: boolean;
  nome: string | null;
  email: string | null;
  entrar(email: string, senha: string): Promise<string | null>;
  definirNome(nome: string): Promise<string | null>;
  sair(): Promise<void>;
}

const Contexto = createContext<Sessao | null>(null);
const CHAVE_NOME_DEMO = 'diarias-nome';

function traduzirErro(msg: string): string {
  if (/invalid login credentials/i.test(msg)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(msg)) return 'Este e-mail ainda não foi confirmado.';
  if (/network|fetch/i.test(msg)) return 'Sem conexão com a internet. Tente de novo.';
  return msg;
}

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<Session | null>(null);
  const [nomeDemo, setNomeDemo] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      AsyncStorage.getItem(CHAVE_NOME_DEMO)
        .then(setNomeDemo)
        .finally(() => setCarregando(false));
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session);
      setCarregando(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_evento, s) => setSessao(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    if (!supabase) return null;
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    return error ? traduzirErro(error.message) : null;
  }, []);

  const definirNome = useCallback(async (nome: string) => {
    const limpo = nome.trim();
    if (!supabase) {
      await AsyncStorage.setItem(CHAVE_NOME_DEMO, limpo);
      setNomeDemo(limpo);
      return null;
    }
    const { data, error } = await supabase.auth.updateUser({ data: { nome: limpo } });
    if (error) return traduzirErro(error.message);
    if (data.user) setSessao((s) => (s ? { ...s, user: data.user! } : s));
    return null;
  }, []);

  const sair = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    else {
      await AsyncStorage.removeItem(CHAVE_NOME_DEMO);
      setNomeDemo(null);
    }
  }, []);

  const valor = useMemo<Sessao>(() => {
    if (!nuvemConfigurada) {
      return { carregando, modo: 'demo', logado: true, nome: nomeDemo, email: null, entrar, definirNome, sair };
    }
    const nome = (sessao?.user.user_metadata?.nome as string | undefined) ?? null;
    return {
      carregando,
      modo: 'nuvem',
      logado: Boolean(sessao),
      nome,
      email: sessao?.user.email ?? null,
      entrar,
      definirNome,
      sair,
    };
  }, [carregando, sessao, nomeDemo, entrar, definirNome, sair]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): Sessao {
  const s = useContext(Contexto);
  if (!s) throw new Error('useSessao fora do SessaoProvider');
  return s;
}
