// Notifications are disabled for Expo Go on Android validation due to SDK 53+ limitations.
// Use a development build for full functionality.

export async function registerForPushNotificationsAsync() {
    console.log("Notifications: Skipped registration (Dev/Expo Go mode)");
    return;
}

export async function scheduleDailyReminder() {
    console.log("Notifications: Skipped scheduling (Dev/Expo Go mode)");
    return;
}
