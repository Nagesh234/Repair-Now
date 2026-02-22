const admin = require('firebase-admin');

// Firebase Admin is optional — if GOOGLE_APPLICATION_CREDENTIALS or
// FIREBASE_SERVICE_ACCOUNT_JSON env var is not set, notifications are silently skipped.
let firebaseInitialized = false;

try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (serviceAccountJson) {
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
        firebaseInitialized = true;
        console.log('Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT_JSON');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp();
        firebaseInitialized = true;
        console.log('Firebase Admin initialized via GOOGLE_APPLICATION_CREDENTIALS');
    } else {
        console.warn('⚠️  Firebase Admin not initialized: no credentials found. Push notifications will be disabled.');
    }
} catch (error) {
    console.warn('⚠️  Firebase Admin initialization failed (notifications disabled):', error.message);
}

exports.sendNotification = async (fcmToken, title, body) => {
    if (!fcmToken || !firebaseInitialized) return;

    const message = {
        notification: { title, body },
        token: fcmToken
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        return response;
    } catch (error) {
        console.error('Error sending message:', error);
        // Don't throw — notification failure should not break core flow
    }
};

exports.sendMulticastNotification = async (fcmTokens, title, body) => {
    if (!fcmTokens || fcmTokens.length === 0 || !firebaseInitialized) return;

    const message = {
        notification: { title, body },
        tokens: fcmTokens
    };

    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`${response.successCount} messages sent successfully`);
        if (response.failureCount > 0) {
            const failedTokens = response.responses
                .map((resp, idx) => (!resp.success ? fcmTokens[idx] : null))
                .filter(Boolean);
            console.warn('Failed tokens:', failedTokens);
        }
    } catch (error) {
        console.error('Error sending multicast message:', error);
    }
};
