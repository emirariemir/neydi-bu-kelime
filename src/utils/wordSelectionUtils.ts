type Word = {
  word: string;
  meaning: string;
  example: string;
  hint: string;
};

type CategoryWords = {
  [key: string]: readonly Word[];
};

/**
 * Randomly selects 10 words from the given categories,
 * ensuring at least one word from each selected category
 */
export function selectRandomWords(
  selectedCategories: string[],
  categoryWords: CategoryWords,
  totalWords: number = 10,
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

  // Step 1: Select at least one word from each category
  validCategories.forEach((categoryId) => {
    const categoryWordList = categoryWords[categoryId];
    const randomIndex = Math.floor(Math.random() * categoryWordList.length);

    selectedWords.push({ ...categoryWordList[randomIndex] });
    usedWordIndices.get(categoryId)!.add(randomIndex);
  });

  // Step 2: Fill remaining slots randomly from all categories
  const remainingSlots = totalWords - validCategories.length;

  for (let i = 0; i < remainingSlots; i++) {
    // Randomly pick a category
    const randomCategoryIndex = Math.floor(
      Math.random() * validCategories.length,
    );
    const categoryId = validCategories[randomCategoryIndex];
    const categoryWordList = categoryWords[categoryId];
    const usedIndices = usedWordIndices.get(categoryId)!;

    // If all words from this category are used, try another category
    if (usedIndices.size >= categoryWordList.length) {
      // Find a category that still has unused words
      const availableCategory = validCategories.find((catId) => {
        const used = usedWordIndices.get(catId)!;
        return used.size < categoryWords[catId].length;
      });

      if (!availableCategory) {
        // All categories exhausted, stop
        break;
      }

      const availableCategoryWordList = categoryWords[availableCategory];
      const availableUsedIndices = usedWordIndices.get(availableCategory)!;

      // Get a random unused word from this category
      let randomIndex;
      do {
        randomIndex = Math.floor(
          Math.random() * availableCategoryWordList.length,
        );
      } while (availableUsedIndices.has(randomIndex));

      selectedWords.push({ ...availableCategoryWordList[randomIndex] });
      availableUsedIndices.add(randomIndex);
    } else {
      // Get a random unused word from the selected category
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * categoryWordList.length);
      } while (usedIndices.has(randomIndex));

      selectedWords.push({ ...categoryWordList[randomIndex] });
      usedIndices.add(randomIndex);
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
