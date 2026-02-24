import mysql from 'mysql2/promise.js';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0
});

// Auto-migrate CMS columns on startup
async function runMigration() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Check if columns exist
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'pages' AND COLUMN_NAME IN ('position', 'page_template', 'is_deleted')`
    );
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    // Add position column if missing
    if (!existingColumns.includes('position')) {
      console.log('🔄 Adding position column...');
      await connection.query(
        `ALTER TABLE pages ADD COLUMN position INT DEFAULT page_number AFTER page_number`
      );
      console.log('   ✅ Added position column');
    }
    
    // Add page_template column if missing
    if (!existingColumns.includes('page_template')) {
      console.log('🔄 Adding page_template column...');
      await connection.query(
        `ALTER TABLE pages ADD COLUMN page_template VARCHAR(50) DEFAULT page_type AFTER page_type`
      );
      console.log('   ✅ Added page_template column');
    }
    
    // Add is_deleted column if missing
    if (!existingColumns.includes('is_deleted')) {
      console.log('🔄 Adding is_deleted column...');
      await connection.query(
        `ALTER TABLE pages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE AFTER updated_by`
      );
      console.log('   ✅ Added is_deleted column');
    }
    
    if (existingColumns.length === 3) {
      console.log('✅ Database schema is up to date');
    } else {
      console.log('✅ Database schema migration completed');
    }
    
  } catch (error) {
    console.error('⚠️ Migration check error:', error.message);
    // Non-fatal - continue startup
  } finally {
    if (connection) connection.release();
  }
}

// Test connection
pool.getConnection()
  .then(conn => {
    console.log('✅ Database connected successfully');
    conn.release();
    
    // Run migration after connection test
    return runMigration();
  })
  .catch(err => {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  });

export default pool;
