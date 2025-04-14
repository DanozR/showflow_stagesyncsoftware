import { createClient } from 'npm:@supabase/supabase-js@2.39.8';
import { corsHeaders } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get the user from the token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid token');
    }

    // Parse the request URL
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    // Handle different actions
    switch (action) {
      case 'save':
        if (req.method !== 'POST') {
          throw new Error('Method not allowed');
        }
        const saveData = await req.json();
        const { data: savedShow, error: saveError } = await supabase
          .from('shows')
          .insert({
            user_id: user.id,
            show_name: saveData.showName,
            name: saveData.showInfo.name,
            data: {
              classes: saveData.classes,
              students: saveData.students,
              conflicts: saveData.conflicts,
              showInfo: saveData.showInfo
            },
            version: 1
          })
          .select()
          .single();

        if (saveError) throw saveError;
        return new Response(JSON.stringify(savedShow), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'update':
        if (req.method !== 'PUT') {
          throw new Error('Method not allowed');
        }
        const updateData = await req.json();
        const { data: updatedShow, error: updateError } = await supabase
          .from('shows')
          .update({
            name: updateData.showInfo.name,
            data: {
              classes: updateData.classes,
              students: updateData.students,
              conflicts: updateData.conflicts,
              showInfo: updateData.showInfo
            }
          })
          .eq('id', updateData.showId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (updateError) throw updateError;
        return new Response(JSON.stringify(updatedShow), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'load':
        if (req.method !== 'GET') {
          throw new Error('Method not allowed');
        }
        const showId = url.searchParams.get('id');
        if (!showId) {
          throw new Error('Show ID is required');
        }

        const { data: loadedShow, error: loadError } = await supabase
          .from('shows')
          .select()
          .eq('id', showId)
          .eq('user_id', user.id)
          .single();

        if (loadError) throw loadError;
        return new Response(JSON.stringify(loadedShow), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'list':
        if (req.method !== 'GET') {
          throw new Error('Method not allowed');
        }

        const { data: shows, error: listError } = await supabase
          .from('shows')
          .select()
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        if (listError) throw listError;
        return new Response(JSON.stringify(shows), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'delete':
        if (req.method !== 'DELETE') {
          throw new Error('Method not allowed');
        }
        const deleteId = url.searchParams.get('id');
        if (!deleteId) {
          throw new Error('Show ID is required');
        }

        const { error: deleteError } = await supabase
          .from('shows')
          .delete()
          .eq('id', deleteId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
        return new Response(null, {
          headers: corsHeaders,
          status: 204,
        });

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