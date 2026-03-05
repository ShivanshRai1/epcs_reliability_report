import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import SectionPage from './SectionPage';
import './AddPageDialog.css';

const AddPageDialog = ({ isOpen, onClose, onPageCreate, currentPageId = null, existingPages = [] }) => {
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
      const allTemplates = data.templates || data || [];
      const filteredTemplates = allTemplates.filter(template => {
        const id = String(template.id || '').toLowerCase();
        const name = String(template.name || '').toLowerCase();
        return (
          id !== 'image-text' &&
          !name.includes('image + text') &&
          !name.includes('image-text') &&
          id !== 'just-tables' &&
          name !== 'just tables'
        );
      });
      setTemplates(filteredTemplates);
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

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
  };

  const getPageTypeForTemplate = (templateId) => {
    if (!templateId) return null;
    const templateToPageType = {
      'text-only': 'content',
      'just-images': 'image',
      'split-content': 'split-content-image',
      'table': 'table',
      'heading': 'heading',
      'index': 'index',
      'just-links': 'just-links'
    };
    return templateToPageType[templateId] || templateId;
  };

  const getSamplePageForTemplate = (templateId) => {
    const pageType = getPageTypeForTemplate(templateId);
    if (!pageType || !Array.isArray(existingPages)) return null;

    const preferredPreviewPageByTemplate = {
      'text-only': 26,
      'split-content': 28,
      'just-images': 7
    };

    const preferredPageNumber = preferredPreviewPageByTemplate[templateId];
    if (preferredPageNumber) {
      const preferredSample = existingPages.find((page) => Number(page.pageNumber) === preferredPageNumber);
      if (preferredSample) return preferredSample;
    }

    return existingPages.find((page) => page.pageType === pageType) || null;
  };

  const renderTemplatePreview = (templateId) => {
    if (templateId === 'just-links') {
      return (
        <div className="template-preview-live-wrap">
          <div className="template-preview-meta">Sample: Dummy preview</div>
          <div className="template-preview-live template-preview-dummy-live">
            <div className="template-preview-dummy-content">
              <div className="template-preview-dummy-title">LINKS PAGE</div>
              <div className="template-preview-dummy-line" />
              <div className="template-preview-dummy-line short" />
              <div className="template-preview-dummy-line" />
            </div>
          </div>
        </div>
      );
    }

    const sample = getSamplePageForTemplate(templateId);

    if (!sample) {
      return (
        <div className="template-preview-empty">No sample page available yet</div>
      );
    }

    if (templateId === 'table') {
      const columns = Array.isArray(sample.table?.columns) ? sample.table.columns : [];
      const rows = Array.isArray(sample.table?.rows)
        ? sample.table.rows
        : (Array.isArray(sample.table?.data) ? sample.table.data : []);

      return (
        <div className="template-preview-live-wrap">
          <div className="template-preview-meta">Sample: Page {sample.pageNumber}</div>
          <div className="template-preview-live template-preview-table-live">
            <div className="template-preview-table-shell">
              <div className="template-preview-table-title">{sample.title || 'TABLE PAGE'}</div>
              <table className="template-preview-table-mini">
                <thead>
                  <tr>
                    {columns.slice(0, 8).map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 8).map((row, idx) => (
                    <tr key={idx}>
                      {columns.slice(0, 8).map((col) => (
                        <td key={`${idx}-${col}`}>{row?.[col] ?? ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="template-preview-live-wrap">
        <div className="template-preview-meta">Sample: Page {sample.pageNumber}</div>
        <div className="template-preview-live">
          <div className="template-preview-scale">
            <SectionPage
              page={sample}
              onLinkClick={() => {}}
              isEditMode={false}
              onCellChange={() => {}}
              onHeadingChange={() => {}}
              onImageChange={() => {}}
              onIndexChange={() => {}}
              onImageClick={() => {}}
            />
          </div>
        </div>
      </div>
    );
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

    await createPageWithConfig();
  };

  const createPageWithConfig = async () => {
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
      
      console.log('📝 Creating page with params:', { selectedTemplate, pageTitle, insertPosition });
      
      // Call API with correct parameters
      const response = await apiService.createPage(
        selectedTemplate,
        pageTitle,
        null,
        positionParams
      );

      console.log('✅ API Response:', response);

      if (response.success) {
        console.log('🎉 Page created successfully:', response.page);
        
        // Refresh data and let parent navigate to the resolved, valid page
        await onPageCreate(response.page);
        
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
    <>
      {/* Main Dialog */}
      <div className="add-page-dialog-overlay" onClick={onClose}>
        <div className="add-page-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="dialog-header">
            <h2>Add New Page</h2>
            <button className="close-btn" onClick={onClose}>Close</button>
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
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="template-preview">
                        {renderTemplatePreview(template.id)}
                      </div>
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
    </>
  );
};

export default AddPageDialog;

