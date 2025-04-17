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

    // Check if user exists in organization_users
    console.log('supabase.js: Checking organization membership');
    const { data: orgUser, error: orgError } = await supabase
      .from('organization_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If user doesn't exist in organization_users, create a default entry
    if (!orgUser && !orgError) {
      console.log('supabase.js: Creating default organization membership');
      const { error: insertError } = await supabase
        .from('organization_users')
        .insert({
          user_id: user.id,
          organization_id: process.env.DEFAULT_ORG_ID || '00000000-0000-0000-0000-000000000000',
          role: 'member'
        });

      if (insertError) {
        console.error('supabase.js: Error creating organization membership:', insertError);
        throw insertError;
      }
    } else if (orgError && orgError.code !== 'PGRST116') {
      console.error('supabase.js: Organization error:', orgError);
      throw orgError;
    }

    // Handle different HTTP methods
    console.log('supabase.js: Handling', event.httpMethod, 'request');
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

        // Get user's organization
        const { data: userOrg, error: userOrgError } = await supabase
          .from('organization_users')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();

        if (userOrgError) {
          console.error('supabase.js: Error getting user organization:', userOrgError);
          throw userOrgError;
        }

        // Save new show
        const { data, error } = await supabase
          .from('shows')
          .insert({
            user_id: user.id,
            organization_id: userOrg.organization_id,
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