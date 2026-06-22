# PythonAnywhere Deployment Commands

Use these exact commands in the PythonAnywhere Bash console to deploy your backend.

> Note: PythonAnywhere free accounts often have very low disk quota. If `pip install -r requirements.txt` fails, use the core requirements fallback below or upgrade your PythonAnywhere plan.

## 1. Clone the repository

```bash
cd ~
rm -rf cv-screeneing
rm -rf ~/.cache/pip
git clone https://github.com/hamzashishi/cv-screeneing.git
cd cv-screeneing/cv-screening-backend
```

## 2. Create and activate the virtual environment

```bash
mkvirtualenv --python=/usr/bin/python3.10 cv-screening
workon cv-screening
```

If `mkvirtualenv` is not available, use:

```bash
python3.10 -m venv ~/.virtualenvs/cv-screening
source ~/.virtualenvs/cv-screening/bin/activate
```

## 3. Install dependencies

```bash
rm -rf ~/.cache/pip /tmp/pip-* ~/.cache/pipenv
python -m pip install --upgrade pip setuptools wheel --no-cache-dir
python -m pip install -r requirements.txt --no-cache-dir
python -m spacy download en_core_web_sm
```

If this still fails because of disk quota, install the core PythonAnywhere package set first:

```bash
python -m pip install -r requirements-pythonanywhere-core.txt --no-cache-dir
```

This will install the Django backend without the heaviest NLP/document packages. Core app startup and admin/API routes will work, but advanced CV parsing features will require the full dependencies and more disk space.

Confirm Django is installed before running migrations:

```bash
python -m pip show Django
python -c "import django; print(django.get_version())"
```

If you still hit a quota issue, free space and try again:

```bash
df -h
du -sh ~/* | sort -h | tail -20
rm -rf ~/.cache/pip /tmp/pip-* ~/.cache/pipenv
rm -rf ~/.virtualenvs/cv-screening
``` 

## 4. Copy your environment file

If you already have the file in the repo and are in `cv-screeneing/cv-screening-backend`:

```bash
cp .env.example ~/.env
chmod 600 ~/.env
```

If you want to edit the file manually:

```bash
nano ~/.env
```

## 5. Run migrations and collect static files

```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

## 6. Check Django

```bash
python manage.py check
```

## 7. Configure the WSGI file

Open the PythonAnywhere Web tab, then paste the contents of:

- `cv-screening-backend/pythonanywhere_wsgi_saidshishi.py`

into the WSGI configuration file.

## 8. Reload the web app

Use the PythonAnywhere Web tab and click **Reload**.

## 9. Verify

Open these URLs in your browser:

- Backend API: `https://saidshishi.pythonanywhere.com/api/`
- Admin: `https://saidshishi.pythonanywhere.com/admin/`
- Frontend: `https://cv-screening-ten.vercel.app`

## 10. Troubleshooting

If deployment fails, run:

```bash
cat /var/log/saidshishi.pythonanywhere.com.error.log
```

and share the first error lines.
