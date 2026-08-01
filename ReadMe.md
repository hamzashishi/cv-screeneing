# CV Screening and Ranking System

A comprehensive web-based recruitment application that automates CV screening and candidate ranking — helping HR teams evaluate applicants faster and more objectively.

---

## Overview

This platform streamlines the hiring process by automatically parsing uploaded CVs, extracting key candidate information, and ranking applicants against job-specific criteria using a weighted scoring algorithm. It serves two user types: **HR Personnel** (who manage job postings and hiring decisions) and **Applicants** (who apply and track their status).

---

## Key Features

### For HR Personnel
- Create and manage job postings
- Automatic CV parsing and data extraction
- AI-powered candidate ranking
- View detailed applicant profiles
- Make hiring decisions (hire/reject)
- Send notifications to candidates

### For Applicants
- Browse available job postings
- Upload CVs in PDF or DOCX format
- Track application status in real time
- Receive hiring decisions and notifications
- Manage profile and account settings

---

## How Candidates Are Ranked

Each applicant is scored automatically based on:

| Criteria | Weight |
|---|---|
| Skills Match (via TF-IDF & cosine similarity) | 40% |
| Experience | 30% |
| Education | 30% |

Scores are normalized to a 0–100 scale, giving HR teams a consistent, data-driven way to compare candidates.

The system automatically extracts the following from each CV:
- Personal details (name, email, phone, location)
- Skills (matched against common industry skill sets)
- Education (degree, institution)
- Work experience (job title, duration, years)
- Certifications
- Languages

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Django + Django REST Framework |
| **Database** | MySQL (SQLite supported for local dev) |
| **Authentication** | JWT (JSON Web Tokens) |
| **NLP** | spaCy |
| **Document Processing** | pdfplumber, python-docx |
| **Ranking Engine** | scikit-learn |
| **Frontend** | React 18 + Vite |
| **Styling** | Tailwind CSS |
| **State Management** | Zustand |
| **HTTP Client** | Axios |

---

## Security & Reliability

- JWT-based authentication with configurable expiration
- Password hashing via Django's built-in authentication system
- CSRF protection and SQL injection prevention (via Django ORM)
- File upload validation (format and size restrictions)
- CORS configuration for secure frontend-backend communication
- Comprehensive input validation and permission checks across all endpoints

---

## Roadmap

Planned enhancements include:
- Email notifications
- Advanced filtering and search
- Bulk CV upload
- Interview scheduling
- Video interview integration
- Analytics dashboard
- Mobile app
- Multi-language support

---

## Deployment

The application is designed to run as two independently deployed services:

- **Frontend** → Vercel (Vite build)
- **Backend** → Contabo VPS via Docker

### Frontend (Vercel)
- Root directory: `cv-screening-frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: `Vite`
- Required environment variable: `VITE_API_URL=https://your-backend-domain/api`

### Backend (Docker on Contabo)
```bash
cp cv-screening-backend/.env.example cv-screening-backend/.env
docker compose up -d --build
```
Key production environment variables:
```env
DEBUG=False
DJANGO_SECRET_KEY=your-production-secret
ALLOWED_HOSTS=your-domain.com,api.your-domain.com,backend
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com,https://api.your-domain.com
DATABASE_URL=postgresql://postgres:postgres@db:5432/cv_screening
```
> Note: SQLite is intended for local development only — not recommended for production.

---

## Project Structure

```
cv-screening-system/
├── cv-screening-backend/          # Django backend
│   ├── cv_screening_project/      # Project settings
│   ├── cv_screening_app/          # Main application
│   │   ├── models.py              # Database models
│   │   ├── views.py               # API views
│   │   ├── serializers.py         # DRF serializers
│   │   ├── cv_parser.py           # CV parsing utility
│   │   ├── ranking_engine.py      # Ranking algorithm
│   │   ├── authentication.py      # JWT authentication
│   │   └── urls.py                # API routes
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
├── cv-screening-frontend/         # React frontend
│   ├── src/
│   │   ├── components/            # Reusable components
│   │   ├── pages/                 # Page components
│   │   ├── services/               # API services
│   │   ├── store/                  # State management
│   │   ├── hooks/                  # Custom hooks
│   │   ├── utils/                  # Utility functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
└── README.md
```

---

## Database Models

- **CustomUser** — extended user model with role
- **HRPersonnel** — HR profile with company details
- **Applicant** — applicant profile
- **JobPosting** — job listings
- **CVUpload** — uploaded CV files
- **ParsedCVData** — extracted CV information
- **JobApplication** — application records
- **Notification** — user notifications
- **ScreeningCriteria** — job-specific scoring criteria
- **AuditLog** — system audit trail

---

## Local Development Setup

### Backend

```bash
cd cv-screening-backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python -m spacy download en_core_web_sm

cp .env.example .env
# Edit .env with your local settings

python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
Runs at `http://localhost:8000`

### Frontend

```bash
cd cv-screening-frontend
npm install
cp .env.example .env.local
npm run dev
```
Runs at `http://localhost:3000`

---

## API Reference

### Authentication
- `POST /api/users/create/` — Register new user
- `POST /api/users/login/` — User login

### HR
- `GET/POST /api/jobs/` — List/create job postings
- `GET /api/jobs/{id}/applicants/` — Get applicants for a job
- `POST /api/jobs/{id}/rank_candidates/` — Rank candidates
- `POST /api/applications/{id}/make_decision/` — Make hiring decision

### Applicant
- `GET /api/jobs/` — List available jobs
- `POST /api/cvs/` — Upload CV
- `POST /api/cvs/{id}/set_primary/` — Set primary CV
- `POST /api/applications/` — Apply for a job
- `GET /api/applications/` — View applications

### Notifications
- `GET /api/notifications/` — Get notifications
- `GET /api/notifications/unread/` — Get unread notifications
- `POST /api/notifications/{id}/mark_as_read/` — Mark notification as read

---

## Configuration Reference

```env
# JWT
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# Database
DB_ENGINE=django.db.backends.mysql
DB_NAME=cv_screening_db
DB_USER=root
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=3306
```

File upload limits: max 5MB, formats accepted: PDF, DOCX.

---

## License

MIT License — see LICENSE file for details.

## Support

For issues and questions, please open an issue in the repository.

---

**Created**: February 2026
**Version**: 1.0.0
