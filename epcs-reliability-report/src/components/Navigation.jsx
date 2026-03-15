import React, { useState } from 'react';

const Navigation = ({ onNavigate, isEditMode, isReadMode, isLiveMode, onEditToggle, onView, onToggleLive, onUndo, onPublish, onSave, onCancel, onAddPage, onDeletePage, onManagePages, currentPageId, currentPageNumber, totalPages }) => {
  const [isJumpMode, setIsJumpMode] = useState(false);
  const [jumpPageNumber, setJumpPageNumber] = useState(currentPageNumber?.toString() || '');

  const handleJumpPageChange = (e) => {
    setJumpPageNumber(e.target.value);
  };

  const handleJumpPageKeyDown = (e) => {
    if (e.key === 'Enter') {
      const pageNum = parseInt(jumpPageNumber);
      if (pageNum > 0 && pageNum <= totalPages) {
        onNavigate('jump', pageNum);
      }
      setIsJumpMode(false);
      setJumpPageNumber(currentPageNumber?.toString() || '');
    } else if (e.key === 'Escape') {
      setIsJumpMode(false);
      setJumpPageNumber(currentPageNumber?.toString() || '');
    }
  };

  const handleJumpPageBlur = () => {
    setIsJumpMode(false);
    setJumpPageNumber(currentPageNumber?.toString() || '');
  };

  return (
    <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
      <button className="section-list-btn" onClick={() => onNavigate('home')}>🏠 Home</button>
      <button className="section-list-btn" onClick={() => onNavigate('index')}>📑 Index</button>
      <button className="section-list-btn" onClick={() => onNavigate('previous')}>⬅ Previous</button>
      <button className="section-list-btn" onClick={() => onNavigate('next')}>Next ➡</button>
      
      {/* Page counter - editable for jump to page */}
      {currentPageNumber && totalPages && (
        isJumpMode ? (
          <input
            type="number"
            value={jumpPageNumber}
            onChange={handleJumpPageChange}
            onKeyDown={handleJumpPageKeyDown}
            onBlur={handleJumpPageBlur}
            className="page-counter-input"
            placeholder="Enter page number"
            autoFocus
            min="1"
            max={totalPages}
          />
        ) : (
          <span 
            className="page-counter"
            onClick={() => setIsJumpMode(true)}
            title="Click to jump to a page number"
            style={{ cursor: 'pointer' }}
          >
            {currentPageNumber}/{totalPages}
          </span>
        )
      )}

      {isLiveMode ? (
        <>
          <span className="section-list-btn" style={{ cursor: 'default', opacity: 0.9 }}>
            🔴 LIVE PREVIEW
          </span>
          <button
            className="section-list-btn edit-view-placeholder"
            onClick={onToggleLive}
            title="Exit live preview mode"
          >
            👁 Exit Live
          </button>
        </>
      ) : (
        <>
          {/* Read Mode button - always visible in development mode */}
          <button 
            className={`section-list-btn edit-view ${isReadMode ? 'read-mode-active' : ''}`} 
            onClick={onView}
            title={isReadMode ? 'Exit read-only mode' : 'Enter read-only mode'}
          >
            🔒 Read Mode {isReadMode ? 'ON' : 'OFF'}
          </button>

          {!isEditMode ? (
            <>
              <button className={`section-list-btn edit-toggle ${isReadMode ? 'edit-disabled' : ''}`} onClick={onEditToggle} disabled={isReadMode} title={isReadMode ? 'Read Mode is ON' : 'Enter edit mode'}>✏️ Edit</button>
              <button className="section-list-btn edit-view-placeholder" onClick={onToggleLive} title="Open live preview mode">👁 View Live</button>
            </>
          ) : null}
        </>
      )}

      {/* Edit toolbar - only visible in edit mode (hidden in live mode) */}
      {isEditMode && !isLiveMode && (
        <>
          <button className="section-list-btn edit-manage" onClick={onManagePages} title="Manage pages (add/delete/reorder)">📄 Manage</button>
          <button className="section-list-btn edit-add" onClick={onAddPage} title="Add new page after current page">➕ Add</button>
          <button className="section-list-btn edit-delete" onClick={onDeletePage} title="Delete current page">🗑 Delete</button>
          <button className="section-list-btn edit-publish" onClick={onPublish}>🚀 Publish</button>
          <button className="section-list-btn edit-cancel" onClick={onCancel}>❌ Cancel</button>
        </>
      )}
    </nav>
  );
};

export default Navigation;
