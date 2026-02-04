import { router } from "expo-router";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CATEGORIES } from "../constants/word-categories";
import { selectRandomWords } from "../utils/wordSelectionUtils";
import { CATEGORY_WORDS } from "./(tabs)";

export default function CategorySelectionModal() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

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
    router.push({
      pathname: "/",
      params: {
        selectedWords: JSON.stringify(randomWords),
        selectedCategories: JSON.stringify(selectedCategories),
      },
    });
  };

  const isSelected = (categoryId: string) =>
    selectedCategories.includes(categoryId);
  const canSelectMore = selectedCategories.length < 5;

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
