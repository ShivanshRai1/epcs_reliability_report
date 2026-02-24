import React, { useState } from 'react';
import './HeadingPageEditor.css';

const HeadingPageEditor = ({ page, onChange }) => {
  const [title, setTitle] = useState(page.title || '');
  const [subtitle, setSubtitle] = useState(page.subtitle || '');

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

  return (
    <div className="heading-page-editor">
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
    </div>
  );
};

export default HeadingPageEditor;
