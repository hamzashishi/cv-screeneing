# CV Screening and Ranking System

A comprehensive web-based recruitment application for automated CV screening and candidate ranking.

## Features

### For HR Personnel
- Create and manage job postings
- Automatic CV parsing and data extraction
- AI-powered candidate ranking
- View applicant details
- Make hiring decisions (hire/reject)
- Send notifications to candidates

### For Applicants
- View available job postings
- Upload CV in PDF or DOCX format
- Track application status
- Receive hiring decisions and notifications
- Manage profile and settings

## Tech Stack

### Backend
- **Framework**: Django with Django REST Framework
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **NLP**: spaCy for text processing
- **Document Processing**: pdfplumber, python-docx
- **ML**: scikit-learn for ranking algorithm

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **UI Icons**: Lucide React

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
│   │   ├── services/              # API services
│   │   ├── store/                 # State management
│   │   ├── hooks/                 # Custom hooks
│   │   ├── utils/                 # Utility functions
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
└── README.md
```

## Installation & Setup

### Backend Setup

1. **Create virtual environment**
   ```bash
   cd cv-screening-backend
   python -m venv venv
   # On Windows
   venv\Scripts\activate
   # On macOS/Linux
   source venv/bin/activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Setup database**
   ```bash
   # For development (SQLite)
   python manage.py migrate
   
   # Or for MySQL
   # Update DB settings in .env first
   python manage.py migrate
   ```

5. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

6. **Run development server**
   ```bash
   python manage.py runserver
   ```

   Server runs at `http://localhost:8000`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd cv-screening-frontend
   npm install
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env.local
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

   Application runs at `http://localhost:3000`

## API Documentation

### Authentication Endpoints
- `POST /api/users/create/` - Register new user
- `POST /api/users/login/` - User login

### HR Endpoints
- `GET/POST /api/jobs/` - List/Create job postings
- `GET /api/jobs/{id}/applicants/` - Get applicants for job
- `POST /api/jobs/{id}/rank_candidates/` - Rank candidates
- `POST /api/applications/{id}/make_decision/` - Make hiring decision

### Applicant Endpoints
- `GET /api/jobs/` - List available jobs
- `POST /api/cvs/` - Upload CV
- `POST /api/cvs/{id}/set_primary/` - Set primary CV
- `POST /api/applications/` - Apply for job
- `GET /api/applications/` - View applications

### Notification Endpoints
- `GET /api/notifications/` - Get notifications
- `GET /api/notifications/unread/` - Get unread notifications
- `POST /api/notifications/{id}/mark_as_read/` - Mark as read

## CV Parsing

The system automatically extracts:
- Personal details (name, email, phone, location)
- Skills (matched against common industry skills)
- Education (degree, institution)
- Work experience (job title, duration, years)
- Certifications
- Languages

## Ranking Algorithm

Candidates are scored based on:
- **Skills Match** (40% weight) - Using TF-IDF and cosine similarity
- **Experience** (30% weight) - Comparing years of experience
- **Education** (30% weight) - Matching education level

Scores are weighted and normalized to 0-100.

## Database Models

- **CustomUser** - Extended user model with role
- **HRPersonnel** - HR profile with company details
- **Applicant** - Applicant profile
- **JobPosting** - Job listings
- **CVUpload** - Uploaded CV files
- **ParsedCVData** - Extracted CV information
- **JobApplication** - Application records
- **Notification** - User notifications
- **ScreeningCriteria** - Job-specific scoring criteria
- **AuditLog** - System audit trail

## Configuration

### JWT Configuration
```env
JWT_SECRET=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

### File Upload
- Max file size: 5MB
- Allowed formats: PDF, DOCX

### Database
```env
DB_ENGINE=django.db.backends.mysql
DB_NAME=cv_screening_db
DB_USER=root
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=3306
```

## Error Handling

The system includes comprehensive error handling:
- Input validation
- File format validation
- Authentication errors
- Permission checks
- Database constraint checks

## Performance Optimization

- Database indexing on frequently queried fields
- JWT caching
- Pagination for list endpoints
- Lazy loading of related data
- Static file optimization with WhiteNoise

## Security Features

- JWT-based authentication
- CORS enabled for frontend
- Password hashing with Django's authentication
- File upload validation
- SQL injection prevention with ORM
- CSRF protection

## Future Enhancements

- Email notifications
- Advanced filtering and search
- Bulk CV upload
- Interview scheduling
- Video interview integration
- Analytics dashboard
- Mobile app
- Multi-language support

## Deployment

### Backend Deployment
```bash
# Collect static files
python manage.py collectstatic

# Run with gunicorn
gunicorn cv_screening_project.wsgi:application --bind 0.0.0.0:8000
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve with nginx or similar
```

### Recommended Hosting Split

- Frontend: Vercel
- Backend: Contabo VPS with Docker

This project is split into a Vite React frontend and a Django backend. The frontend fits Vercel well, while the backend is better deployed on a Contabo VPS using Docker because it uses Django, uploads, static/media handling, and a long-running Python app.

### Deploy Frontend to Vercel

In Vercel, create a project from this repository and use:

- Root directory: `cv-screening-frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: `Vite`

Set this environment variable in Vercel:

```env
VITE_API_URL=https://your-backend-domain/api
```

The frontend now includes a `vercel.json` rewrite so React Router routes like `/login` and `/hr-dashboard` work after refresh.

### Deploy Backend to Contabo with Docker

This repository now includes a Docker setup for the backend. On your Contabo VPS, copy the example environment file and start the stack:

```bash
cp cv-screening-backend/.env.example cv-screening-backend/.env
docker compose up -d --build
```

Set your production values in the copied environment file, especially:

```env
DEBUG=False
DJANGO_SECRET_KEY=your-production-secret
ALLOWED_HOSTS=your-domain.com,api.your-domain.com,backend
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com,https://api.your-domain.com
DATABASE_URL=postgresql://postgres:postgres@db:5432/cv_screening
```

If you keep using SQLite locally, do not use it for production deployment.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the repository.

---

**Created**: February 2026
**Version**: 1.0.0
