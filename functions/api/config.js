// GET /api/config - Return public Supabase configuration
export async function onRequestGet(context) {
  return new Response(JSON.stringify({
    supabaseUrl: context.env.SUPABASE_URL,
    supabaseAnonKey: context.env.SUPABASE_ANON_KEY
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
