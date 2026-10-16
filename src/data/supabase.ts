import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Aceita a URL copiada com sobras (ex.: ".../rest/v1/", espaços ou barra no fim).
const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()
  .replace(/\/+$/, '')
  .replace(/\/(rest|auth|realtime|storage)\/v1$/, '')
  .replace(/\/+$/, '');
const chave = process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim();

/** Sem as variáveis de ambiente o app roda em modo demonstração (dados só neste aparelho). */
export const nuvemConfigurada = Boolean(url && chave);

export const supabase: SupabaseClient | null = nuvemConfigurada
  ? createClient(url!, chave!, {
      auth: {
        storage: Platform.OS === 'web' ? undefined : AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
