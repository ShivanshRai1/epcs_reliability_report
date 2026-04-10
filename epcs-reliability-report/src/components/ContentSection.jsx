import React, { useEffect, useState } from 'react';
import './ContentSection.css';

const ContentSection = ({ content, isEditing, onChange, isLiveMode = false, fontFamily = 'inherit', contentFontSize = 0.95, contentTextColor = '#e0e6f0' }) => {
  const effectiveLiveMode = isLiveMode || new URLSearchParams(window.location.search).get('live') === '1';
  const [text, setText] = useState(content || '');
  const [editorText, setEditorText] = useState('');
  const [lineStyles, setLineStyles] = useState([]);
  const resolvedContentFontSize = Number.isFinite(Number(contentFontSize)) && Number(contentFontSize) > 0 ? Number(contentFontSize) : 0.95;

  const parseEditorLines = (str) => {
    if (!str) return [];
    return String(str).split(/\r?\n/).map((line) => {
      const tagged = line.match(/^\[(GROUP|BLUE|ORANGE|INDENT-1|INDENT-2)\](.*?)\[\/\1\]$/);
      if (tagged) {
        return { type: tagged[1], text: tagged[2] };
      }
      return { type: 'line', text: line };
    });
  };

  const rebuildStyledText = (plainText, styles) => {
    const lines = String(plainText || '').split(/\r?\n/);
    return lines.map((line, index) => {
      const type = styles[index] || 'line';
      if (!line) return '';
      if (type !== 'line') {
        return `[${type}]${line}[/${type}]`;
      }
      return line;
    }).join('\n');
  };

  useEffect(() => {
    const rawText = content || '';
    const parsedLines = parseEditorLines(rawText);
    setText(rawText);
    setEditorText(parsedLines.map((line) => line.text).join('\n'));
    setLineStyles(parsedLines.map((line) => line.type));
  }, [content]);

  const handleChange = (e) => {
    const visibleText = e.target.value;
    const nextLines = String(visibleText).split(/\r?\n/);
    const nextStyles = nextLines.map((_, index) => lineStyles[index] || 'line');
    const rebuiltText = rebuildStyledText(visibleText, nextStyles);

    setEditorText(visibleText);
    setLineStyles(nextStyles);
    setText(rebuiltText);
    if (onChange) {
      onChange(rebuiltText);
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
      const inlineStyle = {
        fontFamily,
        fontSize: `${resolvedContentFontSize}rem`
      };
      if (style === 'GROUP') {
        inlineStyle.fontSize = `${Math.max(0.8, resolvedContentFontSize + 0.1)}rem`;
      }
      if (style === 'BLUE' || style === 'ORANGE' || style === 'INDENT-1' || style === 'INDENT-2') {
        inlineStyle.fontSize = `${resolvedContentFontSize}rem`;
      }
      elements.push(
        <p key={`styled-${match.index}`} className={className} style={inlineStyle}>
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
        <div className="content-editor-note">Formatting tags are hidden while editing.</div>
        <textarea
          value={editorText}
          onChange={handleChange}
          className="content-textarea"
          style={{ fontFamily, fontSize: `${resolvedContentFontSize}rem`, color: contentTextColor }}
          placeholder="Enter content here..."
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
      <div className="content-text" style={{ fontFamily, fontSize: `${resolvedContentFontSize}rem`, color: contentTextColor }}>
        {parseStyledText(text)}
      </div>
    </div>
  );
};

export default ContentSection;
