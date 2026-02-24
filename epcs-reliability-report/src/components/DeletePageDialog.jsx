import React, { useState } from 'react';
import './DeletePageDialog.css';

const DeletePageDialog = ({ isOpen, onClose, page, onConfirmDelete, isDeleting = false }) => {
  if (!isOpen || !page) return null;

  return (
    <div className="delete-page-dialog-overlay" onClick={onClose}>
      <div className="delete-page-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>⚠️ Delete Page</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="dialog-body">
          <p className="warning-text">Are you sure you want to delete this page?</p>
          <div className="page-info">
            <div><strong>Page {page.pageNumber}:</strong> {page.title}</div>
            <div className="page-type-badge">{page.pageType}</div>
          </div>
          <p className="note-text">
            This action will remove the page and renumber all subsequent pages. This can be undone by reordering pages back.
          </p>
        </div>

        <div className="dialog-footer">
          <button 
            className="btn-cancel" 
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button 
            className="btn-delete" 
            onClick={() => onConfirmDelete(page.id)}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Page'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePageDialog;
