import React, { useRef } from "react";

const ImageSection = ({ imageSrc, pageTitle, titleColor, imageWidth, imageHeight, isEditMode, onChange, onTitleChange, onTitleColorChange, onImageSizeChange, onImageClick }) => {
  const fileInputRef = useRef();

  const widthValue = Number(imageWidth) > 0 ? Number(imageWidth) : '';
  const heightValue = Number(imageHeight) > 0 ? Number(imageHeight) : '';
  const imageStyle = {
    maxWidth: '100%',
    width: widthValue ? `${widthValue}px` : undefined,
    height: heightValue ? `${heightValue}px` : undefined,
    objectFit: widthValue || heightValue ? 'contain' : undefined,
    cursor: onImageClick ? 'zoom-in' : 'default'
  };

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => {
        if (onChange) onChange(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = e => {
    if (onChange) onChange(e.target.value);
  };

  if (isEditMode) {
    return (
      <div className="image-section-edit">
        <div>
          <label>
            <span>Page Title:</span>
            <input
              type="text"
              value={pageTitle || ''}
              onChange={(e) => onTitleChange && onTitleChange(e.target.value)}
              className="image-url-input"
              placeholder="Enter page title"
            />
          </label>
        </div>
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Title banner color:</span>
            <input
              type="color"
              value={titleColor || '#0052a3'}
              onChange={(e) => onTitleColorChange && onTitleColorChange(e.target.value)}
              style={{ width: '36px', height: '28px', padding: '2px', border: '1px solid #b9c7da', borderRadius: '4px', cursor: 'pointer' }}
            />
          </label>
        </div>
        <div>
          <label>
            <span>Upload Image:</span>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </label>
        </div>
        <div style={{ textAlign: 'center', color: '#e0e6f0', fontSize: '0.9rem', fontWeight: '500' }}>— OR —</div>
        <div>
          <label>
            <span>Enter Image URL:</span>
            <input
              type="text"
              value={imageSrc || ''}
              onChange={handleUrlChange}
              className="image-url-input"
              placeholder="e.g., /images/bgb.png or https://..."
            />
          </label>
        </div>
        <div className="image-preview">
          {imageSrc && <img src={imageSrc} alt="Preview" style={imageStyle} />}
        </div>
        <div>
          <label>
            <span>Image Width (px):</span>
            <input
              type="number"
              min="0"
              step="10"
              value={widthValue}
              onChange={(e) => onImageSizeChange && onImageSizeChange({ imageWidth: e.target.value === '' ? null : Number(e.target.value) })}
              className="image-url-input"
              placeholder="Auto"
            />
          </label>
        </div>
        <div>
          <label>
            <span>Image Height (px):</span>
            <input
              type="number"
              min="0"
              step="10"
              value={heightValue}
              onChange={(e) => onImageSizeChange && onImageSizeChange({ imageHeight: e.target.value === '' ? null : Number(e.target.value) })}
              className="image-url-input"
              placeholder="Auto"
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="image-section">
      {imageSrc && (
        <img
          src={imageSrc}
          alt="Section"
          style={imageStyle}
          onClick={onImageClick}
        />
      )}
    </div>
  );
};

export default ImageSection;
