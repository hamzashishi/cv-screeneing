# DigitalOcean Deployment Guide

Deploy your Django + React CV Screening app on DigitalOcean App Platform with Auto-Deploy from GitHub.

## Prerequisites

- GitHub account (repo: https://github.com/hamzashishi/cv-screeneing.git)
- DigitalOcean account (free trial available)

## Step 1: Create DigitalOcean App

1. Go to [DigitalOcean Console](https://cloud.digitalocean.com)
2. Click **Create** → **Apps**
3. Select **GitHub** and authorize your GitHub account
4. Search and select `hamzashishi/cv-screeneing` repository
5. Click **Next**

## Step 2: Configure Build Settings

DigitalOcean will auto-detect Django. Ensure these settings:

- **Source Branch**: `main`
- **Build Command**: `pip install -r cv-screening-backend/requirements.txt && python cv-screening-backend/manage.py collectstatic --noinput`
- **Run Command**: `gunicorn -w 4 -b 0.0.0.0:8080 cv_screening_project.wsgi:application --chdir cv-screening-backend`
- **HTTP Port**: `8080`

## Step 3: Create PostgreSQL Database

1. In App Platform, click **Create new resource**
2. Choose **Database** → **PostgreSQL**
3. Select plan (free tier available)
4. Name it: `cv-screening-db`
5. Click **Create and Attach**

DigitalOcean will automatically:
- Generate database credentials
- Set `DATABASE_URL` environment variable
- Link to your app

## Step 4: Set Environment Variables

In the **App Settings** tab, add these exact environment variables:

```
DEBUG=False
DJANGO_SECRET_KEY=your-secret-key-here-min-50-chars
DATABASE_URL=postgresql://user:password@host:port/dbname
ALLOWED_HOSTS=your-app-name.ondigitalocean.app
CORS_ALLOWED_ORIGINS=https://cv-screening-ten.vercel.app,https://your-app-name.ondigitalocean.app
JWT_SECRET_KEY=your-jwt-secret-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DELTA=3600
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

**Note**: DigitalOcean provides `DATABASE_URL` automatically. You don't need to set individual DB fields.

## Step 5: Create .env file for Backend

Add to your repo at `cv-screening-backend/.env`:

```env
DEBUG=False
DJANGO_SECRET_KEY=your-very-long-secret-key-minimum-50-characters-here
ALLOWED_HOSTS=your-app-name.ondigitalocean.app
CORS_ALLOWED_ORIGINS=https://cv-screening-ten.vercel.app,https://your-app-name.ondigitalocean.app
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET_KEY=your-jwt-secret-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DELTA=3600
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

**Warning**: Don't commit `.env` with real credentials. Use DigitalOcean environment variables instead.

## Step 6: Update Frontend API URL

Edit `cv-screening-frontend/.env.production`:

```env
VITE_API_URL=https://your-app-name.ondigitalocean.app/api
```

Commit and push to GitHub.

## Step 7: Deploy

1. In DigitalOcean App Platform, review all settings
2. Click **Deploy**
3. Wait for build to complete (5-15 minutes)
4. Once "Live" appears, your app is deployed

DigitalOcean will auto-redeploy on every push to `main` branch.

## Step 8: Run Database Migrations

Once deployed, run migrations in the app console:

1. In App Platform, go to your app
2. Click **Console** tab
3. Run:
   ```bash
   python cv-screening-backend/manage.py migrate
   python cv-screening-backend/manage.py createsuperuser
   ```

## Step 9: Verify Deployment

Open these URLs:

- **Backend API**: `https://your-app-name.ondigitalocean.app/api/`
- **Admin Panel**: `https://your-app-name.ondigitalocean.app/admin/`
- **Frontend**: `https://cv-screening-ten.vercel.app`

## Step 10: Update CORS Settings (If Needed)

If frontend can't reach backend, update `cv-screening-backend/cv_screening_project/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "https://cv-screening-ten.vercel.app",
    "https://your-app-name.ondigitalocean.app",
]
```

Push to GitHub, DigitalOcean will auto-redeploy.

## Troubleshooting

### Check Logs

1. In App Platform, go to your app
2. Click **Runtime Logs** tab
3. Search for errors

### Common Issues

**Issue**: `ModuleNotFoundError: No module named 'django'`
- **Fix**: Ensure `requirements.txt` is in repo root or path is correct in build command

**Issue**: Database connection failed
- **Fix**: Verify `DATABASE_URL` is set in environment variables

**Issue**: CORS error from frontend
- **Fix**: Add frontend URL to `CORS_ALLOWED_ORIGINS` in Django settings and redeploy

**Issue**: Static files not loading
- **Fix**: Run `python manage.py collectstatic --noinput` manually in console

### Manual Console Access

```bash
# SSH into app
doctl apps get [APP_ID] --format runtime_logs

# Or use Console tab in DigitalOcean dashboard
```

## Upgrading/Scaling

DigitalOcean free trial includes:
- 1 web service (your Django app)
- 1 PostgreSQL database (1GB)
- 100GB bandwidth

To upgrade:
1. Go to **Settings** → **Billing**
2. Select a paid plan (starts $5/month)

## API Endpoints

Once deployed, your backend will be accessible at:

```
https://your-app-name.ondigitalocean.app/api/
```

Frontend should update `VITE_API_URL` to match.

## Next Steps

1. Configure email service (SendGrid, Mailgun) for password resets
2. Set up monitoring/alerts
3. Configure backup strategy for PostgreSQL
4. Add SSL certificate (auto-provided by DigitalOcean)

---

**Questions?** Check DigitalOcean docs: https://docs.digitalocean.com/products/app-platform/
