# Deployment Guide - EPCS Reliability Report

## Executive Summary
- **Backend**: deployed to [Render.com](https://render.com) with MySQL on Aiven
- **Frontend**: deployed to [Netlify](https://netlify.com)
- **Database**: Aiven MySQL (managed cloud database)
- **Estimated Cost**: ~$30-50/month (Aiven MySQL + Render.com starter plan)

---

## Backend Deployment (Render.com)

### Prerequisites
1. Render.com account ([render.com](https://render.com))
2. GitHub account with repository
3. Environment variables ready

### Step 1: Connect GitHub to Render.com
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Select "Build and deploy from a Git repository"
4. Connect your GitHub account and authorize
5. Select your repository

### Step 2: Configure Web Service Settings
Fill in the following:
- **Name**: `epcs-backend`
- **GitHub URL**: select your repository
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm run start`

### Step 3: Configure Environment Variables
Click "Advanced" → "Environment Variables" and add:

```
DB_HOST=mysql-27aceb02-dashboard01.k.aivencloud.com
DB_PORT=26127
DB_USER=avnadmin
DB_PASSWORD=<your-aiven-password>
DB_NAME=defaultdb
NODE_ENV=production
PRODUCTION_URL=https://your-netlify-frontend.netlify.app
```

### Step 4: Deploy
- Select **Free** plan (or Starter for production)
- Click "Create Web Service"
- Render will auto-build and deploy

**Your backend URL**: appears in Render dashboard as `https://epcs-backend.onrender.com`

---

## Frontend Deployment (Netlify)

### Prerequisites
1. Netlify account ([netlify.com](https://netlify.com))
2. GitHub repository connected

### Step 1: Update API URL
Update `epcs-reliability-report/.env.production`:

```bash
VITE_REACT_APP_API_URL=https://epcs-backend.onrender.com/api
```

(Replace with your Render.com backend URL)

### Step 2: Connect GitHub to Netlify
1. Go to [netlify.com/app/sites](https://netlify.com/app/sites)
2. Click "Add new site" → "Import an existing project"
3. Select GitHub and authorize
4. Choose your repository
5. Configure build settings:
   - **Base directory**: `epcs-reliability-report`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### Step 3: Set Environment Variables
In Netlify dashboard, go to **Site settings** → **Build & deploy** → **Environment**:

```
VITE_REACT_APP_API_URL=https://epcs-backend.onrender.com/api
```

(Replace with your actual Render.com backend URL)

### Step 4: Deploy
1. First deploy is immediate from GitHub
2. Future deployments happen automatically on git push to `main`

**Your frontend URL**: `https://your-site-name.netlify.app`

---

## Complete Deployment Checklist

```
Backend (Railway):
☐ GitHub repo connected to Railway
☐ Environment variables configured
☐ Build succeeds without errors
☐ Health check endpoint returns 200 at /health
☐ API endpoint returns pages at /api/pages

Frontend (Netlify):
☐ GitHub repo connected to Netlify
☐ Build command runs successfully
☐ Environment variables set for backend URL
☐ Frontend loads at netlify.app URL
☐ API calls reach backend successfully
☐ Save feature works end-to-end

Database (Aiven MySQL):
☐ Connection remains active
☐ All 51 pages still in database
☐ No query errors in logs

Integration:
☐ Open frontend URL
☐ Pages load from backend immediately
☐ Edit a page and click Save
☐ Verify change persisted by reloading
☐ Check page history in backend database
```

---

## Troubleshooting

### Backend API returning 500 errors
1. Check environment variables in Render.com dashboard
2. Verify MySQL connection: `SELECT COUNT(*) FROM pages;`
3. Check Render.com logs in dashboard (Services → select service → Logs)

### Frontend not connecting to backend
1. Check API URL in browser console (should be https://epcs-backend.onrender.com/api)
2. Verify CORS is enabled in backend (`Access-Control-Allow-Credentials`)
3. Check browser Network tab for CORS errors

### Pages not showing after deployment
1. Verify 51 pages exist in Aiven MySQL
2. Test `/api/pages` endpoint directly: `curl https://epcs-backend.onrender.com/api/pages`
3. Check frontend browser console for fetch errors

---

## Post-Deployment

### Monitor & Maintain
- Monitor Render.com dashboard for service status
- Check Netlify build logs in dashboard
- Set up email alerts in Render.com for failures

### Future Updates
Every git push to `main` will:
1. Trigger Render.com backend rebuild & deploy
2. Trigger Netlify frontend rebuild & deploy
3. Zero downtime (services remain running during deploy)

---

## Cost Breakdown (Estimated Monthly)

| Service | Plan | Cost |
|---------|------|------|
| Render.com | Free Tier | $0 |
| Aiven MySQL | Small | $20-30 |
| Netlify | Free | $0 |
| **Total** | | **$20-30** |

For production scale, consider upgrading to Render.com Starter ($7/month) or DigitalOcean droplet ($6/month).

---

## Rollback Procedure

If deployment causes issues:

1. **Backend**: Go to Render.com → Services → select service → Deployments → click previous successful deploy to rollback
2. **Frontend**: Netlify → Deploys → select previous successful deploy
3. **Database**: Aiven maintains backups - contact support for restoration

---

## Security Checklist

- [ ] Database password is strong and unique
- [ ] Environment variables are set (no secrets in code)
- [ ] CORS only allows your frontend domain
- [ ] HTTPS is enforced (auto by Railway & Netlify)
- [ ] Database backups are enabled (Aiven default)
- [ ] Sensitive files (.env) are in .gitignore

