# Render Deployment Guide

Essential steps to deploy the Django backend on Render.

## 1. Use the included repo config

This repository already includes `render.yaml` and `Dockerfile` at the root.
Render will deploy the Django backend from the `cv-screening-backend` folder.

## 2. Create the web service

1. Go to https://dashboard.render.com
2. Click **New** → **Web Service**
3. Connect GitHub and select your repository
4. Confirm Render detects `render.yaml`
5. Set the service root to `.` and use the provided Docker settings

## 3. Add required environment variables

Set these values in Render:

```env
DJANGO_SECRET_KEY=your-production-secret-key
SECRET_KEY=your-production-secret-key
ALLOWED_HOSTS=your-render-app.onrender.com
CORS_ALLOWED_ORIGINS=https://cv-screening-ten.vercel.app,https://your-render-app.onrender.com
JWT_SECRET_KEY=your-jwt-secret-key
DEBUG=False
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=saidshishi919@gmail.com
EMAIL_HOST_PASSWORD=your-email-app-password
DEFAULT_FROM_EMAIL=saidshishi919@gmail.com
DATABASE_URL=postgresql://user:password@host:port/dbname
SECURE_SSL_REDIRECT=True
```

Use PostgreSQL for the Render database. If you attach a Render PostgreSQL managed database, Render will provide `DATABASE_URL` automatically.

## 4. Run migrations

After the service deploys, open the Render shell and run:

```bash
python manage.py migrate
python manage.py createsuperuser
```

## 5. Verify

Open `https://your-render-app.onrender.com/api/` and confirm the API root responds.

## 6. Update frontend

In `cv-screening-frontend/.env.production`, set:

```env
VITE_API_URL=https://your-render-app.onrender.com/api
```

Then rebuild or redeploy the frontend.

## Troubleshooting

- If deployment fails, inspect Render build logs.
- If static files are missing, ensure `collectstatic` runs successfully.
- If CORS fails, add the frontend domain to `CORS_ALLOWED_ORIGINS`.
