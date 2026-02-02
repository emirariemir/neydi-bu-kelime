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
};

export default function WordCard({
  word,
  meaning,
  example,
  hint,
}: WordCardProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <Pressable onPress={toggle} style={styles.card}>
      <Text style={styles.word}>{word}</Text>
      {expanded ? (
        <View style={styles.details}>
          <Text style={styles.label}>Meaning</Text>
          <Text style={styles.body}>{meaning}</Text>

          <Text style={styles.label}>Example</Text>
          <Text style={styles.body}>{example}</Text>

          <Text style={styles.label}>Hint</Text>
          <Text style={styles.body}>{hint}</Text>
        </View>
      ) : null}
    </Pressable>
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
});
