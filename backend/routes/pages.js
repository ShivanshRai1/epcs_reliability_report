import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// GET all pages
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT page_id, page_number, page_type, title, page_data, updated_at, updated_by FROM pages WHERE is_deleted = FALSE ORDER BY position ASC'
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching pages:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET single page
router.get('/:pageId', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM pages WHERE page_id = ? AND is_deleted = FALSE',
      [req.params.pageId]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching page:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST/UPDATE page
router.post('/:pageId', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const pageUpdateData = req.body;
    const updatedBy = req.body.updated_by || 'system';

    // Get existing page from database
    const [existing] = await connection.query(
      'SELECT page_id, page_number, page_type, title, page_data FROM pages WHERE page_id = ?',
      [req.params.pageId]
    );

    if (existing.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Page not found' });
    }

    const currentPage = existing[0];
    const mergedPageData = { ...currentPage.page_data, ...pageUpdateData.page_data };

    // Save old data to history
    if (process.env.TRACK_HISTORY === 'true') {
      await connection.query(
        'INSERT INTO page_history (page_id, page_number, old_data, new_data, changed_by, change_description) VALUES (?, ?, ?, ?, ?, ?)',
        [
          currentPage.page_id,
          currentPage.page_number,
          JSON.stringify(currentPage.page_data),
          JSON.stringify(mergedPageData),
          updatedBy,
          'Page updated'
        ]
      );
    }

    const nextTitle = pageUpdateData?.page_data?.title ?? currentPage.title;

    // Update page
    await connection.query(
      `UPDATE pages SET page_data = ?, title = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE page_id = ?`,
      [
        JSON.stringify(mergedPageData),
        nextTitle,
        updatedBy,
        req.params.pageId
      ]
    );

    connection.release();
    res.json({ success: true, message: 'Page saved successfully', page_id: req.params.pageId });
  } catch (error) {
    console.error('Error saving page:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET full report (all pages as JSON)
router.get('/export/full', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT page_data FROM pages WHERE is_deleted = FALSE ORDER BY position ASC'
    );
    connection.release();

    const pages = rows.map(row => row.page_data);
    res.json({ pages });
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
