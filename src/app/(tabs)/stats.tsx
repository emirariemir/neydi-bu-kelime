import { getLearningStats } from "@/src/utils/storageUtils";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { duoCardShadow, duoTheme } from "../../theme/duoTheme";

type Stats = {
  totalLearnedWords: number;
  todayLearnedCount: number;
  todayTotalCount: number;
};

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const insets = useSafeAreaInsets();
  const [joinDate] = useState(() => {
    return "Jan 12, 2026";
  });

  const containerStyle = [
    styles.container,
    { paddingTop: 16 + insets.top, paddingBottom: insets.bottom },
  ];
  const loadingStyle = [
    styles.loadingContainer,
    { paddingTop: insets.top, paddingBottom: insets.bottom },
  ];

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, []),
  );

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const learningStats = await getLearningStats();
      setStats(learningStats);
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={containerStyle}>
        <View style={loadingStyle}>
          <ActivityIndicator size="large" color={duoTheme.colors.green} />
          <Text style={styles.loadingText}>Loading your stats...</Text>
        </View>
      </View>
    );
  }

  const totalSeen = stats ? stats.totalLearnedWords + stats.todayTotalCount : 0;
  const totalLearned = stats?.totalLearnedWords || 0;
  const todayProgress = stats
    ? `${stats.todayLearnedCount}/${stats.todayTotalCount}`
    : "0/0";

  const STATS = [
    {
      label: "Words Learned Today",
      value: todayProgress,
      highlight:
        stats &&
        stats.todayLearnedCount === stats.todayTotalCount &&
        stats.todayTotalCount > 0,
    },
    {
      label: "Total Words Mastered",
      value: totalLearned.toString(),
      highlight: false,
    },
    {
      label: "Total Words Seen",
      value: totalSeen.toString(),
      highlight: false,
    },
  ];

  return (
    <View style={containerStyle}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>Joined at {joinDate}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {STATS.map((item) => (
          <View
            key={item.label}
            style={[
              styles.statCard,
              item.highlight && styles.statCardHighlight,
            ]}
          >
            <Text
              style={[
                styles.statLabel,
                item.highlight && styles.statLabelHighlight,
              ]}
            >
              {item.label}
            </Text>
            <View style={styles.statValueContainer}>
              <Text
                style={[
                  styles.statValue,
                  item.highlight && styles.statValueHighlight,
                ]}
              >
                {item.value}
              </Text>
              {item.highlight && (
                <Text style={styles.completedBadge}>✓ Completed</Text>
              )}
            </View>
          </View>
        ))}

        {totalLearned === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>📚</Text>
            <Text style={styles.emptyStateText}>
              Start learning words to see your progress here!
            </Text>
          </View>
        )}

        {totalLearned > 0 && (
          <View style={styles.motivationCard}>
            <Text style={styles.motivationEmoji}>🎯</Text>
            <Text style={styles.motivationText}>
              {totalLearned < 50
                ? "Great start! Keep building your vocabulary."
                : totalLearned < 100
                  ? "You're doing amazing! Keep up the momentum."
                  : totalLearned < 200
                    ? "Incredible progress! You're a word master."
                    : "Phenomenal! You're a vocabulary expert!"}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    backgroundColor: duoTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: duoTheme.colors.textSecondary,
    fontWeight: "700",
  },
  heroCard: {
    backgroundColor: duoTheme.colors.surface,
    borderRadius: duoTheme.radii.xl,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: duoTheme.colors.cardBorder,
    padding: 22,
    marginBottom: 20,
    ...duoCardShadow,
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: duoTheme.colors.textSecondary,
    fontWeight: "700",
  },
  content: {
    gap: 14,
    paddingBottom: 12,
  },
  statCard: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: duoTheme.radii.lg,
    backgroundColor: duoTheme.colors.surface,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: duoTheme.colors.cardBorder,
    ...duoCardShadow,
  },
  statCardHighlight: {
    backgroundColor: duoTheme.colors.greenSoft,
    borderColor: duoTheme.colors.green,
  },
  statLabel: {
    fontSize: 13,
    color: duoTheme.colors.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "800",
  },
  statLabelHighlight: {
    color: duoTheme.colors.greenDark,
  },
  statValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  statValue: {
    fontSize: 30,
    fontWeight: "800",
    color: duoTheme.colors.textPrimary,
  },
  statValueHighlight: {
    color: duoTheme.colors.greenDark,
  },
  completedBadge: {
    fontSize: 12,
    fontWeight: "800",
    color: duoTheme.colors.greenDark,
    backgroundColor: duoTheme.colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  emptyState: {
    marginTop: 24,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: duoTheme.colors.surface,
    borderRadius: duoTheme.radii.lg,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: duoTheme.colors.cardBorder,
    ...duoCardShadow,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: duoTheme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "700",
  },
  motivationCard: {
    marginTop: 6,
    backgroundColor: duoTheme.colors.yellowSoft,
    borderRadius: duoTheme.radii.lg,
    padding: 20,
    borderWidth: 2,
    borderBottomWidth: 6,
    borderColor: duoTheme.colors.yellowDark,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...duoCardShadow,
  },
  motivationEmoji: {
    fontSize: 32,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    color: duoTheme.colors.textPrimary,
    lineHeight: 20,
    fontWeight: "700",
  },
});
