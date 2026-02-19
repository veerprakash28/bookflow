import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { theme } from '../constants/theme';
import { StatusBar } from 'expo-status-bar';

import { SQLiteProvider } from 'expo-sqlite';
import { migrateDbIfNeeded } from '../services/Database';
import { useEffect, useState } from 'react';
import { registerForPushNotificationsAsync, scheduleDailyReminder } from '../services/Notifications';
import AnimatedSplashScreen from '../components/AnimatedSplashScreen';
import { View, Platform } from 'react-native';

export default function RootLayout() {
    const [appReady, setAppReady] = useState(false);

    useEffect(() => {
        registerForPushNotificationsAsync().then(() => scheduleDailyReminder());
    }, []);

    if (!appReady) {
        return (
            <PaperProvider theme={theme}>
                <AnimatedSplashScreen onFinish={() => setAppReady(true)} />
            </PaperProvider>
        );
    }

    if (Platform.OS === 'web') {
        return (
            <PaperProvider theme={theme}>
                <StatusBar style="auto" />
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="add-book" options={{ presentation: 'modal', title: 'Add Book' }} />
                    <Stack.Screen name="book/[id]" options={{ headerShown: true, title: '' }} />
                    <Stack.Screen name="+not-found" />
                </Stack>
            </PaperProvider>
        );
    }

    return (
        <PaperProvider theme={theme}>
            <SQLiteProvider databaseName="bookflow.db" onInit={migrateDbIfNeeded}>
                <StatusBar style="auto" />
                <Stack>
                    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                    <Stack.Screen name="add-book" options={{ presentation: 'modal', title: 'Add Book' }} />
                    <Stack.Screen name="book/[id]" options={{ headerShown: true, title: '' }} />
                    <Stack.Screen name="+not-found" />
                </Stack>
            </SQLiteProvider>
        </PaperProvider>
    );
}
