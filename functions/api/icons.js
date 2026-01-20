import { createSupabaseClient, createSupabaseAdminClient, getAccessToken, jsonResponse, errorResponse } from './_supabase.js';

// GET /api/icons - アイコン一覧取得
export async function onRequestGet(context) {
  try {
    const supabase = createSupabaseClient(context.env);
    const { data, error } = await supabase
      .from('icon_types')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return errorResponse('Failed to fetch icons', 500);
    }
    return jsonResponse({ success: true, data });
  } catch (err) {
    return errorResponse('Internal server error', 500);
  }
}

// POST /api/icons - アイコン作成
export async function onRequestPost(context) {
  try {
    const token = getAccessToken(context.request);
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }
    const supabase = createSupabaseAdminClient(context.env);
    const body = await context.request.json();

    const { data, error } = await supabase
      .from('icon_types')
      .insert([body])
      .select()
      .single();

    if (error) {
      return errorResponse(error.message, 400);
    }
    return jsonResponse({ success: true, data }, 201);
  } catch (err) {
    return errorResponse('Internal server error', 500);
  }
}

// PUT /api/icons - アイコン更新
export async function onRequestPut(context) {
  try {
    const token = getAccessToken(context.request);
    if (!token) {
      return errorResponse('Unauthorized', 401);
    }
    const supabase = createSupabaseAdminClient(context.env);
    const body = await context.request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return errorResponse('ID is required', 400);
    }

    const { data, error } = await supabase
      .from('icon_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return errorResponse(error.message, 400);
    }
    return jsonResponse({ success: true, data });
  } catch (err) {
    return errorResponse('Internal server error', 500);
  }
}

// OPTIONS for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}
