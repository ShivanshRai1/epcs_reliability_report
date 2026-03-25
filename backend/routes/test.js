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

    await connection.query('CREATE TABLE IF NOT EXISTS pages_test LIKE pages');
    await connection.query('CREATE TABLE IF NOT EXISTS page_history_test LIKE page_history');

    await connection.query('TRUNCATE TABLE pages_test');
    await connection.query('TRUNCATE TABLE page_history_test');

    await connection.query('INSERT INTO pages_test SELECT * FROM pages');
    await connection.query('INSERT INTO page_history_test SELECT * FROM page_history');

    const [[pagesCountRow]] = await connection.query('SELECT COUNT(*) AS count FROM pages_test');
    const [[historyCountRow]] = await connection.query('SELECT COUNT(*) AS count FROM page_history_test');

    await connection.commit();

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
    console.error('Error seeding test tables:', error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

export default router;
