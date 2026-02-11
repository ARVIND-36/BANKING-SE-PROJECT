# Quick Start: CI/CD Pipeline

## What Just Happened?
✅ GitHub Actions workflows created for automatic testing & deployment
✅ CI-CD setup guide created (see `CI-CD-SETUP.md`)
✅ Environment templates created (`.env.example` files)

---

## 5-Minute Quick Setup

### 1. Push to GitHub
```bash
git add .github/ back-end/.env.example front-end/.env.example .gitignore CI-CD-SETUP.md
git commit -m "Setup: CI/CD pipeline with GitHub Actions"
git push origin main
```

### 2. Create Azure Resources (via Portal)
- **Backend**: App Service (Node.js 18, Free tier)
- **Frontend**: Static Web App (Free tier)

### 3. Add GitHub Secrets
Go to `GitHub → Settings → Secrets → Actions` and add:
```
AZURE_APP_SERVICE_NAME = your-app-service-name
AZURE_APP_SERVICE_PUBLISH_PROFILE = [paste publish profile XML]
VITE_API_BASE_URL = https://your-backend.azurewebsites.net/api
AZURE_STATIC_WEB_APPS_TOKEN = [from Static Web App dashboard]
```

### 4. Set Azure App Service Env Vars
Backend environment variables in Azure App Service:
```
SMTP_EMAIL, SMTP_PASSWORD, JWT_SECRET, NEON_URL, NODE_ENV=production
```

### 5. Test
Make a commit → Watch GitHub Actions → Check Azure deployments

---

## Workflow Triggers

| Event | Backend | Frontend |
|-------|---------|----------|
| Push to `main` | Tests, builds, deploys ✅ | Builds, deploys ✅ |
| PR to `main` | Tests, builds (no deploy) | Builds (no deploy) |
| Push to `back-end/**` | Runs | - |
| Push to `front-end/**` | - | Runs |

---

## Files Created/Modified

```
✅ .github/workflows/backend-ci-cd.yml       (New)
✅ .github/workflows/frontend-ci-cd.yml      (New)
✅ back-end/.env.example                     (New)
✅ front-end/.env.example                    (New)
✅ CI-CD-SETUP.md                            (New - Full guide)
✅ .gitignore                                (Updated)
```

---

## Common Issues & Fixes

**Workflows don't run?**
- Ensure files are in `.github/workflows/` directory
- Make sure `.yml` files are committed

**Secrets show as undefined?**
- Check secret names exactly match in workflows (case-sensitive)
- Re-save secrets in GitHub

**Azure deployment fails?**
- Check **App Service → Logs**
- Verify all environment variables are set
- Make sure database URL is reachable

**Frontend build fails?**
- Check that `VITE_API_BASE_URL` is set
- Ensure `front-end/vite.config.js` is correct

---

## Next: Manual Testing

1. Make a test commit: `git push origin main`
2. Check GitHub Actions tab
3. Once passed, verify Azure resources are updated
4. Test the deployed app

---

## Need Help?

See `CI-CD-SETUP.md` for detailed step-by-step instructions
