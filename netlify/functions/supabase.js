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
    return {
      statusCode: 204,
      headers
    };
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Get token from Authorization header
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      throw new Error('Missing JWT');
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError) throw authError;

    // Check if user exists in organization_users
    const { data: orgUser, error: orgError } = await supabase
      .from('organization_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If user doesn't exist in organization_users, create a default entry
    if (!orgUser && !orgError) {
      const { error: insertError } = await supabase
        .from('organization_users')
        .insert({
          user_id: user.id,
          organization_id: process.env.DEFAULT_ORG_ID || '00000000-0000-0000-0000-000000000000',
          role: 'member'
        });

      if (insertError) throw insertError;
    } else if (orgError && orgError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is expected if user doesn't exist
      throw orgError;
    }

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET': {
        // Get shows for the authenticated user
        const { data, error } = await supabase
          .from('shows')
          .select(`
            *,
            organization_users!inner (
              organization_id,
              role
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

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
        const { showName, classes, students, conflicts, showInfo } = body;

        // Get user's organization
        const { data: userOrg, error: userOrgError } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (userOrgError) throw userOrgError;

        // Save new show
        const { data, error } = await supabase
          .from('shows')
          .insert({
            user_id: user.id,
            organization_id: userOrg.organization_id,
            show_name: showName,
            name: showInfo.name,
            data: {
              classes,
              students,
              conflicts,
              showInfo
            },
            version: 1
          })
          .select()
          .single();

        if (error) throw error;

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
        const { showId, classes, students, conflicts, showInfo } = body;

        // Update existing show
        const { data, error } = await supabase
          .from('shows')
          .update({
            name: showInfo.name,
            data: {
              classes,
              students,
              conflicts,
              showInfo
            }
          })
          .eq('id', showId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

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
        const { showId } = body;

        // Delete show
        const { error } = await supabase
          .from('shows')
          .delete()
          .eq('id', showId)
          .eq('user_id', user.id);

        if (error) throw error;

        return {
          statusCode: 204,
          headers
        };
      }

      default:
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
    console.error('Function error:', error);
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