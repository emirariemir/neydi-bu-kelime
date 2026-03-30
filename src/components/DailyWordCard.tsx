import { useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as Speech from "expo-speech";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  duoCardShadow,
  duoSoftShadow,
  duoTheme,
} from "../theme/duoTheme";

export type Word = {
  word: string;
  difficulty: string;
  meaning: string;
  example: string;
  hint: string;
};

type WordCardProps = {
  item: Word;
  index: number;
  isLearned: boolean;
  onToggleLearned: (word: string) => void | Promise<void>;
};

export const WordCard = ({
  item,
  index,
  isLearned,
  onToggleLearned,
}: WordCardProps) => {
  const [isLoading, setIsLoading] = useState(false);

  const formatDifficulty = (difficulty: string) => {
    if (!difficulty) return "Unknown";
    return `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`;
  };

  const handleTogglePress = async () => {
    if (isLoading) return;
    const shouldShowLoading = !isLearned;

    if (shouldShowLoading) {
      setIsLoading(true);
    }

    try {
      await onToggleLearned(item.word);
    } finally {
      if (shouldShowLoading) {
        setIsLoading(false);
      }
    }
  };

  return (
    <View style={[styles.wordCard, isLearned && styles.wordCardLearned]}>
      <View style={styles.wordHeader}>
        <View style={styles.wordHeaderLeft}>
          <View style={styles.wordMetaRow}>
            <Text style={styles.wordNumber}>Word {index + 1}</Text>
            <View style={styles.difficultyPill}>
              <Text style={styles.difficultyText}>
                {formatDifficulty(item.difficulty)}
              </Text>
            </View>
          </View>
          <Text style={styles.wordText}>{item.word}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.circleButton, styles.ttsButton]}
            onPress={() => Speech.speak(item.word)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="volume-high"
              size={18}
              color={duoTheme.colors.white}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.circleButton,
              styles.learnedButton,
              isLearned && styles.learnedButtonActive,
              isLoading && styles.learnedButtonLoading,
            ]}
            onPress={handleTogglePress}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            {isLoading && !isLearned ? (
              <ActivityIndicator
                size="small"
                color={duoTheme.colors.textPrimary}
              />
            ) : (
              <Ionicons
                name={isLearned ? "close" : "checkmark"}
                size={18}
                color={
                  isLearned
                    ? duoTheme.colors.white
                    : duoTheme.colors.textPrimary
                }
              />
            )}
          </TouchableOpacity>
        </View>
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
};

// Keeping the old export for backward compatibility if needed
export const renderWordCard = ({
  item,
  index,
}: {
  item: Word;
  index: number;
}) => (
  <WordCard
    item={item}
    index={index}
    isLearned={false}
    onToggleLearned={() => {}}
  />
);

const styles = StyleSheet.create({
  wordCard: {
    backgroundColor: duoTheme.colors.surface,
    borderRadius: duoTheme.radii.lg,
    padding: 20,
    marginBottom: 18,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: duoTheme.colors.cardBorder,
    ...duoCardShadow,
  },
  wordCardLearned: {
    backgroundColor: duoTheme.colors.surfaceSoft,
    borderColor: duoTheme.colors.green,
  },
  wordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: duoTheme.colors.surfaceMuted,
    gap: 12,
  },
  wordHeaderLeft: {
    flex: 1,
  },
  wordMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderBottomWidth: 5,
  },
  ttsButton: {
    backgroundColor: duoTheme.colors.blue,
    borderColor: duoTheme.colors.blueDark,
    ...duoSoftShadow,
  },
  wordNumber: {
    fontSize: 12,
    fontWeight: "800",
    color: duoTheme.colors.greenDark,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    backgroundColor: duoTheme.colors.greenSoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  wordText: {
    fontSize: 28,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
    letterSpacing: 0.2,
  },
  learnedButton: {
    backgroundColor: duoTheme.colors.surfaceSoft,
    borderColor: duoTheme.colors.cardBorder,
    ...duoSoftShadow,
  },
  learnedButtonActive: {
    backgroundColor: duoTheme.colors.green,
    borderColor: duoTheme.colors.greenDark,
  },
  learnedButtonLoading: {
    opacity: 0.7,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "800",
    color: duoTheme.colors.blueDark,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  difficultyPill: {
    backgroundColor: duoTheme.colors.blueSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  wordContent: {
    gap: 14,
  },
  wordSection: {
    gap: 8,
    padding: 14,
    borderRadius: 18,
    backgroundColor: duoTheme.colors.surfaceSoft,
    borderWidth: 2,
    borderColor: duoTheme.colors.surfaceMuted,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: duoTheme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  sectionText: {
    fontSize: 15,
    color: duoTheme.colors.textPrimary,
    lineHeight: 22,
    fontWeight: "600",
  },
});
