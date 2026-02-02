import { ScrollView, StyleSheet, Text, View } from "react-native";

const STATS = [
  { label: "Daily Streak", value: "7 days" },
  { label: "Total Words Seen", value: "128" },
  { label: "Total Words Learned", value: "42" },
];

export default function StatsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your progress</Text>
        <Text style={styles.subtitle}>Joined at Jan 12, 2026</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {STATS.map((item) => (
          <View key={item.label} style={styles.statCard}>
            <Text style={styles.statLabel}>{item.label}</Text>
            <Text style={styles.statValue}>{item.value}</Text>
          </View>
        ))}
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
  },
  statLabel: {
    fontSize: 14,
    color: "#5A5A5A",
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1F1F1F",
  },
});
