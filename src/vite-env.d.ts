/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_DASHBOARD_URL: string
  readonly VITE_SHOWFLOW_URL: string
  readonly VITE_BACKSTAGEPRO_URL: string
  readonly VITE_DASHBOARD_SUPABASE_URL: string
  readonly VITE_DASHBOARD_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}