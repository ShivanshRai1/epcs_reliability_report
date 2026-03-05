import React from 'react';
import './SplitContentRenderer.css';

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

const SplitContentRenderer = ({ title, leftHeader, rightHeader, leftContentType, rightContentType, leftContent, rightContent, leftImage, rightImage, leftBlocks, rightBlocks, onLinkClick, onImageClick }) => {
  const renderContent = (contentType, content, image) => {
    if (contentType === 'text') {
      return (
        <div className="content-display text-content">
          {content}
        </div>
      );
    } else if (contentType === 'link') {
      return (
        <div className="content-display link-content">
          <button
            className="link-button"
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
            />
          )}
        </div>
      );
    }
    return null;
  };

  const renderBlock = (block, idx) => {
    if (block.type === 'text') {
      return (
        <div key={block.id || `text-${idx}`} className="content-display text-content split-block-render-item">
          {block.text}
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
              style={{ cursor: onImageClick ? 'pointer' : 'default' }}
            />
          )}
        </div>
      );
    }

    const linkLabel = block.title || block.target || 'Link';
    const linkTarget = block.target || block.title || '';
    return (
      <div key={block.id || `link-${idx}`} className="content-display link-content split-block-render-item">
        <button
          className="link-button"
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
    <div className="split-content-renderer">
      {/* Main Heading */}
      {title && (
        <div className="split-heading">
          {title}
        </div>
      )}

      {/* Headers Row */}
      {(leftHeader || rightHeader) && (
        <div className="split-headers">
          {leftHeader && (
            <div className="left-header-box">
              {leftHeader}
            </div>
          )}
          {rightHeader && (
            <div className="right-header-box">
              {rightHeader}
            </div>
          )}
        </div>
      )}

      {/* Content Row */}
      <div className="split-content">
        <div className="left-content-area">
          {normalizedLeftBlocks.length > 0
            ? <div className="split-block-render-list">{normalizedLeftBlocks.map(renderBlock)}</div>
            : renderContent(leftContentType, leftContent, leftImage)}
        </div>
        <div className="right-content-area">
          {normalizedRightBlocks.length > 0
            ? <div className="split-block-render-list">{normalizedRightBlocks.map(renderBlock)}</div>
            : renderContent(rightContentType, rightContent, rightImage)}
        </div>
      </div>
    </div>
  );
};

export default SplitContentRenderer;
