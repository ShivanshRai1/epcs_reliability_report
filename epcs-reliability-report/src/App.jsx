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
        pageTemplate: page.page_template,
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

        const staticContent = (sp.content || []).filter((item) => livePagesById.has(item.target));
        const backendContent = Array.isArray(matchingBackendIndexPage?.content)
          ? matchingBackendIndexPage.content.filter((item) => item && item.target)
          : [];

        // Keep static ordering but overlay backend edits (title/level) by target.
        const backendByTarget = new Map(
          backendContent.map((item) => [String(item.target), item])
        );
        const mergedContent = staticContent.map((item) => {
          const backendItem = backendByTarget.get(String(item.target));
          return backendItem
            ? { ...item, ...backendItem, target: item.target }
            : item;
        });

        // Keep backend-only links visible too (e.g., newly added manual index items).
        const staticTargets = new Set(staticContent.map((item) => String(item.target)));
        const backendExtras = backendContent.filter(
          (item) => !staticTargets.has(String(item.target)) && livePagesById.has(item.target)
        );
        
        // Preserve display settings saved by the user in the editor (not present in static baseline)
        const displaySettings = {};
        const DISPLAY_KEYS = ['fontFamily', 'textColor', 'contentTextColor', 'titleFontSize', 'headerFontSize', 'contentFontSize'];
        if (matchingBackendIndexPage) {
          DISPLAY_KEYS.forEach(k => {
            if (matchingBackendIndexPage[k] !== undefined) displaySettings[k] = matchingBackendIndexPage[k];
          });
        }

        return {
          ...matchingBackendIndexPage,
          ...sp,
          ...displaySettings,
          pageType: 'index',
          // Preserve backend-edited page title when present.
          title: matchingBackendIndexPage?.title || sp?.title || 'INDEX',
          content: [...mergedContent, ...backendExtras]
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

  const alignPageNumbersWithStatic = (data, staticPages = []) => {
    if (!data?.pages || !Array.isArray(data.pages) || !Array.isArray(staticPages) || staticPages.length === 0) {
      return data;
    }

    const normalizeText = (value) => String(value || '').trim().toLowerCase();
    const staticOrdered = [...staticPages].sort((a, b) => (a?.pageNumber || 0) - (b?.pageNumber || 0));
    const liveById = new Map(data.pages.map((p) => [String(p?.id ?? ''), p]));
    const usedLiveIds = new Set();

    // Build canonical sequence from static baseline, but only using real backend pages.
    const canonicalPages = [];
    for (const staticPage of staticOrdered) {
      const staticId = String(staticPage?.id ?? '');
      const staticType = String(staticPage?.pageType || '');
      const staticTitle = normalizeText(staticPage?.title);
      const staticSubtitle = normalizeText(staticPage?.subtitle);

      let matchedLive = null;
      const liveByStaticId = liveById.get(staticId);
      if (liveByStaticId && !usedLiveIds.has(String(liveByStaticId?.id ?? ''))) {
        matchedLive = liveByStaticId;
      }

      if (!matchedLive) {
        const unmatchedCandidates = data.pages.filter((page) => !usedLiveIds.has(String(page?.id ?? '')));

        matchedLive = unmatchedCandidates.find((page) => {
          if (String(page?.pageType || '') !== staticType) return false;
          return normalizeText(page?.title) === staticTitle;
        }) || null;

        if (!matchedLive && staticType === 'heading' && staticSubtitle) {
          matchedLive = unmatchedCandidates.find((page) => {
            if (String(page?.pageType || '') !== 'heading') return false;
            return normalizeText(page?.title) === staticSubtitle;
          }) || null;
        }
      }

      if (matchedLive) {
        usedLiveIds.add(String(matchedLive?.id ?? ''));
        canonicalPages.push({
          ...matchedLive,
          pageNumber: canonicalPages.length + 1
        });
      }
    }

    // Keep additional backend-only pages accessible after canonical pages, preserving their relative order.
    const extraPages = data.pages
      .filter((p) => !usedLiveIds.has(String(p?.id ?? '')))
      .sort((a, b) => (a?.pageNumber || 0) - (b?.pageNumber || 0))
      .map((p, idx) => ({
        ...p,
        pageNumber: canonicalPages.length + idx + 1
      }));

    return {
      ...data,
      pages: [...canonicalPages, ...extraPages]
    };
  };

  useEffect(() => {
    const fetchData = async () => {
      let staticData = null;
      let staticIndexPages = [];

      try {
        const staticRes = await fetch('/structured_report_data.json');
        if (staticRes.ok) {
          staticData = await staticRes.json();
          staticIndexPages = (staticData.pages || []).filter(p => p.pageType === 'index');
          staticIndexPagesRef.current = staticIndexPages;
        }
      } catch (e) {
        console.warn('Could not load static report baseline', e);
      }

      try {
        // Fetch all pages from backend API with cache-bust for fresh data.
        // Trust backend ordering on successful loads so inserted pages keep their real positions.
        let pagesFromApi = await apiService.getPages(true); // forceFresh = true to bypass browser cache
        
        // Transform data structure for the app
        let transformedData = transformPagesFromApi(pagesFromApi);

        const staticPageCount = Array.isArray(staticData?.pages) ? staticData.pages.length : 0;
        const isSuspiciouslyLow = staticPageCount > 0 && transformedData.pages.length < staticPageCount;

        // Retry once when API returns fewer pages than the known static baseline.
        if (isSuspiciouslyLow) {
          try {
            const retryPages = await apiService.getPages(true); // forceFresh = true
            const retriedData = transformPagesFromApi(retryPages);
            if (retriedData.pages.length >= staticPageCount) {
              transformedData = retriedData;
            }
          } catch {
            // Ignore retry failure and continue to baseline fallback below.
          }
        }

        const finalSuspicious = staticPageCount > 0 && transformedData.pages.length < staticPageCount;
        // Only fall back to static if we're SIGNIFICANTLY below (more than 10% fewer pages)
        // This prevents discarding newly created custom pages while still catching real corruption
        const significantlyLow = staticPageCount > 0 && (transformedData.pages.length < staticPageCount * 0.9);
        
        if (significantlyLow && staticPageCount > 0) {
          console.warn(`⚠️ Backend returned significantly fewer pages (${transformedData.pages.length} vs ${staticPageCount} baseline), falling back to static data`);
          const staticPages = (staticData.pages || []).map((page, idx) => ({
            ...page,
            pageNumber: page.pageNumber || idx + 1
          }));

          const staticPayload = { pages: staticPages };
          const syncedStaticData = syncIndexPageContent(staticPayload, staticIndexPages);
          setReportData(syncedStaticData);
          setOriginalData(JSON.parse(JSON.stringify(syncedStaticData)));
          saveReportCache(syncedStaticData);
          setError(null);
          return;
        } else if (finalSuspicious) {
          console.log(`ℹ️ Backend has fewer pages than baseline (${transformedData.pages.length} vs ${staticPageCount}), but within tolerance. Using backend data.`);
        }

        const syncedData = syncIndexPageContent(transformedData, staticIndexPages);
        setReportData(syncedData);
        setOriginalData(JSON.parse(JSON.stringify(syncedData)));
        saveReportCache(syncedData);
      } catch (err) {
        console.error('Error loading report:', err);

        // OFFLINE FALLBACK 1: Prefer bundled static report JSON over cache.
        // This avoids persisting or reusing transient partial API datasets.
        if (staticData?.pages && Array.isArray(staticData.pages) && staticData.pages.length > 0) {
          const staticPages = (staticData.pages || []).map((page, idx) => ({
            ...page,
            pageNumber: page.pageNumber || idx + 1
          }));

          const staticPayload = { pages: staticPages };
          const syncedStaticData = syncIndexPageContent(staticPayload, staticIndexPages);

          setReportData(syncedStaticData);
          setOriginalData(JSON.parse(JSON.stringify(syncedStaticData)));
          saveReportCache(syncedStaticData);
          setError(null);
          return;
        }

        // OFFLINE FALLBACK 2: Load last known report from browser cache.
        const cachedData = loadReportCache();
        if (cachedData) {
          const syncedCachedData = syncIndexPageContent(cachedData, staticIndexPages);
          setReportData(syncedCachedData);
          setOriginalData(JSON.parse(JSON.stringify(syncedCachedData)));
          setError(null);
          return;
        }

        setError(err.message || 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Refetch data when live mode window gets focus (shows newly added pages)
  useEffect(() => {
    const isLiveMode = new URLSearchParams(window.location.search).get('live') === '1';
    if (!isLiveMode) return;

    const handleFocus = async () => {
      console.log('🔄 Live window focused - refreshing data...');
      try {
        // Get latest pages from backend with cache-bust and keep backend ordering intact.
        const pagesFromApi = await apiService.getPages(true); // forceFresh = true
        const transformedData = transformPagesFromApi(pagesFromApi);
        const syncedData = syncIndexPageContent(transformedData, staticIndexPagesRef.current);
        
        setReportData(syncedData);
        saveReportCache(syncedData);
        console.log('✅ Data refreshed');
      } catch (err) {
        console.warn('Could not refresh data:', err);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
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
        return syncIndexPageContent(updated, staticIndexPagesRef.current);
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
        return syncIndexPageContent(updated, staticIndexPagesRef.current);
      }

      // Table cell update
      const rowIdx = rowIdxOrPage;
      const tableRows = page.table?.rows || page.table?.data;
      if (Array.isArray(tableRows) && tableRows[rowIdx]) {
        tableRows[rowIdx][colName] = newValue;
      }

      return syncIndexPageContent(updated, staticIndexPagesRef.current);
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
      return syncIndexPageContent(updated, staticIndexPagesRef.current);
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
          if ('textColor' in data) page.textColor = data.textColor;
          if ('contentTextColor' in data) page.contentTextColor = data.contentTextColor;
          if ('fontFamily' in data) page.fontFamily = data.fontFamily;
          if ('titleFontSize' in data) page.titleFontSize = data.titleFontSize;
          if ('headerFontSize' in data) page.headerFontSize = data.headerFontSize;
          if ('contentFontSize' in data) page.contentFontSize = data.contentFontSize;
          if ('imageWidth' in data) page.imageWidth = data.imageWidth;
          if ('imageHeight' in data) page.imageHeight = data.imageHeight;
          if ('leftImageWidth' in data) page.leftImageWidth = data.leftImageWidth;
          if ('leftImageHeight' in data) page.leftImageHeight = data.leftImageHeight;
          if ('rightImageWidth' in data) page.rightImageWidth = data.rightImageWidth;
          if ('rightImageHeight' in data) page.rightImageHeight = data.rightImageHeight;
        } else {
          // Handle regular image pages (string URL)
          page.imageUrl = data;
        }
      }
      return syncIndexPageContent(updated, staticIndexPagesRef.current);
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
      return syncIndexPageContent(updated, staticIndexPagesRef.current);
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
      
      // Refresh pages list from backend with cache-bust to ensure new page is fetched
      const pagesFromApi = await apiService.getPages(true); // forceFresh = true
      console.log('Pages from API after creation:', pagesFromApi);
      
      let transformedData = transformPagesFromApi(pagesFromApi);
      const createdPageId = newPage?.page_id || newPage?.id;

      // Verify the newly created page exists in the backend response
      const pageExistsInApi = transformedData.pages.some(p => idMatches(p.id, createdPageId));
      
      if (!pageExistsInApi && createdPageId) {
        console.warn(`⚠️ Created page ${createdPageId} not found in first fetch, retrying...`);
        try {
          // Retry once more to ensure page is persisted, also with cache-bust
          const retryPagesFromApi = await apiService.getPages(true); // forceFresh = true
          const retryTransformedData = transformPagesFromApi(retryPagesFromApi);
          const pageExistsOnRetry = retryTransformedData.pages.some(p => idMatches(p.id, createdPageId));
          
          if (pageExistsOnRetry) {
            console.log('✅ Page found on retry');
            transformedData = retryTransformedData;
          } else {
            console.warn('⚠️ Page still not found after retry, continuing anyway (may be API lag)');
          }
        } catch (retryErr) {
          console.warn('⚠️ Retry fetch failed:', retryErr.message);
        }
      } else if (pageExistsInApi) {
        console.log('✅ Created page confirmed in backend:', createdPageId);
      }

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

      // Apply behavior flags immediately in local state so UI mode is correct
      // right after redirect (before background save/refresh completes).
      if (behaviorFlags && createdPageId) {
        transformedData = {
          ...transformedData,
          pages: transformedData.pages.map((page) => {
            if (!idMatches(page.id, createdPageId)) return page;
            return { ...page, ...behaviorFlags };
          })
        };
      }

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
