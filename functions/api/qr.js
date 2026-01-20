// GET /api/qr - Fetch active QR codes list
import { createSupabaseClient, jsonResponse, errorResponse } from './_supabase.js';

export async function onRequestGet(context) {
  try {
    const supabase = createSupabaseClient(context.env);

    // Try to fetch with display_type column first
    let { data, error } = await supabase
      .from('qr_codes')
      .select('id, name, filename, image_url, display_url, icon_type, sort_order, display_type')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // If display_type column doesn't exist, fallback to query without it
    if (error && error.message && error.message.includes('display_type')) {
      const fallbackResult = await supabase
        .from('qr_codes')
        .select('id, name, filename, image_url, display_url, icon_type, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      data = fallbackResult.data;
      error = fallbackResult.error;

      // Add default display_type for backwards compatibility
      if (data) {
        data.forEach(item => {
          item.display_type = 'name';
        });
      }
    }

    if (error) {
      console.error('Supabase error:', error);
      return errorResponse('Failed to fetch QR codes', 500);
    }

    return jsonResponse({ success: true, data });
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
