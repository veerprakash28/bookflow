import TextRecognition from 'react-native-text-recognition';

export const recognizeText = async (imageUri: string): Promise<string[]> => {
    try {
        // Aggressive check for native module availability
        if (!TextRecognition || typeof TextRecognition.recognize !== 'function') {
            console.warn("OCR: Native module not found or invalid. Using mock text. (Requires Development Build)");
            return ["This is a sample text.", "OCR requires a native development build.", "But you can still test the TTS and tracking!"];
        }

        const result = await TextRecognition.recognize(imageUri);
        return result;
    } catch (e) {
        console.error("OCR Error:", e);
        // Fallback for Expo Go users (since the library throws when native module is missing)
        return [
            "This is a sample page from BookFlow.",
            "Since you are using Expo Go, we cannot use the camera for real OCR.",
            "However, you can use this sample text to test the Read Aloud feature and earn points!",
            "Keep reading to unlock new badges."
        ];
    }
};
