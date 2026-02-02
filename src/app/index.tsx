import { useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import WordCard from "../components/WordCard";
import { WORDS } from "../constants/words";

export default function Index() {
  const [words, setWords] = useState(WORDS);

  const toggleGotIt = (word: string) => {
    setWords((prev) =>
      prev.map((item) =>
        item.word === word ? { ...item, gotIt: !item.gotIt } : item
      )
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hi, Julia!</Text>
        <Text style={styles.subtitle}>
          You have 3 new words to learn today.
        </Text>
      </View>

      <View style={styles.listWrap}>
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {words.map((item) => (
            <WordCard
              key={item.word}
              word={item.word}
              meaning={item.meaning}
              example={item.example}
              hint={item.hint}
              gotIt={item.gotIt}
              onToggleGotIt={() => toggleGotIt(item.word)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.button}>
        <Button
          title="Quiz Me"
          onPress={() => Alert.alert("Button pressed")}
          color="#1F6FEB"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  subtitle: {
    fontSize: 14,
    color: "#4A4A4A",
  },
  listWrap: {
    flex: 1,
    justifyContent: "center",
  },
  listContent: {
    alignItems: "center",
    gap: 12,
    paddingVertical: 18,
  },
  button: {
    borderRadius: 99,
    overflow: "hidden",
  },
});
