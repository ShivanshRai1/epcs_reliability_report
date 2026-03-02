import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import ReportPage from './components/ReportPage';
import Modal from './components/Modal';
import AddPageDialog from './components/AddPageDialog';
import DeletePageDialog from './components/DeletePageDialog';
import PageManagerModal from './components/PageManagerModal';
import PublishConfirmDialog from './components/PublishConfirmDialog';
import { apiService } from './services/api';

function App() {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isEditUnlocked, setIsEditUnlocked] = useState(false);
  const [isReadMode, setIsReadMode] = useState(false);
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
  
  // New state for per-page undo history
  const [pageUndoHistory, setPageUndoHistory] = useState({});
  const [publishedData, setPublishedData] = useState(null);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);

  useEffect(() => {
    console.log('[ReadMode Debug] App mounted. Initial isReadMode:', isReadMode);
  }, []);

  useEffect(() => {
    console.log('[ReadMode Debug] isReadMode changed:', isReadMode);
  }, [isReadMode]);

  const transformPagesFromApi = (pagesFromApi) => {
    const pagesArray = Array.isArray(pagesFromApi) ? pagesFromApi : [];

    return {
      pages: pagesArray.map(page => ({
        ...(page.page_data || {}),
        id: page.page_id,
        title: page.title,
        pageType: page.page_type,
        pageNumber: page.page_number
      }))
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all pages from backend API
        const pagesFromApi = await apiService.getPages();
        
        // Transform data structure for the app
        // API returns { page_id, page_number, page_type, title, page_data, ... }
        // App expects { pages: [{ id, title, ... }] }
        const transformedData = transformPagesFromApi(pagesFromApi);
        
        setReportData(transformedData);
        setOriginalData(JSON.parse(JSON.stringify(transformedData)));
      } catch (err) {
        console.error('Error loading report:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    // Force isReadMode to false on app load
    setIsReadMode(false);
    fetchData();
  }, []);

  const handleEditToggle = () => {
    if (!isEditUnlocked) return;
    setIsEditMode(true);
  };

  const handleUnlockEdit = () => {
    setIsEditUnlocked(true);
  };

  const handleViewMode = () => {
    setIsEditMode(false);
    setIsEditUnlocked(false);
  };

  const handleReadModeToggle = () => {
    setIsReadMode(prev => !prev);
  };
  const handleUndoAll = (pageId) => {
    if (!pageId) return;
    
    const history = pageUndoHistory[pageId];
    
    // If there's history for this page, restore the previous state
    if (history && history.length > 0) {
      const previousState = history.pop();
      
      // Update pageUndoHistory to remove the popped item
      setPageUndoHistory(prev => {
        const updated = { ...prev };
        updated[pageId] = [...history];  // Keep the updated history
        return updated;
      });
      
      // Restore the page to previous state in reportData
      setReportData(prevData => {
        const updated = JSON.parse(JSON.stringify(prevData));
        const pageIndex = updated.pages.findIndex(p => p.id === pageId);
        if (pageIndex !== -1) {
          updated.pages[pageIndex] = previousState;
        }
        return updated;
      });
    }
  };

  const handleCellChange = (pageId, rowIdxOrPage, colName, newValue) => {
    // Capture current page state for undo history (before making changes)
    setPageUndoHistory(prevHistory => {
      const history = { ...prevHistory };
      if (!history[pageId]) {
        history[pageId] = [];
      }
      
      // Get current page state from reportData
      const currentPage = reportData.pages.find(p => p.id === pageId);
      if (currentPage) {
        // Keep only last 20 changes
        if (history[pageId].length >= 20) {
          history[pageId].shift();
        }
        history[pageId].push(JSON.parse(JSON.stringify(currentPage)));
      }
      
      return history;
    });

    setReportData(prevData => {
      const updated = JSON.parse(JSON.stringify(prevData));
      const page = updated.pages.find(p => p.id === pageId);
      if (!page) return updated;

      // Generic page update from editors like Links/Text/Image/etc.
      if (typeof rowIdxOrPage === 'object' && rowIdxOrPage !== null && colName === undefined) {
        Object.assign(page, rowIdxOrPage);
        return updated;
      }

      // Table cell update
      const rowIdx = rowIdxOrPage;
      const tableRows = page.table?.rows || page.table?.data;
      if (Array.isArray(tableRows) && tableRows[rowIdx]) {
        tableRows[rowIdx][colName] = newValue;
      }

      return updated;
    });

    setChangedPages(prev => {
      const next = new Set(prev);
      next.add(pageId);
      return next;
    });
  };

  const handleHeadingChange = (pageId, newValue) => {
    // Capture current page state for undo history (before making changes)
    setPageUndoHistory(prevHistory => {
      const history = { ...prevHistory };
      if (!history[pageId]) {
        history[pageId] = [];
      }
      
      // Get current page state from reportData
      const currentPage = reportData.pages.find(p => p.id === pageId);
      if (currentPage) {
        // Keep only last 20 changes
        if (history[pageId].length >= 20) {
          history[pageId].shift();
        }
        history[pageId].push(JSON.parse(JSON.stringify(currentPage)));
      }
      
      return history;
    });

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
    // Capture current page state for undo history (before making changes)
    setPageUndoHistory(prevHistory => {
      const history = { ...prevHistory };
      if (!history[pageId]) {
        history[pageId] = [];
      }
      
      // Get current page state from reportData
      const currentPage = reportData.pages.find(p => p.id === pageId);
      if (currentPage) {
        // Keep only last 20 changes
        if (history[pageId].length >= 20) {
          history[pageId].shift();
        }
        history[pageId].push(JSON.parse(JSON.stringify(currentPage)));
      }
      
      return history;
    });

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
    // Capture current page state for undo history (before making changes)
    setPageUndoHistory(prevHistory => {
      const history = { ...prevHistory };
      if (!history[pageId]) {
        history[pageId] = [];
      }
      
      // Get current page state from reportData
      const currentPage = reportData.pages.find(p => p.id === pageId);
      if (currentPage) {
        // Keep only last 20 changes
        if (history[pageId].length >= 20) {
          history[pageId].shift();
        }
        history[pageId].push(JSON.parse(JSON.stringify(currentPage)));
      }
      
      return history;
    });

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
      setIsEditUnlocked(false);
    } catch (err) {
      console.error('Error saving report:', err);
    }
  };

  const handleCancel = () => {
    setReportData(JSON.parse(JSON.stringify(originalData)));
    setChangedPages(new Set()); // Clear changed pages on cancel
    setIsEditMode(false);
    setIsEditUnlocked(false);
  };

  const handlePublish = () => {
    // Show the publish confirmation dialog
    setIsPublishDialogOpen(true);
  };

  const confirmPublish = async () => {
    // Close the dialog first
    setIsPublishDialogOpen(false);
    
    // Save all changes
    await handleSave();
    
    // Set published data to lock read-only mode
    setPublishedData(JSON.parse(JSON.stringify(reportData)));
    
    // Exit edit mode
    setIsEditMode(false);
    setIsEditUnlocked(false);
    
    // Clear undo history since changes are now permanent
    setPageUndoHistory({});
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

  // Sync index page with updated page numbers
  const syncIndexPageContent = (data) => {
    console.log('🔄 Syncing index page content...');
    if (!data.pages || !Array.isArray(data.pages)) {
      console.warn('⚠️ Invalid data structure in syncIndexPageContent');
      return data;
    }
    
    const indexPage = data.pages.find(p => p.pageType === 'index');
    if (!indexPage) {
      console.log('ℹ️ No index page found');
      return data;
    }

    // Build content array with all non-index pages
    // Filter out any entries that don't have a title (removes gaps)
    const newContent = data.pages
      .filter(p => p.pageType !== 'index' && p.title && p.title.trim() !== '')
      .map(p => ({
        title: p.title,
        target: p.pageNumber
      }));

    console.log('📋 New index content (gaps removed):', newContent);

    // Update index page
    const updatedPages = data.pages.map(p =>
      p.pageType === 'index' ? { ...p, content: newContent } : p
    );

    return { ...data, pages: updatedPages };
  };
  const handlePageCreate = async (newPage) => {
    try {
      console.log('Page created:', newPage);
      // Refresh pages list from backend
      const pagesFromApi = await apiService.getPages();
      console.log('Pages from API after creation:', pagesFromApi);
      
      let transformedData = transformPagesFromApi(pagesFromApi);
      
      // Sync index page with new page numbers
      transformedData = syncIndexPageContent(transformedData);
      
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
      console.log('🗑️ Deleting page:', pageId);
      
      // Get current page number being deleted
      const pageBeingDeleted = reportData.pages.find(p => p.id === pageId);
      const pageNumberDeleted = pageBeingDeleted?.pageNumber;
      console.log('📄 Page being deleted - number:', pageNumberDeleted);
      
      await apiService.deletePage(pageId);
      console.log('✅ Delete API call completed');

      // Refresh pages list
      const pagesFromApi = await apiService.getPages();
      console.log('📄 Pages from API:', pagesFromApi);
      
      const pagesArray = Array.isArray(pagesFromApi) ? pagesFromApi : [];
      console.log('📊 Pages array:', pagesArray);
      
      let transformedData = transformPagesFromApi(pagesFromApi);

      console.log('🔄 Transformed data:', transformedData);

      // Sync index page with new page numbers
      transformedData = syncIndexPageContent(transformedData);

      setReportData(transformedData);
      setOriginalData(JSON.parse(JSON.stringify(transformedData)));
      setIsDeleteDialogOpen(false);
      setPageToDelete(null);
      
      // Determine where to redirect after deletion
      // If we deleted the current page, find the next available page
      const remainingPages = transformedData.pages.filter(p => p.pageType !== 'home');
      const totalRemainingPages = remainingPages.length;
      let redirectPageNumber = null;
      
      if (pageNumberDeleted) {
        // Try to find the next page after the deleted one
        const nextPage = remainingPages.find(p => p.pageNumber > pageNumberDeleted);
        if (nextPage && nextPage.pageNumber <= totalRemainingPages) {
          redirectPageNumber = nextPage.pageNumber;
          console.log(`🔄 Redirecting to next page: ${redirectPageNumber} (total: ${totalRemainingPages})`);
        } else {
          // If no next page, find the previous page
          const prevPage = remainingPages.reverse().find(p => p.pageNumber < pageNumberDeleted);
          if (prevPage && prevPage.pageNumber <= totalRemainingPages) {
            redirectPageNumber = prevPage.pageNumber;
            console.log(`🔄 Redirecting to previous page: ${redirectPageNumber} (total: ${totalRemainingPages})`);
          } else {
            // If no other pages, go to Index (page 1)
            redirectPageNumber = 1;
            console.log(`🔄 Redirecting to Index (page 1) - no other pages available`);
          }
        }
        
        if (redirectPageNumber && redirectPageNumber <= totalRemainingPages) {
          console.log(`✅ Safe redirect: page ${redirectPageNumber} exists (total: ${totalRemainingPages})`);
          setTimeout(() => {
            window.location.href = `/page/${redirectPageNumber}`;
          }, 500);
        } else {
          console.warn(`⚠️ Redirect page ${redirectPageNumber} exceeds total ${totalRemainingPages}, going to Index`);
          setTimeout(() => {
            window.location.href = `/page/1`;
          }, 500);
        }
      }
      
      console.log('✅ Page deletion and refresh completed');
    } catch (err) {
      console.error('❌ Error deleting page:', err);
    } finally {
      setIsDeletingPageId(null);
    }
  };

  const handleReorderPages = async (pageOrder) => {
    try {
      setIsReordering(true);
      if (!Array.isArray(pageOrder) || pageOrder.length === 0) {
        throw new Error('Invalid page order');
      }

      await apiService.reorderPages(pageOrder);

      // Refresh pages list
      const pagesFromApi = await apiService.getPages();
      console.log('📄 Pages from API after reorder:', pagesFromApi);
      
      let transformedData = transformPagesFromApi(pagesFromApi);

      // Sync index page with new page numbers
      transformedData = syncIndexPageContent(transformedData);

      setReportData(transformedData);
      setOriginalData(JSON.parse(JSON.stringify(transformedData)));
      
      console.log('✅ Pages reordered successfully');
      return true;
    } catch (err) {
      console.error('❌ Error reordering pages:', err);
      return false;
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
        onNavigate={(action, pageNum) => navigate(`/page/${pageNum}`)}
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
      <PublishConfirmDialog
        isOpen={isPublishDialogOpen}
        onConfirm={confirmPublish}
        onCancel={() => setIsPublishDialogOpen(false)}
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
        <Route path="/page/:pageId" element={<ReportPage reportData={reportData} isEditMode={isEditMode} isEditUnlocked={isEditUnlocked} isReadMode={isReadMode} onEditToggle={handleEditToggle} onUnlock={handleUnlockEdit} onView={handleReadModeToggle} onUndo={handleUndoAll} onPublish={handlePublish} onCellChange={handleCellChange} onHeadingChange={handleHeadingChange} onImageChange={handleImageChange} onIndexChange={handleIndexChange} onSave={handleSave} onCancel={handleCancel} onImageClick={handleImageClick} onAddPage={handleOpenAddPageDialog} onDeletePage={handleOpenDeleteDialog} onManagePages={() => setIsPageManagerOpen(true)} />} />
        <Route path="*" element={<div className="App"><p>Page not found</p></div>} />
      </Routes>
    </>
  );
}

export default App;
