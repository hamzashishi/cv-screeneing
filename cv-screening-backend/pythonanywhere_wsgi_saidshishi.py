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
