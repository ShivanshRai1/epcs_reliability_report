import React, { useState } from 'react';

const Navigation = ({ onNavigate, isEditMode, isLiveMode, onEditToggle, onToggleLive, onUndo, onPublish, onSave, onCancel, onAddPage, onDeletePage, onManagePages, currentPageId, currentPageNumber, totalPages, isTestMode, isSeedingTestData, isPublishingTestData, onToggleTestMode, onSeedTestData, onPublishTestData }) => {
  const showTestSyncButtons = false;
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
    <nav className="editor-toolbar">
      <div className="toolbar-group toolbar-group-nav">
        <button className="section-list-btn" onClick={() => onNavigate('home')} title="Go to the cover page">🏠 Home</button>
        <button className="section-list-btn" onClick={() => onNavigate('index')} title="Go to the index page">📑 Index</button>
        <button className="section-list-btn" onClick={() => onNavigate('previous')} title="Go to previous page">⬅ Previous</button>
        <button className="section-list-btn" onClick={() => onNavigate('next')} title={isLastPage ? 'Go back to the first page' : 'Go to next page'}>{isLastPage ? 'Start Again ➡' : 'Next ➡'}</button>
      </div>

      {!isLiveMode && currentPageNumber && totalPages && (
        <div className="toolbar-group toolbar-group-counter">
          {isJumpMode ? (
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
          )}
        </div>
      )}

      {!isLiveMode && (
        <div className="toolbar-group toolbar-group-test">
          <button
            className={`section-list-btn ${isTestMode ? 'test-mode-active' : 'test-mode-inactive'}`}
            onClick={onToggleTestMode}
            title={isTestMode ? 'You are editing test data only. Click to return to production mode.' : 'Switch to safe test mode where production data is not changed.'}
          >
            🧪 {isTestMode ? 'Test Mode ON' : 'Test Mode OFF'}
          </button>
          {isTestMode && showTestSyncButtons && (
            <button
              className="section-list-btn test-mode-seed"
              onClick={onSeedTestData}
              disabled={isSeedingTestData}
              title="Reset test data by re-copying current production data"
            >
              {isSeedingTestData ? 'Copying Production to Test...' : 'Copy Production Data to Test Data'}
            </button>
          )}
          {isTestMode && showTestSyncButtons && (
            <button
              className="section-list-btn test-mode-publish"
              onClick={onPublishTestData}
              disabled={isPublishingTestData}
              title="Copy all test mode changes into production"
            >
              {isPublishingTestData ? 'Copying Test to Production...' : '📤 Copy Test Data to Production Data'}
            </button>
          )}
        </div>
      )}

      {!isLiveMode && !isEditMode && (
        <div className="toolbar-group toolbar-group-actions">
          <button className="section-list-btn edit-toggle" onClick={onEditToggle} title="Edit this page">✏️ Edit Page</button>
          <button className="section-list-btn edit-delete" onClick={onDeletePage} title="Delete this page">🗑 Delete Page</button>
          <button className="section-list-btn edit-view-placeholder" onClick={onToggleLive} title="Open read-only preview in a new tab">👁 Live Preview</button>
        </div>
      )}

      {isEditMode && !isLiveMode && (
        <div className="toolbar-group toolbar-group-edit">
          <button className="section-list-btn edit-manage" onClick={onManagePages} title="Manage page order and structure">📄 Manage Pages</button>
          <button className="section-list-btn edit-add" onClick={onAddPage} title="Add a page after the current page">➕ Add Page</button>
          <button className="section-list-btn edit-delete" onClick={onDeletePage} title="Delete this page">🗑 Delete Page</button>
          <button className="section-list-btn edit-publish" onClick={onPublish} title="Save and publish current edits">🚀 Publish Changes</button>
          <button className="section-list-btn edit-cancel" onClick={onCancel} title="Discard unsaved edits">❌ Cancel Editing</button>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
