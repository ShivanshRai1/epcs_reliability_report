import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import SectionPage from './SectionPage';

export default function ReportPage({ reportData, isEditMode, onEditToggle, onView, onUndo, onPublish, onCellChange, onHeadingChange, onImageChange, onIndexChange, onSave, onCancel, onImageClick, onAddPage, onDeletePage, onManagePages }) {
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
    
    // Check if it's a URL (starts with http, https, www, or contains a domain pattern)
    if (targetId.includes('http') || targetId.includes('www.') || targetId.includes('.com') || targetId.includes('.org') || targetId.includes('.net')) {
      // External URL
      const url = targetId.startsWith('http') ? targetId : `https://${targetId}`;
      window.open(url, '_blank');
      return;
    }
    
    // Otherwise treat as internal page reference
    const targetPage = getPage(targetId);
    if (targetPage) {
      navigate(`/page/${targetPage.pageNumber}`);
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
        <Navigation onNavigate={handleNav} isEditMode={isEditMode} onEditToggle={onEditToggle} onView={onView} onUndo={onUndo} onPublish={onPublish} onSave={onSave} onCancel={onCancel} onAddPage={() => onAddPage(page.id)} onDeletePage={() => onDeletePage(page)} onManagePages={onManagePages} currentPageId={page.id} currentPageNumber={page.pageNumber} totalPages={totalPages} />
        <div className="section-card report-content">
          <SectionPage page={page} onLinkClick={handleLinkClick} isEditMode={isEditMode} onCellChange={onCellChange} onHeadingChange={onHeadingChange} onImageChange={onImageChange} onIndexChange={onIndexChange} onImageClick={onImageClick} />
        </div>
      </div>
    </div>
  );
}
