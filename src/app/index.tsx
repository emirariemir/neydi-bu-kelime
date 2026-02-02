import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import WordCard from "../components/WordCard";
import { WORDS } from "../constants/words";

const STORAGE_KEY = "dailyten.words";

const pickRandomWords = (source: typeof WORDS, count: number) => {
  const shuffled = [...source].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export default function Index() {
  const [words, setWords] = useState(WORDS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isActive = true;
    const loadWords = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const delay = new Promise((resolve) => setTimeout(resolve, 2000));
      await delay;
      if (!isActive) return;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWords(parsed);
          setIsLoaded(true);
          return;
        }
      }

      const selection = pickRandomWords(WORDS, 5);
      setWords(selection);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
      setIsLoaded(true);
    };

    loadWords();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  }, [isLoaded, words]);

  const toggleGotIt = (word: string) => {
    setWords((prev) =>
      prev.map((item) =>
        item.word === word ? { ...item, gotIt: !item.gotIt } : item
      )
    );
  };

  if (!isLoaded) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingTitle}>Loading your words...</Text>
        <Text style={styles.loadingSubtitle}>Getting things ready</Text>
      </View>
    );
  }

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
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: "#4A4A4A",
  },
});
