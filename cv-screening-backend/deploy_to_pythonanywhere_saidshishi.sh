#!/bin/bash
set -e

USERNAME=saidshishi
PROJECT_HOME="/home/$USERNAME/cv-screening"
BACKEND_HOME="$PROJECT_HOME/cv-screening-backend"
FRONTEND_HOME="$PROJECT_HOME/cv-screening-frontend"
VENV_NAME=cv-screening
ENV_SOURCE="$BACKEND_HOME/.env.production"
ENV_TARGET="/home/$USERNAME/.env"

printf "\n=== PythonAnywhere Deployment Script ===\n"

if [ ! -d "$BACKEND_HOME" ]; then
  echo "ERROR: Backend directory not found: $BACKEND_HOME"
  echo "Clone your repository first and rerun this script."
  exit 1
fi

cd "$BACKEND_HOME"

if [ ! -f "$ENV_SOURCE" ]; then
  echo "ERROR: Backend environment file missing: $ENV_SOURCE"
  exit 1
fi

# Create or activate virtual environment
if [ -d "/home/$USERNAME/.virtualenvs/$VENV_NAME" ]; then
  echo "Activating virtualenv $VENV_NAME..."
  source "/home/$USERNAME/.virtualenvs/$VENV_NAME/bin/activate"
else
  echo "Creating virtualenv $VENV_NAME..."
  if command -v mkvirtualenv >/dev/null 2>&1; then
    mkvirtualenv --python=/usr/bin/python3.10 "$VENV_NAME"
    source "/home/$USERNAME/.virtualenvs/$VENV_NAME/bin/activate"
  else
    python3.10 -m venv "/home/$USERNAME/.virtualenvs/$VENV_NAME"
    source "/home/$USERNAME/.virtualenvs/$VENV_NAME/bin/activate"
  fi
fi

echo "Installing Python dependencies..."
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

echo "Downloading spaCy model..."
python -m spacy download en_core_web_sm

echo "Copying environment file to home directory..."
cp "$ENV_SOURCE" "$ENV_TARGET"
chmod 600 "$ENV_TARGET"

echo "Running Django migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Checking Django configuration..."
python manage.py check

printf "\n=== Deployment script finished ===\n"
printf "If you have not yet edited the WSGI file, open the PythonAnywhere Web tab and paste the content from pythonanywhere_wsgi_saidshishi.py.\n"
printf "Then Reload your web app and verify: https://saidshishi.pythonanywhere.com/api/\n\n"
