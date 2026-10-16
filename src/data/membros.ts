import { supabase } from './supabase';

export interface Membro {
  email: string;
  papel: 'admin' | 'membro';
  incluido_em: string;
}

function cliente() {
  if (!supabase) throw new Error('Supabase não configurado');
  return supabase;
}

export async function listarMembros(): Promise<Membro[]> {
  const { data, error } = await cliente().from('membros').select('*').order('papel').order('email');
  if (error) throw error;
  return (data ?? []) as Membro[];
}

/** Retorna mensagem de erro amigável ou null. */
export async function incluirMembro(email: string): Promise<string | null> {
  const e = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Digite um e-mail válido.';
  const { error } = await cliente().from('membros').insert({ email: e, papel: 'membro' });
  if (!error) return null;
  if (error.code === '23505') return 'Esse e-mail já tem acesso.';
  return 'Não foi possível incluir. Verifique a internet e tente de novo.';
}

export async function removerMembro(email: string): Promise<void> {
  const { error } = await cliente().from('membros').delete().eq('email', email);
  if (error) throw error;
}
