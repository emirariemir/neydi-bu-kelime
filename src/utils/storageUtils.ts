import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Word } from "../components/DailyWordCard";

const DAILY_WORDS_KEY = "@daily_words";
const SELECTED_CATEGORIES_KEY = "@selected_categories";
const WORDS_DATE_KEY = "@words_date";
const LEARNED_WORDS_POOL_KEY = "@learned_words_pool";

export type StoredWordsData = {
  words: Word[];
  categories: string[];
  date: string;
  learnedWords: string[]; // Array of word strings that have been marked as learned
};

export type LearnedWordsPool = {
  words: string[]; // Array of all words the user has ever learned
  lastUpdated: string;
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

/**
 * Get the learned words pool from storage
 */
export const getLearnedWordsPool = async (): Promise<string[]> => {
  try {
    const storedData = await AsyncStorage.getItem(LEARNED_WORDS_POOL_KEY);

    if (!storedData) {
      return [];
    }

    const data: LearnedWordsPool = JSON.parse(storedData);
    return data.words;
  } catch (error) {
    console.error("Error getting learned words pool:", error);
    return [];
  }
};

/**
 * Add words to the learned words pool
 */
export const addToLearnedWordsPool = async (
  newWords: string[],
): Promise<void> => {
  try {
    const currentPool = await getLearnedWordsPool();

    // Add only new words that aren't already in the pool
    const uniqueNewWords = newWords.filter(
      (word) => !currentPool.includes(word),
    );
    const updatedPool = [...currentPool, ...uniqueNewWords];

    const data: LearnedWordsPool = {
      words: updatedPool,
      lastUpdated: getTodayString(),
    };

    await AsyncStorage.setItem(LEARNED_WORDS_POOL_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error adding to learned words pool:", error);
    throw error;
  }
};

/**
 * Check if all today's words have been learned
 */
export const areAllWordsMastered = async (): Promise<boolean> => {
  try {
    const storedData = await getDailyWords();

    if (!storedData) {
      return false;
    }

    const totalWords = storedData.words.length;
    const learnedCount = storedData.learnedWords?.length || 0;

    return totalWords > 0 && learnedCount === totalWords;
  } catch (error) {
    console.error("Error checking if all words are mastered:", error);
    return false;
  }
};

/**
 * Complete today's learning session by moving learned words to the pool
 * and clearing daily words
 */
export const completeTodaysSession = async (): Promise<void> => {
  try {
    const storedData = await getDailyWords();

    if (!storedData) {
      return;
    }

    // Add all words from today to the learned pool
    const todaysWords = storedData.words.map((word) => word.word);
    await addToLearnedWordsPool(todaysWords);

    // Clear today's words
    await clearDailyWords();
  } catch (error) {
    console.error("Error completing today's session:", error);
    throw error;
  }
};

/**
 * Get statistics about the user's learning progress
 */
export const getLearningStats = async (): Promise<{
  totalLearnedWords: number;
  todayLearnedCount: number;
  todayTotalCount: number;
}> => {
  try {
    const learnedPool = await getLearnedWordsPool();
    const todaysData = await getDailyWords();

    return {
      totalLearnedWords: learnedPool.length,
      todayLearnedCount: todaysData?.learnedWords?.length || 0,
      todayTotalCount: todaysData?.words?.length || 0,
    };
  } catch (error) {
    console.error("Error getting learning stats:", error);
    return {
      totalLearnedWords: 0,
      todayLearnedCount: 0,
      todayTotalCount: 0,
    };
  }
};
