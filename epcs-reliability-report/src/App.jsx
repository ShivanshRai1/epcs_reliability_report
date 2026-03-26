import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import ReportPage from './components/ReportPage';
import Modal from './components/Modal';
import AddPageDialog from './components/AddPageDialog';
import DeletePageDialog from './components/DeletePageDialog';
import PageManagerModal from './components/PageManagerModal';
import PublishConfirmDialog from './components/PublishConfirmDialog';
import { apiService } from './services/api';

const OFFLINE_CACHE_KEY = 'epcs_report_cache_v2';
const LIVE_LEGACY_CSS_FILES = ['/bootstrap.min.css', '/base.min.css', '/fancy.min.css', '/main.css', '/lightbox.css'];

function App() {
  const navigate = useNavigate();
  const location = useLocation();
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
  
  // New state for per-page undo history
  const [pageUndoHistory, setPageUndoHistory] = useState({});
  const [publishedData, setPublishedData] = useState(null);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isTestMode, setIsTestMode] = useState(() => apiService.getTestModeState().enabled);
  const [isSeedingTestData, setIsSeedingTestData] = useState(false);
  const [isPublishingTestData, setIsPublishingTestData] = useState(false);
  // Cache of static index pages loaded from public JSON (preserves curated content/levels)
  const staticIndexPagesRef = useRef([]);

  const syncTestModeState = () => {
    setIsTestMode(apiService.getTestModeState().enabled);
  };

  const handleToggleTestMode = async () => {
    try {
      const current = apiService.getTestModeState();

      if (current.enabled) {
        apiService.setTestMode(false);
        syncTestModeState();
        window.alert('You are now in production mode.');
        window.location.reload();
        return;
      }

      apiService.setTestMode(true);
      syncTestModeState();
      window.alert('You are now in test mode. All edits will be saved to isolated test tables.');
      window.location.reload();
    } catch (err) {
      console.error('Error toggling test mode:', err);
      window.alert(`Failed to toggle test mode: ${err.message}`);
    }
  };

  const handleSeedTestData = async () => {
    try {
      setIsSeedingTestData(true);

      const mode = apiService.getTestModeState();
      if (!mode.enabled) {
        window.alert('Enable test mode first.');
        return;
      }

      const confirmed = window.confirm('Seed persistent test tables from production now? This replaces current test data.');
      if (!confirmed) return;

      const result = await apiService.seedTestData();
      window.alert(`Test data seeded successfully. Pages: ${result.pages_test_count}`);
      window.location.reload();
    } catch (err) {
      console.error('Error seeding test data:', err);
      window.alert(`Failed to seed test data: ${err.message}`);
    } finally {
      setIsSeedingTestData(false);
    }
  };

  const handlePublishTestData = async () => {
    try {
      setIsPublishingTestData(true);

      const mode = apiService.getTestModeState();
      if (!mode.enabled) {
        window.alert('Enable test mode first.');
        return;
      }

      const confirmed = window.confirm('Publish all test changes to production? This will replace production data with test data.');
      if (!confirmed) return;

      const result = await apiService.publishTestData();
      window.alert(`Test changes published successfully. Pages: ${result.pages_count}`);
      window.location.reload();
    } catch (err) {
      console.error('Error publishing test data:', err);
      window.alert(`Failed to publish test data: ${err.message}`);
    } finally {
      setIsPublishingTestData(false);
    }
  };

  useEffect(() => {
    const isLiveMode = new URLSearchParams(location.search).get('live') === '1';

    if (isLiveMode) {
      LIVE_LEGACY_CSS_FILES.forEach((href) => {
        const existing = document.querySelector(`link[data-live-legacy-css="${href}"]`);
        if (existing) {
          return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.setAttribute('data-live-legacy-css', href);
        document.head.appendChild(link);
      });
      return;
    }

    LIVE_LEGACY_CSS_FILES.forEach((href) => {
      const existing = document.querySelector(`link[data-live-legacy-css="${href}"]`);
      if (existing) {
        existing.remove();
      }
    });
  }, [location.search]);

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

  const idMatches = (left, right) => String(left ?? '') === String(right ?? '');

  const saveReportCache = (data) => {
    try {
      if (!data?.pages || !Array.isArray(data.pages)) return;
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(data));
    } catch (cacheErr) {
      console.warn('Could not persist report cache:', cacheErr);
    }
  };

  const loadReportCache = () => {
    try {
      const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.pages || !Array.isArray(parsed.pages)) return null;
      return parsed;
    } catch (cacheErr) {
      console.warn('Could not load report cache:', cacheErr);
      return null;
    }
  };

  const syncIndexPageContent = (data, staticIndexPages = []) => {
    if (!data?.pages || !Array.isArray(data.pages)) {
      return data;
    }

    // Sort pages by backend pageNumber to maintain canonical ordering from database
    const sortedPages = [...data.pages].sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
    const indexPages = sortedPages.filter(p => p.pageType === 'index');

    if (indexPages.length === 0) {
      return data;
    }

    const nonIndexPages = sortedPages.filter(p => p.pageType !== 'index');
    const targetPages = nonIndexPages.filter(p => p.pageType !== 'home');
    const livePagesById = new Map(targetPages.map((p) => [p.id, p]));

    // Update index pages with curated static content
    const curatedStaticIndexPages = [...(staticIndexPages || [])]
      .sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0))
      .map((sp) => {
        // Find matching index page from backend by position
        const matchingBackendIndexPage = indexPages.find(ip => 
          String(ip.id) === String(sp.id) || ip.pageNumber === sp.pageNumber
        );
        
        return {
          ...matchingBackendIndexPage,
          ...sp,
          pageType: 'index',
          title: sp?.title || matchingBackendIndexPage?.title || 'INDEX',
          // Filter index content to only include pages that actually exist
          content: (sp.content || []).filter((item) => livePagesById.has(item.target))
        };
      });

    const staticTargets = new Set(
      curatedStaticIndexPages.flatMap((p) => (p.content || []).map((item) => item.target))
    );

    // Only append dynamic pages with auto-generated IDs (page_<number>).
    // Also block known legacy-like noise titles that should never appear in the appended section.
    const blockedDynamicTitles = new Set(['epcs discrete part numbers']);
    const newPages = targetPages.filter((p) => {
      const pageId = String(p.id || '');
      const normalizedTitle = String(p.title || '').trim().toLowerCase();
      const isAutoCreatedPage = /^page_\d+$/i.test(pageId);
      if (!isAutoCreatedPage) return false;
      if (blockedDynamicTitles.has(normalizedTitle)) return false;
      return !staticTargets.has(pageId);
    });
    const newContent = newPages.map((p) => ({
      title: p.title || p.id,
      target: p.id,
      level: 0
    }));

    let effectiveIndexPages = [];
    if (curatedStaticIndexPages.length > 0) {
      effectiveIndexPages = curatedStaticIndexPages;
      if (newContent.length > 0) {
        const lastIdx = effectiveIndexPages.length - 1;
        const lastIndexPage = effectiveIndexPages[lastIdx] || { title: 'INDEX cntd.', content: [] };
        effectiveIndexPages[lastIdx] = {
          ...lastIndexPage,
          content: [...(lastIndexPage.content || []), ...newContent]
        };
      }
    } else {
      const mergedContent = indexPages.flatMap((p) => (p.content || []));
      effectiveIndexPages = [
        {
          ...indexPages[0],
          title: indexPages[0]?.title || 'INDEX',
          content: [...mergedContent, ...newContent]
        }
      ];
    }

    // Combine index and non-index pages, preserving original backend pageNumbers
    const allPages = [...effectiveIndexPages, ...nonIndexPages];

    // Sort final result by original pageNumber (DO NOT renormalize)
    const resultPages = allPages.sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));

    return { ...data, pages: resultPages };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all pages from backend API
        const pagesFromApi = await apiService.getPages();
        
        // Transform data structure for the app
        const transformedData = transformPagesFromApi(pagesFromApi);

        // Also load static JSON to get the curated index content (levels, targets)
        let staticIndexPages = [];
        try {
          const staticRes = await fetch('/structured_report_data.json');
          if (staticRes.ok) {
            const staticData = await staticRes.json();
            staticIndexPages = (staticData.pages || []).filter(p => p.pageType === 'index');
            staticIndexPagesRef.current = staticIndexPages;
          }
        } catch (e) {
          console.warn('Could not load static index data', e);
        }

        const syncedData = syncIndexPageContent(transformedData, staticIndexPages);
        setReportData(syncedData);
        setOriginalData(JSON.parse(JSON.stringify(syncedData)));
        saveReportCache(syncedData);
      } catch (err) {
        console.error('Error loading report:', err);

        // OFFLINE FALLBACK 1: Load last known report from browser cache.
        const cachedData = loadReportCache();
        if (cachedData) {
          let staticIndexPages = [];
          try {
            const staticRes = await fetch('/structured_report_data.json');
            if (staticRes.ok) {
              const staticData = await staticRes.json();
              staticIndexPages = (staticData.pages || []).filter(p => p.pageType === 'index');
              staticIndexPagesRef.current = staticIndexPages;
            }
          } catch {
            // Ignore static index fetch failure in offline mode.
          }

          const syncedCachedData = syncIndexPageContent(cachedData, staticIndexPages);
          setReportData(syncedCachedData);
          setOriginalData(JSON.parse(JSON.stringify(syncedCachedData)));
          setError(null);
          return;
        }

        // OFFLINE FALLBACK 2: Load bundled static report JSON.
        try {
          const staticRes = await fetch('/structured_report_data.json');
          if (staticRes.ok) {
            const staticData = await staticRes.json();
            const staticPages = (staticData.pages || []).map((page, idx) => ({
              ...page,
              pageNumber: page.pageNumber || idx + 1
            }));

            const staticPayload = { pages: staticPages };
            const staticIndexPages = staticPages.filter(p => p.pageType === 'index');
            staticIndexPagesRef.current = staticIndexPages;
            const syncedStaticData = syncIndexPageContent(staticPayload, staticIndexPages);

            setReportData(syncedStaticData);
            setOriginalData(JSON.parse(JSON.stringify(syncedStaticData)));
            saveReportCache(syncedStaticData);
            setError(null);
            return;
          }
        } catch (staticErr) {
          console.error('Error loading static report fallback:', staticErr);
        }

        setError(err.message || 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEditToggle = () => {
    setIsEditMode(true);
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
        return syncIndexPageContent(updated);
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
        return syncIndexPageContent(updated);
      }

      // Table cell update
      const rowIdx = rowIdxOrPage;
      const tableRows = page.table?.rows || page.table?.data;
      if (Array.isArray(tableRows) && tableRows[rowIdx]) {
        tableRows[rowIdx][colName] = newValue;
      }

      return syncIndexPageContent(updated);
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
      return syncIndexPageContent(updated);
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
        // Handle split-content-image and its variants (partial object updates)
        if (data && typeof data === 'object') {
          if ('title' in data) page.title = data.title;
          if ('content' in data) page.content = data.content;
          if ('imageUrl' in data) page.imageUrl = data.imageUrl;
          if ('leftContent' in data) page.leftContent = data.leftContent;
          if ('leftHeader' in data) page.leftHeader = data.leftHeader;
          if ('rightHeader' in data) page.rightHeader = data.rightHeader;
          if ('layout' in data) page.layout = data.layout;
          if ('leftImageUrl' in data) page.leftImageUrl = data.leftImageUrl;
          if ('titleColor' in data) page.titleColor = data.titleColor;
          if ('leftHeaderColor' in data) page.leftHeaderColor = data.leftHeaderColor;
          if ('rightHeaderColor' in data) page.rightHeaderColor = data.rightHeaderColor;
        } else {
          // Handle regular image pages (string URL)
          page.imageUrl = data;
        }
      }
      return syncIndexPageContent(updated);
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
      return syncIndexPageContent(updated);
    });
    setChangedPages(prev => new Set(prev).add(pageId));
  };


  const handleSave = async () => {
    try {
      // OFFLINE-FIRST: Update local state IMMEDIATELY
      setOriginalData(JSON.parse(JSON.stringify(reportData)));
      setChangedPages(new Set()); // Clear changed pages
      setIsEditMode(false);
      
      console.log('✅ Local changes committed');
      
      // BACKGROUND SYNC: Save to backend without blocking UI (fire-and-forget)
      // User sees save success immediately; backend sync is async and silent
      const pagesToSave = Array.from(changedPages);
      
      for (const pageId of pagesToSave) {
        const page = reportData.pages.find(p => idMatches(p.id, pageId));
        if (page) {
          const payload = { 
            page_data: { ...page }
          };
          apiService.savePage(page.id, payload)
            .then(() => console.log(`✅ Backend save sync completed for page ${pageId}`))
            .catch(err => console.warn(`⚠️ Backend save sync failed for page ${pageId} (offline mode OK):`, err.message));
        }
      }
    } catch (err) {
      console.error('Error in save flow:', err);
      // Don't let errors block the local update
    }
  };

  const handleCancel = () => {
    setReportData(JSON.parse(JSON.stringify(originalData)));
    setChangedPages(new Set()); // Clear changed pages on cancel
    setIsEditMode(false);
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

  const handlePageCreate = async (newPage, options = {}) => {
    try {
      console.log('Page created:', newPage);

      // OFFLINE fallback: create and insert page locally when backend create fails.
      if (options?.localOnly) {
        const localPageId = newPage?.id || newPage?.page_id || newPage?.pageId || `page_${Date.now()}`;
        const localPage = {
          ...newPage,
          id: localPageId,
          title: newPage?.title || 'New Page',
          pageType: newPage?.pageType || newPage?.page_type || 'content'
        };

        const updatedPages = [...(reportData?.pages || [])];
        const refPageId = options?.positionParams?.pageId;
        const insertBefore = Boolean(options?.positionParams?.insertBefore);
        let insertIndex = updatedPages.length;

        if (refPageId) {
          const refIndex = updatedPages.findIndex(p => idMatches(p.id, refPageId));
          if (refIndex >= 0) {
            insertIndex = insertBefore ? refIndex : refIndex + 1;
          }
        }

        updatedPages.splice(insertIndex, 0, localPage);

        let transformedData = { ...reportData, pages: updatedPages };
        transformedData = syncIndexPageContent(transformedData, staticIndexPagesRef.current);

        setReportData(transformedData);
        setOriginalData(JSON.parse(JSON.stringify(transformedData)));
        setIsEditMode(false);
        setChangedPages(new Set());
        saveReportCache(transformedData);

        const insertedPage = transformedData.pages.find(page => idMatches(page.id, localPageId));
        if (insertedPage?.pageNumber) {
          navigate(`/page/${insertedPage.pageNumber}`);
          return insertedPage.pageNumber;
        }

        return null;
      }
      
      // Refresh pages list from backend (this has fallback logic)
      const pagesFromApi = await apiService.getPages();
      console.log('Pages from API after creation:', pagesFromApi);
      
      let transformedData = transformPagesFromApi(pagesFromApi);

      const createdPageId = newPage?.page_id || newPage?.id;

      // Template to behavior flags mapping
      const templateBehaviorFlags = {
        'link-only': { linkOnlyMode: true },
        'mixed-content': { mixedContentMode: true },
        'split-text-image': { splitTextImageMode: true },
        'split-links-image': { splitLinksImageMode: true },
        'split-image-links': { splitImageLinksMode: true },
        'split-image-image': { splitImageImageMode: true },
        'images-gallery': { galleryMode: true },
        'images-carousel': { carouselMode: true },
        'video-gallery': { videoGalleryMode: true }
      };

      const templateId = options?.templateId;
      const behaviorFlags = templateBehaviorFlags[templateId];

      // BACKGROUND SYNC: Apply behavior flags without blocking (fire-and-forget)
      if (behaviorFlags && createdPageId) {
        const createdPage = transformedData.pages.find(page => idMatches(page.id, createdPageId));
        const flagsToAdd = {};
        
        for (const [flagKey, flagValue] of Object.entries(behaviorFlags)) {
          if (!createdPage?.[flagKey]) {
            flagsToAdd[flagKey] = flagValue;
          }
        }

        if (createdPage && Object.keys(flagsToAdd).length > 0) {
          // Don't await - let this sync in background
          apiService.savePage(createdPage.id, {
            page_data: {
              ...createdPage,
              ...flagsToAdd
            }
          }, 'system')
            .then(() => {
              console.log('✅ Behavior flags synced to backend');
              // Optionally refresh to sync behavior flags, but don't block here
              return apiService.getPages();
            })
            .then(pagesAfterFlagSave => {
              console.log('✅ Behavior flags confirmed on backend');
            })
            .catch(err => console.warn('⚠️ Behavior flags sync failed (offline mode OK):', err.message));
        }
      }
      
      // Sync index page with new page numbers
      transformedData = syncIndexPageContent(transformedData, staticIndexPagesRef.current);
      
      setReportData(transformedData);
      setOriginalData(JSON.parse(JSON.stringify(transformedData)));
      saveReportCache(transformedData);
      
      // Exit edit mode after creating page
      setIsEditMode(false);
      setChangedPages(new Set());

      let redirectPageNumber = null;

      if (createdPageId) {
        const createdPage = transformedData.pages.find(page => idMatches(page.id, createdPageId));
        if (createdPage?.pageNumber) {
          redirectPageNumber = createdPage.pageNumber;
        }
      }

      if (!redirectPageNumber && newPage?.page_number) {
        const apiPageNumber = Number(newPage.page_number);
        if (Number.isFinite(apiPageNumber)) {
          const matchingPage = transformedData.pages.find(page => page.pageNumber === apiPageNumber);
          if (matchingPage?.pageNumber) {
            redirectPageNumber = matchingPage.pageNumber;
          }
        }
      }

      if (!redirectPageNumber && transformedData.pages.length > 0) {
        redirectPageNumber = Math.max(...transformedData.pages.map(page => page.pageNumber || 0));
      }

      if (redirectPageNumber) {
        navigate(`/page/${redirectPageNumber}`);
      }
      
      console.log('✅ Page created successfully:', newPage);
      return redirectPageNumber;
    } catch (err) {
      console.error('Error creating page:', err);
      return null;
    }
  };

  const handleOpenDeleteDialog = (page) => {
    const normalizedPage = page
      ? { ...page, id: page.id || page.page_id || page.pageId }
      : null;
    setPageToDelete(normalizedPage);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async (pageId) => {
    const resolvedPageId = pageId || pageToDelete?.id || pageToDelete?.page_id || pageToDelete?.pageId;
    if (!resolvedPageId) {
      console.error('❌ Cannot delete page: missing page id');
      return;
    }

    try {
      setIsDeletingPageId(resolvedPageId);
      console.log('🗑️ Deleting page:', resolvedPageId);
      
      // Get current page number being deleted
      const pageBeingDeleted = reportData.pages.find(p => idMatches((p.id || p.page_id || p.pageId), resolvedPageId));
      const pageNumberDeleted = pageBeingDeleted?.pageNumber;
      console.log('📄 Page being deleted - number:', pageNumberDeleted);

      // OFFLINE-FIRST: Update local state IMMEDIATELY before any API calls
      const updatedPages = reportData.pages.filter(p => !idMatches((p.id || p.page_id || p.pageId), resolvedPageId));
      let transformedData = { ...reportData, pages: updatedPages };
      
      // Sync index page with new page numbers
      transformedData = syncIndexPageContent(transformedData, staticIndexPagesRef.current);

      setReportData(transformedData);
      setOriginalData(JSON.parse(JSON.stringify(transformedData)));
      setIsDeleteDialogOpen(false);
      setPageToDelete(null);
      
      // Determine where to redirect after deletion
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
          navigate(`/page/${redirectPageNumber}`);
        } else {
          console.warn(`⚠️ Redirect page ${redirectPageNumber} exceeds total ${totalRemainingPages}, going to Index`);
          navigate('/page/1');
        }
      }
      
      // BACKGROUND SYNC: Delete from backend without blocking UI (fire-and-forget)
      // User sees delete immediately; backend sync is async and silent
      apiService.deletePage(resolvedPageId)
        .then(() => console.log('✅ Backend delete sync completed'))
        .catch(err => console.warn('⚠️ Backend delete sync failed (offline mode OK):', err.message));
      
      console.log('✅ Page deleted locally, backend sync in progress');
    } catch (err) {
      console.error('❌ Error in delete flow:', err);
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

      // OFFLINE-FIRST: Update local state IMMEDIATELY
      let transformedData = { ...reportData };
      
      // Reorder pages based on the new order
      const reorderedPages = pageOrder
        .map((pageId, index) => {
          const page = transformedData.pages.find(p => idMatches((p.id || p.page_id || p.pageId), pageId));
          if (page) {
            return { ...page, pageNumber: index + 1 };
          }
          return null;
        })
        .filter(Boolean);

      if (reorderedPages.length !== pageOrder.length) {
        throw new Error('Invalid page order ids');
      }

      transformedData.pages = reorderedPages;

      // Sync index page with new page numbers
      transformedData = syncIndexPageContent(transformedData, staticIndexPagesRef.current);

      setReportData(transformedData);
      setOriginalData(JSON.parse(JSON.stringify(transformedData)));
      
      console.log('✅ Pages reordered locally');

      // BACKGROUND SYNC: Update backend without blocking UI (fire-and-forget)
      apiService.reorderPages(pageOrder)
        .then(() => console.log('✅ Backend reorder sync completed'))
        .catch(err => console.warn('⚠️ Backend reorder sync failed (offline mode OK):', err.message));
      
      return true;
    } catch (err) {
      console.error('❌ Error in reorder flow:', err);
      return false;
    } finally {
      setIsReordering(false);
    }
  };

  const handleNavigateToPage = (pageNumber) => {
    // Will be called from page manager to navigate to a specific page
    navigate(`/page/${pageNumber}`);
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
        existingPages={reportData?.pages || []}
      />
      <DeletePageDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setPageToDelete(null);
        }}
        page={pageToDelete}
        onConfirmDelete={handleConfirmDelete}
        isDeleting={idMatches(isDeletingPageId, pageToDelete?.id)}
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
        <Route path="/page/:pageId" element={<ReportPage reportData={reportData} isEditMode={isEditMode} hasUnsavedChanges={changedPages.size > 0} onEditToggle={handleEditToggle} onUndo={handleUndoAll} onPublish={handlePublish} onCellChange={handleCellChange} onHeadingChange={handleHeadingChange} onImageChange={handleImageChange} onIndexChange={handleIndexChange} onSave={handleSave} onCancel={handleCancel} onImageClick={handleImageClick} onAddPage={handleOpenAddPageDialog} onDeletePage={handleOpenDeleteDialog} onManagePages={() => setIsPageManagerOpen(true)} isTestMode={isTestMode} isSeedingTestData={isSeedingTestData} isPublishingTestData={isPublishingTestData} onToggleTestMode={handleToggleTestMode} onSeedTestData={handleSeedTestData} onPublishTestData={handlePublishTestData} />} />
        <Route path="*" element={<div className="App"><p>Page not found</p></div>} />
      </Routes>
    </>
  );
}

export default App;
