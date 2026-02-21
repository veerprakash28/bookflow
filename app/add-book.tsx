import { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, FlatList } from 'react-native';
import { TextInput, Button, Text, useTheme, Surface, HelperText, Divider, Chip, ActivityIndicator } from 'react-native-paper';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useDatabase } from '../hooks/useDatabase';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { searchBooks, findGutenbergBook, BookSearchResult } from '../services/BookSearch';

export default function AddBookScreen() {
    const router = useRouter();
    const theme = useTheme();
    const db = useDatabase();

    const { id } = useLocalSearchParams();
    const isEditing = !!id;

    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [totalUnits, setTotalUnits] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [targetDate, setTargetDate] = useState(new Date());
    const [showStartDate, setShowStartDate] = useState(false);
    const [showTargetDate, setShowTargetDate] = useState(false);
    const [loading, setLoading] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<BookSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedBook, setSelectedBook] = useState<BookSearchResult | null>(null);
    const [gutenbergFound, setGutenbergFound] = useState(false);
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (id) {
            db.getFirstAsync('SELECT * FROM books WHERE id = ?', [String(id)]).then((book: any) => {
                if (book) {
                    setTitle(book.title);
                    setAuthor(book.author);
                    setTotalUnits(book.totalUnits.toString());
                    setStartDate(new Date(book.startDate));
                    setTargetDate(new Date(book.targetEndDate));
                }
            });
        }
    }, [id]);

    // Debounced search
    useEffect(() => {
        if (searchQuery.length < 3) {
            setSearchResults([]);
            return;
        }
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(async () => {
            setIsSearching(true);
            const results = await searchBooks(searchQuery);
            setSearchResults(results);
            setIsSearching(false);
        }, 500);
    }, [searchQuery]);

    const handleSelectBook = async (book: BookSearchResult) => {
        setSelectedBook(book);
        setTitle(book.title);
        setAuthor(book.author);
        setSearchQuery('');
        setSearchResults([]);
        setGutenbergFound(false);

        // Check Gutenberg in background
        const gutenberg = await findGutenbergBook(book.title, book.author);
        if (gutenberg) {
            setGutenbergFound(true);
            setSelectedBook(prev => prev ? {
                ...prev,
                gutenbergId: gutenberg.id,
            } : prev);
        }
    };

    const setQuickDate = (days: number) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + days);
        setTargetDate(date);
    };

    const handleSave = async () => {
        if (!title.trim() || !totalUnits.trim()) return;

        setLoading(true);
        try {
            if (isEditing) {
                await db.runAsync(
                    `UPDATE books SET title = ?, author = ?, totalUnits = ?, startDate = ?, targetEndDate = ? WHERE id = ?`,
                    [title, author, parseInt(totalUnits), startDate.toISOString(), targetDate.toISOString(), id]
                );
            } else {
                const gutenberg = selectedBook?.gutenbergId
                    ? await findGutenbergBook(selectedBook.title, selectedBook.author)
                    : null;

                const bookId = Date.now().toString();
                await db.runAsync(
                    `INSERT INTO books (id, title, author, coverUri, coverUrl, gutenbergId, gutenbergTextUrl, totalUnits, unitsCompleted, status, startDate, targetEndDate)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        bookId,
                        title,
                        author,
                        selectedBook?.coverUrl ?? null,
                        selectedBook?.coverUrl ?? null,
                        gutenberg?.id ?? null,
                        gutenberg ? `https://www.gutenberg.org/cache/epub/${gutenberg.id}/pg${gutenberg.id}.txt` : null,
                        parseInt(totalUnits),
                        0,
                        'Reading',
                        startDate.toISOString(),
                        targetDate.toISOString(),
                    ] as any
                );
            }
            router.back();
        } catch (e) {
            console.error(e);
            alert('Failed to save book');
        } finally {
            setLoading(false);
        }
    };

    const DateSelector = ({ label, date, onPress }: { label: string; date: Date; onPress: () => void }) => (
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
            <View style={[styles.dateRow, { borderColor: theme.colors.outline }]}>
                <View style={styles.dateLabelRow}>
                    <MaterialCommunityIcons name="calendar-month-outline" size={20} color={theme.colors.primary} />
                    <Text variant="bodyLarge" style={{ marginLeft: 8 }}>{label}</Text>
                </View>
                <Surface style={[styles.dateValue, { backgroundColor: theme.colors.secondaryContainer }]} elevation={0}>
                    <Text style={{ color: theme.colors.onSecondaryContainer, fontWeight: 'bold' }}>
                        {date.toLocaleDateString()}
                    </Text>
                </Surface>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['left', 'right', 'bottom']}>
            <Stack.Screen
                options={{
                    title: isEditing ? 'Edit Book' : 'Add Book',
                    presentation: 'modal',
                    headerShown: true,
                    headerStyle: { backgroundColor: theme.colors.background },
                    headerShadowVisible: false,
                    headerTintColor: theme.colors.primary,
                }}
            />
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

                {/* Book Search Section */}
                {!isEditing && (
                    <Surface style={styles.card} elevation={2}>
                        <Text variant="titleMedium" style={{ marginBottom: 12, color: theme.colors.primary, fontWeight: 'bold' }}>
                            🔍 Search for a Book
                        </Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}>
                            Search to auto-fill details. Classic books will have digital reading available.
                        </Text>

                        <TextInput
                            label="Search by title or author..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            mode="outlined"
                            style={{ marginBottom: 4 }}
                            right={isSearching
                                ? <TextInput.Icon icon={() => <ActivityIndicator size={16} />} />
                                : <TextInput.Icon icon="magnify" color={theme.colors.primary} />
                            }
                        />

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <View style={[styles.resultsContainer, { borderColor: theme.colors.outline }]}>
                                {searchResults.map((book, idx) => (
                                    <TouchableOpacity
                                        key={book.googleBooksId}
                                        onPress={() => handleSelectBook(book)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.resultItem, idx < searchResults.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }]}>
                                            {book.coverUrl ? (
                                                <Image source={{ uri: book.coverUrl }} style={styles.resultCover} />
                                            ) : (
                                                <View style={[styles.resultCoverPlaceholder, { backgroundColor: theme.colors.primaryContainer }]}>
                                                    <MaterialCommunityIcons name="book" size={20} color={theme.colors.primary} />
                                                </View>
                                            )}
                                            <View style={styles.resultText}>
                                                <Text variant="bodyMedium" style={{ fontWeight: 'bold' }} numberOfLines={1}>{book.title}</Text>
                                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>{book.author}</Text>
                                            </View>
                                            <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.outline} />
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Selected book preview */}
                        {selectedBook && (
                            <View style={[styles.selectedBook, { backgroundColor: theme.colors.primaryContainer }]}>
                                {selectedBook.coverUrl && (
                                    <Image source={{ uri: selectedBook.coverUrl }} style={styles.selectedCover} />
                                )}
                                <View style={{ flex: 1 }}>
                                    <Text variant="bodyMedium" style={{ fontWeight: 'bold', color: theme.colors.onPrimaryContainer }}>{selectedBook.title}</Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>{selectedBook.author}</Text>
                                    {gutenbergFound && (
                                        <Chip icon="book-open-variant" style={{ marginTop: 6, backgroundColor: '#E8F5E9', alignSelf: 'flex-start' }} textStyle={{ fontSize: 11, color: '#2E7D32' }}>
                                            Digital reading available ✓
                                        </Chip>
                                    )}
                                </View>
                                <TouchableOpacity onPress={() => { setSelectedBook(null); setGutenbergFound(false); }}>
                                    <MaterialCommunityIcons name="close-circle" size={22} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </Surface>
                )}

                <Surface style={styles.card} elevation={2}>
                    <Text variant="titleMedium" style={{ marginBottom: 16, color: theme.colors.primary, fontWeight: 'bold' }}>
                        {isEditing ? 'Edit Details' : 'Book Details'}
                    </Text>

                    <TextInput
                        label="Book Title"
                        value={title}
                        onChangeText={setTitle}
                        mode="flat"
                        style={styles.input}
                        contentStyle={{ backgroundColor: 'transparent' }}
                        underlineColor={theme.colors.outline}
                        activeUnderlineColor={theme.colors.primary}
                        right={<TextInput.Icon icon="book-outline" color={theme.colors.outline} />}
                    />
                    {title.length === 0 && (
                        <HelperText type="error" visible={!title}>Title is required</HelperText>
                    )}

                    <TextInput
                        label="Author"
                        value={author}
                        onChangeText={setAuthor}
                        mode="flat"
                        style={styles.input}
                        contentStyle={{ backgroundColor: 'transparent' }}
                        underlineColor={theme.colors.outline}
                        activeUnderlineColor={theme.colors.primary}
                        right={<TextInput.Icon icon="account-outline" color={theme.colors.outline} />}
                    />

                    <TextInput
                        label="Total Chapters"
                        value={totalUnits}
                        onChangeText={setTotalUnits}
                        keyboardType="numeric"
                        mode="flat"
                        style={styles.input}
                        contentStyle={{ backgroundColor: 'transparent' }}
                        underlineColor={theme.colors.outline}
                        activeUnderlineColor={theme.colors.primary}
                        right={<TextInput.Icon icon="format-list-numbered" color={theme.colors.outline} />}
                    />
                </Surface>

                <Surface style={styles.card} elevation={2}>
                    <Text variant="titleMedium" style={{ marginBottom: 16, color: theme.colors.primary, fontWeight: 'bold' }}>
                        Reading Schedule
                    </Text>

                    <DateSelector label="Start Reading" date={startDate} onPress={() => setShowStartDate(true)} />
                    <View style={styles.spacer} />
                    <DateSelector label="Finish By" date={targetDate} onPress={() => setShowTargetDate(true)} />

                    <View style={styles.quickSelectContainer}>
                        {[7, 14, 30].map((days) => (
                            <Chip
                                key={days}
                                mode="outlined"
                                onPress={() => setQuickDate(days)}
                                style={styles.quickChip}
                                textStyle={{ fontSize: 11 }}
                                icon="lightning-bolt-outline"
                            >
                                {days === 30 ? '1 Month' : `${days} Days`}
                            </Chip>
                        ))}
                    </View>

                    <Divider style={{ marginVertical: 16 }} />

                    <View style={styles.paceContainer}>
                        <MaterialCommunityIcons name="speedometer" size={20} color={theme.colors.secondary} style={{ marginRight: 8 }} />
                        <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                            Pace: <Text style={{ fontWeight: 'bold', color: theme.colors.primary }}>
                                {(() => {
                                    if (!totalUnits || isNaN(parseInt(totalUnits))) return '0';
                                    const diffDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                                    if (diffDays <= 0) return '∞';
                                    return (parseInt(totalUnits) / diffDays).toFixed(1);
                                })()}
                            </Text> ch/day
                        </Text>
                    </View>
                </Surface>

                {(showStartDate || showTargetDate) && (
                    <DateTimePicker
                        value={showStartDate ? startDate : targetDate}
                        mode="date"
                        display="default"
                        onChange={(event: any, selectedDate?: Date) => {
                            if (showStartDate) setShowStartDate(false);
                            if (showTargetDate) setShowTargetDate(false);
                            if (selectedDate) {
                                if (showStartDate) setStartDate(selectedDate);
                                else setTargetDate(selectedDate);
                            }
                        }}
                    />
                )}

                <Button
                    mode="contained"
                    onPress={handleSave}
                    style={styles.saveButton}
                    contentStyle={{ height: 48 }}
                    labelStyle={{ fontSize: 16, fontWeight: 'bold' }}
                    loading={loading}
                >
                    {isEditing ? 'Update Book' : 'Start Reading'}
                </Button>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { padding: 16, paddingTop: 20 },
    card: { padding: 20, borderRadius: 16, backgroundColor: 'white', marginBottom: 16 },
    input: { marginBottom: 12, backgroundColor: 'transparent' },
    dateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
    dateLabelRow: { flexDirection: 'row', alignItems: 'center' },
    dateValue: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    spacer: { height: 8 },
    saveButton: { marginTop: 4, borderRadius: 8 },
    quickSelectContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 },
    quickChip: { borderRadius: 16, flex: 1, marginHorizontal: 4 },
    paceContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, backgroundColor: '#f5f5f5', borderRadius: 8 },
    resultsContainer: { borderWidth: 1, borderRadius: 8, marginTop: 4, overflow: 'hidden' },
    resultItem: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: 'white' },
    resultCover: { width: 36, height: 50, borderRadius: 4, marginRight: 12 },
    resultCoverPlaceholder: { width: 36, height: 50, borderRadius: 4, marginRight: 12, justifyContent: 'center', alignItems: 'center' },
    resultText: { flex: 1, marginRight: 8 },
    selectedBook: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, marginTop: 12, gap: 12 },
    selectedCover: { width: 40, height: 56, borderRadius: 4 },
});
