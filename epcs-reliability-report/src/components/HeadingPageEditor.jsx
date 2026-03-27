import React, { useEffect, useState } from 'react';
import './HeadingPageEditor.css';
import { getTemplateBadge } from '../utils/templateInfo.jsx';

const HeadingPageEditor = ({ page, onChange }) => {
  const [title, setTitle] = useState(page.title || '');
  const [subtitle, setSubtitle] = useState(page.subtitle || '');
  const [headingBackgroundMode, setHeadingBackgroundMode] = useState(page.headingBackgroundMode || 'default');
  const [headingBackgroundImage, setHeadingBackgroundImage] = useState(page.headingBackgroundImage || '');

  useEffect(() => {
    setTitle(page.title || '');
    setSubtitle(page.subtitle || '');
    setHeadingBackgroundMode(page.headingBackgroundMode || 'default');
    setHeadingBackgroundImage(page.headingBackgroundImage || '');
  }, [page.id, page.title, page.subtitle, page.headingBackgroundMode, page.headingBackgroundImage]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onChange({ ...page, title: newTitle });
  };

  const handleSubtitleChange = (e) => {
    const newSubtitle = e.target.value;
    setSubtitle(newSubtitle);
    onChange({ ...page, subtitle: newSubtitle });
  };

  const handleBackgroundModeChange = (e) => {
    const mode = e.target.value;
    setHeadingBackgroundMode(mode);
    onChange({ ...page, headingBackgroundMode: mode });
  };

  const handleBackgroundUrlChange = (e) => {
    const value = e.target.value;
    setHeadingBackgroundImage(value);
    onChange({ ...page, headingBackgroundMode, headingBackgroundImage: value });
  };

  const handleBackgroundFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const nextImage = String(ev.target?.result || '');
      setHeadingBackgroundImage(nextImage);
      setHeadingBackgroundMode('custom');
      onChange({ ...page, headingBackgroundMode: 'custom', headingBackgroundImage: nextImage });
    };
    reader.readAsDataURL(file);
  };

  const handleResetBackground = () => {
    setHeadingBackgroundMode('default');
    setHeadingBackgroundImage('');
    onChange({ ...page, headingBackgroundMode: 'default', headingBackgroundImage: '' });
  };

  return (
    <div className="heading-page-editor">
      <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
        {getTemplateBadge(page, true)}
      </div>
      <div className="heading-editor-section">
        <label htmlFor="heading-title">Main Title:</label>
        <input
          id="heading-title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="heading-title-input"
          placeholder="e.g., PART LISTS"
        />
      </div>

      <div className="heading-editor-section">
        <label htmlFor="heading-subtitle">Subtitle:</label>
        <input
          id="heading-subtitle"
          type="text"
          value={subtitle}
          onChange={handleSubtitleChange}
          className="heading-subtitle-input"
          placeholder="e.g., EPCS DISCRETE PART NUMBERS"
        />
      </div>

      <div className="heading-editor-section">
        <label htmlFor="heading-background-mode">Heading background:</label>
        <select
          id="heading-background-mode"
          value={headingBackgroundMode}
          onChange={handleBackgroundModeChange}
          className="heading-bg-select"
        >
          <option value="default">Default (bg2)</option>
          <option value="custom">Custom background</option>
        </select>
      </div>

      {headingBackgroundMode === 'custom' && (
        <>
          <div className="heading-editor-section">
            <label htmlFor="heading-background-file">Upload custom background:</label>
            <input
              id="heading-background-file"
              type="file"
              accept="image/*"
              onChange={handleBackgroundFileChange}
              className="heading-bg-file"
            />
          </div>

          <div className="heading-editor-section">
            <label htmlFor="heading-background-url">Or custom image URL:</label>
            <input
              id="heading-background-url"
              type="text"
              value={headingBackgroundImage}
              onChange={handleBackgroundUrlChange}
              className="heading-subtitle-input"
              placeholder="e.g., /images/my-bg.png or https://..."
            />
          </div>

          {headingBackgroundImage && (
            <div className="heading-editor-section">
              <div className="heading-bg-preview-wrap">
                <img src={headingBackgroundImage} alt="Custom heading background preview" className="heading-bg-preview" />
              </div>
              <button type="button" className="heading-bg-reset-btn" onClick={handleResetBackground}>
                Revert to default background
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HeadingPageEditor;
