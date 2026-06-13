<div align="center">

# 🛡️ DeskGuard
### Library Seat Booking & Anti-Hoarding System

**Find your seat. Keep it fair.**

[![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

</div>

---

## 📌 The Problem

Students "ghost-book" library seats — they book a desk and walk away for hours, leaving **30–40% of seats empty** during peak exam season while others can't find a place to study.

## 💡 The Solution

DeskGuard enforces **active presence**. Book a desk, check in with a code, and if you go away for more than **20 minutes** your desk is automatically released for someone else. Librarians get a real-time dashboard to monitor and manage the entire floor.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🗺️ **Interactive Floor Map** | Live colour-coded desk availability across 3 zones |
| ✅ **QR Code Check-In** | Unique booking code — prevents fake bookings |
| ⏱️ **Away Mode** | 20-min grace period timer, visible to student & librarian |
| 🔔 **Still-Here Check** | Periodic presence confirmation prevents ghost-bookings |
| 📋 **Booking History** | Complete session log with active vs away time breakdown |
| 🐛 **Issue Reporting** | Students report desk faults; librarians action them |
| 👩‍💼 **Librarian Dashboard** | Live stats, floor monitor, session management, check-in support |
| 🔄 **Real-Time Sync** | Changes in one tab instantly reflect in all other open tabs |

---

## 🚀 Run Locally

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/deskguard.git
cd deskguard

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — **no environment variables required.**

---

## 🎯 Demo Guide (For Evaluators)

### Student Flow
1. Go to `/signup` → create a **Student** account
2. Click any **green desk** on the floor map → select duration → **Confirm Booking**
3. Copy the booking code → go to `/checkin` → enter code → **Check In**
4. Active session starts at `/my-bookings` with a live countdown
5. Click **"I'm Away"** → 20-min grace period starts (session timer keeps running)
6. After 2 minutes → **"Still Here?"** modal appears → confirm or get released
7. View full session log at `/history`

### Librarian Flow
1. Go to `/signup` → create a **Librarian** account
2. **Dashboard** → live stats: occupied / away / free / abandoned
3. **Live Sessions** → all active sessions with countdown timers, filter & sort
4. **Floor Monitor** → interactive full floor map — click any desk for details + free it
5. **Issue Reports** → student-reported desk problems with action queue
6. **Check-In Support** → look up any booking by desk number and manually check in

### Cross-Tab Demo (Best wow-factor)
> Open Tab 1 as a Student and Tab 2 as a Librarian side-by-side.
> Book a desk in Tab 1 → watch it go red in Tab 2 instantly.

---

## 🏗️ Project Structure

```
src/
├── app/
│   ├── login/              # Login page
│   ├── signup/             # Sign up page
│   ├── dashboard/          # Student: interactive floor map
│   ├── checkin/            # Student: booking code check-in
│   ├── my-bookings/        # Student: active session + timers
│   ├── history/            # Student: past sessions log
│   ├── resources/          # Library resources info
│   ├── support/            # FAQ + contact (phone + email)
│   └── librarian/
│       ├── page.tsx            # Admin dashboard
│       ├── sessions/           # Live sessions table
│       ├── floor/              # Floor monitor
│       ├── issues/             # Issue reports
│       └── checkin-support/    # Manual check-in tool
├── components/
│   ├── AuthGuard.tsx       # Route protection
│   ├── layout/             # Sidebar + TopBar
│   ├── modals/             # BookingModal + StillHereModal
│   └── ui/                 # StatusBadge, DeskCard, Skeletons
├── context/
│   └── DeskGuardContext.tsx  # Global state + localStorage + cross-tab sync
└── lib/
    ├── types.ts            # All TypeScript types
    ├── storage.ts          # localStorage helpers
    ├── seedData.ts         # 50 desk seed data (Zone A/B/Silent)
    └── timerHelpers.ts     # Pure timer functions (portable to server)
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| State Management | React Context + useReducer |
| Persistence | localStorage (browser-based, no backend required) |
| Cross-Tab Sync | `window.storage` event listener |
| Icons | lucide-react |
| QR Code | qrcode.react |
| Notifications | sonner (toast) |

---

## 🌐 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel --prod
```

No environment variables needed — the app is fully self-contained.

---

## 📐 Anti-Hoarding Logic

```
Booking Created  ──►  Check In (15 min window)
      │
      ▼
  Checked In  ──►  Still Here? (every 2 min in demo / 2hr in production)
      │                    │
      │           [No response in 30s] ──► Desk Released
      │
      ▼
   I'm Away  ──►  20-min Grace Period
      │                    │
      │           [Timeout] ──► Desk Auto-Released
      │
      ▼
  I'm Back!  ──►  Session Resumes
```

> ⚠️ Demo timers are scaled down (2 min / 30 sec) so judges can see the full flow live.
> Production values are commented in `src/lib/timerHelpers.ts`.

---

## 👥 Team

Built by **Vishal** · SRM Institute of Science and Technology

📧 vd0602@srmist.edu.in · 📞 +91 7997998995

---

*Built for hackathon demonstration. Timer thresholds are scaled down for live demo — see source code comments for production values.*
