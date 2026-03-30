import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import SectionPage from './SectionPage';
import { lockBodyScroll, unlockBodyScroll } from '../utils/scrollLock';
import './AddPageDialog.css';

const AddPageDialog = ({ isOpen, onClose, onPageCreate, currentPageId = null, existingPages = [] }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [insertPosition, setInsertPosition] = useState('after'); // 'before', 'after' or 'at-end'
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  const offlineTemplateFallback = [
    { id: 'text-only', name: 'Text Only', description: 'Simple text content page' },
    { id: 'heading', name: 'Heading', description: 'Title and heading-focused page' },
    { id: 'table', name: 'Table', description: 'Structured table page' },
    { id: 'just-images', name: 'Images', description: 'Image-focused page' },
    { id: 'mixed-content', name: 'Mixed Content', description: 'Text, links, and images in any order with reorder' },
    { id: 'split-text-image', name: 'Split Text + Image', description: 'Text on left and image on right with optional headers' },
    { id: 'split-links-image', name: 'Split Links + Image', description: 'Links on left and image on right with optional headers' },
    { id: 'split-image-links', name: 'Split Image + Links', description: 'Image on left and links on right with optional headers' },
    { id: 'split-image-image', name: 'Split Image + Image', description: 'Image on left and image on right with optional headers' },
    { id: 'split-content', name: 'Split Content', description: 'Flexible left/right content areas with optional headers' }
  ];

  // Fetch available templates
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setSelectedTemplate(null);
      setError('');
      setShowAllTemplates(false);
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
          id !== 'just-links' &&
          id !== 'link-only' &&
          !name.includes('links + text') &&
          !name.includes('link only') &&
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

      const ensuredTemplates = [
        { id: 'mixed-content', name: 'Mixed Content', description: 'Text, links, and images in any order with reorder' },
        { id: 'split-text-image', name: 'Split Text + Image', description: 'Text on left and image on right with optional headers' },
        { id: 'split-links-image', name: 'Split Links + Image', description: 'Links on left and image on right with optional headers' },
        { id: 'split-image-links', name: 'Split Image + Links', description: 'Image on left and links on right with optional headers' },
        { id: 'split-image-image', name: 'Split Image + Image', description: 'Image on left and image on right with optional headers' },
        { id: 'split-content', name: 'Split Content', description: 'Flexible left/right content areas with optional headers' }
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

  const handleTemplateSelect = async (templateId) => {
    setSelectedTemplate(templateId);
    await createPageWithConfig(templateId);
  };

  const primaryTemplateOrder = ['split-content', 'just-images', 'text-only', 'heading'];
  const primaryTemplates = primaryTemplateOrder
    .map((id) => templates.find((template) => template.id === id))
    .filter(Boolean);
  const hiddenTemplates = templates.filter((template) => !primaryTemplateOrder.includes(template.id));
  const displayedTemplates = showAllTemplates ? [...primaryTemplates, ...hiddenTemplates] : primaryTemplates;

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
      'text-only': 28,
      'heading': 4,
      'index': 1,
      'table': 5,
      'just-images': 9,
      'split-text-image': 41,
      'split-links-image': 16,
      'split-image-links': 49,
      'split-image-image': 47,
      'split-content': 30,
      'mixed-content': 44
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

  const createPageWithConfig = async (templateIdOverride) => {
    const templateId = templateIdOverride || selectedTemplate;
    const template = templates.find((t) => t.id === templateId);
    const title = (template?.name || 'New Page').trim();

    if (!templateId) {
      setError('Please select a template');
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
      
      const createTemplateId = resolveTemplateForCreate(templateId);
      console.log('📝 Creating page with params:', { templateId, createTemplateId, title, insertPosition });
      
      // Call API with correct parameters
      const response = await apiService.createPage(
        createTemplateId,
        title,
        null,
        positionParams
      );

      console.log('✅ API Response:', response);

      if (response.success) {
        console.log('🎉 Page created successfully:', response.page);
        
        // Refresh data and let parent navigate to the resolved, valid page
        await onPageCreate(response.page, { templateId });
        
        onClose();
      } else {
        setError(response.message || 'Failed to create page');
        console.error('❌ Creation failed:', response);
      }
    } catch (err) {
      console.warn('⚠️ Backend create failed, falling back to local create:', err?.message || err);
      try {
        const localPage = buildLocalPageFallback(templateId, title.trim());
        await onPageCreate(localPage, {
          templateId,
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
                      disabled={loading}
                    />
                    Before current page
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="after"
                      checked={insertPosition === 'after'}
                      onChange={(e) => setInsertPosition(e.target.value)}
                      disabled={loading}
                    />
                    After current page
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      value="at-end"
                      checked={insertPosition === 'at-end'}
                      onChange={(e) => setInsertPosition(e.target.value)}
                      disabled={loading}
                    />
                    At end of document
                  </label>
                </div>
              </div>
            )}

            {/* Template Selection */}
            <div className="form-group">
              <label>Select Template:</label>
              {templatesLoading && <div className="loading-message">Loading templates...</div>}
              {!templatesLoading && templates.length === 0 && <div className="error-message">No templates available</div>}
              {templates.length > 0 && (
                <>
                  <div className="templates-grid">
                    {displayedTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`template-card ${selectedTemplate === template.id ? 'selected' : ''} ${loading ? 'template-card-disabled' : ''}`}
                        onClick={() => !loading && handleTemplateSelect(template.id)}
                      >
                        <div className="template-preview">
                          {renderTemplatePreview(template.id)}
                        </div>
                        <div className="template-name">{template.name}</div>
                        <div className="template-description">{template.description}</div>
                      </div>
                    ))}
                  </div>
                  {!showAllTemplates && hiddenTemplates.length > 0 && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setShowAllTemplates(true)}
                        disabled={loading}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          border: '1px solid #c2cad8',
                          background: '#f4f7fb',
                          color: '#1f2937',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                        }}
                      >
                        View more
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Loading / Error message */}
            {loading && <div className="loading-message" style={{ textAlign: 'center', padding: '0.5rem' }}>Creating page...</div>}
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddPageDialog;

