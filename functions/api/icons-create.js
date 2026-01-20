// POST /api/icons-create - アイコン作成
import { createSupabaseClient, getAccessToken, jsonResponse, errorResponse } from './_supabase.js';

export async function onRequestPost(context) {
  try {
    const accessToken = getAccessToken(context.request);
    if (!accessToken) {
      return errorResponse('Unauthorized', 401);
    }
    const supabase = createSupabaseClient(context.env, accessToken);

    const body = await context.request.json();
    const { data, error } = await supabase
      .from('icon_types')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return errorResponse(error.message, 400);
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
