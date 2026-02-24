import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { type RefObject } from "react";
import { StyleSheet, Text, View } from "react-native";
import WritingChallengeStage from "./WritingChallengeStage";

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
  const handleWritingSuccess = async () => {
    if (!targetWord) return;
    await onCorrect(targetWord);
  };

  if (!targetWord) return null;

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      snapPoints={["75%"]}
      enablePanDownToClose
      onClose={onClose}
      backgroundStyle={styles.background}
      backdropComponent={(props) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.35}
        />
      )}
    >
      <BottomSheetView style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Quick challenge</Text>
        </View>

        <View style={styles.pane}>
          <WritingChallengeStage
            targetWord={targetWord}
            onSuccess={handleWritingSuccess}
          />
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: "#FFFFFF",
  },
  sheet: {
    flex: 1,
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E8E8E8",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  pane: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});
