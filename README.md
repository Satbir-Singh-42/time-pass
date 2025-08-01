# Cricket Auction Platform

A professional cricket auction management platform built with React, TypeScript, Express.js, and Firebase.

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Firebase Configuration

**For Development:**
Copy `.env.example` to `.env` and add your Firebase credentials:

```bash
cp .env.example .env
```

Then edit `.env` with your Firebase project settings:
```env
VITE_FIREBASE_API_KEY=your_actual_api_key
VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=yourproject.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

**Getting Firebase Credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project (or create new one)
3. Click gear icon → Project settings
4. Scroll to "Your apps" → Web app
5. Copy the config values to your `.env` file

### 3. Run the Application
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Features

- **Admin Authentication** - Firebase-powered secure login
- **Player Management** - Add, edit, and organize cricket players
- **Team Management** - Handle auction teams and budgets
- **Live Auction Control** - Real-time bidding interface
- **Analytics Dashboard** - Statistics and performance tracking
- **Responsive Design** - Works on desktop and mobile

## Project Structure

```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application pages
│   │   ├── lib/          # Firebase and utility functions
│   │   └── hooks/        # Custom React hooks
├── server/           # Express.js backend
├── shared/           # Shared types and schemas
└── .env.example      # Environment template
```

## Environment Variables

All Firebase credentials should be prefixed with `VITE_` to be accessible in the frontend:

- `VITE_FIREBASE_API_KEY` - Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID` - Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID` - Firebase app ID

## Security

- Never commit `.env` files to version control
- Use environment variables for all sensitive data
- Firebase credentials are automatically secured when deployed

## Deployment

The platform is ready for deployment on Replit, Vercel, or any Node.js hosting provider. Environment variables will be automatically loaded from the deployment platform's secrets management.#   t i m e - p a s s  
 