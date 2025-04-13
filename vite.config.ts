import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
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
            // Create a separate chunk for Supabase to better control its bundling
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
          }
        }
      }
    },
    define: {
      // Prevent environment variables from being bundled in the client code
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(''),
      'process.env.SUPABASE_URL': JSON.stringify(''),
      // Only expose what's needed for the client
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    }
  };
});