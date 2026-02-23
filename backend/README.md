# EPCS Reliability Report - Backend Server

Node.js + Express backend for the EPCS Reliability Report application. Handles data persistence with Aiven MySQL database.

## Features

- ✅ Express.js REST API
- ✅ Aiven MySQL Database Integration
- ✅ Page CRUD Operations
- ✅ Change History Tracking
- ✅ Full Report Export
- ✅ CORS Support
- ✅ Error Handling
- ✅ Data Migration Script

## Prerequisites

- Node.js 16+
- Aiven MySQL Database (credentials)
- npm

## Installation

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Create `.env` file** (copy from `.env.example`):
```bash
cp .env.example .env
```

3. **Update `.env` with your Aiven credentials:**
```
DB_HOST=your-aiven-mysql-host.aivencloud.com
DB_USER=avnadmin
DB_PASSWORD=your-password
DB_NAME=your_database
DB_PORT=3306
```

## Database Setup

1. **Create the database schema** in Aiven MySQL:
   - Go to Aiven Console
   - Open your MySQL database
   - Go to SQL Terminal
   - Copy and paste content from `scripts/schema.sql`
   - Execute

   Or use MySQL client:
   ```bash
   mysql -h your-host -u avnadmin -p your_database < scripts/schema.sql
   ```

2. **Migrate your existing data:**
```bash
npm run migrate
```

This will read `epcs-reliability-report/public/structured_report_data.json` and populate the database.

## Running the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server runs on `http://localhost:5000`

## API Endpoints

### Pages
- `GET /api/pages` - Get all pages
- `GET /api/pages/:pageId` - Get single page
- `POST /api/pages/:pageId` - Create/Update page
- `GET /api/pages/export/full` - Get full report as JSON

### History
- `GET /api/history` - Get all recent changes
- `GET /api/history/:pageId` - Get page history

### Health
- `GET /health` - Server health check
- `GET /` - API info

## Environment Variables

```
DB_HOST=              # Aiven MySQL host
DB_USER=              # Database user
DB_PASSWORD=          # Database password
DB_NAME=              # Database name
DB_PORT=              # Database port (default: 3306)
PORT=                 # Server port (default: 5000)
NODE_ENV=             # development/production
FRONTEND_URL=         # Frontend URL for CORS
PRODUCTION_URL=       # Production frontend URL
TRACK_HISTORY=        # Enable change tracking (true/false)
```

## Project Structure

```
backend/
├── config/
│   └── database.js          # MySQL connection pool
├── routes/
│   ├── pages.js             # Page endpoints
│   └── history.js           # History endpoints
├── scripts/
│   ├── schema.sql           # Database schema
│   └── migrate.js           # Data migration script
├── server.js                # Express server
├── package.json
├── .env.example
└── .env                     # (not committed)
```

## Database Schema

### pages table
- `id` - Auto-increment primary key
- `page_id` - Unique page identifier
- `page_number` - Page order number
- `page_type` - Type (table, image, split-content-image, etc.)
- `title` - Page title
- `page_data` - Full page JSON data
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `updated_by` - User who made changes

### page_history table
- Tracks all changes to pages
- Stores old_data and new_data for comparison
- Records who made changes and when

### users table
- For future authentication implementation

### files table
- For future file storage integration with DigitalOcean Spaces

## Deployment

### Heroku:
```bash
git push heroku main
```

### Railway:
Connect GitHub repo, Railway detects Node.js automatically

### DigitalOcean App Platform:
1. Connect GitHub repo
2. Create new app
3. Set environment variables
4. Deploy

## Testing

Check if backend is running:
```bash
curl http://localhost:5000/health
```

Get all pages:
```bash
curl http://localhost:5000/api/pages
```

## Next Steps

- [ ] Connect frontend to backend API
- [ ] Remove localStorage usage from React
- [ ] Integrate DigitalOcean Spaces for file storage
- [ ] Add authentication
- [ ] Set up automated backups
- [ ] Performance optimization

## Support

For issues or questions, check:
1. `.env` file configuration
2. Database connectivity
3. CORS settings in server.js
4. Console error messages

---

**Backend Status:** ✅ Ready for integration
