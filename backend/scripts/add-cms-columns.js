import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to add CMS columns to pages table
 * - position: INT (for manual ordering)
 * - page_template: VARCHAR(50) (for template type)
 * These columns support the new CMS feature (add/delete/reorder pages)
 */

async function migrate() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('🔄 Starting migration: Adding CMS columns...');
    
    // Check if columns already exist
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'pages' AND COLUMN_NAME IN ('position', 'page_template')`
    );
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    // Add position column if it doesn't exist
    if (!existingColumns.includes('position')) {
      console.log('   Adding column: position');
      await connection.query(
        `ALTER TABLE pages ADD COLUMN position INT AFTER page_number`
      );
      console.log('   ✅ Added position column');
    } else {
      console.log('   ℹ️ position column already exists');
    }
    
    // Add page_template column if it doesn't exist
    if (!existingColumns.includes('page_template')) {
      console.log('   Adding column: page_template');
      await connection.query(
        `ALTER TABLE pages ADD COLUMN page_template VARCHAR(50) AFTER page_type`
      );
      console.log('   ✅ Added page_template column');
    } else {
      console.log('   ℹ️ page_template column already exists');
    }
    
    // Add is_deleted column if it doesn't exist
    const [deleteColumns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'pages' AND COLUMN_NAME = 'is_deleted'`
    );
    
    if (deleteColumns.length === 0) {
      console.log('   Adding column: is_deleted');
      await connection.query(
        `ALTER TABLE pages ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE AFTER updated_by`
      );
      console.log('   ✅ Added is_deleted column');
    } else {
      console.log('   ℹ️ is_deleted column already exists');
    }
    
    // Populate position column with page_number if needed
    const [positionData] = await connection.query(
      `SELECT COUNT(*) as count FROM pages WHERE position IS NULL`
    );
    if (positionData[0].count > 0) {
      console.log('   Populating position column...');
      await connection.query(
        `UPDATE pages SET position = page_number WHERE position IS NULL`
      );
      console.log('   ✅ Populated position column');
    }
    
    // Populate page_template column with page_type if needed
    const [templateData] = await connection.query(
      `SELECT COUNT(*) as count FROM pages WHERE page_template IS NULL OR page_template = ''`
    );
    if (templateData[0].count > 0) {
      console.log('   Populating page_template column...');
      await connection.query(
        `UPDATE pages SET page_template = page_type WHERE page_template IS NULL OR page_template = ''`
      );
      console.log('   ✅ Populated page_template column');
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('   New columns: position, page_template, is_deleted');
    console.log('   All existing data preserved - no breaking changes');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    process.exit(0);
  }
}

migrate();
