import React from 'react';
import Modal from './Modal';
import './PublishConfirmDialog.css';

const PublishConfirmDialog = ({ isOpen, onConfirm, onCancel }) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="publish-confirm-dialog">
        <h2>⚠️ Publish Report - Permanent Action</h2>
        
        <div className="publish-warning-box">
          <p className="warning-title">This action will:</p>
          <ul className="warning-list">
            <li>Lock all pages to read-only mode</li>
            <li>Commit ALL changes permanently</li>
            <li>Make all changes irreversible</li>
            <li>No undo available after publishing</li>
          </ul>
        </div>

        <p className="confirmation-prompt">
          Are you sure you want to publish this report?
        </p>

        <div className="dialog-actions">
          <button className="btn-cancel" onClick={onCancel}>
            ❌ Cancel - Keep Editing
          </button>
          <button className="btn-publish" onClick={onConfirm}>
            🚀 Confirm Publish
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PublishConfirmDialog;
