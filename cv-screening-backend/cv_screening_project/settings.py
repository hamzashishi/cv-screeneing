import os
from pathlib import Path
from decouple import config
try:
    import dj_database_url
except ImportError:
    dj_database_url = None

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('DJANGO_SECRET_KEY', default=config('SECRET_KEY', default='django-insecure-your-secret-key-here-change-in-production'))

DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = [host.strip() for host in config('ALLOWED_HOSTS', default='localhost,127.0.0.1,cv-screening-backend.onrender.com,cv-screeneing-7.onrender.com,.onrender.com').split(',') if host.strip()]
for required_host in ['cv-screeneing-7.onrender.com', '.onrender.com']:
    if required_host not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(required_host)

CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in config('CSRF_TRUSTED_ORIGINS', default='https://cv-screening-ten.vercel.app,https://cv-screening-backend.onrender.com,https://cv-screeneing-7.onrender.com').split(',') if origin.strip()]
for required_origin in ['https://cv-screeneing-7.onrender.com']:
    if required_origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(required_origin)

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'cv_screening_app',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cv_screening_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cv_screening_project.wsgi.application'

DATABASE_URL = config('DATABASE_URL', default='')

if DATABASE_URL:
    if dj_database_url is None:
        raise ImportError('dj-database-url must be installed to use DATABASE_URL')
    DATABASES = {
        'default': dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=False,
        )
    }
else:
    db_engine = config('DB_ENGINE', default='django.db.backends.sqlite3')
    DATABASES = {
        'default': {
            'ENGINE': db_engine,
            'NAME': BASE_DIR / 'db.sqlite3' if db_engine == 'django.db.backends.sqlite3' else config('DB_NAME'),
            'USER': config('DB_USER', default=''),
            'PASSWORD': config('DB_PASSWORD', default=''),
            'HOST': config('DB_HOST', default=''),
            'PORT': config('DB_PORT', default=''),
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'cv_screening_app.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
    'DEFAULT_FILTER_BACKENDS': [
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
}

CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000,http://localhost:3001,https://cv-screening-ten.vercel.app,https://cv-screening-backend.onrender.com,https://cv-screeneing-7.onrender.com').split(',')

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)

JWT_SECRET = config('JWT_SECRET_KEY', default=config('JWT_SECRET', default='your-jwt-secret-key'))
JWT_ALGORITHM = config('JWT_ALGORITHM', default='HS256')
JWT_EXPIRATION_HOURS = config('JWT_EXPIRATION_DELTA', default=config('JWT_EXPIRATION_HOURS', default=24, cast=int), cast=int)

# Celery Configuration
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'

# File upload settings
MAX_UPLOAD_SIZE = 5242880  # 5MB
ALLOWED_UPLOAD_EXTENSIONS = ['pdf', 'docx']

# NLP Settings
SPACY_MODEL = config('SPACY_MODEL', default='en_core_web_sm')

# Email/OTP Settings
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=False, cast=bool)
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='no-reply@your-domain.com')
