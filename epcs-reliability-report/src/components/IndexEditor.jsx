import React, { useState, useRef, useEffect } from 'react';
import './IndexEditor.css';
import { getTemplateBadge } from '../utils/templateInfo.jsx';

const IndexEditor = ({ page, onChange, availablePages = [] }) => {
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content || []);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newItemTarget, setNewItemTarget] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(null);
  const containerRef = useRef(null);
  const itemRefs = useRef({});

  const selectablePages = (Array.isArray(availablePages) ? availablePages : [])
    .filter((p) => p && p.id && p.pageType !== 'index' && p.pageType !== 'home')
    .sort((a, b) => (Number(a?.pageNumber) || 0) - (Number(b?.pageNumber) || 0));

  useEffect(() => {
    setTitle(page.title || '');
    setContent(page.content || []);
    setIsAddingNew(false);
    setNewItemTarget('');
    itemRefs.current = {};
  }, [page.id]);

  // Auto-scroll to selected item
  useEffect(() => {
    if (selectedIdx !== null && itemRefs.current[selectedIdx]) {
      const selectedElement = itemRefs.current[selectedIdx];
      setTimeout(() => {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
    }
  }, [selectedIdx]);

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

  const handleItemPageSelect = (idx, pageId) => {
    const selectedPage = selectablePages.find((p) => String(p.id) === String(pageId));
    const updated = [...content];
    updated[idx] = { ...updated[idx], target: pageId, title: selectedPage ? (selectedPage.title || pageId) : updated[idx].title };
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
    if (newItemTarget.trim()) {
      const selectedPage = selectablePages.find((p) => String(p.id) === String(newItemTarget));
      const itemTitle = selectedPage ? (selectedPage.title || newItemTarget) : newItemTarget;
      const updated = [...content, { title: itemTitle, target: newItemTarget.trim() }];
      setContent(updated);
      onChange({ ...page, content: updated });
      setNewItemTarget('');
      setIsAddingNew(false);
    }
  };

  return (
    <div className="index-editor" ref={containerRef}>
      <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
        {getTemplateBadge(page, true)}
      </div>
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
              ref={(ref) => {
                if (ref) itemRefs.current[idx] = ref;
              }}
              className={`index-item-editor ${selectedIdx === idx ? 'selected' : ''}`}
              onClick={() => setSelectedIdx(idx)}
              role="button"
              tabIndex={0}
            >
              <div className="index-item-number">{idx + 1}</div>
              <div className="index-item-fields">
                <select
                  value={item.target || ''}
                  onChange={(e) => handleItemPageSelect(idx, e.target.value)}
                  className="item-target-input"
                  style={{ width: '100%' }}
                >
                  <option value="">Select destination page</option>
                  {selectablePages.map((p) => (
                    <option key={String(p.id)} value={String(p.id)}>
                      {p.title || p.id}
                    </option>
                  ))}
                  {item.target && !selectablePages.some((p) => String(p.id) === String(item.target)) && (
                    <option value={item.target}>{item.title || item.target}</option>
                  )}
                </select>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteItem(idx);
                }}
                title="Delete (also press Delete key)"
                className="delete-btn"
              >
                🗑 Delete
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
            Add New Item
          </button>
        ) : (
          <div className="new-item-form">
            <select
              value={newItemTarget}
              onChange={(e) => setNewItemTarget(e.target.value)}
              className="item-target-input"
              style={{ width: '100%' }}
              autoFocus
            >
              <option value="">Select destination page</option>
              {selectablePages.map((p) => (
                <option key={String(p.id)} value={String(p.id)}>
                  {p.title || p.id}
                </option>
              ))}
            </select>
            <div className="new-item-buttons">
                <button onClick={handleAddItem} className="add-btn">➕ Add</button>
              <button 
                onClick={() => {
                  setIsAddingNew(false);
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
