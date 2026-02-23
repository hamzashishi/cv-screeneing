HR Flow Quick Guide

1. Start backend and frontend:
   - Backend: `C:/Users/hp/Desktop/data/.venv/Scripts/python.exe manage.py runserver 0.0.0.0:8000`
   - Frontend: `npm run dev` (from `cv-screening-frontend`)

2. Create or register an HR user (example via API):
   POST http://localhost:8000/api/users/register/ with JSON body:
   {
     "email": "hr@example.com",
     "username": "hruser",
     "password": "Password123!",
     "password_confirm": "Password123!",
     "role": "hr",
     "company_name": "ACME Corp",
     "company_description": "...",
     "company_location": "City"
   }

3. Login via frontend: http://localhost:3001/login or use the auto-login page at `/auto-login-hr.html` (dev only).

4. HR Dashboard:
   - Open: http://localhost:3001/hr-dashboard
   - Manage Jobs: /hr/jobs
   - Create Job: /hr/jobs/create
   - Job Detail: /hr/jobs/:id (from list)
   - Screening Criteria: /hr/jobs/:id/screening

5. Create Job (fields): job_title, job_description, required_skills (comma-separated), required_education (bachelor/master/...), required_experience (entry/mid/senior), years_of_experience_min, years_of_experience_max, location, job_type.

6. Ranking:
   - From Job Detail click "Rank Candidates" to run the ranking engine (updates application scores).

Notes:
- This is a development scaffold: secure secrets, add validations, and production hardening before deploying.
