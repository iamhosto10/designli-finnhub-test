# Designli Tech Test: Real-Time Stock Alerts App 🚀

A full-stack application built for monitoring real-time stock prices using the Finnhub WebSocket API, featuring customizable price alerts and Firebase Cloud Messaging (FCM) push notifications.

## 🏗️ Architecture & Tech Stack

This project is structured as a **Monorepo** containing both the mobile client and the backend service.

* **Mobile App:** React Native (Expo), NativeWind (TailwindCSS), Gifted Charts for data visualization.
* **Backend API:** Node.js, Express, TypeScript.
* **Database:** MongoDB (Mongoose) hosted on MongoDB Atlas.
* **Real-Time Data:** Finnhub WebSocket API.
* **Notifications:** Firebase Admin SDK & Firebase Cloud Messaging (FCM).
* **Infrastructure (Extra Point):** Fully Dockerized backend using `docker-compose`.

## ✨ Features

1. **User Authentication:** Secure login flow mapping users to their unique FCM device tokens.
2. **Real-Time Market Data:** Live candlestick-style line charts using WebSocket streams, optimized with dynamic throttling to ensure smooth UI performance.
3. **Price Alerts:** Users can set target prices for specific assets (e.g., BTC, ETH).
4. **Push Notifications:** Automatic FCM notifications delivered to the user's device when an asset crosses the target price.

## 🛠️ Local Setup & Docker Deployment

For security reasons, private keys are excluded from this repository.

### Prerequisites
* Docker & Docker Compose installed.
* Node.js v20+ (if running without Docker).
* Android Emulator or physical device (Android 13+ recommended).

### 1. Backend Setup
1. Navigate to the `backend` directory.
2. Copy `.env.example` to `.env` and fill in your MongoDB URI and Finnhub API Key.
3. Place the provided `firebase-service-account.json` (delivered via email) into the `backend/` root directory.
4. From the root of the monorepo, run:
   ```bash
   docker-compose up --build -d
This will spin up both the MongoDB instance and the Node.js API within an isolated Docker network.
    ```

### 2. Mobile Setup
1. Navigate to the `mobile` directory.
2. Run `npm install`.
3. Place `google-services.json` in `mobile/` root.
4. Copy `.env.example` to `.env` and set your API URL.

> ⚠️ This project uses @react-native-firebase which requires native modules.
> Expo Go is NOT supported. Use one of the following:

**Option A – Install the prebuilt APK (recommended for reviewers):**
Download the APK from the WeTransfer link provided via email.

**Option B – Run from source:**
```bash
npx expo run:android
```
Requires Android SDK and a connected device or emulator.

## 🧠 Technical Decisions & Edge Cases Handled

Throughout the development of this architecture, several critical edge cases were addressed to ensure a production-ready standard:

### 1. Concurrency & Race Conditions on Push Notifications
Finnhub's WebSocket streams multiple trades per millisecond. Initially, this caused a race condition where a single price target being hit would trigger the alert evaluation multiple times concurrently, resulting in duplicate push notifications. 
**Solution:** Implemented MongoDB's atomic operations (`findOneAndUpdate`). By locking and deactivating the alert in a single, indivisible database transaction, subsequent concurrent evaluations are safely rejected.

### 2. UI Performance & Dynamic Throttling for Real-Time Charts
Rendering a new data point on a React Native chart every millisecond freezes the UI thread and creates a visually meaningless flat line due to micro-variations in price.
**Solution:** Implemented a Dual-Speed Dynamic Throttling strategy:
* **Initial Load:** The first two data points are captured rapidly (every 500ms) to instantly remove the loading spinner and provide immediate feedback.
* **Sustained Load:** Once the baseline is drawn, the throttle relaxes to 3 seconds. This allows the chart to display meaningful market trends (peaks and valleys) without overwhelming the React Native bridge, while keeping the main text price updating instantly.

### 3. WebSocket Resilience & Auto-Reconnection
Mobile networks are unstable, and financial APIs frequently drop idle or long-running WebSocket connections to free up server memory.
**Solution:** Encapsulated the WebSocket logic with a robust auto-reconnect mechanism. By actively listening to the `onclose` and `onerror` events, the application silently attempts to re-establish the connection every 3 seconds if dropped, preventing infinite loading screens or frozen prices.

### 4. Finnhub API Rate Limits & Developer Experience (DX)
The free tier of Finnhub aggressively restricts simultaneous WebSocket connections (yielding HTTP 429 Too Many Requests). If the mobile app and the backend connect simultaneously, the IP is temporarily banned.
**Solution:** Created a dedicated simulation webhook (`/api/alerts/simulate-price`). This allows reviewers to easily verify the entire Alert and Push Notification flow on-demand without relying on Finnhub's external uptime or rate limits.
To allow seamless testing of the Push Notifications without relying on Finnhub's uptime, a simulation endpoint is provided:

Simulate Price Webhook:

```Bash
curl -X POST http://localhost:3000/api/alerts/simulate-price \
-H "Content-Type: application/json" \
-d '{"symbol":"BINANCE:BTCUSDT", "price": 80000}'
This forces the backend to evaluate the alerts and trigger the FCM push notification immediately.
```

### 5. Security & Environment-Aware Secrets Management
Committing private keys to public repositories is a critical security vulnerability. 
**Solution:** The `firebase-service-account.json`, `google-service.json` and `.env` files are strictly ignored via `.gitignore`. Furthermore, the backend is engineered to be environment-aware: it reads the Firebase credentials from a local path during development, but dynamically switches to Render's highly secure `/etc/secrets/` vault path when deployed to the cloud.

### 6. Monorepo Docker Optimization
Running a `docker-compose up` inside a monorepo usually builds the entire directory, resulting in massively bloated and slow containers.
**Solution:** Implemented a strategic `.dockerignore` file at the root level to strictly exclude the `mobile/`, `android/`, and local `node_modules/` directories. This ensures the Node.js backend container remains incredibly lightweight and fast to deploy.
