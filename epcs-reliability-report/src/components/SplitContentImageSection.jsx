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
  leftImageUrl,
  titleColor,
  leftHeaderColor,
  rightHeaderColor,
  fontFamily,
  titleFontSize,
  headerFontSize,
  contentFontSize,
  imageWidth,
  imageHeight,
  leftImageWidth,
  leftImageHeight,
  rightImageWidth,
  rightImageHeight
}) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState('');
  const [titleData, setTitleData] = useState(title || '');
  const [leftHeaderData, setLeftHeaderData] = useState(leftHeader || '');
  const [rightHeaderData, setRightHeaderData] = useState(rightHeader || '');
  const [titleColorData, setTitleColorData] = useState(titleColor || '#0052a3');
  const [leftHeaderColorData, setLeftHeaderColorData] = useState(leftHeaderColor || '#5fc574');
  const [rightHeaderColorData, setRightHeaderColorData] = useState(rightHeaderColor || '#e8a87c');
  const [fontFamilyData, setFontFamilyData] = useState(fontFamily || 'inherit');
  const [titleFontSizeData, setTitleFontSizeData] = useState(Number(titleFontSize) > 0 ? Number(titleFontSize) : 1.2);
  const [headerFontSizeData, setHeaderFontSizeData] = useState(Number(headerFontSize) > 0 ? Number(headerFontSize) : 0.95);
  const [contentFontSizeData, setContentFontSizeData] = useState(Number(contentFontSize) > 0 ? Number(contentFontSize) : 0.95);
  const [leftImageWidthData, setLeftImageWidthData] = useState(Number(leftImageWidth || imageWidth) > 0 ? Number(leftImageWidth || imageWidth) : null);
  const [leftImageHeightData, setLeftImageHeightData] = useState(Number(leftImageHeight || imageHeight) > 0 ? Number(leftImageHeight || imageHeight) : null);
  const [rightImageWidthData, setRightImageWidthData] = useState(Number(rightImageWidth || imageWidth) > 0 ? Number(rightImageWidth || imageWidth) : null);
  const [rightImageHeightData, setRightImageHeightData] = useState(Number(rightImageHeight || imageHeight) > 0 ? Number(rightImageHeight || imageHeight) : null);
  const [links, setLinks] = useState([]);
  const [imageUrlData, setImageUrlData] = useState(imageUrl || '');
  const [leftImageUrlData, setLeftImageUrlData] = useState(leftImageUrl || '');
  const [leftContentData, setLeftContentData] = useState(leftContent || '');
  const fileInputRef = useRef();

  const emitImmediateChange = (overrides = {}) => {
    if (!isEditing || !onChange) return;
    onChange({
      title: titleData,
      leftHeader: leftHeaderData,
      rightHeader: rightHeaderData,
      content: links,
      imageUrl: imageUrlData,
      leftContent: leftContentData,
      leftImageUrl: leftImageUrlData,
      titleColor: titleColorData,
      leftHeaderColor: leftHeaderColorData,
      rightHeaderColor: rightHeaderColorData,
      fontFamily: fontFamilyData,
      titleFontSize: titleFontSizeData,
      headerFontSize: headerFontSizeData,
      contentFontSize: contentFontSizeData,
      leftImageWidth: leftImageWidthData,
      leftImageHeight: leftImageHeightData,
      rightImageWidth: rightImageWidthData,
      rightImageHeight: rightImageHeightData,
      ...overrides
    });
  };

  useEffect(() => {
    if (isEditing) return;
    setTitleData(typeof title === 'string' ? title : (title ? String(title) : ''));
  }, [title, isEditing]);

  useEffect(() => {
    if (isEditing) return;
    setLeftHeaderData(typeof leftHeader === 'string' ? leftHeader : (leftHeader ? String(leftHeader) : ''));
  }, [leftHeader, isEditing]);

  useEffect(() => {
    if (isEditing) return;
    setRightHeaderData(typeof rightHeader === 'string' ? rightHeader : (rightHeader ? String(rightHeader) : ''));
  }, [rightHeader, isEditing]);

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

  useEffect(() => {
    if (isEditing) return;
    setFontFamilyData(fontFamily || 'inherit');
    setTitleFontSizeData(Number(titleFontSize) > 0 ? Number(titleFontSize) : 1.2);
    setHeaderFontSizeData(Number(headerFontSize) > 0 ? Number(headerFontSize) : 0.95);
    setContentFontSizeData(Number(contentFontSize) > 0 ? Number(contentFontSize) : 0.95);
    setLeftImageWidthData(Number(leftImageWidth || imageWidth) > 0 ? Number(leftImageWidth || imageWidth) : null);
    setLeftImageHeightData(Number(leftImageHeight || imageHeight) > 0 ? Number(leftImageHeight || imageHeight) : null);
    setRightImageWidthData(Number(rightImageWidth || imageWidth) > 0 ? Number(rightImageWidth || imageWidth) : null);
    setRightImageHeightData(Number(rightImageHeight || imageHeight) > 0 ? Number(rightImageHeight || imageHeight) : null);
  }, [fontFamily, titleFontSize, headerFontSize, contentFontSize, imageWidth, imageHeight, leftImageWidth, leftImageHeight, rightImageWidth, rightImageHeight, isEditing]);

  // Debounced auto-save when content or image changes (prevents flickering on rapid edits)
  useEffect(() => {
    if (!isEditing || !onChange) return;
    
    const timer = setTimeout(() => {
      onChange({
        title: titleData,
        leftHeader: leftHeaderData,
        rightHeader: rightHeaderData,
        content: links,
        imageUrl: imageUrlData,
        leftContent: leftContentData,
        leftImageUrl: leftImageUrlData,
        titleColor: titleColorData,
        leftHeaderColor: leftHeaderColorData,
        rightHeaderColor: rightHeaderColorData,
        fontFamily: fontFamilyData,
        titleFontSize: titleFontSizeData,
        headerFontSize: headerFontSizeData,
        contentFontSize: contentFontSizeData,
        leftImageWidth: leftImageWidthData,
        leftImageHeight: leftImageHeightData,
        rightImageWidth: rightImageWidthData,
        rightImageHeight: rightImageHeightData,
      });
    }, 300); // Debounce: wait 300ms after changes stop before saving
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleData, leftHeaderData, rightHeaderData, links, imageUrlData, leftContentData, leftImageUrlData, titleColorData, leftHeaderColorData, rightHeaderColorData, fontFamilyData, titleFontSizeData, headerFontSizeData, contentFontSizeData, leftImageWidthData, leftImageHeightData, rightImageWidthData, rightImageHeightData, isEditing]);

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

  const displayLeftHeader = layout === 'reversed' ? rightHeaderData : leftHeaderData;
  const displayRightHeader = layout === 'reversed' ? leftHeaderData : rightHeaderData;
  const hasLeftHeader = Boolean(String(displayLeftHeader || '').trim());
  const hasRightHeader = Boolean(String(displayRightHeader || '').trim());
  const contentLayout = splitImageLinksMode ? 'reversed' : layout;
  const isLiveSplitPage = isLiveMode && !isEditing;
  const isLivePage13 = isLiveMode && Number(pageNumber) === 13;
  const isLivePage15 = isLiveMode && Number(pageNumber) === 15;
  const leftImageStyle = {
    width: leftImageWidthData ? `${leftImageWidthData}px` : undefined,
    height: leftImageHeightData ? `${leftImageHeightData}px` : undefined,
    objectFit: leftImageWidthData || leftImageHeightData ? 'contain' : undefined,
    cursor: 'pointer'
  };
  const rightImageStyle = {
    width: rightImageWidthData ? `${rightImageWidthData}px` : undefined,
    height: rightImageHeightData ? `${rightImageHeightData}px` : undefined,
    objectFit: rightImageWidthData || rightImageHeightData ? 'contain' : undefined,
    cursor: 'pointer'
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const formatValue = (value, decimals = 2) => Number(value).toFixed(decimals).replace(/\.00$/, '').replace(/(\.\d*[1-9])0$/, '$1');
  const renderStepper = ({ label, value, unit = '', onDecrease, onIncrease, onAuto }) => (
    <div style={{ display: 'grid', gap: '4px', fontSize: '0.8rem', color: '#334155' }}>
      <div>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button type="button" onClick={onDecrease} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #c8d3e7', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>-</button>
        <div style={{ flex: 1, textAlign: 'center', padding: '6px 8px', border: '1px solid #c8d3e7', borderRadius: '6px', background: '#fff', minHeight: '28px' }}>
          {value === null || value === undefined || value === 0 ? 'Auto' : `${formatValue(value, unit === 'px' ? 0 : 2)}${unit ? ` ${unit}` : ''}`}
        </div>
        <button type="button" onClick={onIncrease} style={{ width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #c8d3e7', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>+</button>
        {onAuto && (
          <button type="button" onClick={onAuto} style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid #c8d3e7', background: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>
            Auto
          </button>
        )}
      </div>
    </div>
  );

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
        {leftImageUrlData && <div className="image-preview"><img src={leftImageUrlData} alt="Left Preview" style={leftImageStyle} /></div>}
      </div>
    ) : (
      leftImageUrlData && (
        <img src={leftImageUrlData} alt="Left Content" className="split-image" onClick={() => handleImageClick(leftImageUrlData)} style={leftImageStyle} />
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
        <div className="split-left-content-text" style={{ fontFamily: fontFamilyData, fontSize: `${contentFontSizeData}rem` }}>
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
        <div className="split-content-display" style={{ fontFamily: fontFamilyData, fontSize: `${contentFontSizeData}rem` }}>
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
        <div className="split-left-content-text" style={{ fontFamily: fontFamilyData, fontSize: `${contentFontSizeData}rem` }}>
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
      <div className="split-content-display" style={{ fontFamily: fontFamilyData, fontSize: `${contentFontSizeData}rem` }}>
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
        {imageUrlData && <div className="image-preview"><img src={imageUrlData} alt="Preview" style={rightImageStyle} /></div>}
      </div>
    ) : (
      imageUrlData && (
        <img src={imageUrlData} alt="Content" className="split-image" onClick={() => handleImageClick(imageUrlData)} style={rightImageStyle} />
      )
    )
  );

  return (
    <div className={`split-section-wrapper${isLiveSplitPage ? ' legacy-live-split-page' : ''}${isLivePage13 ? ' legacy-live-page-13-split' : ''}${isLivePage15 ? ' legacy-live-page-15-split' : ''}`}>
      {isLiveSplitPage && <div className="legacy-live-split-logo">EPC·SPACE</div>}
      {isEditing && (
        <div style={{ display: 'grid', gap: '8px', padding: '10px 12px', background: '#f4f6fb', borderBottom: '1px solid #d8dee9' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={titleData}
              onChange={(e) => {
                const next = String(e.target.value);
                setTitleData(next);
                emitImmediateChange({ title: next });
              }}
              placeholder="Main heading (e.g., DIE LEVEL RELIABILITY)"
              style={{ flex: 1, padding: '8px 10px', border: '1px solid #b9c7da', borderRadius: '6px' }}
            />
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#555', whiteSpace: 'nowrap' }}>
              Title color
              <input
                type="color"
                value={titleColorData}
                onChange={(e) => { setTitleColorData(e.target.value); emitImmediateChange({ titleColor: e.target.value }); }}
                style={{ width: '32px', height: '28px', padding: '2px', border: '1px solid #b9c7da', borderRadius: '4px', cursor: 'pointer' }}
              />
            </label>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                value={leftHeaderData}
                onChange={(e) => {
                  const next = String(e.target.value);
                  setLeftHeaderData(next);
                  emitImmediateChange({ leftHeader: next });
                }}
                placeholder="Left header"
                style={{ flex: 1, padding: '8px 10px', border: '1px solid #b9c7da', borderRadius: '6px' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#555', whiteSpace: 'nowrap' }}>
                <input
                  type="color"
                  value={leftHeaderColorData}
                  onChange={(e) => { setLeftHeaderColorData(e.target.value); emitImmediateChange({ leftHeaderColor: e.target.value }); }}
                  style={{ width: '32px', height: '28px', padding: '2px', border: '1px solid #b9c7da', borderRadius: '4px', cursor: 'pointer' }}
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input
                type="text"
                value={rightHeaderData}
                onChange={(e) => {
                  const next = String(e.target.value);
                  setRightHeaderData(next);
                  emitImmediateChange({ rightHeader: next });
                }}
                placeholder="Right header"
                style={{ flex: 1, padding: '8px 10px', border: '1px solid #b9c7da', borderRadius: '6px' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#555', whiteSpace: 'nowrap' }}>
                <input
                  type="color"
                  value={rightHeaderColorData}
                  onChange={(e) => { setRightHeaderColorData(e.target.value); emitImmediateChange({ rightHeaderColor: e.target.value }); }}
                  style={{ width: '32px', height: '28px', padding: '2px', border: '1px solid #b9c7da', borderRadius: '4px', cursor: 'pointer' }}
                />
              </label>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '8px', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <label style={{ display: 'grid', gap: '4px', fontSize: '0.8rem', color: '#334155' }}>
              Font
              <select value={fontFamilyData} onChange={(e) => { setFontFamilyData(e.target.value); emitImmediateChange({ fontFamily: e.target.value }); }} style={{ padding: '6px 8px', border: '1px solid #c8d3e7', borderRadius: '6px' }}>
                <option value="inherit">Default</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
              </select>
            </label>
            {renderStepper({
              label: 'Title size',
              value: titleFontSizeData,
              unit: 'rem',
              onDecrease: () => { const val = clamp(titleFontSizeData - 0.05, 0.8, 3); setTitleFontSizeData(val); emitImmediateChange({ titleFontSize: val }); },
              onIncrease: () => { const val = clamp(titleFontSizeData + 0.05, 0.8, 3); setTitleFontSizeData(val); emitImmediateChange({ titleFontSize: val }); }
            })}
            {renderStepper({
              label: 'Header size',
              value: headerFontSizeData,
              unit: 'rem',
              onDecrease: () => { const val = clamp(headerFontSizeData - 0.05, 0.75, 2.5); setHeaderFontSizeData(val); emitImmediateChange({ headerFontSize: val }); },
              onIncrease: () => { const val = clamp(headerFontSizeData + 0.05, 0.75, 2.5); setHeaderFontSizeData(val); emitImmediateChange({ headerFontSize: val }); }
            })}
            {renderStepper({
              label: 'Content size',
              value: contentFontSizeData,
              unit: 'rem',
              onDecrease: () => { const val = clamp(contentFontSizeData - 0.05, 0.7, 2); setContentFontSizeData(val); emitImmediateChange({ contentFontSize: val }); },
              onIncrease: () => { const val = clamp(contentFontSizeData + 0.05, 0.7, 2); setContentFontSizeData(val); emitImmediateChange({ contentFontSize: val }); }
            })}
            {renderStepper({
              label: 'Left image width',
              value: leftImageWidthData,
              unit: 'px',
              onDecrease: () => { const val = Math.max(0, (leftImageWidthData || 0) - 50) || null; setLeftImageWidthData(val); emitImmediateChange({ leftImageWidth: val }); },
              onIncrease: () => { const val = (leftImageWidthData || 0) + 50; setLeftImageWidthData(val); emitImmediateChange({ leftImageWidth: val }); },
              onAuto: () => { setLeftImageWidthData(null); emitImmediateChange({ leftImageWidth: null }); }
            })}
            {renderStepper({
              label: 'Left image height',
              value: leftImageHeightData,
              unit: 'px',
              onDecrease: () => { const val = Math.max(0, (leftImageHeightData || 0) - 50) || null; setLeftImageHeightData(val); emitImmediateChange({ leftImageHeight: val }); },
              onIncrease: () => { const val = (leftImageHeightData || 0) + 50; setLeftImageHeightData(val); emitImmediateChange({ leftImageHeight: val }); },
              onAuto: () => { setLeftImageHeightData(null); emitImmediateChange({ leftImageHeight: null }); }
            })}
            {renderStepper({
              label: 'Right image width',
              value: rightImageWidthData,
              unit: 'px',
              onDecrease: () => { const val = Math.max(0, (rightImageWidthData || 0) - 50) || null; setRightImageWidthData(val); emitImmediateChange({ rightImageWidth: val }); },
              onIncrease: () => { const val = (rightImageWidthData || 0) + 50; setRightImageWidthData(val); emitImmediateChange({ rightImageWidth: val }); },
              onAuto: () => { setRightImageWidthData(null); emitImmediateChange({ rightImageWidth: null }); }
            })}
            {renderStepper({
              label: 'Right image height',
              value: rightImageHeightData,
              unit: 'px',
              onDecrease: () => { const val = Math.max(0, (rightImageHeightData || 0) - 50) || null; setRightImageHeightData(val); emitImmediateChange({ rightImageHeight: val }); },
              onIncrease: () => { const val = (rightImageHeightData || 0) + 50; setRightImageHeightData(val); emitImmediateChange({ rightImageHeight: val }); },
              onAuto: () => { setRightImageHeightData(null); emitImmediateChange({ rightImageHeight: null }); }
            })}
          </div>
        </div>
      )}
      {titleData && (
        <div className="split-main-title" style={{ background: titleColorData || undefined, fontFamily: fontFamilyData, fontSize: `${titleFontSizeData}rem` }}>
          <h1>{titleData}</h1>
        </div>
      )}

      {/* HEADER ROW — always a true 50/50 flex row, independent of content */}
      <div style={{ display: 'flex', width: '100%', borderBottom: '1px solid #ddd' }}>
        <div style={{
          flex: 1, padding: '12px 16px', fontWeight: 600, textAlign: 'center',
          fontSize: `${headerFontSizeData}rem`, letterSpacing: '0.5px', textTransform: 'uppercase',
          fontFamily: fontFamilyData,
          backgroundColor: hasLeftHeader ? (leftHeaderColorData || '#5fc574') : '#e9e9e9',
          color: hasLeftHeader ? 'white' : 'transparent',
          borderRight: '1px solid rgba(0,0,0,0.1)'
        }}>
          {displayLeftHeader || '\u00A0'}
        </div>
        <div style={{
          flex: 1, padding: '12px 16px', fontWeight: 600, textAlign: 'center',
          fontSize: `${headerFontSizeData}rem`, letterSpacing: '0.5px', textTransform: 'uppercase',
          fontFamily: fontFamilyData,
          backgroundColor: hasRightHeader ? (rightHeaderColorData || '#e8a87c') : '#e9e9e9',
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

