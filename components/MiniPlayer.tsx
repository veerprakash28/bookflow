import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton, Surface, useTheme } from 'react-native-paper';
import { useAudio } from './AudioProvider';
import { useRouter, usePathname } from 'expo-router';

export default function MiniPlayer() {
    const { isPlaying, isPaused, currentTitle, currentBookId, currentUrl, play, pause, resume, stop } = useAudio();
    const theme = useTheme();
    const router = useRouter();
    const pathname = usePathname();

    if (!isPlaying && !isPaused && !currentTitle) return null;
    if (pathname === '/book/reader' || pathname === `/book/${currentBookId}`) return null;

    const handlePress = () => {
        if (currentUrl) {
            router.push(`/book/reader?gutenbergTextUrl=${encodeURIComponent(currentUrl)}&bookId=${currentBookId}&bookTitle=${encodeURIComponent(currentTitle || '')}`);
        } else {
            router.push(`/book/${currentBookId}`);
        }
    };

    return (
        <Surface style={[styles.container, { backgroundColor: theme.colors.elevation.level3 }]} elevation={4}>
            <TouchableOpacity style={styles.content} onPress={handlePress} activeOpacity={0.8}>
                <View style={styles.textContainer}>
                    <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>NOW READING</Text>
                    <Text variant="bodyMedium" numberOfLines={1} style={{ fontWeight: '500' }}>{currentTitle || 'Unknown Book'}</Text>
                </View>
                <View style={styles.controls}>
                    {isPlaying ? (
                        <IconButton icon="pause" size={26} onPress={pause} />
                    ) : (
                        <IconButton icon="play" size={26} onPress={resume} />
                    )}
                    <IconButton icon="close" size={24} onPress={stop} />
                </View>
            </TouchableOpacity>
        </Surface>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90, // Positioned above the tab bar safely
        left: 16,
        right: 16,
        borderRadius: 16,
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 16,
        paddingRight: 4,
        paddingVertical: 4,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
        paddingVertical: 8,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
    }
});
