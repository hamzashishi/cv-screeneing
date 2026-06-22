# ✅ Pre-Deployment Checklist for saidshishi

Use this checklist before and during deployment to PythonAnywhere.

---

## 📋 Before You Start

### Credentials Ready
- [ ] PythonAnywhere login ready
- [ ] PythonAnywhere username: **saidshishi**
- [ ] MySQL password from PythonAnywhere: **oky** ✅
- [ ] Gmail app password: **Saidshishi@03** ✅
- [ ] Frontend URL: **https://cv-screening-ten.vercel.app** ✅

### Files Ready
- [ ] `DEPLOYMENT_GUIDE_SAIDSHISHI.md` (read this first!)
- [ ] `cv-screening-backend/.env.production` ✅
- [ ] `cv-screening-backend/pythonanywhere_wsgi_saidshishi.py` ✅
- [ ] `cv-screening-frontend/.env.production` ✅

---

## 🚀 Step 1: Setup on PythonAnywhere

### Clone Repository
- [ ] PythonAnywhere Bash console open
- [ ] Repository cloned to home directory
- [ ] Changed to `cv-screening-backend` directory

```bash
git clone https://github.com/YOUR_GITHUB/cv-screening.git
cd cv-screening/cv-screening-backend
```

### Create Virtual Environment
- [ ] Virtual environment created with Python 3.10
- [ ] Virtual environment activated

```bash
mkvirtualenv --python=/usr/bin/python3.10 cv-screening
workon cv-screening
```

### Install Dependencies
- [ ] All packages installed from `requirements.txt`
- [ ] spaCy model downloaded
- [ ] No error messages during installation

```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

---

## ⚙️ Step 2: Configuration

### Environment File (.env)
- [ ] Created `.env` file in home directory
- [ ] Content copied from `.env.production`
- [ ] File saved (Ctrl+O, Enter, Ctrl+X)
- [ ] File readable (test: `cat ~/.env`)

```bash
nano ~/.env
# Paste content from .env.production
```

### Verify Configuration
- [ ] `DEBUG=False`
- [ ] `SECRET_KEY` set
- [ ] `ALLOWED_HOSTS` includes `saidshishi.pythonanywhere.com`
- [ ] `CORS_ALLOWED_ORIGINS` includes both backend and frontend URLs
- [ ] Database credentials correct
- [ ] Email credentials correct

---

## 🗄️ Step 3: Database Setup

### Run Migrations
- [ ] Migrations ran successfully
- [ ] No error messages
- [ ] Tables created in MySQL

```bash
python manage.py migrate
```

### Collect Static Files
- [ ] Static files collected
- [ ] No errors during collection
- [ ] `staticfiles/` directory created

```bash
python manage.py collectstatic --noinput
```

### Create Superuser
- [ ] Superuser created successfully
- [ ] Username saved
- [ ] Password saved securely

```bash
python manage.py createsuperuser
```

---

## 🌐 Step 4: WSGI Configuration

### Update WSGI File
- [ ] Opened WSGI file in PythonAnywhere
- [ ] Old content completely replaced
- [ ] New content from `pythonanywhere_wsgi_saidshishi.py` pasted
- [ ] File saved

Path: `/var/www/saidshishi_pythonanywhere_com_wsgi.py`

### Verify WSGI Content
- [ ] Project path correct: `/home/saidshishi/cv-screening/cv-screening-backend`
- [ ] .env file path correct: `/home/saidshishi/.env`
- [ ] Django settings module set
- [ ] WSGI application exported

---

## 🔄 Step 5: Reload & Test

### Reload Web App
- [ ] Clicked "Reload" button in Web tab
- [ ] Waited 30+ seconds
- [ ] Page refreshed

### Test Backend
- [ ] API accessible: `https://saidshishi.pythonanywhere.com/api/` ✅
- [ ] Shows API documentation (DRF browsable API)
- [ ] Admin panel accessible: `https://saidshishi.pythonanywhere.com/admin/` ✅
- [ ] Can login with superuser credentials

### Check Error Log
- [ ] Opened Error log in Web tab
- [ ] No error messages (warnings are OK)
- [ ] If errors present, troubleshoot before continuing

---

## 🎨 Step 6: Frontend Connection

### Frontend Configuration
- [ ] `.env.production` exists in frontend folder
- [ ] `VITE_API_URL=https://saidshishi.pythonanywhere.com/api`
- [ ] File committed to Git

### Deploy Frontend
- [ ] Built locally: `npm run build`
- [ ] Deployed to Vercel: `vercel --prod`
- [ ] Frontend accessible: `https://cv-screening-ten.vercel.app` ✅

### Test Connection
- [ ] Frontend loads without errors
- [ ] Console shows no CORS errors
- [ ] Can navigate to register page
- [ ] Network tab shows API calls to correct URL

---

## 🧪 Full Integration Test

### User Registration Flow
- [ ] Register page loads
- [ ] Can enter email and password
- [ ] Submitted registration
- [ ] Received verification email (check inbox/spam)
- [ ] Can verify email with OTP
- [ ] Can login with new account

### Job Posting Flow (Admin)
- [ ] Login to admin panel
- [ ] Can create job posting
- [ ] Can set screening criteria
- [ ] Job visible in frontend

### CV Upload Flow
- [ ] Login to frontend
- [ ] Can upload CV (PDF or DOCX)
- [ ] Upload successful
- [ ] CV appears in applicant profile

### Email Notifications
- [ ] Registration confirmation email received
- [ ] Password reset email works
- [ ] Application status emails sent

---

## 🔐 Security Verification

### Production Settings
- [ ] `DEBUG=False` ✅
- [ ] `SECRET_KEY` is not default ✅
- [ ] `JWT_SECRET` is not default ✅
- [ ] `.env` file NOT in Git ✅

### CORS & HTTPS
- [ ] HTTPS working (green lock in browser)
- [ ] `SECURE_SSL_REDIRECT=True` ✅
- [ ] `SESSION_COOKIE_SECURE=True` ✅
- [ ] `CSRF_COOKIE_SECURE=True` ✅

### Credentials Security
- [ ] Email app password used (not regular password) ✅
- [ ] Credentials only in `.env` (not in code) ✅
- [ ] `.env` is gitignored ✅

---

## 📊 Performance Check

### API Response Times
- [ ] `/api/` loads in < 2 seconds
- [ ] Admin login < 2 seconds
- [ ] List endpoints responsive
- [ ] No timeout errors

### Frontend Performance
- [ ] Pages load smoothly
- [ ] No 504 timeout errors
- [ ] Images load correctly
- [ ] Forms submit quickly

### Database Performance
- [ ] Queries execute quickly
- [ ] No "too many connections" errors
- [ ] Database responsive

---

## 🆘 Issues Found?

If any checkbox above is failed:

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| ModuleNotFoundError | `workon cv-screening` then `pip install -r requirements.txt` |
| Database connection error | Check DB credentials in `.env` match PythonAnywhere |
| Static files missing | Run `python manage.py collectstatic --noinput` again |
| 500 error | Check error log in PythonAnywhere Web tab |
| CORS error | Update `CORS_ALLOWED_ORIGINS` in `.env`, reload web app |
| Email not sending | Verify email credentials, check app password |
| API not loading | Check WSGI file syntax, reload web app |
| Admin can't login | Verify superuser created, clear cookies |

---

## ✅ Final Verification

### All Green?
- [ ] All steps completed
- [ ] All tests passed
- [ ] No error messages
- [ ] Ready for production

### Deployment Status
- **Backend:** ✅ **LIVE** at https://saidshishi.pythonanywhere.com/api
- **Admin Panel:** ✅ **LIVE** at https://saidshishi.pythonanywhere.com/admin
- **Frontend:** ✅ **LIVE** at https://cv-screening-ten.vercel.app
- **Integration:** ✅ **WORKING** - both connected

---

## 🎉 Congratulations!

You have successfully deployed:
- ✅ Django REST API backend
- ✅ React frontend
- ✅ MySQL database
- ✅ Email notifications
- ✅ User authentication
- ✅ File uploads

**Your CV Screening app is now live!** 🚀

---

## 📞 Keep Monitoring

### Daily
- Check error logs for issues
- Monitor email deliverability

### Weekly
- Verify app still responsive
- Check database size

### Monthly
- Review user registrations
- Check storage usage
- Update dependencies if needed

---

**Checklist Version:** 1.0
**Created:** 2026-06-22
**Status:** Ready to Use ✅

---

## Start Deployment

👉 **First:** Read [DEPLOYMENT_GUIDE_SAIDSHISHI.md](./DEPLOYMENT_GUIDE_SAIDSHISHI.md)

👉 **Then:** Follow the 7 steps

👉 **Finally:** Use this checklist to verify
