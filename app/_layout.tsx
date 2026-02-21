import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { theme } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';

import { SQLiteProvider, SQLiteDatabase } from 'expo-sqlite';
import { migrateDbIfNeeded } from '../services/Database';
import { useEffect, useState } from 'react';
import { registerForPushNotificationsAsync, scheduleDailyReminder, scheduleOverdueAlerts } from '../services/Notifications';
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';
import { View, Platform } from 'react-native';
import { ToastProvider } from '../components/ToastProvider';
import { AudioProvider } from '../components/AudioProvider';
import MiniPlayer from '../components/MiniPlayer';

export default function RootLayout() {
    const [appReady, setAppReady] = useState(false);

    const handleDbInit = async (db: SQLiteDatabase) => {
        await migrateDbIfNeeded(db);
        await scheduleOverdueAlerts(db);
    };

    useEffect(() => {
        registerForPushNotificationsAsync().then(() => scheduleDailyReminder());
    }, []);

    if (!appReady) {
        return (
            <PaperProvider theme={theme}>
                <ToastProvider>
                    <AudioProvider>
                        <AnimatedSplashScreen onFinish={() => setAppReady(true)} />
                    </AudioProvider>
                </ToastProvider>
            </PaperProvider>
        );
    }

    if (Platform.OS === 'web') {
        return (
            <PaperProvider theme={theme}>
                <ToastProvider>
                    <AudioProvider>
                        <StatusBar style="auto" />
                        <Stack>
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="add-book" options={{ presentation: 'modal', title: 'Add Book' }} />
                            <Stack.Screen name="book/[id]" options={{ headerShown: true, title: '' }} />
                            <Stack.Screen name="+not-found" />
                        </Stack>
                        <MiniPlayer />
                    </AudioProvider>
                </ToastProvider>
            </PaperProvider>
        );
    }

    return (
        <PaperProvider theme={theme}>
            <ToastProvider>
                <SQLiteProvider databaseName="bookflow.db" onInit={handleDbInit}>
                    <AudioProvider>
                        <StatusBar style="auto" />
                        <Stack>
                            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                            <Stack.Screen name="add-book" options={{ presentation: 'modal', title: 'Add Book' }} />
                            <Stack.Screen name="book/[id]" options={{ headerShown: true, title: '' }} />
                            <Stack.Screen name="book/reader" options={{ headerShown: true, title: 'Reader' }} />
                            <Stack.Screen name="+not-found" />
                        </Stack>
                        <MiniPlayer />
                    </AudioProvider>
                </SQLiteProvider>
            </ToastProvider>
        </PaperProvider>
    );
}
