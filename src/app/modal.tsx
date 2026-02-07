import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CATEGORY_WORDS } from "../constants/category-words";
import { CATEGORIES } from "../constants/word-categories";
import {
  clearDailyWords,
  getDailyWords,
  getLearnedWordsPool,
} from "../utils/storageUtils";
import {
  getAvailableWordsCountByDifficulty,
  selectWordsByDifficulty,
  type DifficultyLevel,
} from "../utils/wordSelectionUtils";

const DIFFICULTY_CONFIGS: {
  [key in DifficultyLevel]: {
    label: string;
    description: string;
    distribution: { beginner: number; intermediate: number; advanced: number };
  };
} = {
  beginner: {
    label: "Beginner",
    description: "Mostly easy words to build confidence",
    distribution: { beginner: 7, intermediate: 3, advanced: 0 },
  },
  intermediate: {
    label: "Intermediate",
    description: "Balanced mix with a challenge",
    distribution: { beginner: 4, intermediate: 5, advanced: 1 },
  },
  advanced: {
    label: "Advanced",
    description: "Harder words for serious learners",
    distribution: { beginner: 0, intermediate: 4, advanced: 6 },
  },
};

export default function CategorySelectionModal() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyLevel>("beginner");
  const [hasExistingWords, setHasExistingWords] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [learnedWordsPool, setLearnedWordsPool] = useState<string[]>([]);
  const [availableWordsCount, setAvailableWordsCount] = useState({
    beginner: 0,
    intermediate: 0,
    advanced: 0,
    total: 0,
  });

  useEffect(() => {
    checkExistingWords();
    loadLearnedWordsPool();
  }, []);

  useEffect(() => {
    // Update available words count when categories change
    if (selectedCategories.length > 0) {
      const counts = getAvailableWordsCountByDifficulty(
        selectedCategories,
        CATEGORY_WORDS,
        learnedWordsPool,
      );
      setAvailableWordsCount(counts);
    } else {
      setAvailableWordsCount({
        beginner: 0,
        intermediate: 0,
        advanced: 0,
        total: 0,
      });
    }
  }, [selectedCategories, learnedWordsPool]);

  const checkExistingWords = async () => {
    try {
      const storedData = await getDailyWords();
      setHasExistingWords(storedData !== null && storedData.words.length > 0);
    } catch (error) {
      console.error("Error checking existing words:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLearnedWordsPool = async () => {
    try {
      const pool = await getLearnedWordsPool();
      setLearnedWordsPool(pool);
    } catch (error) {
      console.error("Error loading learned words pool:", error);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        if (prev.length < 5) {
          return [...prev, categoryId];
        }
        return prev;
      }
    });
  };

  const canProceedWithSelection = () => {
    if (selectedCategories.length === 0) return false;

    const distribution = DIFFICULTY_CONFIGS[selectedDifficulty].distribution;

    // Check if we have enough words for each difficulty level
    const hasEnoughBeginner =
      distribution.beginner === 0 ||
      availableWordsCount.beginner >= distribution.beginner;
    const hasEnoughIntermediate =
      distribution.intermediate === 0 ||
      availableWordsCount.intermediate >= distribution.intermediate;
    const hasEnoughAdvanced =
      distribution.advanced === 0 ||
      availableWordsCount.advanced >= distribution.advanced;

    return hasEnoughBeginner && hasEnoughIntermediate && hasEnoughAdvanced;
  };

  const getInsufficientWordsMessage = () => {
    const distribution = DIFFICULTY_CONFIGS[selectedDifficulty].distribution;
    const insufficient: string[] = [];

    if (
      distribution.beginner > 0 &&
      availableWordsCount.beginner < distribution.beginner
    ) {
      insufficient.push(
        `${distribution.beginner - availableWordsCount.beginner} more beginner`,
      );
    }
    if (
      distribution.intermediate > 0 &&
      availableWordsCount.intermediate < distribution.intermediate
    ) {
      insufficient.push(
        `${distribution.intermediate - availableWordsCount.intermediate} more intermediate`,
      );
    }
    if (
      distribution.advanced > 0 &&
      availableWordsCount.advanced < distribution.advanced
    ) {
      insufficient.push(
        `${distribution.advanced - availableWordsCount.advanced} more advanced`,
      );
    }

    return `Need ${insufficient.join(", ")} word${insufficient.length > 1 ? "s" : ""}`;
  };

  const handleConfirmSelection = () => {
    if (!canProceedWithSelection()) {
      return;
    }

    // Select words based on difficulty distribution
    const randomWords = selectWordsByDifficulty(
      selectedCategories,
      CATEGORY_WORDS,
      selectedDifficulty,
      learnedWordsPool,
    );

    if (randomWords.length === 0) {
      alert(
        "No new words available in selected categories. You've already learned all words from these categories! Try selecting different categories.",
      );
      return;
    }

    // Navigate back to index with the selected words
    router.dismissTo({
      pathname: "/",
      params: {
        selectedWords: JSON.stringify(randomWords),
        selectedCategories: JSON.stringify(selectedCategories),
        selectedDifficulty: selectedDifficulty,
      },
    });
  };

  const handleClearAndContinue = async () => {
    try {
      await clearDailyWords();
      setHasExistingWords(false);
    } catch (error) {
      console.error("Error clearing words:", error);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const isSelected = (categoryId: string) =>
    selectedCategories.includes(categoryId);
  const canSelectMore = selectedCategories.length < 5;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  // Show warning if user already has words for today
  if (hasExistingWords) {
    return (
      <View style={styles.container}>
        <View style={styles.warningContainer}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <Text style={styles.warningTitle}>
            You Already Have Today's Words
          </Text>
          <Text style={styles.warningMessage}>
            You still have words to learn from your current selection. Please
            complete those first before choosing new categories.
          </Text>
          <Text style={styles.warningSubtext}>
            If you want to reset and get new words, you can clear your current
            progress.
          </Text>

          <View style={styles.warningButtons}>
            <TouchableOpacity
              style={styles.warningButtonSecondary}
              onPress={handleGoBack}
            >
              <Text style={styles.warningButtonSecondaryText}>Go Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.warningButtonDanger}
              onPress={handleClearAndContinue}
            >
              <Text style={styles.warningButtonDangerText}>
                Clear & Choose New
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const canProceed = canProceedWithSelection();

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Choose Your Learning Path</Text>
        <Text style={styles.subtitle}>
          Select categories and difficulty level
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Difficulty Level Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Difficulty Level</Text>
          <Text style={styles.sectionDescription}>
            Choose how challenging you want your words to be
          </Text>
          <View style={styles.difficultyContainer}>
            {(Object.keys(DIFFICULTY_CONFIGS) as DifficultyLevel[]).map(
              (level) => {
                const config = DIFFICULTY_CONFIGS[level];
                const isSelectedDifficulty = selectedDifficulty === level;

                return (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyCard,
                      isSelectedDifficulty && styles.difficultyCardSelected,
                    ]}
                    onPress={() => setSelectedDifficulty(level)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.difficultyHeader}>
                      <Text
                        style={[
                          styles.difficultyLabel,
                          isSelectedDifficulty &&
                            styles.difficultyLabelSelected,
                        ]}
                      >
                        {config.label}
                      </Text>
                      {isSelectedDifficulty && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.difficultyDescription,
                        isSelectedDifficulty &&
                          styles.difficultyDescriptionSelected,
                      ]}
                    >
                      {config.description}
                    </Text>
                    <View style={styles.distributionContainer}>
                      {config.distribution.beginner > 0 && (
                        <Text
                          style={[
                            styles.distributionText,
                            isSelectedDifficulty &&
                              styles.distributionTextSelected,
                          ]}
                        >
                          {config.distribution.beginner} Beginner
                        </Text>
                      )}
                      {config.distribution.intermediate > 0 && (
                        <Text
                          style={[
                            styles.distributionText,
                            isSelectedDifficulty &&
                              styles.distributionTextSelected,
                          ]}
                        >
                          {config.distribution.intermediate} Intermediate
                        </Text>
                      )}
                      {config.distribution.advanced > 0 && (
                        <Text
                          style={[
                            styles.distributionText,
                            isSelectedDifficulty &&
                              styles.distributionTextSelected,
                          ]}
                        >
                          {config.distribution.advanced} Advanced
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              },
            )}
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Text style={styles.sectionDescription}>
            Select up to 5 categories ({selectedCategories.length}/5 selected)
          </Text>

          {learnedWordsPool.length > 0 && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                📚 {learnedWordsPool.length} words mastered
              </Text>
              {availableWordsCount.total > 0 &&
                selectedCategories.length > 0 && (
                  <View style={styles.availableWordsBreakdown}>
                    <Text style={styles.availableWordsText}>
                      ✨ Available words in selection:
                    </Text>
                    <Text style={styles.availableWordsDetail}>
                      {availableWordsCount.beginner} Beginner •{" "}
                      {availableWordsCount.intermediate} Intermediate •{" "}
                      {availableWordsCount.advanced} Advanced
                    </Text>
                  </View>
                )}
            </View>
          )}

          <View style={styles.categoriesContainer}>
            {CATEGORIES.map((category) => {
              const selected = isSelected(category.id);
              const disabled = !selected && !canSelectMore;

              return (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryPill,
                    selected && styles.categoryPillSelected,
                    disabled && styles.categoryPillDisabled,
                  ]}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.categoryTitle,
                      selected && styles.categoryTitleSelected,
                      disabled && styles.categoryTitleDisabled,
                    ]}
                  >
                    {category.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          !canProceed && styles.confirmButtonDisabled,
        ]}
        disabled={!canProceed}
        onPress={handleConfirmSelection}
      >
        <Text style={styles.confirmButtonText}>
          {selectedCategories.length === 0
            ? "Select at least 1 category"
            : !canProceed
              ? getInsufficientWordsMessage()
              : "Confirm Selection"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F4EF",
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F4EF",
  },
  warningContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  warningIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 12,
  },
  warningMessage: {
    fontSize: 16,
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  warningSubtext: {
    fontSize: 14,
    color: "#6A6A6A",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  warningButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  warningButtonSecondary: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#D1D1D1",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  warningButtonSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4A4A4A",
  },
  warningButtonDanger: {
    flex: 1,
    backgroundColor: "#D32F2F",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  warningButtonDangerText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  headerSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#4A4A4A",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    color: "#4A4A4A",
    marginBottom: 12,
  },
  difficultyContainer: {
    gap: 10,
  },
  difficultyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#E8E8E8",
  },
  difficultyCardSelected: {
    borderColor: "#2E7D32",
    backgroundColor: "#F1F8F4",
  },
  difficultyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  difficultyLabelSelected: {
    color: "#2E7D32",
  },
  checkmark: {
    fontSize: 18,
    color: "#2E7D32",
    fontWeight: "700",
  },
  difficultyDescription: {
    fontSize: 13,
    color: "#4A4A4A",
    marginBottom: 8,
  },
  difficultyDescriptionSelected: {
    color: "#2E7D32",
  },
  distributionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  distributionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6A6A6A",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  distributionTextSelected: {
    backgroundColor: "#E8F5E9",
    color: "#2E7D32",
  },
  statsContainer: {
    backgroundColor: "#E8F5E9",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    marginBottom: 12,
  },
  statsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E7D32",
    textAlign: "center",
  },
  availableWordsBreakdown: {
    gap: 2,
  },
  availableWordsText: {
    fontSize: 12,
    color: "#388E3C",
    textAlign: "center",
  },
  availableWordsDetail: {
    fontSize: 11,
    color: "#388E3C",
    textAlign: "center",
    fontWeight: "600",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryPill: {
    backgroundColor: "#E8E8E8",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  categoryPillSelected: {
    backgroundColor: "#2E7D32",
  },
  categoryPillDisabled: {
    opacity: 0.4,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  categoryTitleSelected: {
    color: "#FFFFFF",
  },
  categoryTitleDisabled: {
    color: "#9E9E9E",
  },
  confirmButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
  },
  confirmButtonDisabled: {
    backgroundColor: "#BDBDBD",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
