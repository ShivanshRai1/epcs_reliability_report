import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import pool from './config/database.js';
import pagesRoute from './routes/pages.js';
import historyRoute from './routes/history.js';
import cmsRoute from './routes/cms.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://epcs-reliability-report.netlify.app',
    process.env.PRODUCTION_URL
  ],
  credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// HEAD request support for uptime monitoring (UptimeRobot, etc)
app.head('/health', (req, res) => {
  res.status(200).end();
});

app.head('/', (req, res) => {
  res.status(200).end();
});

// API Routes
app.use('/api/pages', pagesRoute);
app.use('/api/history', historyRoute);
app.use('/api/cms', cmsRoute);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'EPCS Reliability Report Backend',
    version: '1.0.0',
    endpoints: [
      'GET /health',
      'GET /api/pages',
      'GET /api/pages/:pageId',
      'POST /api/pages/:pageId',
      'GET /api/report/full',
      'GET /api/history/:pageId',
      '--- CMS Endpoints (NEW) ---',
      'GET /api/cms/templates',
      'POST /api/cms/create',
      'DELETE /api/cms/:pageId',
      'PATCH /api/cms/reorder',
      'GET /api/cms/list'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Backend server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});
