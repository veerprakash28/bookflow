import { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, useTheme, ActivityIndicator, Surface, IconButton, ProgressBar } from 'react-native-paper';
import { useLocalSearchParams, useNavigation, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import { useDatabase } from '../../hooks/useDatabase';
import { fetchAndParseChapters, Chapter } from '../../services/BookSearch';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ReaderScreen() {
    const { bookId, bookTitle, gutenbergTextUrl, chapterIndex } = useLocalSearchParams<{
        bookId: string;
        bookTitle: string;
        gutenbergTextUrl: string;
        chapterIndex: string;
    }>();
    const theme = useTheme();
    const navigation = useNavigation();
    const db = useDatabase();
    const scrollRef = useRef<ScrollView>(null);

    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
    const [loadingChapters, setLoadingChapters] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [sentences, setSentences] = useState<string[]>([]);
    const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
    const [view, setView] = useState<'chapters' | 'reading'>('chapters');

    useEffect(() => {
        navigation.setOptions({ title: bookTitle || 'Reader' });
        loadChapters();
    }, []);

    const loadChapters = async () => {
        setLoadingChapters(true);
        try {
            // Try to load cached chapters from DB first
            const row = await db.getFirstAsync<{ chapters: string }>(
                'SELECT chapters FROM books WHERE id = ?', [bookId]
            );

            if (row?.chapters) {
                const parsed: Chapter[] = JSON.parse(row.chapters);
                setChapters(parsed);
                // Auto-open chapter if passed via params
                if (chapterIndex !== undefined) {
                    openChapter(parsed[parseInt(chapterIndex)] || parsed[0]);
                }
            } else if (gutenbergTextUrl) {
                // Fetch from Gutenberg and cache
                const gutenbergUrl = decodeURIComponent(gutenbergTextUrl);
                const fetchedChapters = await fetchAndParseChapters(gutenbergUrl);
                setChapters(fetchedChapters);
                // Cache to DB
                await db.runAsync(
                    'UPDATE books SET chapters = ? WHERE id = ?',
                    [JSON.stringify(fetchedChapters), bookId]
                );
                if (chapterIndex !== undefined) {
                    openChapter(fetchedChapters[parseInt(chapterIndex)] || fetchedChapters[0]);
                }
            }
        } catch (e) {
            console.error('Error loading chapters:', e);
            Alert.alert('Error', 'Could not load chapters. Check your internet connection.');
        } finally {
            setLoadingChapters(false);
        }
    };

    const openChapter = (chapter: Chapter) => {
        stopSpeech();
        setCurrentChapter(chapter);
        // Split content into sentences for TTS
        const sentenceList = chapter.content
            .replace(/\n+/g, ' ')
            .split(/(?<=[.!?])\s+/)
            .filter(s => s.trim().length > 10);
        setSentences(sentenceList);
        setCurrentSentenceIdx(0);
        setView('reading');
        scrollRef.current?.scrollTo({ y: 0, animated: false });
    };

    const stopSpeech = () => {
        Speech.stop();
        setIsSpeaking(false);
    };

    const speakFrom = useCallback((idx: number) => {
        if (!sentences.length || idx >= sentences.length) {
            setIsSpeaking(false);
            return;
        }
        setCurrentSentenceIdx(idx);
        setIsSpeaking(true);
        Speech.speak(sentences[idx], {
            rate: 0.9,
            onDone: () => speakFrom(idx + 1),
            onStopped: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
        });
    }, [sentences]);

    const handlePlayPause = () => {
        if (isSpeaking) {
            stopSpeech();
        } else {
            speakFrom(currentSentenceIdx);
        }
    };

    const handlePrev = () => {
        stopSpeech();
        const newIdx = Math.max(0, currentSentenceIdx - 1);
        setCurrentSentenceIdx(newIdx);
    };

    const handleNext = () => {
        stopSpeech();
        const newIdx = Math.min(sentences.length - 1, currentSentenceIdx + 1);
        setCurrentSentenceIdx(newIdx);
    };

    const handlePrevChapter = () => {
        if (!currentChapter || currentChapter.index <= 0) return;
        openChapter(chapters[currentChapter.index - 1]);
    };

    const handleNextChapter = () => {
        if (!currentChapter || currentChapter.index >= chapters.length - 1) return;
        openChapter(chapters[currentChapter.index + 1]);
    };

    if (loadingChapters) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <Stack.Screen options={{ title: bookTitle || 'Reader' }} />
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={{ marginTop: 16, color: theme.colors.onSurfaceVariant }}>
                        Loading chapters from Project Gutenberg...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Chapter List View
    if (view === 'chapters') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['left', 'right', 'bottom']}>
                <Stack.Screen options={{ title: bookTitle || 'Reader' }} />
                {chapters.length === 0 ? (
                    <View style={styles.center}>
                        <MaterialCommunityIcons name="book-off-outline" size={48} color={theme.colors.outline} />
                        <Text style={{ marginTop: 12, color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                            No chapters available for this book.
                        </Text>
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={{ padding: 16 }}>
                        <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold', marginBottom: 12 }}>
                            {chapters.length} Chapters Available
                        </Text>
                        {chapters.map((chapter) => (
                            <TouchableOpacity key={chapter.index} onPress={() => openChapter(chapter)} activeOpacity={0.7}>
                                <Surface style={styles.chapterItem} elevation={1}>
                                    <View style={[styles.chapterNum, { backgroundColor: theme.colors.primaryContainer }]}>
                                        <Text style={{ color: theme.colors.primary, fontWeight: 'bold', fontSize: 13 }}>
                                            {chapter.index + 1}
                                        </Text>
                                    </View>
                                    <Text variant="bodyMedium" style={{ flex: 1, color: theme.colors.onSurface }} numberOfLines={2}>
                                        {chapter.title}
                                    </Text>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.outline} />
                                </Surface>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                )}
            </SafeAreaView>
        );
    }

    // Reading View
    const progress = sentences.length > 0 ? currentSentenceIdx / sentences.length : 0;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['left', 'right', 'bottom']}>
            <Stack.Screen
                options={{
                    title: currentChapter?.title || 'Reading',
                    headerLeft: () => (
                        <IconButton icon="format-list-bulleted" onPress={() => { stopSpeech(); setView('chapters'); }} />
                    ),
                }}
            />

            {/* Reading progress */}
            <ProgressBar progress={progress} color={theme.colors.primary} style={{ height: 3 }} />

            {/* Content */}
            <ScrollView ref={scrollRef} contentContainerStyle={styles.readingContent}>
                <Text variant="titleLarge" style={[styles.chapterTitle, { color: theme.colors.primary }]}>
                    {currentChapter?.title}
                </Text>
                {sentences.map((sentence, idx) => (
                    <Text
                        key={idx}
                        style={[
                            styles.sentence,
                            idx === currentSentenceIdx && isSpeaking && {
                                backgroundColor: theme.colors.primaryContainer,
                                color: theme.colors.onPrimaryContainer,
                                borderRadius: 4,
                            },
                        ]}
                        onPress={() => {
                            stopSpeech();
                            setCurrentSentenceIdx(idx);
                        }}
                    >
                        {sentence + ' '}
                    </Text>
                ))}
            </ScrollView>

            {/* TTS Controls */}
            <Surface style={[styles.controls, { borderTopColor: theme.colors.outline + '30' }]} elevation={4}>
                {/* Chapter navigation row */}
                <View style={styles.chapterNav}>
                    <TouchableOpacity
                        onPress={handlePrevChapter}
                        disabled={!currentChapter || currentChapter.index <= 0}
                        style={styles.chapterNavBtn}
                    >
                        <MaterialCommunityIcons
                            name="chevron-left"
                            size={16}
                            color={(!currentChapter || currentChapter.index <= 0) ? theme.colors.outline : theme.colors.primary}
                        />
                        <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                            Prev Chapter
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => { stopSpeech(); setView('chapters'); }}>
                        <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: 'bold' }}>
                            {currentChapter ? `${currentChapter.index + 1} / ${chapters.length}` : ''}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleNextChapter}
                        disabled={!currentChapter || currentChapter.index >= chapters.length - 1}
                        style={styles.chapterNavBtn}
                    >
                        <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                            Next Chapter
                        </Text>
                        <MaterialCommunityIcons
                            name="chevron-right"
                            size={16}
                            color={(!currentChapter || currentChapter.index >= chapters.length - 1) ? theme.colors.outline : theme.colors.primary}
                        />
                    </TouchableOpacity>
                </View>

                {/* Playback controls */}
                <View style={styles.playbackControls}>
                    <IconButton icon="skip-previous" size={28} onPress={handlePrev} iconColor={theme.colors.primary} />
                    <TouchableOpacity
                        style={[styles.playBtn, { backgroundColor: theme.colors.primary }]}
                        onPress={handlePlayPause}
                    >
                        <MaterialCommunityIcons
                            name={isSpeaking ? 'pause' : 'play'}
                            size={32}
                            color="white"
                        />
                    </TouchableOpacity>
                    <IconButton icon="skip-next" size={28} onPress={handleNext} iconColor={theme.colors.primary} />
                </View>
            </Surface>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    chapterItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 8, gap: 12 },
    chapterNum: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    readingContent: { padding: 20, paddingBottom: 40 },
    chapterTitle: { fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    sentence: { fontSize: 16, lineHeight: 28, color: '#1a1a1a', marginBottom: 2, paddingHorizontal: 2 },
    controls: { padding: 12, borderTopWidth: 1 },
    chapterNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 8 },
    chapterNavBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    playbackControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    playBtn: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginHorizontal: 16 },
});
