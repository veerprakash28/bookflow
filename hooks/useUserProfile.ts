import { useSQLiteContext } from 'expo-sqlite';
import { useState, useCallback, useEffect } from 'react';

export interface UserProfile {
    name: string;
    title: string;
}

export function useUserProfile() {
    const db = useSQLiteContext();
    const [profile, setProfile] = useState<UserProfile>({ name: 'Guest User', title: 'Reading Enthusiast' });

    const refreshProfile = useCallback(async () => {
        try {
            const result = await db.getFirstAsync<{ name: string; title: string }>(
                'SELECT name, title FROM user_settings WHERE id = ?',
                ['user_main']
            );
            if (result) {
                setProfile(result);
            }
        } catch (error) {
            console.error("Error fetching user profile:", error);
        }
    }, [db]);

    const updateProfile = async (name: string, title: string) => {
        try {
            await db.runAsync(
                'UPDATE user_settings SET name = ?, title = ? WHERE id = ?',
                [name, title, 'user_main']
            );
            await refreshProfile();
        } catch (error) {
            console.error("Error updating user profile:", error);
        }
    };

    useEffect(() => {
        refreshProfile();
    }, [refreshProfile]);

    return { profile, updateProfile, refreshProfile };
}
