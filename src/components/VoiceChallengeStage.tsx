import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type VoiceChallengeStageProps = {
  targetWord: string;
  onSuccess: () => void;
};

type RecordingStatus =
  | "idle"
  | "recording"
  | "processing"
  | "success"
  | "failure";

export default function VoiceChallengeStage({
  targetWord,
  onSuccess,
}: VoiceChallengeStageProps) {
  const [status, setStatus] = useState<RecordingStatus>("idle");

  // TODO: Wire up real speech-to-text logic here.
  const handlePress = () => {
    if (status === "recording") {
      setStatus("processing");
      // Stub: simulate processing → success
      setTimeout(() => {
        setStatus("success");
        setTimeout(() => onSuccess(), 500);
      }, 1000);
    } else if (status === "idle" || status === "failure") {
      // TODO: request mic permission, start recording
      setStatus("recording");
    }
  };

  const buttonLabel = {
    idle: "Tap to speak",
    recording: "Tap to stop",
    processing: "Listening…",
    success: "Recognised ✓",
    failure: "Try again",
  }[status];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Say the word</Text>
      <Text style={styles.hint}>Pronounce it clearly</Text>

      <View style={styles.wordBox}>
        <Text style={styles.word}>{targetWord}</Text>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          status === "recording" && styles.buttonRecording,
          status === "success" && styles.buttonSuccess,
          status === "failure" && styles.buttonFailure,
        ]}
        onPress={handlePress}
        activeOpacity={0.75}
        disabled={status === "processing" || status === "success"}
      >
        <Text style={styles.buttonText}>{buttonLabel}</Text>
      </TouchableOpacity>

      {status === "failure" && (
        <Text style={styles.errorText}>Couldn't recognise the word.</Text>
      )}
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
  wordBox: {
    marginTop: 8,
    paddingVertical: 24,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
  },
  word: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: "#111111",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonRecording: {
    backgroundColor: "#E53935",
  },
  buttonSuccess: {
    backgroundColor: "#43A047",
  },
  buttonFailure: {
    backgroundColor: "#E53935",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  errorText: {
    fontSize: 13,
    color: "#E53935",
  },
});
