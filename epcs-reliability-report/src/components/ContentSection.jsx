import React, { useEffect, useState } from 'react';
import './ContentSection.css';

const ContentSection = ({ content, isEditing, onChange, isLiveMode = false }) => {
  const effectiveLiveMode = isLiveMode || new URLSearchParams(window.location.search).get('live') === '1';
  const [text, setText] = useState(content || '');

  useEffect(() => {
    setText(content || '');
  }, [content]);

  const handleChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    if (onChange) {
      onChange(newText);
    }
  };

  const parseToSegments = (str) => {
    if (!str) return [];
    const segments = [];
    const lines = String(str).split(/\r?\n/);

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const tagged = trimmed.match(/^\[(GROUP|BLUE|ORANGE|INDENT-1|INDENT-2)\](.*?)\[\/\1\]$/);
      if (tagged) {
        segments.push({ type: tagged[1], text: tagged[2].trim() });
        return;
      }

      if (/^GROUP\s+[A-Z]/i.test(trimmed)) {
        segments.push({ type: 'GROUP', text: trimmed });
        return;
      }

      segments.push({ type: 'line', text: trimmed });
    });

    return segments;
  };

  const renderSegment = (seg, idx) => {
    const typeToClass = {
      'GROUP': 'content-row-group',
      'BLUE': 'content-row-blue',
      'ORANGE': 'content-row-orange',
      'INDENT-1': 'content-row-blue content-row-indent-1',
      'INDENT-2': 'content-row-blue content-row-indent-2',
      'line': 'content-row-line',
    };
    return <div key={idx} className={`content-row ${typeToClass[seg.type] || 'content-row-line'}`}>{seg.text}</div>;
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

  if (effectiveLiveMode) {
    const segments = parseToSegments(text || '');
    const groupIndices = segments.reduce((acc, seg, i) => {
      if (seg.type === 'GROUP') acc.push(i);
      return acc;
    }, []);
    const halfGroups = Math.ceil(groupIndices.length / 2);
    const splitAtByGroup = halfGroups < groupIndices.length ? groupIndices[halfGroups] : segments.length;
    const splitAt = splitAtByGroup < segments.length ? splitAtByGroup : Math.ceil(segments.length / 2);
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
    <div className="content-section">
      <div className="content-text">
        {parseStyledText(text)}
      </div>
    </div>
  );
};

export default ContentSection;
