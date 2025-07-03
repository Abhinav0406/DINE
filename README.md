# 🍽️ DINE+ Restaurant Management System

A comprehensive, full-stack restaurant management system that digitizes the entire dining experience with real-time order tracking, payment processing, and analytics.

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd dine-plus-frontend
npm install
npm start
```

## 🎯 Features

- **Customer Experience**: Table booking, interactive menu, cart management, real-time order tracking
- **Kitchen Operations**: Order dashboard, status management, sound notifications
- **Admin Management**: Revenue analytics, order monitoring, feedback insights
- **Real-time Updates**: Live order synchronization across all interfaces

## 🏗️ Tech Stack

- **Frontend**: React 19, TypeScript, Zustand, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Supabase)
- **Real-time**: Supabase Realtime

## 📁 Project Structure

```
Dine/
├── backend/           # Node.js + Express API
├── dine-plus-frontend/  # React + TypeScript frontend
└── README.md
```

## 🔧 Setup Instructions

1. Create a Supabase project
2. Run the database schema from `backend/src/db/schema.sql`
3. Update environment variables in both backend and frontend
4. Install dependencies and start both servers

## 🌟 Key Features

- Real-time order tracking
- Multi-role authentication (Customer, Kitchen Staff, Admin)
- Interactive menu with search and filters
- Payment integration
- Feedback system
- Revenue analytics 