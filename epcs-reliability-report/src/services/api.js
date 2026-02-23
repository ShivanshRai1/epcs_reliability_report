const API_URL = 'https://epcs-reliability-report.onrender.com/api';

export const apiService = {
  // Get all pages
  getPages: async () => {
    try {
      const res = await fetch(`${API_URL}/pages`);
      if (!res.ok) throw new Error('Failed to fetch pages');
      return res.json();
    } catch (error) {
      console.error('Error fetching pages:', error);
      throw error;
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
  savePage: async (pageId, pageData, updatedBy = 'user') => {
    try {
      const res = await fetch(`${API_URL}/pages/${pageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...pageData,
          updated_by: updatedBy
        })
      });

      if (!res.ok) throw new Error('Failed to save page');
      return res.json();
    } catch (error) {
      console.error('Error saving page:', error);
      throw error;
    }
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
  }
};
