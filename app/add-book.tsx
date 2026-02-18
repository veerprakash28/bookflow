import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, useTheme, Surface, HelperText } from 'react-native-paper';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddBookScreen() {
    const router = useRouter();
    const theme = useTheme();
    const db = useSQLiteContext();

    const { id } = useLocalSearchParams(); // Check if editing
    const isEditing = !!id;

    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [totalUnits, setTotalUnits] = useState('');
    const [startDate, setStartDate] = useState(new Date());
    const [targetDate, setTargetDate] = useState(new Date());
    const [showStartDate, setShowStartDate] = useState(false);
    const [showTargetDate, setShowTargetDate] = useState(false);
    const [loading, setLoading] = useState(false);

    // Load book data if editing
    useEffect(() => {
        if (id) {
            db.getFirstAsync('SELECT * FROM books WHERE id = ?', [id]).then((book: any) => {
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

    // Calculate dynamic target date for quick selection (e.g. +7 days, +30 days)
    const setQuickDate = (days: number) => {
        const date = new Date(startDate); // Based on start date
        date.setDate(date.getDate() + days);
        setTargetDate(date);
    };

    const handleSave = async () => {
        if (!title.trim() || !totalUnits.trim()) {
            return;
        }

        setLoading(true);
        try {
            if (isEditing) {
                await db.runAsync(
                    `UPDATE books SET title = ?, author = ?, totalUnits = ?, startDate = ?, targetEndDate = ? WHERE id = ?`,
                    [title, author, parseInt(totalUnits), startDate.toISOString(), targetDate.toISOString(), id]
                );
            } else {
                await db.runAsync(
                    `INSERT INTO books (id, title, author, coverUri, totalUnits, unitsCompleted, status, startDate, targetEndDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        Date.now().toString(),
                        title,
                        author,
                        null,
                        parseInt(totalUnits),
                        0,
                        'Reading',
                        startDate.toISOString(),
                        targetDate.toISOString()
                    ]
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

    const DateSelector = ({ label, date, onPress }: { label: string, date: Date, onPress: () => void }) => (
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

                {/* Removed Custom Header - Native Header is enough */}

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
                        <HelperText type="error" visible={!title}>
                            Title is required
                        </HelperText>
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
                    <Text variant="titleMedium" style={{ marginBottom: 12, color: theme.colors.primary, fontWeight: 'bold' }}>
                        Set Your Pace
                    </Text>

                    <DateSelector
                        label="Start Date"
                        date={startDate}
                        onPress={() => setShowStartDate(true)}
                    />

                    <View style={styles.spacer} />

                    <DateSelector
                        label="Goal Date"
                        date={targetDate}
                        onPress={() => setShowTargetDate(true)}
                    />

                    {/* Quick Select Chips */}
                    <View style={styles.quickSelect}>
                        <Text variant="bodySmall" style={{ marginRight: 8, color: theme.colors.outline }}>Quick Goal:</Text>
                        <TouchableOpacity onPress={() => setQuickDate(7)}>
                            <View style={[styles.miniChip, { borderColor: theme.colors.outline }]}>
                                <Text variant="labelSmall">7 Days</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setQuickDate(14)}>
                            <View style={[styles.miniChip, { borderColor: theme.colors.outline }]}>
                                <Text variant="labelSmall">2 Weeks</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setQuickDate(30)}>
                            <View style={[styles.miniChip, { borderColor: theme.colors.outline }]}>
                                <Text variant="labelSmall">1 Month</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </Surface>

                {/* Date Pickers (Hidden) */}
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
    container: {
        flex: 1,
    },
    scroll: {
        padding: 16,
        paddingTop: 20,
    },
    card: {
        padding: 20,
        borderRadius: 16,
        backgroundColor: 'white',
        marginBottom: 16,
    },
    input: {
        marginBottom: 12,
        backgroundColor: 'transparent',
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    dateLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateValue: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    spacer: {
        height: 8,
    },
    saveButton: {
        marginTop: 4,
        borderRadius: 8,
    },
    quickSelect: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
        justifyContent: 'flex-end',
    },
    miniChip: {
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginLeft: 8,
        backgroundColor: 'transparent'
    }
});
