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
        const token = authHeader.replace('Bearer ', '');
        if (!token) {
          throw new Error('No token provided');
        }

        // Verify the token and get user session
        const { data, error } = await supabase.auth.getUser(token);

        if (error) {
          throw error;
        }

        if (!data?.user) {
          throw new Error('No user found for token');
        }

        return new Response(JSON.stringify({ user: data.user }), {
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
    return new Response(
      JSON.stringify({ error: error.message }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('No token') || 
                error.message.includes('Invalid token') ? 401 : 400,
      }
    );
  }
});