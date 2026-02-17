import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const ONBOARDING_KEY = "hasSeenOnboarding";

const SLIDES = [
  {
    emoji: "📖",
    title: "Learn Every Day",
    description:
      "Pick up 10 new English words each day — curated just for you based on your interests and skill level.",
    accent: "#2E7D32",
    bg: "#F1F8F4",
  },
  {
    emoji: "🎯",
    title: "Choose Your Path",
    description:
      "Select from dozens of categories — travel, business, science, and more. Learn words that actually matter to you.",
    accent: "#1565C0",
    bg: "#E8F0FB",
  },
  {
    emoji: "✅",
    title: "Prove You Know It",
    description:
      "Don't just tap 'learned' — we'll give you a quick challenge to confirm each word really sticks.",
    accent: "#6A1B9A",
    bg: "#F3E5F5",
  },
  {
    emoji: "📈",
    title: "Watch Yourself Grow",
    description:
      "Track your streak, see your total mastered words, and level up your vocabulary one day at a time.",
    accent: "#E65100",
    bg: "#FFF3E0",
  },
];

export default function OnboardingModal() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const slide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  useEffect(() => {
    // Animate progress bar whenever index changes
    Animated.spring(progressAnim, {
      toValue: (currentIndex + 1) / SLIDES.length,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  }, [currentIndex]);

  const transitionToSlide = (nextIndex: number) => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.94,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentIndex(nextIndex);
      slideAnim.setValue(40);
      scaleAnim.setValue(0.96);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 80,
          friction: 12,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      transitionToSlide(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    } catch (_) {}
    router.replace("/modal");
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 },
      ]}
    >
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.6}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View
          style={[
            styles.progressFill,
            { width: progressWidth, backgroundColor: slide.accent },
          ]}
        />
      </View>

      {/* Slide content */}
      <Animated.View
        style={[
          styles.slideContent,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        {/* Emoji card */}
        <View style={[styles.emojiCard, { backgroundColor: slide.bg }]}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
        </View>

        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: slide.accent }]}>
            {slide.title}
          </Text>
          <Text style={styles.description}>{slide.description}</Text>
        </View>
      </Animated.View>

      {/* Dot indicators */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => {
              if (i !== currentIndex) transitionToSlide(i);
            }}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i === currentIndex ? slide.accent : "#D1D1D1",
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* CTA button */}
      <TouchableOpacity
        style={[styles.ctaButton, { backgroundColor: slide.accent }]}
        onPress={handleNext}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>{isLast ? "Get Started →" : "Next"}</Text>
      </TouchableOpacity>

      {/* Step count */}
      <Text style={styles.stepCount}>
        {currentIndex + 1} of {SLIDES.length}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F4EF",
    paddingHorizontal: 28,
    alignItems: "center",
  },
  skipButton: {
    alignSelf: "flex-end",
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginBottom: 12,
  },
  skipText: {
    fontSize: 15,
    color: "#9E9E9E",
    fontWeight: "500",
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    marginBottom: 48,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  slideContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  emojiCard: {
    width: SCREEN_WIDTH * 0.52,
    height: SCREEN_WIDTH * 0.52,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 44,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  emoji: {
    fontSize: 80,
  },
  textBlock: {
    alignItems: "center",
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 17,
    color: "#4A4A4A",
    textAlign: "center",
    lineHeight: 26,
    fontWeight: "400",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  ctaButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  stepCount: {
    fontSize: 13,
    color: "#BDBDBD",
    fontWeight: "500",
  },
});
