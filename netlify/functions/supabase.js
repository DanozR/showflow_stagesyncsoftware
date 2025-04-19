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
    // Get token from Authorization header
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new Error('No authorization token');
    }

    // Verify token with dashboard
    const verifyUrl = `${process.env.DASHBOARD_URL}/netlify/functions/verify-token?token=${token}`;
    const verifyResponse = await fetch(verifyUrl);
    const verifyData = await verifyResponse.json();

    if (!verifyData.valid || !verifyData.userId || verifyData.app !== 'showflow') {
      throw new Error('Invalid token');
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET': {
        // Get shows for the authenticated user
        const { data, error } = await supabase
          .from('shows')
          .select('*')
          .eq('user_id', verifyData.userId)
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
        
        const { data, error } = await supabase
          .from('shows')
          .insert({
            user_id: verifyData.userId,
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
          .eq('user_id', verifyData.userId)
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
        
        const { error } = await supabase
          .from('shows')
          .delete()
          .eq('id', body.showId)
          .eq('user_id', verifyData.userId);

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
    console.error('Function error:', error);
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