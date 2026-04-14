import React, { useEffect, useRef, useState } from 'react';
import './ContentSection.css';

const ContentSection = ({ content, isEditing, onChange, isLiveMode = false, fontFamily = 'inherit', contentFontSize = 0.95, contentTextColor = '#e0e6f0', contentAlign = 'left', onAlignChange }) => {
  const effectiveLiveMode = isLiveMode || new URLSearchParams(window.location.search).get('live') === '1';
  const [text, setText] = useState(content || '');
  const [editorHtml, setEditorHtml] = useState('');
  const [activeFormats, setActiveFormats] = useState({ bold: false, italic: false, align: 'left' });
  const editorRef = useRef(null);
  const selectionRef = useRef(null);
  const resolvedContentFontSize = Number.isFinite(Number(contentFontSize)) && Number(contentFontSize) > 0 ? Number(contentFontSize) : 0.95;

  const parseEditorLines = (str) => {
    if (!str) return [{ type: 'line', text: '', align: 'left' }];
    return String(str).split(/\r?\n/).map((line) => {
      // Strip per-line alignment prefix: [=C] = center, [=R] = right
      let align = 'left';
      let remaining = line;
      if (remaining.startsWith('[=C]')) { align = 'center'; remaining = remaining.slice(4); }
      else if (remaining.startsWith('[=R]')) { align = 'right'; remaining = remaining.slice(4); }

      const tagged = remaining.match(/^\[(GROUP|BLUE|ORANGE|INDENT-1|INDENT-2)\](.*?)\[\/\1\]$/);
      if (tagged) {
        return { type: tagged[1], text: tagged[2], align };
      }
      return { type: 'line', text: remaining, align };
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
      const dataAlign = line.align || 'left';
      // Always set text-align explicitly so per-line overrides the editor wrapper's textAlign.
      return `<div class="content-editor-line ${classMap[line.type] || 'content-row-line'}" data-line-style="${line.type}" data-align="${dataAlign}" style="text-align:${dataAlign};">${safeHtml}</div>`;
    }).join('');
  };

  const serializeEditorContent = (root) => {
    if (!root) return '';

    return Array.from(root.children).map((node) => {
      const type = node.getAttribute('data-line-style') || 'line';
      const align = node.getAttribute('data-align') || 'left';
      const alignPrefix = align === 'center' ? '[=C]' : align === 'right' ? '[=R]' : '';
      const innerHtml = sanitizeInlineHtml(node.innerHTML || '').replace(/<br\s*\/?>/gi, '').trim();
      if (!innerHtml) return '';
      return type !== 'line'
        ? `${alignPrefix}[${type}]${innerHtml}[/${type}]`
        : `${alignPrefix}${innerHtml}`;
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
      setActiveFormats({ bold: false, italic: false, align: 'left' });
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
      setActiveFormats({ bold: false, italic: false, align: 'left' });
      return;
    }

    // Detect alignment of the caret's containing line div.
    let detectedAlign = 'left';
    if (selection && selection.rangeCount > 0) {
      let node = selection.anchorNode;
      if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
      while (node && node !== editorRef.current) {
        if (node.hasAttribute && node.hasAttribute('data-line-style')) {
          detectedAlign = node.getAttribute('data-align') || 'left';
          break;
        }
        node = node.parentNode;
      }
    }

    setActiveFormats({
      bold: isSelectionOrCaretFormatted('strong'),
      italic: isSelectionOrCaretFormatted('em'),
      align: detectedAlign,
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

    // Single-pass reverse traversal: process innermost nodes first.
    // Reversing ensures nested tags are unwrapped before their parents,
    // so no while-loop re-query is needed (eliminates infinite-loop risk).
    Array.from(root.querySelectorAll(tagName)).reverse().forEach((tag) => {
      const parent = tag.parentNode;
      if (!parent) return;
      while (tag.firstChild) {
        parent.insertBefore(tag.firstChild, tag);
      }
      parent.removeChild(tag);
    });

    // Also unwrap inline style-based formatting produced by browser editing commands.
    if (tagName === 'strong' || tagName === 'em') {
      const isMatch = (styleValue = '') => {
        if (tagName === 'strong') {
          return /font-weight\s*:\s*(bold|bolder|[7-9]00)/i.test(styleValue);
        }
        return /font-style\s*:\s*italic/i.test(styleValue);
      };

      Array.from(root.querySelectorAll('span[style]')).reverse().forEach((span) => {
        const styleValue = span.getAttribute('style') || '';
        if (!isMatch(styleValue)) return;
        const parent = span.parentNode;
        if (!parent) return;
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      });
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

  const applyLineAlign = (align) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    const allLines = Array.from(editorRef.current.querySelectorAll('[data-line-style]'));
    let linesToAlign;

    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      // No range selected — align the line the caret is in.
      const caretNode = selection && selection.rangeCount > 0 ? selection.anchorNode : null;
      const caretLine = caretNode
        ? allLines.find((l) => l === caretNode || l.contains(caretNode))
        : null;
      linesToAlign = caretLine ? [caretLine] : [];
    } else {
      const range = selection.getRangeAt(0);
      linesToAlign = allLines.filter((line) => rangeIntersectsNode(range, line));
    }

    linesToAlign.forEach((line) => {
      line.setAttribute('data-align', align);
      // Set explicitly so it overrides the editor wrapper's textAlign.
      line.style.textAlign = align;
    });

    handleEditorInput();
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

    // Collapsed caret: expand to the entire containing line so existing text is toggled.
    // (execCommand only affects future typing and is unreliable in modern browsers.)
    if (selection.isCollapsed) {
      const lines = Array.from(editorRef.current.querySelectorAll('[data-line-style]'));
      const caretNode = selection.anchorNode;
      const caretLine = lines.find((l) => l === caretNode || l.contains(caretNode));
      if (!caretLine) return;
      const lineRange = document.createRange();
      lineRange.selectNodeContents(caretLine);
      selection.removeAllRanges();
      selection.addRange(lineRange);
      // Fall through to the non-collapsed path below with the expanded selection.
    }

    // Process line by line to preserve line structure and avoid spacing artifacts.
    const shouldRemove = isSelectionFullyFormatted(tagName);
    const selectedRanges = getSelectedLineRanges().reverse();
    const insertedBoundaries = [];

    selectedRanges.forEach(({ range }) => {
      const fragment = range.extractContents();
      if (!fragment) return;

      if (shouldRemove) {
        // Remove ONLY this format; other format (em/strong) is preserved inside.
        unwrapFormatTags(fragment, tagName);
        const nodes = Array.from(fragment.childNodes);
        range.insertNode(fragment);
        if (nodes.length > 0) {
          insertedBoundaries.push({ first: nodes[0], last: nodes[nodes.length - 1] });
        }
      } else {
        // Wrap in the new tag; existing format inside is preserved.
        const wrapper = document.createElement(tagName);
        while (fragment.firstChild) {
          wrapper.appendChild(fragment.firstChild);
        }
        range.insertNode(wrapper);
        insertedBoundaries.push({ first: wrapper, last: wrapper });
      }
    });

    // extractContents() with text-node-level range boundaries clones ancestor tags into
    // the fragment but leaves empty shells (e.g. <em></em>) in the original line.
    // Remove those orphaned shells so they don't corrupt future format detection.
    Array.from(editorRef.current.querySelectorAll('strong,em')).forEach((tag) => {
      if (!tag.textContent && tag.parentNode) {
        tag.parentNode.removeChild(tag);
      }
    });

    handleEditorInput();

    if (insertedBoundaries.length > 0) {
      const startNode = insertedBoundaries[insertedBoundaries.length - 1].first;
      const endNode = insertedBoundaries[0].last;
      requestAnimationFrame(() => {
        if (!editorRef.current || !startNode || !endNode) return;
        if (!editorRef.current.contains(startNode)) return;
        editorRef.current.focus();
        const sel = window.getSelection();
        if (!sel) return;
        const newRange = document.createRange();
        try {
          newRange.setStartBefore(startNode);
          newRange.setEndAfter(endNode);
          sel.removeAllRanges();
          sel.addRange(newRange);
          selectionRef.current = newRange.cloneRange();
        } catch (e) { /* node may have shifted after sanitize */ }
        updateActiveFormats();
      });
    } else {
      saveSelection();
      updateActiveFormats();
    }
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

    handleEditorInput();
    updateActiveFormats();

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
      // Strip per-line alignment prefix
      let align = 'left';
      let remaining = line;
      if (remaining.startsWith('[=C]')) { align = 'center'; remaining = remaining.slice(4); }
      else if (remaining.startsWith('[=R]')) { align = 'right'; remaining = remaining.slice(4); }

      const trimmed = remaining.trim();
      if (!trimmed) return;

      const tagged = trimmed.match(/^\[(GROUP|BLUE|ORANGE|INDENT-1|INDENT-2)\](.*?)\[\/\1\]$/);
      if (tagged) {
        segments.push({ type: tagged[1], text: tagged[2].trim(), align });
        return;
      }

      segments.push({ type: 'line', text: trimmed, align });
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
    const alignStyle = seg.align && seg.align !== 'left' ? { textAlign: seg.align } : {};
    return <div key={idx} className={`content-row ${typeToClass[seg.type] || 'content-row-line'}`} style={alignStyle} dangerouslySetInnerHTML={renderInlineContent(seg.text)} />;
  };

  const parseStyledText = (str) => {
    if (!str) return null;

    // Reuse parseEditorLines so alignment markers and type tags are handled identically
    // to the editor and live mode renderers.
    const lines = parseEditorLines(str);
    const elements = lines
      .filter((line) => line.text.trim())
      .map((line, idx) => {
        const alignStyle = line.align !== 'left' ? { textAlign: line.align } : {};
        const inlineStyle = { fontFamily, fontSize: `${resolvedContentFontSize}rem`, ...alignStyle };
        if (line.type === 'GROUP') {
          inlineStyle.fontSize = `${Math.max(0.8, resolvedContentFontSize + 0.1)}rem`;
        }
        const className = line.type !== 'line'
          ? `content-${line.type.toLowerCase()}`
          : 'content-line';
        return (
          <p key={idx} className={className} style={inlineStyle}
            dangerouslySetInnerHTML={renderInlineContent(line.text)} />
        );
      });

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
          <>
              <span style={{ width: '1px', height: '20px', background: '#ccc', margin: '0 8px' }}></span>
              <button type="button" className={`content-editor-btn ${activeFormats.align === 'left' ? 'active' : ''}`} onMouseDown={(e) => { e.preventDefault(); applyLineAlign('left'); }} title="Align left">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 2h16v2H0V2zm0 4h10v2H0V6zm0 4h16v2H0v-2zm0 4h10v2H0v-2z"/></svg>
              </button>
              <button type="button" className={`content-editor-btn ${activeFormats.align === 'center' ? 'active' : ''}`} onMouseDown={(e) => { e.preventDefault(); applyLineAlign('center'); }} title="Align center">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 2h16v2H0V2zm3 4h10v2H3V6zm-3 4h16v2H0v-2zm3 4h10v2H3v-2z"/></svg>
              </button>
              <button type="button" className={`content-editor-btn ${activeFormats.align === 'right' ? 'active' : ''}`} onMouseDown={(e) => { e.preventDefault(); applyLineAlign('right'); }} title="Align right">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M0 2h16v2H0V2zm6 4h10v2H6V6zm-6 4h16v2H0v-2zm6 4h10v2H6v-2z"/></svg>
              </button>
            </>
        </div>
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
