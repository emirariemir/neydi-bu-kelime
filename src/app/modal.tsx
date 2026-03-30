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
import { duoCardShadow, duoTheme } from "../theme/duoTheme";
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
        <ActivityIndicator size="large" color={duoTheme.colors.green} />
      </View>
    );
  }

  // Show warning if user already has words for today
  if (hasExistingWords) {
    return (
      <View style={styles.container}>
        <View style={styles.warningContainer}>
          <View style={styles.warningCard}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningTitle}>
              You Already Have Today&apos;s Words
            </Text>
            <Text style={styles.warningMessage}>
              You still have words to learn from your current selection. Please
              complete those first before choosing new categories.
            </Text>
            <Text style={styles.warningSubtext}>
              If you want to reset and get new words, you can clear your
              current progress.
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
    backgroundColor: duoTheme.colors.background,
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: duoTheme.colors.background,
  },
  warningContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  warningCard: {
    width: "100%",
    backgroundColor: duoTheme.colors.surface,
    borderRadius: duoTheme.radii.xl,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: duoTheme.colors.cardBorder,
    padding: 24,
    alignItems: "center",
    ...duoCardShadow,
  },
  warningIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  warningMessage: {
    fontSize: 16,
    color: duoTheme.colors.textPrimary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: "600",
  },
  warningSubtext: {
    fontSize: 14,
    color: duoTheme.colors.textSecondary,
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
    backgroundColor: duoTheme.colors.surface,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: duoTheme.colors.cardBorder,
    borderRadius: duoTheme.radii.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  warningButtonSecondaryText: {
    fontSize: 15,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  warningButtonDanger: {
    flex: 1,
    backgroundColor: duoTheme.colors.red,
    borderRadius: duoTheme.radii.md,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: "#D83A3A",
  },
  warningButtonDangerText: {
    fontSize: 15,
    fontWeight: "800",
    color: duoTheme.colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerSection: {
    marginBottom: 20,
    backgroundColor: duoTheme.colors.surface,
    borderRadius: duoTheme.radii.xl,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: duoTheme.colors.cardBorder,
    padding: 22,
    ...duoCardShadow,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: duoTheme.colors.textSecondary,
    fontWeight: "700",
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
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
    marginBottom: 6,
  },
  sectionDescription: {
    fontSize: 13,
    color: duoTheme.colors.textSecondary,
    marginBottom: 12,
    fontWeight: "700",
  },
  difficultyContainer: {
    gap: 10,
  },
  difficultyCard: {
    backgroundColor: duoTheme.colors.surface,
    borderRadius: duoTheme.radii.lg,
    padding: 18,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: duoTheme.colors.cardBorder,
    ...duoCardShadow,
  },
  difficultyCardSelected: {
    borderColor: duoTheme.colors.green,
    backgroundColor: duoTheme.colors.greenSoft,
  },
  difficultyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  difficultyLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
  },
  difficultyLabelSelected: {
    color: duoTheme.colors.greenDark,
  },
  checkmark: {
    fontSize: 18,
    color: duoTheme.colors.greenDark,
    fontWeight: "800",
  },
  difficultyDescription: {
    fontSize: 13,
    color: duoTheme.colors.textSecondary,
    marginBottom: 8,
    fontWeight: "600",
  },
  difficultyDescriptionSelected: {
    color: duoTheme.colors.greenDark,
  },
  distributionContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  distributionText: {
    fontSize: 11,
    fontWeight: "800",
    color: duoTheme.colors.textSecondary,
    backgroundColor: duoTheme.colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  distributionTextSelected: {
    backgroundColor: duoTheme.colors.surface,
    color: duoTheme.colors.greenDark,
  },
  statsContainer: {
    backgroundColor: duoTheme.colors.blueSoft,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: duoTheme.radii.lg,
    gap: 6,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#BFE8FA",
  },
  statsText: {
    fontSize: 13,
    fontWeight: "800",
    color: duoTheme.colors.blueDark,
  },
  availableWordsBreakdown: {
    gap: 2,
  },
  availableWordsText: {
    fontSize: 12,
    color: duoTheme.colors.blueDark,
    fontWeight: "700",
  },
  availableWordsDetail: {
    fontSize: 11,
    color: duoTheme.colors.blueDark,
    fontWeight: "800",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryPill: {
    backgroundColor: duoTheme.colors.surface,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: duoTheme.colors.cardBorder,
  },
  categoryPillSelected: {
    backgroundColor: duoTheme.colors.green,
    borderColor: duoTheme.colors.greenDark,
  },
  categoryPillDisabled: {
    opacity: 0.4,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  categoryTitleSelected: {
    color: duoTheme.colors.white,
  },
  categoryTitleDisabled: {
    color: duoTheme.colors.textMuted,
  },
  confirmButton: {
    backgroundColor: duoTheme.colors.green,
    borderRadius: duoTheme.radii.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: duoTheme.colors.greenDark,
  },
  confirmButtonDisabled: {
    backgroundColor: duoTheme.colors.disabled,
    borderColor: duoTheme.colors.disabledDark,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: duoTheme.colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
