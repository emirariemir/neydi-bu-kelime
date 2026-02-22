import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Animated, Dimensions, StyleSheet, Text, View } from "react-native";
import VoiceChallengeStage from "./VoiceChallengeStage";
import WritingChallengeStage from "./WritingChallengeStage";

const SCREEN_WIDTH = Dimensions.get("window").width;

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
  const [stage, setStage] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setStage(0);
    translateX.setValue(0);
  }, [targetWord]);

  const goToStage = (next: number) => {
    Animated.timing(translateX, {
      toValue: -next * SCREEN_WIDTH,
      duration: 280,
      useNativeDriver: true,
    }).start();
    setStage(next);
  };

  const handleWritingSuccess = () => goToStage(1);

  const handleVoiceSuccess = async () => {
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
          {/* Step dots */}
          <View style={styles.dots}>
            <View style={[styles.dot, stage === 0 && styles.dotActive]} />
            <View style={[styles.dot, stage === 1 && styles.dotActive]} />
          </View>
        </View>

        {/* Sliding panes */}
        <View style={styles.paneWindow}>
          <Animated.View
            style={[styles.paneTrack, { transform: [{ translateX }] }]}
          >
            <View style={styles.pane}>
              <WritingChallengeStage
                targetWord={targetWord}
                onSuccess={handleWritingSuccess}
              />
            </View>
            <View style={styles.pane}>
              <VoiceChallengeStage
                targetWord={targetWord}
                onSuccess={handleVoiceSuccess}
              />
            </View>
          </Animated.View>
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
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#DDDDDD",
  },
  dotActive: {
    backgroundColor: "#111111",
  },
  paneWindow: {
    flex: 1,
    overflow: "hidden",
  },
  paneTrack: {
    flex: 1,
    flexDirection: "row",
    width: SCREEN_WIDTH * 2,
  },
  pane: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
});
