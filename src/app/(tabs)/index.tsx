import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { WordCard, type Word } from "../../components/DailyWordCard";
import {
  areAllWordsMastered,
  completeTodaysSession,
  getDailyWords,
  getLearningStats,
  saveDailyWords,
} from "../../utils/storageUtils";

export default function Index() {
  const params = useLocalSearchParams();
  const [dailyWords, setDailyWords] = useState<Word[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [totalLearnedWords, setTotalLearnedWords] = useState(0);
  const [isPresented, setIsPresented] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ["25%"], []);

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
          setShowCongratulations(false);
        });
      } catch (error) {
        console.error("Error parsing selected words:", error);
      }
    }
  }, [params.selectedWords, params.selectedCategories]);

  // Check if all words are mastered whenever learnedWords changes
  useEffect(() => {
    checkIfAllWordsMastered();
  }, [learnedWords]);

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

  const checkIfAllWordsMastered = async () => {
    const allMastered = await areAllWordsMastered();

    if (allMastered && !showCongratulations) {
      // Complete the session and move words to pool
      await completeTodaysSession();

      // Update stats
      const stats = await getLearningStats();
      setTotalLearnedWords(stats.totalLearnedWords);

      setShowCongratulations(true);
    }
  };

  const handleToggleLearned = async (word: string) => {
    bottomSheetRef.current?.expand();
    // try {
    //   const updatedLearnedWords = await toggleWordLearned(word);
    //   setLearnedWords(updatedLearnedWords);
    // } catch (error) {
    //   console.error("Error toggling learned state:", error);
    // }
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
        <View style={styles.loadingContainer}>
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
        <View style={styles.container}>
          <View style={styles.congratulationsContainer}>
            <Text style={styles.congratsEmoji}>🎉</Text>
            <Text style={styles.congratsTitle}>Congratulations!</Text>
            <Text style={styles.congratsMessage}>
              You've mastered all {dailyWords.length} words for today!
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
        <View style={styles.container}>
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyTitle}>
              Ready to start your daily goal?
            </Text>
            <Text style={styles.emptySubtitle}>
              Choose your favorite categories and we'll pick words for you to
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

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Today's Words</Text>
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

        <FlatList
          data={dailyWords}
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
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backgroundStyle={styles.bottomSheetBackground}
        >
          <BottomSheetView style={styles.bottomSheetContent}>
            <Text style={styles.bottomSheetTitle}>Nice work!</Text>
            <Text style={styles.bottomSheetText}>
              We’ll track this word as learned.
            </Text>
          </BottomSheetView>
        </BottomSheet>
      </View>
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
  listContent: {
    paddingBottom: 20,
  },
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
  },
  bottomSheetContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 6,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  bottomSheetText: {
    fontSize: 14,
    color: "#4A4A4A",
    lineHeight: 20,
  },
});
