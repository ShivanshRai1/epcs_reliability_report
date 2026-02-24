import React, { useState } from 'react';
import './TextOnlyEditor.css';

const TextOnlyEditor = ({ page, onChange }) => {
  const [blocks, setBlocks] = useState(page.blocks || [{ id: 1, type: 'paragraph', content: page.content || '' }]);

  const handleBlockChange = (blockId, newContent) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, content: newContent } : block
    );
    setBlocks(updatedBlocks);
    updatePage(updatedBlocks);
  };

  const handleAddBlock = (type = 'paragraph') => {
    const newBlock = {
      id: Math.max(...blocks.map(b => b.id), 0) + 1,
      type,
      content: ''
    };
    const updatedBlocks = [...blocks, newBlock];
    setBlocks(updatedBlocks);
    updatePage(updatedBlocks);
  };

  const handleDeleteBlock = (blockId) => {
    if (blocks.length > 1) {
      const updatedBlocks = blocks.filter(block => block.id !== blockId);
      setBlocks(updatedBlocks);
      updatePage(updatedBlocks);
    }
  };

  const handleMoveBlock = (blockId, direction) => {
    const index = blocks.findIndex(b => b.id === blockId);
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
      blocks: updatedBlocks,
      content: updatedBlocks.map(b => b.content).join('\n\n')
    });
  };

  return (
    <div className="text-only-editor">
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

      <div className="blocks-container">
        {blocks.map((block, index) => (
          <div key={block.id} className="text-block">
            <div className="block-header">
              <select 
                value={block.type}
                onChange={(e) => handleBlockChange(block.id, block.content)}
                className="block-type-select"
              >
                <option value="paragraph">📝 Paragraph</option>
                <option value="heading">🔤 Heading</option>
                <option value="quote">💬 Quote</option>
                <option value="list">📋 List (bullet)</option>
              </select>
              
              <div className="block-actions">
                <button
                  className="action-btn"
                  onClick={() => handleMoveBlock(block.id, 'up')}
                  disabled={index === 0}
                  title="Move up"
                >
                  ⬆️
                </button>
                <button
                  className="action-btn"
                  onClick={() => handleMoveBlock(block.id, 'down')}
                  disabled={index === blocks.length - 1}
                  title="Move down"
                >
                  ⬇️
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => handleDeleteBlock(block.id)}
                  disabled={blocks.length === 1}
                  title="Delete block"
                >
                  🗑️
                </button>
              </div>
            </div>

            <textarea
              value={block.content}
              onChange={(e) => handleBlockChange(block.id, e.target.value)}
              placeholder="Enter text content..."
              className={`block-content ${block.type}`}
              rows={block.type === 'paragraph' ? 4 : 2}
            />
          </div>
        ))}
      </div>

      <div className="editor-footer">
        <button className="add-block-btn" onClick={() => handleAddBlock('paragraph')}>
          ➕ Add Paragraph
        </button>
        <button className="add-block-btn" onClick={() => handleAddBlock('heading')}>
          ➕ Add Heading
        </button>
        <button className="add-block-btn" onClick={() => handleAddBlock('quote')}>
          ➕ Add Quote
        </button>
      </div>

      <div className="preview-section">
        <h4>Preview</h4>
        <div className="text-preview">
          <h2>{page.title}</h2>
          {blocks.map((block, idx) => (
            <div key={idx} className={`preview-block ${block.type}`}>
              {block.type === 'heading' && <h3>{block.content}</h3>}
              {block.type === 'paragraph' && <p>{block.content}</p>}
              {block.type === 'quote' && <blockquote>{block.content}</blockquote>}
              {block.type === 'list' && (
                <ul>
                  {block.content.split('\n').filter(line => line.trim()).map((line, i) => (
                    <li key={i}>{line.trim()}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TextOnlyEditor;
