# Friends App — Multi-Platform Ecosystem (Web + Native Android + Native iOS + Backend)

A complete social connection, celebrity engagement, and location-based event ticketing platform supporting **5 User Roles** across **Web (Next.js)**, **Native Android (Kotlin + Jetpack Compose)**, and **Native iOS (Swift + SwiftUI)**.

## 1. Supported User Roles (5 യൂസർ റോളുകൾ)
1. **Normal User (`USER`)**:
   - Mobile Number + OTP Login / Registration.
   - **Random Friend Connect**: Live **Audio Call (`RANDOM_AUDIO`)** and **Video Call (`RANDOM_VIDEO`)** matchmaking with online friends.
   - **Location-Based Events**: Discover nearby events sorted by GPS distance (PostGIS / Haversine) and book QR tickets.
   - **Celebrity Feed & Calls**: View celebrity photos & videos; upgrade to a **Premium Plan** + Wallet Coins to make **Audio Calls (`CELEBRITY_AUDIO`)** and **Video Calls (`CELEBRITY_VIDEO`)** to Celebrities.
   - **Customer Care Support**: Live Text Chat and **Audio Call (`SUPPORT_AUDIO`)** only (Video calling is disabled for Customer Care).
2. **Organization (`ORGANIZATION`)**:
   - Post & list location-tagged events, set ticket prices/capacities, and view bookings.
3. **Celebrity (`CELEBRITY`)**:
   - Upload photos & videos, manage online availability, set per-minute Audio & Video call rates, receive calls from Premium fans, and contact Customer Care via Chat or Audio Call.
4. **Customer Care Support (`SUPPORT`)**:
   - Respond to User & Celebrity support tickets via Live Chat and **Audio-Only Support Calls**.
5. **Super Admin (`SUPER_ADMIN`)**:
   - Full platform moderation: Block accounts, limit users, restrict specific call modes (`BAN_RANDOM_VIDEO`, `BAN_RANDOM_AUDIO`, `BAN_EVENT_POST`), and verify Celebrity/Organization profiles.

## 2. Project Structure
- [`backend/`](./backend): Node.js + TypeScript + Express + Socket.io WebRTC Signaling Server + Prisma (PostgreSQL/PostGIS schema).
- [`web-app/`](./web-app): Next.js 14 (React + TypeScript + Tailwind CSS) Web Application for all 5 roles.
- [`android-app/`](./android-app): Native Android application in **Kotlin + Jetpack Compose** (`WebRtcManager.kt`, `MainActivity.kt`).
- [`ios-app/`](./ios-app): Native iOS application in **Swift 5.10 + SwiftUI** (`Package.swift`, `FriendsApp.swift`, `WebRTCSignalingService.swift`).

## 3. Quick Start

### Start the Backend Server (Port 4000)
```bash
cd backend
npm install
npm run test   # Runs the 7 end-to-end automated verification suites
npm run dev    # Starts server on http://localhost:4000
```

### Start the Web Application (Port 3000)
```bash
cd web-app
npm install
npm run dev    # Opens on http://localhost:3000
```

### Build / Verify Native iOS Swift Package
```bash
cd ios-app
swift build
```

### Open Native Android Project
Open the `android-app/` folder in **Android Studio** and run the `app` configuration on an Android device or emulator.
