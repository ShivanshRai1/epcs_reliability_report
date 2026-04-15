import mysql from 'mysql2/promise.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkPage() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    const [rows] = await connection.query(
      `SELECT id, title, page_id, page_data FROM pages WHERE page_id = 'dla_qualified' OR title LIKE '%DLA QUALIFIED%'`
    );
    
    if (rows.length > 0) {
      console.log('Found page:', rows[0].id, rows[0].title);
      const data = typeof rows[0].page_data === 'string' 
        ? JSON.parse(rows[0].page_data) 
        : rows[0].page_data;
      
      if (data.table && data.table.data) {
        console.log('\nTotal rows:', data.table.data.length);
        console.log('\nAll rows with their colors:');
        data.table.data.forEach((row, idx) => {
          const partNum = row['PART NUMBER'];
          const color = row.rowColor || 'NO COLOR';
          console.log(`  ${idx + 1}. ${partNum}: ${color}`);
        });
      }
    } else {
      console.log('No page found');
    }
  } finally {
    await connection.end();
  }
}

checkPage().catch(console.error);
