import React, { useEffect, useRef, useState } from 'react';
import './ContentSection.css';

const ContentSection = ({ content, isEditing, onChange, isLiveMode = false, fontFamily = 'inherit', contentFontSize = 0.95, contentTextColor = '#e0e6f0', contentAlign = 'left', onAlignChange }) => {
  const effectiveLiveMode = isLiveMode || new URLSearchParams(window.location.search).get('live') === '1';
  const [text, setText] = useState(content || '');
  const [editorHtml, setEditorHtml] = useState('');
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false });
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const resolvedContentFontSize = Number.isFinite(Number(contentFontSize)) && Number(contentFontSize) > 0 ? Number(contentFontSize) : 0.95;

  const parseEditorLines = (str) => {
    if (!str) return [{ type: 'line', text: '' }];
    return String(str).split(/\r?\n/).map((line) => {
      const tagged = line.match(/^\[(GROUP|BLUE|ORANGE|INDENT-1|INDENT-2)\](.*?)\[\/\1\]$/);
      if (tagged) {
        return { type: tagged[1], text: tagged[2] };
      }
      return { type: 'line', text: line };
    });
  };

  const sanitizeInlineHtml = (html = '') => {
    if (typeof window === 'undefined') return String(html || '');

    const container = document.createElement('div');
    container.innerHTML = String(html || '')
      .replace(/<span[^>]*font-weight\s*:\s*(bold|bolder|[6-9]00)[^>]*>([\s\S]*?)<\/span>/gi, '<strong>$2</strong>')
      .replace(/<span[^>]*font-style\s*:\s*italic[^>]*>([\s\S]*?)<\/span>/gi, '<em>$1</em>')
      .replace(/<(\/?)b>/gi, '<$1strong>')
      .replace(/<(\/?)i>/gi, '<$1em>');

    const allowedTags = new Set(['STRONG', 'EM', 'BR']);
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
    const nodesToUnwrap = [];
    let currentNode = walker.nextNode();

    while (currentNode) {
      if (!allowedTags.has(currentNode.tagName)) {
        nodesToUnwrap.push(currentNode);
      }
      currentNode = walker.nextNode();
    }

    nodesToUnwrap.forEach((node) => {
      const parent = node.parentNode;
      if (!parent) return;
      while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
      }
      parent.removeChild(node);
    });

    return container.innerHTML.replace(/&nbsp;/g, ' ');
  };

  const renderInlineContent = (value) => ({
    __html: sanitizeInlineHtml(value || '')
  });

  const buildEditorHtml = (rawText = '') => {
    const lines = parseEditorLines(rawText);
    const classMap = {
      GROUP: 'content-row-group',
      BLUE: 'content-row-blue',
      ORANGE: 'content-row-orange',
      'INDENT-1': 'content-row-blue content-row-indent-1',
      'INDENT-2': 'content-row-blue content-row-indent-2',
      line: 'content-row-line'
    };

    return lines.map((line) => {
      const safeHtml = sanitizeInlineHtml(line.text) || '<br>';
      return `<div class="content-editor-line ${classMap[line.type] || 'content-row-line'}" data-line-style="${line.type}">${safeHtml}</div>`;
    }).join('');
  };

  const serializeEditorContent = (root) => {
    if (!root) return '';

    return Array.from(root.children).map((node) => {
      const type = node.getAttribute('data-line-style') || 'line';
      const innerHtml = sanitizeInlineHtml(node.innerHTML || '').replace(/<br\s*\/?>/gi, '').trim();
      if (!innerHtml) return '';
      return type !== 'line' ? `[${type}]${innerHtml}[/${type}]` : innerHtml;
    }).join('\n');
  };

  useEffect(() => {
    const rawText = content || '';
    setText(rawText);

    // Do not rebuild the editable DOM while the user is actively typing in it.
    // That would reset the caret/selection and make the editor feel broken.
    if (editorRef.current) {
      const isFocused = document.activeElement === editorRef.current;
      const currentSerialized = serializeEditorContent(editorRef.current);
      if (isFocused && currentSerialized === rawText) {
        return;
      }
    }

    setEditorHtml(buildEditorHtml(rawText));
  }, [content]);

  // Manually update editor innerHTML only when editorHtml changes and editor is not focused
  useEffect(() => {
    if (!editorRef.current || !editorHtml) return;
    
    // Don't update if user is actively editing
    if (document.activeElement === editorRef.current) return;
    
    editorRef.current.innerHTML = editorHtml;
  }, [editorHtml]);

  const saveSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (!selection || !selectionRef.current) return;
    selection.removeAllRanges();
    selection.addRange(selectionRef.current);
  };

  const updateActiveFormats = () => {
    if (!editorRef.current) {
      setActiveFormats({ bold: false, italic: false });
      return;
    }

    const selection = window.getSelection();
    const hasEditorSelection = Boolean(
      selection &&
      selection.rangeCount > 0 &&
      editorRef.current.contains(selection.getRangeAt(0).commonAncestorContainer)
    );
    const isEditorFocused = document.activeElement === editorRef.current;

    if (!isEditorFocused && !hasEditorSelection) {
      setActiveFormats({ bold: false, italic: false });
      return;
    }

    setActiveFormats({
      bold: Boolean(document.queryCommandState && document.queryCommandState('bold')),
      italic: Boolean(document.queryCommandState && document.queryCommandState('italic')),
    });
  };

  const handleEditorInput = () => {
    const rebuiltText = serializeEditorContent(editorRef.current);
    setText(rebuiltText);
    if (onChange) {
      onChange(rebuiltText);
    }
    saveSelection();
    updateActiveFormats();
  };

  const applyInlineFormat = (command) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    restoreSelection();

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const tagName = command === 'bold' ? 'strong' : command === 'italic' ? 'em' : null;
    const isCurrentlyActive = tagName && document.queryCommandState && document.queryCommandState(command);

    if (tagName && isCurrentlyActive) {
      // REMOVE formatting: directly unwrap all matching tags in every selected editor line
      const range = sel.getRangeAt(0);
      const lineDivs = Array.from(editorRef.current.querySelectorAll('[data-line-style]'));
      lineDivs.forEach((div) => {
        if (!range.intersectsNode(div)) return;
        Array.from(div.querySelectorAll(tagName)).forEach((tag) => {
          const parent = tag.parentNode;
          if (!parent) return;
          while (tag.firstChild) parent.insertBefore(tag.firstChild, tag);
          parent.removeChild(tag);
        });
      });
    } else {
      // ADD formatting (or non-bold/italic command): use native execCommand
      document.execCommand(command, false, null);
    }

    handleEditorInput();
    saveSelection();
    updateActiveFormats();
  };

  const handlePastePlainText = (e) => {
    e.preventDefault();
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, pastedText);
  };

  const handleAlignChange = (newAlign) => {
    if (onAlignChange) {
      onAlignChange(newAlign);
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
    return <div key={idx} className={`content-row ${typeToClass[seg.type] || 'content-row-line'}`} dangerouslySetInnerHTML={renderInlineContent(seg.text)} />;
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
            <p key={`text-${lastIndex}`} className="content-line" dangerouslySetInnerHTML={renderInlineContent(textBefore)} />
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
        <p key={`styled-${match.index}`} className={className} style={inlineStyle} dangerouslySetInnerHTML={renderInlineContent(innerText)} />
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < str.length) {
      const remaining = str.substring(lastIndex);
      if (remaining.trim()) {
        elements.push(
          <p key={`text-${lastIndex}`} className="content-line" dangerouslySetInnerHTML={renderInlineContent(remaining)} />
        );
      }
    }

    return elements.length > 0 ? elements : <p className="content-line">{str}</p>;
  };

  if (isEditing) {
    return (
      <div className="content-section-edit">
        <div className="content-editor-toolbar">
          <button type="button" className={`content-editor-btn ${activeFormats.bold ? 'active' : ''}`} onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('bold'); }} title="Bold selected text"><strong>B</strong></button>
          <button type="button" className={`content-editor-btn ${activeFormats.italic ? 'active' : ''}`} onMouseDown={(e) => { e.preventDefault(); applyInlineFormat('italic'); }} title="Italic selected text"><em>I</em></button>
          {onAlignChange && (
            <>
              <span style={{ width: '1px', height: '20px', background: '#ccc', margin: '0 8px' }}></span>
              <button type="button" className={`content-editor-btn ${contentAlign === 'left' ? 'active' : ''}`} onClick={() => handleAlignChange('left')} title="Align left">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 2h16v2H0V2zm0 4h10v2H0V6zm0 4h16v2H0v-2zm0 4h10v2H0v-2z"/></svg>
              </button>
              <button type="button" className={`content-editor-btn ${contentAlign === 'center' ? 'active' : ''}`} onClick={() => handleAlignChange('center')} title="Align center">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 2h16v2H0V2zm3 4h10v2H3V6zm-3 4h16v2H0v-2zm3 4h10v2H3v-2z"/></svg>
              </button>
              <button type="button" className={`content-editor-btn ${contentAlign === 'right' ? 'active' : ''}`} onClick={() => handleAlignChange('right')} title="Align right">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 2h16v2H0V2zm6 4h10v2H6V6zm-6 4h16v2H0v-2zm6 4h10v2H6v-2z"/></svg>
              </button>
            </>
          )}
        </div>
        <div className="content-editor-note">Formatting tags are hidden while editing. Bold and italic are supported for selected text.</div>
        <div
          ref={editorRef}
          className="content-editor-rich"
          contentEditable
          suppressContentEditableWarning
          onInput={handleEditorInput}
          onFocus={() => { saveSelection(); updateActiveFormats(); }}
          onBlur={() => { handleEditorInput(); setActiveFormats({ bold: false, italic: false }); }}
          onKeyUp={() => { saveSelection(); updateActiveFormats(); }}
          onMouseUp={() => { saveSelection(); updateActiveFormats(); }}
          onPaste={handlePastePlainText}
          style={{ fontFamily, fontSize: `${resolvedContentFontSize}rem`, color: contentTextColor, textAlign: contentAlign }}
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
      <div className="content-text" style={{ fontFamily, fontSize: `${resolvedContentFontSize}rem`, color: contentTextColor, textAlign: contentAlign }}>
        {parseStyledText(text)}
      </div>
    </div>
  );
};

export default ContentSection;
