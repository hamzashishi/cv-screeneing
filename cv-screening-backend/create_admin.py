import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cv_screening_project.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@example.com',
        password='admin123'
    )
    print("✓ Superuser 'admin' created successfully!")
    print("  Username: admin")
    print("  Password: admin123")
else:
    print("✓ Admin user already exists")
