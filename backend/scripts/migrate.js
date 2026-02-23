import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrateData() {
  try {
    console.log('🔄 Starting data migration...');

    // Read JSON file
    const jsonPath = path.join(__dirname, '../../epcs-reliability-report/public/structured_report_data.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    const connection = await pool.getConnection();

    // Insert pages
    console.log('📝 Inserting pages into database...');
    for (const page of jsonData.pages) {
      try {
        await connection.query(
          `INSERT INTO pages (page_id, page_number, page_type, title, page_data, updated_by) 
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE page_data = VALUES(page_data)`,
          [
            page.id || `page_${page.pageNumber}`,
            page.pageNumber,
            page.pageType,
            page.title,
            JSON.stringify(page),
            'migration'
          ]
        );
      } catch (err) {
        console.error(`Error inserting page ${page.id}:`, err.message);
      }
    }

    connection.release();

    console.log(`\n✅ Migration complete!`);
    console.log(`📊 Total pages migrated: ${jsonData.pages.length}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  }
}

migrateData();
