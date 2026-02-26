import React, { useEffect, useState } from 'react';
import './ImagesOnlyEditor.css';

const ImagesOnlyEditor = ({ page, onChange }) => {
  const [images, setImages] = useState(page.images || []);
  const [captions, setCaptions] = useState(page.captions || []);
  const [title, setTitle] = useState(page.title || '');

  useEffect(() => {
    setImages(page.images || []);
    setCaptions(page.captions || []);
    setTitle(page.title || '');
  }, [page.id]);

  const handleAddImage = () => {
    setImages([...images, '']);
    setCaptions([...captions, '']);
    updatePage([...images, ''], [...captions, '']);
  };

  const handleDeleteImage = (idx) => {
    const newImages = images.filter((_, i) => i !== idx);
    const newCaptions = captions.filter((_, i) => i !== idx);
    setImages(newImages);
    setCaptions(newCaptions);
    updatePage(newImages, newCaptions);
  };

  const handleImageUrlChange = (idx, value) => {
    const newImages = [...images];
    newImages[idx] = value;
    setImages(newImages);
    updatePage(newImages, captions);
  };

  const handleCaptionChange = (idx, value) => {
    const newCaptions = [...captions];
    newCaptions[idx] = value;
    setCaptions(newCaptions);
    updatePage(images, newCaptions);
  };

  const handleMoveImage = (idx, direction) => {
    const newImages = [...images];
    const newCaptions = [...captions];
    
    if (direction === 'up' && idx > 0) {
      [newImages[idx], newImages[idx - 1]] = [newImages[idx - 1], newImages[idx]];
      [newCaptions[idx], newCaptions[idx - 1]] = [newCaptions[idx - 1], newCaptions[idx]];
    } else if (direction === 'down' && idx < newImages.length - 1) {
      [newImages[idx], newImages[idx + 1]] = [newImages[idx + 1], newImages[idx]];
      [newCaptions[idx], newCaptions[idx + 1]] = [newCaptions[idx + 1], newCaptions[idx]];
    }
    
    setImages(newImages);
    setCaptions(newCaptions);
    updatePage(newImages, newCaptions);
  };

  const updatePage = (imgs, caps, nextTitle = title) => {
    onChange({
      ...page,
      title: nextTitle,
      images: imgs,
      captions: caps
    });
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updatePage(images, captions, newTitle);
  };

  return (
    <div className="images-only-editor">
      <div className="editor-section">
        <label>Page Title:</label>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter page title"
          className="title-input"
        />
      </div>

      <div className="editor-section">
        <label>Images:</label>
        
        {images.length === 0 && (
          <div className="empty-state">
            No images yet. Click "Add Image" to start.
          </div>
        )}

        <div className="images-list">
          {images.map((imageUrl, idx) => (
            <div key={idx} className="image-item">
              <div className="image-controls">
                <button
                  className="move-btn"
                  onClick={() => handleMoveImage(idx, 'up')}
                  disabled={idx === 0}
                  title="Move up"
                >
                  ⬆️
                </button>
                <button
                  className="move-btn"
                  onClick={() => handleMoveImage(idx, 'down')}
                  disabled={idx === images.length - 1}
                  title="Move down"
                >
                  ⬇️
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDeleteImage(idx)}
                  title="Delete image"
                >
                  🗑️
                </button>
              </div>

              <div className="image-preview">
                {imageUrl ? (
                  <img src={imageUrl} alt={`Image ${idx + 1}`} />
                ) : (
                  <div className="placeholder">No image</div>
                )}
              </div>

              <div className="image-fields">
                <label>Image URL:</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => handleImageUrlChange(idx, e.target.value)}
                  placeholder="https://..."
                  className="url-input"
                />

                <label>Caption:</label>
                <textarea
                  value={captions[idx] || ''}
                  onChange={(e) => handleCaptionChange(idx, e.target.value)}
                  placeholder="Optional caption for this image"
                  rows="2"
                  className="caption-input"
                />
              </div>
            </div>
          ))}
        </div>

        <button className="add-image-btn" onClick={handleAddImage}>
          ➕ Add Image
        </button>
      </div>
    </div>
  );
};

export default ImagesOnlyEditor;
