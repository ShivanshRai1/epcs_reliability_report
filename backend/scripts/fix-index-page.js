import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixIndexPage() {
  try {
    console.log('🔧 Fixing index_page1 data...\n');

    const connection = await pool.getConnection();

    // Read the original JSON
    const jsonPath = path.join(__dirname, '../../epcs-reliability-report/public/structured_report_data.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    // Find index_page1
    const indexPage = jsonData.pages.find(p => p.id === 'index_page1');
    
    if (!indexPage) {
      console.error('❌ Could not find index_page1 in JSON');
      process.exit(1);
    }

    console.log(`📄 Found index_page1 with ${indexPage.content.length} content items`);

    // Update the database
    await connection.execute(
      `UPDATE pages SET page_data = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE page_id = ?`,
      [
        JSON.stringify(indexPage),
        'fix-script',
        'index_page1'
      ]
    );

    console.log('✅ Successfully restored index_page1 data!\n');

    // Verify
    const [rows] = await connection.query(
      'SELECT page_data FROM pages WHERE page_id = ?',
      ['index_page1']
    );

    if (rows.length > 0) {
      const pageData = rows[0].page_data;
      console.log(`📊 Verification: Content array has ${pageData.content?.length || 0} items`);
    }

    await connection.end();

  } catch (error) {
    console.error('❌ Fix error:', error.message);
    process.exit(1);
  }
}

fixIndexPage();
