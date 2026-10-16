import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { nuvemConfigurada, supabase } from './supabase';

type Papel = 'admin' | 'membro';

interface Sessao {
  carregando: boolean;
  modo: 'nuvem' | 'demo';
  logado: boolean;
  /** Está na lista de membros liberada pelo administrador. */
  temAcesso: boolean;
  admin: boolean;
  nome: string | null;
  email: string | null;
  /** Manda o código de acesso por e-mail. Retorna a mensagem de erro, se houver. */
  enviarCodigo(email: string): Promise<string | null>;
  confirmarCodigo(email: string, codigo: string): Promise<string | null>;
  definirNome(nome: string): Promise<string | null>;
  sair(): Promise<void>;
  /** Consulta de novo se o e-mail foi liberado (ex.: depois que o admin incluir). */
  verificarAcesso(): void;
}

const Contexto = createContext<Sessao | null>(null);
const CHAVE_NOME_DEMO = 'diarias-nome';

function traduzirErro(msg: string): string {
  if (/rate limit|too many|security purposes/i.test(msg))
    return 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.';
  if (/expired|invalid|otp/i.test(msg)) return 'Código errado ou vencido. Confira o e-mail ou peça um novo código.';
  if (/network|fetch/i.test(msg)) return 'Sem conexão com a internet. Tente de novo.';
  return msg;
}

export const normalizarEmail = (e: string) => e.trim().toLowerCase();

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true);
  const [sessao, setSessao] = useState<Session | null>(null);
  // Papel do e-mail logado ("de" guarda para qual e-mail a consulta foi feita).
  const [tentativa, setTentativa] = useState(0);
  const [papelDe, setPapelDe] = useState<{ de: string; papel: Papel | null } | null>(null);
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

  // Descobre se o e-mail logado está liberado e se é o administrador.
  const email = sessao?.user.email ? normalizarEmail(sessao.user.email) : null;
  useEffect(() => {
    if (!supabase || !email) return;
    let ativo = true;
    supabase
      .from('membros')
      .select('papel')
      .eq('email', email)
      .maybeSingle()
      .then(({ data }) => {
        if (ativo) setPapelDe({ de: email, papel: (data?.papel as Papel | undefined) ?? null });
      });
    return () => {
      ativo = false;
    };
  }, [email, tentativa]);
  const checandoPapel = Boolean(email) && papelDe?.de !== email;
  const papel = papelDe?.de === email ? papelDe.papel : null;

  const enviarCodigo = useCallback(async (emailDigitado: string) => {
    if (!supabase) return null;
    const e = normalizarEmail(emailDigitado);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Digite um e-mail válido.';
    const { data: liberado, error: erroLista } = await supabase.rpc('email_liberado', { p_email: e });
    if (erroLista) return traduzirErro(erroLista.message);
    if (!liberado) return 'Esse e-mail ainda não tem acesso. Peça para o administrador incluir você em Membros.';
    const { error } = await supabase.auth.signInWithOtp({ email: e, options: { shouldCreateUser: true } });
    return error ? traduzirErro(error.message) : null;
  }, []);

  const confirmarCodigo = useCallback(async (emailDigitado: string, codigo: string) => {
    if (!supabase) return null;
    const token = codigo.replace(/\D/g, '');
    if (token.length < 6) return 'O código tem 6 números. Confira no e-mail.';
    const { error } = await supabase.auth.verifyOtp({ email: normalizarEmail(emailDigitado), token, type: 'email' });
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
    const verificarAcesso = () => {
      setPapelDe(null);
      setTentativa((t) => t + 1);
    };
    const comuns = { enviarCodigo, confirmarCodigo, definirNome, sair, verificarAcesso };
    if (!nuvemConfigurada) {
      return { ...comuns, carregando, modo: 'demo', logado: true, temAcesso: true, admin: false, nome: nomeDemo, email: null };
    }
    const nome = (sessao?.user.user_metadata?.nome as string | undefined) ?? null;
    return {
      ...comuns,
      carregando: carregando || checandoPapel,
      modo: 'nuvem',
      logado: Boolean(sessao),
      temAcesso: papel !== null,
      admin: papel === 'admin',
      nome,
      email,
    };
  }, [carregando, checandoPapel, sessao, papel, email, nomeDemo, enviarCodigo, confirmarCodigo, definirNome, sair]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): Sessao {
  const s = useContext(Contexto);
  if (!s) throw new Error('useSessao fora do SessaoProvider');
  return s;
}
