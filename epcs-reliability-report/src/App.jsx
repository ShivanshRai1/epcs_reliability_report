import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import ReportPage from './components/ReportPage';
import Modal from './components/Modal';

function App() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/structured_report_data.json');
        if (!response.ok) throw new Error('Failed to fetch report data');
        const data = await response.json();
        
        // Load edited data from localStorage if available
        const savedData = localStorage.getItem('epcsReportEdits');
        if (savedData) {
          try {
            const parsed = JSON.parse(savedData);
            setEditedData(parsed);
            setReportData(data);
            setOriginalData(JSON.parse(JSON.stringify(data)));
          } catch (e) {
            setReportData(data);
            setOriginalData(JSON.parse(JSON.stringify(data)));
          }
        } else {
          setReportData(data);
          setOriginalData(JSON.parse(JSON.stringify(data)));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
  };

  const handleCellChange = (pageId, rowIdx, colName, newValue) => {
    setReportData(prevData => {
      const updated = JSON.parse(JSON.stringify(prevData));
      const page = updated.pages.find(p => p.id === pageId);
      if (page && page.table && page.table.data[rowIdx]) {
        page.table.data[rowIdx][colName] = newValue;
      }
      return updated;
    });
  };

  const handleHeadingChange = (pageId, newValue) => {
    setReportData(prevData => {
      const updated = JSON.parse(JSON.stringify(prevData));
      const page = updated.pages.find(p => p.id === pageId);
      if (page) {
        page.title = newValue;
      }
      return updated;
    });
  };

  const handleImageChange = (pageId, data) => {
    setReportData(prevData => {
      const updated = JSON.parse(JSON.stringify(prevData));
      const page = updated.pages.find(p => p.id === pageId);
      if (page) {
        // Handle split-content-image pages (object with content and imageUrl)
        if (data && typeof data === 'object' && 'content' in data && 'imageUrl' in data) {
          page.content = data.content;
          page.imageUrl = data.imageUrl;
        } else {
          // Handle regular image pages (string URL)
          page.imageUrl = data;
        }
      }
      return updated;
    });
  };

  const handleSave = () => {
    localStorage.setItem('epcsReportEdits', JSON.stringify(reportData));
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setReportData(JSON.parse(JSON.stringify(originalData)));
    setIsEditMode(false);
  };

  const handleImageClick = (imageSrc, imageAlt) => {
    setSelectedImage({ src: imageSrc, alt: imageAlt });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  if (loading) return <div className="App"><p>Loading report...</p></div>;
  if (error) return <div className="App"><p>Error loading report: {error}</p></div>;
  if (!reportData) return <div className="App"><p>No report data available</p></div>;

  return (
    <>
      <Modal isOpen={isModalOpen} imageSrc={selectedImage?.src} imageAlt={selectedImage?.alt} onClose={handleCloseModal} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/page/:pageId" element={<ReportPage reportData={reportData} isEditMode={isEditMode} onEditToggle={handleEditToggle} onCellChange={handleCellChange} onHeadingChange={handleHeadingChange} onImageChange={handleImageChange} onSave={handleSave} onCancel={handleCancel} onImageClick={handleImageClick} />} />
        <Route path="*" element={<div className="App"><p>Page not found</p></div>} />
      </Routes>
    </>
  );
}

export default App;
