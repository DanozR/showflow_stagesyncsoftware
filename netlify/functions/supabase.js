const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    console.log('supabase.js: Handling OPTIONS request');
    return {
      statusCode: 204,
      headers
    };
  }

  // Proxy for /netlify/functions/verify-token
  if (event.path.includes('/verify-token')) {
    console.log('supabase.js: Proxying verify-token request');
    try {
      // Get token from query parameter
      const urlParams = new URLSearchParams(event.queryStringParameters);
      const token = urlParams.get('token');
      console.log('supabase.js: Token to proxy:', token ? 'Present' : 'Missing');

      if (!token) {
        throw new Error('No token provided');
      }

      const dashboardUrl = process.env.DASHBOARD_URL;
      console.log('supabase.js: Dashboard URL:', dashboardUrl);

      // Construct the proxy URL with token as query parameter
      const proxyUrl = `${dashboardUrl}/netlify/functions/verify-token?token=${encodeURIComponent(token)}`;
      console.log('supabase.js: Proxying request');

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('supabase.js: Proxy response status:', response.status);
      const responseText = await response.text();

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('supabase.js: Parsed response:', data);
      } catch (parseError) {
        console.error('supabase.js: JSON parse error:', parseError);
        throw new Error('Invalid JSON response from verification service');
      }

      return {
        statusCode: response.status,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      };
    } catch (error) {
      console.error('supabase.js: Proxy error:', error);
      return {
        statusCode: 500,
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: error.message || 'Proxy error'
        })
      };
    }
  }

  try {
    console.log('supabase.js: Creating Supabase client');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Get token from Authorization header
    const token = event.headers.authorization?.replace('Bearer ', '');
    console.log('supabase.js: Token present:', !!token);
    
    if (!token) {
      console.log('supabase.js: No token provided');
      throw new Error('Missing JWT');
    }

    // Get user from token
    console.log('supabase.js: Getting user from token');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError) {
      console.error('supabase.js: Auth error:', authError);
      throw authError;
    }
    console.log('supabase.js: User found:', user.id);

    // Handle different HTTP methods
    console.log('supabase.js: Handling', event.httpMethod, 'request');
    switch (event.httpMethod) {
      case 'GET': {
        // Get shows for the authenticated user
        const { data, error } = await supabase
          .from('shows')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('supabase.js: Error fetching shows:', error);
          throw error;
        }

        console.log('supabase.js: Successfully fetched shows');
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        };
      }

      case 'POST': {
        const body = JSON.parse(event.body);
        console.log('supabase.js: Creating new show');

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
            },
            version: 1
          })
          .select()
          .single();

        if (error) {
          console.error('supabase.js: Error creating show:', error);
          throw error;
        }

        console.log('supabase.js: Successfully created show');
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        };
      }

      case 'PUT': {
        const body = JSON.parse(event.body);
        console.log('supabase.js: Updating show:', body.showId);

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

        if (error) {
          console.error('supabase.js: Error updating show:', error);
          throw error;
        }

        console.log('supabase.js: Successfully updated show');
        return {
          statusCode: 200,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        };
      }

      case 'DELETE': {
        const body = JSON.parse(event.body);
        console.log('supabase.js: Deleting show:', body.showId);

        // Delete show
        const { error } = await supabase
          .from('shows')
          .delete()
          .eq('id', body.showId)
          .eq('user_id', user.id);

        if (error) {
          console.error('supabase.js: Error deleting show:', error);
          throw error;
        }

        console.log('supabase.js: Successfully deleted show');
        return {
          statusCode: 204,
          headers
        };
      }

      default:
        console.log('supabase.js: Invalid method:', event.httpMethod);
        return {
          statusCode: 405,
          headers: {
            ...headers,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            error: 'Method not allowed'
          })
        };
    }
  } catch (error) {
    console.error('supabase.js: Function error:', error);
    return {
      statusCode: error.statusCode || 500,
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: error.message || 'Internal server error'
      })
    };
  }
};