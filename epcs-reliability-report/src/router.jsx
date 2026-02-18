import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import Home from './components/Home';
import SectionPage from './components/SectionPage';
import Navigation from './components/Navigation';

export default function ReportRouter() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/structured_report_data.json');
        if (!response.ok) throw new Error('Failed to fetch report data');
        const data = await response.json();
        setReportData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="App"><p>Loading report...</p></div>;
  if (error) return <div className="App"><p>Error loading report: {error}</p></div>;
  if (!reportData || !reportData.pages) return <div className="App"><p>No report data available</p></div>;

  // Helper to get page by id or number
  const getPage = (idOrNum) => {
    if (!idOrNum) return reportData.pages[0];
    if (!isNaN(Number(idOrNum))) {
      return reportData.pages.find(p => p.pageNumber === Number(idOrNum));
    }
    return reportData.pages.find(p => p.id === idOrNum);
  };

  // Navigation handlers
  const handleNav = (nav, currentPageNumber) => {
    const totalPages = reportData.pages.length;
    if (nav === 'home') navigate('/');
    else if (nav === 'index') navigate('/page/1');
    else if (nav === 'previous' && currentPageNumber > 1) navigate(`/page/${currentPageNumber - 1}`);
    else if (nav === 'next' && currentPageNumber < totalPages) navigate(`/page/${currentPageNumber + 1}`);
  };

  return (
    <Routes>
      <Route path="/" element={<Home onNext={() => navigate('/page/1')} />} />
      <Route path="/page/:pageId" element={
        <PageWrapper
          reportData={reportData}
          getPage={getPage}
          handleNav={handleNav}
        />
      } />
      <Route path="*" element={<div className="App"><p>Page not found</p></div>} />
    </Routes>
  );
}

function PageWrapper({ reportData, getPage, handleNav }) {
  const { pageId } = useParams();
  const navigate = useNavigate();
  const page = getPage(pageId);
  
  if (!page) return <div className="App"><p>Page not found</p></div>;
  
  return (
    <div className="App">
      <h1>EPCS Reliability Report</h1>
      <Navigation onNavigate={nav => handleNav(nav, page.pageNumber)} />
      <div className="section-card">
        <SectionPage page={page} onLinkClick={targetId => {
          const targetPage = getPage(targetId);
          if (targetPage) navigate(`/page/${targetPage.pageNumber}`);
        }} />
      </div>
    </div>
  );
}
