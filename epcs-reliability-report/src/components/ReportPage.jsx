import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import SectionPage from './SectionPage';
import { isLikelyLinkTarget, toOpenableUrl } from '../utils/linkTarget';

export default function ReportPage({ reportData, isEditMode, isReadMode, onEditToggle, onView, onUndo, onPublish, onCellChange, onHeadingChange, onImageChange, onIndexChange, onSave, onCancel, onImageClick, onAddPage, onDeletePage, onManagePages }) {
  const { pageId } = useParams();
  const navigate = useNavigate();

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

  const totalPages = reportData.pages.length;

  const handleNav = (nav, pageNum) => {
    if (nav === 'home') {
      navigate('/');
    } else if (nav === 'index') {
      navigate('/page/1');
    } else if (nav === 'previous') {
      if (page.pageNumber > 1) {
        navigate(`/page/${page.pageNumber - 1}`);
      } else {
        navigate('/');
      }
    } else if (nav === 'next' && page.pageNumber < totalPages) {
      navigate(`/page/${page.pageNumber + 1}`);
    } else if (nav === 'jump' && pageNum) {
      navigate(`/page/${pageNum}`);
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
        navigate(`/page/${targetPageByNumber.pageNumber}`);
        return;
      }
    }

    const targetPage = getPage(normalizedTarget);
    if (targetPage) {
      navigate(`/page/${targetPage.pageNumber}`);
      return;
    }

    if (isLikelyLinkTarget(normalizedTarget)) {
      const openableUrl = toOpenableUrl(normalizedTarget);
      if (openableUrl) {
        window.open(openableUrl, '_blank', 'noopener,noreferrer');
      }
    }
  };

  return (
    <div className="report-shell">
      <div className="report-page">
        <button
          className="report-title-link"
          onClick={() => navigate('/')}
          aria-label="Go to home"
        >
          <h1>EPCS Reliability Report</h1>
        </button>
        <Navigation onNavigate={handleNav} isEditMode={isEditMode} isReadMode={isReadMode} onEditToggle={onEditToggle} onView={onView} onUndo={() => onUndo(page.id)} onPublish={onPublish} onSave={onSave} onCancel={onCancel} onAddPage={() => onAddPage(page.id)} onDeletePage={() => onDeletePage(page)} onManagePages={onManagePages} currentPageId={page.id} currentPageNumber={page.pageNumber} totalPages={totalPages} />
        <div className="section-card report-content">
          <SectionPage page={page} onLinkClick={handleLinkClick} isEditMode={isEditMode} onCellChange={onCellChange} onHeadingChange={onHeadingChange} onImageChange={onImageChange} onIndexChange={onIndexChange} onImageClick={onImageClick} allIndexItems={allIndexItems} />
        </div>
      </div>
    </div>
  );
}
