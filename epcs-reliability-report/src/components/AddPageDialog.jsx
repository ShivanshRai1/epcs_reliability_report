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
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardTitle, setWizardTitle] = useState('');
  const [wizardSubtitle, setWizardSubtitle] = useState('');
  const [wizardLeftHeader, setWizardLeftHeader] = useState('');
  const [wizardRightHeader, setWizardRightHeader] = useState('');

  const offlineTemplateFallback = [
    { id: 'text-only', name: 'Text Only', description: 'Simple text content page' },
    { id: 'heading', name: 'Heading', description: 'Title and heading-focused page' },
    { id: 'table', name: 'Table', description: 'Structured table page' },
    { id: 'just-images', name: 'Images', description: 'Image-focused page' },
    { id: 'managed-content', name: 'MS WORD like editor', description: 'Rich text editor with full formatting capabilities' },
    { id: 'ppt-import', name: 'Image / PDF Import', description: 'Upload an image or PDF to display as a full page' },
    { id: 'grapesjs-editor', name: 'GrapesJS Page Builder', description: 'Visual drag-and-drop HTML page builder (experimental)' },
    { id: 'split-text-image', name: 'Split Text + Image', description: 'Text on left and image on right with optional headers' },
    { id: 'split-links-image', name: 'Split Links + Image', description: 'Links on left and image on right with optional headers' },
    { id: 'split-image-links', name: 'Split Image + Links', description: 'Image on left and links on right with optional headers' },
    { id: 'split-image-image', name: 'Split Image + Image', description: 'Image on left and image on right with optional headers' },
    { id: 'split-content', name: 'Split Content', description: 'Flexible left/right content areas with optional headers' },
      { id: 'table-qualified', name: 'Qualified Table', description: 'DLA qualified multi-color table page' }
  ];

  // Fetch available templates
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      setSelectedTemplate(null);
      setError('');
      setShowAllTemplates(false);
      setWizardStep(1);
      setWizardTitle('');
      setWizardSubtitle('');
      setWizardLeftHeader('');
      setWizardRightHeader('');
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
          id !== 'mixed-content' &&
          name !== 'mixed content' &&
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
        { id: 'managed-content', name: 'MS WORD like editor', description: 'Rich text editor with full formatting capabilities' },
        { id: 'ppt-import', name: 'Image / PDF Import', description: 'Upload an image or PDF to display as a full page' },
        { id: 'grapesjs-editor', name: 'GrapesJS Page Builder', description: 'Visual drag-and-drop HTML page builder (experimental)' },
        { id: 'split-text-image', name: 'Split Text + Image', description: 'Text on left and image on right with optional headers' },
        { id: 'split-links-image', name: 'Split Links + Image', description: 'Links on left and image on right with optional headers' },
        { id: 'split-image-links', name: 'Split Image + Links', description: 'Image on left and links on right with optional headers' },
        { id: 'split-image-image', name: 'Split Image + Image', description: 'Image on left and image on right with optional headers' },
        { id: 'split-content', name: 'Split Content', description: 'Flexible left/right content areas with optional headers' },
        { id: 'table-qualified', name: 'Qualified Table', description: 'DLA qualified multi-color table page' }
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
    const template = templates.find((t) => t.id === templateId);
    setWizardTitle(template?.name || '');
    setWizardSubtitle('');
    setWizardLeftHeader('');
    setWizardRightHeader('');
    setError('');
    setWizardStep(2);
  };

  const handleWizardBack = () => {
    if (wizardStep === 2) { setWizardStep(1); setSelectedTemplate(null); }
    else if (wizardStep === 3) { setWizardStep(2); }
  };

  const handleWizardCreate = () => {
    createPageWithConfig(selectedTemplate, {
      title: wizardTitle.trim() || null,
      subtitle: wizardSubtitle.trim() || null,
      leftHeader: wizardLeftHeader.trim() || null,
      rightHeader: wizardRightHeader.trim() || null,
    });
  };

  const EDITOR_TEMPLATE_IDS = ['managed-content', 'ppt-import', 'grapesjs-editor'];

  const primaryTemplateOrder = ['split-content', 'just-images', 'text-only', 'heading'];
  const primaryTemplates = primaryTemplateOrder
    .map((id) => templates.find((template) => template.id === id))
    .filter(Boolean);
  const hiddenTemplates = templates.filter((template) => !primaryTemplateOrder.includes(template.id));
  const displayedTemplates = showAllTemplates ? [...primaryTemplates, ...hiddenTemplates] : primaryTemplates;

  const displayedTemplateGroup = displayedTemplates.filter((t) => !EDITOR_TEMPLATE_IDS.includes(t.id));
  const displayedEditorGroup = displayedTemplates.filter((t) => EDITOR_TEMPLATE_IDS.includes(t.id));
  const showGroupLabels = displayedTemplateGroup.length > 0 && displayedEditorGroup.length > 0;

  const getPageTypeForTemplate = (templateId) => {
    if (!templateId) return null;
    const templateToPageType = {
      'text-only': 'content',
      'just-images': 'image',
      'mixed-content': 'just-images',
      'managed-content': 'managed-content',
      'ppt-import': 'managed-content',
      'grapesjs-editor': 'managed-content',
      'split-text-image': 'split-content-image',
      'split-links-image': 'split-content-image',
      'split-image-links': 'split-content-image',
      'split-image-image': 'split-content-image',
      'split-content': 'split-content-image',
      'table': 'table',
      'heading': 'heading',
      'index': 'index',
      'table-qualified': 'table'
    };
    return templateToPageType[templateId] || templateId;
  };

  const resolveTemplateForCreate = (templateId) => {
    const createTemplateMap = {
      'table-qualified': 'table'
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
      textColor: '#1f2937',
      contentTextColor: '#1f2937',
      fontFamily: 'inherit',
      titleFontSize: 1.2,
      headerFontSize: 0.95,
      contentFontSize: 0.95,
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

    const normalizeTemplateId = (page) => String(page?.pageTemplate || page?.page_template || page?.templateId || '').toLowerCase();
    const hasLinks = (page) => Array.isArray(page?.content) && page.content.some((item) => item && item.type === 'link');
    const linkCount = (page) => Array.isArray(page?.content) ? page.content.filter((item) => item && item.type === 'link').length : 0;
    const hasLeftText = (page) => Boolean(String(page?.leftContent || '').trim());
    const hasRightImage = (page) => Boolean(String(page?.imageUrl || '').trim());
    const hasLeftImage = (page) => Boolean(String(page?.leftImageUrl || '').trim());
    const isReversed = (page) => String(page?.layout || '').toLowerCase() === 'reversed';
    const hasSpecificSplitMode = (page) => Boolean(
      page?.splitTextImageMode || page?.splitLinksImageMode || page?.splitImageLinksMode || page?.splitImageImageMode
    );

    const matchesTemplate = (page) => {
      const normalizedTemplate = normalizeTemplateId(page);
      const normalizedPageType = String(page?.pageType || '').toLowerCase();
      
      const isMatch = (() => {
        switch (templateId) {
          case 'heading':
            return normalizedPageType === 'heading';
          case 'index':
            return normalizedPageType === 'index';
          case 'table':
            return normalizedPageType === 'table';
            case 'table-qualified': {
  const rows = page?.table?.rows || page?.table?.data || [];
  const hasQualifiedPalette = Array.isArray(rows) && rows.some((row) => {
    const raw = String(row?.rowClass || row?.rowColor || '').toLowerCase();
    const normalized = raw.startsWith('row-') ? raw : `row-${raw}`;
    return ['row-light-blue', 'row-green', 'row-cyan', 'row-beige', 'row-pink'].includes(normalized);
  });

  return (
    normalizedPageType === 'table' &&
    (
      normalizedTemplate === 'table-qualified' ||
      String(page?.title || '').toUpperCase().includes('DLA QUALIFIED PART LIST') ||
      hasQualifiedPalette
    )
  );
}
          case 'text-only':
            return normalizedPageType === 'content' && !page?.mixedContentMode;
          case 'just-images':
            return normalizedPageType === 'image' && !page?.mixedContentMode && normalizedTemplate !== 'mixed-content';
          case 'mixed-content':
            return Boolean(page?.mixedContentMode) || normalizedTemplate === 'mixed-content';
          case 'split-text-image':
            return (
              Boolean(page?.splitTextImageMode) ||
              normalizedTemplate === 'split-text-image' ||
              (normalizedPageType === 'split-content-image' && hasLeftText(page) && hasRightImage(page) && !hasLinks(page))
            );
          case 'split-links-image':
            return (
              Boolean(page?.splitLinksImageMode) ||
              normalizedTemplate === 'split-links-image' ||
              (normalizedPageType === 'split-content-image' && hasLinks(page) && hasRightImage(page) && !isReversed(page))
            );
          case 'split-image-links':
            return (
              Boolean(page?.splitImageLinksMode) ||
              normalizedTemplate === 'split-image-links' ||
              (normalizedPageType === 'split-content-image' && hasLinks(page) && (isReversed(page) || hasLeftImage(page)))
            );
          case 'split-image-image':
            return (
              Boolean(page?.splitImageImageMode) ||
              normalizedTemplate === 'split-image-image' ||
              (normalizedPageType === 'split-content-image' && hasLeftImage(page) && hasRightImage(page))
            );
          case 'split-content':
            return (
              normalizedPageType === 'split-content-image' &&
              !hasSpecificSplitMode(page) &&
              normalizedTemplate !== 'split-text-image' &&
              normalizedTemplate !== 'split-links-image' &&
              normalizedTemplate !== 'split-image-links' &&
              normalizedTemplate !== 'split-image-image' &&
              !isReversed(page)
            );
          default:
            return false;
        }
      })();
      
      return isMatch;
    };

    const bestMatch = [...existingPages]
      .filter(matchesTemplate)
      .sort((a, b) => {
        if (templateId === 'split-links-image') {
          return linkCount(b) - linkCount(a);
        }
        if (templateId === 'split-content') {
          return linkCount(a) - linkCount(b);
        }
        return (Number(a?.pageNumber) || 0) - (Number(b?.pageNumber) || 0);
      })[0] || null;

    if (bestMatch) return bestMatch;

    return existingPages.find((page) => String(page?.pageType || '').toLowerCase() === String(pageType || '').toLowerCase()) || null;
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


    const sample = getSamplePageForTemplate(templateId);

    if (!sample) {
      return (
        <div className="template-preview-empty">No sample page available yet</div>
      );
    }

    return (
      <div className="template-preview-live-wrap">
        <div className="template-preview-meta">Sample: {sample.title || sample.id || 'Untitled page'}</div>
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

  const createPageWithConfig = async (templateIdOverride, wizardData = null) => {
    const templateId = templateIdOverride || selectedTemplate;
    const template = templates.find((t) => t.id === templateId);
    const title = (wizardData?.title || template?.name || 'New Page').trim();

    if (!templateId) {
      setError('Please select a template');
      return;
    }

    const isTextOnly = templateId === 'text-only';
    const isEditorTemplate = templateId === 'managed-content' || templateId === 'ppt-import' || templateId === 'grapesjs-editor';
    const cloneSource = (isTextOnly || isEditorTemplate) ? null : getSamplePageForTemplate(templateId);
    const cloneSourcePageId = cloneSource?.id || null;
    const cloneSourcePageData = cloneSource ? JSON.parse(JSON.stringify(cloneSource)) : null;

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
      
      // NEW: Create draft page locally (skip backend)
      const draftPage = {
        id: `page_${Date.now()}`,
        title: isTextOnly ? 'text page' : title,
        pageType: getPageTypeForTemplate(templateId),
        pageTemplate: createTemplateId,
        _isDraftNew: true,
        _draftTemplateId: createTemplateId,
        ...(isTextOnly && {
          content: 'Enter your text content here. Edit and enter your own content.'
        }),
        ...(wizardData?.subtitle && { subtitle: wizardData.subtitle }),
        ...(wizardData?.leftHeader && { leftHeader: wizardData.leftHeader }),
        ...(wizardData?.rightHeader && { rightHeader: wizardData.rightHeader }),
      };

      console.log('✅ Page added to draft (will sync on Publish):', draftPage);

      // Pass draft page to parent
      await onPageCreate(draftPage, {
        templateId,
        cloneSourcePageId,
        cloneSourcePageData,
        positionParams,
        insertPosition,
        isDraftOnly: true
      })
      onClose();
    } catch (err) {
      console.warn('⚠️ Backend create failed, falling back to local create:', err?.message || err);
      try {
        const localPage = buildLocalPageFallback(templateId, title.trim());
        await onPageCreate(localPage, {
          templateId,
          cloneSourcePageId,
          cloneSourcePageData,
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
            <h2>
              {wizardStep === 1 && 'Add New Page'}
              {wizardStep === 2 && 'Set Page Details'}
              {wizardStep === 3 && 'Preview & Confirm'}
            </h2>
            <button className="close-btn" onClick={onClose} aria-label="Close">✕</button>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: '0', borderBottom: '1px solid #e5e7eb' }}>
            {[['1', 'Choose Layout'], ['2', 'Fill Details'], ['3', 'Confirm']].map(([num, label], i) => {
              const step = i + 1;
              const active = wizardStep === step;
              const done = wizardStep > step;
              return (
                <div key={num} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', fontSize: '0.78rem', fontWeight: active ? 700 : 400, color: active ? '#0052a3' : done ? '#16a34a' : '#9ca3af', borderBottom: active ? '2px solid #0052a3' : done ? '2px solid #16a34a' : '2px solid transparent', background: active ? '#f0f6ff' : 'transparent', transition: 'all 0.15s' }}>
                  <span style={{ display: 'inline-block', width: '18px', height: '18px', borderRadius: '50%', background: active ? '#0052a3' : done ? '#16a34a' : '#e5e7eb', color: active || done ? '#fff' : '#6b7280', fontSize: '0.7rem', lineHeight: '18px', marginRight: '4px', verticalAlign: 'middle' }}>{done ? '✓' : num}</span>
                  {label}
                </div>
              );
            })}
          </div>

          <div className="dialog-body">

            {/* ── STEP 1: Choose Layout ── */}
            {wizardStep === 1 && (
              <>
                {/* Insert Position */}
                {currentPageId && (
                  <div className="form-group">
                    <label>Insert Position:</label>
                    <div className="position-options">
                      <label className="radio-label">
                        <input type="radio" value="before" checked={insertPosition === 'before'} onChange={(e) => setInsertPosition(e.target.value)} disabled={loading} />
                        Before current page
                      </label>
                      <label className="radio-label">
                        <input type="radio" value="after" checked={insertPosition === 'after'} onChange={(e) => setInsertPosition(e.target.value)} disabled={loading} />
                        After current page
                      </label>
                      <label className="radio-label">
                        <input type="radio" value="at-end" checked={insertPosition === 'at-end'} onChange={(e) => setInsertPosition(e.target.value)} disabled={loading} />
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
                      {showGroupLabels && <div className="template-group-label">Pre Existing Slides</div>}
                      <div className="templates-grid">
                        {displayedTemplateGroup.map((template) => (
                          <div
                            key={template.id}
                            className={`template-card ${selectedTemplate === template.id ? 'selected' : ''} ${loading ? 'template-card-disabled' : ''}`}
                            onClick={() => !loading && handleTemplateSelect(template.id)}
                          >
                            <div className="template-preview">{renderTemplatePreview(template.id)}</div>
                            <div className="template-name">{template.name}</div>
                            <div className="template-description">{template.description}</div>
                          </div>
                        ))}
                      </div>
                      {displayedEditorGroup.length > 0 && (
                        <>
                          {showGroupLabels && <div className="template-group-label">Editors</div>}
                          <div className="templates-grid">
                            {displayedEditorGroup.map((template) => (
                              <div
                                key={template.id}
                                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''} ${loading ? 'template-card-disabled' : ''}`}
                                onClick={() => !loading && handleTemplateSelect(template.id)}
                              >
                                <div className="template-preview">{renderTemplatePreview(template.id)}</div>
                                <div className="template-name">{template.name}</div>
                                <div className="template-description">{template.description}</div>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                      {!showAllTemplates && hiddenTemplates.length > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
                          <button
                            type="button"
                            onClick={() => setShowAllTemplates(true)}
                            disabled={loading}
                            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #c2cad8', background: '#f4f7fb', color: '#1f2937', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                          >
                            View more
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── STEP 2: Fill Details ── */}
            {wizardStep === 2 && (() => {
              const isSplit = ['split-text-image','split-links-image','split-image-links','split-image-image','split-content'].includes(selectedTemplate);
              const isHeading = selectedTemplate === 'heading';
              const selTemplate = templates.find(t => t.id === selectedTemplate);
              return (
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '4px' }}>
                    Template: <strong>{selTemplate?.name || selectedTemplate}</strong>
                  </div>

                  {/* Title */}
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '5px', color: '#1f2937' }}>Page Title <span style={{ color: '#dc2626' }}>*</span></label>
                    <input
                      type="text"
                      value={wizardTitle}
                      onChange={(e) => setWizardTitle(e.target.value)}
                      placeholder="Enter a title for this page"
                      autoFocus
                      style={{ width: '100%', padding: '9px 11px', border: '1px solid #b9c7da', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Subtitle — heading only */}
                  {isHeading && (
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '5px', color: '#1f2937' }}>Subtitle <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                      <input
                        type="text"
                        value={wizardSubtitle}
                        onChange={(e) => setWizardSubtitle(e.target.value)}
                        placeholder="Enter a subtitle"
                        style={{ width: '100%', padding: '9px 11px', border: '1px solid #b9c7da', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  )}

                  {/* Column headers — split templates */}
                  {isSplit && (
                    <>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '5px', color: '#1f2937' }}>Left Column Header <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                        <input
                          type="text"
                          value={wizardLeftHeader}
                          onChange={(e) => setWizardLeftHeader(e.target.value)}
                          placeholder="e.g. Description"
                          style={{ width: '100%', padding: '9px 11px', border: '1px solid #b9c7da', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '5px', color: '#1f2937' }}>Right Column Header <span style={{ color: '#9ca3af', fontWeight: 400 }}>(optional)</span></label>
                        <input
                          type="text"
                          value={wizardRightHeader}
                          onChange={(e) => setWizardRightHeader(e.target.value)}
                          placeholder="e.g. Diagram"
                          style={{ width: '100%', padding: '9px 11px', border: '1px solid #b9c7da', borderRadius: '6px', fontSize: '0.95rem', boxSizing: 'border-box' }}
                        />
                      </div>
                    </>
                  )}

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                    <button type="button" onClick={handleWizardBack} disabled={loading} style={{ padding: '9px 20px', borderRadius: '6px', border: '1px solid #c2cad8', background: '#f4f7fb', color: '#1f2937', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
                    <button type="button" onClick={() => { if (!wizardTitle.trim()) { setError('Please enter a page title.'); return; } setError(''); setWizardStep(3); }} disabled={loading} style={{ padding: '9px 20px', borderRadius: '6px', border: 'none', background: '#0052a3', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Next: Preview →</button>
                  </div>
                </div>
              );
            })()}

            {/* ── STEP 3: Preview & Confirm ── */}
            {wizardStep === 3 && (() => {
              const selTemplate = templates.find(t => t.id === selectedTemplate);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                    Template: <strong>{selTemplate?.name || selectedTemplate}</strong> &nbsp;·&nbsp; Title: <strong>{wizardTitle}</strong>
                    {wizardSubtitle && <> &nbsp;·&nbsp; Subtitle: <strong>{wizardSubtitle}</strong></>}
                    {wizardLeftHeader && <> &nbsp;·&nbsp; Left: <strong>{wizardLeftHeader}</strong></>}
                    {wizardRightHeader && <> &nbsp;·&nbsp; Right: <strong>{wizardRightHeader}</strong></>}
                  </div>
                  <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px 12px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>TEMPLATE PREVIEW</div>
                    <div className="template-preview" style={{ height: '220px', overflow: 'hidden' }}>
                      {renderTemplatePreview(selectedTemplate)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={handleWizardBack} disabled={loading} style={{ padding: '9px 20px', borderRadius: '6px', border: '1px solid #c2cad8', background: '#f4f7fb', color: '#1f2937', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
                    <button type="button" onClick={handleWizardCreate} disabled={loading} style={{ padding: '9px 24px', borderRadius: '6px', border: 'none', background: '#16a34a', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.95rem' }}>
                      {loading ? 'Creating...' : '✓ Create Page'}
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Loading / Error */}
            {loading && wizardStep !== 3 && <div className="loading-message" style={{ textAlign: 'center', padding: '0.5rem' }}>Creating page...</div>}
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddPageDialog;

