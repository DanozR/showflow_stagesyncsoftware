import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    switch (action) {
      case 'session': {
        const token = url.searchParams.get('token');
        if (!token) {
          throw new Error('No token provided');
        }

        // Verify the token and get user session
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          throw new Error('Invalid token');
        }

        return new Response(JSON.stringify({ user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});