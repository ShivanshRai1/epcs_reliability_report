import React, { useState, useRef, useEffect } from 'react';
import './IndexEditor.css';

const IndexEditor = ({ page, onChange }) => {
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content || []);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemTarget, setNewItemTarget] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(null);
  const containerRef = useRef(null);

  // Handle arrow key navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedIdx === null) return;

      if (e.key === 'ArrowUp' && selectedIdx > 0) {
        e.preventDefault();
        handleMoveUp(selectedIdx);
        // Use a setTimeout to ensure the state updates before we change selectedIdx
        setTimeout(() => setSelectedIdx(selectedIdx - 1), 0);
      } else if (e.key === 'ArrowDown' && selectedIdx < content.length - 1) {
        e.preventDefault();
        handleMoveDown(selectedIdx);
        // Use a setTimeout to ensure the state updates before we change selectedIdx
        setTimeout(() => setSelectedIdx(selectedIdx + 1), 0);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedIdx, content]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onChange({ ...page, title: newTitle });
  };

  const handleItemTitleChange = (idx, newTitle) => {
    const updated = [...content];
    updated[idx].title = newTitle;
    setContent(updated);
    onChange({ ...page, content: updated });
  };

  const handleItemTargetChange = (idx, newTarget) => {
    const updated = [...content];
    updated[idx].target = newTarget;
    setContent(updated);
    onChange({ ...page, content: updated });
  };

  const handleMoveUp = (idx) => {
    if (idx > 0) {
      const updated = [...content];
      [updated[idx], updated[idx - 1]] = [updated[idx - 1], updated[idx]];
      setContent(updated);
      onChange({ ...page, content: updated });
    }
  };

  const handleMoveDown = (idx) => {
    if (idx < content.length - 1) {
      const updated = [...content];
      [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
      setContent(updated);
      onChange({ ...page, content: updated });
    }
  };

  const handleDeleteItem = (idx) => {
    const updated = content.filter((_, i) => i !== idx);
    setContent(updated);
    onChange({ ...page, content: updated });
    setSelectedIdx(null);
  };

  const handleAddItem = () => {
    if (newItemTitle.trim() && newItemTarget.trim()) {
      const updated = [...content, { title: newItemTitle.trim(), target: newItemTarget.trim() }];
      setContent(updated);
      onChange({ ...page, content: updated });
      setNewItemTitle('');
      setNewItemTarget('');
      setIsAddingNew(false);
    }
  };

  return (
    <div className="index-editor" ref={containerRef}>
      <div className="index-editor-section">
        <label htmlFor="index-title">Index Title:</label>
        <input
          id="index-title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          className="index-title-input"
          placeholder="e.g., INDEX"
        />
      </div>

      <div className="index-editor-section">
        <h3>Content Items</h3>
        <p className="help-text">Click to select an item, then use ⬆️ ⬇️ arrow keys to reorder</p>
        <div className="index-items-list">
          {content.map((item, idx) => (
            <div 
              key={idx} 
              className={`index-item-editor ${selectedIdx === idx ? 'selected' : ''}`}
              onClick={() => setSelectedIdx(idx)}
              role="button"
              tabIndex={0}
            >
              <div className="index-item-number">{idx + 1}</div>
              <div className="index-item-fields">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => handleItemTitleChange(idx, e.target.value)}
                  placeholder="Item title"
                  className="item-title-input"
                />
                <input
                  type="text"
                  value={item.target}
                  onChange={(e) => handleItemTargetChange(idx, e.target.value)}
                  placeholder="Link target (e.g., epcs_discrete_product)"
                  className="item-target-input"
                />
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(idx);
                }}
                title="Delete (also press Delete key)"
                className="delete-btn"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="index-editor-section">
        {!isAddingNew ? (
          <button 
            onClick={() => setIsAddingNew(true)}
            className="add-item-btn"
          >
            + Add New Item
          </button>
        ) : (
          <div className="new-item-form">
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="New item title"
              className="item-title-input"
              autoFocus
            />
            <input
              type="text"
              value={newItemTarget}
              onChange={(e) => setNewItemTarget(e.target.value)}
              placeholder="New item target"
              className="item-target-input"
            />
            <div className="new-item-buttons">
              <button onClick={handleAddItem} className="add-btn">Add</button>
              <button 
                onClick={() => {
                  setIsAddingNew(false);
                  setNewItemTitle('');
                  setNewItemTarget('');
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndexEditor;
