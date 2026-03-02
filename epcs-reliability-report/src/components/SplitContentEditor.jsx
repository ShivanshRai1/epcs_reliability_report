import React, { useEffect, useState } from 'react';
import './SplitContentEditor.css';
import LinkTargetInput from './LinkTargetInput';

const SplitContentEditor = ({ page, onChange }) => {
  const [title, setTitle] = useState(page.title || '');
  const [leftHeader, setLeftHeader] = useState(page.leftHeader || '');
  const [rightHeader, setRightHeader] = useState(page.rightHeader || '');
  const [leftContentType, setLeftContentType] = useState(page.leftContentType || 'text');
  const [rightContentType, setRightContentType] = useState(page.rightContentType || 'text');
  const [leftContent, setLeftContent] = useState(page.leftContent || '');
  const [rightContent, setRightContent] = useState(page.rightContent || '');
  const [leftImage, setLeftImage] = useState(page.leftImage || '');
  const [rightImage, setRightImage] = useState(page.rightImage || '');

  useEffect(() => {
    setTitle(page.title || '');
    setLeftHeader(page.leftHeader || '');
    setRightHeader(page.rightHeader || '');
    setLeftContentType(page.leftContentType || 'text');
    setRightContentType(page.rightContentType || 'text');
    setLeftContent(page.leftContent || '');
    setRightContent(page.rightContent || '');
    setLeftImage(page.leftImage || '');
    setRightImage(page.rightImage || '');
  }, [page.id]);

  const updatePage = () => {
    onChange({
      ...page,
      title,
      leftHeader,
      rightHeader,
      leftContentType,
      rightContentType,
      leftContent,
      rightContent,
      leftImage,
      rightImage
    });
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onChange({ ...page, title: newTitle, leftHeader, rightHeader, leftContentType, rightContentType, leftContent, rightContent, leftImage, rightImage });
  };

  const handleLeftHeaderChange = (e) => {
    const newHeader = e.target.value;
    setLeftHeader(newHeader);
    onChange({ ...page, title, leftHeader: newHeader, rightHeader, leftContentType, rightContentType, leftContent, rightContent, leftImage, rightImage });
  };

  const handleRightHeaderChange = (e) => {
    const newHeader = e.target.value;
    setRightHeader(newHeader);
    onChange({ ...page, title, leftHeader, rightHeader: newHeader, leftContentType, rightContentType, leftContent, rightContent, leftImage, rightImage });
  };

  const handleLeftContentTypeChange = (e) => {
    const newType = e.target.value;
    setLeftContentType(newType);
    onChange({ ...page, title, leftHeader, rightHeader, leftContentType: newType, rightContentType, leftContent: '', rightContent, leftImage: '', rightImage });
  };

  const handleRightContentTypeChange = (e) => {
    const newType = e.target.value;
    setRightContentType(newType);
    onChange({ ...page, title, leftHeader, rightHeader, leftContentType, rightContentType: newType, leftContent, rightContent: '', leftImage, rightImage: '' });
  };

  const handleLeftContentChange = (e) => {
    const newContent = e.target.value;
    setLeftContent(newContent);
    onChange({ ...page, title, leftHeader, rightHeader, leftContentType, rightContentType, leftContent: newContent, rightContent, leftImage, rightImage });
  };

  const handleRightContentChange = (e) => {
    const newContent = e.target.value;
    setRightContent(newContent);
    onChange({ ...page, title, leftHeader, rightHeader, leftContentType, rightContentType, leftContent, rightContent: newContent, leftImage, rightImage });
  };

  const handleLeftImageChange = (e) => {
    const newImage = e.target.value;
    setLeftImage(newImage);
    onChange({ ...page, title, leftHeader, rightHeader, leftContentType, rightContentType, leftContent, rightContent, leftImage: newImage, rightImage });
  };

  const handleRightImageChange = (e) => {
    const newImage = e.target.value;
    setRightImage(newImage);
    onChange({ ...page, title, leftHeader, rightHeader, leftContentType, rightContentType, leftContent, rightContent, leftImage, rightImage: newImage });
  };

  const renderContentEditor = (side) => {
    const contentType = side === 'left' ? leftContentType : rightContentType;
    const content = side === 'left' ? leftContent : rightContent;
    const image = side === 'left' ? leftImage : rightImage;
    const onContentChange = side === 'left' ? handleLeftContentChange : handleRightContentChange;
    const onImageChange = side === 'left' ? handleLeftImageChange : handleRightImageChange;

    return (
      <div className="content-editor">
        {contentType === 'text' && (
          <>
            <label>Content Text:</label>
            <textarea
              value={content}
              onChange={onContentChange}
              placeholder="Enter text content..."
              className="content-textarea"
              rows="5"
            />
          </>
        )}
        {contentType === 'link' && (
          <>
            <label>Link/Hyperlink:</label>
            <LinkTargetInput
              value={content}
              onValueChange={(value) => onContentChange({ target: { value } })}
              placeholder="e.g., https://example.com, /pdfs/report.pdf, or choose file"
              inputClassName="content-input"
            />
          </>
        )}
        {contentType === 'image' && (
          <>
            <label>Image URL:</label>
            <input
              type="text"
              value={image}
              onChange={onImageChange}
              placeholder="Enter image URL"
              className="content-input"
            />
          </>
        )}
      </div>
    );
  };

  return (
    <div className="split-content-editor">
      {/* Main Title Section */}
      <div className="editor-section">
        <label htmlFor="page-title">Page Heading (Required):</label>
        <input
          id="page-title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Enter page heading"
          className="title-input"
        />
      </div>

      {/* Left Section */}
      <div className="split-section left-section">
        <div className="section-label">LEFT SECTION</div>

        <div className="editor-section">
          <label htmlFor="left-header">Left Header (Optional):</label>
          <input
            id="left-header"
            type="text"
            value={leftHeader}
            onChange={handleLeftHeaderChange}
            placeholder="e.g., Features, Description"
            className="header-input"
          />
        </div>

        <div className="editor-section">
          <label htmlFor="left-content-type">Content Type:</label>
          <select
            id="left-content-type"
            value={leftContentType}
            onChange={handleLeftContentTypeChange}
            className="content-type-select"
          >
            <option value="text">Text</option>
            <option value="link">Link/Hyperlink</option>
            <option value="image">Image</option>
          </select>
        </div>

        {renderContentEditor('left')}
      </div>

      {/* Right Section */}
      <div className="split-section right-section">
        <div className="section-label">RIGHT SECTION</div>

        <div className="editor-section">
          <label htmlFor="right-header">Right Header (Optional):</label>
          <input
            id="right-header"
            type="text"
            value={rightHeader}
            onChange={handleRightHeaderChange}
            placeholder="e.g., Specifications, Example"
            className="header-input"
          />
        </div>

        <div className="editor-section">
          <label htmlFor="right-content-type">Content Type:</label>
          <select
            id="right-content-type"
            value={rightContentType}
            onChange={handleRightContentTypeChange}
            className="content-type-select"
          >
            <option value="text">Text</option>
            <option value="link">Link/Hyperlink</option>
            <option value="image">Image</option>
          </select>
        </div>

        {renderContentEditor('right')}
      </div>
    </div>
  );
};

export default SplitContentEditor;
