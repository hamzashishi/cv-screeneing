# CV Screening Backend

Django REST API backend for the CV Screening system.

## Run Backend (PowerShell)

```powershell
cd C:\Users\hp\Desktop\data\cv-screening-backend
```

### 1. Create and activate virtual environment
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### 2. Install dependencies
```powershell
pip install -r requirements.txt
```

### 3. Configure environment
Create/update `.env` in this folder:

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-real-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
DEFAULT_FROM_EMAIL=your-real-email@gmail.com
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173
```

### 4. Run migrations
```powershell
python manage.py migrate
```

### 5. Start backend server
```powershell
python manage.py runserver 0.0.0.0:8000 --noreload
```

Backend URL: `http://localhost:8000`  
API URL: `http://localhost:8000/api`

## Admin Portal

```powershell
python manage.py createsuperuser
```

Open: `http://localhost:8000/admin`

## Useful Commands

Run tests:
```powershell
python manage.py test
```

Check project config:
```powershell
python manage.py check
```

## Full Stack Run Guide

For backend + frontend run instructions together, see:

- `RUN_SYSTEM_TERMINAL.md`

## Deploy Backend on Render

This backend is set up to deploy on Render using the root [`render.yaml`](C:/Users/hp/Desktop/data/render.yaml).

### Render service settings

- Root directory: `cv-screening-backend`
- Build command:
  `pip install --upgrade pip setuptools wheel && pip install -r requirements.txt && python manage.py collectstatic --noinput`
- Start command:
  `python manage.py migrate && gunicorn cv_screening_project.wsgi:application`

### Required environment variables

Set these in Render:

```env
DEBUG=False
SECRET_KEY=your-production-secret
JWT_SECRET=your-jwt-secret
ALLOWED_HOSTS=your-backend-domain.onrender.com
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-backend-domain.onrender.com,https://your-frontend-domain.vercel.app
DB_ENGINE=django.db.backends.postgresql
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=your-db-host
DB_PORT=5432
```

### Optional email variables

```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

## Deploy Backend on Railway

This backend can also be deployed on Railway. It now supports Railway's `DATABASE_URL` format directly and includes a [`Procfile`](C:/Users/hp/Desktop/data/cv-screening-backend/Procfile).

### Railway steps

1. Push the backend code to GitHub.
2. In Railway, create a new project.
3. Choose `Deploy from GitHub repo`.
4. Select your repository and set the service root to `cv-screening-backend`.
5. Add a PostgreSQL database service to the same Railway project.
6. Generate a public domain for the backend service.

### Start command

If Railway does not detect the `Procfile` automatically, set the custom start command to:

```bash
python manage.py migrate && python manage.py collectstatic --noinput && gunicorn cv_screening_project.wsgi:application
```

### Required environment variables

Set these in Railway:

```env
DEBUG=False
SECRET_KEY=your-production-secret
JWT_SECRET=your-jwt-secret
ALLOWED_HOSTS=your-backend-domain.up.railway.app
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.vercel.app
CSRF_TRUSTED_ORIGINS=https://your-backend-domain.up.railway.app,https://your-frontend-domain.vercel.app
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Notes

- Railway PostgreSQL exposes `DATABASE_URL`, which this project now reads automatically.
- DOCX-to-PDF preview generation is disabled on non-Windows hosts, so DOCX uploads still work but PDF preview conversion may be unavailable on Railway.
