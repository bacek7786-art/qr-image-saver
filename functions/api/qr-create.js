// POST /api/qr-create - Create new QR code (requires authentication)
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
    const { name, filename, image_url, display_url, icon_type, sort_order = 0 } = body;

    // Validate required fields
    if (!name || !filename || !image_url || !display_url || !icon_type) {
      return errorResponse('Missing required fields: name, filename, image_url, display_url, icon_type');
    }

    // Validate icon_type
    const validIcons = ['BTC', 'ETH', 'XRP', 'USDT'];
    if (!validIcons.includes(icon_type)) {
      return errorResponse(`Invalid icon_type. Must be one of: ${validIcons.join(', ')}`);
    }

    // Insert new QR code
    const { data, error } = await supabase
      .from('qr_codes')
      .insert({
        name,
        filename,
        image_url,
        display_url,
        icon_type,
        sort_order: parseInt(sort_order, 10) || 0,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return errorResponse('Failed to create QR code', 500);
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
