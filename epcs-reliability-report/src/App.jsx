import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import ReportPage from './components/ReportPage';
import Modal from './components/Modal';
import AddPageDialog from './components/AddPageDialog';
import DeletePageDialog from './components/DeletePageDialog';
import PageManagerModal from './components/PageManagerModal';
import { apiService } from './services/api';

function App() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [changedPages, setChangedPages] = useState(new Set());
  const [isAddPageDialogOpen, setIsAddPageDialogOpen] = useState(false);
  const [currentPageId, setCurrentPageId] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [pageToDelete, setPageToDelete] = useState(null);
  const [isPageManagerOpen, setIsPageManagerOpen] = useState(false);
  const [isDeletingPageId, setIsDeletingPageId] = useState(null);
  const [isReordering, setIsReordering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all pages from backend API
        const pagesFromApi = await apiService.getPages();
        
        // Transform data structure for the app
        // API returns { page_id, page_number, page_type, title, page_data, ... }
        // App expects { pages: [{ id, title, ... }] }
        const transformedData = {
          pages: pagesFromApi.map(page => ({
            id: page.page_id,
            title: page.title,
            pageType: page.page_type,
            pageNumber: page.page_number,
            ...page.page_data // Spread the actual page content
          }))
        };
        
        setReportData(transformedData);
        setOriginalData(JSON.parse(JSON.stringify(transformedData)));
      } catch (err) {
        console.error('Error loading report:', err);
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
    setChangedPages(prev => new Set(prev).add(pageId));
  };

  const handleHeadingChange = (pageId, newValue) => {
    setReportData(prevData => {
      const updated = JSON.parse(JSON.stringify(prevData));
      const page = updated.pages.find(p => p.id === pageId);
      if (page) {
        // Support both string (title only) and object (title + subtitle) updates
        if (typeof newValue === 'string') {
          page.title = newValue;
        } else if (typeof newValue === 'object') {
          Object.assign(page, newValue);
        }
      }
      return updated;
    });
    setChangedPages(prev => new Set(prev).add(pageId));
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
    setChangedPages(prev => new Set(prev).add(pageId));
  };

  const handleIndexChange = (pageId, updatedPageData) => {
    setReportData(prevData => {
      const updated = JSON.parse(JSON.stringify(prevData));
      const page = updated.pages.find(p => p.id === pageId);
      if (page && updatedPageData) {
        page.title = updatedPageData.title;
        page.content = updatedPageData.content;
      }
      return updated;
    });
    setChangedPages(prev => new Set(prev).add(pageId));
  };

  const handleSave = async () => {
    try {
      // Only save pages that were actually changed
      const pagesToSave = Array.from(changedPages);
      
      for (const pageId of pagesToSave) {
        const page = reportData.pages.find(p => p.id === pageId);
        if (page) {
          const payload = { 
            page_data: { ...page }
          };
          await apiService.savePage(page.id, payload);
        }
      }
      
      setOriginalData(JSON.parse(JSON.stringify(reportData)));
      setChangedPages(new Set()); // Clear changed pages
      setIsEditMode(false);
    } catch (err) {
      console.error('Error saving report:', err);
    }
  };

  const handleCancel = () => {
    setReportData(JSON.parse(JSON.stringify(originalData)));
    setChangedPages(new Set()); // Clear changed pages on cancel
    setIsEditMode(false);
  };

  const handleImageClick = (imageSrc, imageAlt) => {
    setSelectedImage({ src: imageSrc, alt: imageAlt });
    setIsModalOpen(true);
  };

  const handleOpenAddPageDialog = (pageId = null) => {
    setCurrentPageId(pageId);
    setIsAddPageDialogOpen(true);
  };

  const handleCloseAddPageDialog = () => {
    setIsAddPageDialogOpen(false);
    setCurrentPageId(null);
  };

  const handlePageCreate = async (newPage) => {
    try {
      console.log('Page created:', newPage);
      // Refresh pages list from backend
      const pagesFromApi = await apiService.getPages();
      console.log('Pages from API after creation:', pagesFromApi);
      
      const transformedData = {
        pages: pagesFromApi.map(page => ({
          id: page.page_id,
          title: page.title,
          pageType: page.page_type,
          pageNumber: page.page_number,
          ...page.page_data
        }))
      };
      
      setReportData(transformedData);
      setOriginalData(JSON.parse(JSON.stringify(transformedData)));
      
      // Exit edit mode after creating page
      setIsEditMode(false);
      setChangedPages(new Set());
      
      console.log('✅ Page created successfully:', newPage);
    } catch (err) {
      console.error('Error creating page:', err);
    }
  };

  const handleOpenDeleteDialog = (page) => {
    setPageToDelete(page);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (pageId) => {
    try {
      setIsDeletingPageId(pageId);
      await apiService.deletePage(pageId);

      // Refresh pages list
      const pagesFromApi = await apiService.getPages();
      const transformedData = {
        pages: pagesFromApi.map(page => ({
          id: page.page_id,
          title: page.title,
          pageType: page.page_type,
          pageNumber: page.page_number,
          ...page.page_data
        }))
      };

      setReportData(transformedData);
      setOriginalData(JSON.parse(JSON.stringify(transformedData)));
      setIsDeleteDialogOpen(false);
      setPageToDelete(null);
      
      console.log('✅ Page deleted successfully');
    } catch (err) {
      console.error('Error deleting page:', err);
    } finally {
      setIsDeletingPageId(null);
    }
  };

  const handleReorderPages = async (pageOrder) => {
    try {
      setIsReordering(true);
      await apiService.reorderPages(pageOrder);

      // Refresh pages list
      const pagesFromApi = await apiService.getPages();
      const transformedData = {
        pages: pagesFromApi.map(page => ({
          id: page.page_id,
          title: page.title,
          pageType: page.page_type,
          pageNumber: page.page_number,
          ...page.page_data
        }))
      };

      setReportData(transformedData);
      setOriginalData(JSON.parse(JSON.stringify(transformedData)));
      
      console.log('✅ Pages reordered successfully');
    } catch (err) {
      console.error('Error reordering pages:', err);
    } finally {
      setIsReordering(false);
    }
  };

  const handleNavigateToPage = (pageNumber) => {
    // Will be called from page manager to navigate to a specific page
    window.location.href = `/page/${pageNumber}`;
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
      <AddPageDialog 
        isOpen={isAddPageDialogOpen} 
        onClose={handleCloseAddPageDialog}
        onPageCreate={handlePageCreate}
        currentPageId={currentPageId}
      />
      <DeletePageDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setPageToDelete(null);
        }}
        page={pageToDelete}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={isDeletingPageId === pageToDelete?.id}
      />
      <PageManagerModal
        isOpen={isPageManagerOpen}
        onClose={() => setIsPageManagerOpen(false)}
        pages={reportData?.pages || []}
        onReorder={handleReorderPages}
        onDelete={handleOpenDeleteDialog}
        onNavigate={handleNavigateToPage}
        isReordering={isReordering}
        isDeletingId={isDeletingPageId}
      />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/page/:pageId" element={<ReportPage reportData={reportData} isEditMode={isEditMode} onEditToggle={handleEditToggle} onCellChange={handleCellChange} onHeadingChange={handleHeadingChange} onImageChange={handleImageChange} onIndexChange={handleIndexChange} onSave={handleSave} onCancel={handleCancel} onImageClick={handleImageClick} onAddPage={handleOpenAddPageDialog} onDeletePage={handleOpenDeleteDialog} onManagePages={() => setIsPageManagerOpen(true)} />} />
        <Route path="*" element={<div className="App"><p>Page not found</p></div>} />
      </Routes>
    </>
  );
}

export default App;
