# 🚀 Deployment Guide for saidshishi - CV Screening App

Your backend and frontend are ready to deploy! Follow these steps to get everything live.

## ✅ Your Configuration
- **PythonAnywhere Username:** saidshishi
- **Backend URL:** https://saidshishi.pythonanywhere.com/api
- **Admin URL:** https://saidshishi.pythonanywhere.com/admin
- **Frontend:** https://cv-screening-ten.vercel.app
- **Database:** MySQL (saidshishi$default)
- **Email:** saidshishi919@gmail.com

---

## � Deployment Script

If you want to automate the setup, copy `cv-screening-backend/deploy_to_pythonanywhere_saidshishi.sh` to PythonAnywhere and run it from the backend directory after cloning the repo.

## �📋 Step-by-Step Deployment

### Step 1: Clone Repository on PythonAnywhere (5 mins)

1. Go to **PythonAnywhere** → **Consoles** → **Bash**
2. Run these commands:

```bash
# Clone the repository
git clone https://github.com/YOUR_GITHUB_USERNAME/cv-screening.git
cd cv-screening/cv-screening-backend

# Verify you're in the right directory
pwd
```

### Step 2: Create Virtual Environment (2 mins)

```bash
# Create virtual environment
mkvirtualenv --python=/usr/bin/python3.10 cv-screening
workon cv-screening

# Verify activation (should show cv-screening in prompt)
which python
```

### Step 3: Install Dependencies (5 mins)

```bash
workon cv-screening
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

If you get errors, try:
```bash
pip install --upgrade pip setuptools wheel
pip install --no-cache-dir scikit-learn
pip install -r requirements.txt
```

### Step 4: Create .env File (3 mins)

```bash
# Create .env in your home directory
nano ~/.env
```

Paste this content (it's ready for you):

```env
# ============= Django Settings =============
DEBUG=False
SECRET_KEY=9iWv0xJV7GDOOA05iUrTVhQmpZdZGK7Wx3kdaEQtfKGnGNYvT6wcHfENDSWRMXLI3SQ
ALLOWED_HOSTS=saidshishi.pythonanywhere.com,saidshishi
CSRF_TRUSTED_ORIGINS=https://saidshishi.pythonanywhere.com,https://cv-screening-ten.vercel.app

# ============= Database Settings (PythonAnywhere MySQL) =============
DB_ENGINE=django.db.backends.mysql
DB_NAME=saidshishi$default
DB_USER=saidshishi
DB_PASSWORD=oky
DB_HOST=saidshishi.mysql.pythonanywhere-services.com
DB_PORT=3306
DATABASE_URL=

# ============= JWT Settings =============
JWT_SECRET=tyND_V6m2e-q8h1xzil-DZG3A5s4ucFAqlwjVhcN2OSSWWwgLDXkLvZqB3q8CFRP7OA
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# ============= CORS Settings =============
CORS_ALLOWED_ORIGINS=https://saidshishi.pythonanywhere.com,https://cv-screening-ten.vercel.app

# ============= Email Configuration (Gmail) =============
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=saidshishi919@gmail.com
EMAIL_HOST_PASSWORD=Saidshishi@03
EMAIL_USE_TLS=True
EMAIL_USE_SSL=False
DEFAULT_FROM_EMAIL=saidshishi919@gmail.com

# ============= SSL/Security Settings =============
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# ============= File Upload Settings =============
MAX_UPLOAD_SIZE=5242880
ALLOWED_UPLOAD_EXTENSIONS=pdf,docx

# ============= NLP Settings =============
SPACY_MODEL=en_core_web_sm

# ============= Redis/Celery (Optional) =============
REDIS_URL=redis://localhost:6379/0
```

To save: Press **Ctrl+O** → **Enter** → **Ctrl+X**

### Step 5: Setup Database (5 mins)

```bash
cd /home/saidshishi/cv-screening/cv-screening-backend
workon cv-screening

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Create superuser (follow prompts - remember the password!)
python manage.py createsuperuser
```

### Step 6: Configure WSGI File (3 mins)

1. Go to **PythonAnywhere** → **Web** tab
2. Click your domain (or create new one)
3. Scroll down to **Code** section → Click on WSGI file
4. Replace ALL content with:

```python
"""
PythonAnywhere WSGI Configuration for saidshishi
"""

import os
import sys
from pathlib import Path

# Add your project directory to the Python path
project_home = '/home/saidshishi/cv-screening/cv-screening-backend'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Load environment variables from .env file
env_file = Path('/home/saidshishi/.env')
if env_file.exists():
    from dotenv import load_dotenv
    load_dotenv(str(env_file))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cv_screening_project.settings')

# Setup Django
import django
django.setup()

# Get WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

5. Click **Save**

### Step 7: Reload Web App (2 mins)

1. In **Web** tab, click **Reload** button
2. Wait 30 seconds

---

## 🧪 Test Backend

Visit these URLs (replace with your domain):

1. **API Root:** https://saidshishi.pythonanywhere.com/api/
   - Should see API documentation

2. **Admin Panel:** https://saidshishi.pythonanywhere.com/admin/
   - Login with your superuser credentials

3. **Check error log** if anything fails:
   - **Web** tab → **Error log**

---

## 🎨 Frontend Connection

Your frontend is already configured! The `.env.production` file has:
```
VITE_API_URL=https://saidshishi.pythonanywhere.com/api
```

When you push to Vercel:
```bash
cd cv-screening-frontend
git add .
git commit -m "Update API URL for production"
git push
```

Or redeploy on Vercel:
```bash
npm run build
vercel --prod
```

---

## ✅ Verification Checklist

- [ ] Backend running at https://saidshishi.pythonanywhere.com/api/
- [ ] Admin accessible at https://saidshishi.pythonanywhere.com/admin/
- [ ] Frontend loads at https://cv-screening-ten.vercel.app
- [ ] Frontend connects to backend (no CORS errors in console)
- [ ] Can register on frontend
- [ ] Email verification sent
- [ ] Can login
- [ ] Can create job posting
- [ ] Can upload CV

---

## 🆘 Troubleshooting

### Issue: "ModuleNotFoundError"
```bash
workon cv-screening
pip install -r requirements.txt
```

### Issue: Database connection error
- Check `.env` file has correct DB credentials
- Verify MySQL database exists in PythonAnywhere Databases tab

### Issue: Static files not loading
```bash
python manage.py collectstatic --noinput
# Then reload web app
```

### Issue: CORS error in browser
- Check that `CORS_ALLOWED_ORIGINS` includes frontend URL
- Check error log in PythonAnywhere Web tab
- Click Reload

### Issue: Email not sending
- Verify `EMAIL_HOST_PASSWORD` is the **app password** (not regular Gmail password)
- Check console for errors

### Issue: 500 error
- Check **Web** tab → **Error log** for details
- Most common: Missing module (install with pip)

---

## 📊 File Locations

### On Your Local Machine
- Config: `cv-screening-backend/.env.production`
- Frontend: `cv-screening-frontend/.env.production`
- WSGI: `cv-screening-backend/pythonanywhere_wsgi_saidshishi.py`

### On PythonAnywhere
- `.env` in home directory: `/home/saidshishi/.env`
- Backend code: `/home/saidshishi/cv-screening/cv-screening-backend/`
- WSGI file: `/var/www/saidshishi_pythonanywhere_com_wsgi.py`

---

## 🎉 You're Done!

Once verified, your CV Screening app is:
- ✅ Live on PythonAnywhere
- ✅ Connected to Vercel frontend
- ✅ Using MySQL database
- ✅ Sending emails
- ✅ Ready for users!

---

## 📞 Quick Reference Commands

```bash
# Activate virtual environment
workon cv-screening

# Check database
python manage.py dbshell

# Check Django setup
python manage.py check

# Create another admin user
python manage.py createsuperuser

# Clear cache
python manage.py clear_cache

# View error logs
tail -f /var/log/saidshishi.pythonanywhere.com.error.log
```

---

**Deployment Guide Created:** 2026-06-22
**Status:** Ready to Deploy ✅
