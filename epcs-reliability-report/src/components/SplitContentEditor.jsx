import React, { useEffect, useState } from 'react';
import './SplitContentEditor.css';
import LinkTargetInput from './LinkTargetInput';

const createBlockId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeSideBlocks = (page, side) => {
  const blocksKey = side === 'left' ? 'leftBlocks' : 'rightBlocks';
  const contentTypeKey = side === 'left' ? 'leftContentType' : 'rightContentType';
  const contentKey = side === 'left' ? 'leftContent' : 'rightContent';
  const imageKey = side === 'left' ? 'leftImage' : 'rightImage';

  if (Array.isArray(page[blocksKey]) && page[blocksKey].length > 0) {
    return page[blocksKey].map((block) => ({
      id: block.id || createBlockId(),
      type: block.type === 'text' || block.type === 'image' ? block.type : 'link',
      text: block.text || '',
      title: block.title || '',
      target: block.target || '',
      imageUrl: block.imageUrl || ''
    }));
  }

  const legacyType = page[contentTypeKey] || 'text';
  const legacyContent = page[contentKey] || '';
  const legacyImage = page[imageKey] || '';

  if (legacyType === 'text' && legacyContent) {
    return [{ id: createBlockId(), type: 'text', text: legacyContent }];
  }
  if (legacyType === 'link' && legacyContent) {
    return [{ id: createBlockId(), type: 'link', title: legacyContent, target: legacyContent }];
  }
  if (legacyType === 'image' && legacyImage) {
    return [{ id: createBlockId(), type: 'image', imageUrl: legacyImage }];
  }

  return [];
};

const legacyFromBlocks = (blocks) => {
  const firstBlock = Array.isArray(blocks) && blocks.length > 0 ? blocks[0] : null;

  if (!firstBlock) {
    return { contentType: 'text', content: '', image: '' };
  }

  if (firstBlock.type === 'text') {
    return { contentType: 'text', content: firstBlock.text || '', image: '' };
  }

  if (firstBlock.type === 'image') {
    return { contentType: 'image', content: '', image: firstBlock.imageUrl || '' };
  }

  return {
    contentType: 'link',
    content: firstBlock.target || firstBlock.title || '',
    image: ''
  };
};

const SplitContentEditor = ({ page, onChange }) => {
  const [title, setTitle] = useState(page.title || '');
  const [leftHeader, setLeftHeader] = useState(page.leftHeader || '');
  const [rightHeader, setRightHeader] = useState(page.rightHeader || '');
  const [leftBlocks, setLeftBlocks] = useState(normalizeSideBlocks(page, 'left'));
  const [rightBlocks, setRightBlocks] = useState(normalizeSideBlocks(page, 'right'));
  const [leftTextDraft, setLeftTextDraft] = useState('');
  const [rightTextDraft, setRightTextDraft] = useState('');
  const [leftLinkTitleDraft, setLeftLinkTitleDraft] = useState('');
  const [leftLinkTargetDraft, setLeftLinkTargetDraft] = useState('');
  const [rightLinkTitleDraft, setRightLinkTitleDraft] = useState('');
  const [rightLinkTargetDraft, setRightLinkTargetDraft] = useState('');
  const [leftImageDraft, setLeftImageDraft] = useState('');
  const [rightImageDraft, setRightImageDraft] = useState('');

  useEffect(() => {
    setTitle(page.title || '');
    setLeftHeader(page.leftHeader || '');
    setRightHeader(page.rightHeader || '');
    setLeftBlocks(normalizeSideBlocks(page, 'left'));
    setRightBlocks(normalizeSideBlocks(page, 'right'));
    setLeftTextDraft('');
    setRightTextDraft('');
    setLeftLinkTitleDraft('');
    setLeftLinkTargetDraft('');
    setRightLinkTitleDraft('');
    setRightLinkTargetDraft('');
    setLeftImageDraft('');
    setRightImageDraft('');
  }, [page.id]);

  const emitChange = (nextValues = {}) => {
    const nextTitle = nextValues.title ?? title;
    const nextLeftHeader = nextValues.leftHeader ?? leftHeader;
    const nextRightHeader = nextValues.rightHeader ?? rightHeader;
    const nextLeftBlocks = nextValues.leftBlocks ?? leftBlocks;
    const nextRightBlocks = nextValues.rightBlocks ?? rightBlocks;
    const leftLegacy = legacyFromBlocks(nextLeftBlocks);
    const rightLegacy = legacyFromBlocks(nextRightBlocks);

    onChange({
      ...page,
      title: nextTitle,
      leftHeader: nextLeftHeader,
      rightHeader: nextRightHeader,
      leftBlocks: nextLeftBlocks,
      rightBlocks: nextRightBlocks,
      leftContentType: leftLegacy.contentType,
      rightContentType: rightLegacy.contentType,
      leftContent: leftLegacy.content,
      rightContent: rightLegacy.content,
      leftImage: leftLegacy.image,
      rightImage: rightLegacy.image
    });
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    emitChange({ title: newTitle });
  };

  const handleLeftHeaderChange = (e) => {
    const newHeader = e.target.value;
    setLeftHeader(newHeader);
    emitChange({ leftHeader: newHeader });
  };

  const handleRightHeaderChange = (e) => {
    const newHeader = e.target.value;
    setRightHeader(newHeader);
    emitChange({ rightHeader: newHeader });
  };

  const applyBlocksUpdate = (side, nextBlocks) => {
    if (side === 'left') {
      setLeftBlocks(nextBlocks);
      emitChange({ leftBlocks: nextBlocks });
      return;
    }

    setRightBlocks(nextBlocks);
    emitChange({ rightBlocks: nextBlocks });
  };

  const addBlock = (side, block, position = 'end') => {
    const currentBlocks = side === 'left' ? leftBlocks : rightBlocks;
    const nextBlocks = position === 'start' ? [block, ...currentBlocks] : [...currentBlocks, block];
    applyBlocksUpdate(side, nextBlocks);
  };

  const updateBlockField = (side, blockId, field, value) => {
    const currentBlocks = side === 'left' ? leftBlocks : rightBlocks;
    const nextBlocks = currentBlocks.map((block) =>
      block.id === blockId ? { ...block, [field]: value } : block
    );
    applyBlocksUpdate(side, nextBlocks);
  };

  const moveBlock = (side, blockId, direction) => {
    const currentBlocks = side === 'left' ? leftBlocks : rightBlocks;
    const index = currentBlocks.findIndex((block) => block.id === blockId);
    if ((direction === 'up' && index <= 0) || (direction === 'down' && index >= currentBlocks.length - 1) || index < 0) {
      return;
    }

    if (direction === 'top') {
      if (index === 0) return;
      const nextBlocks = [...currentBlocks];
      const [blockToMove] = nextBlocks.splice(index, 1);
      nextBlocks.unshift(blockToMove);
      applyBlocksUpdate(side, nextBlocks);
      return;
    }

    const nextBlocks = [...currentBlocks];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [nextBlocks[index], nextBlocks[swapIndex]] = [nextBlocks[swapIndex], nextBlocks[index]];
    applyBlocksUpdate(side, nextBlocks);
  };

  const deleteBlock = (side, blockId) => {
    const currentBlocks = side === 'left' ? leftBlocks : rightBlocks;
    const nextBlocks = currentBlocks.filter((block) => block.id !== blockId);
    applyBlocksUpdate(side, nextBlocks);
  };

  const handleAddText = (side, position = 'end') => {
    const textValue = side === 'left' ? leftTextDraft : rightTextDraft;
    if (!textValue.trim()) return;

    addBlock(side, { id: createBlockId(), type: 'text', text: textValue }, position);
    if (side === 'left') {
      setLeftTextDraft('');
    } else {
      setRightTextDraft('');
    }
  };

  const handleAddLink = (side, position = 'end') => {
    const titleValue = side === 'left' ? leftLinkTitleDraft : rightLinkTitleDraft;
    const targetValue = side === 'left' ? leftLinkTargetDraft : rightLinkTargetDraft;
    if (!targetValue.trim()) return;

    addBlock(
      side,
      {
        id: createBlockId(),
        type: 'link',
        title: titleValue || targetValue,
        target: targetValue
      },
      position
    );

    if (side === 'left') {
      setLeftLinkTitleDraft('');
      setLeftLinkTargetDraft('');
    } else {
      setRightLinkTitleDraft('');
      setRightLinkTargetDraft('');
    }
  };

  const handleAddImage = (side, position = 'end') => {
    const imageValue = side === 'left' ? leftImageDraft : rightImageDraft;
    if (!imageValue.trim()) return;

    addBlock(side, { id: createBlockId(), type: 'image', imageUrl: imageValue }, position);
    if (side === 'left') {
      setLeftImageDraft('');
    } else {
      setRightImageDraft('');
    }
  };

  const renderSideEditor = (side) => {
    const isLeft = side === 'left';
    const blocks = isLeft ? leftBlocks : rightBlocks;
    const textDraft = isLeft ? leftTextDraft : rightTextDraft;
    const linkTitleDraft = isLeft ? leftLinkTitleDraft : rightLinkTitleDraft;
    const linkTargetDraft = isLeft ? leftLinkTargetDraft : rightLinkTargetDraft;
    const imageDraft = isLeft ? leftImageDraft : rightImageDraft;

    return (
      <div className="side-blocks-editor">
        <div className="content-editor">
          <label>Add Text Block:</label>
          <textarea
            value={textDraft}
            onChange={(e) => (isLeft ? setLeftTextDraft(e.target.value) : setRightTextDraft(e.target.value))}
            placeholder="Enter text"
            className="content-textarea"
            rows="3"
          />
          <div className="split-actions-row">
            <button className="split-add-btn" onClick={() => handleAddText(side, 'end')} disabled={!textDraft.trim()}>📝 Add Text</button>
            <button className="split-add-btn" onClick={() => handleAddText(side, 'start')} disabled={!textDraft.trim()}>⬆️ Add Text First</button>
          </div>
        </div>

        <div className="content-editor">
          <label>Add Link Block:</label>
          <input
            type="text"
            value={linkTitleDraft}
            onChange={(e) => (isLeft ? setLeftLinkTitleDraft(e.target.value) : setRightLinkTitleDraft(e.target.value))}
            placeholder="Link title"
            className="content-input"
          />
          <LinkTargetInput
            value={linkTargetDraft}
            onValueChange={(value) => (isLeft ? setLeftLinkTargetDraft(value) : setRightLinkTargetDraft(value))}
            placeholder="Target URL/page/file"
            inputClassName="content-input"
          />
          <div className="split-actions-row">
            <button className="split-add-btn" onClick={() => handleAddLink(side, 'end')} disabled={!linkTargetDraft.trim()}>🔗 Add Link</button>
            <button className="split-add-btn" onClick={() => handleAddLink(side, 'start')} disabled={!linkTargetDraft.trim()}>⬆️ Add Link First</button>
          </div>
        </div>

        <div className="content-editor">
          <label>Add Image Block:</label>
          <LinkTargetInput
            value={imageDraft}
            onValueChange={(value) => (isLeft ? setLeftImageDraft(value) : setRightImageDraft(value))}
            placeholder="Image URL, data URL, or choose image file"
            inputClassName="content-input"
            buttonText="File"
            accept="image/*"
          />
          <div className="split-actions-row">
            <button className="split-add-btn" onClick={() => handleAddImage(side, 'end')} disabled={!imageDraft.trim()}>🖼️ Add Image</button>
            <button className="split-add-btn" onClick={() => handleAddImage(side, 'start')} disabled={!imageDraft.trim()}>⬆️ Add Image First</button>
          </div>
        </div>

        <div className="content-editor">
          <label>Ordered Content Blocks ({blocks.length}):</label>
          {blocks.length === 0 ? (
            <div className="split-empty">No blocks yet.</div>
          ) : (
            <div className="split-block-list">
              {blocks.map((block, index) => (
                <div key={block.id} className="split-block-item">
                  <div className="split-block-order">{index + 1}</div>
                  <div className="split-block-body">
                    {block.type === 'text' && (
                      <textarea
                        value={block.text || ''}
                        onChange={(e) => updateBlockField(side, block.id, 'text', e.target.value)}
                        className="content-textarea"
                        rows="3"
                      />
                    )}

                    {block.type === 'link' && (
                      <>
                        <input
                          type="text"
                          value={block.title || ''}
                          onChange={(e) => updateBlockField(side, block.id, 'title', e.target.value)}
                          placeholder="Link title"
                          className="content-input"
                        />
                        <LinkTargetInput
                          value={block.target || ''}
                          onValueChange={(value) => updateBlockField(side, block.id, 'target', value)}
                          placeholder="Target URL/page/file"
                          inputClassName="content-input"
                        />
                      </>
                    )}

                    {block.type === 'image' && (
                      <LinkTargetInput
                        value={block.imageUrl || ''}
                        onValueChange={(value) => updateBlockField(side, block.id, 'imageUrl', value)}
                        placeholder="Image URL, data URL, or choose image file"
                        inputClassName="content-input"
                        buttonText="File"
                        accept="image/*"
                      />
                    )}
                  </div>

                  <div className="split-block-actions">
                    <button className="action-btn" onClick={() => moveBlock(side, block.id, 'top')} disabled={index === 0} title="Move to top">⏫ Top</button>
                    <button className="action-btn" onClick={() => moveBlock(side, block.id, 'up')} disabled={index === 0}>↑ Up</button>
                    <button className="action-btn" onClick={() => moveBlock(side, block.id, 'down')} disabled={index === blocks.length - 1}>↓ Down</button>
                    <button className="action-btn delete" onClick={() => deleteBlock(side, block.id)}>🗑 Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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

        {renderSideEditor('left')}
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

        {renderSideEditor('right')}
      </div>
    </div>
  );
};

export default SplitContentEditor;
