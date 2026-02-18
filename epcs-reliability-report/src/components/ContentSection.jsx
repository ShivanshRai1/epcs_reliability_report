import React, { useState } from 'react';
import './ContentSection.css';

const ContentSection = ({ content, isEditing, onChange }) => {
  const [text, setText] = useState(content || '');

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    if (onChange) {
      onChange(newText);
    }
  };

  // Parse styled text with markup: [GROUP]text[/GROUP], [BLUE]text[/BLUE], [ORANGE]text[/ORANGE]
  const parseStyledText = (str) => {
    if (!str) return null;

    const elements = [];
    let lastIndex = 0;
    const regex = /\[(GROUP|BLUE|ORANGE|INDENT-1|INDENT-2)\](.*?)\[\/\1\]/g;
    let match;

    while ((match = regex.exec(str)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        const textBefore = str.substring(lastIndex, match.index);
        if (textBefore.trim()) {
          elements.push(
            <p key={`text-${lastIndex}`} className="content-line">
              {textBefore}
            </p>
          );
        }
      }

      // Add styled element
      const [, style, innerText] = match;
      const className = `content-${style.toLowerCase()}`;
      elements.push(
        <p key={`styled-${match.index}`} className={className}>
          {innerText}
        </p>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < str.length) {
      const remaining = str.substring(lastIndex);
      if (remaining.trim()) {
        elements.push(
          <p key={`text-${lastIndex}`} className="content-line">
            {remaining}
          </p>
        );
      }
    }

    return elements.length > 0 ? elements : <p className="content-line">{str}</p>;
  };

  if (isEditing) {
    return (
      <div className="content-section-edit">
        <textarea
          value={text}
          onChange={handleChange}
          className="content-textarea"
          placeholder="Enter content with markup: [GROUP]text[/GROUP], [BLUE]text[/BLUE], [ORANGE]text[/ORANGE], [INDENT-1]text[/INDENT-1], [INDENT-2]text[/INDENT-2]"
        />
      </div>
    );
  }

  return (
    <div className="content-section">
      <div className="content-text">
        {parseStyledText(text)}
      </div>
    </div>
  );
};

export default ContentSection;
