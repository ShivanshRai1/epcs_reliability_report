import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { getTemplateBadge } from '../utils/templateInfo.jsx';
import './VideoEditor.css';

const VideoEditor = ({ page, onPageUpdate, isEditMode, onClose }) => {
  const [videos, setVideos] = useState([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (page?.videos) {
      setVideos(page.videos);
    }
  }, [page]);

  const extractVideoId = (url) => {
    // Handle YouTube URLs
    let youtubeMatch = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:embed\/|v\/|watch\?v=)?([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return { id: youtubeMatch[1], platform: 'youtube' };
    }
    
    // Handle Vimeo URLs
    let vimeoMatch = url.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return { id: vimeoMatch[1], platform: 'vimeo' };
    }
    
    // Handle direct MP4/WebM URLs
    if (url.includes('.mp4') || url.includes('.webm') || url.includes('.mov')) {
      return { id: url, platform: 'direct' };
    }
    
    return null;
  };

  const getVideoEmbedUrl = (video) => {
    if (video.platform === 'youtube') {
      return `https://www.youtube.com/embed/${video.id}`;
    } else if (video.platform === 'vimeo') {
      return `https://player.vimeo.com/video/${video.id}`;
    }
    return null;
  };

  const addVideo = async () => {
    if (!newVideoUrl.trim()) {
      setError('Please enter a video URL');
      return;
    }

    const videoData = extractVideoId(newVideoUrl);
    if (!videoData) {
      setError('Invalid video URL. Please use YouTube, Vimeo, or direct video link.');
      return;
    }

    const newVideo = {
      id: `video_${Date.now()}`,
      ...videoData,
      originalUrl: newVideoUrl,
      title: newVideoTitle || 'Untitled Video',
      addedDate: new Date().toISOString()
    };

    const updatedVideos = [...videos, newVideo];
    setVideos(updatedVideos);
    setNewVideoUrl('');
    setNewVideoTitle('');
    setError('');

    // Auto-save
    await updatePageVideos(updatedVideos);
  };

  const deleteVideo = async (videoId) => {
    const updatedVideos = videos.filter(v => v.id !== videoId);
    setVideos(updatedVideos);
    await updatePageVideos(updatedVideos);
  };

  const updateVideoTitle = async (videoId, newTitle) => {
    const updatedVideos = videos.map(v =>
      v.id === videoId ? { ...v, title: newTitle } : v
    );
    setVideos(updatedVideos);
    await updatePageVideos(updatedVideos);
  };

  const moveVideo = async (fromIndex, direction) => {
    const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= videos.length) return;

    const updatedVideos = [...videos];
    [updatedVideos[fromIndex], updatedVideos[toIndex]] = [updatedVideos[toIndex], updatedVideos[fromIndex]];
    setVideos(updatedVideos);
    await updatePageVideos(updatedVideos);
  };

  const updatePageVideos = async (updatedVideos) => {
    setLoading(true);
    try {
      const updatedPageData = {
        ...page,
        videos: updatedVideos
      };
      const pageId = page?.id || page?.page_id;
      if (!pageId) {
        throw new Error('Missing page id for video save');
      }

      await apiService.savePage(pageId, { page_data: updatedPageData });
      if (onPageUpdate) {
        onPageUpdate(updatedPageData);
      }
    } catch (err) {
      setError('Failed to save changes: ' + err.message);
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-editor">
      <div className="video-editor-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>📹 Video Gallery</h3>
          {isEditMode && getTemplateBadge(page, true)}
        </div>
      </div>

      {error && <div className="editor-error">{error}</div>}

      {isEditMode && (
        <div className="video-input-section">
          <div className="video-input-group">
            <input
              type="text"
              placeholder="YouTube, Vimeo, or direct video URL"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              className="video-url-input"
              onKeyPress={(e) => e.key === 'Enter' && addVideo()}
            />
            <input
              type="text"
              placeholder="Video title (optional)"
              value={newVideoTitle}
              onChange={(e) => setNewVideoTitle(e.target.value)}
              className="video-title-input"
              onKeyPress={(e) => e.key === 'Enter' && addVideo()}
            />
            <button onClick={addVideo} disabled={loading} className="btn-add-video">
              ➕ Add Video
            </button>
          </div>
        </div>
      )}

      <div className="video-gallery-container">
        {videos.length === 0 ? (
          <div className="video-gallery-empty">
            {isEditMode ? 'No videos added yet. Add your first video above.' : 'No videos to display.'}
          </div>
        ) : (
          <div className="video-gallery-grid">
            {videos.map((video, index) => (
              <div key={video.id} className="video-card">
                <div className="video-preview">
                  {video.platform === 'youtube' && (
                    <iframe
                      width="100%"
                      height="180"
                      src={getVideoEmbedUrl(video)}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                  {video.platform === 'vimeo' && (
                    <iframe
                      width="100%"
                      height="180"
                      src={getVideoEmbedUrl(video)}
                      title={video.title}
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                    />
                  )}
                  {video.platform === 'direct' && (
                    <video width="100%" height="180" controls>
                      <source src={video.id} type="video/mp4" />
                      Your browser does not support video playback.
                    </video>
                  )}
                </div>
                <div className="video-info">
                  {isEditMode ? (
                    <input
                      type="text"
                      value={video.title}
                      onChange={(e) => updateVideoTitle(video.id, e.target.value)}
                      className="video-title-edit"
                    />
                  ) : (
                    <h4>{video.title}</h4>
                  )}
                  <p className="video-platform">{video.platform.toUpperCase()}</p>
                </div>

                {isEditMode && (
                  <div className="video-controls">
                    {index > 0 && (
                      <button
                        onClick={() => moveVideo(index, 'up')}
                        className="btn-icon"
                        title="Move up"
                      >
                        ⬆️
                      </button>
                    )}
                    {index < videos.length - 1 && (
                      <button
                        onClick={() => moveVideo(index, 'down')}
                        className="btn-icon"
                        title="Move down"
                      >
                        ⬇️
                      </button>
                    )}
                    <button
                      onClick={() => deleteVideo(video.id)}
                      className="btn-icon btn-delete"
                      title="Delete video"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoEditor;
