type Word = {
  word: string;
  difficulty: string;
  meaning: string;
  example: string;
  hint: string;
};

type CategoryWords = {
  [key: string]: readonly Word[];
};

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

type DifficultyDistribution = {
  beginner: number;
  intermediate: number;
  advanced: number;
};

const DIFFICULTY_DISTRIBUTIONS: {
  [key in DifficultyLevel]: DifficultyDistribution;
} = {
  beginner: { beginner: 7, intermediate: 3, advanced: 0 },
  intermediate: { beginner: 4, intermediate: 5, advanced: 1 },
  advanced: { beginner: 0, intermediate: 4, advanced: 6 },
};

/**
 * Selects words based on difficulty level distribution
 */
export function selectWordsByDifficulty(
  selectedCategories: string[],
  categoryWords: CategoryWords,
  difficultyLevel: DifficultyLevel,
  learnedWordsPool: string[] = [],
): Word[] {
  if (selectedCategories.length === 0) {
    return [];
  }

  const distribution = DIFFICULTY_DISTRIBUTIONS[difficultyLevel];
  const selectedWords: Word[] = [];

  // Collect all available words by difficulty from selected categories
  const wordsByDifficulty: {
    beginner: Word[];
    intermediate: Word[];
    advanced: Word[];
  } = {
    beginner: [],
    intermediate: [],
    advanced: [],
  };

  // Gather all unlearned words from selected categories
  selectedCategories.forEach((categoryId) => {
    const words = categoryWords[categoryId] || [];
    words.forEach((word) => {
      if (!learnedWordsPool.includes(word.word)) {
        const difficulty = word.difficulty as DifficultyLevel;
        if (wordsByDifficulty[difficulty]) {
          wordsByDifficulty[difficulty].push({ ...word });
        }
      }
    });
  });

  // Helper function to select random words from a pool
  const selectRandomFromPool = (pool: Word[], count: number): Word[] => {
    const shuffled = shuffleArray([...pool]);
    return shuffled.slice(0, count);
  };

  // Select words according to the distribution
  const difficulties: DifficultyLevel[] = [
    "beginner",
    "intermediate",
    "advanced",
  ];

  difficulties.forEach((difficulty) => {
    const needed = distribution[difficulty];
    if (needed > 0) {
      const available = wordsByDifficulty[difficulty];

      if (available.length < needed) {
        console.warn(
          `Not enough ${difficulty} words available. Needed: ${needed}, Available: ${available.length}`,
        );
        // Take what we can get
        selectedWords.push(...available);
      } else {
        // Select randomly from available words
        const selected = selectRandomFromPool(available, needed);
        selectedWords.push(...selected);
      }
    }
  });

  // If we couldn't get enough words, try to fill with any available words
  const totalNeeded =
    distribution.beginner + distribution.intermediate + distribution.advanced;
  if (selectedWords.length < totalNeeded) {
    const allAvailable = [
      ...wordsByDifficulty.beginner,
      ...wordsByDifficulty.intermediate,
      ...wordsByDifficulty.advanced,
    ].filter((word) => !selectedWords.some((sw) => sw.word === word.word));

    const additionalNeeded = totalNeeded - selectedWords.length;
    const additional = selectRandomFromPool(allAvailable, additionalNeeded);
    selectedWords.push(...additional);
  }

  // Shuffle final selection so difficulties are mixed
  return shuffleArray(selectedWords);
}

/**
 * Randomly selects words from the given categories,
 * ensuring at least one word from each selected category,
 * and excluding words that have already been learned
 * @deprecated Use selectWordsByDifficulty instead for difficulty-based selection
 */
export function selectRandomWords(
  selectedCategories: string[],
  categoryWords: CategoryWords,
  totalWords: number = 10,
  learnedWordsPool: string[] = [],
): Word[] {
  if (selectedCategories.length === 0) {
    return [];
  }

  if (selectedCategories.length > totalWords) {
    throw new Error(
      `Cannot select ${totalWords} words from ${selectedCategories.length} categories. Need at least one word per category.`,
    );
  }

  // Filter out categories that have no words
  const validCategories = selectedCategories.filter(
    (categoryId) =>
      categoryWords[categoryId] && categoryWords[categoryId].length > 0,
  );

  if (validCategories.length === 0) {
    return [];
  }

  const selectedWords: Word[] = [];
  const usedWordIndices = new Map<string, Set<number>>();

  // Initialize used indices tracker for each category
  validCategories.forEach((categoryId) => {
    usedWordIndices.set(categoryId, new Set());
  });

  // Helper function to check if a word has been learned
  const isWordLearned = (word: Word): boolean => {
    return learnedWordsPool.includes(word.word);
  };

  // Helper function to get an unlearned word from a category
  const getUnlearnedWord = (
    categoryId: string,
    usedIndices: Set<number>,
  ): { word: Word; index: number } | null => {
    const categoryWordList = categoryWords[categoryId];
    const availableIndices: number[] = [];

    // Find all indices of unlearned and unused words
    for (let i = 0; i < categoryWordList.length; i++) {
      if (!usedIndices.has(i) && !isWordLearned(categoryWordList[i])) {
        availableIndices.push(i);
      }
    }

    if (availableIndices.length === 0) {
      return null;
    }

    // Pick a random available index
    const randomIndex =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];
    return { word: { ...categoryWordList[randomIndex] }, index: randomIndex };
  };

  // Step 1: Select at least one word from each category
  for (const categoryId of validCategories) {
    const usedIndices = usedWordIndices.get(categoryId)!;
    const result = getUnlearnedWord(categoryId, usedIndices);

    if (result) {
      selectedWords.push(result.word);
      usedIndices.add(result.index);
    } else {
      // If we can't find an unlearned word from this category,
      // we'll skip the "at least one per category" requirement for this category
      console.warn(`No unlearned words available in category: ${categoryId}`);
    }
  }

  // If we couldn't get any words at all, return empty array
  if (selectedWords.length === 0) {
    console.warn("No unlearned words available in any selected categories");
    return [];
  }

  // Step 2: Fill remaining slots randomly from all categories
  const remainingSlots = totalWords - selectedWords.length;

  for (let i = 0; i < remainingSlots; i++) {
    // Try to find a category with available unlearned words
    let foundWord = false;

    // Shuffle categories to randomize selection
    const shuffledCategories = shuffleArray([...validCategories]);

    for (const categoryId of shuffledCategories) {
      const usedIndices = usedWordIndices.get(categoryId)!;
      const result = getUnlearnedWord(categoryId, usedIndices);

      if (result) {
        selectedWords.push(result.word);
        usedIndices.add(result.index);
        foundWord = true;
        break;
      }
    }

    // If no unlearned words are available in any category, stop
    if (!foundWord) {
      break;
    }
  }

  // Shuffle the selected words so they're not grouped by category
  return shuffleArray(selectedWords);
}

/**
 * Fisher-Yates shuffle algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get count of available unlearned words in categories
 */
export const getAvailableWordsCount = (
  selectedCategories: string[],
  categoryWords: CategoryWords,
  learnedWordsPool: string[] = [],
): number => {
  let count = 0;

  selectedCategories.forEach((categoryId) => {
    const words = categoryWords[categoryId] || [];
    const unlearnedWords = words.filter(
      (word) => !learnedWordsPool.includes(word.word),
    );
    count += unlearnedWords.length;
  });

  return count;
};

/**
 * Get count of available unlearned words by difficulty level
 */
export const getAvailableWordsCountByDifficulty = (
  selectedCategories: string[],
  categoryWords: CategoryWords,
  learnedWordsPool: string[] = [],
): {
  beginner: number;
  intermediate: number;
  advanced: number;
  total: number;
} => {
  const counts = {
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    total: 0,
  };

  selectedCategories.forEach((categoryId) => {
    const words = categoryWords[categoryId] || [];
    words.forEach((word) => {
      if (!learnedWordsPool.includes(word.word)) {
        const difficulty = word.difficulty as DifficultyLevel;
        if (counts[difficulty] !== undefined) {
          counts[difficulty]++;
          counts.total++;
        }
      }
    });
  });

  return counts;
};
