import React from 'react';

const Navigation = ({ onNavigate, isEditMode, onEditToggle, onView, onUndo, onPublish, onSave, onCancel, onAddPage, onDeletePage, onManagePages, currentPageId, currentPageNumber, totalPages }) => {
  return (
    <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center' }}>
      <button className="section-list-btn" onClick={() => onNavigate('home')}>Home</button>
      <button className="section-list-btn" onClick={() => onNavigate('index')}>Index</button>
      <button className="section-list-btn" onClick={() => onNavigate('previous')}>Previous</button>
      <button className="section-list-btn" onClick={() => onNavigate('next')}>Next</button>
      
      {/* Page counter */}
      {currentPageNumber && totalPages && (
        <span className="page-counter">{currentPageNumber}/{totalPages}</span>
      )}
      
      {isEditMode ? (
        <>
          <button className="section-list-btn edit-manage" onClick={onManagePages} title="Manage pages (add/delete/reorder)">📄 Manage</button>
          <button className="section-list-btn edit-add" onClick={onAddPage} title="Add new page after current page">➕ Add</button>
          <button className="section-list-btn edit-delete" onClick={onDeletePage} title="Delete current page">🗑️ Delete</button>
          <button className="section-list-btn edit-undo" onClick={onUndo}>↩️ Undo</button>
          <button className="section-list-btn edit-publish" onClick={onPublish}>🚀 Publish</button>
          <button className="section-list-btn edit-view" onClick={onView}>👁️ View</button>
          <button className="section-list-btn edit-save" onClick={onSave}>💾 Save</button>
          <button className="section-list-btn edit-cancel" onClick={onCancel}>❌ Cancel</button>
        </>
      ) : (
        <button className="section-list-btn edit-toggle" onClick={onEditToggle}>✏️ Edit</button>
      )}
    </nav>
  );
};

export default Navigation;
