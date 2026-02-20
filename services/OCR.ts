import TextRecognition from 'react-native-text-recognition';

export const recognizeText = async (imageUri: string): Promise<string[]> => {
    try {
        console.log("Starting OCR on native device:", imageUri);

        // In the true native build, TextRecognition.recognize is a valid function
        // It returns an array of strings (blocks of text)
        const result = await TextRecognition.recognize(imageUri);

        // If it somehow returns null/undefined, return an empty array
        if (!result) return [];

        return result;
    } catch (e) {
        console.error("OCR Error (Native):", e);
        // If it throws, we rethrow or return the error so we can debug it
        throw e;
    }
};
