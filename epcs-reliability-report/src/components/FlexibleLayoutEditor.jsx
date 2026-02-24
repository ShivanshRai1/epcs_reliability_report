import React, { useState } from 'react';
import './FlexibleLayoutEditor.css';

const FlexibleLayoutEditor = ({ page, onChange, pageType = 'image-text' }) => {
  const [layout, setLayout] = useState(page.layout || 'text-left-image-right');
  const [imageUrl, setImageUrl] = useState(page.imageUrl || '');
  const [imageCaption, setImageCaption] = useState(page.imageCaption || '');
  const [textContent, setTextContent] = useState(page.content || '');
  const [textLink, setTextLink] = useState(page.link || '');
  const [imagePosition, setImagePosition] = useState(page.imagePosition || 'right');

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    updatePage(newLayout);
  };

  const updatePage = (currentLayout = layout) => {
    onChange({
      ...page,
      layout: currentLayout,
      imageUrl,
      imageCaption,
      content: textContent,
      link: textLink,
      imagePosition: ['image-left', 'text-left'].includes(currentLayout) ? 'left' : 'right'
    });
  };

  const handleImageUrlChange = (e) => {
    setImageUrl(e.target.value);
    updatePage();
  };

  const handleImageCaptionChange = (e) => {
    setImageCaption(e.target.value);
    updatePage();
  };

  const handleTextChange = (e) => {
    setTextContent(e.target.value);
    updatePage();
  };

  const handleLinkChange = (e) => {
    setTextLink(e.target.value);
    updatePage();
  };

  return (
    <div className="flexible-layout-editor">
      <h3>Layout Configuration</h3>
      
      {/* Layout Options */}
      <div className="layout-options">
        <label className="layout-option">
          <input
            type="radio"
            value="text-left-image-right"
            checked={layout === 'text-left-image-right'}
            onChange={(e) => handleLayoutChange(e.target.value)}
          />
          📝 Left | 🖼️ Right
        </label>
        
        <label className="layout-option">
          <input
            type="radio"
            value="image-left-text-right"
            checked={layout === 'image-left-text-right'}
            onChange={(e) => handleLayoutChange(e.target.value)}
          />
          🖼️ Left | 📝 Right
        </label>
        
        <label className="layout-option">
          <input
            type="radio"
            value="image-full"
            checked={layout === 'image-full'}
            onChange={(e) => handleLayoutChange(e.target.value)}
          />
          🖼️ Full Width
        </label>
        
        <label className="layout-option">
          <input
            type="radio"
            value="text-full"
            checked={layout === 'text-full'}
            onChange={(e) => handleLayoutChange(e.target.value)}
          />
          📝 Full Width
        </label>
      </div>

      {/* Image URL */}
      <div className="form-group">
        <label htmlFor="image-url">Image URL:</label>
        <input
          id="image-url"
          type="text"
          value={imageUrl}
          onChange={handleImageUrlChange}
          placeholder="https://example.com/image.jpg"
          className="input-field"
        />
      </div>

      {/* Image Caption */}
      <div className="form-group">
        <label htmlFor="image-caption">Image Caption:</label>
        <input
          id="image-caption"
          type="text"
          value={imageCaption}
          onChange={handleImageCaptionChange}
          placeholder="Optional caption for the image"
          className="input-field"
        />
      </div>

      {/* Text Content */}
      <div className="form-group">
        <label htmlFor="text-content">Text Content:</label>
        <textarea
          id="text-content"
          value={textContent}
          onChange={handleTextChange}
          placeholder="Enter text content"
          className="textarea-field"
          rows={6}
        />
      </div>

      {/* Text Link */}
      <div className="form-group">
        <label htmlFor="text-link">Link Target (page ID or number):</label>
        <input
          id="text-link"
          type="text"
          value={textLink}
          onChange={handleLinkChange}
          placeholder="e.g., page_123 or 5"
          className="input-field"
        />
      </div>

      {/* Preview */}
      <div className="preview-section">
        <h4>Preview</h4>
        <div className={`layout-preview layout-${layout.replace('_', '-')}`}>
          {!['text-full'].includes(layout) && imageUrl && (
            <div className="preview-image">
              <img src={imageUrl} alt={imageCaption} />
              {imageCaption && <p className="caption">{imageCaption}</p>}
            </div>
          )}
          {!['image-full'].includes(layout) && (
            <div className="preview-text">
              <p>{textContent || 'Your text will appear here...'}</p>
              {textLink && <p className="link-text">→ Links to page: {textLink}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlexibleLayoutEditor;
