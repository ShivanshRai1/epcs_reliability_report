import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Home.css';

const HOME_CONTENT_STORAGE_KEY = 'epcs_home_content_v1';
const DEFAULT_HOME_CONTENT = {
  mainTitle: 'Reliability Report',
  subtitleLine1: 'Rad-Hard GaN Solutions',
  subtitleLine2: 'for Space Applications',
  reportTitle: 'EPCS Discrete Reliability',
  reportDate: 'September 2024'
};

const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLiveMode = searchParams.get('live') === '1';
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [homeContent, setHomeContent] = useState(DEFAULT_HOME_CONTENT);
  const [draftContent, setDraftContent] = useState(DEFAULT_HOME_CONTENT);

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
      setDraftContent(nextContent);
    } catch (error) {
      console.warn('Could not load home content customizations:', error);
    }
  }, []);

  const saveTitleEdit = () => {
    const nextContent = {
      ...homeContent,
      mainTitle: (draftContent.mainTitle || '').trim() || DEFAULT_HOME_CONTENT.mainTitle,
      subtitleLine1: (draftContent.subtitleLine1 || '').trim(),
      subtitleLine2: (draftContent.subtitleLine2 || '').trim(),
      reportTitle: (draftContent.reportTitle || '').trim(),
      reportDate: (draftContent.reportDate || '').trim()
    };

    setHomeContent(nextContent);
    setDraftContent(nextContent);
    setIsEditingTitle(false);

    try {
      localStorage.setItem(HOME_CONTENT_STORAGE_KEY, JSON.stringify(nextContent));
    } catch (error) {
      console.warn('Could not save home content customizations:', error);
    }
  };

  const cancelTitleEdit = () => {
    setDraftContent(homeContent);
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
          <div className="live-home-title-overlay">
            <h1>{homeContent.mainTitle}</h1>
            {(homeContent.subtitleLine1 || homeContent.subtitleLine2) && (
              <h2>
                {homeContent.subtitleLine1}
                {homeContent.subtitleLine2 ? <><br />{homeContent.subtitleLine2}</> : null}
              </h2>
            )}
            {(homeContent.reportTitle || homeContent.reportDate) && (
              <h3>
                {homeContent.reportTitle}
                {homeContent.reportDate ? <><br />{homeContent.reportDate}</> : null}
              </h3>
            )}
          </div>
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
            title="Edit home titles"
            type="button"
          >
            Edit Titles
          </button>
        )}

        {isEditingTitle ? (
          <div className="home-title-editor">
            <label htmlFor="home-main-title-input">Main Title</label>
            <input
              id="home-main-title-input"
              type="text"
              value={draftContent.mainTitle || ''}
              onChange={(e) => setDraftContent((prev) => ({ ...prev, mainTitle: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitleEdit();
                if (e.key === 'Escape') cancelTitleEdit();
              }}
              placeholder="Enter main title"
            />

            <label htmlFor="home-subtitle-1-input">Subtitle Line 1</label>
            <input
              id="home-subtitle-1-input"
              type="text"
              value={draftContent.subtitleLine1 || ''}
              onChange={(e) => setDraftContent((prev) => ({ ...prev, subtitleLine1: e.target.value }))}
              placeholder="Enter subtitle line 1"
            />

            <label htmlFor="home-subtitle-2-input">Subtitle Line 2</label>
            <input
              id="home-subtitle-2-input"
              type="text"
              value={draftContent.subtitleLine2 || ''}
              onChange={(e) => setDraftContent((prev) => ({ ...prev, subtitleLine2: e.target.value }))}
              placeholder="Enter subtitle line 2"
            />

            <label htmlFor="home-report-title-input">Report Title</label>
            <input
              id="home-report-title-input"
              type="text"
              value={draftContent.reportTitle || ''}
              onChange={(e) => setDraftContent((prev) => ({ ...prev, reportTitle: e.target.value }))}
              placeholder="Enter report title"
            />

            <label htmlFor="home-report-date-input">Report Date</label>
            <input
              id="home-report-date-input"
              type="text"
              value={draftContent.reportDate || ''}
              onChange={(e) => setDraftContent((prev) => ({ ...prev, reportDate: e.target.value }))}
              placeholder="Enter report date"
            />

            <div className="home-title-editor-actions">
              <button type="button" onClick={saveTitleEdit}>Save</button>
              <button type="button" className="secondary" onClick={cancelTitleEdit}>Cancel</button>
            </div>
          </div>
        ) : (
          <h1 className="home-main-title">{homeContent.mainTitle}</h1>
        )}

        <h2>{homeContent.subtitleLine1}<br />{homeContent.subtitleLine2}</h2>
        <h3>{homeContent.reportTitle}<br />{homeContent.reportDate}</h3>
        <button className="next-btn" onClick={() => navigate('/page/1')}>Start &#9654;&#9654;</button>
      </div>
    </div>
  );
};

export default Home;
