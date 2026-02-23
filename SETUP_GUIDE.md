# 🚀 Backend Setup Guide

Your `.env` file has been configured with your **Aiven MySQL credentials**. Follow these steps to complete the setup.

---

## **Step 1: Install Dependencies**

```bash
cd backend
npm install
```

This will install all required packages (express, mysql2, cors, dotenv, nodemon).

---

## **Step 2: Test Connection**

```bash
node scripts/setup.js
```

**What this does:**
- ✅ Tests connection to your Aiven MySQL database
- ✅ Creates all required tables (pages, page_history, users, files)
- ✅ Imports all 49 pages from your JSON file to the database
- ✅ Verifies the data

**You should see:**
```
✅ Connected to Aiven MySQL successfully!
📝 Creating database tables...
✅ Database schema created successfully!
🔄 Migrating data from JSON...
✅ Migrated 49 pages successfully!
📊 Database Summary:
   • Total pages in database: 49
   • Total pages in JSON: 49
✅ Database setup complete!
```

---

## **Step 3: Start the Backend Server**

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
🚀 Backend server running on port 5000
📍 Environment: development
🌐 Frontend URL: http://localhost:5173
```

---

## **Step 4: Test the API**

In a new terminal, test the endpoints:

**Get all pages:**
```bash
curl http://localhost:5000/api/pages
```

**Get a single page:**
```bash
curl http://localhost:5000/api/pages/quality_conformance_inspection_group_b
```

**Server health check:**
```bash
curl http://localhost:5000/health
```

---

## **Step 5: Configure Frontend**

Create `.env.local` in your frontend folder:

```
REACT_APP_API_URL=http://localhost:5000/api
```

(This file is already created as `.env` in the frontend if needed, or you can create it)

---

## **Step 6: Connect Frontend to Backend**

The API service is ready at: `src/services/api.js`

Now we need to update React components to use it instead of localStorage.

---

## **Security Note**

⚠️ **Your `.env` file contains sensitive credentials. DO NOT commit it to GitHub!**

The `.gitignore` in the backend folder already excludes `.env` from version control.

For production deployment:
1. Set environment variables in your deployment platform (Heroku, Railway, etc.)
2. Never commit `.env` files
3. Use `.env.example` in the repo as a template

---

## **Port Conflict?**

If port 5000 is already in use, you can change it:

```bash
PORT=5001 npm run dev
```

Or update the `PORT` in `.env` file.

---

## **Database Issues?**

If you get a connection error:

1. **Check credentials in `.env`:**
   ```
   DB_HOST=mysql-27aceb02-dashboard01.k.aivencloud.com
   DB_PORT=26127
   DB_USER=avnadmin
   ```

2. **Check Aiven Console:**
   - Go to Aiven dashboard
   - Verify your MySQL service is running
   - Check IP whitelist if needed

3. **Test connection directly:**
   ```bash
   mysql -h mysql-27aceb02-dashboard01.k.aivencloud.com -P 26127 -u avnadmin -p
   ```

---

## **Next: Frontend Integration**

Once the backend is running successfully, I'll help you:
1. Update React components to use API calls
2. Remove localStorage usage
3. Test full integration
4. Deploy to production

---

**Status:** ✅ Backend ready for testing!

Run: `node scripts/setup.js`
