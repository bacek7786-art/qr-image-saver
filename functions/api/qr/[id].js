// PUT/DELETE /api/qr/[id] - Update or delete QR code (requires authentication)
import { createSupabaseClient, getAccessToken, jsonResponse, errorResponse } from '../_supabase.js';

// PUT - Update QR code
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

    const id = context.params.id;
    if (!id) {
      return errorResponse('QR code ID is required');
    }

    // Parse request body
    const body = await context.request.json();
    const updates = {};

    // Only update provided fields
    const allowedFields = ['name', 'filename', 'image_url', 'display_url', 'icon_type', 'sort_order', 'is_active', 'display_type'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    // Validate icon_type if provided
    if (updates.icon_type) {
      const validIcons = ['BTC', 'ETH', 'XRP', 'USDT'];
      if (!validIcons.includes(updates.icon_type)) {
        return errorResponse(`Invalid icon_type. Must be one of: ${validIcons.join(', ')}`);
      }
    }

    // Validate display_type if provided
    if (updates.display_type) {
      const validDisplayTypes = ['name', 'url'];
      if (!validDisplayTypes.includes(updates.display_type)) {
        return errorResponse(`Invalid display_type. Must be one of: ${validDisplayTypes.join(', ')}`);
      }
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse('No valid fields to update');
    }

    // Update QR code
    const { data, error } = await supabase
      .from('qr_codes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      if (error.code === 'PGRST116') {
        return errorResponse('QR code not found', 404);
      }
      return errorResponse('Failed to update QR code', 500);
    }

    return jsonResponse({ success: true, data });
  } catch (err) {
    console.error('Error:', err);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE - Delete QR code
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

    const id = context.params.id;
    if (!id) {
      return errorResponse('QR code ID is required');
    }

    // Delete QR code
    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return errorResponse('Failed to delete QR code', 500);
    }

    return jsonResponse({ success: true, message: 'QR code deleted' });
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
