import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Snackbar, useTheme } from 'react-native-paper';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const theme = useTheme();
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('info');

    const showToast = (msg: string, toastType: ToastType = 'info') => {
        setMessage(msg);
        setType(toastType);
        setVisible(true);
    };

    const getBgColor = () => {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'error': return theme.colors.error;
            case 'info':
            default: return theme.colors.onSurface;
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <Snackbar
                visible={visible}
                onDismiss={() => setVisible(false)}
                duration={3000}
                style={{ backgroundColor: getBgColor() }}
            >
                {message}
            </Snackbar>
        </ToastContext.Provider>
    );
};
