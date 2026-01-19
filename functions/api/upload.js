// POST /api/upload - Upload image to Supabase Storage
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

    // Get form data
    const formData = await context.request.formData();
    const file = formData.get('file');

    if (!file) {
      return errorResponse('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return errorResponse('File must be an image');
    }

    // Generate safe filename (remove Japanese chars and spaces)
    const originalName = file.name;
    const extension = originalName.split('.').pop().toLowerCase();
    const safeName = `qr_${Date.now()}.${extension}`;

    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('qr-images')
      .upload(safeName, arrayBuffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      return errorResponse(`Upload failed: ${error.message}`, 500);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('qr-images')
      .getPublicUrl(safeName);

    return jsonResponse({
      success: true,
      data: {
        filename: safeName,
        original_filename: originalName,
        image_url: urlData.publicUrl,
        path: data.path
      }
    });

  } catch (err) {
    console.error('Upload error:', err);
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
