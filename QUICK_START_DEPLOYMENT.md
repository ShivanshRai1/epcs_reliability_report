# Quick Start: Deploy to Production 🚀

## 5-Minute Deployment

### Prerequisites
- GitHub account with repository that includes both `/backend` and `/epcs-reliability-report` folders
- Render.com account (free at [render.com](https://render.com))
- Netlify account (free at [netlify.com](https://netlify.com))

---

## STEP 1: Deploy Backend to Render.com (3 min)

### 1a. In [Render.com Dashboard](https://dashboard.render.com)
```
1. Click "New" → "Web Service"
2. Click "Connect repository"
3. Find and select your repo (the one with /backend folder)
4. Click "Connect"
```

### 1b. Fill in Service Details
```
Name: epcs-backend
Environment: Node
Build Command: npm install
Start Command: npm run start
Root Directory: backend
Branch: main
```

### 1c. Add Environment Variables
In the "Advanced" section, add:
```
DB_HOST=mysql-27aceb02-dashboard01.k.aivencloud.com
DB_PORT=26127
DB_USER=avnadmin
DB_PASSWORD=<get from your .env file>
DB_NAME=defaultdb
NODE_ENV=production
PRODUCTION_URL=<will update after frontend setup>
```

### 1d. Select Free Plan & Deploy
```
- Click "Free" plan (starter)
- Click "Create Web Service"
```

**Render.com will start deploying automatically!** ⏳

Your URL will be: `https://epcs-backend.onrender.com` (you'll see it in dashboard)

Copy this URL - you'll need it for frontend setup.

---

## STEP 2: Deploy Frontend to Netlify (2 min)

### 2a. In [Netlify Dashboard](https://app.netlify.com)
```
1. Click "Add new site" → "Import an existing project"
2. Connect GitHub
3. Select your repository
4. Click "Deploy site"
```

### 2b. Configure Build Settings
When Netlify asks:
```
Base directory: epcs-reliability-report
Build command: npm run build
Publish directory: dist
```

### 2c. Add Environment Variable
In Netlify → Site settings → Environment:
```
Key: VITE_REACT_APP_API_URL
Value: https://epcs-backend.onrender.com/api

(Copy your Render.com backend URL from Step 1)
```

### 2d. Trigger New Deploy
```
In Netlify → Deploys
→ "Trigger deploy" 
→ "Deploy site"
```

**Netlify will build and deploy!** ⏳

Once ready, you'll get a URL like: `https://your-site.netlify.app`

---

## STEP 3: Verify Everything Works (30 sec)

1. Go to `https://your-site.netlify.app`
2. Wait for pages to load (should load from backend!)
3. Click on a page
4. Edit something
5. Click **Save**
6. Reload page - **changes should persist!** ✅

---

## STEP 4: Update Backend CORS (Optional)

If you want to restrict CORS to only your frontend:

In `backend/server.js`, update:
```javascript
origin: [
  'https://your-netlify-site.netlify.app',  // Add your Netlify URL
]
```

Then commit and push to GitHub (Render.com will auto-redeploy).

---

## That's it! 🎉

Your app is now live and:
- ✅ Frontend is served by Netlify
- ✅ Backend API running on Render.com  
- ✅ Database on Aiven MySQL
- ✅ Changes persist to database
- ✅ Auto-deploys on git push

---

## If Something Goes Wrong

### Pages don't load
1. Check browser console (F12 → Network tab)
2. Look for red network request to API
3. Verify your VITE_REACT_APP_API_URL in Netlify matches Render.com URL

### API errors 
1. Check Render.com Logs (Render → select service → Logs)
2. Verify environment variables are set
3. Test directly: `curl https://epcs-backend.onrender.com/api/pages`

### Database connection issue
1. Verify DB_HOST, DB_PORT, DB_USER, DB_PASSWORD match .env file
2. Test SSH connection to Aiven: `mysql -h <host> -u <user> -p` 

---

## Next Steps

- [ ] Share frontend URL with team
- [ ] Set up email alerts in Railway & Netlify
- [ ] Plan database backups (Aiven has them by default)
- [ ] Monitor first deployments in dashboards
- [ ] Future: Set up DigitalOcean Spaces for file uploads

---

## Useful Links

- [Render.com Dashboard](https://dashboard.render.com)
- [Netlify Dashboard](https://app.netlify.com)
- [Aiven Console](https://console.aiven.io/)
- Backend logs: Render.com → Services → select service → Logs
- Frontend logs: Netlify → Deploys → click deploy → View logs
- Database: Aiven → Databases → Services

Happy deploying! 🚀
