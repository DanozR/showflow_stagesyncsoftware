import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    switch (action) {
      case 'session': {
        // Get token from query params as backup
        const token = url.searchParams.get('token') || authHeader.replace('Bearer ', '');
        if (!token) {
          throw new Error('No token provided');
        }

        console.log('Verifying token:', token); // Add logging

        // Verify the token and get user session
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        console.log('Auth response:', { user, error }); // Add logging

        if (error) {
          throw new Error(`Token verification failed: ${error.message}`);
        }
        
        if (!user) {
          throw new Error('No user found for token');
        }

        return new Response(JSON.stringify({ user }), {
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store, no-cache, must-revalidate'
          },
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Auth function error:', error); // Add logging
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack // Include stack trace in development
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('No token') || error.message.includes('Invalid token') ? 401 : 400,
      }
    );
  }
});