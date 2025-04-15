/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_DASHBOARD_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __SUPABASE_URL__: string;
declare const __SUPABASE_KEY__: string;
declare const __DASHBOARD_URL__: string;