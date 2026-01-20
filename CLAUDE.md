// POST /api/auth/login - Admin login
import { createSupabaseClient, jsonResponse, errorResponse } from '../_supabase.js';

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const { email, password } = body;

    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    const supabase = createSupabaseClient(context.env);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Auth error:', error);
      return errorResponse('Invalid credentials', 401);
    }

    // Set cookie with access token
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });

    // Set HttpOnly cookie for security
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    headers.append('Set-Cookie', `sb-access-token=${data.session.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);
    headers.append('Set-Cookie', `sb-refresh-token=${data.session.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`);

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email
      },
      // Also return token for client-side storage if needed
      access_token: data.session.access_token,
      expires_at: data.session.expires_at
    }), {
      status: 200,
      headers
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
