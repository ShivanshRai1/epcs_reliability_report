import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import './SplitContentImageSection.css';

export default function SplitContentImageSection({
  title,
  leftHeader,
  rightHeader,
  content,
  leftContent,
  imageUrl,
  isEditing,
  onChange,
  onImageModalOpen,
  layout = 'normal'
}) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [links, setLinks] = useState([]);
  const [imageUrlData, setImageUrlData] = useState(imageUrl || '');
  const [leftContentData, setLeftContentData] = useState(leftContent || '');
  const fileInputRef = useRef();

  useEffect(() => {
    // Only sync from props when NOT editing to avoid flickering
    if (isEditing) return;
    
    if (Array.isArray(content)) {
      const linkItems = content.filter(item => item && item.type === 'link');
      setLinks(linkItems);
    } else {
      setLinks([]);
    }
  }, [content, isEditing]);

  useEffect(() => {
    // Only sync from props when NOT editing to avoid flickering
    if (isEditing) return;
    
    const urlValue = typeof imageUrl === 'string' ? imageUrl : (imageUrl ? String(imageUrl) : '');
    setImageUrlData(urlValue);
  }, [imageUrl, isEditing]);

  useEffect(() => {
    // Only sync leftContent from props when NOT editing
    if (isEditing) return;
    
    const contentValue = typeof leftContent === 'string' ? leftContent : (leftContent || '');
    setLeftContentData(contentValue);
  }, [leftContent, isEditing]);

  // Debounced auto-save when content or image changes (prevents flickering on rapid edits)
  useEffect(() => {
    if (!isEditing || !onChange) return;
    
    const timer = setTimeout(() => {
      onChange({ content: links, imageUrl: imageUrlData, leftContent: leftContentData });
    }, 300); // Debounce: wait 300ms after changes stop before saving
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links, imageUrlData, leftContentData, isEditing]);

  const handleLinkChange = (idx, field, value) => {
    const updatedLinks = [...links];
    if (!updatedLinks[idx]) return;
    updatedLinks[idx][field] = value;
    setLinks(updatedLinks);
  };

  const addLink = () => {
    const newLink = { type: 'link', text: 'New Link', url: '', style: '' };
    const updatedLinks = [...links, newLink];
    setLinks(updatedLinks);
  };

  const removeLink = (idx) => {
    const updatedLinks = links.filter((_, i) => i !== idx);
    setLinks(updatedLinks);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageUrlData(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e) => {
    const newUrl = String(e.target.value);
    setImageUrlData(newUrl);
  };

  const handleImageClick = () => {
    setShowImageModal(true);
  };

  const handleModalClose = () => {
    setShowImageModal(false);
  };

  // Support editable leftContent (text) or fallback to links if leftContent is not present
  const renderContent = () => {
    // If leftContentData exists, use it for editable text
    if (typeof leftContentData === 'string' && leftContentData.trim()) {
      if (isEditing) {
        return (
          <textarea
            className="split-left-content-textarea"
            value={leftContentData}
            onChange={e => setLeftContentData(e.target.value)}
            style={{ width: '100%', minHeight: 80 }}
          />
        );
      }
      return (
        <div className="split-left-content-text">
          {leftContentData.split('\n').map((line, idx) => (
            <React.Fragment key={idx}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
      );
    }
    // Fallback to links (legacy)
    if (isEditing) {
      return (
        <div className="split-links-editor">
          <div className="links-list">
            {links.length === 0 && (
              <div className="no-links-placeholder">No links added yet</div>
            )}
            {links.map((link, idx) => (
              <div key={`link-${idx}`} className="link-edit-row">
                <input
                  type="text"
                  value={link.text || ''}
                  onChange={(e) => handleLinkChange(idx, 'text', e.target.value)}
                  placeholder="Link text"
                  className="link-input link-input-text"
                />
                <input
                  type="text"
                  value={link.url || ''}
                  onChange={(e) => handleLinkChange(idx, 'url', e.target.value)}
                  placeholder="URL"
                  className="link-input link-input-url"
                />
                <button
                  className="link-delete-btn"
                  onClick={() => removeLink(idx)}
                  type="button"
                  title="Delete this link"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button className="link-add-btn" onClick={addLink}>
            + Add Link
          </button>
        </div>
      );
    }
    return (
      <div className="split-content-display">
        {links.map((link, idx) => {
          // Determine if it's an absolute URL or local file
          const isAbsolute = /^https?:\/\//i.test(link.url);
          if (!isAbsolute) {
            return (
              <a
                key={idx}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.href = encodeURI(link.url || '');
                }}
                className="split-link"
              >
                {link.text}
              </a>
            );
          }
          return (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="split-link"
            >
              {link.text}
            </a>
          );
        })}
      </div>
    );
  };

  return (
    <div className="split-section-wrapper">
      {title && (
        <div className="split-main-title">
          <h1>{title}</h1>
        </div>
      )}

      <div className="split-content-image-section">
        {layout === 'reversed' ? (
          <>
            {/* REVERSED LAYOUT: Image on left, content on right */}
            <div className="split-left">
              {rightHeader && (
                <div className="split-section-header split-left-header">
                  {rightHeader}
                </div>
              )}
              <div className="split-image-wrapper">
                {isEditing ? (
                  <div className="split-image-editor">
                    <div className="image-upload-section">
                      <label className="image-upload-label">
                        <span>📁 Upload Image:</span>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="image-file-input"
                        />
                      </label>
                    </div>
                    <div className="image-divider">— OR —</div>
                    <div className="image-url-section">
                      <label>
                        <span>🔗 Image URL:</span>
                        <input
                          type="text"
                          value={imageUrlData}
                          onChange={handleUrlChange}
                          placeholder="e.g., /images/bg1b.png or https://..."
                          className="image-url-input"
                        />
                      </label>
                    </div>
                    {imageUrlData && (
                      <div className="image-preview">
                        <img src={imageUrlData} alt="Preview" />
                      </div>
                    )}
                  </div>
                ) : (
                  imageUrlData && (
                    <img
                      src={imageUrlData}
                      alt="Content"
                      className="split-image"
                      onClick={handleImageClick}
                      style={{ cursor: 'pointer' }}
                    />
                  )
                )}
              </div>
            </div>

            <div className="split-right">
              {leftHeader && (
                <div className="split-section-header split-right-header">
                  {leftHeader}
                </div>
              )}
              <div className="split-content-wrapper">
                {renderContent()}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* NORMAL LAYOUT: Content on left, image on right */}
            <div className="split-left">
              {leftHeader && (
                <div className="split-section-header split-left-header">
                  {leftHeader}
                </div>
              )}
              <div className="split-content-wrapper">
                {renderContent()}
              </div>
            </div>

            <div className="split-right">
              {rightHeader && (
                <div className="split-section-header split-right-header">
                  {rightHeader}
                </div>
              )}
              <div className="split-image-wrapper">
                {isEditing ? (
                  <div className="split-image-editor">
                    <div className="image-upload-section">
                      <label className="image-upload-label">
                        <span>📁 Upload Image:</span>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="image-file-input"
                        />
                      </label>
                    </div>
                    <div className="image-divider">— OR —</div>
                    <div className="image-url-section">
                      <label>
                        <span>🔗 Image URL:</span>
                        <input
                          type="text"
                          value={imageUrlData}
                          onChange={handleUrlChange}
                          placeholder="e.g., /images/bg1b.png or https://..."
                          className="image-url-input"
                        />
                      </label>
                    </div>
                    {imageUrlData && (
                      <div className="image-preview">
                        <img src={imageUrlData} alt="Preview" />
                      </div>
                    )}
                  </div>
                ) : (
                  imageUrlData && (
                    <img
                      src={imageUrlData}
                      alt="Content"
                      className="split-image"
                      onClick={handleImageClick}
                      style={{ cursor: 'pointer' }}
                    />
                  )
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showImageModal && !isEditing}
        onClose={handleModalClose}
        imageSrc={imageUrlData}
      />
    </div>
  );
}

