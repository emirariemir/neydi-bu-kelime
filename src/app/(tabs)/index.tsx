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
import { duoCardShadow, duoSoftShadow, duoTheme } from "../../theme/duoTheme";
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

  useEffect(() => {
    loadWordsFromStorage();
  }, []);

  useEffect(() => {
    if (params.selectedWords && typeof params.selectedWords === "string") {
      try {
        const words = JSON.parse(params.selectedWords);
        const categories =
          params.selectedCategories &&
          typeof params.selectedCategories === "string"
            ? JSON.parse(params.selectedCategories)
            : [];

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

      if (!allMastered || showCongratulations || challengeWord) {
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

        const allMastered = await areAllWordsMastered();
        setShowCongratulations(allMastered);
      }

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
          <ActivityIndicator size="large" color={duoTheme.colors.green} />
          <Text style={styles.loadingText}>Loading your words...</Text>
        </View>
      </GestureHandlerRootView>
    );
  }

  if (showCongratulations) {
    return (
      <GestureHandlerRootView style={styles.root}>
        <View style={containerStyle}>
          <View style={styles.congratulationsContainer}>
            <View style={styles.stateCard}>
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
                style={styles.primaryButton}
                onPress={handleStartNewSession}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>
                  Choose New Categories
                </Text>
              </TouchableOpacity>
            </View>
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
            <View style={styles.stateCard}>
              <Text style={styles.emptyTitle}>
                Ready to start your daily goal?
              </Text>
              <Text style={styles.emptySubtitle}>
                Choose your favorite categories and we will pick words for you
                to learn every day.
              </Text>
              {totalLearnedWords > 0 && (
                <Text style={styles.totalLearnedBadge}>
                  📚 {totalLearnedWords} words learned so far
                </Text>
              )}

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleOpenModal}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>Choose Categories</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  const learnedCount = learnedWords.length;
  const totalWords = dailyWords.length;
  const remainingCount = totalWords - learnedCount;
  const progressPercent =
    totalWords === 0 ? 0 : Math.round((learnedCount / totalWords) * 100);
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
  const listHeader = (
    <View style={styles.listHeader}>
      <View style={styles.headerTopRow}>
        <View style={styles.headerCopy}>
          <Text style={styles.headerTitle}>Today&apos;s Words</Text>
          <Text style={styles.headerSubtitle}>
            {learnedCount}/{totalWords} learned
          </Text>
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleOpenModal}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>Change Categories</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.headerBadgeRow}>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>
            {selectedCategories.length}{" "}
            {selectedCategories.length === 1 ? "category" : "categories"}
          </Text>
        </View>
        {totalLearnedWords > 0 && (
          <View style={[styles.headerBadge, styles.headerBadgeBlue]}>
            <Text style={[styles.headerBadgeText, styles.headerBadgeBlueText]}>
              {totalLearnedWords} mastered
            </Text>
          </View>
        )}
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.max(progressPercent, learnedCount > 0 ? 10 : 0)}%`,
            },
          ]}
        />
      </View>

      <View style={styles.filterRow}>
        {filterOptions.map((filterOption) => {
          const isActive = activeFilter === filterOption.key;

          return (
            <TouchableOpacity
              key={filterOption.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveFilter(filterOption.key)}
              activeOpacity={0.85}
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
  );

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={containerStyle}>
        {filteredWords.length === 0 ? (
          <>
            {listHeader}
            <View style={styles.filteredEmptyState}>
              <View style={styles.filteredEmptyCard}>
                <Text style={styles.filteredEmptyTitle}>
                  Nothing to show here
                </Text>
                <Text style={styles.filteredEmptyText}>{emptyFilterMessage}</Text>
              </View>
              {activeFilter !== "all" && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => setActiveFilter("all")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.secondaryButtonText}>Show All Words</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
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
            ListHeaderComponent={listHeader}
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
    backgroundColor: duoTheme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 0,
    backgroundColor: duoTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: duoTheme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: duoTheme.colors.textSecondary,
    fontWeight: "700",
  },
  congratulationsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  stateCard: {
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
  congratsEmoji: {
    fontSize: 80,
    marginBottom: 18,
  },
  congratsTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  congratsMessage: {
    fontSize: 18,
    color: duoTheme.colors.textPrimary,
    textAlign: "center",
    lineHeight: 26,
    marginBottom: 16,
    fontWeight: "600",
  },
  congratsStats: {
    fontSize: 16,
    fontWeight: "800",
    color: duoTheme.colors.greenDark,
    backgroundColor: duoTheme.colors.greenSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    textAlign: "center",
    marginBottom: 12,
  },
  congratsSubtext: {
    fontSize: 15,
    color: duoTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
    textAlign: "center",
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: duoTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 18,
  },
  totalLearnedBadge: {
    fontSize: 14,
    fontWeight: "800",
    color: duoTheme.colors.greenDark,
    backgroundColor: duoTheme.colors.greenSoft,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    marginBottom: 24,
  },
  primaryButton: {
    width: "100%",
    backgroundColor: duoTheme.colors.green,
    borderRadius: duoTheme.radii.md,
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: duoTheme.colors.greenDark,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: duoTheme.colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  secondaryButton: {
    alignSelf: "flex-start",
    backgroundColor: duoTheme.colors.surface,
    borderRadius: duoTheme.radii.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: duoTheme.colors.cardBorder,
    ...duoSoftShadow,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  listHeader: {
    paddingBottom: 14,
    gap: 12,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    flexWrap: "wrap",
  },
  headerBadgeRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  headerBadge: {
    backgroundColor: duoTheme.colors.greenSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerBadgeBlue: {
    backgroundColor: duoTheme.colors.blueSoft,
  },
  headerBadgeText: {
    color: duoTheme.colors.greenDark,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerBadgeBlueText: {
    color: duoTheme.colors.blueDark,
  },
  headerCopy: {
    flexShrink: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 15,
    color: duoTheme.colors.textSecondary,
    fontWeight: "700",
  },
  progressTrack: {
    height: 12,
    borderRadius: 999,
    backgroundColor: duoTheme.colors.surfaceMuted,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E2EBD9",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: duoTheme.colors.green,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: duoTheme.radii.md,
    backgroundColor: duoTheme.colors.surfaceSoft,
    borderWidth: 2,
    borderBottomWidth: 4,
    borderColor: duoTheme.colors.cardBorder,
  },
  filterChipActive: {
    backgroundColor: duoTheme.colors.green,
    borderColor: duoTheme.colors.greenDark,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: duoTheme.colors.white,
  },
  filterCountBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: duoTheme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  filterCountBadgeActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  filterCountText: {
    fontSize: 12,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
  },
  filterCountTextActive: {
    color: duoTheme.colors.white,
  },
  filterSummary: {
    fontSize: 13,
    color: duoTheme.colors.textSecondary,
    fontWeight: "700",
    marginBottom: 2,
  },
  filteredEmptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 18,
  },
  filteredEmptyCard: {
    width: "100%",
    backgroundColor: duoTheme.colors.surface,
    borderRadius: duoTheme.radii.lg,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: duoTheme.colors.cardBorder,
    padding: 22,
    alignItems: "center",
    ...duoCardShadow,
  },
  filteredEmptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  filteredEmptyText: {
    fontSize: 15,
    color: duoTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  listContent: {
    paddingBottom: 24,
  },
});
