# LearnHub

Ứng dụng web giúp học sinh/sinh viên tìm bạn học dựa trên điểm chung.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Storage**: Firebase Storage
- **Real-time**: Firebase Realtime subscriptions

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
- Copy `.env.example` to `.env.local`
- Fill in your Firebase and Google Calendar credentials

3. Run development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (main)/            # Protected routes
│   └── admin/             # Admin dashboard
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── matching/         # Matching feature components
│   ├── chat/             # Chat components
│   └── layout/           # Layout components
├── lib/                   # Utilities and configs
│   ├── firebase/         # Firebase setup
│   ├── hooks/            # Custom hooks
│   └── utils/            # Helper functions
├── types/                 # TypeScript types
└── styles/               # Global styles
```

## Features

- 🎯 Smart matching algorithm
- 💬 Real-time chat
- 👥 Study groups (max 5 members)
- 📍 Location sharing
- 🏆 Token & badge system
- 👑 Premium subscription
