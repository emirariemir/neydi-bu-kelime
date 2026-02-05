import { StyleSheet, Text, View } from "react-native";

export type Word = {
  word: string;
  meaning: string;
  example: string;
  hint: string;
};

type RenderWordCardProps = {
  item: Word;
  index: number;
};

export const renderWordCard = ({ item, index }: RenderWordCardProps) => (
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
