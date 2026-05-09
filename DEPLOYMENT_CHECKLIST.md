# Quick Deployment Checklist

## ✅ Files Created
- `client/vercel.json` - Vercel configuration
- `client/.env.production` - Production environment variables for frontend
- `server/.env.example` - Template for backend environment variables
- `render.yaml` - Render deployment configuration
- `DEPLOYMENT_GUIDE.md` - Comprehensive deployment guide

## 🚀 Quick Start (5 Steps)

### Step 1: Deploy Backend on Render
1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Select branch and repository
5. **Root Directory**: `server`
6. **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
7. **Start Command**: `npm start`
8. Add environment variables (see `server/.env.example`)
9. **Create Web Service** → Wait for deployment

**Your Backend URL**: `https://your-service-name.onrender.com`

---

### Step 2: Deploy Frontend on Vercel
1. Go to https://vercel.com/new
2. Select your GitHub repository
3. **Root Directory**: `client`
4. **Framework**: Vite (auto-detect)
5. **Build Command**: `npm run build`
6. **Output Directory**: `dist`
7. Add Environment Variable:
   ```
   VITE_API_URL=https://your-service-name.onrender.com/api
   ```
8. Click **Deploy** → Wait for deployment

**Your Frontend URL**: `https://your-project.vercel.app`

---

### Step 3: Update Environment Variables
Edit `server/.env.example` with your actual values:
```bash
# Required
DATABASE_URL=postgresql://...
FRONTEND_URL=https://your-project.vercel.app
JWT_SECRET=generate_a_random_string
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
CLOUDINARY_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

Add these to Render dashboard environment variables.

---

### Step 4: Update Google OAuth Settings
1. Go to https://console.cloud.google.com
2. Update "Authorized redirect URIs":
   - `https://your-service-name.onrender.com/api/auth/google/callback`
3. Update "Authorized JavaScript origins":
   - `https://your-project.vercel.app`

---

### Step 5: Test Your Deployment
1. Visit: `https://your-project.vercel.app`
2. Test login/register
3. Test Google OAuth
4. Test product browsing
5. Test checkout flow

---

## 🔗 Important URLs After Deployment
```
Frontend:   https://your-project.vercel.app
Backend:    https://your-service-name.onrender.com
API:        https://your-service-name.onrender.com/api
```

---

## ⚠️ Important Notes

- **Free Tier Limitations**:
  - Render free tier sleeps after 15 min of inactivity
  - Consider upgrading for production use
  
- **Database**: 
  - Using Neon PostgreSQL (free tier: 5GB, 20 projects)
  - Migrations run automatically on deploy

- **Images**: 
  - All image uploads go to Cloudinary (already configured)
  - No file storage issues on serverless

- **WebSockets**: 
  - Render supports WebSockets (used for real-time updates)

---

## 📚 Full Documentation
See `DEPLOYMENT_GUIDE.md` for detailed troubleshooting and configuration steps.
