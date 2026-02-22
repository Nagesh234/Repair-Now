# RepairNow Project

Two-sided marketplace for home repairs in India.

## Structure

- **`/client-app`**: Android Native (Kotlin) app for customers.
- **`/partner-app`**: Android Native (Kotlin) app for technicians.
- **`/backend`**: Node.js + Express API.
- **`/database`**: SQL schema for Supabase.

## Getting Started

### Backend
1. `cd backend`
2. `npm install`
3. Create `.env` from `.env.example` and add your Supabase credentials.
4. `npm start`

### Android Apps
Open the `client-app` or `partner-app` folders in Android Studio.
Status: These are currently skeleton projects. You will need to initialize Gradle/Build files.

### Database
Run the scripts in `database/schema.sql` in your Supabase SQL Editor.
