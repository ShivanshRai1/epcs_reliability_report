import React, { useEffect, useState } from 'react';
import './TextOnlyEditor.css';
import { getTemplateBadge } from '../utils/templateInfo.jsx';

const TextOnlyEditor = ({ page, onChange }) => {
  const [blocks, setBlocks] = useState(page.blocks || [{ id: 1, type: 'paragraph', content: page.content || '' }]);

  useEffect(() => {
    setBlocks(page.blocks || [{ id: 1, type: 'paragraph', content: page.content || '' }]);
  }, [page.id]);

  const handleBlockChange = (blockId, newContent) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, content: newContent } : block
    );
    setBlocks(updatedBlocks);
    updatePage(updatedBlocks);
  };

  const handleBlockTypeChange = (blockId, newType) => {
    const updatedBlocks = blocks.map(block =>
      block.id === blockId ? { ...block, type: newType } : block
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
      <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
        {getTemplateBadge(page, true)}
      </div>
      <div className="editor-header">
        <h3>Page Title</h3>
        <input
          type="text"
          value={page.title || ''}
          onChange={(e) => onChange({ ...page, title: e.target.value })}
          placeholder="Enter page title"
          className="title-input"
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.85rem', color: '#555' }}>
          Title banner color:
          <input
            type="color"
            value={page.titleColor || '#0052a3'}
            onChange={(e) => onChange({ ...page, titleColor: e.target.value })}
            style={{ width: '36px', height: '28px', padding: '2px', border: '1px solid #b9c7da', borderRadius: '4px', cursor: 'pointer' }}
          />
        </label>
      </div>

      <div className="blocks-container">
        {blocks.map((block, index) => (
          <div key={block.id} className="text-block">
            <div className="block-header">
              <select 
                value={block.type}
                onChange={(e) => handleBlockTypeChange(block.id, e.target.value)}
                className="block-type-select"
              >
                <option value="paragraph">Paragraph</option>
                <option value="heading">Heading</option>
                <option value="quote">Quote</option>
                <option value="list">List (bullet)</option>
              </select>
              
              <div className="block-actions">
                <button
                  className="action-btn"
                  onClick={() => handleMoveBlock(block.id, 'up')}
                  disabled={index === 0}
                  title="Move up"
                >
                  ↑ Up
                </button>
                <button
                  className="action-btn"
                  onClick={() => handleMoveBlock(block.id, 'down')}
                  disabled={index === blocks.length - 1}
                  title="Move down"
                >
                  ↓ Down
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => handleDeleteBlock(block.id)}
                  disabled={blocks.length === 1}
                  title="Delete block"
                >
                  🗑 Delete
                </button>
              </div>
            </div>

            <textarea
              value={block.content}
              onChange={(e) => handleBlockChange(block.id, e.target.value)}
              placeholder="Enter text content..."
              className={`block-content ${block.type}`}
              rows={block.type === 'paragraph' ? 4 : 2}
              style={{ background: '#ffffff', color: '#213547' }}
            />
          </div>
        ))}
      </div>

      <div className="editor-footer">
        <button className="add-block-btn" onClick={() => handleAddBlock('paragraph')}>
          📝 Add Paragraph
        </button>
        <button className="add-block-btn" onClick={() => handleAddBlock('heading')}>
          🧩 Add Heading
        </button>
        <button className="add-block-btn" onClick={() => handleAddBlock('quote')}>
          💬 Add Quote
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
