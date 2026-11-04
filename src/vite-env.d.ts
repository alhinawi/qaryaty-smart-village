/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL. Leave empty to run on the built-in sample data. */
  readonly VITE_SUPABASE_URL?: string;
  /** Supabase anon (public) key. Safe in the browser; RLS protects the data. */
  readonly VITE_SUPABASE_ANON_KEY?: string;
  /** 'mock' forces the sample data even when Supabase is configured. */
  readonly VITE_DATA_SOURCE?: 'mock' | 'supabase';
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
