import { View, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Platform } from 'react-native';
import { Text, Button, useTheme, ActivityIndicator, TextInput, ProgressBar, Card, IconButton, Chip, Divider, Surface } from 'react-native-paper';
import { useLocalSearchParams, useRouter, useNavigation, Stack, useFocusEffect } from 'expo-router';
import { useBooks, Book } from '../../hooks/useBooks';
import { useState, useEffect, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { recognizeText } from '../../services/OCR';
import * as Speech from 'expo-speech';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useStats } from '../../hooks/useStats';

export default function BookDetailScreen() {
    const { id } = useLocalSearchParams();
    const theme = useTheme();
    const router = useRouter();
    const navigation = useNavigation();
    const { books, refreshBooks } = useBooks();
    const { addPoints, updateBooksRead } = useStats(); // Updated hook
    const db = useSQLiteContext();

    const [book, setBook] = useState<Book | null>(null);
    const [scannedText, setScannedText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    useFocusEffect(
        useCallback(() => {
            refreshBooks();
            const foundBook = books.find(b => b.id === id);
            if (foundBook) {
                setBook(foundBook);
                navigation.setOptions({
                    title: foundBook.title,
                });
            }
        }, [books, id, navigation, refreshBooks])
    );

    const handleScan = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permission Required", "Permission to access camera is required!");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: 'Images',
            allowsEditing: true,
            quality: 1,
        });

        if (!result.canceled) {
            setIsProcessing(true);
            try {
                const textBlocks = await recognizeText(result.assets[0].uri);
                const fullText = textBlocks.join('\n');

                // Append text instead of replacing
                setScannedText(prev => prev ? prev + '\n\n' + fullText : fullText);
            } catch (e) {
                console.error(e);
                Alert.alert('Error', 'Failed to recognize text');
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const handleSpeak = () => {
        if (isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
        } else {
            if (!scannedText) return;
            Speech.speak(scannedText, {
                onDone: () => setIsSpeaking(false),
                onStopped: () => setIsSpeaking(false),
            });
            setIsSpeaking(true);
        }
    };

    const updateProgress = async (newProgress: number) => {
        if (!book) return;
        try {
            const oldProgress = book.unitsCompleted;
            const wasCompleted = book.status === 'Completed';

            const isCompleting = newProgress === book.totalUnits && newProgress > oldProgress;
            const isUncompleting = oldProgress === book.totalUnits && newProgress < oldProgress;

            // Determine new status
            let newStatus = book.status;
            if (newProgress === book.totalUnits) newStatus = 'Completed';
            else if (newProgress > 0) newStatus = 'Reading';
            else newStatus = 'To Read';

            await db.runAsync(
                'UPDATE books SET unitsCompleted = ?, status = ? WHERE id = ?',
                [newProgress, newStatus, book.id]
            );

            // Points Logic (Fair System)
            // 1. Progress Points: +/- 10 per unit change
            const deltaUnits = newProgress - oldProgress;
            if (deltaUnits !== 0) {
                await addPoints(10 * deltaUnits);
            }

            // 2. Completion Bonus/Penalty
            if (isCompleting && !wasCompleted) {
                await addPoints(50); // Bonus
                await updateBooksRead(1);
                Alert.alert('Congratulations! 🎉', 'Book Completed! You earned 50 bonus points.');
            } else if (isUncompleting && wasCompleted) {
                await addPoints(-50); // Penalty for undoing
                await updateBooksRead(-1);
            }

            await refreshBooks();
        } catch (e) {
            console.error(e);
        }
    };

    if (!book) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const progress = book.totalUnits > 0 ? book.unitsCompleted / book.totalUnits : 0;

    // Date Calculation
    const targetDate = new Date(book.targetEndDate);
    const today = new Date();
    const timeDiff = targetDate.getTime() - today.getTime();
    const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    const isOverdue = daysLeft < 0;

    const handleDelete = () => {
        Alert.alert(
            "Delete Book",
            "Are you sure you want to delete this book? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await db.runAsync('DELETE FROM books WHERE id = ?', [book.id]);
                        await refreshBooks();
                        router.back();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['left', 'right', 'bottom']}>
            <Stack.Screen
                options={{
                    headerShown: true,
                    title: '',
                    headerShadowVisible: false,
                    headerStyle: { backgroundColor: theme.colors.background },
                    headerTintColor: theme.colors.primary,
                    headerRight: () => (
                        <View style={{ flexDirection: 'row', marginRight: -8 }}>
                            <IconButton icon="pencil" iconColor={theme.colors.primary} onPress={() => router.push({ pathname: '/add-book', params: { id: book.id } })} />
                            <IconButton icon="delete" iconColor={theme.colors.error} onPress={handleDelete} />
                        </View>
                    )
                }}
            />
            <ScrollView contentContainerStyle={styles.scroll}>

                {/* Header Card */}
                <Surface style={styles.headerCard} elevation={2}>
                    <View style={styles.headerContent}>
                        <View style={[styles.coverPlaceholder, { backgroundColor: theme.colors.secondaryContainer }]}>
                            <MaterialCommunityIcons name="book" size={40} color={theme.colors.onSecondaryContainer} />
                        </View>
                        <View style={styles.headerText}>
                            <Text variant="headlineSmall" style={styles.title}>{book.title}</Text>
                            <Text variant="bodyLarge" style={{ color: theme.colors.secondary }}>{book.author}</Text>
                            <View style={styles.badges}>
                                <Chip icon="calendar" style={styles.chip} textStyle={{ fontSize: 12 }}>
                                    Target: {targetDate.toLocaleDateString()}
                                </Chip>
                                <Chip
                                    icon="clock-outline"
                                    style={[styles.chip, isOverdue && { backgroundColor: theme.colors.errorContainer }]}
                                    textStyle={{ fontSize: 10, color: isOverdue ? theme.colors.error : theme.colors.onSurface }}
                                >
                                    {daysLeft > 0 ? `${daysLeft} days left` : isOverdue ? `${Math.abs(daysLeft)} days overdue` : 'Due today'}
                                </Chip>
                            </View>
                        </View>
                    </View>
                    <Divider style={{ marginVertical: 16 }} />
                    <View style={styles.dateRow}>
                        <View style={styles.dateItem}>
                            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>Start Date</Text>
                            <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                                {book.startDate ? new Date(book.startDate).toLocaleDateString() : 'N/A'}
                            </Text>
                        </View>
                        <View style={styles.dateItem}>
                            <Text variant="labelMedium" style={{ color: theme.colors.outline }}>Target Date</Text>
                            <Text variant="bodyMedium" style={{ fontWeight: 'bold' }}>
                                {new Date(book.targetEndDate).toLocaleDateString()}
                            </Text>
                        </View>
                    </View>
                </Surface>

                {/* Progress Tracking */}
                <Card style={styles.card}>
                    <Card.Title title="Your Progress" left={(props) => <MaterialCommunityIcons {...props} name="progress-clock" size={24} />} />
                    <Card.Content>
                        <View style={styles.progressRow}>
                            <Text variant="displaySmall" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                                {Math.round(progress * 100)}%
                            </Text>
                            <Text variant="bodyMedium" style={{ alignSelf: 'center', marginBottom: 6 }}>
                                {book.unitsCompleted} of {book.totalUnits} chapters
                            </Text>
                        </View>
                        <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />

                        <View style={styles.controls}>
                            <Button
                                mode="outlined"
                                onPress={() => updateProgress(Math.max(0, book.unitsCompleted - 1))}
                                style={styles.controlBtn}
                            >
                                -1 Chapter
                            </Button>
                            <Button
                                mode="contained"
                                onPress={() => updateProgress(Math.min(book.totalUnits, book.unitsCompleted + 1))}
                                style={styles.controlBtn}
                            >
                                +1 Chapter
                            </Button>
                        </View>
                    </Card.Content>
                </Card>

                {/* Reading Assistant */}
                <Card style={styles.card}>
                    <Card.Title title="Reading Assistant" left={(props) => <MaterialCommunityIcons {...props} name="text-recognition" size={24} />} />
                    <Card.Content>
                        <Text variant="bodyMedium" style={styles.helperText}>
                            Scan pages to extract text. You can scan multiple pages to append them here.
                        </Text>

                        <View style={styles.actionRow}>
                            <Button
                                mode="contained-tonal"
                                icon="camera"
                                onPress={handleScan}
                                loading={isProcessing}
                                compact
                            >
                                Scan Page
                            </Button>
                            <Button
                                mode="text"
                                icon={isSpeaking ? "stop" : "volume-high"}
                                onPress={handleSpeak}
                                compact
                                disabled={!scannedText}
                            >
                                {isSpeaking ? "Stop" : "Read Aloud"}
                            </Button>
                            <Button
                                mode="text"
                                icon="content-copy"
                                onPress={() => setScannedText('')}
                                compact
                                disabled={!scannedText}
                            >
                                Clear
                            </Button>
                        </View>

                        {scannedText ? (
                            <TextInput
                                mode="flat"
                                multiline
                                value={scannedText}
                                onChangeText={setScannedText}
                                style={styles.textArea}
                                placeholder="Scanned text will appear here..."
                            />
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={{ color: theme.colors.outline }}>No text scanned yet.</Text>
                            </View>
                        )}
                    </Card.Content>
                </Card>

            </ScrollView >
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scroll: {
        padding: 16,
        paddingBottom: 40,
        gap: 16,
    },
    headerCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 8,
    },
    headerContent: {
        flexDirection: 'row',
        gap: 16,
    },
    coverPlaceholder: {
        width: 80,
        height: 120,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerText: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    badges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    chip: {
        height: 32,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
    },
    dateItem: {
        alignItems: 'center',
    },
    card: {
        borderRadius: 16,
        marginBottom: 8,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginBottom: 8,
    },
    progressBar: {
        height: 12,
        borderRadius: 6,
        marginBottom: 16,
    },
    controls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    controlBtn: {
        flex: 1,
    },
    helperText: {
        marginBottom: 16,
        color: '#666',
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    textArea: {
        minHeight: 150,
        backgroundColor: 'transparent',
        fontSize: 16,
    },
    emptyState: {
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        borderStyle: 'dashed',
    }
});
