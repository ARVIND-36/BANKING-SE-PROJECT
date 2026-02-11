# CI/CD Pipeline Setup Guide

## Overview
Your project now has two GitHub Actions workflows:
1. **Backend CI/CD** - Tests and deploys to Azure App Service
2. **Frontend CI/CD** - Builds and deploys to Azure Static Web Apps

---

## Step 1: Push Workflows to GitHub

The workflow files are already created in `.github/workflows/`:
- `backend-ci-cd.yml`
- `frontend-ci-cd.yml`

Push them to your GitHub repository:

```bash
git add .github/
git commit -m "Add CI/CD workflows"
git push origin main
```

---

## Step 2: Set Up Azure Resources

### Backend - App Service

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new **App Service**:
   - Resource Group: Create or select existing
   - Name: `nidhi-backend` (or your choice)
   - Runtime Stack: Node.js 18 LTS
   - Region: Closest to you

3. After creation, go to **Deployment Center**:
   - Source: GitHub
   - Organization: Select your GitHub account
   - Repository: Your banking project
   - Branch: main
   - Build Provider: GitHub Actions (auto-selected)
   - Click **Save**

4. Get the **Publish Profile**:
   - Go to App Service → **Settings** → **Download publish profile**
   - Copy the entire content

### Frontend - Static Web Apps

1. Create a new **Static Web App**:
   - Resource Group: Same as backend
   - Name: `nidhi-frontend`
   - Region: Same as backend
   - SKU: Free tier
   - Source: GitHub
   - Select your repository and `main` branch
   - Build presets: React
   - App location: `front-end`
   - Build output location: `dist`

2. Deploy - Azure will create a GitHub Action automatically
   - You can see the token in **Manage deployment token**

---

## Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click **New repository secret** and add:

### For Backend:
```
AZURE_APP_SERVICE_NAME = nidhi-backend
AZURE_APP_SERVICE_PUBLISH_PROFILE = [paste entire publish profile XML content]
```

### For Frontend:
```
VITE_API_BASE_URL = https://nidhi-backend.azurewebsites.net/api
AZURE_STATIC_WEB_APPS_TOKEN = [Get from Static Web App → Settings → Manage deployment token]
```

---

## Step 4: Configure Azure App Service Environment

1. Go to Azure Portal → App Service (nidhi-backend)
2. Settings → **Environment variables** (or Configuration)
3. Add your production environment variables:

```
SMTP_EMAIL = your-gmail@gmail.com
SMTP_PASSWORD = [gmail app password]
JWT_SECRET = [your-jwt-secret]
NEON_URL = [your-neon-db-url]
NODE_ENV = production
PORT = 8080 (Azure assigns this)
```

4. Click **Save**

---

## Step 5: Update Backend for Production

Your `back-end/index.js` already reads from `process.env.PORT`, which is good.

Make sure your `.env.example` is in the repo (for reference):
```env
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=app-password
JWT_SECRET=secret-key-here
NEON_URL=postgresql://user:password@host/db?sslmode=require
NODE_ENV=development
PORT=5000
```

---

## Step 6: Test the Pipeline

1. Make a small change to a file in `back-end/` or `front-end/`
2. Push to main:
   ```bash
   git add .
   git commit -m "Test CI/CD pipeline"
   git push origin main
   ```

3. Go to GitHub → Actions tab
   - You should see workflows running
   - Backend tests, builds, and deploys
   - Frontend builds and deploys

4. Monitor progress:
   - **Backend**: Azure App Service → **Activity log**
   - **Frontend**: Static Web App → **Deployments**

---

## Workflow Details

### Backend Workflow (backend-ci-cd.yml)
- **Triggers**: Push to `main` or PR
- **Steps**:
  1. Checkout code
  2. Setup Node.js 18
  3. Install dependencies (`npm ci`)
  4. Lint code (if script exists)
  5. Run tests (if script exists)
  6. Build (if script exists)
  7. Deploy to Azure App Service (only on `main` push)

**Note**: Add lint/test scripts to package.json to fully utilize:
```json
"lint": "eslint src/",
"test": "jest"
```

### Frontend Workflow (frontend-ci-cd.yml)
- **Triggers**: Push to `main` or PR
- **Steps**:
  1. Checkout code
  2. Setup Node.js 18
  3. Install dependencies (`npm ci`)
  4. Lint code (uses eslint.config.js)
  5. Build (`npm run build`)
  6. Deploy to Azure Static Web Apps (only on `main` push)

---

## Troubleshooting

### Backend Deployment Fails
1. Check **App Service → Logs** (stream live logs)
2. Verify environment variables are set
3. Check database connection with `NEON_URL`
4. Ensure publish profile secret is correct

### Frontend Build Fails
1. Check **Actions** tab for build errors
2. Common issues:
   - `VITE_API_BASE_URL` not set
   - Missing environment variables
   - Node modules not compatible

### Workflows Don't Trigger
1. Verify branch is `main`
2. Check file paths in `paths:` filter
3. Ensure secrets are set (no typos)

---

## Next Steps

1. ✅ Workflows created and pushed
2. ✅ Azure resources created
3. ✅ GitHub secrets added
4. ✅ Environment variables configured
5. **Test the pipeline** (make a commit)
6. **Monitor deployments** (Actions & Azure Portal)
7. **Go live** (after testing passes)

---

## Production Checklist

- [ ] Secrets set in GitHub (all 4 variables)
- [ ] Environment variables set in App Service
- [ ] CORS updated in backend if needed
- [ ] Frontend API URL points to production backend
- [ ] Database backups configured
- [ ] Error logging enabled (Winston already configured)
- [ ] First test deployment successful
- [ ] Transaction emails work with production Gmail
