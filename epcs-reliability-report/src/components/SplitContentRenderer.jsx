import React from 'react';
import './SplitContentRenderer.css';

const sanitizeInlineHtml = (html = '') => {
  if (typeof window === 'undefined') return String(html || '');

  const container = document.createElement('div');
  container.innerHTML = String(html || '')
    .replace(/<span[^>]*font-weight\s*:\s*(bold|bolder|[7-9]00)[^>]*>([\s\S]*?)<\/span>/gi, '<strong>$2</strong>')
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

  return container.innerHTML.replace(/\n/g, '<br>');
};

const renderInlineContent = (value) => ({
  __html: sanitizeInlineHtml(value || '')
});

const normalizeBlocksForRender = (blocks, contentType, content, image) => {
  if (Array.isArray(blocks) && blocks.length > 0) {
    return blocks;
  }

  if (contentType === 'text' && content) {
    return [{ id: 'legacy-text', type: 'text', text: content }];
  }

  if (contentType === 'link' && content) {
    return [{ id: 'legacy-link', type: 'link', title: content, target: content }];
  }

  if (contentType === 'image' && image) {
    return [{ id: 'legacy-image', type: 'image', imageUrl: image }];
  }

  return [];
};

const SplitContentRenderer = ({ title, leftHeader, rightHeader, titleColor, leftHeaderColor, rightHeaderColor, textColor, contentTextColor, fontFamily, titleFontSize, headerFontSize, contentFontSize, imageWidth, imageHeight, leftImageWidth, leftImageHeight, rightImageWidth, rightImageHeight, leftContentType, rightContentType, leftContent, rightContent, leftImage, rightImage, leftBlocks, rightBlocks, onLinkClick, onImageClick }) => {
  const resolvedTextColor = textColor || '#e0e6f0';
  const resolvedContentTextColor = contentTextColor || resolvedTextColor;
  const resolvedTitleSize = Number(titleFontSize) > 0 ? Number(titleFontSize) : 1.3;
  const resolvedHeaderSize = Number(headerFontSize) > 0 ? Number(headerFontSize) : 0.95;
  const resolvedContentSize = Number(contentFontSize) > 0 ? Number(contentFontSize) : 0.95;
  const leftWidth = Number(leftImageWidth || imageWidth) > 0 ? Number(leftImageWidth || imageWidth) : null;
  const leftHeight = Number(leftImageHeight || imageHeight) > 0 ? Number(leftImageHeight || imageHeight) : null;
  const rightWidth = Number(rightImageWidth || imageWidth) > 0 ? Number(rightImageWidth || imageWidth) : null;
  const rightHeight = Number(rightImageHeight || imageHeight) > 0 ? Number(rightImageHeight || imageHeight) : null;
  const renderContent = (contentType, content, image, side = 'left') => {
    const sideImageStyle = {
      width: side === 'left' && leftWidth ? `${leftWidth}px` : side === 'right' && rightWidth ? `${rightWidth}px` : undefined,
      height: side === 'left' && leftHeight ? `${leftHeight}px` : side === 'right' && rightHeight ? `${rightHeight}px` : undefined,
      objectFit: (side === 'left' ? (leftWidth || leftHeight) : (rightWidth || rightHeight)) ? 'contain' : undefined
    };
    if (contentType === 'text') {
      return (
        <div
          className="content-display text-content"
          style={{ fontSize: `${resolvedContentSize}rem`, color: resolvedContentTextColor }}
          dangerouslySetInnerHTML={renderInlineContent(content)}
        >
        </div>
      );
    } else if (contentType === 'link') {
      return (
        <div className="content-display link-content" style={{ fontSize: `${resolvedContentSize}rem`, color: resolvedContentTextColor }}>
          <button
            className="link-button"
            style={{ color: resolvedContentTextColor }}
            onClick={() => onLinkClick && onLinkClick(content)}
            title={content}
          >
            {content || 'Link'}
          </button>
        </div>
      );
    } else if (contentType === 'image') {
      return (
        <div className="content-display image-content">
          {image && (
            <img 
              src={image} 
              alt="content-image"
              className="content-image"
              style={sideImageStyle}
            />
          )}
        </div>
      );
    }
    return null;
  };

  const blockImageStyle = (block, side) => {
    const fallbackWidth = side === 'left' ? leftWidth : rightWidth;
    const fallbackHeight = side === 'left' ? leftHeight : rightHeight;
    const width = Number(block.imageWidth) > 0 ? Number(block.imageWidth) : fallbackWidth;
    const height = Number(block.imageHeight) > 0 ? Number(block.imageHeight) : fallbackHeight;
    return {
      width: width ? `${width}px` : undefined,
      height: height ? `${height}px` : undefined,
      objectFit: (width || height) ? 'contain' : undefined,
      cursor: onImageClick ? 'pointer' : 'default'
    };
  };

  const renderBlock = (block, idx, side) => {
    const sideImageStyle = blockImageStyle(block, side);
    if (block.type === 'text') {
      return (
        <div
          key={block.id || `text-${idx}`}
          className="content-display text-content split-block-render-item"
          style={{ fontSize: `${resolvedContentSize}rem`, color: resolvedContentTextColor }}
          dangerouslySetInnerHTML={renderInlineContent(block.text)}
        >
        </div>
      );
    }

    if (block.type === 'image') {
      return (
        <div key={block.id || `image-${idx}`} className="content-display image-content split-block-render-item">
          {block.imageUrl && (
            <img
              src={block.imageUrl}
              alt="content-image"
              className="content-image"
              onClick={() => onImageClick && onImageClick(block.imageUrl, title || 'Image')}
              style={sideImageStyle}
            />
          )}
        </div>
      );
    }

    const linkLabel = block.title || block.target || 'Link';
    const linkTarget = block.target || block.title || '';
    return (
      <div key={block.id || `link-${idx}`} className="content-display link-content split-block-render-item" style={{ color: resolvedContentTextColor }}>
        <button
          className="link-button"
          style={{ color: resolvedContentTextColor }}
          onClick={() => onLinkClick && onLinkClick(linkTarget)}
          title={linkTarget}
        >
          {linkLabel}
        </button>
      </div>
    );
  };

  const normalizedLeftBlocks = normalizeBlocksForRender(leftBlocks, leftContentType, leftContent, leftImage);
  const normalizedRightBlocks = normalizeBlocksForRender(rightBlocks, rightContentType, rightContent, rightImage);

  return (
    <div className="split-content-renderer" style={{ fontFamily: fontFamily || 'inherit', color: resolvedTextColor }}>
      {/* Main Heading */}
      {title && (
        <div className="split-heading" style={{ background: titleColor || undefined, fontSize: `${resolvedTitleSize}rem`, color: resolvedTextColor }}>
          {title}
        </div>
      )}

      {/* Headers Row */}
      {(leftHeader || rightHeader) && (
        <div className="split-headers">
          {leftHeader && (
            <div className="left-header-box" style={{ backgroundColor: leftHeaderColor || undefined, fontSize: `${resolvedHeaderSize}rem`, color: resolvedTextColor }}>
              {leftHeader}
            </div>
          )}
          {rightHeader && (
            <div className="right-header-box" style={{ backgroundColor: rightHeaderColor || undefined, fontSize: `${resolvedHeaderSize}rem`, color: resolvedTextColor }}>
              {rightHeader}
            </div>
          )}
        </div>
      )}

      {/* Content Row */}
      <div className="split-content">
        <div className="left-content-area">
          {normalizedLeftBlocks.length > 0
            ? <div className="split-block-render-list">{normalizedLeftBlocks.map((block, idx) => renderBlock(block, idx, 'left'))}</div>
            : renderContent(leftContentType, leftContent, leftImage, 'left')}
        </div>
        <div className="right-content-area">
          {normalizedRightBlocks.length > 0
            ? <div className="split-block-render-list">{normalizedRightBlocks.map((block, idx) => renderBlock(block, idx, 'right'))}</div>
            : renderContent(rightContentType, rightContent, rightImage, 'right')}
        </div>
      </div>
    </div>
  );
};

export default SplitContentRenderer;
