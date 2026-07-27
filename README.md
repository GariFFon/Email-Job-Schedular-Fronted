# ReachInbox — Frontend Email Campaign Dashboard

The **modern, responsive web dashboard** for the ReachInbox Email Job Scheduler. Built with **React 18, TypeScript, Vite, Tailwind CSS, and Lucide Icons**, featuring real Google OAuth 2.0 authentication, CSV contact uploads, rich text email composing, and live campaign analytics.

---

## ✨ Features & UI Highlights

- **🔒 Real Google OAuth 2.0**: Seamless authentication via Google with persistent session management and automatic token handling.
- **📊 Real-time Campaign Stats**: Live counters for **Scheduled**, **Sent**, and **Failed** emails in a sleek left navigation sidebar.
- **✉️ Campaign Composer**:
  - Multi-recipient scheduling with instant visual tags and email address validation.
  - **CSV Mass Upload**: Upload `.csv` files to instantly parse and populate hundreds of recipients.
  - Custom sender identity (`From` dropdown with verified domains).
  - Configurable dispatch delay (`MIN_DELAY_BETWEEN_EMAILS_MS`) and hourly throttling limits.
  - Rich HTML message body formatting.
- **⏰ Scheduled & Sent Views**:
  - Filterable lists with instant search by recipient email, sender name, or subject line.
  - Star/unstar favorite campaign emails.
  - 1-click campaign cancellation for scheduled jobs before dispatch.
  - Clickable **Ethereal / Resend Preview URLs** to inspect rendered email delivery logs in real time.
- **⚡ Responsive & Fast**: Powered by Vite with optimistic UI updates and hot-toast notifications (`react-hot-toast`).

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** ≥ 18
- The [ReachInbox Backend API](../Email-Job-Schedular-Backend) running on port `3001` (or deployed cloud URL).

---

### Step 1: Install Dependencies

```bash
cd Email-Job-Schedular-Fronted
npm install
```

---

### Step 2: Configure Environment Variables

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` and set your backend API base URL:
```env
VITE_API_URL=http://localhost:3001
```
*(If connecting to a production Render backend, set this to `https://your-backend-url.onrender.com`)*.

---

### Step 3: Start Development Server

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to launch the dashboard!

---

## 🛠️ Tech Stack & Structure

```
src/
├── components/
│   ├── auth/         # Login, ProtectedRoutes, Google OAuth UI
│   ├── emails/       # ComposePage, EmailList, EmailDetail, CSV Uploader
│   ├── layout/       # Sidebar nav, Header, Stats counters
│   └── ui/           # Reusable Tailwind components (Buttons, Inputs, Badges)
├── context/          # AuthContext (Global user state management)
├── services/         # Axios API client with CORS and credential cookies
├── types/            # TypeScript interfaces for Email jobs, Batches, and User profiles
└── App.tsx           # React Router setup & global toast notifications
```

---

## ☁️ Production Deployment on Vercel

1. Push this repository to GitHub and import the project into [Vercel.com](https://vercel.com).
2. Set Root Directory: `Email-Job-Schedular-Fronted`
3. Add Environment Variable:
   - `VITE_API_URL`: Your deployed backend URL (e.g., `https://reachbox-backend.onrender.com`)
4. In your **Google Cloud Console** (under Credentials -> OAuth 2.0 Client IDs), add your Vercel URL to:
   - **Authorized JavaScript Origins**: `https://your-app.vercel.app`
   - **Authorized Redirect URIs**: `https://your-backend.onrender.com/api/auth/google/callback`

---

## 📝 License
MIT License. Part of the ReachInbox Email Campaign Scheduler ecosystem.
