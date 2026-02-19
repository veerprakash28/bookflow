import { View, StyleSheet, FlatList, Alert, LayoutAnimation, UIManager, Platform, Dimensions } from 'react-native';
import { Text, FAB, useTheme, Card, ProgressBar, Chip, Surface, Portal, Modal, Button, Divider, IconButton, List } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBooks, Book } from '../../hooks/useBooks';
import { useCallback, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDatabase } from '../../hooks/useDatabase';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

export default function LibraryScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { books, refreshBooks } = useBooks();
    const db = useDatabase();

    const [visible, setVisible] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    useFocusEffect(
        useCallback(() => {
            refreshBooks();
        }, [refreshBooks])
    );

    const showModal = (book: Book) => {
        setSelectedBook(book);
        setVisible(true);
    };

    const hideModal = () => {
        setVisible(false);
        setSelectedBook(null);
    };

    const calculateProgress = (book: Book) => {
        if (book.totalUnits === 0) return 0;
        return book.unitsCompleted / book.totalUnits;
    };

    const getDaysLeft = (book: Book) => {
        if (!book.targetEndDate) return null;
        const target = new Date(book.targetEndDate);
        const now = new Date();

        target.setHours(0, 0, 0, 0);
        now.setHours(0, 0, 0, 0);

        const diffTime = target.getTime() - now.getTime();
        return Math.round(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleEdit = () => {
        if (selectedBook) {
            hideModal();
            router.push({ pathname: '/add-book', params: { id: selectedBook.id } });
        }
    };

    const handleDelete = () => {
        if (selectedBook) {
            Alert.alert(
                "Delete Book?",
                `Are you sure you want to delete "${selectedBook.title}"? This cannot be undone.`,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                            const idToDelete = selectedBook.id;
                            hideModal();
                            // Animate list update
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            await db.runAsync('DELETE FROM books WHERE id = ?', [idToDelete]);
                            refreshBooks();
                        }
                    }
                ]
            );
        }
    };

    const renderBookItem = ({ item }: { item: Book }) => {
        const progress = calculateProgress(item);
        const daysLeft = getDaysLeft(item);
        const isOverdue = daysLeft !== null && daysLeft < 0;
        const isDueToday = daysLeft === 0;

        let statusText = '';
        let statusColor = theme.colors.primaryContainer;
        let statusTextColor = theme.colors.onPrimaryContainer;

        if (daysLeft !== null) {
            if (isOverdue) {
                statusText = `${Math.abs(daysLeft)} days overdue`;
                statusColor = theme.colors.errorContainer;
                statusTextColor = theme.colors.error;
            } else if (isDueToday) {
                statusText = 'Due Today';
                statusColor = theme.colors.tertiaryContainer; // Orange/Warning
                statusTextColor = theme.colors.onTertiaryContainer;
            } else {
                statusText = `${daysLeft} days left`;
                statusColor = theme.colors.secondaryContainer;
                statusTextColor = theme.colors.onSecondaryContainer;
            }
        }

        return (
            <View>
                <Card
                    style={styles.card}
                    onPress={() => router.push(`/book/${item.id}`)}
                    onLongPress={() => showModal(item)}
                    mode="elevated"
                >
                    <View style={styles.cardContent}>
                        {/* Cover Placeholder */}
                        <Surface style={[styles.cover, { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
                            <MaterialCommunityIcons name="book-open-page-variant" size={32} color={theme.colors.onPrimaryContainer} />
                        </Surface>

                        {/* Book Info */}
                        <View style={styles.bookInfo}>
                            <View style={styles.headerRow}>
                                <View style={{ flex: 1 }}>
                                    <Text variant="titleMedium" style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
                                    <Text variant="bodyMedium" style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
                                </View>
                                <MaterialCommunityIcons name="dots-vertical" size={24} color={theme.colors.outline} onPress={() => showModal(item)} />
                            </View>

                            {/* Progress */}
                            <View style={styles.progressContainer}>
                                <ProgressBar progress={progress} color={theme.colors.primary} style={styles.progressBar} />
                                <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                                    {Math.round(progress * 100)}% • {item.unitsCompleted}/{item.totalUnits} chapters
                                </Text>
                            </View>

                            {/* Status Chip */}
                            <View style={styles.footerRow}>
                                {daysLeft !== null && (
                                    <Chip
                                        icon="clock-outline"
                                        style={[styles.chip, { backgroundColor: statusColor }]}
                                        textStyle={{ fontSize: 11, color: statusTextColor }}
                                        compact
                                        onPress={() => { }} // dummy press to avoid touch propagation issues if needed
                                    >
                                        {statusText}
                                    </Chip>
                                )}
                            </View>
                        </View>
                    </View>
                </Card>
            </View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onBackground }}>Library</Text>
                <Text variant="bodyLarge" style={{ color: theme.colors.outline }}>{books.length} Books</Text>
            </View>

            <FlatList
                data={books}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                renderItem={renderBookItem}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="bookshelf" size={64} color={theme.colors.primaryContainer} />
                        <Text variant="titleMedium" style={{ marginTop: 16 }}>Your library is empty</Text>
                        <Text variant="bodyMedium" style={{ color: theme.colors.outline, textAlign: 'center', marginTop: 8 }}>
                            Tap the + button to add your first book and start tracking your reading journey.
                        </Text>
                    </View>
                }
            />

            <FAB
                icon="plus"
                style={[styles.fab, { backgroundColor: theme.colors.secondary }]}
                color={theme.colors.onSecondary}
                onPress={() => router.push('/add-book')}
            />

            <Portal>
                <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={styles.modalContainer}>
                    {selectedBook && (
                        <View style={{ backgroundColor: theme.colors.elevation.level3, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16, paddingBottom: 40 }}>
                            {/* Drag Handle */}
                            <View style={{ alignSelf: 'center', width: 32, height: 4, backgroundColor: theme.colors.outline, borderRadius: 2, marginBottom: 16, opacity: 0.4 }} />

                            <View style={{ paddingHorizontal: 24, marginBottom: 16 }}>
                                <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>{selectedBook.title}</Text>
                                <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>{selectedBook.author}</Text>
                            </View>

                            <Divider />

                            <List.Item
                                title="Edit Book"
                                description="Update details or progress"
                                left={props => <List.Icon {...props} icon="pencil-outline" />}
                                onPress={handleEdit}
                                titleStyle={{ fontWeight: '500' }}
                            />

                            <List.Item
                                title="Delete Book"
                                titleStyle={{ color: theme.colors.error, fontWeight: '500' }}
                                description="Permanently remove this book"
                                descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
                                left={props => <List.Icon {...props} icon="trash-can-outline" color={theme.colors.error} />}
                                onPress={handleDelete}
                            />
                        </View>
                    )}
                </Modal>
            </Portal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    list: {
        padding: 16,
        paddingBottom: 100,
    },
    card: {
        marginBottom: 12,
        backgroundColor: 'white',
    },
    cardContent: {
        flexDirection: 'row',
        padding: 16, // increased padding
        gap: 16,
    },
    cover: {
        width: 70,
        height: 100,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bookInfo: {
        flex: 1,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    bookTitle: {
        fontWeight: 'bold',
        marginRight: 8,
    },
    bookAuthor: {
        color: '#666',
    },
    progressContainer: {
        marginVertical: 4,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        marginBottom: 4,
        backgroundColor: '#E0E0E0',
    },
    footerRow: {
        flexDirection: 'row',
        marginTop: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    chip: {
        // Removed fixed height to allow auto-sizing
        backgroundColor: 'transparent',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        marginTop: 50,
    },
    fab: {
        position: 'absolute',
        margin: 20,
        right: 0,
        bottom: 0,
        borderRadius: 28, // Round FAB
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
});
