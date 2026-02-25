import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

/**
 * CMS Endpoints for advanced page management
 * - Add/delete/reorder pages
 * - Bulk operations
 * - Template selection
 */

// Helper function: Rebuild all page positions to be consecutive (1, 2, 3, ...)
async function rebuildPositions(connection) {
  try {
    const [pages] = await connection.query(
      'SELECT page_id FROM pages WHERE is_deleted = FALSE ORDER BY position ASC'
    );
    
    for (let i = 0; i < pages.length; i++) {
      const newPosition = i + 1;
      await connection.query(
        'UPDATE pages SET position = ?, page_number = ? WHERE page_id = ?',
        [newPosition, newPosition, pages[i].page_id]
      );
    }
    
    console.log(`✅ Positions rebuilt: ${pages.length} pages renumbered sequentially`);
  } catch (error) {
    console.error('❌ Error rebuilding positions:', error);
    throw error;
  }
}

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
    
    console.log(`📍 Creating page: template=${template}, title=${title}`);
    console.log(`📍 Position params: before=${positionParams?.insertBefore}, pageId=${positionParams?.pageId}`);
    
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
        console.log(`📍 Ref page position=${refPosition}, insertBefore=${positionParams.insertBefore}, insertPosition=${insertPosition}`);
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
      console.log(`📍 No position specified, adding to end at position ${insertPosition}`);
    }

    // Shift existing pages if needed (update BOTH position and page_number to keep them in sync)
    if (insertPosition) {
      console.log(`📍 Shifting pages at position >= ${insertPosition}`);
      await connection.query(
        'UPDATE pages SET position = position + 1, page_number = page_number + 1 WHERE position >= ? AND is_deleted = FALSE',
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

    // Rebuild all positions to ensure they're consecutive (1, 2, 3, ...)
    await rebuildPositions(connection);

    connection.release();

    console.log(`✅ Page created: pageId=${pageId}, position=${insertPosition}, page_number=${pageNumber}`);

    res.json({
      success: true,
      message: 'Page created successfully',
      page: { page_id: pageId, page_number: pageNumber, position: insertPosition, template, title }
    });

  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Delete page (soft delete with is_deleted flag)
router.delete('/:pageId', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
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

    // Soft delete the page
    console.log('🗑️ Soft deleting page:', pageId);
    await connection.query(
      'UPDATE pages SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE page_id = ?',
      [pageId]
    );

    // Rebuild all positions to ensure they're consecutive
    console.log('🔧 Rebuilding positions after delete...');
    await rebuildPositions(connection);
    console.log('✅ Positions rebuilt after delete');

    res.json({
      success: true,
      message: 'Page deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting page:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
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

    console.log(`🔄 Reordering pages. New order:`, pageOrder);

    // Update positions and page_numbers
    for (let i = 0; i < pageOrder.length; i++) {
      console.log(`  - pageId=${pageOrder[i]}, position=${i+1}, page_number=${i+1}`);
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

// REPAIR - Rebuild all page positions to be consecutive (1, 2, 3, ...)
router.post('/repair/rebuild-positions', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Get all non-deleted pages ordered by current position
    const [pages] = await connection.query(
      'SELECT page_id, page_number, position FROM pages WHERE is_deleted = FALSE ORDER BY position ASC'
    );

    console.log(`🔧 Rebuilding positions for ${pages.length} pages...`);

    // Update each page with sequential position and page_number
    for (let i = 0; i < pages.length; i++) {
      const newPosition = i + 1;
      const pageId = pages[i].page_id;
      
      await connection.query(
        'UPDATE pages SET position = ?, page_number = ? WHERE page_id = ? AND is_deleted = FALSE',
        [newPosition, newPosition, pageId]
      );
      
      console.log(`  📍 Page ${pageId}: position ${pages[i].position} → ${newPosition}`);
    }

    connection.release();

    console.log(`✅ Position rebuild complete: ${pages.length} pages renumbered sequentially`);

    res.json({
      success: true,
      message: `Position rebuild complete: ${pages.length} pages renumbered`,
      pagesUpdated: pages.length
    });

  } catch (error) {
    console.error('Error rebuilding positions:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
