# Repair Now — Client App (`client-rn`)

React Native application for **clients** to submit and track appliance/home repair requests.

---

## Tech Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React Native | 0.73.4 | UI framework |
| TypeScript | 5.0.4 | Type safety |
| React Navigation (Stack) | 6.x | Multi-screen navigation |
| Axios | 1.6.x | REST API client |
| AsyncStorage | 1.21.x | Local session storage (non-sensitive data only) |
| Firebase Messaging | 19.x | Push notifications for repair status updates |
| React Native Image Picker | 7.x | System Photo Picker — no camera permission needed |

---

## Project Structure

```
client-rn/
├── App.tsx                          # Root: session check + FCM token registration
├── src/
│   ├── api/
│   │   ├── client.ts                # Axios base instance (reads API_BASE_URL from .env)
│   │   ├── authApi.ts               # login, register, OTP, FCM token, profile update
│   │   └── repairApi.ts             # Create repair request, fetch client repairs
│   ├── components/
│   │   ├── RepairCard.tsx           # Reusable repair summary card
│   │   └── StatusBadge.tsx          # Colour-coded status chip
│   ├── hooks/
│   │   └── useFcmToken.ts           # FCM permission request + token registration
│   ├── navigation/
│   │   └── AppNavigator.tsx         # Typed stack navigator (Login→Home→...)
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx      # Password login + OTP login (dual-mode)
│   │   │   └── RegisterScreen.tsx   # 2-step: form → OTP verification
│   │   ├── home/
│   │   │   └── HomeScreen.tsx       # Repair list + FAB + pull-to-refresh
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx    # Edit name, phone, avatar
│   │   └── repair/
│   │       └── RepairRequestScreen.tsx  # Submit new repair request
│   ├── store/
│   │   └── sessionStore.ts          # AsyncStorage save/get/clear session
│   └── types/
│       └── models.ts                # All TypeScript interfaces (User, Repair, Auth…)
├── android/
│   └── app/src/main/
│       └── AndroidManifest.xml      # Google Play compliant — INTERNET + POST_NOTIFICATIONS only
├── .env.example                     # API URL template — copy to .env
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
# 1. Install dependencies
npm install

# 2. Create your environment file
cp .env.example .env
# Edit .env and set: API_BASE_URL=https://your-backend.com/api/

# 3. Add google-services.json (from Firebase Console)
#    Place at: android/app/google-services.json

# 4. Run on Android
npx react-native run-android
```

---

## Google Play Policy Compliance

- ✅ **Permissions**: Only `INTERNET` and `POST_NOTIFICATIONS` declared
- ✅ **Photo access**: Uses Android Photo Picker (no `READ_MEDIA_IMAGES` permission required on API 33+)
- ✅ **Data stored locally**: Only non-sensitive session data (user ID, name, role) — never passwords  
- ✅ **No tracking SDKs**: No analytics, advertising, or third-party data collection
- ✅ **Network traffic**: HTTPS enforced in production (`usesCleartextTraffic="false"`)
- ✅ **Backup**: `allowBackup="false"` prevents session data exposure via ADB backup
