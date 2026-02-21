import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { extractText, isAvailable } from 'expo-pdf-text-extract';

export const pickAndParseDocument = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'text/plain'],
            copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            return null;
        }

        const file = result.assets[0];
        console.log("Picked document:", file.name, file.mimeType);

        let extractedText = '';

        if (file.mimeType === 'text/plain') {
            extractedText = await FileSystem.readAsStringAsync(file.uri);
        } else if (file.mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
            if (!isAvailable()) {
                console.warn('Native PDF module not available. Are you running in Expo Go?');
                throw new Error("PDF parsing requires a native development build. Please use npx expo run:android or run:ios.");
            }

            try {
                extractedText = await extractText(file.uri);
                if (!extractedText || extractedText.trim() === '') {
                    throw new Error("No text found in PDF.");
                }
            } catch (error) {
                console.error("Failed to parse PDF physically:", error);
                throw new Error("Failed to extract text from this PDF file. It might be an image-only PDF.");
            }
        }

        return {
            fileName: file.name,
            text: extractedText
        };

    } catch (e) {
        console.error("Document picking/parsing error:", e);
        throw e;
    }
};
