import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './AddPageDialog.css';

const AddPageDialog = ({ isOpen, onClose, onPageCreate, currentPageId = null, onNavigate = null }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [pageTitle, setPageTitle] = useState('');
  const [insertPosition, setInsertPosition] = useState('after'); // 'before', 'after' or 'at-end'
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Split Content modal state
  const [showSplitContentModal, setShowSplitContentModal] = useState(false);
  const [splitContentConfig, setSplitContentConfig] = useState({
    leftHeader: '',
    rightHeader: '',
    leftContentType: 'text', // text, link, image
    rightContentType: 'text'
  });

  // Fetch available templates
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setPageTitle('');
      setSelectedTemplate(null);
      setError('');
      setShowSplitContentModal(false);
      setSplitContentConfig({
        leftHeader: '',
        rightHeader: '',
        leftContentType: 'text',
        rightContentType: 'text'
      });
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

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    // Show split content modal if split-content template selected
    if (templateId === 'split-content' || templateId === 'split') {
      setShowSplitContentModal(true);
    }
  };

  const handleSplitContentConfirm = async () => {
    setShowSplitContentModal(false);
    // Create page with split content configuration
    await createPageWithConfig();
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

    // For split content, show modal instead
    const template = templates.find(t => t.id === selectedTemplate);
    if (selectedTemplate === 'split-content' || (template && template.name.includes('Split Content'))) {
      setShowSplitContentModal(true);
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
      
      // Build page data based on template
      let pageData = null;
      if (selectedTemplate === 'split-content' || templates.find(t => t.id === selectedTemplate)?.name.includes('Split Content')) {
        pageData = {
          leftHeader: splitContentConfig.leftHeader,
          rightHeader: splitContentConfig.rightHeader,
          leftContentType: splitContentConfig.leftContentType,
          rightContentType: splitContentConfig.rightContentType,
          leftContent: '',
          rightContent: ''
        };
      }
      
      console.log('📝 Creating page with params:', { selectedTemplate, pageTitle, insertPosition, pageData });
      
      const response = await apiService.createPage(
        selectedTemplate,
        pageTitle,
        pageData,
        positionParams
      );

      console.log('✅ API Response:', response);

      if (response.success) {
        console.log('🎉 Page created successfully:', response.page);
        
        // Call onPageCreate to refresh data
        onPageCreate(response.page);
        
        // Navigate to new page immediately
        if (onNavigate && response.page.pageNumber) {
          onNavigate('jump', response.page.pageNumber);
        }
        
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
                      onClick={() => handleTemplateSelect(template.id)}
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

      {/* Split Content Configuration Modal */}
      {showSplitContentModal && (
        <div className="add-page-dialog-overlay" onClick={() => setShowSplitContentModal(false)}>
          <div className="add-page-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-header">
              <h2>Split Content Configuration</h2>
              <button className="close-btn" onClick={() => setShowSplitContentModal(false)}>×</button>
            </div>

            <div className="dialog-body">
              <div className="form-group">
                <label htmlFor="left-header">Left Header (optional):</label>
                <input
                  id="left-header"
                  type="text"
                  value={splitContentConfig.leftHeader}
                  onChange={(e) => setSplitContentConfig({ ...splitContentConfig, leftHeader: e.target.value })}
                  placeholder="e.g., Features"
                  className="page-title-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="right-header">Right Header (optional):</label>
                <input
                  id="right-header"
                  type="text"
                  value={splitContentConfig.rightHeader}
                  onChange={(e) => setSplitContentConfig({ ...splitContentConfig, rightHeader: e.target.value })}
                  placeholder="e.g., Specifications"
                  className="page-title-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="left-content-type">Left Content Type:</label>
                <select
                  id="left-content-type"
                  value={splitContentConfig.leftContentType}
                  onChange={(e) => setSplitContentConfig({ ...splitContentConfig, leftContentType: e.target.value })}
                  className="page-title-input"
                >
                  <option value="text">Text</option>
                  <option value="link">Link/Hyperlink</option>
                  <option value="image">Image</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="right-content-type">Right Content Type:</label>
                <select
                  id="right-content-type"
                  value={splitContentConfig.rightContentType}
                  onChange={(e) => setSplitContentConfig({ ...splitContentConfig, rightContentType: e.target.value })}
                  className="page-title-input"
                >
                  <option value="text">Text</option>
                  <option value="link">Link/Hyperlink</option>
                  <option value="image">Image</option>
                </select>
              </div>
            </div>

            <div className="dialog-footer">
              <button className="btn-cancel" onClick={() => setShowSplitContentModal(false)} disabled={loading}>
                Cancel
              </button>
              <button 
                className="btn-create" 
                onClick={handleSplitContentConfirm}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddPageDialog;

