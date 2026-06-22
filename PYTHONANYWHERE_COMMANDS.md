# PythonAnywhere Deployment Commands

Use these exact commands in the PythonAnywhere Bash console to deploy your backend.

## 1. Clone the repository

```bash
cd ~
rm -rf cv-screeneing
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
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

## 4. Copy your environment file

If you already have the file in the repo:

```bash
cp cv-screening-backend/.env.production ~/.env
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
