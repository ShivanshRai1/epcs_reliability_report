import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// GET page history
router.get('/:pageId', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM page_history WHERE page_id = ? ORDER BY changed_at DESC LIMIT 50',
      [req.params.pageId]
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET all history (recent changes)
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT * FROM page_history ORDER BY changed_at DESC LIMIT 100'
    );
    connection.release();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching all history:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
