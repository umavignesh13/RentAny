# RentAny - Peer-to-Peer Rental Marketplace

## Overview

A full-stack rental marketplace web app (like Airbnb but for products), with AI-powered features, real-time chat, payments, and an admin dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion + React Query
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Auth**: JWT (bcryptjs + jsonwebtoken)
- **Charts**: Recharts (admin dashboard)

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/          # Express 5 REST API server
│   │   └── src/
│   │       ├── lib/auth.ts  # JWT auth helpers + middleware
│   │       └── routes/      # auth, users, products, bookings, reviews, payments, messages, ai, admin
│   └── rentany/             # React + Vite frontend
│       └── src/
│           ├── pages/       # home, browse, product-detail, auth, dashboard, my-bookings
│           ├── components/  # layout, product-card, glass-card UI
│           └── hooks/       # use-auth
├── lib/
│   ├── api-spec/openapi.yaml  # OpenAPI 3.1 spec (source of truth)
│   ├── api-client-react/      # Generated React Query hooks
│   ├── api-zod/               # Generated Zod schemas
│   └── db/src/schema/         # Drizzle ORM models
│       ├── users.ts
│       ├── products.ts
│       ├── bookings.ts
│       ├── reviews.ts
│       ├── transactions.ts
│       └── messages.ts
```

## Demo Accounts

- **Owner**: alice@example.com / password123
- **Owner**: bob@example.com / password123
- **User**: charlie@example.com / password123
- **Admin**: admin@rentany.com / admin123

## Features

### Core
- JWT authentication (register/login/me) with role-based access (user/owner/admin)
- Product listings with images, categories, location, price, deposit
- Booking system with date selection and auto price calculation
- Review & rating system
- Payment simulation (create intent + confirm)
- Real-time-style messaging (conversations + messages)

### AI/ML Features
- **Recommendation Engine**: Suggests products based on user's booking history + collaborative filtering
- **Price Prediction**: Suggests optimal rental price based on category, location, condition
- **Fraud Detection**: Calculates risk score for users (flags, risk levels)
- **Popular Products**: Trending items sorted by booking count
- **Admin Analytics**: Revenue trends, user growth, category demand charts

### Admin Panel
- Platform stats (total users, products, bookings, revenue)
- User management with block/unblock
- Product management
- Revenue trends visualization

## API Routes

- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user (protected)
- `GET /api/products` — Browse with filters (category, location, price, search, sort, pagination)
- `POST /api/products` — Create listing (protected)
- `GET /api/products/:id` — Product detail
- `GET /api/products/categories` — Category list with counts
- `GET /api/bookings` — User bookings (protected)
- `POST /api/bookings` — Create booking (protected)
- `GET /api/reviews/product/:id` — Product reviews
- `POST /api/reviews` — Create review (protected)
- `POST /api/payments/create-intent` — Payment intent (protected)
- `POST /api/payments/confirm` — Confirm payment (protected)
- `GET /api/messages/conversations` — User conversations (protected)
- `GET /api/messages/:conversationId` — Messages in conversation (protected)
- `POST /api/messages/start` — Start conversation (protected)
- `GET /api/ai/recommendations` — Personalized picks (protected)
- `POST /api/ai/price-prediction` — Price suggestion (protected)
- `GET /api/ai/fraud-score/:userId` — Fraud risk (protected)
- `GET /api/ai/popular-products` — Trending products
- `GET /api/admin/stats` — Platform analytics (admin)
- `GET /api/admin/users` — All users (admin)
- `PUT /api/admin/users/:id/block` — Block/unblock user (admin)
- `GET /api/admin/products` — All products (admin)
- `GET /api/admin/revenue-trends` — Revenue data (admin)

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (auto-set by Replit)
- `JWT_SECRET` — JWT signing secret (defaults to built-in fallback; set in production)
- `PORT` — Server port (auto-assigned)
