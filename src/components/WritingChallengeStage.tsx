import { useState } from "react";
import {
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type WritingChallengeStageProps = {
  targetWord: string;
  onSuccess: () => void;
};

export default function WritingChallengeStage({
  targetWord,
  onSuccess,
}: WritingChallengeStageProps) {
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "incorrect" | "correct">(
    "idle",
  );

  const handleCheck = () => {
    const normalizedAnswer = answer.trim().toLowerCase();
    const normalizedTarget = targetWord.trim().toLowerCase();

    if (normalizedAnswer === normalizedTarget) {
      setStatus("correct");
      Keyboard.dismiss();
      setTimeout(() => onSuccess(), 500);
      return;
    }

    setStatus("incorrect");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Spell the word</Text>
      <Text style={styles.hint}>{targetWord.length} letters</Text>

      <TextInput
        style={[
          styles.input,
          status === "incorrect" && styles.inputError,
          status === "correct" && styles.inputSuccess,
        ]}
        placeholder="Type here…"
        placeholderTextColor="#BBBBBB"
        autoCapitalize="none"
        autoCorrect={false}
        value={answer}
        onChangeText={(value) => {
          setAnswer(value);
          if (status !== "idle") setStatus("idle");
        }}
        onSubmitEditing={handleCheck}
        returnKeyType="done"
        editable={status !== "correct"}
      />

      {status === "incorrect" && (
        <Text style={styles.errorText}>Incorrect spelling.</Text>
      )}

      <TouchableOpacity
        style={[styles.button, status === "correct" && styles.buttonSuccess]}
        onPress={handleCheck}
        activeOpacity={0.75}
        disabled={status === "correct"}
      >
        <Text style={styles.buttonText}>
          {status === "correct" ? "Correct ✓" : "Check"}
        </Text>
      </TouchableOpacity>
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
    color: "#AAAAAA",
    marginTop: -4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: "#111111",
    marginTop: 8,
  },
  inputError: {
    borderColor: "#E53935",
  },
  inputSuccess: {
    borderColor: "#43A047",
  },
  errorText: {
    fontSize: 13,
    color: "#E53935",
  },
  button: {
    backgroundColor: "#111111",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonSuccess: {
    backgroundColor: "#43A047",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
