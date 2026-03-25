import express from 'express';
import pool from '../config/database.js';
import { getTableNames } from '../config/dataMode.js';

const router = express.Router();

/**
 * CMS Endpoints for advanced page management
 * - Add/delete/reorder pages
 * - Bulk operations
 * - Template selection
 */

// Helper function: Rebuild all page positions to be consecutive (1, 2, 3, ...)
async function rebuildPositions(connection, pagesTable) {
  try {
    const [pages] = await connection.query(
      `SELECT page_id, page_type, title FROM ${pagesTable} WHERE is_deleted = FALSE ORDER BY position ASC`
    );
    
    console.log(`🔧 Rebuilding positions for ${pages.length} pages...`);
    console.log('📋 Current pages:', pages.map(p => `${p.page_id}(${p.page_type}:${p.title})`).join(', '));
    
    for (let i = 0; i < pages.length; i++) {
      const newPosition = i + 1;
      await connection.query(
        `UPDATE ${pagesTable} SET position = ?, page_number = ? WHERE page_id = ?`,
        [newPosition, newPosition, pages[i].page_id]
      );
      console.log(`  📍 ${pages[i].page_id}: position ${newPosition}`);
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
        { id: 'link-only', name: 'Link Only', description: 'Link-focused page variant' },
        { id: 'just-images', name: 'Just Images', description: 'Page with images and optional captions' },
        { id: 'mixed-content', name: 'Mixed Content', description: 'Text, links, and images in any order' },
        { id: 'heading', name: 'Heading', description: 'Title and subtitle heading page' },
        { id: 'index', name: 'Index', description: 'List of linked items' },
        { id: 'image-text', name: 'Image + Text', description: 'Flexible image and text positioning' },
        { id: 'split-text-image', name: 'Split Text + Image', description: 'Left side text, right side image with optional headers' },
        { id: 'split-links-image', name: 'Split Links + Image', description: 'Left side links, right side image with optional headers' },
        { id: 'split-image-links', name: 'Split Image + Links', description: 'Left side image, right side links with optional headers' },
        { id: 'split-image-image', name: 'Split Image + Image', description: 'Left side image, right side image with optional headers' },
        { id: 'split-content', name: 'Split Content', description: 'Left/right content areas with flexible content types' },
        { id: 'table', name: 'Table', description: 'Primary table page type' }
      ]
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET - Audit page positions for integrity issues
router.get('/audit-positions', async (req, res) => {
  try {
    const { pagesTable } = getTableNames(req);
    const connection = await pool.getConnection();
    
    const [pages] = await connection.query(
      `SELECT page_id, position, page_number, page_type, title FROM ${pagesTable} WHERE is_deleted = FALSE ORDER BY position ASC`
    );
    connection.release();

    const issues = [];
    const expectedPositions = new Set();
    
    // Check for gaps, duplicates, and mismatches
    for (let i = 0; i < pages.length; i++) {
      const expected = i + 1;
      const actual = pages[i].position;
      const pageNum = pages[i].page_number;
      
      expectedPositions.add(expected);
      
      if (actual !== expected) {
        issues.push({
          page_id: pages[i].page_id,
          title: pages[i].title,
          severity: 'CRITICAL',
          issue: `Position mismatch: expected ${expected}, got ${actual}`
        });
      }
      
      if (pageNum !== expected) {
        issues.push({
          page_id: pages[i].page_id,
          title: pages[i].title,
          severity: 'HIGH',
          issue: `page_number mismatch: expected ${expected}, got ${pageNum}`
        });
      }
    }

    res.json({
      total_pages: pages.length,
      integrity_status: issues.length === 0 ? 'OK' : 'CORRUPTED',
      issues: issues,
      pages: pages.map(p => ({
        page_id: p.page_id,
        position: p.position,
        page_number: p.page_number,
        page_type: p.page_type,
        title: p.title
      }))
    });
  } catch (error) {
    console.error('Error auditing positions:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST - Repair page positions (rebuild sequentially)
router.post('/repair-positions', async (req, res) => {
  let connection;
  try {
    const { pagesTable } = getTableNames(req);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    const [pages] = await connection.query(
      `SELECT page_id, page_type, title FROM ${pagesTable} WHERE is_deleted = FALSE ORDER BY position ASC`
    );
    
    console.log(`🔧 REPAIR: Rebuilding positions for ${pages.length} pages...`);
    
    for (let i = 0; i < pages.length; i++) {
      const newPosition = i + 1;
      await connection.query(
        `UPDATE ${pagesTable} SET position = ?, page_number = ? WHERE page_id = ?`,
        [newPosition, newPosition, pages[i].page_id]
      );
      console.log(`  📍 ${pages[i].page_id} (${pages[i].page_type}): position/page_number ${newPosition}`);
    }
    
    await connection.commit();
    connection.release();
    
    console.log(`✅ REPAIR: Positions repaired for ${pages.length} pages`);
    
    res.json({
      success: true,
      message: `Repaired positions for ${pages.length} pages`,
      pages_affected: pages.length
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('❌ Error repairing positions:', error);
    res.status(500).json({ error: error.message, message: 'Failed to repair positions' });
  }
});

// POST - Create new page with template
router.post('/create', async (req, res) => {
  try {
    const { pagesTable, historyTable } = getTableNames(req);
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
        `SELECT position FROM ${pagesTable} WHERE page_id = ? AND is_deleted = FALSE`,
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
        `SELECT position FROM ${pagesTable} WHERE page_id = ? AND is_deleted = FALSE`,
        [insertAfterPageId]
      );
      if (afterPageRows.length > 0) {
        insertPosition = afterPageRows[0].position + 1;
      }
    }

    // If position not specified, add to end
    if (!insertPosition) {
      const [maxPosition] = await connection.query(
        `SELECT MAX(position) as maxPos FROM ${pagesTable} WHERE is_deleted = FALSE`
      );
      insertPosition = (maxPosition[0]?.maxPos || 0) + 1;
      console.log(`📍 No position specified, adding to end at position ${insertPosition}`);
    }

    // Shift existing pages if needed (update BOTH position and page_number to keep them in sync)
    if (insertPosition) {
      console.log(`📍 Shifting pages at position >= ${insertPosition}`);
      const [shiftCount] = await connection.query(
        `SELECT COUNT(*) as cnt FROM ${pagesTable} WHERE position >= ? AND is_deleted = FALSE`,
        [insertPosition]
      );
      console.log(`📊 Shifting ${shiftCount[0].cnt} pages at/after position ${insertPosition}`);
      
      await connection.query(
        `UPDATE ${pagesTable} SET position = position + 1, page_number = page_number + 1 WHERE position >= ? AND is_deleted = FALSE`,
        [insertPosition]
      );
      console.log('✅ Shift complete');
    }

    // Get new page_number (same as position for now)
    const pageNumber = insertPosition;

    // Template aliases map to existing stable page types to avoid frontend regressions.
    const templateToPageType = {
      'link-only': 'just-links',
      'mixed-content': 'just-images',
      'split-text-image': 'split-content-image',
      'split-links-image': 'split-content-image',
      'split-image-links': 'split-content-image',
      'split-image-image': 'split-content-image',
      'images-gallery': 'just-images',
      'images-carousel': 'just-images',
      'video-gallery': 'just-images'
    };
    const resolvedPageType = templateToPageType[template] || template;

    // Create initial page_data based on template
    const pageDataTemplates = {
      'text-only': { content: '', blocks: [] },
      'just-links': { links: [], title: title },
      'link-only': { links: [], linkBlocks: [], title: title, linkOnlyMode: true },
      'just-images': { images: [], captions: [] },
      'mixed-content': { pageBlocks: [], images: [], captions: [] },
      'heading': { title: title, subtitle: '' },
      'index': { content: [] },
      'image-text': { imageUrl: '', imageCaption: '', content: '', imagePosition: 'left', link: null },
      'split-text-image': { leftHeader: '', rightHeader: '', content: [], leftContent: '', imageUrl: '', layout: 'normal', splitTextImageMode: true },
      'split-links-image': { leftHeader: '', rightHeader: '', content: [], leftContent: '', imageUrl: '', layout: 'normal', splitLinksImageMode: true },
      'split-image-links': { leftHeader: '', rightHeader: '', content: [], leftContent: '', imageUrl: '', layout: 'normal', splitImageLinksMode: true },
      'split-image-image': { leftHeader: '', rightHeader: '', leftImageUrl: '', imageUrl: '', layout: 'normal', splitImageImageMode: true },
      'split-content': { left: {}, right: {}, image: {} },
      'table': { table: { rows: [], columns: [] }, captionTop: '', captionBottom: '', title: title },
      'images-gallery': { images: [], captions: [], galleryMode: true },
      'images-carousel': { images: [], captions: [], carouselMode: true },
      'video-gallery': { videos: [], videoGalleryMode: true }
    };

    const pageData = pageDataTemplates[template] || {};

    // Insert new page
    await connection.query(
      `INSERT INTO ${pagesTable} 
       (page_id, page_number, position, page_type, page_template, title, page_data, updated_by, is_deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, FALSE)`,
      [pageId, pageNumber, insertPosition, resolvedPageType, template, title, JSON.stringify(pageData), 'system']
    );

    // Record in history
    if (process.env.TRACK_HISTORY === 'true') {
      await connection.query(
        `INSERT INTO ${historyTable} (page_id, page_number, old_data, new_data, changed_by, change_description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pageId, pageNumber, '{}', JSON.stringify(pageData), 'system', 'Page created']
      );
    }

    // Rebuild all positions to ensure they're consecutive (1, 2, 3, ...)
    await rebuildPositions(connection, pagesTable);

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
    const { pagesTable } = getTableNames(req);
    connection = await pool.getConnection();
    const { pageId } = req.params;

    // Get the page to delete
    const [pageRows] = await connection.query(
      `SELECT page_number, position FROM ${pagesTable} WHERE page_id = ? AND is_deleted = FALSE`,
      [pageId]
    );

    if (pageRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Page not found' });
    }

    // Soft delete the page
    console.log('🗑️ Soft deleting page:', pageId);
    await connection.query(
      `UPDATE ${pagesTable} SET is_deleted = TRUE, updated_at = CURRENT_TIMESTAMP WHERE page_id = ?`,
      [pageId]
    );

    // Rebuild all positions to ensure they're consecutive
    console.log('🔧 Rebuilding positions after delete...');
    await rebuildPositions(connection, pagesTable);
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
  let connection;
  try {
    const { pagesTable, historyTable } = getTableNames(req);
    connection = await pool.getConnection();
    const { pageOrder } = req.body; // Array of page_ids in desired order

    if (!Array.isArray(pageOrder) || pageOrder.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'pageOrder array is required' });
    }

    console.log(`🔄 Reordering pages. New order:`, pageOrder);

    await connection.beginTransaction();

    // Update positions and page_numbers
    for (let i = 0; i < pageOrder.length; i++) {
      console.log(`  - pageId=${pageOrder[i]}, position=${i+1}, page_number=${i+1}`);
      const [updateResult] = await connection.query(
        `UPDATE ${pagesTable} SET position = ?, page_number = ?, updated_at = CURRENT_TIMESTAMP WHERE page_id = ?`,
        [i + 1, i + 1, pageOrder[i]]
      );

      if (!updateResult || updateResult.affectedRows !== 1) {
        throw new Error(`Reorder validation failed for page_id=${pageOrder[i]}`);
      }
    }

    // Record reorder in history
    if (process.env.TRACK_HISTORY === 'true') {
      await connection.query(
        `INSERT INTO ${historyTable} (page_id, page_number, change_description, changed_by, old_data, new_data)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['bulk_reorder', 0, 'Pages reordered', 'system', '{}', JSON.stringify({ pageOrder })]
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Pages reordered successfully',
      newOrder: pageOrder
    });

  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error rolling back reorder transaction:', rollbackError);
      }
    }
    console.error('Error reordering pages:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// GET - Get pages with filtering options
router.get('/list', async (req, res) => {
  try {
    const { pagesTable } = getTableNames(req);
    const connection = await pool.getConnection();
    const { includeDeleted } = req.query;

    let query = `SELECT page_id, page_number, page_type, page_template, title, position FROM ${pagesTable}`;
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
    const { pagesTable } = getTableNames(req);
    const connection = await pool.getConnection();

    // Get all non-deleted pages ordered by current position
    const [pages] = await connection.query(
      `SELECT page_id, page_number, position FROM ${pagesTable} WHERE is_deleted = FALSE ORDER BY position ASC`
    );

    console.log(`🔧 Rebuilding positions for ${pages.length} pages...`);

    // Update each page with sequential position and page_number
    for (let i = 0; i < pages.length; i++) {
      const newPosition = i + 1;
      const pageId = pages[i].page_id;
      
      await connection.query(
        `UPDATE ${pagesTable} SET position = ?, page_number = ? WHERE page_id = ? AND is_deleted = FALSE`,
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
