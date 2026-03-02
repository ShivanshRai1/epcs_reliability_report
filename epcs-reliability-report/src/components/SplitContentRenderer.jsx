import React from 'react';
import './SplitContentRenderer.css';

const SplitContentRenderer = ({ title, leftHeader, rightHeader, leftContentType, rightContentType, leftContent, rightContent, leftImage, rightImage, onLinkClick }) => {
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
          {renderContent(leftContentType, leftContent, leftImage)}
        </div>
        <div className="right-content-area">
          {renderContent(rightContentType, rightContent, rightImage)}
        </div>
      </div>
    </div>
  );
};

export default SplitContentRenderer;
