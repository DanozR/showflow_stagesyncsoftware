import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
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
    __SUPABASE_KEY__: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
    __SUPABASE_URL__: JSON.stringify(process.env.VITE_SUPABASE_URL),
    __DASHBOARD_URL__: JSON.stringify(process.env.VITE_DASHBOARD_URL)
  }
});