# CIRA Setup & Testing Guide

## 🎯 Quick Start Checklist

### ✅ Prerequisites Verification

Before starting, ensure you have:

- [ ] **Python 3.9+** installed
- [ ] **Node.js 16+** installed  
- [ ] **MongoDB** running (local or cloud)
- [ ] **Google Cloud Project** created
- [ ] **Gemini API Key** obtained

---

## 🔧 Step 1: Backend Setup

### 1.1 Install Dependencies

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux  
source venv/bin/activate

pip install -r requirements.txt
```

### 1.2 Configure Environment Variables

The `.env` file should already have MongoDB configured. You need to add:

```env
# Already configured
MONGO_URI=mongodb+srv://charannaikk06_db_user:psR3RMicDs2tENUL@cluster0.wluyci5.mongodb.net/?retryWrites=true&w=majority

# ADD THESE FROM GOOGLE CLOUD CONSOLE
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here

# Already configured
REDIRECT_URI=http://localhost:5678/rest/oauth2-credential/callback
FRONTEND_URL=http://localhost:5173
```

### 1.3 Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Drive API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. **Authorized JavaScript origins:**
   - `http://localhost:5173`
   - `http://localhost:5678`
7. **Authorized redirect URIs:**
   - `http://localhost:5678/rest/oauth2-credential/callback`
8. Copy **Client ID** and **Client Secret** to `.env`

### 1.4 Start Backend Server

```bash
# Make sure you're in backend/ with venv activated
python -m uvicorn main:app --reload --port 5678
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:5678
INFO:     Application startup complete.
Connected to MongoDB client initialized.
```

---

## 🎨 Step 2: Frontend Setup

### 2.1 Install Dependencies

```bash
cd frontend
npm install
```

### 2.2 (Optional) Configure API URL

For production deployment, create `.env` file:

```env
VITE_API_URL=https://your-backend-url.com
```

For local development, it defaults to `http://localhost:5678`

### 2.3 Start Frontend Server

```bash
npm run dev
```

**Expected Output:**
```
  VITE v7.2.4  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

## 🧪 Step 3: Testing the Application

### 3.1 Test Health Check

Open browser and visit:
```
http://localhost:5678/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX...",
  "database": "connected",
  "mongo_configured": true
}
```

### 3.2 Test Authentication Flow

1. **Open Application:**
   - Navigate to `http://localhost:5173`
   - You should see the landing page with orange accent colors
   
2. **Sign In:**
   - Click "Sign in with Google"
   - You'll be redirected to Google OAuth
   - Accept permissions
   - You'll be redirected back to CIRA

3. **Enter Gemini API Key:**
   - Modal should appear automatically
   - Get key from: https://aistudio.google.com/app/apikey
   - Enter and save

### 3.3 Test Drive Integration

1. **Browse Drive:**
   - You should see your Google Drive folders
   - Click folders to navigate
   - Use breadcrumbs to go back

2. **Select Files:**
   - Click on files (not folders) to select
   - Orange accent should appear on selected items
   - Counter should update in header

3. **Sync Files:**
   - Click "Sync Selected" button
   - Watch progress indicators
   - Wait for "Sync complete" message

### 3.4 Test Chat Interface

1. **Ask Questions:**
   - Type a question about your documents
   - Press Enter or click send button
   - Watch for loading indicator

2. **Check Response:**
   - AI should respond with context from your files
   - Markdown formatting should be visible
   - Messages should auto-scroll

---

## 🎨 Visual Verification Checklist

### Color Palette ✅

- [ ] **Landing Page:** Orange accent (#f2830c) on buttons
- [ ] **Drive Picker:** Orange on selected files
- [ ] **Chat:** Orange accent on send button and AI avatar
- [ ] **Dark Mode:** All colors match specification

### UI Layout ✅

- [ ] **Breadcrumbs:** Clean with rounded buttons
- [ ] **File Grid:** Proper spacing, 6 columns on XL screens
- [ ] **Chat Messages:** Centered, max-width 4xl
- [ ] **Input Area:** Clean with proper padding
- [ ] **Animations:** Smooth transitions on hover

---

## 🐛 Troubleshooting

### Backend Won't Start

**Error:** `MONGO_URI not found`
- **Fix:** Check `.env` file exists in `backend/` folder

**Error:** `ModuleNotFoundError: No module named 'motor'`
- **Fix:** Run `pip install -r requirements.txt` again

**Error:** `OAuth credentials not configured`
- **Fix:** Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`

### Frontend Won't Build

**Error:** `Cannot find module './config'`
- **Fix:** Ensure `src/config.js` file exists

**Error:** CSS not loading properly
- **Fix:** Clear browser cache and restart dev server

### Authentication Issues

**Error:** "Google hasn't verified this app"
- **Solution:** Click "Advanced" → "Go to [App Name] (unsafe)"
- **Note:** This is normal for development

**Error:** "Redirect URI mismatch"
- **Fix:** Ensure `REDIRECT_URI` in `.env` matches Google Console

### Sync Failures

**Error:** "Gemini API Key not set"
- **Fix:** Enter API key in the modal that appears

**Error:** "Failed to upload file"
- **Fix:** Check Gemini API quotas and ensure key is valid

---

## 📊 Performance Tips

1. **Sync Large Folders:** Start with small folders (5-10 files) for testing
2. **Chat Responses:** First response may take 5-10 seconds
3. **File Types:** PDFs work best, Google Docs are exported as PDF
4. **Browser:** Chrome/Edge recommended for best performance

---

## 🚀 Production Deployment

### Environment Variables for Production

```env
# Backend .env
MONGO_URI=your_production_mongodb_uri
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
REDIRECT_URI=https://your-domain.com/rest/oauth2-credential/callback
FRONTEND_URL=https://your-domain.com
ENVIRONMENT=production
PORT=8000
```

### Google Cloud Console Updates

Add production URLs to:
- **Authorized JavaScript origins:** `https://your-domain.com`
- **Authorized redirect URIs:** `https://your-domain.com/rest/oauth2-credential/callback`

### Build Frontend

```bash
cd frontend
npm run build
```

Deploy `dist/` folder to your hosting service.

---

## ✅ Success Indicators

You know everything is working when:

1. ✅ Health check returns `"database": "connected"`
2. ✅ You can sign in with Google
3. ✅ You can browse your Drive folders
4. ✅ Files sync without errors
5. ✅ Chat responds with relevant information
6. ✅ Orange accent color is visible throughout
7. ✅ UI is clean and well-spaced

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console for errors (F12)
2. Check backend logs in terminal
3. Verify all environment variables are set
4. Ensure MongoDB is accessible
5. Check Google Cloud quotas

---

**Happy Building! 🎉**
