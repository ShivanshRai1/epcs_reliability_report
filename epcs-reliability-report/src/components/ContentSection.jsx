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
      .replace(/<span[^>]*font-weight\s*:\s*(bold|bolder|[7-9]00)[^>]*>([\s\S]*?)<\/span>/gi, '<strong>$2</strong>')
      .replace(/<span[^>]*font-style\s*:\s*italic[^>]*>([\s\S]*?)<\/span>/gi, '<em>$1</em>')
      .replace(/<(\/?)b>/gi, '<$1strong>')
      .replace(/<(\/?)i>/gi, '<$1em>');

    const allowedTags = new Set(['STRONG', 'EM', 'BR', 'SPAN']);
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
    const nodesToUnwrap = [];
    let currentNode = walker.nextNode();

    while (currentNode) {
      if (currentNode.tagName === 'SPAN') {
        const rawScale = currentNode.getAttribute('data-text-scale') || '';
        const parsedScale = Number.parseFloat(rawScale);
        const safeScale = Number.isFinite(parsedScale) ? Math.min(2, Math.max(0.7, parsedScale)) : 1;

        // Keep only the custom text-scale marker and a normalized font-size style.
        Array.from(currentNode.attributes).forEach((attr) => {
          if (attr.name !== 'data-text-scale') {
            currentNode.removeAttribute(attr.name);
          }
        });

        currentNode.setAttribute('data-text-scale', String(Number(safeScale.toFixed(2))));
        currentNode.setAttribute('style', `font-size: ${safeScale}em;`);
      }

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
      bold: isSelectionOrCaretFormatted('strong'),
      italic: isSelectionOrCaretFormatted('em'),
    });
  };

  const rangeIntersectsNode = (range, node) => {
    if (!range || !node) return false;

    if (typeof range.intersectsNode === 'function') {
      try {
        return range.intersectsNode(node);
      } catch {
        // Fall back to manual boundary comparison below.
      }
    }

    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(node);
    return !(
      range.compareBoundaryPoints(Range.END_TO_START, nodeRange) < 0 ||
      range.compareBoundaryPoints(Range.START_TO_END, nodeRange) > 0
    );
  };

  const getSelectedLineRanges = () => {
    if (!editorRef.current) return [];

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return [];

    const selectionRange = selection.getRangeAt(0);
    return Array.from(editorRef.current.querySelectorAll('[data-line-style]'))
      .filter((line) => rangeIntersectsNode(selectionRange, line))
      .map((line) => {
        const lineRange = document.createRange();

        if (line.contains(selectionRange.startContainer)) {
          lineRange.setStart(selectionRange.startContainer, selectionRange.startOffset);
        } else {
          lineRange.setStart(line, 0);
        }

        if (line.contains(selectionRange.endContainer)) {
          lineRange.setEnd(selectionRange.endContainer, selectionRange.endOffset);
        } else {
          lineRange.setEnd(line, line.childNodes.length);
        }

        return { line, range: lineRange };
      });
  };

  // --- IMPROVED FORMAT DETECTION ---
  // Returns true if every text node in the selection is fully wrapped in the given tag (strong/em),
  // or has the corresponding style (font-weight/font-style) applied.
  const isSelectionFullyFormatted = (tagName) => {
    const selectedRanges = getSelectedLineRanges();
    if (selectedRanges.length === 0) return false;
    let foundText = false;
    for (const { line, range } of selectedRanges) {
      const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
      let textNode = walker.nextNode();
      while (textNode) {
        if (textNode.textContent.trim() && rangeIntersectsNode(range, textNode)) {
          foundText = true;
          let current = textNode.parentNode;
          let hasFormat = false;
          while (current && current !== line) {
            if (current.nodeType === Node.ELEMENT_NODE) {
              if (current.tagName.toLowerCase() === tagName) {
                hasFormat = true;
                break;
              }
              // Also check for style-based formatting
              const style = current.getAttribute && current.getAttribute('style');
              if (tagName === 'strong' && style && /font-weight\s*:\s*(bold|bolder|[7-9]00)/i.test(style)) {
                hasFormat = true;
                break;
              }
              if (tagName === 'em' && style && /font-style\s*:\s*italic/i.test(style)) {
                hasFormat = true;
                break;
              }
            }
            current = current.parentNode;
          }
          if (!hasFormat) {
            return false;
          }
        }
        textNode = walker.nextNode();
      }
    }
    return foundText;
  };

  // Returns true if the caret is inside a tag or style span for the given format
  const isCaretInsideTag = (tagName) => {
    if (!editorRef.current) return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) return false;
    let current = selection.anchorNode;
    if (!current) return false;
    if (current.nodeType === Node.TEXT_NODE) {
      current = current.parentNode;
    }
    while (current && current !== editorRef.current) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        if (current.tagName.toLowerCase() === tagName) return true;
        const style = current.getAttribute && current.getAttribute('style');
        if (tagName === 'strong' && style && /font-weight\s*:\s*(bold|bolder|[7-9]00)/i.test(style)) return true;
        if (tagName === 'em' && style && /font-style\s*:\s*italic/i.test(style)) return true;
      }
      current = current.parentNode;
    }
    return false;
  };

  // Returns true if the selection or caret is fully formatted with the given tag/style
  const isSelectionOrCaretFormatted = (tagName) => {
    if (!editorRef.current) return false;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      return false;
    }
    if (selection.isCollapsed) {
      return isCaretInsideTag(tagName);
    }
    return isSelectionFullyFormatted(tagName);
  };

  const unwrapFormatTags = (root, tagName) => {
    if (!root || !tagName || typeof root.querySelectorAll !== 'function') return;

    // Recursively unwrap all instances of the tag, even if nested
    let tags = Array.from(root.querySelectorAll(tagName));
    while (tags.length > 0) {
      tags.forEach((tag) => {
        const parent = tag.parentNode;
        if (!parent) return;
        while (tag.firstChild) {
          parent.insertBefore(tag.firstChild, tag);
        }
        parent.removeChild(tag);
      });
      tags = Array.from(root.querySelectorAll(tagName));
    }

    // Also unwrap inline style-based formatting produced by browser editing commands.
    if (tagName === 'strong' || tagName === 'em') {
      const isMatch = (styleValue = '') => {
        if (tagName === 'strong') {
          return /font-weight\s*:\s*(bold|bolder|[7-9]00)/i.test(styleValue);
        }
        return /font-style\s*:\s*italic/i.test(styleValue);
      };

      let spans = Array.from(root.querySelectorAll('span[style]'));
      while (spans.length > 0) {
        spans.forEach((span) => {
          const styleValue = span.getAttribute('style') || '';
          if (!isMatch(styleValue)) return;
          const parent = span.parentNode;
          if (!parent) return;
          while (span.firstChild) {
            parent.insertBefore(span.firstChild, span);
          }
          parent.removeChild(span);
        });
        spans = Array.from(root.querySelectorAll('span[style]'));
      }
    }
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
    const initialSelection = window.getSelection();
    const hasActiveEditorSelection = Boolean(
      initialSelection &&
      initialSelection.rangeCount > 0 &&
      editorRef.current.contains(initialSelection.getRangeAt(0).commonAncestorContainer)
    );
    if (!hasActiveEditorSelection) {
      restoreSelection();
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const tagName = command === 'bold' ? 'strong' : command === 'italic' ? 'em' : null;
    if (!tagName) return;

    if (selection.isCollapsed) {
      document.execCommand(command, false, null);
      handleEditorInput();
      saveSelection();
      updateActiveFormats();
      return;
    }


    const shouldRemove = isSelectionFullyFormatted(tagName);
    const selectedRanges = getSelectedLineRanges().reverse();
    const insertedBoundaries = [];

    selectedRanges.forEach(({ range }) => {
      const fragment = range.extractContents();
      if (!fragment) return;

      if (shouldRemove) {
        // Remove only the relevant format, keep the other
        unwrapFormatTags(fragment, tagName);
        const insertedNodes = Array.from(fragment.childNodes);
        range.insertNode(fragment);
        if (insertedNodes.length > 0) {
          insertedBoundaries.push({
            first: insertedNodes[0],
            last: insertedNodes[insertedNodes.length - 1]
          });
        }
        return;
      }

      // --- NEST THE NEW FORMAT INSIDE EXISTING FORMATS ---
      // If the fragment is already wrapped in the other format, preserve it and wrap the new tag around it
      // e.g., if fragment is <strong>text</strong> and we apply italic, result should be <strong><em>text</em></strong>
      // If fragment is <em>text</em> and we apply bold, result should be <em><strong>text</strong></em>

      // If fragment has only one child and it's the other format, wrap inside
      const otherTag = tagName === 'strong' ? 'em' : 'strong';
      if (
        fragment.childNodes.length === 1 &&
        fragment.firstChild.nodeType === Node.ELEMENT_NODE &&
        fragment.firstChild.tagName.toLowerCase() === otherTag
      ) {
        // Wrap the child in the new tag
        const wrapper = document.createElement(tagName);
        while (fragment.firstChild.firstChild) {
          wrapper.appendChild(fragment.firstChild.firstChild);
        }
        fragment.firstChild.appendChild(wrapper);
        range.insertNode(fragment);
        insertedBoundaries.push({ first: fragment, last: fragment });
        return;
      }

      // Otherwise, just wrap the fragment in the new tag
      unwrapFormatTags(fragment, tagName); // Remove any duplicate tags
      const wrapper = document.createElement(tagName);
      while (fragment.firstChild) {
        wrapper.appendChild(fragment.firstChild);
      }
      range.insertNode(wrapper);
      insertedBoundaries.push({ first: wrapper, last: wrapper });
    });

    handleEditorInput();

    if (insertedBoundaries.length > 0) {
      const startNode = insertedBoundaries[insertedBoundaries.length - 1].first;
      const endNode = insertedBoundaries[0].last;
      requestAnimationFrame(() => {
        if (!editorRef.current || !editorRef.current.contains(startNode) || !editorRef.current.contains(endNode)) return;
        editorRef.current.focus();
        const sel = window.getSelection();
        if (!sel) return;
        const newRange = document.createRange();
        newRange.setStartBefore(startNode);
        newRange.setEndAfter(endNode);
        sel.removeAllRanges();
        sel.addRange(newRange);
        selectionRef.current = newRange.cloneRange();
        updateActiveFormats();
      });
      return;
    }

    saveSelection();
    updateActiveFormats();
  };

  const applyInlineTextScale = (delta) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    const initialSelection = window.getSelection();
    const hasActiveEditorSelection = Boolean(
      initialSelection &&
      initialSelection.rangeCount > 0 &&
      editorRef.current.contains(initialSelection.getRangeAt(0).commonAncestorContainer)
    );
    if (!hasActiveEditorSelection) {
      restoreSelection();
    }

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const selectedRanges = getSelectedLineRanges().reverse();
    const insertedWrappers = [];

    selectedRanges.forEach(({ range }) => {
      const fragment = range.extractContents();
      if (!fragment || !fragment.textContent?.trim()) return;

      const wrapper = document.createElement('span');
      const safeDelta = delta > 0 ? 1.12 : 0.9;
      wrapper.setAttribute('data-text-scale', String(safeDelta));
      wrapper.setAttribute('style', `font-size: ${safeDelta}em;`);
      wrapper.appendChild(fragment);
      range.insertNode(wrapper);
      insertedWrappers.push(wrapper);
    });

    // Save content first so state updates happen before we restore selection.
    handleEditorInput();
    updateActiveFormats();

    // Re-select the inserted wrappers after React state updates settle (requestAnimationFrame
    // fires after renders, ensuring the DOM is stable and the selection sticks visually).
    if (insertedWrappers.length > 0) {
      const firstWrapper = insertedWrappers[insertedWrappers.length - 1];
      const lastWrapper = insertedWrappers[0];
      requestAnimationFrame(() => {
        if (!editorRef.current || !editorRef.current.contains(firstWrapper)) return;
        editorRef.current.focus();
        const sel = window.getSelection();
        if (!sel) return;
        const newRange = document.createRange();
        newRange.setStartBefore(firstWrapper);
        newRange.setEndAfter(lastWrapper);
        sel.removeAllRanges();
        sel.addRange(newRange);
        selectionRef.current = newRange.cloneRange();
      });
    }
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
          <button type="button" className="content-editor-btn" onMouseDown={(e) => { e.preventDefault(); applyInlineTextScale(-1); }} title="Decrease selected text size">A-</button>
          <button type="button" className="content-editor-btn" onMouseDown={(e) => { e.preventDefault(); applyInlineTextScale(1); }} title="Increase selected text size">A+</button>
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
    const hasStructuredTags = /\[(BLUE|ORANGE|INDENT-1|INDENT-2)\]/i.test(text || '');
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
    const liveVariantClass = hasStructuredTags ? 'content-section-live-tagged' : 'content-section-live-plain';

    return (
      <div
        className={`${useTwoCol ? 'content-section-live' : 'content-section-live content-section-live-single'} ${liveVariantClass}`}
        style={{
          fontFamily,
          '--live-content-base-size': `${resolvedContentFontSize}rem`,
          '--live-content-group-size': `${Math.max(0.8, resolvedContentFontSize + 0.35)}rem`
        }}
      >
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
