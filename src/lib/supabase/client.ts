/**
 * Supabase Client Configuration
 * Cliente para sincronização com backend
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
    },
});

// Helper para verificar se Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
    return Boolean(supabaseUrl && supabaseAnonKey);
};

// Helper para verificar se está online e com Supabase disponível
export const canSync = async (): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false;
    if (!navigator.onLine) return false;

    try {
        const { error } = await supabase.from('organizations').select('count').limit(0);
        return !error;
    } catch {
        return false;
    }
};
