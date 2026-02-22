# Repair Now — Partner App (`partner-rn`)

React Native application for **partner technicians** to browse available repair jobs, accept them, and mark them as complete.

---

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React Native | 0.73.4 | UI framework |
| TypeScript | 5.0.4 | Type safety |
| React Navigation (Stack + Tabs) | 6.x | Stack + Bottom Tab navigation |
| Axios | 1.6.x | REST API client |
| AsyncStorage | 1.21.x | Local session storage (non-sensitive data only) |
| Firebase Messaging | 19.x | Push notifications for new available jobs |
| React Native Image Picker | 7.x | System Photo Picker — no camera permission needed |

---

## Project Structure

```
partner-rn/
├── App.tsx                              # Root: session check + FCM registration
├── src/
│   ├── api/
│   │   ├── client.ts                    # Axios base instance (reads API_BASE_URL from .env)
│   │   ├── authApi.ts                   # login, register, OTP, FCM token, profile update
│   │   └── repairApi.ts                 # Pending repairs, accept, my-jobs, complete
│   ├── components/
│   │   ├── RepairCard.tsx               # Reusable repair job card
│   │   └── StatusBadge.tsx              # Colour-coded status chip
│   ├── hooks/
│   │   └── useFcmToken.ts               # FCM permission + token registration
│   ├── navigation/
│   │   └── AppNavigator.tsx             # Stack + Bottom Tabs (Available | My Jobs)
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx          # Password + OTP login
│   │   │   └── RegisterScreen.tsx       # 2-step: form → OTP (role='partner')
│   │   ├── home/
│   │   │   └── PartnerHomeScreen.tsx    # Available pending jobs + Accept button
│   │   ├── jobs/
│   │   │   └── MyJobsScreen.tsx         # Accepted jobs + Mark as Complete
│   │   └── profile/
│   │       └── ProfileScreen.tsx        # Edit name, phone, avatar
│   ├── store/
│   │   └── sessionStore.ts              # AsyncStorage save/get/clear session
│   └── types/
│       └── models.ts                    # All TypeScript interfaces
├── android/
│   └── app/src/main/
│       └── AndroidManifest.xml          # Google Play compliant
├── .env.example
├── .gitignore
├── .eslintrc.js
├── babel.config.js
├── metro.config.js
├── package.json
└── tsconfig.json
```

---

## Setup

```bash
npm install
cp .env.example .env
# Set API_BASE_URL in .env
# Add android/app/google-services.json from Firebase Console
npx react-native run-android
```

---

## Google Play Policy Compliance

- ✅ `INTERNET` and `POST_NOTIFICATIONS` only — no camera, location, or storage permissions
- ✅ Photo Picker (API 33+) — no runtime storage permission required
- ✅ Non-sensitive session data only stored locally (user ID, name, role)
- ✅ No third-party analytics or advertising SDKs
- ✅ HTTPS enforced in production, `allowBackup="false"`
