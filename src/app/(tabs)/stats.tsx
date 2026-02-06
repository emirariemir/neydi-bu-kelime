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

type Stats = {
  totalLearnedWords: number;
  todayLearnedCount: number;
  todayTotalCount: number;
};

export default function StatsScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [joinDate] = useState(() => {
    return "Jan 12, 2026";
  });

  // Load stats whenever the screen comes into focus
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
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
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
    <View style={styles.container}>
      <View style={styles.header}>
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
    backgroundColor: "#F6F4EF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#4A4A4A",
  },
  header: {
    gap: 6,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  subtitle: {
    fontSize: 14,
    color: "#4A4A4A",
  },
  content: {
    gap: 12,
    paddingBottom: 12,
  },
  statCard: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "transparent",
  },
  statCardHighlight: {
    backgroundColor: "#E8F5E9",
    borderColor: "#66BB6A",
  },
  statLabel: {
    fontSize: 14,
    color: "#5A5A5A",
    marginBottom: 6,
  },
  statLabelHighlight: {
    color: "#2E7D32",
    fontWeight: "600",
  },
  statValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F1F1F",
  },
  statValueHighlight: {
    color: "#2E7D32",
  },
  completedBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2E7D32",
    backgroundColor: "#C8E6C9",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  emptyState: {
    marginTop: 40,
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyStateText: {
    fontSize: 15,
    color: "#6A6A6A",
    textAlign: "center",
    lineHeight: 22,
  },
  motivationCard: {
    marginTop: 20,
    backgroundColor: "#FFF9E6",
    borderRadius: 14,
    padding: 20,
    borderWidth: 2,
    borderColor: "#FFD54F",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  motivationEmoji: {
    fontSize: 32,
  },
  motivationText: {
    flex: 1,
    fontSize: 14,
    color: "#5D4E00",
    lineHeight: 20,
    fontWeight: "500",
  },
});
