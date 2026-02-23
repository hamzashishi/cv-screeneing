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
