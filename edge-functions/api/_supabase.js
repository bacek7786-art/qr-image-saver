// Supabase client utility for Pages Functions
import { createClient } from '@supabase/supabase-js';

/**
 * Create Supabase client from environment variables
 * @param {object} env - Environment variables from context.env
 * @param {string} [accessToken] - Optional access token for authenticated requests
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createSupabaseClient(env, accessToken = null) {
  const options = {};

  if (accessToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };
  }

  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, options);
}

/**
 * Create Supabase admin client (bypasses RLS)
 * @param {object} env - Environment variables from context.env
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function createSupabaseAdminClient(env) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

/**
 * Extract access token from request cookies or Authorization header
 * @param {Request} request
 * @returns {string|null}
 */
export function getAccessToken(request) {
  // Try Authorization header first
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Try cookie
  const cookie = request.headers.get('Cookie');
  if (cookie) {
    const match = cookie.match(/sb-access-token=([^;]+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * JSON response helper
 * @param {object} data
 * @param {number} status
 * @returns {Response}
 */
export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

/**
 * Error response helper
 * @param {string} message
 * @param {number} status
 * @returns {Response}
 */
export function errorResponse(message, status = 400) {
  return jsonResponse({ success: false, error: message }, status);
}
