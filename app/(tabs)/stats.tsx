import { View, StyleSheet, ScrollView, Alert, Dimensions } from 'react-native';
import { Text, useTheme, Card, Avatar, Button, Divider, Surface, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStats } from '../../hooks/useStats';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
            "This will clear all your points, streaks, and badges.",
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
        const allBadges = [
            { id: 'first_book', name: 'First Step', icon: 'book-open-page-variant', condition: stats.booksRead >= 1, color: '#4CAF50' },
            { id: 'streak_3', name: 'On Fire', icon: 'fire', condition: (stats.currentStreak || 0) >= 3, color: '#FF5722' },
            { id: 'streak_7', name: 'Unstoppable', icon: 'run-fast', condition: (stats.currentStreak || 0) >= 7, color: '#F44336' },
            { id: 'bookworm', name: 'Bookworm', icon: 'glasses', condition: stats.booksRead >= 5, color: '#2196F3' },
            { id: 'scholar', name: 'Scholar', icon: 'school', condition: stats.booksRead >= 10, color: '#9C27B0' },
            { id: 'century', name: 'Century Club', icon: 'trophy', condition: stats.totalPoints >= 100, color: '#FFC107' },
            { id: 'pro', name: 'Pro Reader', icon: 'star-circle', condition: stats.totalPoints >= 500, color: '#00ACC1' },
            { id: 'master', name: 'Grand Master', icon: 'crown', condition: stats.totalPoints >= 1000, color: '#E91E63' },
        ];
        return allBadges;
    };

    const badges = getBadges();
    const earnedBadges = badges.filter(b => b.condition);

    const StatCard = ({ icon, value, label, color, bgColor }: any) => (
        <Surface style={[styles.statSurface, { backgroundColor: bgColor }]} elevation={2}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
                <MaterialCommunityIcons name={icon} size={28} color={color} />
            </View>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface, marginTop: 8 }}>
                {value}
            </Text>
            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>{label}</Text>
        </Surface>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.headerContainer}>
                <Text variant="headlineMedium" style={styles.header}>Dashboard</Text>
                <Button mode="text" compact onPress={handleReset} textColor={theme.colors.error}>
                    Reset
                </Button>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Hero Stats (Points) */}
                <LinearGradient
                    colors={[theme.colors.primary, theme.colors.primaryContainer]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View>
                        <Text style={{ color: theme.colors.onPrimary, opacity: 0.8 }}>Total Score</Text>
                        <Text variant="displayMedium" style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>
                            {stats.totalPoints}
                        </Text>
                    </View>
                    <MaterialCommunityIcons name="trophy-outline" size={64} color={theme.colors.onPrimary} style={{ opacity: 0.5 }} />
                </LinearGradient>

                {/* Grid Stats */}
                <View style={styles.grid}>
                    <StatCard
                        icon="fire"
                        value={stats.currentStreak || 0}
                        label="Day Streak"
                        color="#FF5722"
                        bgColor={theme.colors.elevation.level1}
                    />
                    <StatCard
                        icon="book-open-variant"
                        value={stats.booksRead}
                        label="Books Read"
                        color="#2196F3"
                        bgColor={theme.colors.elevation.level1}
                    />
                    <StatCard
                        icon="medal-outline"
                        value={stats.longestStreak || 0}
                        label="Best Streak"
                        color="#FFC107"
                        bgColor={theme.colors.elevation.level1}
                    />
                    <StatCard
                        icon="calendar-check"
                        value={stats.lastReadDate ? new Date(stats.lastReadDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '-'}
                        label="Last Read"
                        color="#4CAF50"
                        bgColor={theme.colors.elevation.level1}
                    />
                </View>

                <Divider style={{ marginVertical: 24 }} />

                {/* Badges Section */}
                <View style={styles.sectionHeaderRow}>
                    <Text variant="titleLarge" style={styles.sectionHeader}>Badges</Text>
                    <Text variant="labelLarge" style={{ color: theme.colors.outline }}>
                        {earnedBadges.length} / {badges.length}
                    </Text>
                </View>

                <View style={styles.badgesGrid}>
                    {badges.map((badge, index) => {
                        const isUnlocked = badge.condition;
                        return (
                            <Surface key={index} style={[styles.badgeCard, !isUnlocked && styles.badgeLocked]} elevation={isUnlocked ? 2 : 0}>
                                <Avatar.Icon
                                    size={48}
                                    icon={isUnlocked ? badge.icon : 'lock'}
                                    style={{ backgroundColor: isUnlocked ? badge.color : '#E0E0E0' }}
                                    color={isUnlocked ? 'white' : '#9E9E9E'}
                                />
                                <Text
                                    variant="labelSmall"
                                    style={[styles.badgeText, !isUnlocked && { color: theme.colors.outline }]}
                                    numberOfLines={1}
                                >
                                    {badge.name}
                                </Text>
                            </Surface>
                        );
                    })}
                </View>

                {/* Footer Space */}
                <View style={{ height: 40 }} />

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 10,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    header: {
        fontWeight: 'bold',
    },
    heroCard: {
        borderRadius: 20,
        padding: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    statSurface: {
        width: (Dimensions.get('window').width - 52) / 2, // 2 columns with padding/gap
        borderRadius: 16,
        padding: 16,
        alignItems: 'flex-start',
    },
    iconContainer: {
        padding: 8,
        borderRadius: 12,
        marginBottom: 8,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionHeader: {
        fontWeight: 'bold',
    },
    badgesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    badgeCard: {
        width: (Dimensions.get('window').width - 64) / 3, // 3 columns for better spacing
        aspectRatio: 0.9,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        backgroundColor: 'white',
        // Shadow for depth
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    badgeLocked: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderStyle: 'dashed',
    },
    badgeText: {
        marginTop: 8,
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: 11,
        lineHeight: 14,
    }
});
