# Django Settings Optimization for PythonAnywhere

This document provides recommended optimizations to `settings.py` for PythonAnywhere deployment.

## Current Status

Your `settings.py` is already well-configured for production! Key highlights:
- ✅ Environment-based configuration using `python-decouple`
- ✅ CORS headers configured
- ✅ WhiteNoise middleware for static files
- ✅ JWT authentication custom implementation
- ✅ SSL/HTTPS headers support
- ✅ Database URL support

## Recommended Updates

### 1. Database Configuration

**Current:** Supports both SQLite and MySQL via environment variables

**For PythonAnywhere:** Already optimal! Just ensure in `.env`:
```env
DB_ENGINE=django.db.backends.mysql
DB_NAME=yourusername$default
DB_USER=yourusername
DB_PASSWORD=your_password
DB_HOST=yourusername.mysql.pythonanywhere-services.com
DB_PORT=3306
```

### 2. Allowed Hosts Configuration

**Current:**
```python
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')
```

**Add to `.env`:**
```env
ALLOWED_HOSTS=yourusername.pythonanywhere.com,yourdomain.com
```

### 3. CSRF Trusted Origins

**Add to `.env`:**
```env
CSRF_TRUSTED_ORIGINS=https://yourusername.pythonanywhere.com,https://yourdomain.com,https://your-frontend-vercel-url.vercel.app
```

### 4. Production Settings (Non-DEBUG Mode)

**Already present:** Good SSL redirect and cookie security settings

**Add this to settings.py for additional hardening:**
```python
# Additional security for production (non-DEBUG)
if not DEBUG:
    # Security headers
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # Prevent clickjacking
    X_FRAME_OPTIONS = 'DENY'
    
    # Content Security Policy (optional, may break things)
    # SECURE_CONTENT_SECURITY_POLICY = {
    #     'default-src': ("'self'",),
    # }
```

### 5. Static and Media Files

**Current:** Already configured with WhiteNoise

**Ensure in `.env`:**
```env
STATIC_URL=/static/
MEDIA_URL=/media/
```

**Add to settings.py for better performance:**
```python
# Cache static files for 1 year (safe since files have hash names)
if not DEBUG:
    STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### 6. Logging Configuration

**Add to settings.py for better debugging on PythonAnywhere:**
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'WARNING',
            'class': 'logging.FileHandler',
            'filename': '/home/yourusername/logs/django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': os.getenv('DJANGO_LOG_LEVEL', 'INFO'),
            'propagate': False,
        },
    },
}
```

### 7. Database Connection Pooling

**Add to settings.py for better performance:**
```python
# Connection pooling for better performance
DATABASES['default']['CONN_MAX_AGE'] = 600  # 10 minutes
DATABASES['default']['ATOMIC_REQUESTS'] = False  # Set to True only if needed
```

### 8. Session and Cache Configuration

**Add to settings.py:**
```python
# Use database for sessions (simple, works well)
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_COOKIE_HTTPONLY = True

# Cache configuration (optional, uses database by default)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'cache_table',
    }
}
```

### 9. File Upload Limits

**Add to settings.py:**
```python
# File upload settings
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
```

### 10. Email Configuration

**Current:** Already uses environment variables ✅

**For Gmail, ensure in `.env`:**
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-specific-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=your-email@gmail.com
```

---

## Complete Production-Ready settings.py Section

Here's a complete snippet of recommended additions:

```python
# ==============================================
# PRODUCTION SETTINGS FOR PYTHONANYWHERE
# ==============================================

# Security settings for HTTPS
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # HSTS settings (uncomment after verifying HTTPS works)
    # SECURE_HSTS_SECONDS = 31536000
    # SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    # SECURE_HSTS_PRELOAD = True
    
    X_FRAME_OPTIONS = 'DENY'

# Database connection pooling
DATABASES['default']['CONN_MAX_AGE'] = 600

# Static files with WhiteNoise
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Session configuration
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 1209600  # 2 weeks
SESSION_COOKIE_HTTPONLY = True

# File upload limits
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {module}: {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}
```

---

## Environment Variables Checklist

Ensure all these are in your `.env` file:

```env
# Django
DEBUG=False
SECRET_KEY=your-long-secret-key
ALLOWED_HOSTS=yourusername.pythonanywhere.com,yourdomain.com
CSRF_TRUSTED_ORIGINS=https://yourusername.pythonanywhere.com,https://yourdomain.com

# Database
DB_ENGINE=django.db.backends.mysql
DB_NAME=yourusername$default
DB_USER=yourusername
DB_PASSWORD=your_password
DB_HOST=yourusername.mysql.pythonanywhere-services.com
DB_PORT=3306

# JWT
JWT_SECRET=your-long-jwt-secret
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS
CORS_ALLOWED_ORIGINS=https://yourusername.pythonanywhere.com,https://your-frontend-domain.com

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Files
MAX_UPLOAD_SIZE=5242880
ALLOWED_UPLOAD_EXTENSIONS=pdf,docx

# NLP
SPACY_MODEL=en_core_web_sm
```

---

## Performance Tips

### 1. Database Query Optimization
```python
# Use select_related for foreign keys
queryset = JobApplication.objects.select_related('job_posting', 'applicant')

# Use prefetch_related for reverse foreign keys
queryset = JobPosting.objects.prefetch_related('applications')

# Use only() and defer() to limit fields fetched
queryset = Applicant.objects.only('id', 'name', 'email')
```

### 2. Caching
```python
from django.views.decorators.cache import cache_page
from django.core.cache import cache

# Cache view for 5 minutes
@cache_page(60 * 5)
def my_view(request):
    return render(request, 'template.html')

# Or use cache in logic
def get_data():
    cache_key = 'my_data'
    data = cache.get(cache_key)
    if data is None:
        data = expensive_operation()
        cache.set(cache_key, data, 60 * 5)  # Cache for 5 minutes
    return data
```

### 3. Pagination
Already configured in settings:
```python
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}
```

---

## Testing on PythonAnywhere

After updating settings, test with:

```bash
workon cv-screening
cd /home/yourusername/cv-screening/cv-screening-backend

# Check for errors
python manage.py check

# Test database connection
python manage.py dbshell

# Test static files
python manage.py collectstatic --noinput --dry-run

# Run shell to test imports
python manage.py shell
```

---

## Important Notes

1. **Never commit `.env` file** - it contains secrets
2. **Use `.env.example`** - for documentation of required variables
3. **Test locally first** - before deploying to PythonAnywhere
4. **Monitor logs** - check error logs regularly on PythonAnywhere
5. **Keep backups** - of database and uploaded files

---

## Rollback Plan

If something breaks after changes:

1. SSH into PythonAnywhere bash
2. Revert settings.py: `git checkout cv_screening_project/settings.py`
3. Reload web app in PythonAnywhere dashboard
4. Check error logs for issues
5. Make smaller, incremental changes

---

## Support

For issues with specific settings, refer to:
- [Django Settings Reference](https://docs.djangoproject.com/en/4.2/ref/settings/)
- [PythonAnywhere Docs](https://help.pythonanywhere.com)
- Main [PYTHONANYWHERE_DEPLOYMENT_GUIDE.md](./PYTHONANYWHERE_DEPLOYMENT_GUIDE.md)
