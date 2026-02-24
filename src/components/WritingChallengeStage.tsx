import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";

type WritingChallengeStageProps = {
  targetWord: string;
  onSuccess: () => void;
};

type Status = "idle" | "incorrect" | "correct";

type Letter = {
  id: string;
  char: string;
  originalIndex: number;
};

function normalizeWord(word: string) {
  return word.trim().toLowerCase();
}

function shuffle<T>(arr: T[]) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildLetters(word: string): Letter[] {
  const normalized = word.trim().toLowerCase();
  const chars = [...normalized].filter((c) => c !== " ");

  return chars.map((char, idx) => ({
    id: `${char}-${idx}-${Math.random().toString(16).slice(2)}`,
    char,
    originalIndex: idx,
  }));
}

export default function WritingChallengeStage({
  targetWord,
  onSuccess,
}: WritingChallengeStageProps) {
  const normalizedTarget = useMemo(
    () => normalizeWord(targetWord),
    [targetWord],
  );

  const targetChars = useMemo(
    () => [...targetWord].filter((c) => c !== " "),
    [targetWord],
  );

  const [status, setStatus] = useState<Status>("idle");

  const [bank, setBank] = useState<Letter[]>(() =>
    shuffle(buildLetters(targetWord)),
  );

  const [slots, setSlots] = useState<(Letter | null)[]>(() =>
    new Array(targetChars.length).fill(null),
  );
  const [lastPlacedIndex, setLastPlacedIndex] = useState<number | null>(null);
  const [slotsViewportWidth, setSlotsViewportWidth] = useState(0);
  const slotsScrollRef = useRef<ScrollView | null>(null);
  const slotLayouts = useRef<Array<{ x: number; width: number }>>([]);

  // Reset when targetWord changes
  useEffect(() => {
    setStatus("idle");
    setBank(shuffle(buildLetters(targetWord)));
    setSlots(new Array(targetChars.length).fill(null));
    setLastPlacedIndex(null);
    slotLayouts.current = [];
  }, [targetWord, targetChars.length]);

  const placedWord = useMemo(() => {
    const chars = slots.map((s) => s?.char ?? "");
    return normalizeWord(chars.join(""));
  }, [slots]);

  const isComplete = useMemo(() => slots.every(Boolean), [slots]);

  const handlePickFromBank = (letter: Letter) => {
    if (status === "correct") return;

    const emptyIndex = slots.findIndex((s) => s === null);
    if (emptyIndex === -1) return;

    setStatus("idle");
    setLastPlacedIndex(emptyIndex);

    setBank((prev) => prev.filter((l) => l.id !== letter.id));
    setSlots((prev) => {
      const next = [...prev];
      next[emptyIndex] = letter;
      return next;
    });
  };

  const handleRemoveFromSlot = (slotIndex: number) => {
    if (status === "correct") return;

    const letter = slots[slotIndex];
    if (!letter) return;

    setStatus("idle");

    setSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });

    setBank((prev) => [...prev, letter]);
  };

  const handleCheck = () => {
    if (!isComplete) return;

    if (placedWord === normalizedTarget) {
      setStatus("correct");
      setTimeout(() => onSuccess(), 450);
    } else {
      setStatus("incorrect");
    }
  };

  const handleClear = () => {
    if (status === "correct") return;
    setStatus("idle");
    setLastPlacedIndex(null);
    const allLetters = slots.filter(Boolean) as Letter[];
    setSlots(new Array(targetChars.length).fill(null));
    setBank((prev) => shuffle([...prev, ...allLetters]));
  };

  useEffect(() => {
    if (lastPlacedIndex === null || slotsViewportWidth <= 0) return;
    const layout = slotLayouts.current[lastPlacedIndex];
    if (!layout) return;
    const targetX = Math.max(
      0,
      layout.x - (slotsViewportWidth - layout.width) / 2,
    );
    requestAnimationFrame(() => {
      slotsScrollRef.current?.scrollTo({ x: targetX, animated: true });
    });
  }, [lastPlacedIndex, slotsViewportWidth, slots]);

  const handleSlotsLayout = (event: LayoutChangeEvent) => {
    setSlotsViewportWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Put the letters in order</Text>
      <Text style={styles.hint}>{targetChars.length} letters</Text>

      {/* SLOTS */}
      <View
        style={[
          styles.slotsFrame,
          status === "incorrect" && styles.slotsWrapError,
          status === "correct" && styles.slotsWrapSuccess,
        ]}
      >
        <ScrollView
          horizontal
          ref={slotsScrollRef}
          onLayout={handleSlotsLayout}
          showsHorizontalScrollIndicator={false}
          bounces={true}
          contentContainerStyle={styles.slotsRow}
        >
          {slots.map((slot, idx) => {
            const filled = Boolean(slot);

            return (
              <Pressable
                key={`slot-${idx}`}
                onPress={() => handleRemoveFromSlot(idx)}
                disabled={!filled || status === "correct"}
                onLayout={(event) => {
                  const { x, width } = event.nativeEvent.layout;
                  slotLayouts.current[idx] = { x, width };
                }}
                style={({ pressed }) => [
                  styles.slot,
                  filled ? styles.slotFilled : styles.slotEmpty,
                  pressed && filled && styles.slotPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  filled
                    ? `Remove letter ${slot?.char} from position ${idx + 1}`
                    : `Empty slot ${idx + 1}`
                }
              >
                {/* Layout animation for the letter appearing inside slot */}
                <Animated.View
                  layout={Layout.duration(140).easing(Easing.out(Easing.quad))}
                  style={styles.slotInner}
                >
                  {slot ? (
                    <Animated.View
                      entering={FadeIn.duration(120)}
                      exiting={FadeOut.duration(80)}
                      style={styles.letterCardInSlot}
                    >
                      <Text style={styles.letterText}>{slot.char}</Text>
                    </Animated.View>
                  ) : (
                    <Text style={styles.slotPlaceholder}> </Text>
                  )}
                </Animated.View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* BANK */}
      <View style={styles.bankWrap}>
        {bank.map((letter) => (
          <Animated.View
            key={letter.id}
            layout={Layout.duration(140).easing(Easing.out(Easing.quad))}
          >
            <Pressable
              onPress={() => handlePickFromBank(letter)}
              disabled={status === "correct"}
              style={({ pressed }) => [
                styles.letterCard,
                pressed && styles.letterCardPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Pick letter ${letter.char}`}
            >
              <Text style={styles.letterText}>{letter.char}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      {/* FEEDBACK */}
      {status === "incorrect" && (
        <Text style={styles.errorText}>Not quite — try again.</Text>
      )}
      {status === "correct" && (
        <Text style={styles.successText}>Correct ✓</Text>
      )}

      {/* ACTIONS */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleClear}
          disabled={
            status === "correct" ||
            (bank.length === targetChars.length && !slots.some(Boolean))
          }
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryButtonPressed,
          ]}
        >
          <Text style={styles.secondaryButtonText}>Clear</Text>
        </Pressable>

        <Pressable
          onPress={handleCheck}
          disabled={!isComplete || status === "correct"}
          style={({ pressed }) => [
            styles.primaryButton,
            (!isComplete || status === "correct") &&
              styles.primaryButtonDisabled,
            pressed &&
              isComplete &&
              status !== "correct" &&
              styles.primaryButtonPressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {status === "correct" ? "Correct ✓" : "Check"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
  },
  hint: {
    fontSize: 13,
    color: "#9A9A9A",
    marginTop: -4,
  },

  // Slots
  slotsFrame: {
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E6E6E6",
    backgroundColor: "#FAFAFA",
  },
  slotsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    gap: 10,
  },
  slotsWrapError: {
    borderColor: "#E53935",
    backgroundColor: "#FFF7F7",
  },
  slotsWrapSuccess: {
    borderColor: "#43A047",
    backgroundColor: "#F6FFF7",
  },
  slot: {
    width: 42,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  slotEmpty: {
    borderWidth: 1,
    borderColor: "#E3E3E3",
    backgroundColor: "#FFFFFF",
  },
  slotFilled: {
    borderWidth: 1,
    borderColor: "#E1E1E1",
    backgroundColor: "#FFFFFF",
  },
  slotPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  slotInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  slotPlaceholder: {
    color: "transparent",
  },
  letterCardInSlot: {
    width: 38,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#ECECEC",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },

  // Bank
  bankWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    backgroundColor: "#FFFFFF",
  },
  letterCard: {
    width: 42,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  letterCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  letterText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#121212",
  },

  // Feedback
  errorText: {
    fontSize: 13,
    color: "#E53935",
  },
  successText: {
    fontSize: 13,
    color: "#43A047",
    fontWeight: "600",
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#111111",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: "#CFCFCF",
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    paddingHorizontal: 16,
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E6E6E6",
  },
  secondaryButtonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  secondaryButtonText: {
    color: "#222222",
    fontSize: 15,
    fontWeight: "700",
  },
});
