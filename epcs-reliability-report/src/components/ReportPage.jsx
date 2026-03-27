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

  // Filter pages: exclude page 5 from normal mode
  const visiblePages = isLiveMode 
    ? reportData.pages 
    : reportData.pages.filter(p => p.pageNumber !== 5);

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
    if (!idOrNum) return visiblePages[0];
    if (!isNaN(Number(idOrNum))) {
      const pageNum = Number(idOrNum);
      // In normal mode, skip page 5
      if (!isLiveMode && pageNum === 5) {
        return visiblePages.find(p => p.pageNumber === 6) || visiblePages[0];
      }
      return reportData.pages.find(p => p.pageNumber === pageNum);
    }
    return reportData.pages.find(p => p.id === idOrNum);
  };

  const page = getPage(pageId);
  if (!page) return <div className="App"><p>Page not found</p></div>;

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
      let prevPageNum = page.pageNumber - 1;
      // Skip page 5 in normal mode when going backward
      if (!isLiveMode && prevPageNum === 5) {
        prevPageNum = 4;
      }
      if (prevPageNum >= 1) {
        navigate(withLiveQuery(`/page/${prevPageNum}`));
      } else {
        navigate(withLiveQuery('/'));
      }
    } else if (nav === 'next') {
      let nextPageNum = page.pageNumber + 1;
      // Skip page 5 in normal mode when going forward
      if (!isLiveMode && nextPageNum === 5) {
        nextPageNum = 6;
      }
      if (nextPageNum <= reportData.pages.length) {
        navigate(withLiveQuery(`/page/${nextPageNum}`));
      } else {
        navigate(withLiveQuery('/'));
      }
    } else if (nav === 'jump' && pageNum) {
      // Skip page 5 in normal mode
      let targetPageNum = pageNum;
      if (!isLiveMode && targetPageNum === 5) {
        targetPageNum = 6;
      }
      navigate(withLiveQuery(`/page/${targetPageNum}`));
    }
  };

  const handleLinkClick = (targetId) => {
    if (!targetId) return;

    const normalizedTarget = typeof targetId === 'string' ? targetId.trim() : String(targetId).trim();
    if (!normalizedTarget) return;

    const numericTarget = Number(normalizedTarget);
    if (!Number.isNaN(numericTarget)) {
      const targetPageByNumber = reportData.pages.find(p => p.pageNumber === numericTarget);
      if (targetPageByNumber) {
        navigate(withLiveQuery(`/page/${targetPageByNumber.pageNumber}`));
        return;
      }
    }

    const targetPage = getPage(normalizedTarget);
    if (targetPage) {
      navigate(withLiveQuery(`/page/${targetPage.pageNumber}`));
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
    const isLivePage5 = Number(page?.pageNumber) === 5 || Number(pageId) === 5;
    const isLiveHeadingPage = page?.pageType === 'heading';
    const liveContentClassName = isLivePage5
      ? 'pdf-viewer-content pdf-viewer-content-page-5'
      : 'pdf-viewer-content';

    return (
      <div className="pdf-viewer-shell container-fluid legacy-live-shell">
        <div className={`${liveContentClassName} legacy-live-canvas mx-auto`}>
          <div className={`legacy-live-page${isLiveHeadingPage ? ' legacy-live-page-heading' : ''}`} style={{ color: page.textColor || '#222222' }}>
            <SectionPage page={page} onLinkClick={handleLinkClick} isEditMode={false} isLiveMode={true} indexPageOrdinal={indexPageOrdinal} onCellChange={onCellChange} onHeadingChange={onHeadingChange} onImageChange={onImageChange} onIndexChange={onIndexChange} onImageClick={onImageClick} allIndexItems={allIndexItems} />
          </div>
        </div>
        <Navigation onNavigate={handleNav} isEditMode={false} isLiveMode={isLiveMode} onEditToggle={onEditToggle} onToggleLive={handleToggleLive} onUndo={() => onUndo(page.id)} onPublish={onPublish} onSave={onSave} onCancel={onCancel} onAddPage={() => onAddPage(page.id)} onDeletePage={() => onDeletePage(page)} onManagePages={onManagePages} currentPageId={page.id} currentPageNumber={page.pageNumber} totalPages={totalPages} isTestMode={isTestMode} isSeedingTestData={isSeedingTestData} isPublishingTestData={isPublishingTestData} onToggleTestMode={onToggleTestMode} onSeedTestData={onSeedTestData} onPublishTestData={onPublishTestData} />
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
        <Navigation onNavigate={handleNav} isEditMode={effectiveEditMode} isLiveMode={isLiveMode} onEditToggle={onEditToggle} onToggleLive={handleToggleLive} onUndo={() => onUndo(page.id)} onPublish={onPublish} onSave={onSave} onCancel={onCancel} onAddPage={() => onAddPage(page.id)} onDeletePage={() => onDeletePage(page)} onManagePages={onManagePages} currentPageId={page.id} currentPageNumber={page.pageNumber} totalPages={totalPages} isTestMode={isTestMode} isSeedingTestData={isSeedingTestData} isPublishingTestData={isPublishingTestData} onToggleTestMode={onToggleTestMode} onSeedTestData={onSeedTestData} onPublishTestData={onPublishTestData} />
        <div className="section-card report-content">
          <SectionPage page={page} onLinkClick={handleLinkClick} isEditMode={effectiveEditMode} isLiveMode={false} indexPageOrdinal={indexPageOrdinal} onCellChange={onCellChange} onHeadingChange={onHeadingChange} onImageChange={onImageChange} onIndexChange={onIndexChange} onImageClick={onImageClick} allIndexItems={allIndexItems} />
        </div>
      </div>
    </div>
  );
}
