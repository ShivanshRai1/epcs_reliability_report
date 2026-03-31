import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Home.css';

const HOME_CONTENT_STORAGE_KEY = 'epcs_home_content_v1';
const DEFAULT_HOME_CONTENT = {
  mainTitle: 'EPC SPACE',
  subtitleLine1: 'Rad-Hard GaN Solutions',
  subtitleLine2: 'for Space Applications',
  reportTitle: 'Reliability Report',
  reportDate: 'September 2024'
};

const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLiveMode = searchParams.get('live') === '1';
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [homeContent, setHomeContent] = useState(DEFAULT_HOME_CONTENT);
  const [draftTitle, setDraftTitle] = useState(DEFAULT_HOME_CONTENT.mainTitle);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HOME_CONTENT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return;

      const nextContent = {
        ...DEFAULT_HOME_CONTENT,
        ...parsed
      };

      setHomeContent(nextContent);
      setDraftTitle(nextContent.mainTitle || DEFAULT_HOME_CONTENT.mainTitle);
    } catch (error) {
      console.warn('Could not load home content customizations:', error);
    }
  }, []);

  const saveTitleEdit = () => {
    const sanitizedTitle = draftTitle.trim() || DEFAULT_HOME_CONTENT.mainTitle;
    const nextContent = {
      ...homeContent,
      mainTitle: sanitizedTitle
    };

    setHomeContent(nextContent);
    setDraftTitle(sanitizedTitle);
    setIsEditingTitle(false);

    try {
      localStorage.setItem(HOME_CONTENT_STORAGE_KEY, JSON.stringify(nextContent));
    } catch (error) {
      console.warn('Could not save home content customizations:', error);
    }
  };

  const cancelTitleEdit = () => {
    setDraftTitle(homeContent.mainTitle || DEFAULT_HOME_CONTENT.mainTitle);
    setIsEditingTitle(false);
  };

  if (isLiveMode) {
    return (
      <div className="pdf-viewer-shell container-fluid legacy-live-shell">
        <div className="pdf-viewer-content legacy-live-canvas mx-auto" style={{position: 'relative', overflow: 'hidden'}}>
          <img
            src="/images/bg1.png"
            alt="EPC Space Reliability Report Cover"
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'fill',
              display: 'block',
            }}
          />
        </div>
        <nav className="pdf-viewer-nav legacy-live-nav d-flex justify-content-center align-items-center">
          <button
            className="pdf-nav-btn legacy-live-nav-btn"
            onClick={() => navigate('/page/1?live=1')}
          >
            Next &gt;&gt;
          </button>
        </nav>
      </div>
    );
  }

  return (
    <div className="home-bg">
      <div className="home-content">
        {!isEditingTitle && (
          <button
            className="home-edit-btn"
            onClick={() => setIsEditingTitle(true)}
            title="Edit main title"
            type="button"
          >
            Edit Title
          </button>
        )}

        {isEditingTitle ? (
          <div className="home-title-editor">
            <label htmlFor="home-main-title-input">Main Title</label>
            <input
              id="home-main-title-input"
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitleEdit();
                if (e.key === 'Escape') cancelTitleEdit();
              }}
              placeholder="Enter main title"
            />
            <div className="home-title-editor-actions">
              <button type="button" onClick={saveTitleEdit}>Save</button>
              <button type="button" className="secondary" onClick={cancelTitleEdit}>Cancel</button>
            </div>
          </div>
        ) : (
          <h1 className="epc-title">{homeContent.mainTitle}</h1>
        )}

        <h2>{homeContent.subtitleLine1}<br />{homeContent.subtitleLine2}</h2>
        <h3>{homeContent.reportTitle}<br />{homeContent.reportDate}</h3>
        <button className="next-btn" onClick={() => navigate('/page/1')}>Start &#9654;&#9654;</button>
      </div>
    </div>
  );
};

export default Home;
