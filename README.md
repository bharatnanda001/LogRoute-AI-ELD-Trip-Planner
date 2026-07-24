# 🚛 LogRoute AI — FMCSA Commercial ELD & HOS Trip Planner Platform

[![FMCSA Compliant](https://img.shields.io/badge/FMCSA-49%20CFR%20Part%20395-blue.svg)](https://www.fmcsa.dot.gov/regulations/hours-of-service)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Build Status](https://img.shields.io/badge/Build-Passing-emerald.svg)](https://github.com/bharatnanda001/LogRoute-AI-ELD-Trip-Planner)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Full--Stack-black.svg)](https://vercel.com)

> **LogRoute AI** is an enterprise-grade, FMCSA-compliant Electronic Logging Device (ELD) and Hours of Service (HOS) Trip Planning platform built for commercial truck drivers, fleet dispatchers, and motor carrier safety administrators in the United States. Designed with a modern **Stripe × Linear × Vercel** American SaaS UI aesthetic (Design System v2.0).

---

## 🌟 Key Platform Features

### 🚛 1. FMCSA 49 CFR Part 395 Compliance Engine
- **11-Hour Driving Limit (§395.3(a)(1))**: Real-time gauge clock countdowns with auto-detected speed alerts.
- **14-Hour Duty Window (§395.3(a)(2))**: Enforces non-extendable shift window calculations.
- **30-Minute Rest Break (§395.3(a)(3)(ii))**: Automated countdown for mandatory rest break after 8 continuous hours of driving.
- **70-Hour / 8-Day & 60-Hour / 7-Day Cycle Recaps (§395.3(b))**: Dynamic 7-day rolling cycle recap table calculating exact midnight hours regain.
- **Special Duty Categories (§395.28)**:
  - **Personal Conveyance (PC)**: Off-duty driving with driver reason modal and bracketed log annotations.
  - **Yard Move (YM)**: On-duty terminal maneuvering with driver reason modal.
- **HOS Special Exceptions**:
  - **Adverse Driving (+2h)**: Adds +2 hours driving (11h → 13h) and duty window (14h → 16h) for emergency weather/road closure.
  - **16-Hour Short-Haul Window Extension**: Extends shift window to 16h once per 7 days.
  - **150 Air-Mile Exemption**: Short-haul break exemption.
- **Split Sleeper Berth Wizard (§395.1(g))**: Interactive 7/3 and 8/2 Split Sleeper pairing calculator.

---

### 🎨 2. Design System v2.0 (Stripe × Linear Aesthetic)
- **Neutral Palette**: `#F8FAFC` off-white background foundation, `#FFFFFF` elevated cards, `#0F172A` Slate typography.
- **Enterprise Accent**: `#2563EB` primary enterprise blue, `#4F46E5` indigo AI accent.
- **Soft Duty Badges**: Emerald (Off Duty), Indigo (Sleeper Berth), Rose/Red (Driving), Amber (On Duty).
- **Interactive 24-Hour Timeline Editor**: Figma-style drag, resize, split, and merge duty status blocks with instant 0ms SVG paper log sheet synchronization.

---

### 🔑 3. Multi-Role Auth & Admin Provisioning
- **Dedicated Full-Screen Login & Registration (`AuthPage.jsx`)**: Supports **Truck Driver Sign-Up** (custom Trucker ID issuance) and **Carrier Admin Sign-Up**.
- **Admin Driver Provisioning Panel (`AdminDriverProvisioning.jsx`)**: Fleet admins can create, issue, and manage Trucker Accounts (`TRK-1001`) for employee drivers.
- **Strict Role-Based Access Control (RBAC)**: Enforces complete view isolation between Drivers and Carrier Administrators.

---

### 📋 4. ERODS Roadside Inspection & DVIR Reports
- **Roadside Inspection Mode (`RoadsideInspectionMode.jsx`)**: FMCSA DOT inspector display with ERODS Web Service transfer payload generator and lock screen.
- **Driver Vehicle Inspection Report (`DVIRForm.jsx`)**: Pre-trip & post-trip safety checklist with canvas signature pad and defect reporting (§396.11).
- **Official FMCSA Form 395.8 Paper Log Renderer**: Complete SVG canvas replica of official DOT paper log grid with one-click PDF export.

---

## 🏗️ Tech Stack & Architecture

```
                                  Architecture Overview
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │ Frontend: React 18, Vite, Tailwind CSS v4, Zustand, Framer Motion, Lucide Icons      │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ Compliance: @eld/shared-hos Monorepo Engine, FMCSA §395 Rules, Split Sleeper Wizard   │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ Backend: Node.js, Express.js, WebSocket Gateway, Redis Cache, PostgreSQL Migrations   │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ Hosting: 100% Vercel Serverless (Frontend + API via api/index.js) & Render Ready       │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

- **Frontend**: React 18, Vite, Tailwind CSS v4, Zustand, Framer Motion, HTML5 Canvas / SVG, Lucide React Icons.
- **Compliance & Utilities**: Monorepo shared package `@eld/shared-hos`, `jspdf`, `html2canvas`.
- **Backend API**: Node.js, Express.js, `ws` (WebSocket Telematics), `redisService` (TTL caching), `pg` (PostgreSQL client).
- **Testing**: Jest unit test suite across HOS rules, log splitters, and authentication.

---

## 🔑 Sample Demo Login Credentials

Try these credentials on your hosted application:

| Account Role | Email / ID | Password | Access & Capabilities |
|---|---|---|---|
| 🚛 **Truck Driver** | `john@abclogistics.com` *(or `TRK-1001`)* | `password123` | Driver Dashboard, Timeline Editor, Trip Planner, DVIR, Roadside Mode, PDF Export. |
| 🏢 **Fleet Dispatcher** | `dispatcher@abclogistics.com` | `password123` | Fleet Roster, HOS Warnings, Unidentified Driving Events, Driver Log Inspector. |
| 🛡️ **Carrier Admin** | `admin@abclogistics.com` | `admin123` | Provisions Employee Trucker IDs, USDOT Settings, Multi-Company Management. |

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone Repository & Install Dependencies
```bash
git clone https://github.com/bharatnanda001/LogRoute-AI-ELD-Trip-Planner.git
cd LogRoute-AI-ELD-Trip-Planner

# Install frontend & shared package dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 2. Run Development Server
```bash
# Start frontend development server (http://localhost:5173)
npm run dev

# (Optional) Start backend API server (http://localhost:3001)
npm run server
```

### 3. Run Automated Compliance Unit Tests
```bash
npm test
```

---

## 🚀 100% Deployment Guide

### Deploying on Vercel (Frontend + Serverless APIs)
This repository is configured out-of-the-box for **100% full-stack hosting on Vercel**:

1. Go to [vercel.com](https://vercel.com) → **New Project**.
2. Select repository: `bharatnanda001/LogRoute-AI-ELD-Trip-Planner`.
3. Set **Framework Preset**: `Vite`.
4. Click **Deploy**!
   - *Vercel automatically compiles the React frontend and deploys your Express API routes under `/api/*` via `api/index.js`!*

---

## 📄 Compliance & Regulatory Disclaimer

> **Notice**: *Designed to satisfy FMCSA 49 CFR Part 395 and §395.20 requirements. Final commercial compliance and official listing on the FMCSA Registered ELD list depends on hardware integration (Bluetooth OBD-II / J1939 dongle), ELD self-certification testing, and roadside inspection interoperability validation.*

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for details.
