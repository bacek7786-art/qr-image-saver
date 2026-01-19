// GET /api/auth/verify - Verify session
import { createSupabaseClient, getAccessToken, jsonResponse, errorResponse } from '../_supabase.js';

export async function onRequestGet(context) {
  try {
    const accessToken = getAccessToken(context.request);
    if (!accessToken) {
      return errorResponse('No token provided', 401);
    }

    const supabase = createSupabaseClient(context.env, accessToken);

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return errorResponse('Invalid or expired token', 401);
    }

    return jsonResponse({
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    });
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
