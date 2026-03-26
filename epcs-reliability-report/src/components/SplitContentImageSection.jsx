import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import './SplitContentImageSection.css';
import { toOpenableUrl } from '../utils/linkTarget';
import LinkTargetInput from './LinkTargetInput';

export default function SplitContentImageSection({
  title,
  pageNumber,
  leftHeader,
  rightHeader,
  content,
  leftContent,
  imageUrl,
  isLiveMode = false,
  isEditing,
  onChange,
  onImageModalOpen,
  layout = 'normal',
  splitTextImageMode = false,
  splitLinksImageMode = false,
  splitImageLinksMode = false,
  splitImageImageMode = false,
  leftImageUrl
}) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [links, setLinks] = useState([]);
  const [imageUrlData, setImageUrlData] = useState(imageUrl || '');
  const [leftImageUrlData, setLeftImageUrlData] = useState(leftImageUrl || '');
  const [leftContentData, setLeftContentData] = useState(leftContent || '');
  const fileInputRef = useRef();

  const emitImmediateChange = (overrides = {}) => {
    if (!isEditing || !onChange) return;
    onChange({
      content: links,
      imageUrl: imageUrlData,
      leftContent: leftContentData,
      leftImageUrl: leftImageUrlData,
      ...overrides
    });
  };

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

  useEffect(() => {
    if (isEditing) return;
    const urlValue = typeof leftImageUrl === 'string' ? leftImageUrl : (leftImageUrl ? String(leftImageUrl) : '');
    setLeftImageUrlData(urlValue);
  }, [leftImageUrl, isEditing]);

  // Debounced auto-save when content or image changes (prevents flickering on rapid edits)
  useEffect(() => {
    if (!isEditing || !onChange) return;
    
    const timer = setTimeout(() => {
      onChange({ content: links, imageUrl: imageUrlData, leftContent: leftContentData, leftImageUrl: leftImageUrlData });
    }, 300); // Debounce: wait 300ms after changes stop before saving
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [links, imageUrlData, leftContentData, leftImageUrlData, isEditing]);

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
        const newUrl = String(ev.target.result || '');
        setImageUrlData(newUrl);
        emitImmediateChange({ imageUrl: newUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (e) => {
    const newUrl = String(e.target.value);
    setImageUrlData(newUrl);
    emitImmediateChange({ imageUrl: newUrl });
  };

  const handleRemoveRightImage = () => {
    setImageUrlData('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    emitImmediateChange({ imageUrl: '' });
  };

  const handleRemoveLeftImage = () => {
    setLeftImageUrlData('');
    emitImmediateChange({ leftImageUrl: '' });
  };

  const handleImageClick = (src) => {
    setModalImageSrc(src || imageUrlData);
    setShowImageModal(true);
  };

  const handleModalClose = () => {
    setShowImageModal(false);
  };

  const displayLeftHeader = layout === 'reversed' ? rightHeader : leftHeader;
  const displayRightHeader = layout === 'reversed' ? leftHeader : rightHeader;
  const hasLeftHeader = Boolean(String(displayLeftHeader || '').trim());
  const hasRightHeader = Boolean(String(displayRightHeader || '').trim());
  const contentLayout = splitImageLinksMode ? 'reversed' : layout;
  const isLiveSplitPage = isLiveMode && !isEditing;
  const isLivePage13 = isLiveMode && Number(pageNumber) === 13;
  const isLivePage15 = isLiveMode && Number(pageNumber) === 15;

  const leftImageEditorBlock = (
    isEditing ? (
      <div className="split-image-editor">
        <div className="image-upload-section">
          <label className="image-upload-label">
            <span>📁 Upload Image:</span>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                  const newUrl = String(ev.target.result || '');
                  setLeftImageUrlData(newUrl);
                  emitImmediateChange({ leftImageUrl: newUrl });
                };
                reader.readAsDataURL(file);
              }
            }} className="image-file-input" />
          </label>
        </div>
        <div className="image-divider">— OR —</div>
        <div className="image-url-section">
          <label>
            <span>🔗 Image URL:</span>
            <input
              type="text"
              value={leftImageUrlData}
              onChange={(e) => {
                const newUrl = String(e.target.value);
                setLeftImageUrlData(newUrl);
                emitImmediateChange({ leftImageUrl: newUrl });
              }}
              placeholder="e.g., /images/bg1b.png or https://..."
              className="image-url-input"
            />
          </label>
        </div>
        {leftImageUrlData && (
          <div className="split-actions-row">
            <button className="split-add-btn" onClick={handleRemoveLeftImage} type="button">Remove Left Image</button>
          </div>
        )}
        {leftImageUrlData && <div className="image-preview"><img src={leftImageUrlData} alt="Left Preview" /></div>}
      </div>
    ) : (
      leftImageUrlData && (
        <img src={leftImageUrlData} alt="Left Content" className="split-image" onClick={() => handleImageClick(leftImageUrlData)} style={{ cursor: 'pointer' }} />
      )
    )
  );

  // Support editable leftContent (text) or fallback to links if leftContent is not present
  const renderContent = () => {
    // In split-image-image mode, render an image editor/viewer on the left (non-reversed) side.
    if (splitImageImageMode) {
      return leftImageEditorBlock;
    }

    // In split-text-image mode, always use text editor/renderer on the left side.
    if (splitTextImageMode) {
      if (isEditing) {
        return (
          <textarea
            className="split-left-content-textarea"
            value={leftContentData}
            onChange={e => setLeftContentData(e.target.value)}
            style={{ width: '100%', minHeight: 120 }}
            placeholder="Enter left-side content"
          />
        );
      }

      return (
        <div className="split-left-content-text">
          {(leftContentData || '').split('\n').map((line, idx) => (
            <React.Fragment key={idx}>
              {line}
              <br />
            </React.Fragment>
          ))}
        </div>
      );
    }

    // In split-links-image and split-image-links modes, use links editor/renderer.
    if (splitLinksImageMode || splitImageLinksMode) {
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
                  <LinkTargetInput
                    value={link.url || ''}
                    onValueChange={(value) => handleLinkChange(idx, 'url', value)}
                    placeholder="URL, file path, or choose file"
                    inputClassName="link-input link-input-url"
                    buttonText="File"
                  />
                  <button
                    className="link-delete-btn"
                    onClick={() => removeLink(idx)}
                    type="button"
                    title="Delete this link"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
            <button className="link-add-btn" onClick={addLink}>
              Add Link
            </button>
          </div>
        );
      }

      return (
        <div className="split-content-display">
          {(() => {
            const hasHierarchy = links.some((item) => String(item?.style || '').toLowerCase() === 'highlight');
            return links.map((link, idx) => {
              const openableUrl = toOpenableUrl(link.url || '');
              if (!openableUrl) return null;

              const isHighlight = String(link?.style || '').toLowerCase() === 'highlight';
              const linkClassName = hasHierarchy
                ? `split-link${isHighlight ? ' split-link-highlight' : ' split-link-subitem'}`
                : 'split-link split-link-primary';

              return (
                <a
                  key={idx}
                  href={openableUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClassName}
                >
                  {link.text}
                </a>
              );
            });
          })()}
        </div>
      );
    }

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
                <LinkTargetInput
                  value={link.url || ''}
                  onValueChange={(value) => handleLinkChange(idx, 'url', value)}
                  placeholder="URL, file path, or choose file"
                  inputClassName="link-input link-input-url"
                  buttonText="File"
                />
                <button
                  className="link-delete-btn"
                  onClick={() => removeLink(idx)}
                  type="button"
                  title="Delete this link"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
          <button className="link-add-btn" onClick={addLink}>
            Add Link
          </button>
        </div>
      );
    }
    return (
      <div className="split-content-display">
        {(() => {
          const hasHierarchy = links.some((item) => String(item?.style || '').toLowerCase() === 'highlight');
          return links.map((link, idx) => {
            const openableUrl = toOpenableUrl(link.url || '');
            if (!openableUrl) return null;

            const isHighlight = String(link?.style || '').toLowerCase() === 'highlight';
            const linkClassName = hasHierarchy
              ? `split-link${isHighlight ? ' split-link-highlight' : ' split-link-subitem'}`
              : 'split-link split-link-primary';

            return (
              <a
                key={idx}
                href={openableUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClassName}
              >
                {link.text}
              </a>
            );
          });
        })()}
      </div>
    );
  };

  const imageEditorBlock = (
    isEditing ? (
      <div className="split-image-editor">
        <div className="image-upload-section">
          <label className="image-upload-label">
            <span>📁 Upload Image:</span>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="image-file-input" />
          </label>
        </div>
        <div className="image-divider">— OR —</div>
        <div className="image-url-section">
          <label>
            <span>🔗 Image URL:</span>
            <input type="text" value={imageUrlData} onChange={handleUrlChange} placeholder="e.g., /images/bg1b.png or https://..." className="image-url-input" />
          </label>
        </div>
        {imageUrlData && (
          <div className="split-actions-row">
            <button className="split-add-btn" onClick={handleRemoveRightImage} type="button">Remove Right Image</button>
          </div>
        )}
        {imageUrlData && <div className="image-preview"><img src={imageUrlData} alt="Preview" /></div>}
      </div>
    ) : (
      imageUrlData && (
        <img src={imageUrlData} alt="Content" className="split-image" onClick={() => handleImageClick(imageUrlData)} style={{ cursor: 'pointer' }} />
      )
    )
  );

  return (
    <div className={`split-section-wrapper${isLiveSplitPage ? ' legacy-live-split-page' : ''}${isLivePage13 ? ' legacy-live-page-13-split' : ''}${isLivePage15 ? ' legacy-live-page-15-split' : ''}`}>
      {isLiveSplitPage && <div className="legacy-live-split-logo">EPC·SPACE</div>}
      {title && (
        <div className="split-main-title">
          <h1>{title}</h1>
        </div>
      )}

      {/* HEADER ROW — always a true 50/50 flex row, independent of content */}
      <div style={{ display: 'flex', width: '100%', borderBottom: '1px solid #ddd' }}>
        <div style={{
          flex: 1, padding: '12px 16px', fontWeight: 600, textAlign: 'center',
          fontSize: '0.95rem', letterSpacing: '0.5px', textTransform: 'uppercase',
          backgroundColor: hasLeftHeader ? '#5fc574' : '#e9e9e9',
          color: hasLeftHeader ? 'white' : 'transparent',
          borderRight: '1px solid rgba(0,0,0,0.1)'
        }}>
          {displayLeftHeader || '\u00A0'}
        </div>
        <div style={{
          flex: 1, padding: '12px 16px', fontWeight: 600, textAlign: 'center',
          fontSize: '0.95rem', letterSpacing: '0.5px', textTransform: 'uppercase',
          backgroundColor: hasRightHeader ? '#e8a87c' : '#e9e9e9',
          color: hasRightHeader ? '#ffffff' : 'transparent'
        }}>
          {displayRightHeader || '\u00A0'}
        </div>
      </div>

      {/* CONTENT ROW */}
      <div style={{ display: 'flex', minHeight: '300px', backgroundColor: 'white' }}>
        {contentLayout === 'reversed' ? (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #ddd', overflow: 'hidden' }}>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px', overflow: 'hidden' }}>{imageEditorBlock}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'visible' }}>
              <div style={{ flex: 1, padding: '16px' }}>{renderContent()}</div>
            </div>
          </>
        ) : (
          <>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #ddd', overflow: 'visible' }}>
              <div style={{ flex: 1, padding: '16px' }}>{renderContent()}</div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{
                flex: 1,
                display: 'flex',
                justifyContent: isLiveSplitPage ? 'flex-start' : 'center',
                alignItems: isLiveSplitPage ? 'flex-start' : 'center',
                padding: isLiveSplitPage ? '8px 16px 16px' : '16px',
                overflow: 'hidden'
              }}>{imageEditorBlock}</div>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={showImageModal && !isEditing}
        onClose={handleModalClose}
        imageSrc={modalImageSrc}
      />
    </div>
  );
}

