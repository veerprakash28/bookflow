import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { SQLiteDatabase } from 'expo-sqlite';
import { Book } from '../hooks/useBooks';

// Configure notification handler for foreground notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reading-reminders', {
            name: 'Reading Reminders',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0E5DAC',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        console.log('Failed to get permissions for push notification!');
        return;
    }
}

export async function scheduleDailyReminder() {
    // Cancel existing scheduled notifications to avoid duplicates 
    // (In a real app we'd keep track of specific IDs, but for simplicity we'll cancel all here 
    // before re-scheduling the daily one)
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Time to Read! 📚",
            body: "Keep your reading streak alive. Dive into your book today!",
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 20, // 8:00 PM
            minute: 0,
        },
    });
}

export async function scheduleOverdueAlerts(db: SQLiteDatabase) {
    try {
        const allBooks: Book[] = await db.getAllAsync('SELECT * FROM books WHERE status = ?', ['Reading']);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const book of allBooks) {
            if (book.targetEndDate) {
                const targetDate = new Date(book.targetEndDate);
                targetDate.setHours(0, 0, 0, 0);

                if (targetDate < today) {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: "Book Overdue! ⏰",
                            body: `You are behind schedule on "${book.title}". Catch up today!`,
                            sound: true,
                        },
                        trigger: null, // trigger immediately
                    });
                }
            }
        }
    } catch (e) {
        console.error("Failed to schedule overdue alerts", e);
    }
}
