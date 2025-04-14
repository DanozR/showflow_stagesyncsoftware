import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Log environment setup
console.log('Edge Function Environment:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  url: supabaseUrl
});

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

    console.log('Request details:', {
      method: req.method,
      url: req.url,
      action,
      headers: Object.fromEntries(req.headers.entries())
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      throw new Error('No authorization header');
    }

    switch (action) {
      case 'session': {
        // Get token from query params as backup
        const token = url.searchParams.get('token') || authHeader.replace('Bearer ', '');
        if (!token) {
          console.error('No token found in request');
          throw new Error('No token provided');
        }

        console.log('Token validation attempt:', {
          tokenLength: token.length,
          tokenStart: token.substring(0, 10) + '...',
          tokenEnd: '...' + token.substring(token.length - 10)
        });

        try {
          // Verify the token and get user session
          console.log('Calling supabase.auth.getUser...');
          const { data, error } = await supabase.auth.getUser(token);
          
          console.log('Auth response:', {
            hasData: !!data,
            hasUser: !!data?.user,
            error: error ? {
              message: error.message,
              status: error.status,
              name: error.name
            } : null
          });

          if (error) {
            console.error('Token verification failed:', {
              error: {
                message: error.message,
                status: error.status,
                name: error.name,
                stack: error.stack
              },
              token: {
                length: token.length,
                start: token.substring(0, 10) + '...',
                end: '...' + token.substring(token.length - 10)
              }
            });
            throw new Error(`Token verification failed: ${error.message}`);
          }
          
          if (!data?.user) {
            console.error('No user data returned from auth check');
            throw new Error('No user found for token');
          }

          console.log('Successfully verified user:', {
            id: data.user.id,
            email: data.user.email,
            lastSignIn: data.user.last_sign_in_at
          });

          return new Response(JSON.stringify({ user: data.user }), {
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-store, no-cache, must-revalidate'
            },
          });
        } catch (authError) {
          console.error('Error during auth.getUser:', {
            error: {
              message: authError.message,
              name: authError.name,
              stack: authError.stack
            },
            token: {
              length: token.length,
              start: token.substring(0, 10) + '...',
              end: '...' + token.substring(token.length - 10)
            }
          });
          throw authError;
        }
      }

      default:
        console.error('Invalid action requested:', action);
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Auth function error:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      cause: error.cause
    });

    return new Response(
      JSON.stringify({ 
        error: error.message,
        name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message.includes('No token') || 
                error.message.includes('Invalid token') ? 401 : 400,
      }
    );
  }
});