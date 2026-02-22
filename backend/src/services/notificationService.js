const admin = require('firebase-admin');

// Note: Ensure GOOGLE_APPLICATION_CREDENTIALS environment variable is set 
// OR path to serviceAccountKey.json is provided here.
// For now, we'll try to initialize with default credentials or check if file exists.

try {
    // If you have a specific serviceAccountKey.json, require it:
    // const serviceAccount = require('../../serviceAccountKey.json');
    // admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

    // Using simple initialization (works if GOOGLE_APPLICATION_CREDENTIALS is set)
    admin.initializeApp();
    console.log('Firebase Admin Initialized');
} catch (error) {
    console.warn('Firebase Admin Initialization Failed (Notifications will not work):', error.message);
}

exports.sendNotification = async (fcmToken, title, body) => {
    if (!fcmToken) return;

    const message = {
        notification: {
            title: title,
            body: body
        },
        token: fcmToken
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent message:', response);
        return response;
    } catch (error) {
        console.error('Error sending message:', error);
        // Don't throw, just log, so flow doesn't break
    }
};

exports.sendMulticastNotification = async (fcmTokens, title, body) => {
    if (!fcmTokens || fcmTokens.length === 0) return;

    const message = {
        notification: {
            title: title,
            body: body
        },
        tokens: fcmTokens
    };

    try {
        const response = await admin.messaging().sendMulticast(message);
        console.log(response.successCount + ' messages were sent successfully');
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(fcmTokens[idx]);
                }
            });
            console.log('List of tokens that caused failures: ' + failedTokens);
        }
    } catch (error) {
        console.error('Error sending multicast message:', error);
    }
}
