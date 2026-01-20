// PUT/DELETE /api/icons/[code] - Update or delete icon type (requires authentication)
import { createSupabaseClient, getAccessToken, jsonResponse, errorResponse } from '../_supabase.js';

// PUT - Update icon type
export async function onRequestPut(context) {
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

    const code = context.params.code?.toUpperCase();
    if (!code) {
      return errorResponse('Icon code is required');
    }

    // Parse request body
    const body = await context.request.json();
    const updates = {};

    // Only update provided fields
    const allowedFields = ['name', 'svg_data', 'background_color', 'sort_order', 'is_active'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Validate background_color format if provided
    if (updates.background_color && !/^#[0-9A-Fa-f]{6}$/.test(updates.background_color)) {
      return errorResponse('Invalid background_color format. Must be a hex color code (e.g., #F7931A).');
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('No valid fields to update');
    }

    // Update icon type
    const { data, error } = await supabase
      .from('icon_types')
      .update(updates)
      .eq('code', code)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') {
        return errorResponse('Icon type not found', 404);
      }
      return errorResponse('Failed to update icon type', 500);
    }

    return jsonResponse({ success: true, data });
  } catch (err) {
    console.error('Error:', err);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE - Delete icon type
export async function onRequestDelete(context) {
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

    const code = context.params.code?.toUpperCase();
    if (!code) {
      return errorResponse('Icon code is required');
    }

    // Check if icon is being used by any QR codes
    const { data: usedQRCodes, error: checkError } = await supabase
      .from('qr_codes')
      .select('id')
      .eq('icon_type', code)
      .limit(1);

    if (checkError) {
      console.error('Supabase check error:', checkError);
      return errorResponse('Failed to check icon usage', 500);
    }

    if (usedQRCodes && usedQRCodes.length > 0) {
      return errorResponse('Cannot delete icon type that is being used by QR codes. Please update or delete those QR codes first.', 409);
    }

    // Delete icon type
    const { error } = await supabase
      .from('icon_types')
      .delete()
      .eq('code', code);

    if (error) {
      console.error('Supabase error:', error);
      return errorResponse('Failed to delete icon type', 500);
    }

    return jsonResponse({ success: true, message: 'Icon type deleted' });
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
      'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
