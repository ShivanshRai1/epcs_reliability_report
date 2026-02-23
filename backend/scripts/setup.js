import mysql from 'mysql2/promise.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setupDatabase() {
  try {
    console.log('🔧 Setting up EPCS Reliability Report database...\n');

    // Create connection to Aiven MySQL
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });

    console.log('✅ Connected to Aiven MySQL successfully!\n');

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split schema into individual statements
    const statements = schema.split(';').filter(stmt => stmt.trim());

    console.log(`📝 Creating database tables (${statements.length} statements)...`);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
        } catch (err) {
          console.error('Error executing statement:', err.message);
        }
      }
    }

    console.log('✅ Database schema created successfully!\n');

    // Migrate data from JSON
    console.log('🔄 Migrating data from JSON...');
    
    const jsonPath = path.join(__dirname, '../../epcs-reliability-report/public/structured_report_data.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

    let insertedCount = 0;
    for (const page of jsonData.pages) {
      try {
        await connection.execute(
          `INSERT INTO pages (page_id, page_number, page_type, title, page_data, updated_by) 
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE page_data = VALUES(page_data)`,
          [
            page.id || `page_${page.pageNumber}`,
            page.pageNumber,
            page.pageType,
            page.title || '',
            JSON.stringify(page),
            'migration'
          ]
        );
        insertedCount++;
      } catch (err) {
        console.error(`Error inserting page ${page.id}:`, err.message);
      }
    }

    console.log(`✅ Migrated ${insertedCount} pages successfully!\n`);

    // Verify data
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM pages');
    const totalPages = rows[0].count;

    console.log('📊 Database Summary:');
    console.log(`   • Total pages in database: ${totalPages}`);
    console.log(`   • Total pages in JSON: ${jsonData.pages.length}`);
    console.log('');

    await connection.end();

    console.log('✅ Database setup complete! You can now:');
    console.log('   1. Run: npm run dev');
    console.log('   2. Backend will start on http://localhost:5000');
    console.log('   3. Test API at http://localhost:5000/api/pages');
    console.log('');

  } catch (error) {
    console.error('❌ Setup error:', error.message);
    process.exit(1);
  }
}

setupDatabase();
