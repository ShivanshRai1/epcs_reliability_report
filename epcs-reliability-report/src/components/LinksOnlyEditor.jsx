import React, { useEffect, useState } from 'react';
import './LinksOnlyEditor.css';
import LinkTargetInput from './LinkTargetInput';

const createBlockId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeBlocks = (page) => {
  if (Array.isArray(page.linkBlocks) && page.linkBlocks.length > 0) {
    return page.linkBlocks.map((block) => ({
      id: block.id || createBlockId(),
      type: block.type === 'text' ? 'text' : 'link',
      text: block.text || '',
      title: block.title || '',
      target: block.target || ''
    }));
  }

  const legacyLinks = Array.isArray(page.links) ? page.links : [];
  return legacyLinks.map((link) => ({
    id: link.id || createBlockId(),
    type: 'link',
    title: link.title || '',
    target: link.target || ''
  }));
};

const toLegacyLinks = (blocks) => {
  return blocks
    .filter((block) => block.type === 'link')
    .map((block) => ({
      id: block.id,
      title: block.title || '',
      target: block.target || ''
    }));
};

const LinksOnlyEditor = ({ page, onChange }) => {
  const [blocks, setBlocks] = useState(normalizeBlocks(page));
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const [newLinkTarget, setNewLinkTarget] = useState('');
  const [newText, setNewText] = useState('');

  useEffect(() => {
    setBlocks(normalizeBlocks(page));
  }, [page.id, page.links, page.linkBlocks]);

  const insertBlock = (newBlock, position = 'end') => {
    if (position === 'start') {
      return [newBlock, ...blocks];
    }
    return [...blocks, newBlock];
  };

  const handleAddLink = (position = 'end') => {
    console.log('🔗 Add Link clicked - title:', newLinkTitle, 'target:', newLinkTarget);
    
    if (newLinkTitle.trim() && newLinkTarget.trim()) {
      console.log('✅ Link is valid, adding...');
      const newLink = {
        id: createBlockId(),
        type: 'link',
        title: newLinkTitle,
        target: newLinkTarget
      };
      console.log('📝 New link:', newLink);
      
      const updatedBlocks = insertBlock(newLink, position);
      console.log('📋 Updated blocks array:', updatedBlocks);
      
      setBlocks(updatedBlocks);
      setNewLinkTitle('');
      setNewLinkTarget('');
      updatePage(updatedBlocks);
      
      console.log('✅ Link added successfully');
    } else {
      console.warn('⚠️ Link validation failed - title or target empty');
    }
  };

  const handleAddText = (position = 'end') => {
    if (!newText.trim()) return;
    const newTextBlock = {
      id: createBlockId(),
      type: 'text',
      text: newText
    };
    const updatedBlocks = insertBlock(newTextBlock, position);
    setBlocks(updatedBlocks);
    setNewText('');
    updatePage(updatedBlocks);
  };

  const handleDeleteBlock = (blockId) => {
    const updatedBlocks = blocks.filter((block) => block.id !== blockId);
    setBlocks(updatedBlocks);
    updatePage(updatedBlocks);
  };

  const handleBlockChange = (blockId, field, value) => {
    const updatedBlocks = blocks.map((block) =>
      block.id === blockId ? { ...block, [field]: value } : block
    );
    setBlocks(updatedBlocks);
    updatePage(updatedBlocks);
  };

  const handleMoveBlock = (blockId, direction) => {
    const index = blocks.findIndex((block) => block.id === blockId);
    if ((direction === 'up' && index > 0) || (direction === 'down' && index < blocks.length - 1)) {
      const updatedBlocks = [...blocks];
      const moveIndex = direction === 'up' ? index - 1 : index + 1;
      [updatedBlocks[index], updatedBlocks[moveIndex]] = [updatedBlocks[moveIndex], updatedBlocks[index]];
      setBlocks(updatedBlocks);
      updatePage(updatedBlocks);
    }
  };

  const updatePage = (updatedBlocks) => {
    onChange({
      ...page,
      linkBlocks: updatedBlocks,
      links: toLegacyLinks(updatedBlocks)
    });
  };

  return (
    <div className="links-only-editor">
      <div className="editor-header">
        <h3>Page Title</h3>
        <input
          type="text"
          value={page.title || ''}
          onChange={(e) => onChange({ ...page, title: e.target.value })}
          placeholder="Enter page title"
          className="title-input"
        />
      </div>

      {/* Add New Link */}
      <div className="add-link-section">
        <h3>Add New Link</h3>
        <div className="add-link-form">
          <input
            type="text"
            value={newLinkTitle}
            onChange={(e) => setNewLinkTitle(e.target.value)}
            placeholder="Link title"
            className="form-input"
          />
          <LinkTargetInput
            value={newLinkTarget}
            onValueChange={setNewLinkTarget}
            placeholder="Target (page ID/number, URL, file path, or choose file)"
            inputClassName="form-input"
          />
          <button 
            className="add-btn"
            onClick={() => handleAddLink('end')}
            disabled={!newLinkTitle.trim() || !newLinkTarget.trim()}
          >
            Add Link
          </button>
          <button
            className="add-btn"
            onClick={() => handleAddLink('start')}
            disabled={!newLinkTitle.trim() || !newLinkTarget.trim()}
            title="Insert this link at the top"
          >
            Add Link First
          </button>
        </div>
      </div>

      <div className="add-link-section">
        <h3>Add New Text Block</h3>
        <div className="add-link-form">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Enter text block"
            className="form-input"
            rows={3}
          />
          <button
            className="add-btn"
            onClick={() => handleAddText('end')}
            disabled={!newText.trim()}
          >
            Add Text
          </button>
          <button
            className="add-btn"
            onClick={() => handleAddText('start')}
            disabled={!newText.trim()}
            title="Insert this text at the top"
          >
            Add Text First
          </button>
        </div>
      </div>

      {/* Mixed Blocks List */}
      <div className="links-list">
        <h3>Content Blocks ({blocks.length})</h3>
        {blocks.length === 0 ? (
          <p className="empty-message">No content yet. Add a link or text block above.</p>
        ) : (
          <div className="links-container">
            {blocks.map((block, index) => (
              <div key={block.id} className="link-item">
                <div className="link-order">{index + 1}</div>
                
                <div className="link-inputs">
                  {block.type === 'link' ? (
                    <>
                      <input
                        type="text"
                        value={block.title}
                        onChange={(e) => handleBlockChange(block.id, 'title', e.target.value)}
                        placeholder="Link title"
                        className="link-title-input"
                      />
                      <LinkTargetInput
                        value={block.target}
                        onValueChange={(value) => handleBlockChange(block.id, 'target', value)}
                        placeholder="Page ID/number, URL, file path, or choose file"
                        inputClassName="link-target-input"
                        buttonText="File"
                      />
                    </>
                  ) : (
                    <textarea
                      value={block.text || ''}
                      onChange={(e) => handleBlockChange(block.id, 'text', e.target.value)}
                      placeholder="Text block"
                      className="link-title-input"
                      rows={3}
                    />
                  )}
                </div>

                <div className="link-actions">
                  <button
                    className="action-btn"
                    onClick={() => handleMoveBlock(block.id, 'up')}
                    disabled={index === 0}
                    title="Move up"
                  >
                    Up
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleMoveBlock(block.id, 'down')}
                    disabled={index === blocks.length - 1}
                    title="Move down"
                  >
                    Down
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDeleteBlock(block.id)}
                    title="Delete block"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="preview-section">
        <h4>Preview</h4>
        <div className="links-preview">
          <h2>{page.title}</h2>
          <div className="preview-list">
            {blocks.map((block) => (
              block.type === 'link' ? (
                <div key={block.id} style={{ marginBottom: '0.5rem' }}>
                  <a href="#">{block.title || 'Untitled link'}</a> → {block.target}
                </div>
              ) : (
                <p key={block.id} style={{ whiteSpace: 'pre-wrap', margin: '0 0 0.8rem 0' }}>
                  {block.text}
                </p>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinksOnlyEditor;
