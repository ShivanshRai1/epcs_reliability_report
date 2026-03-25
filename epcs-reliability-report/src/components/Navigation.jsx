import React, { useState } from 'react';

const Navigation = ({ onNavigate, isEditMode, isLiveMode, onEditToggle, onToggleLive, onUndo, onPublish, onSave, onCancel, onAddPage, onDeletePage, onManagePages, currentPageId, currentPageNumber, totalPages, isTestMode, isSeedingTestData, onToggleTestMode, onSeedTestData }) => {
  const [isJumpMode, setIsJumpMode] = useState(false);
  const [jumpPageNumber, setJumpPageNumber] = useState(currentPageNumber?.toString() || '');
  const isLastPage = Number(currentPageNumber) === Number(totalPages);

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

  // In live mode, always show only 4 buttons at bottom
  if (isLiveMode) {
    return (
      <nav className="pdf-viewer-nav legacy-live-nav d-flex justify-content-center align-items-center">
        <button className="pdf-nav-btn legacy-live-nav-btn btn btn-primary" onClick={() => onNavigate('home')}>Home</button>
        <button className="pdf-nav-btn legacy-live-nav-btn btn btn-primary" onClick={() => onNavigate('index')}>Index</button>
        <button className="pdf-nav-btn legacy-live-nav-btn btn btn-primary" onClick={() => onNavigate('previous')}>&lt;&lt; Previous</button>
        <button className="pdf-nav-btn legacy-live-nav-btn btn btn-primary" onClick={() => onNavigate('next')}>{isLastPage ? 'Start Again >>' : 'Next >>'}</button>
      </nav>
    );
  }

  return (
    <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
      <button className="section-list-btn" onClick={() => onNavigate('home')}>🏠 Home</button>
      <button className="section-list-btn" onClick={() => onNavigate('index')}>📑 Index</button>
      <button className="section-list-btn" onClick={() => onNavigate('previous')}>⬅ Previous</button>
      <button className="section-list-btn" onClick={() => onNavigate('next')}>{isLastPage ? 'Start Again ➡' : 'Next ➡'}</button>
      
      {/* Page counter - editable for jump to page (hidden in live mode) */}
      {!isLiveMode && currentPageNumber && totalPages && (
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

      {!isLiveMode && (
        <>
          <button
            className={`section-list-btn ${isTestMode ? 'test-mode-active' : 'test-mode-inactive'}`}
            onClick={onToggleTestMode}
            title={isTestMode ? 'Switch to production mode' : 'Switch to persistent test mode'}
          >
            🧪 {isTestMode ? 'Test On' : 'Test Off'}
          </button>
          {isTestMode && (
            <button
              className="section-list-btn test-mode-seed"
              onClick={onSeedTestData}
              disabled={isSeedingTestData}
              title="Re-seed persistent test tables from production"
            >
              {isSeedingTestData ? 'Seeding...' : 'Seed Test Data'}
            </button>
          )}
        </>
      )}

      {isLiveMode ? null : (
        <>
          {!isEditMode ? (
            <>
              <button className="section-list-btn edit-toggle" onClick={onEditToggle} title="Enter edit mode">✏️ Edit</button>
              <button className="section-list-btn edit-delete" onClick={onDeletePage} title="Delete current page">🗑 Delete</button>
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
