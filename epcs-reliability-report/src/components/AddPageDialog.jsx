import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './AddPageDialog.css';

const AddPageDialog = ({ isOpen, onClose, onPageCreate, currentPageId = null }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [pageTitle, setPageTitle] = useState('');
  const [insertPosition, setInsertPosition] = useState('after'); // 'before', 'after' or 'at-end'
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch available templates
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setPageTitle('');
      setSelectedTemplate(null);
      setError('');
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      console.log('📋 Fetching templates...');
      const data = await apiService.getPageTemplates();
      console.log('✅ Templates loaded:', data);
      setTemplates(data.templates || data || []);
      setError('');
    } catch (err) {
      const errorMsg = 'Failed to load templates: ' + err.message;
      setError(errorMsg);
      console.error('❌ Template fetch error:', err);
      console.error('Error details:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleCreatePage = async () => {
    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    if (!pageTitle.trim()) {
      setError('Please enter a page title');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let positionParams = null;
      
      if (insertPosition === 'before') {
        positionParams = { pageId: currentPageId, insertBefore: true };
      } else if (insertPosition === 'after') {
        positionParams = { pageId: currentPageId, insertBefore: false };
      }
      
      console.log('📝 Creating page with params:', { selectedTemplate, pageTitle, insertPosition, positionParams });
      
      const response = await apiService.createPage(
        selectedTemplate,
        pageTitle,
        null,
        positionParams
      );

      console.log('✅ API Response:', response);

      if (response.success) {
        console.log('🎉 Page created successfully:', response.page);
        onPageCreate(response.page);
        onClose();
      } else {
        setError(response.message || 'Failed to create page');
        console.error('❌ Creation failed:', response);
      }
    } catch (err) {
      const errorMsg = err.message || 'Error creating page';
      setError(errorMsg);
      console.error('❌ Exception during page creation:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="add-page-dialog-overlay" onClick={onClose}>
      <div className="add-page-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Add New Page</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="dialog-body">
          {/* Page Title */}
          <div className="form-group">
            <label htmlFor="page-title">Page Title:</label>
            <input
              id="page-title"
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              placeholder="Enter page title"
              className="page-title-input"
            />
          </div>

          {/* Template Selection */}
          <div className="form-group">
            <label>Select Template:</label>
            {templatesLoading && <div className="loading-message">Loading templates...</div>}
            {!templatesLoading && templates.length === 0 && <div className="error-message">No templates available</div>}
            {templates.length > 0 && (
              <div className="templates-grid">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTemplate(template.id)}
                  >
                    <div className="template-name">{template.name}</div>
                    <div className="template-description">{template.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Insert Position */}
          {currentPageId && (
            <div className="form-group">
              <label>Insert Position:</label>
              <div className="position-options">
                <label className="radio-label">
                  <input
                    type="radio"
                    value="before"
                    checked={insertPosition === 'before'}
                    onChange={(e) => setInsertPosition(e.target.value)}
                  />
                  Before current page
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="after"
                    checked={insertPosition === 'after'}
                    onChange={(e) => setInsertPosition(e.target.value)}
                  />
                  After current page
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    value="at-end"
                    checked={insertPosition === 'at-end'}
                    onChange={(e) => setInsertPosition(e.target.value)}
                  />
                  At end of document
                </label>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && <div className="error-message">{error}</div>}
        </div>

        <div className="dialog-footer">
          <button className="btn-cancel" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="btn-create" 
            onClick={handleCreatePage}
            disabled={loading || !selectedTemplate || !pageTitle.trim()}
          >
            {loading ? 'Creating...' : 'Create Page'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPageDialog;
