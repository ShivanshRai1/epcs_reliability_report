import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import SectionPage from './SectionPage';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';
import './AddPageDialog.css';

const AddPageDialog = ({ isOpen, onClose, onPageCreate, currentPageId = null, existingPages = [] }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [pageTitle, setPageTitle] = useState('');
  const [insertPosition, setInsertPosition] = useState('after'); // 'before', 'after' or 'at-end'
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [error, setError] = useState('');

  const offlineTemplateFallback = [
    { id: 'text-only', name: 'Text Only', description: 'Simple text content page' },
    { id: 'heading', name: 'Heading', description: 'Title and heading-focused page' },
    { id: 'table', name: 'Table', description: 'Structured table page' },
    { id: 'just-images', name: 'Images', description: 'Image-focused page' },
    { id: 'just-links', name: 'Links + Text', description: 'Links with optional text blocks' },
    { id: 'link-only', name: 'Links Only', description: 'Link-focused page without text blocks' },
    { id: 'mixed-content', name: 'Mixed Content', description: 'Text, links, and images in any order with reorder' },
    { id: 'split-text-image', name: 'Split Text + Image', description: 'Text on left and image on right with optional headers' },
    { id: 'split-links-image', name: 'Split Links + Image', description: 'Links on left and image on right with optional headers' },
    { id: 'split-image-links', name: 'Split Image + Links', description: 'Image on left and links on right with optional headers' },
    { id: 'split-image-image', name: 'Split Image + Image', description: 'Image on left and image on right with optional headers' }
  ];

  // Fetch available templates
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setPageTitle('');
      setSelectedTemplate(null);
      setError('');
      lockBodyScroll();
    }

    return () => {
      if (isOpen) {
        unlockBodyScroll();
      }
    };
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
          id !== 'images-gallery' &&
          id !== 'images-carousel' &&
          id !== 'video-gallery' &&
          id !== 'just-tables' &&
          name !== 'just tables'
        );
      });

      // Ensure additional functional templates are always visible even when API list is old.
      const templateMap = new Map(filteredTemplates.map((t) => [t.id, t]));

      // Override copy so similar templates are clearly differentiated.
      if (templateMap.has('just-links')) {
        templateMap.set('just-links', {
          ...templateMap.get('just-links'),
          name: 'Links + Text',
          description: 'Links with optional text blocks'
        });
      }

      const ensuredTemplates = [
        { id: 'link-only', name: 'Links Only', description: 'Link-focused page without text blocks' },
        { id: 'mixed-content', name: 'Mixed Content', description: 'Text, links, and images in any order with reorder' },
        { id: 'split-text-image', name: 'Split Text + Image', description: 'Text on left and image on right with optional headers' },
        { id: 'split-links-image', name: 'Split Links + Image', description: 'Links on left and image on right with optional headers' },
        { id: 'split-image-links', name: 'Split Image + Links', description: 'Image on left and links on right with optional headers' },
        { id: 'split-image-image', name: 'Split Image + Image', description: 'Image on left and image on right with optional headers' }
      ];
      ensuredTemplates.forEach((t) => {
        if (!templateMap.has(t.id)) templateMap.set(t.id, t);
      });

      setTemplates(Array.from(templateMap.values()));
      setError('');
    } catch (err) {
      // Keep add flow usable when backend is offline.
      setTemplates(offlineTemplateFallback);
      setError('Backend unavailable. Using offline templates.');
      console.error('❌ Template fetch error, switched to offline templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleTemplateSelect = (templateId) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) setPageTitle(template.name);
  };

  const getPageTypeForTemplate = (templateId) => {
    if (!templateId) return null;
    const templateToPageType = {
      'text-only': 'content',
      'just-images': 'image',
      'mixed-content': 'just-images',
      'split-text-image': 'split-content-image',
      'split-links-image': 'split-content-image',
      'split-image-links': 'split-content-image',
      'split-image-image': 'split-content-image',
      'split-content': 'split-content-image',
      'table': 'table',
      'heading': 'heading',
      'index': 'index',
      'just-links': 'just-links',
      'link-only': 'just-links'
    };
    return templateToPageType[templateId] || templateId;
  };

  const resolveTemplateForCreate = (templateId) => {
    const createTemplateMap = {
      'link-only': 'just-links',
      'mixed-content': 'just-images',
    };
    return createTemplateMap[templateId] || templateId;
  };

  const buildLocalPageFallback = (templateId, title) => {
    const pageType = getPageTypeForTemplate(templateId) || 'content';
    const localId = `page_${Date.now()}`;
    const basePage = {
      id: localId,
      title: title || 'New Page',
      pageType,
      content: [],
      links: [],
      images: [],
      sections: [],
      headings: [],
      table: {
        columns: [],
        rows: []
      }
    };

    if (templateId === 'link-only' || templateId === 'just-links') {
      return { ...basePage, linkOnlyMode: true };
    }

    if (templateId === 'mixed-content') {
      return { ...basePage, mixedContentMode: true };
    }

    if (templateId === 'split-text-image') {
      return { ...basePage, splitTextImageMode: true };
    }

    if (templateId === 'split-links-image') {
      return { ...basePage, splitLinksImageMode: true };
    }

    if (templateId === 'split-image-links') {
      return { ...basePage, splitImageLinksMode: true };
    }

    if (templateId === 'split-image-image') {
      return { ...basePage, splitImageImageMode: true };
    }

    return basePage;
  };

  const getSamplePageForTemplate = (templateId) => {
    const pageType = getPageTypeForTemplate(templateId);
    if (!pageType || !Array.isArray(existingPages)) return null;

    const preferredPreviewPageByTemplate = {
      'text-only': 26,
      'split-text-image': 39,
      'split-links-image': 14,
      'split-image-links': 47,
      'split-image-image': 45,
      'split-content': 28,
      'just-images': 7,
      'mixed-content': 42
    };

    const preferredPageNumber = preferredPreviewPageByTemplate[templateId];
    if (preferredPageNumber) {
      const preferredSample = existingPages.find((page) => Number(page.pageNumber) === preferredPageNumber);
      if (preferredSample) return preferredSample;
    }

    return existingPages.find((page) => page.pageType === pageType) || null;
  };

  const renderTemplatePreview = (templateId) => {
    if (templateId === 'just-links' || templateId === 'link-only') {
      return (
        <div className="template-preview-live-wrap">
          <div className="template-preview-meta">Sample: Dummy preview</div>
          <div className="template-preview-live template-preview-dummy-live">
            <div className="template-preview-dummy-content">
              <div className="template-preview-dummy-title">
                {templateId === 'link-only' ? 'LINK ONLY PAGE' : 'LINKS PAGE'}
              </div>
              <div className="template-preview-dummy-line" />
              <div className="template-preview-dummy-line short" />
              <div className="template-preview-dummy-line" />
            </div>
          </div>
        </div>
      );
    }

    if (templateId === 'images-gallery' || templateId === 'images-carousel') {
      return (
        <div className="template-preview-live-wrap">
          <div className="template-preview-meta">Sample: Dummy preview</div>
          <div className="template-preview-live template-preview-dummy-live">
            <div className="template-preview-dummy-image-grid">
              <div className="template-preview-dummy-image" />
              <div className="template-preview-dummy-image" />
              <div className="template-preview-dummy-image" />
            </div>
          </div>
        </div>
      );
    }

    if (templateId === 'video-gallery') {
      return (
        <div className="template-preview-live-wrap">
          <div className="template-preview-meta">Sample: Dummy preview</div>
          <div className="template-preview-live template-preview-dummy-live">
            <div className="template-preview-dummy-video">
              <div className="template-preview-dummy-video-item" />
              <div className="template-preview-dummy-video-item" />
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
          <div className="template-preview-meta">Slide {sample.pageNumber}</div>
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
        <div className="template-preview-meta">Slide {sample.pageNumber}</div>
        <div className="template-preview-live template-preview-live-page">
          <div className={`template-preview-scale ${templateId === 'heading' ? 'template-preview-scale-heading' : ''}`}>
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
      
      const createTemplateId = resolveTemplateForCreate(selectedTemplate);
      console.log('📝 Creating page with params:', { selectedTemplate, createTemplateId, pageTitle, insertPosition });
      
      // Call API with correct parameters
      const response = await apiService.createPage(
        createTemplateId,
        pageTitle,
        null,
        positionParams
      );

      console.log('✅ API Response:', response);

      if (response.success) {
        console.log('🎉 Page created successfully:', response.page);
        
        // Refresh data and let parent navigate to the resolved, valid page
        await onPageCreate(response.page, { templateId: selectedTemplate });
        
        onClose();
      } else {
        setError(response.message || 'Failed to create page');
        console.error('❌ Creation failed:', response);
      }
    } catch (err) {
      console.warn('⚠️ Backend create failed, falling back to local create:', err?.message || err);
      try {
        const localPage = buildLocalPageFallback(selectedTemplate, pageTitle.trim());
        await onPageCreate(localPage, {
          templateId: selectedTemplate,
          localOnly: true,
          positionParams,
          insertPosition
        });
        onClose();
      } catch (fallbackErr) {
        const errorMsg = fallbackErr.message || err.message || 'Error creating page';
        setError(errorMsg);
        console.error('❌ Local create fallback failed:', fallbackErr);
      }
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
            <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
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
              ❌ Cancel
            </button>
            <button 
              className="btn-create" 
              onClick={handleCreatePage}
              disabled={loading || !selectedTemplate || !pageTitle.trim()}
            >
              {loading ? 'Creating...' : '➕ Create Page'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddPageDialog;

