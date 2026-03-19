import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isLiveMode = searchParams.get('live') === '1';

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
        <h1 className="epc-title">EPC SPACE</h1>
        <h2>Rad-Hard GaN Solutions<br />for Space Applications</h2>
        <h3>Reliability Report<br />September 2024</h3>
        <button className="next-btn" onClick={() => navigate('/page/1')}>Start &#9654;&#9654;</button>
      </div>
    </div>
  );
};

export default Home;
