import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  Layout,
} from "react-native-reanimated";
import {
  duoCardShadow,
  duoSoftShadow,
  duoTheme,
} from "../theme/duoTheme";

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
  const slotLayouts = useRef<{ x: number; width: number }[]>([]);

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
      <View style={styles.titleWrap}>
        <Text style={styles.title}>Put the letters in order</Text>
        <Text style={styles.hint}>{targetChars.length} letters</Text>
      </View>

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
        <View style={[styles.feedbackCard, styles.feedbackCardError]}>
          <Text style={styles.errorText}>Not quite - try again.</Text>
        </View>
      )}
      {status === "correct" && (
        <View style={[styles.feedbackCard, styles.feedbackCardSuccess]}>
          <Text style={styles.successText}>Correct ✓</Text>
        </View>
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
    gap: 14,
  },
  titleWrap: {
    gap: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
  },
  hint: {
    fontSize: 13,
    color: duoTheme.colors.textSecondary,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // Slots
  slotsFrame: {
    marginTop: 8,
    padding: 14,
    borderRadius: duoTheme.radii.lg,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: duoTheme.colors.cardBorder,
    backgroundColor: duoTheme.colors.surfaceSoft,
    ...duoCardShadow,
  },
  slotsRow: {
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "center",
    gap: 10,
  },
  slotsWrapError: {
    borderColor: duoTheme.colors.red,
    backgroundColor: duoTheme.colors.redSoft,
  },
  slotsWrapSuccess: {
    borderColor: duoTheme.colors.green,
    backgroundColor: duoTheme.colors.greenSoft,
  },
  slot: {
    width: 48,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  slotEmpty: {
    borderWidth: 2,
    borderColor: duoTheme.colors.cardBorder,
    backgroundColor: duoTheme.colors.surface,
  },
  slotFilled: {
    borderWidth: 2,
    borderColor: duoTheme.colors.cardBorder,
    backgroundColor: duoTheme.colors.surface,
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
    width: 42,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: duoTheme.colors.surface,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: duoTheme.colors.cardBorder,
    ...duoSoftShadow,
  },

  // Bank
  bankWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    padding: 14,
    borderRadius: duoTheme.radii.lg,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: duoTheme.colors.cardBorder,
    backgroundColor: duoTheme.colors.surface,
    ...duoCardShadow,
  },
  letterCard: {
    width: 48,
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: duoTheme.colors.surface,
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: duoTheme.colors.cardBorder,
    ...duoSoftShadow,
  },
  letterCardPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  letterText: {
    fontSize: 20,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
  },

  // Feedback
  feedbackCard: {
    borderRadius: duoTheme.radii.md,
    borderWidth: 2,
    borderBottomWidth: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  feedbackCardError: {
    backgroundColor: duoTheme.colors.redSoft,
    borderColor: "#F3B2B2",
  },
  feedbackCardSuccess: {
    backgroundColor: duoTheme.colors.greenSoft,
    borderColor: "#B7E090",
  },
  errorText: {
    fontSize: 15,
    color: duoTheme.colors.red,
    fontWeight: "800",
  },
  successText: {
    fontSize: 15,
    color: duoTheme.colors.greenDark,
    fontWeight: "800",
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: duoTheme.colors.green,
    borderRadius: duoTheme.radii.md,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: duoTheme.colors.greenDark,
  },
  primaryButtonDisabled: {
    backgroundColor: duoTheme.colors.disabled,
    borderColor: duoTheme.colors.disabledDark,
  },
  primaryButtonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  primaryButtonText: {
    color: duoTheme.colors.white,
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  secondaryButton: {
    paddingHorizontal: 16,
    backgroundColor: duoTheme.colors.surface,
    borderRadius: duoTheme.radii.md,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderBottomWidth: 5,
    borderColor: duoTheme.colors.cardBorder,
  },
  secondaryButtonPressed: {
    transform: [{ scale: 0.99 }],
    opacity: 0.95,
  },
  secondaryButtonText: {
    color: duoTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});
