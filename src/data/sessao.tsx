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
  /** Diz se o e-mail pode entrar e se já tem senha criada. */
  verificarEmail(email: string): Promise<{ situacao?: 'entrar' | 'criar_senha'; erro?: string }>;
  /** Entra com e-mail e senha. Retorna a mensagem de erro, se houver. */
  entrar(email: string, senha: string): Promise<string | null>;
  /** Primeiro acesso: cria a senha da pessoa (o e-mail precisa estar em Membros). */
  criarSenha(email: string, senha: string): Promise<string | null>;
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
  if (/invalid login credentials/i.test(msg)) return 'Senha incorreta. Confira e tente de novo.';
  if (/already registered|already been registered|user already exists/i.test(msg))
    return 'Esse e-mail já tem senha. Volte e entre com a senha.';
  if (/password should be at least|weak password/i.test(msg)) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (/email not confirmed/i.test(msg))
    return 'O Supabase está pedindo confirmação por e-mail. O administrador precisa desligar "Confirm email".';
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

  const verificarEmail = useCallback(async (emailDigitado: string) => {
    if (!supabase) return {};
    const e = normalizarEmail(emailDigitado);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return { erro: 'Digite um e-mail válido.' };
    const { data, error } = await supabase.rpc('situacao_email', { p_email: e });
    if (error) return { erro: traduzirErro(error.message) };
    if (data === 'sem_acesso')
      return { erro: 'Esse e-mail ainda não tem acesso. Peça para o administrador incluir você em Membros.' };
    return { situacao: data as 'entrar' | 'criar_senha' };
  }, []);

  const entrar = useCallback(async (emailDigitado: string, senha: string) => {
    if (!supabase) return null;
    if (!senha) return 'Digite sua senha.';
    const { error } = await supabase.auth.signInWithPassword({ email: normalizarEmail(emailDigitado), password: senha });
    return error ? traduzirErro(error.message) : null;
  }, []);

  const criarSenha = useCallback(async (emailDigitado: string, senha: string) => {
    if (!supabase) return null;
    if (senha.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.';
    const { data, error } = await supabase.auth.signUp({ email: normalizarEmail(emailDigitado), password: senha });
    if (error) return traduzirErro(error.message);
    if (!data.session)
      return 'Senha criada, mas o Supabase pediu confirmação por e-mail. O administrador precisa desligar "Confirm email" no Supabase.';
    return null;
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
    const comuns = { verificarEmail, entrar, criarSenha, definirNome, sair, verificarAcesso };
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
  }, [carregando, checandoPapel, sessao, papel, email, nomeDemo, verificarEmail, entrar, criarSenha, definirNome, sair]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSessao(): Sessao {
  const s = useContext(Contexto);
  if (!s) throw new Error('useSessao fora do SessaoProvider');
  return s;
}
