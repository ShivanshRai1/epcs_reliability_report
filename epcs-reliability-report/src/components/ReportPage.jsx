import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from './Navigation';
import SectionPage from './SectionPage';
import { isLikelyLinkTarget, toOpenableUrl } from '../utils/linkTarget';

export default function ReportPage({ reportData, isEditMode, hasUnsavedChanges, publishStatusLabel, onEditToggle, onUndo, onPublish, onCellChange, onHeadingChange, onImageChange, onIndexChange, onSave, onCancel, onImageClick, onAddPage, onDeletePage, onManagePages, isPublishing, isTestMode, isSeedingTestData, isPublishingTestData, onToggleTestMode, onSeedTestData, onPublishTestData, onRestoreOriginal, isRestoringOriginal }) {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isLiveMode = searchParams.get('live') === '1';

  const visiblePages = reportData.pages;
  const orderedPages = [...visiblePages].sort((a, b) => (Number(a?.pageNumber) || 0) - (Number(b?.pageNumber) || 0));

  const withLiveQuery = (path) => {
    if (!isLiveMode) return path;
    return `${path}${path.includes('?') ? '&' : '?'}live=1`;
  };

  const handleToggleLive = () => {
    if (!isLiveMode && isEditMode && hasUnsavedChanges) {
      window.alert('Please Publish or Cancel your unsaved changes before entering View Live.');
      return;
    }

    if (isLiveMode) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('live');
      setSearchParams(nextParams, { replace: true });
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('live', '1');
    const qs = nextParams.toString();
    const targetPath = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.open(targetPath, '_blank', 'noopener,noreferrer');
  };

  // Get page by id or number from visible pages (or all pages if in live mode)
  const getPage = (idOrNum) => {
    if (!idOrNum) return orderedPages[0];
    if (!isNaN(Number(idOrNum))) {
      const pageNum = Number(idOrNum);
      const idx = pageNum - 1;
      if (idx >= 0 && idx < orderedPages.length) {
        return orderedPages[idx];
      }
      return null;
    }
    return orderedPages.find((p) => String(p?.id) === String(idOrNum));
  };

  const page = getPage(pageId);
  if (!page) return <div className="App"><p>Page not found</p></div>;

  const toPositiveNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  };

  const pageFontFamily = page?.fontFamily || 'inherit';
  const pageTitleSize = toPositiveNumber(page?.titleFontSize, 1.2);
  const pageHeaderSize = toPositiveNumber(page?.headerFontSize, 0.95);
  const pageContentSize = toPositiveNumber(page?.contentFontSize, 0.95);
  const isHeadingPage = page?.pageType === 'heading';
  const pageTextColor = page?.textColor || (isHeadingPage ? '#f6fbff' : '#1f2937');
  const pageContentColor = page?.contentTextColor || (isHeadingPage ? '#e0e6f0' : pageTextColor);
  const pageDisplayStyle = {
    fontFamily: pageFontFamily,
    color: pageTextColor,
    '--page-title-size': `${pageTitleSize}rem`,
    '--page-header-size': `${pageHeaderSize}rem`,
    '--page-content-size': `${pageContentSize}rem`,
    '--page-text-color': pageTextColor,
    '--page-content-color': pageContentColor,
  };

  const currentPageIndex = orderedPages.findIndex((p) => String(p?.id) === String(page?.id));
  const currentDisplayPageNumber = currentPageIndex >= 0 ? currentPageIndex + 1 : 1;

  const indexPages = reportData.pages
    .filter(p => p.pageType === 'index')
    .sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
  const allIndexItems = indexPages.flatMap(p => (Array.isArray(p.content) ? p.content : []));
  const indexPageOrdinal = page?.pageType === 'index'
    ? Math.max(1, indexPages.findIndex((p) => String(p.id) === String(page.id)) + 1)
    : null;

  const totalPages = visiblePages.length;
  const effectiveEditMode = isLiveMode ? false : isEditMode;

  const handleNav = (nav, pageNum) => {
    if (nav === 'home') {
      navigate(withLiveQuery('/'));
    } else if (nav === 'index') {
      navigate(withLiveQuery('/page/1'));
    } else if (nav === 'previous') {
      const prevIndex = currentPageIndex - 1;
      if (prevIndex >= 0) {
        navigate(withLiveQuery(`/page/${prevIndex + 1}`));
      } else {
        navigate(withLiveQuery('/'));
      }
    } else if (nav === 'next') {
      const nextIndex = currentPageIndex + 1;
      if (nextIndex < orderedPages.length) {
        navigate(withLiveQuery(`/page/${nextIndex + 1}`));
      } else {
        navigate(withLiveQuery('/'));
      }
    } else if (nav === 'jump' && pageNum) {
      if (pageNum >= 1 && pageNum <= orderedPages.length) {
        navigate(withLiveQuery(`/page/${pageNum}`));
      }
    }
  };

  const handleLinkClick = (targetId) => {
    if (!targetId) return;

    const normalizedTarget = typeof targetId === 'string' ? targetId.trim() : String(targetId).trim();
    if (!normalizedTarget) return;

    const numericTarget = Number(normalizedTarget);
    if (!Number.isNaN(numericTarget)) {
      if (numericTarget >= 1 && numericTarget <= orderedPages.length) {
        navigate(withLiveQuery(`/page/${numericTarget}`));
        return;
      }
    }

    const targetPage = getPage(normalizedTarget);
    if (targetPage) {
      const targetIndex = orderedPages.findIndex((p) => String(p?.id) === String(targetPage?.id));
      if (targetIndex >= 0) {
        navigate(withLiveQuery(`/page/${targetIndex + 1}`));
      }
      return;
    }

    if (isLikelyLinkTarget(normalizedTarget)) {
      const openableUrl = toOpenableUrl(normalizedTarget);
      if (openableUrl) {
        window.open(openableUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  if (isLiveMode) {
    const isLiveHeadingPage = page?.pageType === 'heading';
    const isLiveTablePage = page?.pageType === 'table';
    const liveContentClassName = 'pdf-viewer-content';

    return (
      <div className="pdf-viewer-shell container-fluid legacy-live-shell">
        <div className={`${liveContentClassName} legacy-live-canvas mx-auto`}>
          <div
            className={`legacy-live-page${isLiveHeadingPage ? ' legacy-live-page-heading' : ''}${isLiveTablePage ? ' legacy-live-page-table' : ''}`}
            style={pageDisplayStyle}
          >
            <SectionPage page={page} routePageId={pageId} onLinkClick={handleLinkClick} isEditMode={false} isLiveMode={true} indexPageOrdinal={indexPageOrdinal} onCellChange={onCellChange} onHeadingChange={onHeadingChange} onImageChange={onImageChange} onIndexChange={onIndexChange} onImageClick={onImageClick} allIndexItems={allIndexItems} allPages={orderedPages} />
          </div>
        </div>
        <Navigation onNavigate={handleNav} isEditMode={false} isLiveMode={isLiveMode} publishStatusLabel={publishStatusLabel} onEditToggle={onEditToggle} onToggleLive={handleToggleLive} onUndo={() => onUndo(page.id)} onPublish={onPublish} onSave={onSave} onCancel={onCancel} onAddPage={() => onAddPage(page.id)} onDeletePage={() => onDeletePage(page)} onManagePages={onManagePages} currentPageId={page.id} currentPageNumber={currentDisplayPageNumber} totalPages={totalPages} isPublishing={isPublishing} isTestMode={isTestMode} isSeedingTestData={isSeedingTestData} isPublishingTestData={isPublishingTestData} onToggleTestMode={onToggleTestMode} onSeedTestData={onSeedTestData} onPublishTestData={onPublishTestData} onRestoreOriginal={onRestoreOriginal} isRestoringOriginal={isRestoringOriginal} />
      </div>
    );
  }

  return (
    <div className="report-shell">
      <div className="report-page">
        <button
          className="report-title-link"
          onClick={() => navigate(withLiveQuery('/'))}
          aria-label="Go to home"
        >
          <h1>EPCS Reliability Report</h1>
        </button>
        <Navigation onNavigate={handleNav} isEditMode={effectiveEditMode} isLiveMode={isLiveMode} publishStatusLabel={publishStatusLabel} onEditToggle={onEditToggle} onToggleLive={handleToggleLive} onUndo={() => onUndo(page.id)} onPublish={onPublish} onSave={onSave} onCancel={onCancel} onAddPage={() => onAddPage(page.id)} onDeletePage={() => onDeletePage(page)} onManagePages={onManagePages} currentPageId={page.id} currentPageNumber={currentDisplayPageNumber} totalPages={totalPages} isPublishing={isPublishing} isTestMode={isTestMode} isSeedingTestData={isSeedingTestData} isPublishingTestData={isPublishingTestData} onToggleTestMode={onToggleTestMode} onSeedTestData={onSeedTestData} onPublishTestData={onPublishTestData} onRestoreOriginal={onRestoreOriginal} isRestoringOriginal={isRestoringOriginal} />
        {!effectiveEditMode && (
          <p className="report-edit-hint" role="note">
            Click Edit Page to add, delete, or modify pages.
          </p>
        )}
        <div className="section-card report-content" style={pageDisplayStyle}>
          <SectionPage page={page} routePageId={pageId} onLinkClick={handleLinkClick} isEditMode={effectiveEditMode} isLiveMode={false} indexPageOrdinal={indexPageOrdinal} onCellChange={onCellChange} onHeadingChange={onHeadingChange} onImageChange={onImageChange} onIndexChange={onIndexChange} onImageClick={onImageClick} allIndexItems={allIndexItems} allPages={orderedPages} />
        </div>
      </div>
    </div>
  );
}
