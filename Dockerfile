FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NLTK_DATA=/usr/share/nltk_data \
    PORT=8000

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3-dev \
    libjpeg-dev \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    libtiff-dev \
    libfreetype6-dev \
    liblcms2-dev \
    libwebp-dev \
    libopenjp2-7-dev \
    libharfbuzz-dev \
    libfribidi-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY cv-screening-backend/requirements.txt ./requirements.txt
RUN python -m pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

COPY cv-screening-backend/ /app/

RUN python -m spacy download en_core_web_sm && \
    python -m nltk.downloader -d /usr/share/nltk_data punkt

EXPOSE 8000

CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && gunicorn --workers 1 --timeout 120 --bind 0.0.0.0:${PORT} cv_screening_project.wsgi:application"]