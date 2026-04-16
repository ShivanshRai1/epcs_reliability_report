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
import PublishSelectionModal from './components/PublishSelectionModal';
import { apiService } from './services/api';

const OFFLINE_CACHE_KEY = 'epcs_report_cache_v2';
const DRAFT_CACHE_KEY = 'epcs_report_draft_v1';
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
  const [savedDraftPages, setSavedDraftPages] = useState(new Set());
  const [pendingCreates, setPendingCreates] = useState([]);
  const [pendingDeletes, setPendingDeletes] = useState([]);
  const [pendingReorder, setPendingReorder] = useState(null);
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
  const [isPublishSelectionModalOpen, setIsPublishSelectionModalOpen] = useState(false);
  const [selectedPublishChanges, setSelectedPublishChanges] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isTestMode, setIsTestMode] = useState(() => apiService.getTestModeState().enabled);
  const [isSeedingTestData, setIsSeedingTestData] = useState(false);
  const [isPublishingTestData, setIsPublishingTestData] = useState(false);
  const [isRestoringOriginal, setIsRestoringOriginal] = useState(false);
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

  const handleRestoreOriginalData = async () => {
    try {
      setIsRestoringOriginal(true);

      // First confirmation
      const confirmed1 = window.confirm(
        '⚠️ WARNING: This will permanently delete ALL current production data and restore the original 51 pages.\n\n' +
        'This action cannot be undone. Are you sure you want to continue?'
      );
      if (!confirmed1) return;

      // Second confirmation
      const confirmed2 = window.confirm(
        '🔴 FINAL WARNING: This will erase all pages, edits, and changes made to production data.\n\n' +
        'Only the original 51 pages will remain. Are you absolutely sure?'
      );
      if (!confirmed2) return;

      // Load the original data from static JSON
      console.log('📥 Loading original data from static JSON...');
      const staticRes = await fetch('/structured_report_data.json');
      if (!staticRes.ok) {
        throw new Error('Failed to load original data file');
      }
      const originalData = await staticRes.json();

      if (!originalData.pages || !Array.isArray(originalData.pages)) {
        throw new Error('Invalid original data format');
      }

      // Transform frontend format to backend format
      const backendPages = originalData.pages.map(page => ({
        page_id: page.id,
        page_number: page.pageNumber,
        position: page.pageNumber,
        page_type: page.pageType,
        page_template: page.pageTemplate || page.pageType,
        title: page.title,
        page_data: page
      }));

      console.log(`🔄 Restoring ${backendPages.length} original pages...`);

      // Call the restore API
      const result = await apiService.restoreOriginalData(backendPages);

      // Clear local cache
      localStorage.removeItem(OFFLINE_CACHE_KEY);

      window.alert(
        `✅ Original data restored successfully!\n\n` +
        `Pages restored: ${result.pages_restored}\n` +
        `Extra pages removed: ${result.extra_pages_removed}\n\n` +
        `The app will now reload.`
      );

      // Reload the app
      window.location.reload();

    } catch (err) {
      console.error('Error restoring original data:', err);
      window.alert(`❌ Failed to restore original data: ${err.message}`);
    } finally {
      setIsRestoringOriginal(false);
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
  const normalizeComparableText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

  const isAlreadyPublishedPage = (draftPage, backendPages = []) => {
    const draftNumber = normalizeComparableText(draftPage?.pageNumber);
    const draftTitle = normalizeComparableText(draftPage?.title || draftPage?.heading);

    return backendPages.some((backendPage) => {
      if (backendPage?._isDraftNew) return false;

      const backendNumber = normalizeComparableText(backendPage?.pageNumber);
      const backendTitle = normalizeComparableText(backendPage?.title || backendPage?.heading);
      const numberMatches = draftNumber && backendNumber === draftNumber;
      const titleMatches = draftTitle && backendTitle === draftTitle;

      if (draftNumber && draftTitle) {
        return numberMatches && titleMatches;
      }

      return Boolean(numberMatches || titleMatches);
    });
  };

  const getTableRows = (table) => {
    if (!table || typeof table !== 'object') return [];
    if (Array.isArray(table.rows)) return table.rows;
    if (Array.isArray(table.data)) return table.data;
    return [];
  };

  const getTableRowStyleKey = (row, idx) => {
    if (!row || typeof row !== 'object') return `idx:${idx}`;
    return String(
      row['PART NUMBER'] ??
      row['Part Number'] ??
      row['BASE PART'] ??
      row['Base Part'] ??
      row.id ??
      `idx:${idx}`
    );
  };

  const restoreMissingTableStyles = (candidatePage, sourcePage) => {
    if (!candidatePage?.table || !sourcePage?.table) return candidatePage;

    const candidateRows = getTableRows(candidatePage.table);
    const sourceRows = getTableRows(sourcePage.table);
    if (!candidateRows.length || !sourceRows.length) return candidatePage;

    const sourceByKey = new Map(
      sourceRows.map((row, idx) => [getTableRowStyleKey(row, idx), row])
    );

    let hasRepairs = false;
    const repairedRows = candidateRows.map((row, idx) => {
      if (!row || typeof row !== 'object') return row;

      const sourceRow = sourceByKey.get(getTableRowStyleKey(row, idx)) || sourceRows[idx];
      if (!sourceRow || typeof sourceRow !== 'object') return row;

      const repairedRow = { ...row };
      if ((repairedRow.rowColor == null || repairedRow.rowColor === '') && sourceRow.rowColor) {
        repairedRow.rowColor = sourceRow.rowColor;
        hasRepairs = true;
      }
      if ((repairedRow.rowClass == null || repairedRow.rowClass === '') && sourceRow.rowClass) {
        repairedRow.rowClass = sourceRow.rowClass;
        hasRepairs = true;
      }
      Object.keys(sourceRow).forEach((key) => {
        if (/(Rowspan|Colspan)$/.test(key) && (repairedRow[key] == null || repairedRow[key] === '')) {
          repairedRow[key] = sourceRow[key];
          hasRepairs = true;
        }
      });
      return repairedRow;
    });

    if (!hasRepairs) return candidatePage;

    if (Array.isArray(candidatePage.table.rows)) {
      return { ...candidatePage, table: { ...candidatePage.table, rows: repairedRows } };
    }
    if (Array.isArray(candidatePage.table.data)) {
      return { ...candidatePage, table: { ...candidatePage.table, data: repairedRows } };
    }
    return candidatePage;
  };

  const mergeDraftWithFreshPages = (draftData, freshData) => {
    if (!draftData?.pages || !freshData?.pages) return draftData;

    const freshById = new Map(freshData.pages.map((page) => [String(page?.id ?? ''), page]));
    return {
      ...draftData,
      pages: draftData.pages.map((draftPage) => {
        const freshPage = freshById.get(String(draftPage?.id ?? ''));
        return freshPage ? restoreMissingTableStyles(draftPage, freshPage) : draftPage;
      })
    };
  };

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

    const saveDraftCache = (
  data,
  pendingPageIds = [],
  creates = [],
  deletes = [],
  reorder = null
) => {
  try {
    if (!data?.pages || !Array.isArray(data.pages)) return;
    localStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify({
      data,
      pendingPageIds,
      pendingCreates: creates,
      pendingDeletes: deletes,
      pendingReorder: reorder
    }));
  } catch (draftErr) {
    console.warn('Could not persist draft cache:', draftErr);
  }
};

const loadDraftCache = () => {
  try {
    const raw = localStorage.getItem(DRAFT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.data?.pages || !Array.isArray(parsed.data.pages)) return null;
    return parsed;
  } catch (draftErr) {
    console.warn('Could not load draft cache:', draftErr);
    return null;
  }
};

const clearDraftCache = () => {
  try {
    localStorage.removeItem(DRAFT_CACHE_KEY);
  } catch (draftErr) {
    console.warn('Could not clear draft cache:', draftErr);
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
    const matchedIndexPageKeys = new Set();
    const getIndexPageKey = (page) => `${String(page?.id ?? '')}::${String(page?.pageNumber ?? '')}`;

    const curatedStaticIndexPages = [...(staticIndexPages || [])]
      .sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0))
      .map((sp) => {
        // Find matching index page from backend by position
        const matchingBackendIndexPage = indexPages.find(ip => 
          String(ip.id) === String(sp.id) || ip.pageNumber === sp.pageNumber
        );

        if (matchingBackendIndexPage) {
          matchedIndexPageKeys.add(getIndexPageKey(matchingBackendIndexPage));
        }

        // Use ALL static content items (unfiltered) so legacy index entries always display.
        // Only filter the dynamic "page_X" extras by livePagesById to avoid dead links.
        const rawStaticContent = sp.content || [];
        const backendContent = Array.isArray(matchingBackendIndexPage?.content)
          ? matchingBackendIndexPage.content.filter((item) => item && item.target)
          : [];

        // Preserve display settings saved by the user in the editor (not present in static baseline)
        const displaySettings = {};
        const DISPLAY_KEYS = ['fontFamily', 'textColor', 'contentTextColor', 'titleFontSize', 'headerFontSize', 'contentFontSize'];
        if (matchingBackendIndexPage) {
          DISPLAY_KEYS.forEach(k => {
            if (matchingBackendIndexPage[k] !== undefined) displaySettings[k] = matchingBackendIndexPage[k];
          });
        }

        // Build backend queues for overlay/merge.
        const backendByTargetQueues = new Map();
        backendContent.forEach((item) => {
          const key = String(item.target);
          if (!backendByTargetQueues.has(key)) backendByTargetQueues.set(key, []);
          backendByTargetQueues.get(key).push(item);
        });

        const staticLevelByTarget = new Map();
        rawStaticContent.forEach((item) => {
          const key = String(item?.target || '');
          if (!key) return;
          if (!staticLevelByTarget.has(key)) {
            staticLevelByTarget.set(key, Number(item?.level) || 0);
          }
        });

        const pickUsableTarget = (staticTarget, backendTarget) => {
          const backendKey = String(backendTarget || '');
          const staticKey = String(staticTarget || '');
          if (backendKey && livePagesById.has(backendKey)) return backendKey;
          if (staticKey && livePagesById.has(staticKey)) return staticKey;
          return backendKey || staticKey;
        };

        // Keep valid internal page targets and allow true external link targets.
        // This removes stale/orphan index entries after page deletions.
        const isExternalTarget = (target) => /^(https?:\/\/|www\.|mailto:|tel:|#)/i.test(String(target || '').trim());
        const isActiveTarget = (target) => {
          const key = String(target || '').trim();
          if (!key) return false;
          return livePagesById.has(key) || isExternalTarget(key);
        };

        // Defer fully to backend ONLY when it has >= 70% of the raw unfiltered static item count.
        // Defer fully to backend ONLY when it has >= 70% of the raw unfiltered static item count
        // AND the majority of its items point to real pages (valid targets in livePagesById).
        // This guards against corrupted/abbreviated targets (e.g. 'qci' instead of
        // 'quality_conformance_inspection') that cause dead links and broken hierarchy.
        const rawStaticCount = rawStaticContent.length;
        const validBackendTargetCount = backendContent.filter(
          (item) => item?.target && livePagesById.has(String(item.target))
        ).length;
        const backendHasValidTargets = backendContent.length === 0 ||
          validBackendTargetCount >= backendContent.length * 0.5;
        const backendLooksEdited = backendContent.length > 0 &&
          (rawStaticCount === 0 || backendContent.length >= rawStaticCount * 0.7) &&
          backendHasValidTargets;

        if (backendLooksEdited) {
          const normalizedBackendContent = backendContent.map((item) => {
            const targetKey = String(item?.target || '');
            return {
              ...item,
              target: pickUsableTarget(targetKey, targetKey),
              level: staticLevelByTarget.has(targetKey)
                ? staticLevelByTarget.get(targetKey)
                : (Number(item?.level) || 0)
            };
          }).filter((item) => isActiveTarget(item?.target));

          return {
            ...matchingBackendIndexPage,
            ...displaySettings,
            pageType: 'index',
            title: sp?.title || matchingBackendIndexPage?.title || 'INDEX',
            content: normalizedBackendContent
          };
        }

        // Static merge path: overlay backend edits onto the full static list.
        const mergedContent = rawStaticContent.map((item) => {
          const key = String(item.target);
          const queue = backendByTargetQueues.get(key) || [];
          const backendItem = queue.length > 0 ? queue.shift() : null;
          return backendItem
            ? {
                ...item,
                ...backendItem,
                target: pickUsableTarget(item.target, backendItem.target),
                level: item.level
              }
            : item;
          }).filter((item) => isActiveTarget(item?.target));

        // Append backend-only items (e.g. newly added dynamic pages) not in the static list.
        const backendExtras = Array.from(backendByTargetQueues.values())
          .flat()
          .filter((item) => item && isActiveTarget(item.target));

        return {
          ...matchingBackendIndexPage,
          ...sp,
          ...displaySettings,
          pageType: 'index',
          title: sp?.title || matchingBackendIndexPage?.title || 'INDEX',
          content: [...mergedContent, ...backendExtras]
        };
      });

    const extraBackendIndexPages = indexPages
      .filter((page) => !matchedIndexPageKeys.has(getIndexPageKey(page)))
      .sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));

    const staticTargets = new Set(
      curatedStaticIndexPages.flatMap((p) => (p.content || []).map((item) => item.target))
    );

    // Helper to get a readable title for new pages based on template or page type
    const getPageDisplayName = (page) => {
      if (page.title && String(page.title).trim()) {
        return String(page.title).trim();
      }
      const templateMap = {
        'text-only': 'Text',
        'heading': 'Heading',
        'table': 'Table',
        'image': 'Image',
        'just-images': 'Images',
        'split-text-image': 'Split Text + Image',
        'split-links-image': 'Split Links + Image',
        'split-image-links': 'Split Image + Links',
        'split-image-image': 'Split Image + Image',
        'split-content': 'Split Content',
        'content': 'Content'
      };
      const template = String(page.pageTemplate || page.page_template || page.pageType || '').toLowerCase();
      return templateMap[template] || 'New Page';
    };

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
      title: getPageDisplayName(p),
      target: p.id,
      level: 0
    }));

    // Insert new page entries at the correct position based on page order, not just appended to end.
    const insertNewContentItems = (idxPages, items) => {
      if (items.length === 0) return idxPages;
      const pageOrderMap = new Map(targetPages.map((p, i) => [String(p.id), i]));
      let result = idxPages.map(p => ({ ...p, content: [...(p.content || [])] }));
      for (const newItem of items) {
        const newItemOrder = pageOrderMap.get(String(newItem.target));
        if (newItemOrder === undefined) {
          // Can't determine order — fall back to appending to last page
          const lastIdx = result.length - 1;
          result[lastIdx] = { ...result[lastIdx], content: [...result[lastIdx].content, newItem] };
          continue;
        }
        let bestIndexPageIdx = result.length - 1;
        let bestInsertPos = result[result.length - 1].content.length; // default: append to end of last page
        let bestTargetPageOrder = -1;
        let nextIndexPageIdx = -1;
        let nextInsertPos = -1;
        let nextTargetPageOrder = Number.POSITIVE_INFINITY;
        for (let ipIdx = 0; ipIdx < result.length; ipIdx++) {
          const content = result[ipIdx].content;
          for (let cIdx = 0; cIdx < content.length; cIdx++) {
            const itemOrder = pageOrderMap.get(String(content[cIdx]?.target ?? ''));
            if (itemOrder !== undefined && itemOrder < newItemOrder && itemOrder > bestTargetPageOrder) {
              bestTargetPageOrder = itemOrder;
              bestIndexPageIdx = ipIdx;
              bestInsertPos = cIdx + 1;
            }
            if (itemOrder !== undefined && itemOrder > newItemOrder && itemOrder < nextTargetPageOrder) {
              nextTargetPageOrder = itemOrder;
              nextIndexPageIdx = ipIdx;
              nextInsertPos = cIdx;
            }
          }
        }
        if (bestTargetPageOrder < 0 && nextIndexPageIdx >= 0 && nextInsertPos >= 0) {
          bestIndexPageIdx = nextIndexPageIdx;
          bestInsertPos = nextInsertPos;
        }
        const updated = { ...result[bestIndexPageIdx], content: [...result[bestIndexPageIdx].content] };
        updated.content.splice(bestInsertPos, 0, newItem);
        result = [...result.slice(0, bestIndexPageIdx), updated, ...result.slice(bestIndexPageIdx + 1)];
      }
      return result;
    };

    let effectiveIndexPages = [];
    if (curatedStaticIndexPages.length > 0) {
      effectiveIndexPages = insertNewContentItems(
        [...curatedStaticIndexPages, ...extraBackendIndexPages],
        newContent
      );
    } else {
      const mergedContent = indexPages.flatMap((p) => (p.content || []));
      const baseIndexPage = {
        ...indexPages[0],
        title: indexPages[0]?.title || 'INDEX',
        content: mergedContent
      };
      effectiveIndexPages = insertNewContentItems([baseIndexPage], newContent);
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

  const mergeStaticBaselineWithLiveData = (staticPages = [], liveData = null) => {
    const normalizedStaticPages = (staticPages || []).map((page, idx) => ({
      ...page,
      pageNumber: page.pageNumber || idx + 1
    }));

    if (!liveData?.pages || !Array.isArray(liveData.pages) || liveData.pages.length === 0) {
      return { pages: normalizedStaticPages };
    }

    const matchedLiveIds = new Set();
    const mergedStaticPages = normalizedStaticPages.map((staticPage) => {
      const matchedLivePage = liveData.pages.find((livePage) =>
        idMatches(livePage?.id, staticPage?.id)
      );

      if (!matchedLivePage) {
        return staticPage;
      }

      matchedLiveIds.add(String(matchedLivePage?.id ?? ''));

      return {
        ...staticPage,
        ...matchedLivePage,
        id: matchedLivePage.id || staticPage.id,
        pageNumber: matchedLivePage.pageNumber || staticPage.pageNumber,
        pageType: matchedLivePage.pageType || staticPage.pageType,
        pageTemplate: matchedLivePage.pageTemplate || staticPage.pageTemplate,
        title: matchedLivePage.title ?? staticPage.title
      };
    });

    const liveExtraPages = liveData.pages
      .filter((livePage) => !matchedLiveIds.has(String(livePage?.id ?? '')))
      .sort((a, b) => (a?.pageNumber || 0) - (b?.pageNumber || 0));

    return {
      ...liveData,
      pages: [...mergedStaticPages, ...liveExtraPages]
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

        const isInitialLiveMode = new URLSearchParams(window.location.search).get('live') === '1';
        const savedDraft = isInitialLiveMode ? null : loadDraftCache();

        if (savedDraft?.data?.pages?.length) {
          console.log('📝 Loading saved draft changes for normal mode');
            const freshBackendData = transformedData;

          const savedPendingCreates = Array.isArray(savedDraft.pendingCreates) ? savedDraft.pendingCreates : [];
          const removedPublishedCreateIds = new Set(
            savedPendingCreates
                .filter((draftPage) => isAlreadyPublishedPage(draftPage, freshBackendData.pages))
              .map((draftPage) => String(draftPage?.id ?? ''))
          );

          const cleanedPendingCreates = savedPendingCreates.filter(
            (draftPage) => !removedPublishedCreateIds.has(String(draftPage?.id ?? ''))
          );
          const cleanedPendingPageIds = (savedDraft.pendingPageIds || []).filter(
            (pageId) => !removedPublishedCreateIds.has(String(pageId ?? ''))
          );

            const cleanedDraftData = removedPublishedCreateIds.size > 0
              ? {
                  ...savedDraft.data,
                  pages: (savedDraft.data.pages || []).filter(
                    (page) => !removedPublishedCreateIds.has(String(page?.id ?? ''))
                  )
                }
              : savedDraft.data;

            transformedData = mergeDraftWithFreshPages(cleanedDraftData, freshBackendData);

          if (removedPublishedCreateIds.size > 0) {
            console.log(`🧹 Auto-removed ${removedPublishedCreateIds.size} published draft page(s)`);
          }

          setSavedDraftPages(new Set(cleanedPendingPageIds));
          setPendingCreates(cleanedPendingCreates);
          setPendingDeletes(savedDraft.pendingDeletes || []);
          setPendingReorder(savedDraft.pendingReorder || null);

          if (removedPublishedCreateIds.size > 0) {
            if (cleanedPendingPageIds.length || cleanedPendingCreates.length || (savedDraft.pendingDeletes || []).length || savedDraft.pendingReorder) {
              saveDraftCache(
                cleanedDraftData,
                cleanedPendingPageIds,
                cleanedPendingCreates,
                savedDraft.pendingDeletes || [],
                savedDraft.pendingReorder || null
              );
            } else {
              clearDraftCache();
            }
          }
        } else {
          setSavedDraftPages(new Set());
          setPendingCreates([]);
          setPendingDeletes([]);
          setPendingReorder(null);
        }

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
          const cachedData = loadReportCache();
          const preferredLiveSource =
            cachedData?.pages?.length > transformedData.pages.length
              ? cachedData
              : transformedData;

          const mergedFallbackData = mergeStaticBaselineWithLiveData(staticData.pages || [], preferredLiveSource);
          const syncedStaticData = syncIndexPageContent(mergedFallbackData, staticIndexPages);
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
        Object.assign(page, restoreMissingTableStyles(rowIdxOrPage, page));
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
      const pagesToStage = new Set([...savedDraftPages, ...changedPages]);

      saveDraftCache(
        reportData,
        Array.from(pagesToStage),
        pendingCreates,
        pendingDeletes,
        pendingReorder
      );
      setOriginalData(JSON.parse(JSON.stringify(reportData)));
      setSavedDraftPages(pagesToStage);
      setChangedPages(new Set());
      setIsEditMode(false);

      console.log('✅ Draft saved locally. Live Preview will continue showing published data until Publish.');
    } catch (err) {
      console.error('Error saving draft:', err);
      window.alert(`Failed to save draft: ${err.message}`);
    }
  };

    const handleCancel = () => {
    // Revert only unsaved in-session edits, but keep the last saved/auto-saved draft state.
    setReportData(JSON.parse(JSON.stringify(originalData)));
    setChangedPages(new Set());
    setIsEditMode(false);
  };

  const handlePublish = () => {
    // Show the publish selection modal first
    setIsPublishSelectionModalOpen(true);
  };

  const handleConfirmSelection = (selectedChanges) => {
    // Store selected changes and proceed to confirmation dialog
    setSelectedPublishChanges(selectedChanges);
    setIsPublishSelectionModalOpen(false);
    setIsPublishDialogOpen(true);
  };

  const handleCancelSelection = () => {
    setIsPublishSelectionModalOpen(false);
    setSelectedPublishChanges(null);
  };

      const confirmPublish = async () => {
    setIsPublishing(true);

    try {
      // Determine which changes to publish based on selection
      const selection = selectedPublishChanges || {
        editedPages: new Set([...savedDraftPages, ...changedPages]),
        newPages: new Set(pendingCreates.map(p => p.id)),
        deletedPages: new Set([
          ...pendingDeletes,
          ...reportData.pages.filter(p => p._isDraftDeleted).map(p => p.id)
        ]),
        reorder: pendingReorder && pendingReorder.length > 0
      };

      // STEP 1: Create new pages (only selected ones, skip draft-created-then-deleted pages)
      const draftDeletedIds = new Set(
        reportData.pages.filter(p => p._isDraftDeleted).map(p => String(p.id ?? ''))
      );
      const pagesToCreate = pendingCreates.filter(p =>
        selection.newPages.has(p.id) && !draftDeletedIds.has(String(p.id ?? ''))
      );
      for (const draftPage of pagesToCreate) {
        // Find the current version of this page in reportData (may have been edited)
        const currentDraftPage = reportData.pages.find(p => idMatches(p.id, draftPage.id)) || draftPage;

        const pagePayload = { ...currentDraftPage };
        const createPositionParams = pagePayload._draftPositionParams || null;
        const createTemplate = pagePayload._draftTemplateId || pagePayload.pageTemplate || pagePayload.pageType || 'content';
        const createTitle = pagePayload.title || 'New Page';
        delete pagePayload._isDraftNew;
        delete pagePayload._isDraftDeleted;
        delete pagePayload._draftPositionParams;
        delete pagePayload._draftTemplateId;
        delete pagePayload.id;

        const response = await apiService.createPage(
          createTemplate,
          createTitle,
          null,
          createPositionParams
        );

        const createdBackendId = response?.page?.id || response?.page?.page_id || response?.id || null;
        if (response?.success === false || !createdBackendId) {
          throw new Error(`Failed to create page: ${pagePayload.title || 'New Page'}`);
        }

        // If the draft page had content/edits, save them to the newly created page
        await apiService.savePage(
          createdBackendId,
          { page_data: pagePayload },
          'system'
        );
      }
      if (pagesToCreate.length > 0) {
        console.log(`✅ ${pagesToCreate.length} new page(s) published`);
      }

      // STEP 2: Reorder pages (only if selected)
      if (selection.reorder && pendingReorder && pendingReorder.length > 0) {
        await apiService.reorderPages(pendingReorder);
        console.log('✅ Page reorder published');
      }

      // STEP 3: Save edited pages (only selected ones)
      const pageIdsToPublish = Array.from(new Set([...savedDraftPages, ...changedPages]))
        .filter(pageId => selection.editedPages.has(pageId));
      for (const pageId of pageIdsToPublish) {
        const page = reportData.pages.find((p) => idMatches(p.id, pageId));
        if (!page || page._isDraftNew) continue;

        await apiService.savePage(
          page.id,
          { page_data: { ...page } },
          'system'
        );
      }
      if (pageIdsToPublish.length > 0) {
        console.log(`✅ ${pageIdsToPublish.length} page edit(s) published`);
      }

      // STEP 4: Delete pages (only selected ones)
      const deletedPageIds = reportData.pages
        .filter(p => p._isDraftDeleted)
        .map(p => p.id);
      const allDeleteIds = [...new Set([...pendingDeletes, ...deletedPageIds])]
        .filter(pageId => selection.deletedPages.has(pageId))
        .filter(pageId => !/^page_\d+$/.test(String(pageId ?? ''))); // skip draft-only local IDs (never on backend)
      
      for (const pageId of allDeleteIds) {
        await apiService.deletePage(pageId);
      }
      if (allDeleteIds.length > 0) {
        console.log(`✅ ${allDeleteIds.length} page(s) deleted`);
      }

      // STEP 5: Reload fresh data from backend (with real IDs)
      const freshPages = await apiService.getPages(true); // forceFresh = true
      const freshData = transformPagesFromApi(freshPages);
      const syncedFreshData = syncIndexPageContent(freshData, staticIndexPagesRef.current);

      // STEP 6: Update draft state - keep unselected changes
      // Calculate what should remain in draft
      const remainingChangedPages = new Set(
        Array.from(changedPages).filter(id => !selection.editedPages.has(id))
      );
      const remainingSavedDraftPages = new Set(
        Array.from(savedDraftPages).filter(id => !selection.editedPages.has(id))
      );
      let remainingPendingCreates = pendingCreates.filter(p => !selection.newPages.has(p.id));
      
      // IMPORTANT: Filter out draft pages that were actually published (now exist in fresh backend)
      // This handles the case where a page was published but still lingering in pendingCreates with old draft ID
      remainingPendingCreates = remainingPendingCreates.filter(
        (draftPage) => !isAlreadyPublishedPage(draftPage, syncedFreshData.pages)
      );
      
      const remainingPendingDeletes = pendingDeletes.filter(id => !selection.deletedPages.has(id));
      const remainingDraftDeleted = reportData.pages
        .filter(p => p._isDraftDeleted && !selection.deletedPages.has(p.id))
        .map(p => p.id);
      const allRemainingDeletes = [...new Set([...remainingPendingDeletes, ...remainingDraftDeleted])];
      const remainingReorder = selection.reorder ? null : pendingReorder;

      // If there are remaining changes, keep them in draft
      const hasRemainingChanges = 
        remainingChangedPages.size > 0 || 
        remainingSavedDraftPages.size > 0 || 
        remainingPendingCreates.length > 0 || 
        allRemainingDeletes.length > 0 ||
        remainingReorder !== null;

      if (hasRemainingChanges) {
        // Merge fresh backend data with remaining draft changes
        const mergedData = { ...syncedFreshData };
        
        // Re-apply remaining draft changes to fresh data
        mergedData.pages = mergedData.pages.map(page => {
          const pageId = page.id;
          
          // If this page has remaining edits, get it from current reportData
          if (remainingChangedPages.has(pageId) || remainingSavedDraftPages.has(pageId)) {
            const draftPage = reportData.pages.find(p => idMatches(p.id, pageId));
            if (draftPage) {
              return { ...draftPage };
            }
          }
          
          return page;
        });

        // Add back remaining new pages (that weren't published)
        for (const draftPage of remainingPendingCreates) {
          const currentDraft = reportData.pages.find(p => idMatches(p.id, draftPage.id));
          if (currentDraft) {
            mergedData.pages.push({ ...currentDraft });
          } else {
            mergedData.pages.push({ ...draftPage });
          }
        }

        // Mark remaining deleted pages
        mergedData.pages = mergedData.pages.map(page => {
          if (allRemainingDeletes.includes(page.id)) {
            return { ...page, _isDraftDeleted: true };
          }
          return page;
        });

        setReportData(mergedData);
        setOriginalData(JSON.parse(JSON.stringify(syncedFreshData))); // Original is always fresh backend
        setPublishedData(JSON.parse(JSON.stringify(syncedFreshData)));
        setChangedPages(remainingChangedPages);
        setSavedDraftPages(remainingSavedDraftPages);
        setPendingCreates(remainingPendingCreates);
        setPendingDeletes(allRemainingDeletes);
        setPendingReorder(remainingReorder);

        // Save remaining draft to cache
        saveDraftCache(
          mergedData,
          Array.from(new Set([...remainingSavedDraftPages, ...remainingChangedPages])),
          remainingPendingCreates,
          allRemainingDeletes,
          remainingReorder
        );

        console.log('✅ Selected changes published, remaining changes kept in draft');
      } else {
        // No remaining changes - clear everything
        clearDraftCache();
        saveReportCache(syncedFreshData);
        setReportData(syncedFreshData);
        setOriginalData(JSON.parse(JSON.stringify(syncedFreshData)));
        setPublishedData(JSON.parse(JSON.stringify(syncedFreshData)));
        setSavedDraftPages(new Set());
        setChangedPages(new Set());
        setPendingCreates([]);
        setPendingDeletes([]);
        setPendingReorder(null);
        setPageUndoHistory({});

        console.log('✅ All changes published to backend');
      }

      // Reset selection
      setSelectedPublishChanges(null);
      
      // Always exit edit mode after publishing
      setIsEditMode(false);

      // Navigate to index page to avoid "Page not found" after structural changes
      navigate('/page/1');
    } catch (err) {
      console.error('Error publishing changes:', err);
      window.alert(`Failed to publish changes: ${err.message}`);
    } finally {
      setIsPublishDialogOpen(false);
      setIsPublishing(false);
    }
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

      const cloneSourcePageId = options?.cloneSourcePageId || null;
      const cloneSourcePageData = options?.cloneSourcePageData || null;
      const referencePageId = options?.positionParams?.pageId || null;
      const DISPLAY_INHERIT_KEYS = ['textColor', 'contentTextColor', 'fontFamily', 'titleFontSize', 'headerFontSize', 'contentFontSize'];
      const applyDisplayInheritance = (targetPage, sourcePage) => {
        if (!targetPage || !sourcePage) return targetPage;
        const nextPage = { ...targetPage };
        for (const key of DISPLAY_INHERIT_KEYS) {
          if (sourcePage[key] !== undefined) {
            nextPage[key] = sourcePage[key];
          }
        }
        return nextPage;
      };
      const CLONE_SKIP_KEYS = new Set(['id', 'page_id', 'pageId', 'pageNumber', 'page_number', 'createdAt', 'updatedAt']);
      const buildClonePayload = (sourcePage) => {
        if (!sourcePage || typeof sourcePage !== 'object') return null;
        const sourceCopy = JSON.parse(JSON.stringify(sourcePage));
        const clonePayload = {};
        Object.keys(sourceCopy).forEach((key) => {
          if (!CLONE_SKIP_KEYS.has(key)) clonePayload[key] = sourceCopy[key];
        });
        return clonePayload;
      };

      // NEW: Draft-only path - create page locally with full positioning and template cloning
      if (options?.isDraftOnly) {
        const draftPageId = newPage?.id || newPage?.page_id || newPage?.pageId || `page_${Date.now()}`;
        const draftPage = {
          ...newPage,
          id: draftPageId,
          title: newPage?.title || 'New Page',
          pageType: newPage?.pageType || newPage?.page_type || 'content',
          _isDraftNew: true,
          _draftPositionParams: options?.positionParams || null,
          _draftTemplateId: newPage?._draftTemplateId || options?.templateId || newPage?.pageTemplate || 'content'
        };

        // Clone template content
        const draftClonePayload = buildClonePayload(cloneSourcePageData);
        if (draftClonePayload) {
          Object.assign(draftPage, draftClonePayload);
          draftPage.id = draftPageId;
          draftPage.pageType = draftPage.pageType || newPage?.pageType || newPage?.page_type || 'content';
          draftPage._isDraftNew = true;
          draftPage._draftTemplateId = newPage?._draftTemplateId || options?.templateId || draftPage._draftTemplateId || 'content';
        }

        // Apply display inheritance from reference page
        const draftReferencePage = referencePageId
          ? (reportData?.pages || []).find((page) => idMatches(page.id, referencePageId))
          : null;
        const styledDraftPage = applyDisplayInheritance(draftPage, draftReferencePage);

        // Calculate insertion position
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

        // Calculate pageNumber based on surrounding pages
        const prevPN = insertIndex > 0 ? (updatedPages[insertIndex - 1]?.pageNumber || 0) : 0;
        const nextPN = updatedPages[insertIndex]?.pageNumber;
        styledDraftPage.pageNumber = nextPN != null ? (prevPN + nextPN) / 2 : prevPN + 1;

        // Insert page at correct position
        updatedPages.splice(insertIndex, 0, styledDraftPage);

        let transformedData = { ...reportData, pages: updatedPages };
        transformedData = syncIndexPageContent(transformedData, staticIndexPagesRef.current);

        // Add to pending creates queue and prepare fresh values for auto-save
        const updatedPendingCreates = [...pendingCreates, styledDraftPage];

        setPendingCreates(updatedPendingCreates);
        setReportData(transformedData);
        setOriginalData(JSON.parse(JSON.stringify(transformedData)));
        setIsEditMode(false);

        // Auto-save structural draft state without flagging it as an unsaved field edit.
        saveDraftCache(
          transformedData,
          Array.from(savedDraftPages),
          updatedPendingCreates,
          pendingDeletes,
          pendingReorder
        );

        // Navigate to the new page AFTER auto-save completes
        const sortedForNav = [...transformedData.pages].sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
        const newPageIdx = sortedForNav.findIndex(p => idMatches(p.id, draftPageId));
        if (newPageIdx >= 0) {
          navigate(`/page/${newPageIdx + 1}`);
        }

        console.log('✅ Page added locally (will sync on Publish)');
        return;
      }

      // OFFLINE fallback: create and insert page locally when backend create fails.
      if (options?.localOnly) {
        const localPageId = newPage?.id || newPage?.page_id || newPage?.pageId || `page_${Date.now()}`;
        const localPage = {
          ...newPage,
          id: localPageId,
          title: newPage?.title || 'New Page',
          pageType: newPage?.pageType || newPage?.page_type || 'content'
        };

        const localClonePayload = buildClonePayload(cloneSourcePageData);
        if (localClonePayload) {
          Object.assign(localPage, localClonePayload);
          localPage.id = localPageId;
          localPage.pageType = localPage.pageType || newPage?.pageType || newPage?.page_type || 'content';
        }

        const localReferencePage = referencePageId
          ? (reportData?.pages || []).find((page) => idMatches(page.id, referencePageId))
          : null;
        const styledLocalPage = applyDisplayInheritance(localPage, localReferencePage);

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

        // Assign a provisional pageNumber so the page sorts to the correct position.
        const prevPN = insertIndex > 0 ? (updatedPages[insertIndex - 1]?.pageNumber || 0) : 0;
        const nextPN = updatedPages[insertIndex]?.pageNumber;
        localPage.pageNumber = nextPN != null ? (prevPN + nextPN) / 2 : prevPN + 1;

        updatedPages.splice(insertIndex, 0, styledLocalPage);

        let transformedData = { ...reportData, pages: updatedPages };
        transformedData = syncIndexPageContent(transformedData, staticIndexPagesRef.current);

        setReportData(transformedData);
        setOriginalData(JSON.parse(JSON.stringify(transformedData)));
        setIsEditMode(false);
        setChangedPages(new Set());
        saveReportCache(transformedData);

        // Navigate by sorted positional index (robust regardless of pageNumber gaps)
        const sortedForNavLocal = [...transformedData.pages].sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
        const newPageIdxLocal = sortedForNavLocal.findIndex(p => idMatches(p.id, localPageId));
        if (newPageIdxLocal >= 0) {
          navigate(`/page/${newPageIdxLocal + 1}`);
          return newPageIdxLocal + 1;
        }

        return null;
      }
      
      // Refresh pages list from backend with cache-bust to ensure new page is fetched
      const pagesFromApi = await apiService.getPages(true); // forceFresh = true
      console.log('Pages from API after creation:', pagesFromApi);
      
      let transformedData = transformPagesFromApi(pagesFromApi);
      const createdPageId = newPage?.page_id || newPage?.id;
      const currentPageCount = Array.isArray(reportData?.pages) ? reportData.pages.length : 0;

      const isSuspiciouslyLowAfterCreate =
        currentPageCount > 0 && transformedData.pages.length < Math.max(1, Math.floor(currentPageCount * 0.9));

      if (isSuspiciouslyLowAfterCreate && reportData?.pages?.length) {
        console.warn(
          `⚠️ Post-create refresh returned too few pages (${transformedData.pages.length} vs ${currentPageCount}). Preserving in-memory pages and inserting the new page locally.`
        );

        const fallbackPageType = newPage?.page_type || newPage?.pageType || newPage?.template || options?.templateId || 'content';
        const fallbackPageTemplate = newPage?.page_template || newPage?.pageTemplate || newPage?.template || options?.templateId || fallbackPageType;

        let createdFallbackPage = {
          id: createdPageId,
          title: newPage?.title || 'New Page',
          pageType: fallbackPageType,
          pageTemplate: fallbackPageTemplate
        };

        const fallbackReferencePage = referencePageId
          ? reportData.pages.find((page) => idMatches(page.id, referencePageId))
          : null;
        createdFallbackPage = applyDisplayInheritance(createdFallbackPage, fallbackReferencePage);

        const preservedPages = [...reportData.pages].sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
        const existingIdx = preservedPages.findIndex((page) => idMatches(page.id, createdPageId));

        if (existingIdx >= 0) {
          preservedPages[existingIdx] = {
            ...preservedPages[existingIdx],
            ...createdFallbackPage
          };
        } else {
          const refPageId = options?.positionParams?.pageId;
          const insertBefore = Boolean(options?.positionParams?.insertBefore);
          let insertIndex = preservedPages.length;

          if (refPageId) {
            const refIndex = preservedPages.findIndex((page) => idMatches(page.id, refPageId));
            if (refIndex >= 0) {
              insertIndex = insertBefore ? refIndex : refIndex + 1;
            }
          }

          const prevPN = insertIndex > 0 ? Number(preservedPages[insertIndex - 1]?.pageNumber || 0) : 0;
          const nextPNRaw = preservedPages[insertIndex]?.pageNumber;
          const nextPN = Number.isFinite(Number(nextPNRaw)) ? Number(nextPNRaw) : null;
          createdFallbackPage.pageNumber = nextPN != null ? (prevPN + nextPN) / 2 : prevPN + 1;

          preservedPages.splice(insertIndex, 0, createdFallbackPage);
        }

        transformedData = {
          ...reportData,
          pages: preservedPages.sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0))
        };
      }

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

      if (createdPageId && (cloneSourcePageId || cloneSourcePageData)) {
        const sourcePageFromCurrentData = cloneSourcePageId
          ? transformedData.pages.find((page) => idMatches(page.id, cloneSourcePageId))
          : null;
        const effectiveCloneSourcePage = sourcePageFromCurrentData || cloneSourcePageData;
        const clonePayload = buildClonePayload(effectiveCloneSourcePage);

        if (clonePayload) {
          transformedData = {
            ...transformedData,
            pages: transformedData.pages.map((page) => {
              if (!idMatches(page.id, createdPageId)) return page;
              return {
                ...page,
                ...clonePayload,
                id: page.id,
                pageNumber: page.pageNumber,
              };
            })
          };

          const clonedPage = transformedData.pages.find((page) => idMatches(page.id, createdPageId));
          if (clonedPage) {
            try {
              await apiService.savePage(clonedPage.id, { page_data: clonedPage }, 'system');
              console.log('✅ New page cloned from selected template sample');
            } catch (cloneSyncErr) {
              console.warn('⚠️ Clone sync failed, keeping local clone state:', cloneSyncErr.message);
            }
          }
        }
      }

      // By default, inherit display settings from the insertion reference page
      // so newly added pages visually match the surrounding section.
      if (createdPageId && referencePageId) {
        const referencePage = transformedData.pages.find((page) => idMatches(page.id, referencePageId));
        if (referencePage) {
          transformedData = {
            ...transformedData,
            pages: transformedData.pages.map((page) => {
              if (!idMatches(page.id, createdPageId)) return page;
              return applyDisplayInheritance(page, referencePage);
            })
          };
        }
      }

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

      // Navigate by sorted positional index so we always land on the right page
      // regardless of whether pageNumbers are contiguous or have gaps.
      const sortedForNav = [...transformedData.pages].sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
      let redirectIdx = createdPageId
        ? sortedForNav.findIndex(p => idMatches(p.id, createdPageId))
        : -1;

      if (redirectIdx < 0 && newPage?.page_number) {
        const apiPN = Number(newPage.page_number);
        if (Number.isFinite(apiPN)) {
          redirectIdx = sortedForNav.findIndex(p => p.pageNumber === apiPN);
        }
      }

      if (redirectIdx < 0 && sortedForNav.length > 0) {
        redirectIdx = sortedForNav.length - 1; // fallback: last page
      }

      if (redirectIdx >= 0) {
        navigate(`/page/${redirectIdx + 1}`);
      }
      
      console.log('✅ Page created successfully:', newPage);
      return redirectIdx >= 0 ? redirectIdx + 1 : null;
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

      // Mark page as deleted instead of removing it (so live preview can still show it)
      const updatedPages = reportData.pages.map(p => 
        idMatches((p.id || p.page_id || p.pageId), resolvedPageId)
          ? { ...p, _isDraftDeleted: true }
          : p
      );
      let transformedData = { ...reportData, pages: updatedPages };
      
      // Sync index page with new page numbers
      transformedData = syncIndexPageContent(transformedData, staticIndexPagesRef.current);

      setReportData(transformedData);
      setOriginalData(JSON.parse(JSON.stringify(transformedData)));
      setIsDeleteDialogOpen(false);
      setPageToDelete(null);
      
      // Redirect to the page immediately before the deleted one (by sorted position).
      // Use positional index so gaps in pageNumber values don't cause off-by-one errors.
      const sortedBefore = [...reportData.pages].sort((a, b) => (a.pageNumber || 0) - (b.pageNumber || 0));
      const deletedPosIdx = sortedBefore.findIndex(p => idMatches((p.id || p.page_id || p.pageId), resolvedPageId));
      // One position back in the sorted list; clamp to 0 so first-page deletion goes to index
      const targetPosIdx = Math.max(0, deletedPosIdx - 1);
      navigate(`/page/${targetPosIdx + 1}`);
      
           // NEW: Track in pendingDeletes (will sync on Publish)
      setPendingDeletes(prev => [...prev, resolvedPageId]);
      
      // Auto-save draft state
      const updatedPendingDeletes = [...pendingDeletes, resolvedPageId];
      saveDraftCache(
        transformedData,
        Array.from(changedPages),
        pendingCreates,
        updatedPendingDeletes,
        pendingReorder
      );
      
      console.log('✅ Page marked for deletion (will sync on Publish)');
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

      // Reorder index content items based on new page order (preserves structure)
      const pageOrderMap = new Map(reorderedPages.map((p, i) => [String(p.id), i]));
      transformedData.pages = transformedData.pages.map(page => {
        if (page.pageType !== 'index' || !Array.isArray(page.content)) return page;
        const sortedContent = [...page.content].sort((a, b) => {
          const aOrder = pageOrderMap.get(String(a?.target)) ?? Number.MAX_SAFE_INTEGER;
          const bOrder = pageOrderMap.get(String(b?.target)) ?? Number.MAX_SAFE_INTEGER;
          return aOrder - bOrder;
        });
        return { ...page, content: sortedContent };
      });

      // Sync index with existing static baseline (no structural changes)
      transformedData = syncIndexPageContent(transformedData, staticIndexPagesRef.current);

      // Keep the static index baseline in sync with the newly sorted order so that
      // any subsequent syncIndexPageContent calls (e.g. on live-tab focus-refresh)
      // don't revert the index back to the original static sequence.
      staticIndexPagesRef.current = staticIndexPagesRef.current.map(sp => {
        const sortedLivePage = transformedData.pages.find(p =>
          p.pageType === 'index' &&
          (String(p.id) === String(sp.id) || p.pageNumber === sp.pageNumber)
        );
        if (!sortedLivePage?.content?.length) return sp;
        return { ...sp, content: sortedLivePage.content };
      });

      setReportData(transformedData);
      setOriginalData(JSON.parse(JSON.stringify(transformedData)));
      saveReportCache(transformedData);

      console.log('✅ Pages reordered locally');

      // Extract index pages to sync to the backend
      const indexPagesToSync = transformedData.pages.filter(p => p.pageType === 'index');

      // BACKGROUND SYNC: Run page reorder and all index-content saves CONCURRENTLY.
      // This removes the old sequential dependency (reorder → getPages → savePage) so the
      // backend is fully up-to-date as fast as possible, closing the race window where a
      // live-preview tab could load before the index content was saved.
            // NEW: Store in pendingReorder (will sync on Publish)
      setPendingReorder(pageOrder);
      
      // Auto-save draft state
      saveDraftCache(
        transformedData,
        Array.from(changedPages),
        pendingCreates,
        pendingDeletes,
        pageOrder
      );
      
      console.log('✅ Page reorder stored locally (will sync on Publish)');

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

  // Filter pages based on mode:
  // - Normal mode: hide deleted pages, show draft pages
  // - Live mode: show deleted pages, hide draft pages
  const isCurrentlyLiveMode = new URLSearchParams(location.search).get('live') === '1';
  const displayData = {
    ...reportData,
    pages: reportData.pages.filter(p => {
      if (isCurrentlyLiveMode) {
        // Live mode: hide draft-new pages, show everything else (including draft-deleted)
        return !p._isDraftNew;
      } else {
        // Normal mode: hide draft-deleted pages, show everything else (including draft-new)
        return !p._isDraftDeleted;
      }
    })
  };

  const hasPendingPublishChanges = Boolean(
    changedPages.size > 0 ||
    savedDraftPages.size > 0 ||
    pendingCreates.length > 0 ||
    pendingDeletes.length > 0 ||
    pendingReorder
  );
  const publishStatusLabel = hasPendingPublishChanges ? '🟡 Draft pending publish' : '🟢 Published';

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
      <PublishSelectionModal
        isOpen={isPublishSelectionModalOpen}
        onConfirm={handleConfirmSelection}
        onCancel={handleCancelSelection}
        changedPages={changedPages}
        savedDraftPages={savedDraftPages}
        pendingCreates={pendingCreates}
        pendingDeletes={pendingDeletes}
        pendingReorder={pendingReorder}
        reportData={reportData}
      />
      <PublishConfirmDialog
        isOpen={isPublishDialogOpen}
        onConfirm={confirmPublish}
        onCancel={() => setIsPublishDialogOpen(false)}
        isPublishing={isPublishing}
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
        <Route path="/page/:pageId" element={<ReportPage reportData={displayData} isEditMode={isEditMode} hasUnsavedChanges={changedPages.size > 0} publishStatusLabel={publishStatusLabel} onEditToggle={handleEditToggle} onUndo={handleUndoAll} onPublish={handlePublish} onCellChange={handleCellChange} onHeadingChange={handleHeadingChange} onImageChange={handleImageChange} onIndexChange={handleIndexChange} onSave={handleSave} onCancel={handleCancel} onImageClick={handleImageClick} onAddPage={handleOpenAddPageDialog} onDeletePage={handleOpenDeleteDialog} onManagePages={() => setIsPageManagerOpen(true)} isPublishing={isPublishing} isTestMode={isTestMode} isSeedingTestData={isSeedingTestData} isPublishingTestData={isPublishingTestData} onToggleTestMode={handleToggleTestMode} onSeedTestData={handleSeedTestData} onPublishTestData={handlePublishTestData} onRestoreOriginal={handleRestoreOriginalData} isRestoringOriginal={isRestoringOriginal} />} />
        <Route path="*" element={<div className="App"><p>Page not found</p></div>} />
      </Routes>
    </>
  );
}

export default App;
