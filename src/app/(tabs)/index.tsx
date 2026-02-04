import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ABSTRACT_WORDS } from "../../constants/words/abstract-advanced-concepts.v2.words";
import { DAILY_LIFE_WORDS } from "../../constants/words/daily-life-routine.beginner.words";
import { EDUCATION_WORDS } from "../../constants/words/education-learning.words";
import { EMOTIONS_WORDS } from "../../constants/words/emotions-personality.beginner.words";
import { FOOD_WORDS } from "../../constants/words/food-cooking-dining.extended.words";
import { HEALTH_WORDS } from "../../constants/words/health-lifestyle.words";
import { NATURE_WORDS } from "../../constants/words/nature-environment.v2.words";
import { TECHNOLOGY_WORDS } from "../../constants/words/technology-internet.words";
import { TRAVEL_WORDS } from "../../constants/words/travel-transportation.words";
import { WORK_WORDS } from "../../constants/words/work-office-life.beginner.words";

type Word = {
  word: string;
  meaning: string;
  example: string;
  hint: string;
};

export const CATEGORY_WORDS = {
  daily_life: DAILY_LIFE_WORDS,
  emotions: EMOTIONS_WORDS,
  work: WORK_WORDS,
  education: EDUCATION_WORDS,
  travel: TRAVEL_WORDS,
  health: HEALTH_WORDS,
  technology: TECHNOLOGY_WORDS,
  food: FOOD_WORDS,
  nature: NATURE_WORDS,
  sports: [],
  abstract: ABSTRACT_WORDS,
} as const;

export default function Index() {
  const params = useLocalSearchParams();
  const [dailyWords, setDailyWords] = useState<Word[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useEffect(() => {
    // Parse the selected words from route params
    if (params.selectedWords && typeof params.selectedWords === "string") {
      try {
        const words = JSON.parse(params.selectedWords);
        setDailyWords(words);
      } catch (error) {
        console.error("Error parsing selected words:", error);
      }
    }

    // Parse the selected categories
    if (
      params.selectedCategories &&
      typeof params.selectedCategories === "string"
    ) {
      try {
        const categories = JSON.parse(params.selectedCategories);
        setSelectedCategories(categories);
      } catch (error) {
        console.error("Error parsing selected categories:", error);
      }
    }
  }, [params.selectedWords, params.selectedCategories]);

  const handleOpenModal = () => {
    router.push("/modal");
  };

  const renderWordCard = ({ item, index }: { item: Word; index: number }) => (
    <View style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <Text style={styles.wordNumber}>Word {index + 1}</Text>
        <Text style={styles.wordText}>{item.word}</Text>
      </View>
      <View style={styles.wordContent}>
        <View style={styles.wordSection}>
          <Text style={styles.sectionLabel}>Meaning</Text>
          <Text style={styles.sectionText}>{item.meaning}</Text>
        </View>
        <View style={styles.wordSection}>
          <Text style={styles.sectionLabel}>Example</Text>
          <Text style={styles.sectionText}>{item.example}</Text>
        </View>
        <View style={styles.wordSection}>
          <Text style={styles.sectionLabel}>Hint</Text>
          <Text style={styles.sectionText}>{item.hint}</Text>
        </View>
      </View>
    </View>
  );

  if (dailyWords.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyTitle}>Ready to start your daily goal?</Text>
          <Text style={styles.emptySubtitle}>
            Choose your favorite categories and we'll pick words for you to
            learn every day.
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            onPress={handleOpenModal}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Choose Categories</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Words</Text>
        <Text style={styles.headerSubtitle}>
          {dailyWords.length} words from {selectedCategories.length}{" "}
          {selectedCategories.length === 1 ? "category" : "categories"}
        </Text>
        <TouchableOpacity
          style={styles.changeCategoriesButton}
          onPress={handleOpenModal}
        >
          <Text style={styles.changeCategoriesText}>Change Categories</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={dailyWords}
        renderItem={renderWordCard}
        keyExtractor={(item, index) => `${item.word}-${index}`}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    backgroundColor: "#F6F4EF",
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
    marginBottom: 32,
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
  wordCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  wordHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  wordNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#66BB6A",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  wordText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  wordContent: {
    gap: 12,
  },
  wordSection: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#66BB6A",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionText: {
    fontSize: 14,
    color: "#4A4A4A",
    lineHeight: 20,
  },
});
