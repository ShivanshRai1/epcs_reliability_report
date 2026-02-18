import React from 'react';

const Navigation = ({ onNavigate, isEditMode, onEditToggle, onSave, onCancel }) => {
  return (
    <nav style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
      <button className="section-list-btn" onClick={() => onNavigate('home')}>Home</button>
      <button className="section-list-btn" onClick={() => onNavigate('index')}>Index</button>
      <button className="section-list-btn" onClick={() => onNavigate('previous')}>Previous</button>
      <button className="section-list-btn" onClick={() => onNavigate('next')}>Next</button>
      
      {isEditMode ? (
        <>
          <button className="section-list-btn edit-save" onClick={onSave}>Save</button>
          <button className="section-list-btn edit-cancel" onClick={onCancel}>Cancel</button>
        </>
      ) : (
        <button className="section-list-btn edit-toggle" onClick={onEditToggle}>Edit</button>
      )}
    </nav>
  );
};

export default Navigation;
