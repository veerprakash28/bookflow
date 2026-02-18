import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, useTheme, Card, Avatar, Button, Divider, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStats } from '../../hooks/useStats';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function StatsScreen() {
    const theme = useTheme();
    const { stats, refreshStats, resetStats } = useStats();

    useFocusEffect(
        useCallback(() => {
            refreshStats();
        }, [refreshStats])
    );

    const handleReset = () => {
        Alert.alert(
            "Reset Progress?",
            "This will clear all your points and badges. Books read count will be reset to 0.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset", style: "destructive", onPress: async () => {
                        await resetStats();
                        Alert.alert("Reset Complete", "Your stats have been cleared.");
                    }
                }
            ]
        );
    };

    const getBadges = () => {
        const badges = [];
        // Define Badges
        const allBadges = [
            { id: 'first_book', name: 'First Step', icon: 'book-open-page-variant', condition: stats.booksRead >= 1, color: '#4CAF50' },
            { id: 'bookworm', name: 'Bookworm', icon: 'glasses', condition: stats.booksRead >= 5, color: '#2196F3' },
            { id: 'scholar', name: 'Scholar', icon: 'school', condition: stats.booksRead >= 10, color: '#9C27B0' },
            { id: 'library', name: 'Librarian', icon: 'bookshelf', condition: stats.booksRead >= 25, color: '#FF5722' },
            { id: 'century', name: 'Century Club', icon: 'trophy', condition: stats.totalPoints >= 100, color: '#FFC107' },
            { id: 'pro', name: 'Pro Reader', icon: 'star-circle', condition: stats.totalPoints >= 500, color: '#00ACC1' },
            { id: 'master', name: 'Grand Master', icon: 'crown', condition: stats.totalPoints >= 1000, color: '#E91E63' },
            { id: 'legend', name: 'Legend', icon: 'diamond', condition: stats.totalPoints >= 5000, color: '#607D8B' },
        ];
        return allBadges;
    };

    const badges = getBadges();
    const earnedBadges = badges.filter(b => b.condition);
    const lockedBadges = badges.filter(b => !b.condition);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text variant="headlineMedium" style={styles.header}>Your Achievements</Text>

                {/* Stats Summary Cards */}
                <View style={styles.statsRow}>
                    <Surface style={[styles.statSurface, { backgroundColor: theme.colors.primaryContainer }]} elevation={2}>
                        <MaterialCommunityIcons name="star-circle" size={32} color={theme.colors.primary} />
                        <Text variant="displaySmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }}>
                            {stats.totalPoints}
                        </Text>
                        <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer }}>Total Points</Text>
                    </Surface>

                    <Surface style={[styles.statSurface, { backgroundColor: theme.colors.secondaryContainer }]} elevation={2}>
                        <MaterialCommunityIcons name="book-multiple" size={32} color={theme.colors.onSecondaryContainer} />
                        <Text variant="displaySmall" style={{ color: theme.colors.onSecondaryContainer, fontWeight: 'bold' }}>
                            {stats.booksRead}
                        </Text>
                        <Text variant="labelLarge" style={{ color: theme.colors.onSecondaryContainer }}>Books Read</Text>
                    </Surface>
                </View>

                {/* Badges Section */}
                <Text variant="titleLarge" style={styles.sectionHeader}>Badges ({earnedBadges.length}/{badges.length})</Text>

                <View style={styles.badgesGrid}>
                    {badges.map((badge, index) => {
                        const isUnlocked = badge.condition;
                        return (
                            <Surface key={index} style={[styles.badgeCard, !isUnlocked && styles.badgeLocked]} elevation={isUnlocked ? 2 : 0}>
                                <Avatar.Icon
                                    size={56}
                                    icon={isUnlocked ? badge.icon : 'lock'}
                                    style={{ backgroundColor: isUnlocked ? badge.color : '#E0E0E0' }}
                                    color={isUnlocked ? 'white' : '#9E9E9E'}
                                />
                                <Text
                                    variant="labelMedium"
                                    style={[styles.badgeText, !isUnlocked && { color: theme.colors.outline }]}
                                    numberOfLines={1}
                                >
                                    {badge.name}
                                </Text>
                            </Surface>
                        );
                    })}
                </View>

                <Divider style={{ marginVertical: 32 }} />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 24,
        fontWeight: 'bold',
        color: '#1a1a1a',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statSurface: {
        flex: 1,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    sectionHeader: {
        marginBottom: 16,
        fontWeight: 'bold',
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between'
    },
    badgeCard: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        backgroundColor: 'white',
    },
    badgeLocked: {
        backgroundColor: '#F5F5F5',
        opacity: 0.8,
    },
    badgeText: {
        marginTop: 8,
        fontWeight: '600',
        textAlign: 'center',
    }
});
