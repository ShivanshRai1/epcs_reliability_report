import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import Navigation from './Navigation';
import SectionPage from './SectionPage';
import { isLikelyLinkTarget, toOpenableUrl } from '../utils/linkTarget';

export default function ReportPage({ reportData, isEditMode, hasUnsavedChanges, onEditToggle, onUndo, onPublish, onCellChange, onHeadingChange, onImageChange, onIndexChange, onSave, onCancel, onImageClick, onAddPage, onDeletePage, onManagePages }) {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isLiveMode = searchParams.get('live') === '1';

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

  // Get page by id or number
  const getPage = (idOrNum) => {
    if (!idOrNum) return reportData.pages[0];
    if (!isNaN(Number(idOrNum))) {
      return reportData.pages.find(p => p.pageNumber === Number(idOrNum));
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

  const totalPages = reportData.pages.length;
  const effectiveEditMode = isLiveMode ? false : isEditMode;

  const handleNav = (nav, pageNum) => {
    if (nav === 'home') {
      navigate(withLiveQuery('/'));
    } else if (nav === 'index') {
      navigate(withLiveQuery('/page/1'));
    } else if (nav === 'previous') {
      if (page.pageNumber > 1) {
        navigate(withLiveQuery(`/page/${page.pageNumber - 1}`));
      } else {
        navigate(withLiveQuery('/'));
      }
    } else if (nav === 'next') {
      if (page.pageNumber < totalPages) {
        navigate(withLiveQuery(`/page/${page.pageNumber + 1}`));
      } else {
        navigate(withLiveQuery('/'));
      }
    } else if (nav === 'jump' && pageNum) {
      navigate(withLiveQuery(`/page/${pageNum}`));
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
          <div className={`legacy-live-page${isLiveHeadingPage ? ' legacy-live-page-heading' : ''}`}>
            <SectionPage page={page} onLinkClick={handleLinkClick} isEditMode={false} isLiveMode={true} indexPageOrdinal={indexPageOrdinal} onCellChange={onCellChange} onHeadingChange={onHeadingChange} onImageChange={onImageChange} onIndexChange={onIndexChange} onImageClick={onImageClick} allIndexItems={allIndexItems} />
          </div>
        </div>
        <Navigation onNavigate={handleNav} isEditMode={false} isLiveMode={isLiveMode} onEditToggle={onEditToggle} onToggleLive={handleToggleLive} onUndo={() => onUndo(page.id)} onPublish={onPublish} onSave={onSave} onCancel={onCancel} onAddPage={() => onAddPage(page.id)} onDeletePage={() => onDeletePage(page)} onManagePages={onManagePages} currentPageId={page.id} currentPageNumber={page.pageNumber} totalPages={totalPages} />
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
        <Navigation onNavigate={handleNav} isEditMode={effectiveEditMode} isLiveMode={isLiveMode} onEditToggle={onEditToggle} onToggleLive={handleToggleLive} onUndo={() => onUndo(page.id)} onPublish={onPublish} onSave={onSave} onCancel={onCancel} onAddPage={() => onAddPage(page.id)} onDeletePage={() => onDeletePage(page)} onManagePages={onManagePages} currentPageId={page.id} currentPageNumber={page.pageNumber} totalPages={totalPages} />
        <div className="section-card report-content">
          <SectionPage page={page} onLinkClick={handleLinkClick} isEditMode={effectiveEditMode} isLiveMode={false} indexPageOrdinal={indexPageOrdinal} onCellChange={onCellChange} onHeadingChange={onHeadingChange} onImageChange={onImageChange} onIndexChange={onIndexChange} onImageClick={onImageClick} allIndexItems={allIndexItems} />
        </div>
      </div>
    </div>
  );
}
