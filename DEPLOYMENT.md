# Free Deployment Guide

Recommended free setup for this MERN app:

- Frontend: Vercel
- Backend: Render Web Service
- Database: MongoDB Atlas M0

## 1. Push Code to GitHub

Create a GitHub repository and push this project.

## 2. Create MongoDB Atlas Database

1. Create a free MongoDB Atlas M0 cluster.
2. Create a database user and password.
3. Add network access. For easiest free hosting setup, allow access from anywhere: `0.0.0.0/0`.
4. Copy the connection string and replace the password and database name.

Example:

```env
MONGODB_URI=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/expense
```

## 3. Deploy Backend on Render

Create a new Render Web Service from the GitHub repo.

Use these settings:

```text
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Add these environment variables in Render:

```env
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=use_a_long_random_secret
CORS_ORIGIN=https://your-frontend.vercel.app
```

After deploy, open the Render URL. It should show:

```text
API is running
```

## 4. Deploy Frontend on Vercel

Import the same GitHub repo in Vercel.

Use these settings:

```text
Framework Preset: Vite
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

Add this environment variable in Vercel:

```env
VITE_API_BASE_URL=https://your-render-backend.onrender.com/api
```

Deploy again after adding the environment variable.

## 5. Update Backend CORS

After Vercel gives you the final frontend URL, update Render's `CORS_ORIGIN`:

```env
CORS_ORIGIN=https://your-frontend.vercel.app
```

Then redeploy the backend.

## Notes

- Render free services can sleep when inactive, so the first request after a break may be slow.
- Keep `.env` files private. Only `.env.example` should be committed.
- Do not upload real bank statements unless you are comfortable storing/processing them through the deployed backend.
