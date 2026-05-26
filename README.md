# Designli Tech Test: Real-Time Stock Alerts App 🚀

A full-stack application for monitoring real-time stock prices using the Finnhub WebSocket API, featuring JWT-protected price alerts and Firebase Cloud Messaging (FCM) push notifications.

---

## 🏗️ Architecture & Tech Stack

This project is structured as a **Monorepo** with a clear separation between the mobile client and the backend service.

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express + TypeScript | REST API server |
| MongoDB + Mongoose | Data persistence |
| Redis + BullMQ | Async notification queue with retry logic |
| JWT (jsonwebtoken) | Stateless authentication |
| Zod | Runtime input validation |
| Firebase Admin SDK | FCM push notification delivery |
| Finnhub WebSocket API | Real-time trade data |
| Docker + docker-compose | Containerized deployment |
| Vitest | Unit testing |

### Mobile
| Technology | Purpose |
|---|---|
| React Native + Expo | Cross-platform mobile app |
| NativeWind (TailwindCSS) | Utility-first styling |
| Zustand | Global WebSocket state management |
| React Navigation | Screen navigation |
| react-native-gifted-charts | Real-time line chart rendering |
| Firebase Cloud Messaging | Push notification reception |
| AsyncStorage | Local session persistence |

---

## ✨ Features

1. **Secure Authentication** — JWT-based login and registration. FCM device token is captured on login and stored server-side for targeted push delivery.
2. **Real-Time Market Data** — Live price charts via Finnhub WebSocket with dynamic throttling for smooth UI performance.
3. **Price Alerts** — Users set target prices for BTC, ETH, SOL, and BNB. Alerts are fully protected — users can only access their own data.
4. **Push Notifications** — FCM notifications delivered via a BullMQ queue with 3 retry attempts and fixed backoff when a price target is hit.

---

## 🔐 Security Architecture

Security was a primary concern throughout the design of this application:

- **JWT Authentication Middleware** — All alert routes are protected. The `authMiddleware` verifies the token on every request and rejects unauthorized access with a `401` response.
- **Server-side userId resolution** — The `userId` is never trusted from the client. It is always extracted from the verified JWT payload server-side, preventing users from accessing or creating alerts on behalf of others.
- **Input Validation with Zod** — All endpoints validate incoming request bodies against strict schemas before reaching the controller. Invalid requests are rejected with descriptive `400` errors.
- **Secrets Management** — Firebase credentials, JWT secret, and API keys are excluded from the repository via `.gitignore`. The backend dynamically switches between a local file path (development) and Render's secret vault (`/etc/secrets/`) in production.
- **Standardized API Responses** — Every response follows a consistent shape to prevent accidental data leakage:
  ```json
  { "success": true, "data": {} }
  { "success": false, "error": "Descriptive message" }
  ```

---

## 🏛️ Backend Structure

```
backend/src/
├── controllers/
│   ├── alertController.ts     # Create and fetch alerts (userId from JWT)
│   └── authController.ts      # Register and login handlers
├── middleware/
│   ├── auth.ts                # JWT verification middleware
│   ├── AppError.ts            # Standardized error factory (createError)
│   ├── errorHandler.ts        # Global error handler + 404 catcher
│   ├── validate.ts            # Reusable Zod validation middleware
│   └── validationSchemas.ts   # Zod schemas for all endpoints
├── models/
│   ├── Alert.ts               # Alert mongoose schema
│   └── User.ts                # User mongoose schema (with fcmToken)
├── queues/
│   └── notificationQueue.ts   # BullMQ worker for FCM delivery
├── routes/
│   ├── alertRoutes.ts         # /api/alerts (protected)
│   └── authRoutes.ts          # /api/auth/register, /api/auth/login
├── services/
│   └── finnhub.ts             # WebSocket client + alert evaluation
├── utils/
│   └── response.ts            # sendSuccess() / sendError() helpers
└── index.ts                   # App bootstrap, middleware registration
```

---

## 🏛️ Mobile Structure

```
mobile/src/
├── hooks/
│   ├── useLogin.ts            # FCM token retrieval, login API call, session storage
│   ├── useRegister.ts         # Registration flow and navigation
│   ├── useCreateAlert.ts      # Alert form state and submission
│   └── useLogout.ts           # WebSocket disconnect, session cleanup
├── services/
│   ├── apiClient.ts           # Base fetch client (auto-attaches JWT header)
│   ├── authService.ts         # Login and register API calls
│   └── alertsService.ts       # Create alert API call
├── screens/
│   ├── LoginScreen.tsx        # Pure UI — delegates to useLogin
│   ├── RegisterScreen.tsx     # Pure UI — delegates to useRegister
│   ├── AlertsScreen.tsx       # Pure UI — delegates to useCreateAlert
│   └── StocksScreen.tsx       # Pure UI — delegates to useLogout + useMarketStore
├── store/
│   └── useMarketStore.ts      # Zustand store — WebSocket lifecycle + chart state
└── navigation/
    └── AppNavigator.tsx       # Stack + Tab navigator configuration
```

---

## 🛠️ Local Setup & Docker Deployment

For security reasons, private keys are excluded from this repository.

### Prerequisites
- Docker & Docker Compose
- Node.js v20+ (if running without Docker)
- Android device or emulator (Android 13+ recommended)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in MONGO_URI, FINNHUB_API_KEY, JWT_SECRET, REDIS_HOST, REDIS_PORT
```

Place the provided `firebase-service-account.json` in the `backend/` root directory (delivered via email).

Then from the monorepo root:

```bash
docker-compose up --build -d
```

This starts three services in an isolated Docker network:
- `finnhub_backend` — Node.js API on port `3000`
- `finnhub_mongo` — MongoDB on port `27018`
- `finnhub_redis` — Redis on port `6379`

Verify the server is running:

```bash
curl http://localhost:3000/api/health
# { "success": true, "message": "Server is running successfully." }
```

### 2. Mobile Setup

```bash
cd mobile
npm install
# Place google-services.json in mobile/ root (delivered via email)
cp .env.example .env
# Set EXPO_PUBLIC_API_URL and EXPO_PUBLIC_FINNHUB_API_KEY
```

> ⚠️ **Important:** This project uses `@react-native-firebase` which requires native modules. **Expo Go is not supported.**

**Option A — Install the prebuilt APK (recommended):**
Download from the WeTransfer link provided via email. No setup required.

**Option B — Run from source:**
```bash
npx expo run:android
```
Requires Android SDK and a connected device or emulator.

---

## 🧪 Testing

Unit tests are written with **Vitest** and cover the most critical security layer — the authentication middleware.

```bash
cd backend
npm run test           # Run all tests once
npm run test:watch     # Watch mode during development
npm run test:coverage  # Generate coverage report
```

### Test coverage — `authMiddleware`

| Test case | Expected result |
|---|---|
| No Authorization header | `401` — Unauthorized |
| Header without `Bearer` prefix | `401` — Unauthorized |
| Invalid token string | `401` — Invalid or expired |
| Expired token | `401` — Invalid or expired |
| Token signed with wrong secret | `401` — Invalid or expired |
| Valid token | `next()` called, `req.user` populated |

---

## 🧠 Technical Decisions & Edge Cases Handled

### 1. JWT Auth Middleware & Server-side userId Resolution
All alert routes are protected by `authMiddleware`. Beyond authentication, the `userId` is always resolved from the verified token payload — never from `req.body` or `req.params`. This prevents a critical vulnerability where a user could supply another user's ID to access or create their alerts.

### 2. Global Error Handling
A centralized `globalErrorHandler` middleware catches all errors thrown across the application. Errors are classified as:
- **Operational** (`createError`) — expected failures like validation or auth errors. The message is safe to expose to the client.
- **Unexpected** — unhandled bugs. These are logged internally and return a generic `500` message to avoid leaking implementation details.

### 3. Input Validation with Zod
All endpoints validate `req.body` against strict Zod schemas before reaching the controller. Invalid requests are rejected immediately with field-level error details. Controllers receive only clean, typed data.

### 4. Concurrency & Race Conditions on Push Notifications
Finnhub streams multiple trades per millisecond. A single price target being hit could trigger concurrent alert evaluations, resulting in duplicate push notifications.

**Solution:** MongoDB's atomic `findOneAndUpdate` locks and deactivates the alert in a single indivisible operation. Subsequent concurrent evaluations find `isActive: false` and are safely rejected.

### 5. UI Performance & Dynamic Throttling
Rendering a chart point on every WebSocket message freezes the React Native UI thread.

**Solution:** A dual-speed throttling strategy:
- **Initial load:** First points captured every `500ms` to immediately remove the loading spinner.
- **Sustained load:** Throttle relaxes to `2s` to display meaningful market trends without overwhelming the React Native bridge.

### 6. WebSocket Resilience & Auto-Reconnection
Mobile networks drop connections frequently. Financial APIs also disconnect idle WebSocket clients.

**Solution:** The WebSocket client listens to `onclose` and `onerror` events and silently reconnects with exponential backoff (up to 5 attempts, max `15s` delay).

### 7. Notification Queue with Retry Logic
FCM delivery can fail transiently. Firing-and-forgetting the notification risks silent failures.

**Solution:** Notifications are dispatched through a BullMQ queue backed by Redis. Each job has 3 retry attempts with a fixed `5s` delay between attempts. Failed jobs are logged with full context.

### 8. Finnhub Rate Limits & Simulation Endpoint
The free tier limits simultaneous WebSocket connections. Running both the mobile app and the backend simultaneously can trigger HTTP `429` bans.

**Solution:** A dedicated simulation endpoint allows testing the full alert and notification flow without relying on Finnhub:

```bash
curl -X POST http://localhost:3000/api/alerts/simulate-price \
  -H "Content-Type: application/json" \
  -d '{"symbol":"BINANCE:BTCUSDT", "price": 200000}'
```

### 9. Mobile Architecture — Separation of Concerns
Keeping all logic directly in screens makes them untestable, hard to maintain, and tightly coupled.

**Solution:** Three distinct layers:
- **Services** — all API calls, with a base `apiClient` that auto-attaches the `Authorization` header.
- **Custom Hooks** — all state and business logic, one hook per screen.
- **Screens** — pure UI that only renders and calls hook handlers.

### 10. Secrets Management & Environment-Aware Configuration
**Solution:** All sensitive files (`.env`, `firebase-service-account.json`, `google-services.json`) are excluded via `.gitignore`. The backend detects its environment and reads Firebase credentials from the local filesystem in development or from Render's secret vault (`/etc/secrets/`) in production.

### 11. Monorepo Docker Optimization
Building Docker inside a monorepo without care pulls in the entire `mobile/` directory, creating bloated images.

**Solution:** A `.dockerignore` at the root excludes `mobile/`, `android/`, and local `node_modules/`. The resulting container includes only the compiled backend — lightweight and fast to deploy.
