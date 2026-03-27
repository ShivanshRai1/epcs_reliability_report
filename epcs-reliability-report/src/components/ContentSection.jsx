import React, { useState } from 'react';
import './ContentSection.css';

const ContentSection = ({ content, isEditing, onChange, isLiveMode = false }) => {
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
      // Parse content into segments array for live mode two-column rendering
      const parseToSegments = (str) => {
        if (!str) return [];
        const segments = [];
        let lastIndex = 0;
        const regex = /\[(GROUP|BLUE|ORANGE|INDENT-1|INDENT-2)\](.*?)\[\/\1\]/g;
        let match;
        while ((match = regex.exec(str)) !== null) {
          if (match.index > lastIndex) {
            const t = str.substring(lastIndex, match.index);
            if (t.trim()) segments.push({ type: 'line', text: t.trim() });
          }
          segments.push({ type: match[1], text: match[2] });
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < str.length) {
          const remaining = str.substring(lastIndex);
          if (remaining.trim()) segments.push({ type: 'line', text: remaining.trim() });
        }
        return segments;
      };

      const renderSegment = (seg, idx) => {
        const typeToClass = {
          'GROUP': 'content-group',
          'BLUE': 'content-blue',
          'ORANGE': 'content-orange',
          'INDENT-1': 'content-indent-1',
          'INDENT-2': 'content-indent-2',
          'line': 'content-line',
        };
        return <p key={idx} className={typeToClass[seg.type] || 'content-line'}>{seg.text}</p>;
      };

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
      if (isLiveMode && !isEditing) {
        const segments = parseToSegments(content || '');
        const groupIndices = segments.reduce((acc, seg, i) => {
          if (seg.type === 'GROUP') acc.push(i);
          return acc;
        }, []);
        const halfGroups = Math.ceil(groupIndices.length / 2);
        const splitAt = halfGroups < groupIndices.length ? groupIndices[halfGroups] : segments.length;
        const leftSegs = segments.slice(0, splitAt);
        const rightSegs = segments.slice(splitAt);
        const useTwoCol = rightSegs.length > 0;
        return (
          <div className={useTwoCol ? 'content-section-live' : 'content-section-live content-section-live-single'}>
            <div className="content-live-col">{leftSegs.map(renderSegment)}</div>
            {useTwoCol && <div className="content-live-col">{rightSegs.map(renderSegment)}</div>}
          </div>
        );
      }

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
