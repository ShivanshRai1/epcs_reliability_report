import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

/**
 * CMS Endpoints for advanced page management
 * - Add/delete/reorder pages
 * - Bulk operations
 * - Template selection
 */

// GET all available page templates
router.get('/templates', async (req, res) => {
  try {
    res.json({
      templates: [
        { id: 'text-only', name: 'Text Only', description: 'Page with just text content' },
        { id: 'just-links', name: 'Just Links', description: 'Page with only links/list' },
        { id: 'just-tables', name: 'Just Tables', description: 'Page with table and optional text above/below' },
        { id: 'just-images', name: 'Just Images', description: 'Page with images and optional captions' },
        { id: 'heading', name: 'Heading', description: 'Title and subtitle heading page' },
        { id: 'index', name: 'Index', description: 'List of linked items' },
        { id: 'image-text', name: 'Image + Text', description: 'Flexible image and text positioning' },
        { id: 'split-content', name: 'Split Content + Image', description: 'Content on left/right with image' },
        { id: 'table', name: 'Table', description: 'Primary table page type' }
      ]
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Create new page with template
router.post('/create', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { template, title, position, insertAfterPageId, positionParams } = req.body;

    if (!template || !title) {
      connection.release();
      return res.status(400).json({ error: 'template and title are required' });
    }

    // Generate unique page_id
    const timestamp = Date.now();
    const pageId = `page_${timestamp}`;

    // Determine position
    let insertPosition = position;
    
    // Handle new positionParams format (supports before/after)
    if (positionParams && positionParams.pageId) {
      const [refPageRows] = await connection.query(
        'SELECT position FROM pages WHERE page_id = ? AND is_deleted = FALSE',
        [positionParams.pageId]
      );
      if (refPageRows.length > 0) {
        const refPosition = refPageRows[0].position;
        // If insertBefore is true, insert at refPosition; otherwise insert after
        insertPosition = positionParams.insertBefore ? refPosition : refPosition + 1;
      }
    } else if (insertAfterPageId) {
      // Legacy support for old API calls
      const [afterPageRows] = await connection.query(
        'SELECT position FROM pages WHERE page_id = ? AND is_deleted = FALSE',
        [insertAfterPageId]
      );
      if (afterPageRows.length > 0) {
        insertPosition = afterPageRows[0].position + 1;
      }
    }

    // If position not specified, add to end
    if (!insertPosition) {
      const [maxPosition] = await connection.query(
        'SELECT MAX(position) as maxPos FROM pages WHERE is_deleted = FALSE'
      );
      insertPosition = (maxPosition[0]?.maxPos || 0) + 1;
    }

    // Shift existing pages if needed
    if (insertPosition) {
      await connection.query(
        'UPDATE pages SET position = position + 1 WHERE position >= ? AND is_deleted = FALSE',
        [insertPosition]
      );
    }

    // Get new page_number (same as position for now)
    const pageNumber = insertPosition;

    // Create initial page_data based on template
    const pageDataTemplates = {
      'text-only': { content: '', blocks: [] },
      'just-links': { links: [], title: title },
      'just-tables': { table: { rows: [], columns: [] }, captionTop: '', captionBottom: '' },
      'just-images': { images: [], captions: [] },
      'heading': { title: title, subtitle: '' },
      'index': { content: [] },
      'image-text': { imageUrl: '', imageCaption: '', content: '', imagePosition: 'left', link: null },
      'split-content': { left: {}, right: {}, image: {} },
      'table': { table: { rows: [], columns: [] }, captionTop: '', captionBottom: '', title: title }
    };

    const pageData = pageDataTemplates[template] || {};

    // Insert new page
    await connection.query(
      `INSERT INTO pages 
       (page_id, page_number, position, page_type, page_template, title, page_data, updated_by, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [pageId, pageNumber, insertPosition, template, template, title, JSON.stringify(pageData), 'system']
    );

    // Record in history
    if (process.env.TRACK_HISTORY === 'true') {
      await connection.query(
        `INSERT INTO page_history (page_id, page_number, old_data, new_data, changed_by, change_description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pageId, pageNumber, '{}', JSON.stringify(pageData), 'system', 'Page created']
      );
    }

    connection.release();

    res.json({
      success: true,
      message: 'Page created successfully',
      page: { page_id: pageId, page_number: pageNumber, template, title }
    });

  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Delete page (soft delete with is_deleted flag)
router.delete('/:pageId', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { pageId } = req.params;

    // Get the page to delete
    const [pageRows] = await connection.query(
      'SELECT page_number, position FROM pages WHERE page_id = ? AND is_deleted = FALSE',
      [pageId]
    );

    if (pageRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Page not found' });
    }

    const { position } = pageRows[0];

    // Soft delete the page
    await connection.query(
      'UPDATE pages SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE page_id = ?',
      [pageId]
    );

    // Shift positions of pages after the deleted one
    await connection.query(
      'UPDATE pages SET position = position - 1 WHERE position > ? AND is_deleted = FALSE',
      [position]
    );

    // Update page_numbers to match positions
    const [allPages] = await connection.query(
      'SELECT page_id, position FROM pages WHERE is_deleted = FALSE ORDER BY position ASC'
    );

    for (let i = 0; i < allPages.length; i++) {
      await connection.query(
        'UPDATE pages SET page_number = ? WHERE page_id = ?',
        [i + 1, allPages[i].page_id]
      );
    }

    connection.release();

    res.json({
      success: true,
      message: 'Page deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH - Reorder pages in bulk
router.patch('/reorder', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { pageOrder } = req.body; // Array of page_ids in desired order

    if (!Array.isArray(pageOrder) || pageOrder.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'pageOrder array is required' });
    }

    // Update positions and page_numbers
    for (let i = 0; i < pageOrder.length; i++) {
      await connection.query(
        'UPDATE pages SET position = ?, page_number = ?, updated_at = CURRENT_TIMESTAMP WHERE page_id = ?',
        [i + 1, i + 1, pageOrder[i]]
      );
    }

    // Record reorder in history
    if (process.env.TRACK_HISTORY === 'true') {
      await connection.query(
        `INSERT INTO page_history (page_id, page_number, change_description, changed_by, old_data, new_data)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['bulk_reorder', 0, 'Pages reordered', 'system', '{}', JSON.stringify({ pageOrder })]
      );
    }

    connection.release();

    res.json({
      success: true,
      message: 'Pages reordered successfully',
      newOrder: pageOrder
    });

  } catch (error) {
    console.error('Error reordering pages:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Get pages with filtering options
router.get('/list', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { includeDeleted } = req.query;

    let query = 'SELECT page_id, page_number, page_type, page_template, title, position FROM pages';
    if (includeDeleted !== 'true') {
      query += ' WHERE is_deleted = FALSE';
    }
    query += ' ORDER BY position ASC';

    const [rows] = await connection.query(query);
    connection.release();

    res.json(rows);

  } catch (error) {
    console.error('Error fetching page list:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
