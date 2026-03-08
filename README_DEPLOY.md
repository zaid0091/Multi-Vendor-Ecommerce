Deployment guide — Free-friendly stack

Recommended stack (free tiers):
- Frontend: Vercel (deploy Vite app) or Netlify
- Backend: Render (or Fly.io) — deploy via Docker or connect GitHub
- Database + Storage: Supabase (free Postgres + optional storage)
- Media/files: Supabase Storage or Cloudinary (free tier)

Quick steps

1) Push repo to GitHub
   - Create a new repository and push all files.

2) Prepare environment variables
   - Create a `.env` locally from `backend/.env.example`.
   - Generate a secure `SECRET_KEY`.

3) Create Supabase project
   - Create project → get `DATABASE_URL` (Postgres). Note user/password.
   - Optionally enable Storage for user-uploaded media.

4) Deploy backend (Render / Fly.io)
   Option A — Render (no Docker required):
   - Create a new web service, connect your GitHub repo and select `backend` as the root.
   - Set build command: `pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput`
   - Start command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
   - Add environment variables in Render: `SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, etc.

   Option B — Fly.io (Docker):
   - Install flyctl, run `fly launch` in repo root and follow prompts.
   - Set secrets: `fly secrets set SECRET_KEY=... DATABASE_URL=...`
   - Deploy: `fly deploy`.

5) Run migrations and create admin
   - Once backend is deployed you can run migrations via the provider's console or using a one-off command:
     `python manage.py migrate --settings=config.settings`
   - Create admin: `python manage.py createsuperuser`

6) Deploy frontend (Vercel)
   - Connect GitHub repository to Vercel and select `frontend` folder.
   - Set environment variable `VITE_API_URL` to your backend base URL (e.g. `https://api.example.com`).
   - Deploy — Vercel will build with `npm run build` by default.

7) Configure CORS / ALLOWED_HOSTS
   - Add your frontend origin(s) to `CORS_ALLOWED_ORIGINS`.
   - Add backend domain to `ALLOWED_HOSTS`.

8) Media (optional)
   - If using Supabase Storage, configure credentials and update your Django storage backend.
   - For Cloudinary, set `CLOUDINARY_URL` and use `django-cloudinary-storage` (install and configure).

Notes and troubleshooting
- If you serve static files from the same app, ensure `collectstatic` ran and `STATIC_ROOT` exists.
- Monitor free-tier limits (bandwidth, DB row limits, monthly hours).
- Use HTTPS in production and set `SECURE_SSL_REDIRECT=True` behind a proper proxy.

If you want, I can:
- Add GitHub Actions to automatically build and push Docker image.
- Create a `django-storages` + Supabase/Cloudinary config.
- Prepare a `Makefile` with common commands e.g. `make deploy`.
