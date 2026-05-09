# Deployment Guide: Vercel + Render

## Overview
- **Frontend**: Deployed on Vercel (https://delicious-bites.vercel.app)
- **Backend**: Deployed on Render (https://delicious-bites-api.onrender.com)
- **Database**: Neon PostgreSQL (free tier)

---

## Backend Deployment (Render)

### Prerequisites
1. Create a Render account at https://render.com
2. Have a Neon PostgreSQL database set up

### Steps

#### 1. **Create a New Web Service on Render**
- Go to https://render.com/dashboard
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Select the repository and branch (main/master)

#### 2. **Configure Environment Variables**
In Render dashboard, set these environment variables:

```
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host/database_name
FRONTEND_URL=https://delicious-bites.vercel.app
JWT_SECRET=<generate_a_strong_random_string>
GOOGLE_CLIENT_ID=<your_google_oauth_client_id>
GOOGLE_CLIENT_SECRET=<your_google_oauth_secret>
GOOGLE_CALLBACK_URL=https://delicious-bites-api.onrender.com/api/auth/google/callback
RAZORPAY_KEY_ID=<your_razorpay_key_id>
RAZORPAY_KEY_SECRET=<your_razorpay_key_secret>
CLOUDINARY_NAME=<your_cloudinary_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
```

#### 3. **Configure Build & Start Commands**
- **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command**: `npm start`
- **Root Directory**: `server`

#### 4. **Wait for Deployment**
Render will automatically build and deploy your backend. Once deployed, you'll get a URL like:
`https://delicious-bites-api.onrender.com`

**Note**: Free tier services sleep after 15 minutes of inactivity. Consider upgrading for production.

---

## Frontend Deployment (Vercel)

### Prerequisites
1. Create a Vercel account at https://vercel.com
2. Have GitHub connected to Vercel

### Steps

#### 1. **Import Project to Vercel**
- Go to https://vercel.com/new
- Select your GitHub repository
- Vercel will automatically detect it's a Vite project

#### 2. **Configure Environment Variables**
In Vercel dashboard, set:

```
VITE_API_URL=https://delicious-bites-api.onrender.com/api
```

**Important**: Make sure to set this for both Preview and Production environments.

#### 3. **Configure Build Settings**
- **Framework**: Vite (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Root Directory**: `client`

#### 4. **Deploy**
- Click "Deploy"
- Vercel will build and deploy your frontend automatically
- Your site will be available at something like: `https://delicious-bites.vercel.app`

---

## Important Configuration Updates

### Backend (server/src/index.js)
The server is already configured to:
- ✅ Read PORT from environment (defaults to 5000)
- ✅ Use FRONTEND_URL from environment for CORS
- ✅ Support DATABASE_URL for Neon

### Frontend (client/.env.production)
- ✅ Created `.env.production` with Render API URL
- ✅ Vercel will automatically use this for production builds

---

## Updating Database Migrations

When you need to run migrations in production:

**Option 1: Render Deploy Hooks (Recommended)**
1. Set up automatic migrations in your build command
2. Migrations run before the app starts

**Option 2: Manual Migration**
1. Connect to your Neon database directly
2. Run: `npx prisma migrate deploy`
3. Restart the Render service

---

## Google OAuth Setup

After deploying to Render and Vercel:

1. Go to Google Cloud Console
2. Update "Authorized redirect URIs":
   - Add: `https://delicious-bites-api.onrender.com/api/auth/google/callback`
   - Keep existing localhost URIs for development

3. Update "Authorized JavaScript origins":
   - Add: `https://delicious-bites.vercel.app`
   - Keep localhost for development

---

## Razorpay Configuration

Razorpay is already configured. Just ensure:
1. Your Razorpay keys are set as environment variables
2. Your webhook URL (if using): `https://delicious-bites-api.onrender.com/api/payments/webhook`

---

## Cloudinary Configuration

Cloudinary image uploads are already configured. Ensure:
1. Your Cloudinary credentials are set as environment variables
2. All image uploads will work seamlessly in production

---

## Domain Setup (Optional)

### Custom Domain on Vercel
1. Go to your Vercel project settings
2. Click "Domains"
3. Add your custom domain (e.g., delicious-bites.com)
4. Update DNS records as instructed

### Custom Domain on Render
1. Go to your Render service settings
2. Click "Custom Domain"
3. Add your domain
4. Update DNS records and CNAME

---

## Monitoring & Debugging

### Render
- View logs: Service dashboard → Logs tab
- Check health: Service dashboard → Health tab

### Vercel
- View logs: Project dashboard → Deployments → Select deployment → Logs
- Analytics available in dashboard

---

## Troubleshooting

### Frontend not connecting to backend
- ✅ Check `VITE_API_URL` in environment variables
- ✅ Ensure Render backend is running (check Render logs)
- ✅ Check browser console for CORS errors

### Database connection issues
- ✅ Verify `DATABASE_URL` is correct
- ✅ Check Neon database status
- ✅ Ensure migrations have run

### Google OAuth errors
- ✅ Check redirect URI matches exactly
- ✅ Verify client ID and secret are correct
- ✅ Check browser console for OAuth errors

---

## Cost Estimation

- **Render (Free)**: Free tier (limited to 750 free tier hours/month)
- **Vercel (Free)**: Unlimited deployments and bandwidth
- **Neon Database (Free)**: 5GB storage, 20 projects

For production, consider upgrading services for better uptime and performance.
