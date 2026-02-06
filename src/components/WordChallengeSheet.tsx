import BottomSheet, { BottomSheetView } from "@gorhom/bottom-sheet";
import { useEffect, useState, type RefObject } from "react";
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";

type WordChallengeSheetProps = {
  bottomSheetRef?: RefObject<BottomSheet | null>;
  targetWord: string | null;
  onCorrect: (word: string) => Promise<void> | void;
  onClose: () => void;
};

export default function WordChallengeSheet({
  bottomSheetRef,
  targetWord,
  onCorrect,
  onClose,
}: WordChallengeSheetProps) {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "incorrect">("idle");

  useEffect(() => {
    setAnswer("");
    setStatus("idle");
  }, [targetWord]);

  const handleCheck = async () => {
    if (!targetWord) {
      return;
    }

    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedTarget = targetWord.trim().toLowerCase();

    if (normalizedAnswer === normalizedTarget) {
      Keyboard.dismiss();
      await onCorrect(targetWord);
      return;
    }

    setStatus("incorrect");
  };

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["85%"]}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.bottomSheetBackground}
    >
      <BottomSheetView style={styles.bottomSheetContent}>
        <Text style={styles.bottomSheetTitle}>Quick Challenge</Text>
        <Text style={styles.bottomSheetText}>
          Type the word you marked as learned to confirm.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Type the word here"
          autoCapitalize="none"
          autoCorrect={false}
          value={answer}
          onChangeText={(value) => {
            setAnswer(value);
            if (status !== "idle") {
              setStatus("idle");
            }
          }}
          onSubmitEditing={handleCheck}
          returnKeyType="done"
        />
        {status === "incorrect" && (
          <Text style={styles.errorText}>That spelling is not correct.</Text>
        )}
        <TouchableOpacity
          style={styles.checkButton}
          onPress={handleCheck}
          activeOpacity={0.8}
        >
          <Text style={styles.checkButtonText}>Check</Text>
        </TouchableOpacity>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: "#FFFFFF",
  },
  bottomSheetContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 10,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  bottomSheetText: {
    fontSize: 14,
    color: "#4A4A4A",
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#D1D1D1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
  },
  errorText: {
    color: "#C62828",
    fontSize: 13,
    fontWeight: "600",
  },
  checkButton: {
    marginTop: 4,
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  checkButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
