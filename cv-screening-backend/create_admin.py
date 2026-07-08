import os

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cv_screening_project.settings')
django.setup()

from django.contrib.auth.models import User

from cv_screening_app.models import CustomUser

ADMIN_USERNAME = 'admin'
ADMIN_EMAIL = 'admin@example.com'
ADMIN_PASSWORD = 'admin123'


def ensure_custom_admin():
    user = CustomUser.objects.filter(username=ADMIN_USERNAME).first()
    created = False

    if not user:
        user = CustomUser(username=ADMIN_USERNAME)
        created = True

    user.email = ADMIN_EMAIL
    user.first_name = 'System'
    user.last_name = 'Administrator'
    user.phone_number = user.phone_number or 'admin-000'
    user.role = 'hr'
    user.is_staff = True
    user.is_superuser = True
    user.is_active = True
    user.is_active_user = True
    user.set_password(ADMIN_PASSWORD)
    user.save()

    return created


def ensure_django_admin():
    user = User.objects.filter(username=ADMIN_USERNAME).first()
    created = False

    if not user:
        user = User(username=ADMIN_USERNAME)
        created = True

    user.email = ADMIN_EMAIL
    user.first_name = 'System'
    user.last_name = 'Administrator'
    user.is_staff = True
    user.is_superuser = True
    user.is_active = True
    user.set_password(ADMIN_PASSWORD)
    user.save()

    return created


custom_created = ensure_custom_admin()
django_created = ensure_django_admin()

print(
    "Custom app admin "
    + ("created" if custom_created else "updated")
    + " successfully."
)
print(
    "Django admin user "
    + ("created" if django_created else "updated")
    + " successfully."
)
print(f"Username: {ADMIN_USERNAME}")
print(f"Email: {ADMIN_EMAIL}")
print(f"Password: {ADMIN_PASSWORD}")
