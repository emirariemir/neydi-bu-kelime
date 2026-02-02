import { useState } from "react";
import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type WordCardProps = {
  word: string;
  meaning: string;
  example: string;
  hint: string;
  gotIt: boolean;
  onToggleGotIt: () => void;
};

export default function WordCard({
  word,
  meaning,
  example,
  hint,
  gotIt,
  onToggleGotIt,
}: WordCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View style={[styles.card, gotIt ? styles.cardGotIt : null]}>
      <Pressable onPress={toggle} style={styles.header}>
        <Text style={styles.word}>{word}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.details}>
          <Text style={styles.label}>Meaning</Text>
          <Text style={styles.body}>{meaning}</Text>

          <Text style={styles.label}>Example</Text>
          <Text style={styles.body}>{example}</Text>

          <Text style={styles.label}>Hint</Text>
          <Text style={styles.body}>{hint}</Text>

          <Pressable onPress={onToggleGotIt} style={styles.toggleButton}>
            <Text style={styles.toggleText}>
              {gotIt ? "Got it" : "Mark as got it"}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
  },
  cardGotIt: {
    backgroundColor: "#DFF6E3",
  },
  header: {
    alignItems: "center",
  },
  word: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F1F1F",
    textAlign: "center",
    letterSpacing: 0.4,
  },
  details: {
    marginTop: 14,
    gap: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6A6A6A",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  body: {
    fontSize: 15,
    color: "#2B2B2B",
    lineHeight: 20,
  },
  toggleButton: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#1F6FEB",
    alignItems: "center",
  },
  toggleText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
