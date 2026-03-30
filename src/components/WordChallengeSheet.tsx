import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { type RefObject } from "react";
import { StyleSheet, Text, View } from "react-native";
import WritingChallengeStage from "./WritingChallengeStage";
import { duoTheme } from "../theme/duoTheme";

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
        <View style={styles.handle} />
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
    backgroundColor: duoTheme.colors.surface,
    borderTopLeftRadius: duoTheme.radii.xl,
    borderTopRightRadius: duoTheme.radii.xl,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: duoTheme.colors.cardBorder,
  },
  sheet: {
    flex: 1,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: "center",
    width: 54,
    height: 6,
    borderRadius: 999,
    backgroundColor: duoTheme.colors.cardBorder,
    marginTop: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: duoTheme.colors.surfaceMuted,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
  },
  pane: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});
