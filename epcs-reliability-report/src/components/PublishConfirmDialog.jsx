import React from 'react';
import Modal from './Modal';
import './PublishConfirmDialog.css';

const PublishConfirmDialog = ({ isOpen, onConfirm, onCancel }) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel}>
      <div className="publish-confirm-dialog">
        <h2>⚠️ Publish Report</h2>
        
        <p className="warning-message">
          This is an <strong>irreversible action</strong>. Once published, all changes will be permanent and cannot be undone.
        </p>

        <p className="confirmation-prompt">
          Do you want to proceed?
        </p>

        <div className="dialog-actions">
          <button className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn-publish" onClick={onConfirm}>
            Publish
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PublishConfirmDialog;
