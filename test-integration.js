#!/usr/bin/env node

// Quick integration test
const http = require('http');

async function testAPI(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Integration...\n');

  try {
    console.log('📡 Testing Backend API...');
    const apiResponse = await testAPI('http://localhost:5000/api/pages');
    if (apiResponse.status === 200) {
      const pages = JSON.parse(apiResponse.data);
      console.log(`✅ Backend API working! Returned ${pages.length} pages\n`);
    } else {
      console.log(`❌ Backend API returned status ${apiResponse.status}\n`);
    }
  } catch (err) {
    console.log(`❌ Backend API error: ${err.message}\n`);
  }

  try {
    console.log('🌐 Testing Frontend Server...');
    const frontendResponse = await testAPI('http://localhost:5173/');
    if (frontendResponse.status === 200) {
      console.log(`✅ Frontend server running!\n`);
    } else {
      console.log(`⚠️  Frontend returned status ${frontendResponse.status}\n`);
    }
  } catch (err) {
    console.log(`❌ Frontend error: ${err.message}\n`);
  }

  console.log('✨ Integration test complete!');
}

runTests();
