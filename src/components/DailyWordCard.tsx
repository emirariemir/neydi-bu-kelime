import * as Speech from "expo-speech";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

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
  onToggleLearned: (word: string) => void;
};

export const WordCard = ({
  item,
  index,
  isLearned,
  onToggleLearned,
}: WordCardProps) => {
  const formatDifficulty = (difficulty: string) => {
    if (!difficulty) return "Unknown";
    return `${difficulty.charAt(0).toUpperCase()}${difficulty.slice(1)}`;
  };

  return (
    <View style={[styles.wordCard, isLearned && styles.wordCardLearned]}>
      <View style={styles.wordHeader}>
        <View style={styles.wordHeaderLeft}>
          <Text style={styles.wordNumber}>Word {index + 1}</Text>
          <Text style={styles.wordText}>{item.word}</Text>
          <Text style={styles.difficultyText}>
            Difficulty: {formatDifficulty(item.difficulty)}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.circleButton, styles.ttsButton]}
            onPress={() => Speech.speak(item.word, { pitch: 0.9, rate: 0.45 })}
            activeOpacity={0.7}
          >
            <Text style={styles.ttsButtonText}>TTS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.circleButton,
              styles.learnedButton,
              isLearned && styles.learnedButtonActive,
            ]}
            onPress={() => onToggleLearned(item.word)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.learnedButtonText,
                isLearned && styles.learnedButtonTextActive,
              ]}
            >
              {isLearned ? "X" : "✓"}
            </Text>
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
    borderWidth: 2,
    borderColor: "transparent",
  },
  wordCardLearned: {
    backgroundColor: "#E8F5E9",
    borderColor: "#66BB6A",
  },
  wordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    gap: 12,
  },
  wordHeaderLeft: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  ttsButton: {
    backgroundColor: "#FFFFFF",
    borderColor: "#D1D1D1",
  },
  ttsButtonText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: "#4A4A4A",
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
  learnedButton: {
    backgroundColor: "#F5F5F5",
    borderColor: "#D1D1D1",
  },
  learnedButtonActive: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  learnedButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4A4A4A",
  },
  learnedButtonTextActive: {
    color: "#FFFFFF",
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4A4A4A",
    marginTop: 4,
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
