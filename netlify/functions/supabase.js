const { createClient } = require('@supabase/supabase-js');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get token from Authorization header
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No authorization token');
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid token');
    }

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET': {
        // Get shows for the authenticated user
        const { data, error } = await supabase
          .from('shows')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        };
      }

      case 'POST': {
        const body = JSON.parse(event.body);

        // Save new show
        const { data, error } = await supabase
          .from('shows')
          .insert({
            user_id: user.id,
            show_name: body.showName,
            name: body.showInfo.name,
            data: {
              classes: body.classes,
              students: body.students,
              conflicts: body.conflicts,
              showInfo: body.showInfo
            }
          })
          .select()
          .single();

        if (error) throw error;

        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        };
      }

      case 'PUT': {
        const body = JSON.parse(event.body);

        // Update existing show
        const { data, error } = await supabase
          .from('shows')
          .update({
            name: body.showInfo.name,
            data: {
              classes: body.classes,
              students: body.students,
              conflicts: body.conflicts,
              showInfo: body.showInfo
            }
          })
          .eq('id', body.showId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        };
      }

      case 'DELETE': {
        const body = JSON.parse(event.body);

        // Delete show
        const { error } = await supabase
          .from('shows')
          .delete()
          .eq('id', body.showId)
          .eq('user_id', user.id);

        if (error) throw error;

        return {
          statusCode: 204,
          headers: corsHeaders
        };
      }

      default:
        return {
          statusCode: 405,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: 'Method not allowed'
          })
        };
    }
  } catch (error) {
    return {
      statusCode: error.statusCode || 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    };
  }
};