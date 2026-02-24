import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navigation from './Navigation';
import SectionPage from './SectionPage';

export default function ReportPage({ reportData, isEditMode, onEditToggle, onCellChange, onHeadingChange, onImageChange, onIndexChange, onSave, onCancel, onImageClick }) {
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

  const handleNav = (nav) => {
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
    }
  };

  const handleLinkClick = (targetId) => {
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
        <Navigation onNavigate={handleNav} isEditMode={isEditMode} onEditToggle={onEditToggle} onSave={onSave} onCancel={onCancel} />
        <div className="section-card report-content">
          <SectionPage page={page} onLinkClick={handleLinkClick} isEditMode={isEditMode} onCellChange={onCellChange} onHeadingChange={onHeadingChange} onImageChange={onImageChange} onIndexChange={onIndexChange} onImageClick={onImageClick} />
        </div>
      </div>
    </div>
  );
}
