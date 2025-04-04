import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    define: {
      // Stringify all environment variables
      'process.env': {
        NODE_ENV: JSON.stringify(mode),
        VITE_SUPABASE_URL: JSON.stringify(env.VITE_SUPABASE_URL),
        VITE_SUPABASE_ANON_KEY: JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
        VITE_DASHBOARD_URL: JSON.stringify(env.VITE_DASHBOARD_URL),
        VITE_SHOWFLOW_URL: JSON.stringify(env.VITE_SHOWFLOW_URL),
        VITE_BACKSTAGEPRO_URL: JSON.stringify(env.VITE_BACKSTAGEPRO_URL),
        VITE_DASHBOARD_SUPABASE_URL: JSON.stringify(env.VITE_DASHBOARD_SUPABASE_URL),
        VITE_DASHBOARD_SUPABASE_ANON_KEY: JSON.stringify(env.VITE_DASHBOARD_SUPABASE_ANON_KEY)
      }
    }
  };
});