# 🚀 Deploy Both Frontend & Backend on ONE Platform (FREE)

## Recommended: Render (Blueprint Deployment)

Deploy your entire application (frontend + backend) on **Render** with just a few clicks - **100% FREE**.

---

## ✅ Why Render?

- ✅ Deploy frontend + backend together
- ✅ Free tier available
- ✅ Automatic SSL certificates
- ✅ Auto-deploy from GitHub
- ✅ No credit card required
- ✅ Simple configuration

---

## 📋 Prerequisites

1. **GitHub Account** - Push your code to GitHub
2. **Render Account** - Sign up at https://render.com (free)

---

## 🚀 Deployment Steps

### Step 1: Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for deployment"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

---

### Step 2: Deploy on Render

#### Option A: Using Blueprint (Easiest - Deploys Both Together)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render will detect the `render.yaml` file
5. Configure environment variables (see below)
6. Click **"Apply"**

#### Option B: Manual Setup (Deploy Each Service)

**Deploy Backend First:**

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository
4. Settings:
   - **Name**: `ai-forensics-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`

**Deploy Frontend Second:**

1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repository
3. Settings:
   - **Name**: `ai-forensics-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: `Free`

---

### Step 3: Add Environment Variables

In Render dashboard, go to each service → **Environment** tab:

**Backend Environment Variables:**
```
MONGODB_URI=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
VITE_FIREBASE_API_KEY=AIzaSyD0sNOMvF69ueXoY8Smg25CgCXecVB-RvQ
VITE_FIREBASE_AUTH_DOMAIN=ai-digital-forensics-c603f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ai-digital-forensics-c603f
VITE_FIREBASE_STORAGE_BUCKET=ai-digital-forensics-c603f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=703433864174
VITE_FIREBASE_APP_ID=1:703433864174:web:40c219236095db7dc954ff
```

**Frontend Environment Variables:**
```
VITE_API_BASE_URL=https://ai-forensics-backend.onrender.com/api
VITE_FIREBASE_API_KEY=AIzaSyD0sNOMvF69ueXoY8Smg25CgCXecVB-RvQ
VITE_FIREBASE_AUTH_DOMAIN=ai-digital-forensics-c603f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ai-digital-forensics-c603f
VITE_FIREBASE_STORAGE_BUCKET=ai-digital-forensics-c603f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=703433864174
VITE_FIREBASE_APP_ID=1:703433864174:web:40c219236095db7dc954ff
```

⚠️ **Important**: Replace backend URL in `VITE_API_BASE_URL` with your actual backend URL from Render

---

### Step 4: Update CORS Settings

After backend deploys, get its URL (e.g., `https://ai-forensics-backend.onrender.com`)

Update `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ai-forensics-frontend.onrender.com",  # Add your frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit and push - Render will auto-redeploy:

```bash
git add backend/app/main.py
git commit -m "Update CORS for production"
git push
```

---

## 🎉 You're Live!

Your app will be accessible at:
- **Frontend**: `https://ai-forensics-frontend.onrender.com`
- **Backend API**: `https://ai-forensics-backend.onrender.com`
- **API Docs**: `https://ai-forensics-backend.onrender.com/docs`

---

## 📊 Free Tier Details

**What You Get FREE:**
- 750 hours/month per service
- Free SSL certificates
- Auto-deployments from GitHub
- 100 GB bandwidth/month
- Shared resources

**Limitations:**
- Services spin down after 15 min of inactivity
- Cold start time: ~30-60 seconds on first request
- Lower priority in resource allocation

---

## 🔄 Automatic Deployments

Once set up, every push to your `main` branch automatically deploys both services.

---

## 💡 Pro Tips

### 1. Keep Services Awake (Optional)

Use a free service like **UptimeRobot** or **Cron-job.org** to ping your backend every 10 minutes:

```
Ping URL: https://ai-forensics-backend.onrender.com/health
Interval: Every 10 minutes
```

### 2. Monitor Deployments

Check deployment logs in Render dashboard if something fails.

### 3. Custom Domains (Optional)

Free tier supports custom domains:
- Go to Settings → Custom Domains
- Add your domain (e.g., `forensics.yourdomain.com`)
- Update DNS records as instructed

---

## 🐛 Troubleshooting

### Backend Won't Start
- Check Render logs for errors
- Verify all environment variables are set
- Ensure Python version is correct

### Frontend Can't Reach Backend
- Check CORS settings in `backend/app/main.py`
- Verify `VITE_API_BASE_URL` points to correct backend URL
- Check browser console for errors

### Cold Starts
- Free tier services sleep after 15 min
- First request takes 30-60 seconds to wake up
- Solution: Use UptimeRobot to keep awake

### Build Failures
- Check build logs in Render dashboard
- Ensure `requirements.txt` and `package.json` are correct
- Try manual redeploy

---

## 🆙 Alternative Platforms (Also Deploy Both)

### Railway
- Very similar to Render
- $5 free credit/month
- Faster deployments
- Sign up: https://railway.app

### Fly.io
- 3 free VMs
- Requires Docker knowledge
- Very fast globally
- Sign up: https://fly.io

### Heroku (No longer free)
- Used to be free
- Now $5/month minimum

---

## 💰 Render Pricing (If You Outgrow Free)

- **Starter Plan**: $7/month per service
  - No cold starts
  - 512 MB RAM
  - Always running

- **Standard Plan**: $25/month per service
  - 2 GB RAM
  - Better performance

---

## ✅ Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Render account created
- [ ] Backend service deployed
- [ ] Frontend service deployed
- [ ] Environment variables configured
- [ ] CORS settings updated
- [ ] Application tested and working

---

## 🎯 Next Steps

1. Test your deployed application thoroughly
2. Set up monitoring (optional)
3. Configure custom domain (optional)
4. Set up automated backups for MongoDB
5. Monitor usage to stay within free tier

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Your Project Logs**: Check Render dashboard

---

Congratulations! Your AI Digital Forensics application is now live and accessible worldwide! 🎉
