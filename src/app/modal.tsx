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
import { clearDailyWords, getDailyWords } from "../utils/storageUtils";
import { selectRandomWords } from "../utils/wordSelectionUtils";

export default function CategorySelectionModal() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [hasExistingWords, setHasExistingWords] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkExistingWords();
  }, []);

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

  const handleConfirmSelection = () => {
    if (selectedCategories.length === 0) {
      return;
    }

    // Select 10 random words from the chosen categories
    const randomWords = selectRandomWords(
      selectedCategories,
      CATEGORY_WORDS,
      10,
    );

    // Navigate back to index with the selected words
    router.dismissTo({
      pathname: "/",
      params: {
        selectedWords: JSON.stringify(randomWords),
        selectedCategories: JSON.stringify(selectedCategories),
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Categories</Text>
      <Text style={styles.subtitle}>
        Select up to 5 categories ({selectedCategories.length}/5 selected)
      </Text>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
                <Text
                  style={[
                    styles.categoryDescription,
                    selected && styles.categoryDescriptionSelected,
                    disabled && styles.categoryDescriptionDisabled,
                  ]}
                  numberOfLines={2}
                >
                  {category.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          selectedCategories.length === 0 && styles.confirmButtonDisabled,
        ]}
        disabled={selectedCategories.length === 0}
        onPress={handleConfirmSelection}
      >
        <Text style={styles.confirmButtonText}>
          {selectedCategories.length === 0
            ? "Select at least 1 category"
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
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryPill: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#D1D1D1",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: "47%",
    maxWidth: "100%",
  },
  categoryPillSelected: {
    backgroundColor: "#E8F5E9",
    borderColor: "#66BB6A",
  },
  categoryPillDisabled: {
    opacity: 0.4,
  },
  categoryTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  categoryTitleSelected: {
    color: "#2E7D32",
  },
  categoryTitleDisabled: {
    color: "#9E9E9E",
  },
  categoryDescription: {
    fontSize: 12,
    color: "#6A6A6A",
    lineHeight: 16,
  },
  categoryDescriptionSelected: {
    color: "#388E3C",
  },
  categoryDescriptionDisabled: {
    color: "#BDBDBD",
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
