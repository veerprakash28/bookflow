import React, { createContext, useState, useContext, ReactNode, useEffect, useRef } from 'react';
import * as Speech from 'expo-speech';

interface AudioContextType {
    isPlaying: boolean;
    isPaused: boolean;
    currentTitle: string | null;
    currentBookTitle: string | null;
    currentSentences: string[];
    currentSentenceIdx: number;
    currentBookId: string | null;
    currentUrl: string | null;
    play: (sentences: string[], startIndex: number, title: string, bookId: string, url?: string, bookTitle?: string) => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    next: () => void;
    prev: () => void;
    setSentenceIdx: (idx: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider = ({ children }: { children: ReactNode }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentTitle, setCurrentTitle] = useState<string | null>(null);
    const [currentBookTitle, setCurrentBookTitle] = useState<string | null>(null);
    const [currentSentences, setCurrentSentences] = useState<string[]>([]);
    const [currentSentenceIdx, setCurrentSentenceIdx] = useState(0);
    const [currentBookId, setCurrentBookId] = useState<string | null>(null);
    const [currentUrl, setCurrentUrl] = useState<string | null>(null);

    // We need a ref to keep track of the latest index and play state for the onDone callback
    const stateRef = useRef({
        idx: 0,
        sentences: [] as string[],
        isPlaying: false,
    });

    const speakIndex = (idx: number, sentences: string[]) => {
        if (!sentences.length || idx >= sentences.length || !stateRef.current.isPlaying) {
            setIsPlaying(false);
            setIsPaused(false);
            stateRef.current.isPlaying = false;
            return;
        }

        setCurrentSentenceIdx(idx);
        stateRef.current.idx = idx;

        Speech.speak(sentences[idx], {
            rate: 0.9,
            onDone: () => {
                if (stateRef.current.isPlaying) {
                    speakIndex(stateRef.current.idx + 1, stateRef.current.sentences);
                }
            },
            onStopped: () => {
                // Stopped manually via stop()
            },
            onError: (error) => {
                console.error("Speech error", error);
                setIsPlaying(false);
                setIsPaused(false);
                stateRef.current.isPlaying = false;
            },
        });
    };

    const play = (sentences: string[], startIndex: number, title: string, bookId: string, url?: string, bookTitle?: string) => {
        Speech.stop();
        setCurrentSentences(sentences);
        setCurrentTitle(title);
        setCurrentBookTitle(bookTitle || null);
        setCurrentBookId(bookId);
        setCurrentUrl(url || null);
        setCurrentSentenceIdx(startIndex);

        setIsPlaying(true);
        setIsPaused(false);

        stateRef.current = {
            idx: startIndex,
            sentences: sentences,
            isPlaying: true,
        };

        speakIndex(startIndex, sentences);
    };

    const pause = async () => {
        setIsPaused(true);
        setIsPlaying(false);
        stateRef.current.isPlaying = false;
        await Speech.stop(); // Android pause/resume is unreliable, so we stop and restart from idx
    };

    const resume = async () => {
        setIsPaused(false);
        setIsPlaying(true);
        stateRef.current.isPlaying = true;
        speakIndex(stateRef.current.idx, stateRef.current.sentences);
    };

    const stop = () => {
        Speech.stop();
        setIsPlaying(false);
        setIsPaused(false);
        setCurrentTitle(null);
        setCurrentBookTitle(null);
        setCurrentSentences([]);
        setCurrentSentenceIdx(0);
        setCurrentBookId(null);
        setCurrentUrl(null);
        stateRef.current.isPlaying = false;
    };

    const setSentenceIdx = (idx: number) => {
        if (!currentSentences.length) return;
        Speech.stop();
        setCurrentSentenceIdx(idx);
        stateRef.current.idx = idx;
        if (stateRef.current.isPlaying) {
            speakIndex(idx, currentSentences);
        }
    };

    const next = () => {
        if (!currentSentences.length) return;
        const newIdx = Math.min(currentSentences.length - 1, stateRef.current.idx + 1);
        setSentenceIdx(newIdx);
    };

    const prev = () => {
        if (!currentSentences.length) return;
        const newIdx = Math.max(0, stateRef.current.idx - 1);
        setSentenceIdx(newIdx);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            Speech.stop();
            stateRef.current.isPlaying = false;
        };
    }, []);

    return (
        <AudioContext.Provider value={{
            isPlaying,
            isPaused,
            currentTitle,
            currentBookTitle,
            currentSentences,
            currentSentenceIdx,
            currentBookId,
            currentUrl,
            play,
            pause,
            resume,
            stop,
            next,
            prev,
            setSentenceIdx
        }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};
