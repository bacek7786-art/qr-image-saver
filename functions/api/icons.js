// GET/POST/PUT /api/icons - Icon types management
import { createSupabaseClient, createSupabaseAdminClient, jsonResponse, errorResponse, getAccessToken } from './_supabase.js';

// GET /api/icons - Get all active icon types
export async function onRequestGet(context) {
  try {
    const supabase = createSupabaseClient(context.env);

    const { data, error } = await supabase
      .from('icon_types')
      .select('id, code, name, svg_data, background_color, sort_order, is_active')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return errorResponse('Failed to fetch icon types', 500);
    }

    return jsonResponse({ success: true, data });
  } catch (err) {
    console.error('Error:', err);
    return errorResponse('Internal server error', 500);
  }
}

// POST /api/icons - Create new icon type
export async function onRequestPost(context) {
  try {
    // Verify authentication
    const accessToken = getAccessToken(context.request);
    if (!accessToken) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = createSupabaseClient(context.env, accessToken);

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await context.request.json();
    const { code, name, svg_data, background_color, sort_order } = body;

    // Validation
    if (!code || !name) {
      return errorResponse('Code and name are required', 400);
    }

    if (!svg_data) {
      return errorResponse('SVG data is required', 400);
    }

    // Check for duplicate code
    const { data: existing } = await supabase
      .from('icon_types')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();

    if (existing) {
      return errorResponse('Icon code already exists', 400);
    }

    // Insert new icon type
    const { data, error } = await supabase
      .from('icon_types')
      .insert({
        code: code.toUpperCase(),
        name,
        svg_data,
        background_color: background_color || '#666666',
        sort_order: sort_order || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return errorResponse('Failed to create icon type', 500);
    }

    return jsonResponse({ success: true, data }, 201);
  } catch (err) {
    console.error('Error:', err);
    return errorResponse('Internal server error', 500);
  }
}

// PUT /api/icons - Update icon type (expects id in body)
export async function onRequestPut(context) {
  try {
    // Verify authentication
    const accessToken = getAccessToken(context.request);
    if (!accessToken) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = createSupabaseClient(context.env, accessToken);

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const body = await context.request.json();
    const { id, code, name, svg_data, background_color, sort_order, is_active } = body;

    if (!id) {
      return errorResponse('Icon ID is required', 400);
    }

    // Build update object
    const updateData = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (name !== undefined) updateData.name = name;
    if (svg_data !== undefined) updateData.svg_data = svg_data;
    if (background_color !== undefined) updateData.background_color = background_color;
    if (sort_order !== undefined) updateData.sort_order = sort_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update icon type
    const { data, error } = await supabase
      .from('icon_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return errorResponse('Failed to update icon type', 500);
    }

    if (!data) {
      return errorResponse('Icon type not found', 404);
    }

    return jsonResponse({ success: true, data });
  } catch (err) {
    console.error('Error:', err);
    return errorResponse('Internal server error', 500);
  }
}

// OPTIONS for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
