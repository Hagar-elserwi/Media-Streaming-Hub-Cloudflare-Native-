// src/pages/src/App.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Upload, Film, Loader, CheckCircle, Trash2, Eye, TrendingUp, BarChart3 } from 'lucide-react';

const CloudflareMediaApp = () => {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState("videos");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ totalViews: 0, totalVideos: 0, last24Hours: 0 });
  const [user] = useState({ id: 'demo-user', email: 'demo@cloudflare.com', name: 'Demo User' });

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  

  const API_URL = 'https://cloud.gegeelserwi.workers.dev';
  const R2_PUBLIC_URL = 'https://pub-4a74b7ab35f7452d999ecf6a0';

  useEffect(() => {
    fetchVideos();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [selectedVideo]);

  const fetchVideos = async () => {
    try {
      const response = await fetch(`${API_URL}/api/videos`);
      const data = await response.json();
      setVideos(data.videos || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_URL}/api/analytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('video/')) {
      alert('Please select a valid video file');
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      alert('File too large! Maximum size is 500MB for demo purposes.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique ID and filename
      const videoId = `video-${Date.now()}`;
      const filename = `${videoId}-${file.name}`;
      const fileUrl = `${R2_PUBLIC_URL}/videos/${filename}`;

      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to R2 using fetch
      const uploadResponse = await fetch(fileUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      clearInterval(progressInterval);

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      setUploadProgress(100);

      // Save metadata to database via API
      const metadataResponse = await fetch(`${API_URL}/api/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: videoId,
          title: file.name.replace(/\.[^/.]+$/, ''),
          description: `Uploaded on ${new Date().toLocaleDateString()}`,
          filename: `videos/${filename}`,
          fileUrl: fileUrl,
          fileSize: file.size,
          userId: user.id,
          userEmail: user.email,
        }),
      });

      if (!metadataResponse.ok) {
        throw new Error('Failed to save video metadata');
      }

      alert('Video uploaded successfully! 🎉');
      await fetchVideos();
      await fetchAnalytics();
      setUploading(false);
      setUploadProgress(0);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
        recordView();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const recordView = async () => {
    if (!selectedVideo || selectedVideo.viewRecorded) return;
    
    try {
      await fetch(`${API_URL}/api/videos/${selectedVideo.id}/view`, {
        method: 'POST',
      });
      
      setSelectedVideo({ ...selectedVideo, viewRecorded: true, views: (selectedVideo.views || 0) + 1 });
      fetchAnalytics();
    } catch (error) {
      console.error('Error recording view:', error);
    }
  };

  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const selectVideo = (video) => {
    setSelectedVideo({ ...video, viewRecorded: false });
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const deleteVideo = async (videoId, e) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/videos/${videoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Video deleted successfully');
        if (selectedVideo?.id === videoId) {
          setSelectedVideo(null);
        }
        fetchVideos();
        fetchAnalytics();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete video');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Film className="w-8 h-8 text-orange-500" />
              <div>
                <h1 className="text-xl font-bold">Cloudflare Media Platform</h1>
                <p className="text-xs text-gray-400">R2 Storage + D1 Database + Workers</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
              <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center font-bold">
                {user.name.charAt(0)}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab("videos")}
              className={`px-4 py-2 rounded flex items-center gap-2 ${activeTab === "videos" ? "bg-orange-600" : "bg-gray-700 hover:bg-gray-600"}`}
            >
              <Film size={18} />
              Videos
            </button>
            <button 
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded flex items-center gap-2 ${activeTab === "analytics" ? "bg-orange-600" : "bg-gray-700 hover:bg-gray-600"}`}
            >
              <BarChart3 size={18} />
              Analytics
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {activeTab === "videos" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg overflow-hidden mb-4">
                {selectedVideo ? (
                  <div>
                    <div className="relative bg-black aspect-video">
                      <video
                        ref={videoRef}
                        src={selectedVideo.file_url}
                        className="w-full h-full"
                        onEnded={() => setIsPlaying(false)}
                      />
                      
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTime}
                          onChange={handleSeek}
                          className="w-full mb-2 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #f97316 0%, #f97316 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%, #4b5563 100%)`
                          }}
                        />
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button onClick={handlePlayPause} className="hover:text-orange-400 transition">
                              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                            </button>
                            <button onClick={handleMuteToggle} className="hover:text-orange-400 transition">
                              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                            </button>
                            <span className="text-sm">
                              {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                          </div>
                          
                          <button onClick={handleFullscreen} className="hover:text-orange-400 transition">
                            <Maximize size={24} />
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h2 className="text-xl font-bold mb-2">{selectedVideo.title}</h2>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-3">
                        <span className="flex items-center gap-1">
                          <Eye size={16} />
                          {selectedVideo.views?.toLocaleString() || 0} views
                        </span>
                        <span>Size: {formatFileSize(selectedVideo.file_size)}</span>
                        <span>Uploaded: {new Date(selectedVideo.created_at).toLocaleDateString()}</span>
                      </div>
                      {selectedVideo.description && (
                        <p className="text-sm text-gray-400">{selectedVideo.description}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video flex items-center justify-center bg-gray-900">
                    <div className="text-center">
                      <Film size={64} className="mx-auto mb-4 text-gray-600" />
                      <p className="text-gray-400">Select a video to start playing</p>
                      <p className="text-sm text-gray-500 mt-2">Stored on Cloudflare R2</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <TrendingUp size={18} className="text-orange-500" />
                  Platform Features
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-900 p-3 rounded">
                    <p className="text-sm text-gray-400">Storage</p>
                    <p className="font-bold text-orange-400">Cloudflare R2</p>
                  </div>
                  <div className="bg-gray-900 p-3 rounded">
                    <p className="text-sm text-gray-400">Database</p>
                    <p className="font-bold text-orange-400">D1 SQL</p>
                  </div>
                  <div className="bg-gray-900 p-3 rounded">
                    <p className="text-sm text-gray-400">API</p>
                    <p className="font-bold text-orange-400">Workers</p>
                  </div>
                  <div className="bg-gray-900 p-3 rounded">
                    <p className="text-sm text-gray-400">CDN</p>
                    <p className="font-bold text-orange-400">Global Edge</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Upload Video</h3>
                </div>

                <label className="cursor-pointer bg-orange-600 hover:bg-orange-700 px-4 py-3 rounded flex items-center justify-center gap-2 mb-3 transition">
                  <Upload size={18} />
                  Choose Video File
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="video/*" 
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>

                <p className="text-xs text-gray-400 text-center mb-4">
                  Max 500MB • MP4, MOV, WebM supported
                </p>

                {uploading && (
                  <div className="p-3 bg-orange-900/30 rounded">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Uploading to R2...</span>
                      <span className="text-sm font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-orange-500 rounded-full h-2 transition-all"
                        style={{width: `${uploadProgress}%`}}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-bold mb-3">Video Library ({videos.length})</h3>
                
                {loading ? (
                  <div className="text-center py-8">
                    <Loader className="w-8 h-8 mx-auto animate-spin text-orange-500" />
                    <p className="text-sm text-gray-400 mt-2">Loading videos...</p>
                  </div>
                ) : videos.length === 0 ? (
                  <div className="text-center py-8">
                    <Film size={48} className="mx-auto mb-3 text-gray-600" />
                    <p className="text-sm text-gray-400">No videos yet</p>
                    <p className="text-xs text-gray-500 mt-1">Upload your first video!</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {videos.map(video => (
                      <div
                        key={video.id}
                        onClick={() => selectVideo(video)}
                        className={`cursor-pointer rounded overflow-hidden hover:ring-2 hover:ring-orange-500 transition relative group ${
                          selectedVideo?.id === video.id ? 'ring-2 ring-orange-500' : ''
                        }`}
                      >
                        <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
                          <Film size={32} className="text-gray-600" />
                          <button
                            onClick={(e) => deleteVideo(video.id, e)}
                            className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 p-2 rounded opacity-0 group-hover:opacity-100 transition"
                            title="Delete video"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="p-2 bg-gray-750">
                          <p className="text-sm font-medium truncate">{video.title}</p>
                          <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                            <span>{video.views || 0} views</span>
                            <span>{formatFileSize(video.file_size)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-orange-900 to-orange-800 p-6 rounded-lg">
                <p className="text-orange-200 text-sm mb-2">Total Videos</p>
                <p className="text-4xl font-bold">{analytics.totalVideos}</p>
                <p className="text-orange-300 text-xs mt-2">Stored on R2</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-900 to-blue-800 p-6 rounded-lg">
                <p className="text-blue-200 text-sm mb-2">Total Views</p>
                <p className="text-4xl font-bold">{analytics.totalViews.toLocaleString()}</p>
                <p className="text-blue-300 text-xs mt-2">All time</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-900 to-purple-800 p-6 rounded-lg">
                <p className="text-purple-200 text-sm mb-2">Last 24 Hours</p>
                <p className="text-4xl font-bold">{analytics.last24Hours}</p>
                <p className="text-purple-300 text-xs mt-2">Recent views</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <CheckCircle className="text-green-500" size={20} />
                Cloudflare Services Status
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
                  <span>R2 Object Storage</span>
                  <span className="px-3 py-1 bg-green-600 rounded text-sm">Operational</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
                  <span>D1 Database</span>
                  <span className="px-3 py-1 bg-green-600 rounded text-sm">Operational</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
                  <span>Workers API</span>
                  <span className="px-3 py-1 bg-green-600 rounded text-sm">Operational</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded">
                  <span>Global CDN</span>
                  <span className="px-3 py-1 bg-green-600 rounded text-sm">Operational</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="font-bold mb-4">Top Videos</h3>
              <div className="space-y-2">
                {videos
                  .sort((a, b) => (b.views || 0) - (a.views || 0))
                  .slice(0, 5)
                  .map((video, index) => (
                    <div key={video.id} className="flex items-center justify-between p-3 bg-gray-900 rounded">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-600">#{index + 1}</span>
                        <div>
                          <p className="font-medium">{video.title}</p>
                          <p className="text-xs text-gray-400">{formatFileSize(video.file_size)}</p>
                        </div>
                      </div>
                      <span className="text-orange-400 font-bold">{video.views || 0} views</span>
                    </div>
                  ))}
                {videos.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No videos uploaded yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CloudflareMediaApp;
