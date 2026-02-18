import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { Text, List, Button, Switch, Divider, useTheme, Avatar, Surface, IconButton, Portal, Modal, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStats } from '../../hooks/useStats';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';

export default function SettingsScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { resetStats } = useStats();
    const { profile, updateProfile } = useUserProfile();

    const [editVisible, setEditVisible] = useState(false);
    const [name, setName] = useState('');
    const [title, setTitle] = useState('');

    const openEdit = () => {
        setName(profile.name);
        setTitle(profile.title);
        setEditVisible(true);
    };

    const handleSaveProfile = async () => {
        await updateProfile(name, title);
        setEditVisible(false);
    };

    const handleResetStats = () => {
        Alert.alert(
            "Reset All Stats?",
            "This will delete your reading progress and points. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        await resetStats();
                        Alert.alert("Success", "Stats have been reset.");
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onBackground }}>Settings</Text>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* User Profile Section */}
                <Surface style={styles.profileCard} elevation={1}>
                    <View style={styles.profileHeader}>
                        <Avatar.Text size={64} label={profile.name.substring(0, 1).toUpperCase()} style={{ backgroundColor: theme.colors.primary }} />
                        <View style={styles.profileInfo}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{profile.name}</Text>
                            <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>{profile.title}</Text>
                        </View>
                        <IconButton icon="pencil" onPress={openEdit} />
                    </View>
                </Surface>

                <List.Section title="General">
                    <List.Item
                        title="Appearance"
                        description="Light Mode (Default)"
                        left={props => <List.Icon {...props} icon="theme-light-dark" />}
                        onPress={() => { }} // Placeholder for future theme switching
                    />
                    <List.Item
                        title="Notifications"
                        description="Daily Reminders"
                        left={props => <List.Icon {...props} icon="bell-outline" />}
                        right={() => <Switch value={true} onValueChange={() => { }} />} // Placeholder
                    />
                </List.Section>

                <Divider />

                <List.Section title="Data & Storage">
                    <List.Item
                        title="Export Data"
                        description="Save your library locally"
                        left={props => <List.Icon {...props} icon="export-variant" />}
                        onPress={() => { }}
                    />
                    <List.Item
                        title="Reset Statistics"
                        description="Clear all reading progress"
                        left={props => <List.Icon {...props} icon="refresh" color={theme.colors.error} />}
                        titleStyle={{ color: theme.colors.error }}
                        onPress={handleResetStats}
                    />
                </List.Section>

                <View style={styles.footer}>
                    <Text variant="bodySmall" style={{ color: theme.colors.outline, textAlign: 'center' }}>
                        BookFlow v1.0.0
                    </Text>
                </View>
            </ScrollView>

            <Portal>
                <Modal visible={editVisible} onDismiss={() => setEditVisible(false)} contentContainerStyle={styles.modalContainer}>
                    <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 16 }}>
                        <Text variant="headlineSmall" style={{ marginBottom: 16, fontWeight: 'bold' }}>Edit Profile</Text>
                        <TextInput
                            label="Name"
                            value={name}
                            onChangeText={setName}
                            style={{ marginBottom: 12, backgroundColor: 'transparent' }}
                        />
                        <TextInput
                            label="Title"
                            value={title}
                            onChangeText={setTitle}
                            style={{ marginBottom: 24, backgroundColor: 'transparent' }}
                        />
                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
                            <Button onPress={() => setEditVisible(false)}>Cancel</Button>
                            <Button mode="contained" onPress={handleSaveProfile}>Save</Button>
                        </View>
                    </View>
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
    content: {
        padding: 16,
    },
    profileCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        backgroundColor: 'white',
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    profileInfo: {
        flex: 1,
    },
    footer: {
        marginTop: 40,
        marginBottom: 20,
    },
    modalContainer: {
        padding: 20, // To avoid touching edges
        justifyContent: 'center', // Center the modal
    }
});
