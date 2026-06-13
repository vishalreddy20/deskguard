<div align="center">

# 🛡️ DeskGuard
### Library Seat Booking & Anti-Hoarding System

**Find your seat. Keep it fair.**

[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

**🏆 WebForge — A Smart Campus Webathon | Manipal University, Jaipur**

[🔗 GitHub](https://github.com/vishalreddy20/deskguard) · [🚀 Live Demo](#) · [📖 Demo Guide](#-demo-guide-for-evaluators)

</div>

---

## 📌 The Problem

Students **"ghost-book"** library seats — they reserve a desk and walk away for hours, leaving **30–40% of seats permanently empty** during peak exam season while others can't find a place to study.

## 💡 The Solution

DeskGuard enforces **active presence**:
- Book a desk → check in with a unique code
- Go away for more than **20 minutes** → your desk is **automatically released**
- Every 2 minutes → **"Still Here?"** confirmation prompt
- Librarians get a **live real-time dashboard** to monitor and manage every desk

---

## ✨ Features

| Feature | Description |
|---|---|
| 🗺️ **Interactive Floor Map** | Live colour-coded availability across 3 zones (Zone A, Zone B, Silent) |
| ✅ **QR Code Check-In** | Unique booking code prevents fake/proxy bookings |
| ⏱️ **Away Mode** | 20-min grace period with live countdown visible to student & librarian |
| 🔔 **Still-Here Check** | Periodic presence confirmation — auto-releases ghost-booked desks |
| 📋 **Booking History** | Full session log with active time, away time, desk, slot breakdown |
| 🐛 **Issue Reporting** | Students report desk faults; librarians get an action queue |
| 👩‍💼 **Librarian Dashboard** | Live stats, floor monitor, session manager, check-in support tool |
| 🔄 **Cross-Tab Real-Time Sync** | Student books in Tab 1 → librarian sees it instantly in Tab 2 |

---

## 🚀 Run Locally

```bash
# Clone the repository
git clone https://github.com/vishalreddy20/deskguard.git
cd deskguard

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — **no environment variables, no database, no setup required.**

---

## 🎯 Demo Guide (For Evaluators)

### Quick Start — Create Accounts
Go to `/signup`. Choose role:
- **Student** → redirected to Library Floor Map
- **Librarian** → redirected to Admin Dashboard

### Student Flow
1. **Sign Up** as Student → Library Map
2. **Click any green desk** → select duration → **Confirm Booking**
3. Copy the booking code → go to **Check In** → paste code → **Check In**
4. Active session starts at **My Bookings** with live countdown
5. Click **"I'm Away"** → 20-min grace timer starts
6. After **2 minutes** → **"Still Here?"** modal appears
   - Confirm → session continues
   - Ignore 30s → desk auto-released ✅
7. View session log at **History** (desk, slot, active time, away time)

### Librarian Flow
1. **Sign Up** as Librarian → Dashboard
2. **Dashboard** → live stat cards (Occupied / Away / Free / Abandoned)
3. **Live Sessions** → all active sessions with countdown, filter by status
4. **Floor Monitor** → full interactive map, click any desk → details + free it
5. **Issue Reports** → student-reported desk faults with resolve button
6. **Check-In Support** → look up booking by desk number, manually check in

### Best Demo Moment 🏆
> Open **Tab 1** as Student + **Tab 2** as Librarian side by side.
> Book a desk in Tab 1 → watch it turn red in Tab 2 **instantly**.

---

## 🏗️ Project Structure

```
src/
├── app/
│   ├── login/                  # Login page
│   ├── signup/                 # Sign up page
│   ├── dashboard/              # Student: interactive floor map
│   ├── checkin/                # Student: booking code check-in
│   ├── my-bookings/            # Student: active session + timers
│   ├── history/                # Student: past sessions log
│   ├── resources/              # Library resources info
│   ├── support/                # FAQ + contact details
│   └── librarian/
│       ├── page.tsx            # Admin dashboard (stats + floor preview)
│       ├── sessions/           # Live sessions table
│       ├── floor/              # Full floor monitor
│       ├── issues/             # Issue reports queue
│       └── checkin-support/    # Manual check-in tool
├── components/
│   ├── AuthGuard.tsx           # Client-side route protection
│   ├── layout/                 # Sidebar + TopBar
│   ├── modals/                 # BookingModal + StillHereModal
│   └── ui/                     # StatusBadge, DeskCard, Skeletons
├── context/
│   └── DeskGuardContext.tsx    # Global state + localStorage + cross-tab sync
└── lib/
    ├── types.ts                # All TypeScript interfaces
    ├── storage.ts              # localStorage helpers
    ├── seedData.ts             # 50 desk seed data across 3 zones
    └── timerHelpers.ts         # Pure timer functions (portable to server)
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State Management | React Context + useReducer |
| Persistence | localStorage (no backend required) |
| Cross-Tab Sync | `window.storage` event listener |
| Icons | lucide-react |
| QR Code | qrcode.react |
| Notifications | sonner (toast) |

---

## 📐 Anti-Hoarding Logic

```
Booking Created ──► Check In (code entry)
      │
      ▼
  Checked In ──► Still Here? prompt (every 2 min demo / 2hr production)
      │                    │
      │         [No response in 30s] ──► Desk Released
      │
      ▼
  I'm Away ──► 20-minute Grace Period
      │                    │
      │         [Timeout] ──► Desk Auto-Released
      │
      ▼
  I'm Back! ──► Session Resumes
```

> ⚠️ Demo timers are scaled down so evaluators can see the full flow live.
> Production values are in comments in `src/lib/timerHelpers.ts`.

---

## 🔮 Production Roadmap

| Feature | Technology |
|---|---|
| Real database + multi-device sync | Supabase (PostgreSQL + Realtime) |
| Secure authentication | Supabase Auth / Google OAuth |
| Server-side timer enforcement | Supabase pg_cron (runs every minute) |
| Push notifications | Web Push API + Supabase Edge Functions |
| Email alerts | Resend API via Edge Functions |

---

## 👥 Team — vd0602

| Name | Role | Contact |
|---|---|---|
| **Vishal Gowtham** | Team Leader · Full Stack Dev | 📞 +91 7997998995 · 📧 vd0602@srmist.edu.in |
| **Taddi Gnana Prasanna** | Team Member | 📞 +91 9392710073 |

**Competition:** WebForge — A Smart Campus Webathon  
**Institution:** Manipal University, Jaipur  
**Repository:** [github.com/vishalreddy20/deskguard](https://github.com/vishalreddy20/deskguard)

---

*Built for hackathon demonstration. Timer thresholds are scaled down for live demo — see source code comments for production values.*
