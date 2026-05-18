import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.error(
    'Missing Supabase environment variables: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY',
  );
} else {
  console.log('[Supabase] Connecting to:', supabaseUrl?.split('//')[1]);
}

export const supabase = createClient<Database>(
  supabaseUrl ?? 'http://placeholder.invalid',
  supabaseAnonKey ?? 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
