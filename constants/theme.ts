import { MD3LightTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        primary: '#0E5DAC', // Custom blue - matches icon
        onPrimary: '#FFFFFF',
        primaryContainer: '#E3F2FD',
        onPrimaryContainer: '#0D47A1',
        secondary: '#AD1457', // Pink 800 - Elegant Rose/Berry (No yellow/cyan)
        onSecondary: '#FFFFFF',
        secondaryContainer: '#FCE4EC',
        onSecondaryContainer: '#880E4F',
        tertiary: '#00695C', // Teal 800 - Deep Emerald for accents
        background: '#FAFAFA', // High brightness gray
        surface: '#FFFFFF',
        error: '#B00020',
        outline: '#757575',
    },
};
