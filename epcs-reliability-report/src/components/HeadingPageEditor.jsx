import React, { useEffect, useState } from 'react';
import './HeadingPageEditor.css';
import { getTemplateBadge } from '../utils/templateInfo.jsx';

const HeadingPageEditor = ({ page, onChange }) => {
  const deriveHorizontalAlign = (sourcePage) => {
    if (sourcePage.headingHorizontalAlign) return sourcePage.headingHorizontalAlign;
    if (sourcePage.headingVerticalAlign === 'top') return 'left';
    if (sourcePage.headingVerticalAlign === 'bottom') return 'right';
    return 'center';
  };
  const toLegacyHorizontalValue = (align) => {
    if (align === 'left') return 'top';
    if (align === 'right') return 'bottom';
    return 'center';
  };

  const [title, setTitle] = useState(page.title || '');
  const [subtitle, setSubtitle] = useState(page.subtitle || '');
  const [headingBackgroundMode, setHeadingBackgroundMode] = useState(page.headingBackgroundMode || 'default');
  const [headingBackgroundImage, setHeadingBackgroundImage] = useState(page.headingBackgroundImage || '');
  const [headingHorizontalAlign, setHeadingHorizontalAlign] = useState(deriveHorizontalAlign(page));
  const [headingVerticalPosition, setHeadingVerticalPosition] = useState(page.headingVerticalPosition || 'center');
  const [headingFontFamily, setHeadingFontFamily] = useState(page.headingFontFamily || 'inherit');

  useEffect(() => {
    setTitle(page.title || '');
    setSubtitle(page.subtitle || '');
    setHeadingBackgroundMode(page.headingBackgroundMode || 'default');
    setHeadingBackgroundImage(page.headingBackgroundImage || '');
    setHeadingHorizontalAlign(deriveHorizontalAlign(page));
    setHeadingVerticalPosition(page.headingVerticalPosition || 'center');
    setHeadingFontFamily(page.headingFontFamily || 'inherit');
  }, [page.id, page.title, page.subtitle, page.headingBackgroundMode, page.headingBackgroundImage, page.headingHorizontalAlign, page.headingVerticalAlign, page.headingVerticalPosition, page.headingFontFamily]);

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

  const handleHorizontalAlignChange = (e) => {
    const align = e.target.value;
    setHeadingHorizontalAlign(align);
    onChange({
      ...page,
      headingHorizontalAlign: align,
      headingVerticalAlign: toLegacyHorizontalValue(align)
    });
  };

  const handleVerticalPositionChange = (e) => {
    const position = e.target.value;
    setHeadingVerticalPosition(position);
    onChange({ ...page, headingVerticalPosition: position });
  };

  const handleHeadingFontFamilyChange = (e) => {
    const family = e.target.value;
    setHeadingFontFamily(family);
    onChange({ ...page, headingFontFamily: family });
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
          <option value="default">Default</option>
          <option value="custom">Custom background</option>
        </select>
      </div>

      <div className="heading-editor-section">
        <label htmlFor="heading-horizontal-align">Heading horizontal position:</label>
        <select
          id="heading-horizontal-align"
          value={headingHorizontalAlign}
          onChange={handleHorizontalAlignChange}
          className="heading-bg-select"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>

      <div className="heading-editor-section">
        <label htmlFor="heading-vertical-position">Heading vertical position:</label>
        <select
          id="heading-vertical-position"
          value={headingVerticalPosition}
          onChange={handleVerticalPositionChange}
          className="heading-bg-select"
        >
          <option value="top">Top</option>
          <option value="center">Center</option>
          <option value="bottom">Bottom</option>
        </select>
      </div>

      <div className="heading-editor-section">
        <label htmlFor="heading-font-family">Heading font family:</label>
        <select
          id="heading-font-family"
          value={headingFontFamily}
          onChange={handleHeadingFontFamilyChange}
          className="heading-bg-select"
        >
          <option value="inherit">Default</option>
          <option value="Arial, sans-serif">Arial</option>
          <option value="Verdana, sans-serif">Verdana</option>
          <option value="Tahoma, sans-serif">Tahoma</option>
          <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
          <option value="Georgia, serif">Georgia</option>
          <option value="'Times New Roman', serif">Times New Roman</option>
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
