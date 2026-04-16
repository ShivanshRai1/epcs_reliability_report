import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import './PublishSelectionModal.css';

const PublishSelectionModal = ({ 
  isOpen, 
  onConfirm, 
  onCancel,
  changedPages,
  savedDraftPages,
  pendingCreates,
  pendingDeletes,
  pendingReorder,
  reportData
}) => {
  const [selectedChanges, setSelectedChanges] = useState({
    editedPages: new Set(),
    newPages: new Set(),
    deletedPages: new Set(),
    reorder: false
  });

  // Helper function to format page display with number and type
  const formatPageDisplay = (page) => {
    const pageNumber = page.pageNumber || '?';
    const pageType = page.pageType || page.pageTemplate || 'Content';
    // Capitalize first letter of page type
    const formattedType = pageType.charAt(0).toUpperCase() + pageType.slice(1);
    const title = page.title || page.heading || 'Untitled Page';
    return `Page ${pageNumber} (${formattedType}) - ${title}`;
  };

  // Initialize all changes as selected by default
  useEffect(() => {
    if (!isOpen) return;

    const allEditedPageIds = Array.from(new Set([...savedDraftPages, ...changedPages]));
    const allNewPageIds = pendingCreates.map(p => p.id);
    const deletedPageIds = reportData?.pages
      ?.filter(p => p._isDraftDeleted)
      .map(p => p.id) || [];
    const allDeleteIds = [...new Set([...pendingDeletes, ...deletedPageIds])];

    setSelectedChanges({
      editedPages: new Set(allEditedPageIds),
      newPages: new Set(allNewPageIds),
      deletedPages: new Set(allDeleteIds),
      reorder: pendingReorder && pendingReorder.length > 0
    });
  }, [isOpen, changedPages, savedDraftPages, pendingCreates, pendingDeletes, pendingReorder, reportData]);

  const toggleEditedPage = (pageId) => {
    setSelectedChanges(prev => {
      const newSet = new Set(prev.editedPages);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return { ...prev, editedPages: newSet };
    });
  };

  const toggleNewPage = (pageId) => {
    setSelectedChanges(prev => {
      const newSet = new Set(prev.newPages);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return { ...prev, newPages: newSet };
    });
  };

  const toggleDeletedPage = (pageId) => {
    setSelectedChanges(prev => {
      const newSet = new Set(prev.deletedPages);
      if (newSet.has(pageId)) {
        newSet.delete(pageId);
      } else {
        newSet.add(pageId);
      }
      return { ...prev, deletedPages: newSet };
    });
  };

  const toggleReorder = () => {
    setSelectedChanges(prev => ({ ...prev, reorder: !prev.reorder }));
  };

  const handleConfirm = () => {
    onConfirm(selectedChanges);
  };

  // Build change lists
  const newPageIds = new Set(pendingCreates.map(p => p.id));

  // Draft-deleted pages that were also draft-created should NOT appear in New Pages
  // (they were never on the backend, so publishing them would create then immediately delete)
  const draftDeletedIds = new Set(
    (reportData?.pages || []).filter(p => p._isDraftDeleted).map(p => p.id)
  );
  const publishableCreates = pendingCreates.filter(p => !draftDeletedIds.has(p.id));
  
  // Filter out pages that are in pendingCreates from the edited list
  // (new pages should only show in "New Pages" section, not "Edited Pages")
  const allEditedPageIds = Array.from(new Set([...savedDraftPages, ...changedPages]))
    .filter(pageId => !newPageIds.has(pageId));
  
  const editedPagesList = allEditedPageIds
    .map(pageId => reportData?.pages?.find(p => p.id === pageId || String(p.id) === String(pageId)))
    .filter(Boolean);

  const deletedPageIds = Array.from(draftDeletedIds);
  const allDeleteIds = [...new Set([...pendingDeletes, ...deletedPageIds])]
    .filter(pageId => !newPageIds.has(pageId) || draftDeletedIds.has(pageId)); // only show real backend deletes + draft-created-then-deleted
  // For display: only show pages actually on the backend (not draft-only creations)
  const realDeleteIds = allDeleteIds.filter(pageId => !/^page_\d+$/.test(String(pageId ?? '')));
  const deletedPagesList = realDeleteIds
    .map(pageId => reportData?.pages?.find(p => p.id === pageId || String(p.id) === String(pageId)))
    .filter(Boolean);

  const hasReorder = pendingReorder && pendingReorder.length > 0;

  const totalChanges = editedPagesList.length + publishableCreates.length + realDeleteIds.length + (hasReorder ? 1 : 0);

  if (totalChanges === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onCancel}>
        <div className="publish-selection-modal">
          <h2>No Changes to Publish</h2>
          <p>There are no pending changes to publish.</p>
          <div className="dialog-actions">
            <button className="btn-cancel" onClick={onCancel}>
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="publish-selection-modal">
        <h2>Select Changes to Publish</h2>
        
        <p className="instruction-text">
          Choose which changes you want to publish. Unselected changes will remain in draft.
        </p>

        <div className="changes-list">
          {/* Edited Pages */}
          {editedPagesList.length > 0 && (
            <div className="change-category">
              <h3>✏️ Edited Pages ({editedPagesList.length})</h3>
              <div className="change-items">
                {editedPagesList.map(page => (
                  <label key={page.id} className="change-item">
                    <input
                      type="checkbox"
                      checked={selectedChanges.editedPages.has(page.id)}
                      onChange={() => toggleEditedPage(page.id)}
                    />
                    <span className="page-title">{formatPageDisplay(page)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* New Pages */}
          {publishableCreates.length > 0 && (
            <div className="change-category">
              <h3>➕ New Pages ({publishableCreates.length})</h3>
              <div className="change-items">
                {publishableCreates.map(page => (
                  <label key={page.id} className="change-item">
                    <input
                      type="checkbox"
                      checked={selectedChanges.newPages.has(page.id)}
                      onChange={() => toggleNewPage(page.id)}
                    />
                    <span className="page-title">{formatPageDisplay(page)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Deleted Pages */}
          {realDeleteIds.length > 0 && (
            <div className="change-category">
              <h3>🗑️ Deleted Pages ({realDeleteIds.length})</h3>
              <div className="change-items">
                {deletedPagesList.map(page => (
                  <label key={page.id} className="change-item">
                    <input
                      type="checkbox"
                      checked={selectedChanges.deletedPages.has(page.id)}
                      onChange={() => toggleDeletedPage(page.id)}
                    />
                    <span className="page-title">{formatPageDisplay(page)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Page Reorder */}
          {hasReorder && (
            <div className="change-category">
              <h3>🔄 Page Order</h3>
              <div className="change-items">
                <label className="change-item">
                  <input
                    type="checkbox"
                    checked={selectedChanges.reorder}
                    onChange={toggleReorder}
                  />
                  <span className="page-title">Publish new page order</span>
                </label>
              </div>
            </div>
          )}
        </div>

        <div className="dialog-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button 
            className="btn-next" 
            onClick={handleConfirm}
            disabled={
              selectedChanges.editedPages.size === 0 && 
              selectedChanges.newPages.size === 0 && 
              selectedChanges.deletedPages.size === 0 && 
              !selectedChanges.reorder
            }
          >
            Next →
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PublishSelectionModal;
