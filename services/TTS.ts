import * as Speech from 'expo-speech';

export const speak = (text: string) => {
    Speech.speak(text);
};

export const stopSpeaking = () => {
    Speech.stop();
};

export const isSpeaking = async () => {
    return await Speech.isSpeakingAsync();
};
