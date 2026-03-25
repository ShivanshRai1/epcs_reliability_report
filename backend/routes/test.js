import express from 'express';
import pool from '../config/database.js';
import { requireTestControlAuth } from '../config/dataMode.js';

const router = express.Router();

router.get('/status', (req, res) => {
  const dataMode = req.dataMode || { allowTestMode: false, isTestMode: false };
  res.json({
    allowTestMode: !!dataMode.allowTestMode,
    activeMode: dataMode.isTestMode ? 'test' : 'production',
    testTables: {
      pages: 'pages_test',
      history: 'page_history_test'
    }
  });
});

router.post('/seed', requireTestControlAuth, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    console.log('🌱 Starting test table seed...');
    
    await connection.query('CREATE TABLE IF NOT EXISTS pages_test LIKE pages');
    console.log('✅ pages_test table created/verified');
    
    await connection.query('CREATE TABLE IF NOT EXISTS page_history_test LIKE page_history');
    console.log('✅ page_history_test table created/verified');

    await connection.query('TRUNCATE TABLE pages_test');
    console.log('✅ pages_test truncated');
    
    await connection.query('TRUNCATE TABLE page_history_test');
    console.log('✅ page_history_test truncated');

    await connection.query('INSERT INTO pages_test SELECT * FROM pages');
    console.log('✅ Data copied to pages_test');
    
    await connection.query('INSERT INTO page_history_test SELECT * FROM page_history');
    console.log('✅ Data copied to page_history_test');

    const [[pagesCountRow]] = await connection.query('SELECT COUNT(*) AS count FROM pages_test');
    const [[historyCountRow]] = await connection.query('SELECT COUNT(*) AS count FROM page_history_test');

    await connection.commit();
    
    console.log(`✅ Seeding complete: ${pagesCountRow?.count} pages, ${historyCountRow?.count} history records`);

    res.json({
      success: true,
      message: 'Test tables seeded from production',
      pages_test_count: Number(pagesCountRow?.count || 0),
      page_history_test_count: Number(historyCountRow?.count || 0)
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('❌ Error seeding test tables:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

router.post('/publish', requireTestControlAuth, async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    await connection.query('TRUNCATE TABLE pages');
    await connection.query('TRUNCATE TABLE page_history');

    await connection.query('INSERT INTO pages SELECT * FROM pages_test');
    await connection.query('INSERT INTO page_history SELECT * FROM page_history_test');

    const [[pagesCountRow]] = await connection.query('SELECT COUNT(*) AS count FROM pages');
    const [[historyCountRow]] = await connection.query('SELECT COUNT(*) AS count FROM page_history');

    await connection.commit();

    res.json({
      success: true,
      message: 'Test changes published to production',
      pages_count: Number(pagesCountRow?.count || 0),
      page_history_count: Number(historyCountRow?.count || 0)
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error publishing test data to production:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;
