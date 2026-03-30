import BottomSheet from "@gorhom/bottom-sheet";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WordCard, type Word } from "../../components/DailyWordCard";
import WordChallengeSheet from "../../components/WordChallengeSheet";
import {
  areAllWordsMastered,
  completeTodaysSession,
  getDailyWords,
  getLearningStats,
  saveDailyWords,
  toggleWordLearned,
} from "../../utils/storageUtils";

type WordFilter = "all" | "learning" | "learned";

export default function Index() {
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [dailyWords, setDailyWords] = useState<Word[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<WordFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [totalLearnedWords, setTotalLearnedWords] = useState(0);
  const [challengeWord, setChallengeWord] = useState<string | null>(null);
  const bottomSheetRef = useRef<BottomSheet | null>(null);

  const containerStyle = [
    styles.container,
    { paddingTop: 16 + insets.top, paddingBottom: 0 },
  ];
  const loadingStyle = [
    styles.loadingContainer,
    { paddingTop: insets.top, paddingBottom: insets.bottom },
  ];

  // Load words from storage on mount
  useEffect(() => {
    loadWordsFromStorage();
  }, []);

  // Handle new words from modal
  useEffect(() => {
    if (params.selectedWords && typeof params.selectedWords === "string") {
      try {
        const words = JSON.parse(params.selectedWords);
        const categories =
          params.selectedCategories &&
          typeof params.selectedCategories === "string"
            ? JSON.parse(params.selectedCategories)
            : [];

        // Save to storage and update state
        saveDailyWords(words, categories, []).then(() => {
          setDailyWords(words);
          setSelectedCategories(categories);
          setLearnedWords([]);
          setActiveFilter("all");
          setShowCongratulations(false);
        });
      } catch (error) {
        console.error("Error parsing selected words:", error);
      }
    }
  }, [params.selectedWords, params.selectedCategories]);

  useEffect(() => {
    const syncMasteryState = async () => {
      const allMastered = await areAllWordsMastered();

      if (!allMastered || showCongratulations) {
        return;
      }

      if (challengeWord) {
        return;
      }

      await completeTodaysSession();

      const stats = await getLearningStats();
      setTotalLearnedWords(stats.totalLearnedWords);
      setShowCongratulations(true);
    };

    syncMasteryState();
  }, [challengeWord, learnedWords, showCongratulations]);

  const loadWordsFromStorage = async () => {
    setIsLoading(true);
    try {
      const storedData = await getDailyWords();

      if (storedData) {
        setDailyWords(storedData.words);
        setSelectedCategories(storedData.categories);
        setLearnedWords(storedData.learnedWords || []);

        // Check if already completed
        const allMastered = await areAllWordsMastered();
        setShowCongratulations(allMastered);
      }

      // Load stats
      const stats = await getLearningStats();
      setTotalLearnedWords(stats.totalLearnedWords);
    } catch (error) {
      console.error("Error loading words from storage:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLearned = async (word: string) => {
    const isCurrentlyLearned = learnedWords.includes(word);

    if (isCurrentlyLearned) {
      try {
        const updatedLearnedWords = await toggleWordLearned(word);
        setLearnedWords(updatedLearnedWords);
      } catch (error) {
        console.error("Error toggling learned state:", error);
      }
      return;
    }

    setChallengeWord(word);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    bottomSheetRef.current?.expand();
  };

  const handleChallengeCorrect = async (word: string) => {
    try {
      const updatedLearnedWords = await toggleWordLearned(word);
      setLearnedWords(updatedLearnedWords);
    } catch (error) {
      console.error("Error toggling learned state:", error);
    } finally {
      bottomSheetRef.current?.close();
    }
  };

  const handleChallengeClose = () => {
    setChallengeWord(null);
  };

  const handleOpenModal = () => {
    router.push("/modal");
  };

  const handleStartNewSession = () => {
    setShowCongratulations(false);
    handleOpenModal();
  };

  if (isLoading) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <View style={loadingStyle}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Loading your words...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  // Show congratulations screen when all words are mastered
  if (showCongratulations) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <View style={containerStyle}>
          <View style={styles.congratulationsContainer}>
            <Text style={styles.congratsEmoji}>🎉</Text>
            <Text style={styles.congratsTitle}>Congratulations!</Text>
            <Text style={styles.congratsMessage}>
              You have mastered all {dailyWords.length} words for today!
            </Text>
            <Text style={styles.congratsStats}>
              Total words learned: {totalLearnedWords}
            </Text>
            <Text style={styles.congratsSubtext}>
              Ready to learn more? Choose new categories and continue your
              learning journey!
            </Text>

            <TouchableOpacity
              style={styles.newSessionButton}
              onPress={handleStartNewSession}
              activeOpacity={0.8}
            >
              <Text style={styles.newSessionButtonText}>
                Choose New Categories
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (dailyWords.length === 0) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <View style={containerStyle}>
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyTitle}>
              Ready to start your daily goal?
            </Text>
            <Text style={styles.emptySubtitle}>
              Choose your favorite categories and we will pick words for you to
              learn every day.
            </Text>
            {totalLearnedWords > 0 && (
              <Text style={styles.totalLearnedBadge}>
                📚 {totalLearnedWords} words learned so far
              </Text>
            )}

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleOpenModal}
              activeOpacity={0.8}
            >
              <Text style={styles.startButtonText}>Choose Categories</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  const learnedCount = learnedWords.length;
  const totalWords = dailyWords.length;
  const remainingCount = totalWords - learnedCount;
  const filterOptions: {
    key: WordFilter;
    label: string;
    count: number;
  }[] = [
    { key: "all", label: "All", count: totalWords },
    { key: "learning", label: "Learning", count: remainingCount },
    { key: "learned", label: "Learned", count: learnedCount },
  ];
  const filteredWords = dailyWords.filter((word) => {
    const isLearned = learnedWords.includes(word.word);

    if (activeFilter === "learning") {
      return !isLearned;
    }

    if (activeFilter === "learned") {
      return isLearned;
    }

    return true;
  });
  const filterSummary =
    activeFilter === "all"
      ? `${filteredWords.length} words in today's session`
      : `${filteredWords.length} ${
          filteredWords.length === 1 ? "word" : "words"
        } ${activeFilter === "learned" ? "mastered" : "left to learn"}`;
  const emptyFilterMessage =
    activeFilter === "learned"
      ? "No words are marked as learned yet. Finish a challenge and they will show up here."
      : "You have no words left in this filter right now.";

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={containerStyle}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Today&apos;s Words</Text>
          <Text style={styles.headerSubtitle}>
            {learnedCount}/{totalWords} learned • {selectedCategories.length}{" "}
            {selectedCategories.length === 1 ? "category" : "categories"}
          </Text>
          {totalLearnedWords > 0 && (
            <Text style={styles.totalLearnedText}>
              📚 {totalLearnedWords} total words mastered
            </Text>
          )}
          <TouchableOpacity
            style={styles.changeCategoriesButton}
            onPress={handleOpenModal}
          >
            <Text style={styles.changeCategoriesText}>Change Categories</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterSection}>
          <View style={styles.filterRow}>
            {filterOptions.map((filterOption) => {
              const isActive = activeFilter === filterOption.key;

              return (
                <TouchableOpacity
                  key={filterOption.key}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive,
                  ]}
                  onPress={() => setActiveFilter(filterOption.key)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {filterOption.label}
                  </Text>
                  <View
                    style={[
                      styles.filterCountBadge,
                      isActive && styles.filterCountBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        isActive && styles.filterCountTextActive,
                      ]}
                    >
                      {filterOption.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.filterSummary}>{filterSummary}</Text>
        </View>

        {filteredWords.length === 0 ? (
          <View style={styles.filteredEmptyState}>
            <Text style={styles.filteredEmptyTitle}>Nothing to show here</Text>
            <Text style={styles.filteredEmptyText}>{emptyFilterMessage}</Text>
            {activeFilter !== "all" && (
              <TouchableOpacity
                style={styles.resetFilterButton}
                onPress={() => setActiveFilter("all")}
                activeOpacity={0.8}
              >
                <Text style={styles.resetFilterButtonText}>Show All Words</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredWords}
            renderItem={({ item, index }) => (
              <WordCard
                item={item}
                index={index}
                isLearned={learnedWords.includes(item.word)}
                onToggleLearned={handleToggleLearned}
              />
            )}
            keyExtractor={(item, index) => `${item.word}-${index}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <WordChallengeSheet
        bottomSheetRef={bottomSheetRef}
        targetWord={challengeWord}
        onCorrect={handleChallengeCorrect}
        onClose={handleChallengeClose}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F6F4EF",
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    backgroundColor: "#F6F4EF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F4EF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#4A4A4A",
  },
  congratulationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  congratsEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  congratsTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 12,
  },
  congratsMessage: {
    fontSize: 18,
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 16,
  },
  congratsStats: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2E7D32",
    textAlign: "center",
    marginBottom: 8,
  },
  congratsSubtext: {
    fontSize: 15,
    color: "#6A6A6A",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  newSessionButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  newSessionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  totalLearnedBadge: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    backgroundColor: "#E8F5E9",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#4A4A4A",
    marginBottom: 4,
  },
  totalLearnedText: {
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "600",
    marginBottom: 12,
  },
  changeCategoriesButton: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D1D1",
  },
  changeCategoriesText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E7D32",
  },
  filterSection: {
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DAD4C7",
  },
  filterChipActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3A3A3A",
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  filterCountBadge: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "#EEF2E8",
    alignItems: "center",
  },
  filterCountBadgeActive: {
    backgroundColor: "#FFFFFF",
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32",
  },
  filterCountTextActive: {
    color: "#2E7D32",
  },
  filterSummary: {
    marginTop: 10,
    fontSize: 13,
    color: "#5C5C5C",
  },
  filteredEmptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  filteredEmptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 10,
  },
  filteredEmptyText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#5C5C5C",
    textAlign: "center",
    marginBottom: 18,
  },
  resetFilterButton: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1D1D1",
  },
  resetFilterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
  },
  listContent: {
    paddingBottom: 0,
  },
});
