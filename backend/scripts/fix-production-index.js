import mysql from 'mysql2/promise.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load production environment variables
dotenv.config({ path: path.join(__dirname, '../.env.production') });

async function fixProductionIndex() {
  let connection;
  
  try {
    console.log('🔧 Fixing PRODUCTION index_page1 data...\n');
    console.log('Connecting to:', process.env.DB_HOST);

    // Create direct connection to production database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to PRODUCTION database\n');

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
        'fix-production-script',
        'index_page1'
      ]
    );

    console.log('✅ Successfully updated PRODUCTION index_page1!\n');

    // Verify
    const [rows] = await connection.query(
      'SELECT page_data FROM pages WHERE page_id = ?',
      ['index_page1']
    );

    if (rows.length > 0) {
      const pageData = rows[0].page_data;
      console.log(`📊 Verification: Content array has ${pageData.content?.length || 0} items`);
      
      if (pageData.content && pageData.content.length > 0) {
        console.log('\nFirst 3 items:');
        pageData.content.slice(0, 3).forEach((item, idx) => {
          console.log(`  ${idx + 1}. ${item.title}`);
        });
      }
    }

    await connection.end();
    console.log('\n✅ Production database fixed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

fixProductionIndex();
