import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from './Navigation';
import SectionPage from './SectionPage';
import { isLikelyLinkTarget, toOpenableUrl } from '../utils/linkTarget';

export default function ReportPage({ reportData, isEditMode, hasUnsavedChanges, onEditToggle, onUndo, onPublish, onCellChange, onHeadingChange, onImageChange, onIndexChange, onSave, onCancel, onImageClick, onAddPage, onDeletePage, onManagePages, isTestMode, isSeedingTestData, isPublishingTestData, onToggleTestMode, onSeedTestData, onPublishTestData }) {
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
    if (!isLiveMode && hasUnsavedChanges) {
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

  const normalizeForLookup = (value) => String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\(.*?\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const handleLinkClick = (targetId, fallbackTitle = '') => {
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

    const normalizedTargetLookup = normalizeForLookup(normalizedTarget);
    const normalizedTitleLookup = normalizeForLookup(fallbackTitle);

    const looseMatchPage = orderedPages.find((p) => {
      const idLookup = normalizeForLookup(p?.id);
      const titleLookup = normalizeForLookup(p?.title);

      const targetMatches = normalizedTargetLookup && (
        idLookup === normalizedTargetLookup ||
        titleLookup === normalizedTargetLookup ||
        titleLookup.includes(normalizedTargetLookup) ||
        normalizedTargetLookup.includes(titleLookup)
      );

      const titleMatches = normalizedTitleLookup && (
        titleLookup === normalizedTitleLookup ||
        titleLookup.includes(normalizedTitleLookup) ||
        normalizedTitleLookup.includes(titleLookup)
      );

      return targetMatches || titleMatches;
    });

    if (looseMatchPage) {
      const looseMatchIndex = orderedPages.findIndex((p) => String(p?.id) === String(looseMatchPage?.id));
      if (looseMatchIndex >= 0) {
        navigate(withLiveQuery(`/page/${looseMatchIndex + 1}`));
        return;
      }
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
          <div className={`legacy-live-page${isLiveHeadingPage ? ' legacy-live-page-heading' : ''}${isLiveTablePage ? ' legacy-live-page-table' : ''}`} style={{ color: page.textColor || '#222222' }}>
            <SectionPage page={page} routePageId={pageId} onLinkClick={handleLinkClick} isEditMode={false} isLiveMode={true} indexPageOrdinal={indexPageOrdinal} onCellChange={onCellChange} onHeadingChange={onHeadingChange} onImageChange={onImageChange} onIndexChange={onIndexChange} onImageClick={onImageClick} allIndexItems={allIndexItems} allPages={orderedPages} />
          </div>
        </div>
        <Navigation onNavigate={handleNav} isEditMode={false} isLiveMode={isLiveMode} onEditToggle={onEditToggle} onToggleLive={handleToggleLive} onUndo={() => onUndo(page.id)} onPublish={onPublish} onSave={onSave} onCancel={onCancel} onAddPage={() => onAddPage(page.id)} onDeletePage={() => onDeletePage(page)} onManagePages={onManagePages} currentPageId={page.id} currentPageNumber={currentDisplayPageNumber} totalPages={totalPages} isTestMode={isTestMode} isSeedingTestData={isSeedingTestData} isPublishingTestData={isPublishingTestData} onToggleTestMode={onToggleTestMode} onSeedTestData={onSeedTestData} onPublishTestData={onPublishTestData} />
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
        <Navigation onNavigate={handleNav} isEditMode={effectiveEditMode} isLiveMode={isLiveMode} onEditToggle={onEditToggle} onToggleLive={handleToggleLive} onUndo={() => onUndo(page.id)} onPublish={onPublish} onSave={onSave} onCancel={onCancel} onAddPage={() => onAddPage(page.id)} onDeletePage={() => onDeletePage(page)} onManagePages={onManagePages} currentPageId={page.id} currentPageNumber={currentDisplayPageNumber} totalPages={totalPages} isTestMode={isTestMode} isSeedingTestData={isSeedingTestData} isPublishingTestData={isPublishingTestData} onToggleTestMode={onToggleTestMode} onSeedTestData={onSeedTestData} onPublishTestData={onPublishTestData} />
        <div className="section-card report-content">
          <SectionPage page={page} routePageId={pageId} onLinkClick={handleLinkClick} isEditMode={effectiveEditMode} isLiveMode={false} indexPageOrdinal={indexPageOrdinal} onCellChange={onCellChange} onHeadingChange={onHeadingChange} onImageChange={onImageChange} onIndexChange={onIndexChange} onImageClick={onImageClick} allIndexItems={allIndexItems} allPages={orderedPages} />
        </div>
      </div>
    </div>
  );
}
