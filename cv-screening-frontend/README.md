# CV Screening Frontend

React-based frontend for the CV Screening and Ranking System.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env.local
# Edit with your API URL
```

### 3. Start Development Server
```bash
npm run dev
```

Application runs at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/     # Reusable React components
├── pages/         # Page components
├── services/      # API calls
├── store/         # State management (Zustand)
├── hooks/         # Custom React hooks
├── utils/         # Utility functions
├── App.jsx        # Main component
└── main.jsx       # Entry point
```

## Key Features

- User authentication (Register/Login)
- HR dashboard (create jobs, view applicants, rank candidates)
- Applicant dashboard (browse jobs, upload CV, apply)
- Real-time notifications
- CV upload and parsing
- Responsive design

## Authentication

Uses JWT tokens stored in localStorage. Automatically includes token in API requests.

## Styling

Tailwind CSS for styling with custom utility classes.

## State Management

Zustand for simple, efficient state management (authentication state).

## Build for Production

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to your hosting service.

## Deploy to Vercel

This frontend is ready for Vercel. The included `vercel.json` makes React Router work on refresh and direct links.

### Vercel settings

- Framework preset: `Vite`
- Root directory: `cv-screening-frontend`
- Build command: `npm run build`
- Output directory: `dist`

### Required environment variable

Set this in Vercel before deploying:

```env
VITE_API_URL=https://your-backend-domain/api
```

Example:

```env
VITE_API_URL=https://api.your-domain.com/api
```

## Backend hosting

The Django backend should be deployed separately on a Contabo VPS using Docker. The repository root now includes a Docker Compose setup for that backend.
