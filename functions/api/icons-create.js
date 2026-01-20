// POST /api/icons-create - Create new icon type (requires authentication)
import { createSupabaseClient, getAccessToken, jsonResponse, errorResponse } from './_supabase.js';

export async function onRequestPost(context) {
  try {
    const accessToken = getAccessToken(context.request);
    if (!accessToken) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = createSupabaseClient(context.env, accessToken);

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    // Parse request body
    const body = await context.request.json();
    const { code, name, svg_data, background_color, sort_order = 0 } = body;

    // Validate required fields
    if (!code || !name || !svg_data) {
      return errorResponse('Missing required fields: code, name, svg_data');
    }

    // Validate code format (uppercase alphanumeric)
    if (!/^[A-Z0-9]{2,20}$/.test(code)) {
      return errorResponse('Invalid code format. Must be 2-20 uppercase alphanumeric characters.');
    }

    // Validate background_color format if provided
    if (background_color && !/^#[0-9A-Fa-f]{6}$/.test(background_color)) {
      return errorResponse('Invalid background_color format. Must be a hex color code (e.g., #F7931A).');
    }

    // Insert new icon type
    const { data, error } = await supabase
      .from('icon_types')
      .insert({
        code: code.toUpperCase(),
        name,
        svg_data,
        background_color: background_color || null,
        sort_order: parseInt(sort_order, 10) || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === '23505') { // Unique violation
        return errorResponse('Icon type with this code already exists', 409);
      }
      return errorResponse('Failed to create icon type', 500);
    }

    return jsonResponse({ success: true, data }, 201);
  } catch (err) {
    console.error('Error:', err);
    return errorResponse('Internal server error', 500);
  }
}

// Handle OPTIONS for CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
