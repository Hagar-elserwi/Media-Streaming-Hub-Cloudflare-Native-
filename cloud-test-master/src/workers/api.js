// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === '/api/health') {
        return jsonResponse({ 
          status: 'ok', 
          timestamp: new Date().toISOString(),
          service: 'Cloudflare Media API'
        });
      }

      // Get all videos
      if (path === '/api/videos' && request.method === 'GET') {
        const { results } = await env.DB.prepare(
          'SELECT * FROM videos ORDER BY created_at DESC LIMIT 50'
        ).all();
        
        return jsonResponse({ videos: results });
      }

      // Get single video
      if (path.match(/^\/api\/videos\/[^/]+$/) && request.method === 'GET') {
        const videoId = path.split('/')[3];
        const video = await env.DB.prepare(
          'SELECT * FROM videos WHERE id = ?'
        ).bind(videoId).first();
        
        if (!video) {
          return jsonResponse({ error: 'Video not found' }, 404);
        }
        
        return jsonResponse({ video });
      }

      // Upload video metadata (after client uploads to R2)
      if (path === '/api/videos' && request.method === 'POST') {
        const body = await request.json();
        const { id, title, description, filename, fileUrl, fileSize, userId, userEmail } = body;

        if (!id || !title || !filename || !fileUrl) {
          return jsonResponse({ error: 'Missing required fields' }, 400);
        }

        await env.DB.prepare(
          `INSERT INTO videos (id, title, description, filename, file_url, file_size, user_id, user_email, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ready')`
        ).bind(id, title, description, filename, fileUrl, fileSize, userId, userEmail).run();

        const video = await env.DB.prepare(
          'SELECT * FROM videos WHERE id = ?'
        ).bind(id).first();

        return jsonResponse({ success: true, video }, 201);
      }

      // Increment view count
      if (path.match(/^\/api\/videos\/[^/]+\/view$/) && request.method === 'POST') {
        const videoId = path.split('/')[3];
        
        await env.DB.prepare(
          'UPDATE videos SET views = views + 1 WHERE id = ?'
        ).bind(videoId).run();

        await env.DB.prepare(
          `INSERT INTO analytics (video_id, event_type) VALUES (?, 'view')`
        ).bind(videoId).run();

        return jsonResponse({ success: true });
      }

      // Delete video
      if (path.match(/^\/api\/videos\/[^/]+$/) && request.method === 'DELETE') {
        const videoId = path.split('/')[3];
        
        // Get video info
        const video = await env.DB.prepare(
          'SELECT * FROM videos WHERE id = ?'
        ).bind(videoId).first();

        if (!video) {
          return jsonResponse({ error: 'Video not found' }, 404);
        }

        // Delete from R2
        await env.VIDEOS.delete(video.filename);

        // Delete from database
        await env.DB.prepare(
          'DELETE FROM videos WHERE id = ?'
        ).bind(videoId).run();

        return jsonResponse({ success: true, message: 'Video deleted' });
      }

      // Get analytics
      if (path === '/api/analytics' && request.method === 'GET') {
        const totalViews = await env.DB.prepare(
          'SELECT SUM(views) as total FROM videos'
        ).first();

        const totalVideos = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM videos'
        ).first();

        const recentViews = await env.DB.prepare(
          'SELECT COUNT(*) as count FROM analytics WHERE event_type = "view" AND timestamp > datetime("now", "-24 hours")'
        ).first();

        return jsonResponse({
          totalViews: totalViews.total || 0,
          totalVideos: totalVideos.count || 0,
          last24Hours: recentViews.count || 0
        });
      }

      // Get upload URL (signed URL for direct R2 upload)
      if (path === '/api/upload-url' && request.method === 'POST') {
        const body = await request.json();
        const { filename, contentType } = body;

        if (!filename) {
          return jsonResponse({ error: 'Filename required' }, 400);
        }

        // Generate unique key
        const key = `videos/${Date.now()}-${filename}`;

        // Note: R2 presigned URLs require additional setup
        // For simplicity, we'll use direct upload from client
        const uploadUrl = `${env.R2_PUBLIC_URL}/${key}`;

        return jsonResponse({ 
          uploadUrl,
          key,
          publicUrl: uploadUrl
        });
      }

      return jsonResponse({ error: 'Not found' }, 404);

    } catch (error) {
      console.error('API Error:', error);
      return jsonResponse({ 
        error: 'Internal server error',
        message: error.message 
      }, 500);
    }
  },
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}