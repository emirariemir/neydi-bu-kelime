import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { duoTheme } from "../../theme/duoTheme";

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: duoTheme.colors.green,
        tabBarInactiveTintColor: duoTheme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "800",
          textTransform: "uppercase",
        },
        tabBarStyle: {
          backgroundColor: duoTheme.colors.surface,
          borderTopColor: duoTheme.colors.cardBorder,
          borderTopWidth: 2,
          height: 74,
          paddingTop: 8,
          paddingBottom: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Entypo name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarLabel: "Stats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
