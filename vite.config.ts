import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

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
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Create a separate chunk for Supabase-related code
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
          }
        }
      },
      // Replace sensitive environment variables with empty strings in production
      define: {
        'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('')
      }
    }
  };
});