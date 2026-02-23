# Run System From Terminal (No AI Needed)

Use this guide to run the project manually using PowerShell.

## 1. Open Terminal 1: Backend

```powershell
cd C:\Users\hp\Desktop\data\cv-screening-backend
```

### First-time setup
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Environment file
Make sure `cv-screening-backend\.env` exists.

Minimum example:
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

### DB and server
```powershell
.\venv\Scripts\Activate.ps1
python manage.py migrate
python manage.py runserver 0.0.0.0:8000 --noreload
```

Backend URL: `http://localhost:8000`  
API base: `http://localhost:8000/api`

## 2. Open Terminal 2: Frontend

```powershell
cd C:\Users\hp\Desktop\data\cv-screening-frontend
npm install
npm run dev -- --host 0.0.0.0 --port 3000
```

Frontend URL: `http://localhost:3000`

## 3. Login/Register Flow

- Open `http://localhost:3000`
- Register a user
- You should be logged in immediately (OTP removed)

## 4. Optional Admin Portal

In backend terminal:
```powershell
python manage.py createsuperuser
```

Open: `http://localhost:8000/admin`

## 5. Quick Troubleshooting

### Port already in use
```powershell
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Login fails from browser
- Ensure frontend is running on `3000`.
- Ensure backend `.env` has `CORS_ALLOWED_ORIGINS` including `http://localhost:3000`.
- Restart backend after editing `.env`.

### OTP/email not arriving
- OTP is disabled in current app flow.
- If you re-enable OTP later, set real SMTP credentials in backend `.env`.
