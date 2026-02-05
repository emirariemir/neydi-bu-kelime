import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Word } from "../components/DailyWordCard";

const DAILY_WORDS_KEY = "@daily_words";
const SELECTED_CATEGORIES_KEY = "@selected_categories";
const WORDS_DATE_KEY = "@words_date";

export type StoredWordsData = {
  words: Word[];
  categories: string[];
  date: string;
  learnedWords: string[]; // Array of word strings that have been marked as learned
};

/**
 * Check if stored words are from today
 */
const isToday = (dateString: string): boolean => {
  const storedDate = new Date(dateString);
  const today = new Date();

  return (
    storedDate.getDate() === today.getDate() &&
    storedDate.getMonth() === today.getMonth() &&
    storedDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Get today's date as a string
 */
const getTodayString = (): string => {
  return new Date().toISOString();
};

/**
 * Save daily words to storage
 */
export const saveDailyWords = async (
  words: Word[],
  categories: string[],
  learnedWords: string[] = [],
): Promise<void> => {
  try {
    const data: StoredWordsData = {
      words,
      categories,
      date: getTodayString(),
      learnedWords,
    };

    await AsyncStorage.setItem(DAILY_WORDS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving daily words:", error);
    throw error;
  }
};

/**
 * Get daily words from storage
 * Returns null if no words stored or if stored words are from a previous day
 */
export const getDailyWords = async (): Promise<StoredWordsData | null> => {
  try {
    const storedData = await AsyncStorage.getItem(DAILY_WORDS_KEY);

    if (!storedData) {
      return null;
    }

    const data: StoredWordsData = JSON.parse(storedData);

    // Check if the stored words are from today
    if (!isToday(data.date)) {
      // Clear old data
      await clearDailyWords();
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting daily words:", error);
    return null;
  }
};

/**
 * Clear daily words from storage
 */
export const clearDailyWords = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(DAILY_WORDS_KEY);
  } catch (error) {
    console.error("Error clearing daily words:", error);
    throw error;
  }
};

/**
 * Check if there are words stored for today
 */
export const hasTodaysWords = async (): Promise<boolean> => {
  const data = await getDailyWords();
  return data !== null && data.words.length > 0;
};

/**
 * Toggle the learned state of a word
 */
export const toggleWordLearned = async (word: string): Promise<string[]> => {
  try {
    const storedData = await getDailyWords();

    if (!storedData) {
      throw new Error("No words data found");
    }

    const learnedWords = storedData.learnedWords || [];
    let updatedLearnedWords: string[];

    if (learnedWords.includes(word)) {
      // Remove from learned
      updatedLearnedWords = learnedWords.filter((w) => w !== word);
    } else {
      // Add to learned
      updatedLearnedWords = [...learnedWords, word];
    }

    // Save updated data
    await saveDailyWords(
      storedData.words,
      storedData.categories,
      updatedLearnedWords,
    );

    return updatedLearnedWords;
  } catch (error) {
    console.error("Error toggling word learned state:", error);
    throw error;
  }
};
