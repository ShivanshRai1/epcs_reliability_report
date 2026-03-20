const ENV_API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_REACT_APP_API_URL ||
  '';

// Default to same-origin API path so Netlify redirects / Vite proxy can avoid CORS issues.
const API_URL = '/api';

const REMOTE_API_CANDIDATES = [
  ENV_API_URL,
  'https://epcs-reliability-report.onrender.com/api'
];

const buildApiCandidates = () => {
  const candidates = [API_URL, ...REMOTE_API_CANDIDATES].filter(Boolean);
  return [...new Set(candidates)];
};

const fetchJsonWithBaseFallback = async (path, options = {}) => {
  const candidates = buildApiCandidates();
  let lastError = null;

  for (const baseUrl of candidates) {
    try {
      const res = await fetch(`${baseUrl}${path}`, options);
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} for ${path}`);
        continue;
      }
      return await res.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`Failed to fetch ${path}`);
};

const deleteWithBaseFallback = async (pageId) => {
  const candidates = buildApiCandidates();
  const deletePaths = [`/cms/${pageId}`, `/cms/page/${pageId}`];
  let lastError = null;

  for (const baseUrl of candidates) {
    for (const path of deletePaths) {
      try {
        const res = await fetch(`${baseUrl}${path}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status} for ${path}`);
          continue;
        }

        return await res.json();
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError || new Error('Failed to delete page');
};

const fetchPagesViaFallback = async () => {
  // Fallback path for backends that fail on bulk /pages query.
  const candidates = buildApiCandidates();

  for (const baseUrl of candidates) {
    try {
      const listRes = await fetch(`${baseUrl}/cms/list`);
      if (!listRes.ok) continue;

      const list = await listRes.json();
      const sorted = Array.isArray(list)
        ? [...list].sort((a, b) => Number(a.page_number || 0) - Number(b.page_number || 0))
        : [];

      const detailResults = await Promise.all(
        sorted.map(async (item) => {
          const pageId = item?.page_id;
          if (!pageId) return null;
          const detailRes = await fetch(`${baseUrl}/pages/${pageId}`);
          if (!detailRes.ok) return null;
          return detailRes.json();
        })
      );

      const hydrated = detailResults.filter(Boolean);
      if (hydrated.length > 0) return hydrated;
    } catch {
      // Try next candidate base URL.
    }
  }

  throw new Error('Failed to fetch page list fallback');
};

export const apiService = {
  // Get all pages
  getPages: async () => {
    try {
      const candidates = buildApiCandidates();

      for (const baseUrl of candidates) {
        try {
          const res = await fetch(`${baseUrl}/pages`);
          if (!res.ok) continue;
          return await res.json();
        } catch {
          // Try next base URL
        }
      }

      // Try fallback without failing the app when bulk endpoint errors.
      return await fetchPagesViaFallback();
    } catch (error) {
      try {
        return await fetchPagesViaFallback();
      } catch (fallbackError) {
        console.error('Error fetching pages:', error);
        console.error('Fallback fetching pages failed:', fallbackError);
        throw error;
      }
    }
  },

  // Get single page
  getPage: async (pageId) => {
    try {
      const res = await fetch(`${API_URL}/pages/${pageId}`);
      if (!res.ok) throw new Error('Page not found');
      return res.json();
    } catch (error) {
      console.error('Error fetching page:', error);
      throw error;
    }
  },

  // Save/update page
  savePage: async (pageId, payload, updatedBy = 'user') => {
    const candidates = buildApiCandidates();
    let lastError = null;

    for (const baseUrl of candidates) {
      try {
        const res = await fetch(`${baseUrl}/pages/${pageId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            page_data: payload.page_data,
            updated_by: updatedBy
          })
        });

        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status} when saving page`);
          continue;
        }
        return res.json();
      } catch (error) {
        lastError = error;
      }
    }

    console.error('Error saving page:', lastError);
    throw lastError || new Error('Failed to save page');
  },

  // Get full report (all pages)
  getFullReport: async () => {
    try {
      const res = await fetch(`${API_URL}/pages/export/full`);
      if (!res.ok) throw new Error('Failed to fetch report');
      return res.json();
    } catch (error) {
      console.error('Error fetching report:', error);
      throw error;
    }
  },

  // Get page history
  getPageHistory: async (pageId) => {
    try {
      const res = await fetch(`${API_URL}/history/${pageId}`);
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json();
    } catch (error) {
      console.error('Error fetching history:', error);
      throw error;
    }
  },

  // Get all recent changes
  getAllHistory: async () => {
    try {
      const res = await fetch(`${API_URL}/history`);
      if (!res.ok) throw new Error('Failed to fetch all history');
      return res.json();
    } catch (error) {
      console.error('Error fetching all history:', error);
      throw error;
    }
  },

  // === CMS ENDPOINTS (NEW) ===

  // Get available page templates
  getPageTemplates: async () => {
    try {
      return await fetchJsonWithBaseFallback('/cms/templates');
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  // Create new page from template
  createPage: async (template, title, position = null, positionParams = null) => {
    const candidates = buildApiCandidates();
    let lastError = null;

    for (const baseUrl of candidates) {
      try {
        console.log('🚀 API: Calling /cms/create with:', { template, title, position, positionParams });
        
        const res = await fetch(`${baseUrl}/cms/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            template,
            title,
            position,
            positionParams // Can include { pageId, insertBefore: true/false }
          })
        });

        const data = await res.json();
        
        if (!res.ok) {
          const error = data.error || `HTTP ${res.status} when creating page`;
          lastError = new Error(error);
          continue;
        }
        
        console.log('✅ API Success:', data);
        return data;
      } catch (error) {
        lastError = error;
      }
    }

    console.error('❌ Error creating page:', lastError?.message);
    throw lastError || new Error('Failed to create page');
  },

  // Delete page (soft delete)
  deletePage: async (pageId) => {
    try {
      return await deleteWithBaseFallback(pageId);
    } catch (error) {
      console.error('Error deleting page:', error);
      throw error;
    }
  },

  // Reorder pages in bulk
  reorderPages: async (pageOrder) => {
    const candidates = buildApiCandidates();
    let lastError = null;

    for (const baseUrl of candidates) {
      try {
        const res = await fetch(`${baseUrl}/cms/reorder`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ pageOrder })
        });

        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status} when reordering pages`);
          continue;
        }
        return res.json();
      } catch (error) {
        lastError = error;
      }
    }

    console.error('Error reordering pages:', lastError);
    throw lastError || new Error('Failed to reorder pages');
  },

  // Get page list (with optional filtering)
  getPageList: async (includeDeleted = false) => {
    try {
      const query = includeDeleted ? '?includeDeleted=true' : '';
      return await fetchJsonWithBaseFallback(`/cms/list${query}`);
    } catch (error) {
      console.error('Error fetching page list:', error);
      throw error;
    }
  },

  // Repair - Rebuild all page positions to be consecutive
  repairPagePositions: async () => {
    try {
      console.log('🔧 Calling repair endpoint to rebuild page positions...');
      const res = await fetch(`${API_URL}/cms/repair/rebuild-positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error('Failed to repair positions');
      const result = await res.json();
      console.log('✅ Repair result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error repairing positions:', error);
      throw error;
    }
  }
};
