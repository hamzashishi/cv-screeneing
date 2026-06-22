# Render Deployment Guide (Free tier)

Use Render to deploy your Django backend free and keep your React frontend on Vercel.

## Why Render?
- Free web service tier available
- Free PostgreSQL database available
- Supports GitHub auto-deploy
- Your repo already contains `render.yaml`

## 1. Prepare your repo

Your repo includes `render.yaml` at the root, which points Render at `cv-screening-backend`.
The web service is configured to:
- install dependencies
- collect static files
- run Gunicorn

## 2. Create the Render web service

1. Go to https://dashboard.render.com
2. Click **New** → **Web Service**
3. Connect your GitHub account
4. Select the `hamzashishi/cv-screening` repository
5. Render should detect `render.yaml`
6. Confirm the service settings:
   - **Root Directory:** `.`
   - **Environment:** `Docker`
   - **Dockerfile Path:** `Dockerfile`
   - **Start Command:** already defined in `render.yaml`

## 3. Add environment variables

In the Render dashboard for your web service, add these variables:

```
DJANGO_SECRET_KEY=your-very-long-random-secret-key
ALLOWED_HOSTS=your-render-app.onrender.com
CORS_ALLOWED_ORIGINS=https://cv-screening-ten.vercel.app,https://your-render-app.onrender.com
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DELTA=3600
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEBUG=False
```

### Database

Render will create a database if you attach one.
If you use Render PostgreSQL, it will provide a `DATABASE_URL` environment variable automatically.

## 4. Configure the frontend

Update `cv-screening-frontend/.env.production` to use the Render app domain:

```env
VITE_API_URL=https://your-render-app.onrender.com/api
```

Then redeploy your frontend on Vercel or rebuild it locally if you are serving it yourself.

## 5. Run migrations

After the web service is deployed, open the Render shell and run:

```bash
python manage.py migrate
python manage.py createsuperuser
```

## 6. Verify

Open the backend URL:

```
https://your-render-app.onrender.com/api/
```

Open the frontend and verify requests are sent to the Render backend.

## Notes

- Render free tier gives a small PostgreSQL database and a free web service.
- Do not use `python manage.py migrate` in `startCommand` if you prefer manual control. In `render.yaml`, the service now only starts Gunicorn.
- If you want the backend to auto-migrate during deploy, you can run migrations manually from Render shell after the first deployment.
