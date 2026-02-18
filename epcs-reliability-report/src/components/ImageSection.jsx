import React, { useRef } from "react";

const ImageSection = ({ imageSrc, isEditMode, onChange, onImageClick }) => {
  const fileInputRef = useRef();

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
          {imageSrc && <img src={imageSrc} alt="Preview" />}
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
          style={{ maxWidth: "100%", cursor: onImageClick ? "zoom-in" : "default" }}
          onClick={onImageClick}
        />
      )}
    </div>
  );
};

export default ImageSection;
