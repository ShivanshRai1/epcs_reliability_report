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
  const allEditedPageIds = Array.from(new Set([...savedDraftPages, ...changedPages]));
  const editedPagesList = allEditedPageIds
    .map(pageId => reportData?.pages?.find(p => p.id === pageId || String(p.id) === String(pageId)))
    .filter(Boolean);

  const deletedPageIds = reportData?.pages
    ?.filter(p => p._isDraftDeleted)
    .map(p => p.id) || [];
  const allDeleteIds = [...new Set([...pendingDeletes, ...deletedPageIds])];
  const deletedPagesList = allDeleteIds
    .map(pageId => reportData?.pages?.find(p => p.id === pageId || String(p.id) === String(pageId)))
    .filter(Boolean);

  const hasReorder = pendingReorder && pendingReorder.length > 0;

  const totalChanges = editedPagesList.length + pendingCreates.length + allDeleteIds.length + (hasReorder ? 1 : 0);

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
                    <span className="page-title">{page.title || page.heading || 'Untitled Page'}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* New Pages */}
          {pendingCreates.length > 0 && (
            <div className="change-category">
              <h3>➕ New Pages ({pendingCreates.length})</h3>
              <div className="change-items">
                {pendingCreates.map(page => (
                  <label key={page.id} className="change-item">
                    <input
                      type="checkbox"
                      checked={selectedChanges.newPages.has(page.id)}
                      onChange={() => toggleNewPage(page.id)}
                    />
                    <span className="page-title">{page.title || page.heading || 'Untitled Page'}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Deleted Pages */}
          {allDeleteIds.length > 0 && (
            <div className="change-category">
              <h3>🗑️ Deleted Pages ({allDeleteIds.length})</h3>
              <div className="change-items">
                {deletedPagesList.map(page => (
                  <label key={page.id} className="change-item">
                    <input
                      type="checkbox"
                      checked={selectedChanges.deletedPages.has(page.id)}
                      onChange={() => toggleDeletedPage(page.id)}
                    />
                    <span className="page-title">{page.title || page.heading || 'Untitled Page'}</span>
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
