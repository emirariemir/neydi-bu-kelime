import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, router } from "expo-router";
import { useEffect } from "react";
import "react-native-reanimated";

const ONBOARDING_KEY = "hasSeenOnboarding";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const hasSeen = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!hasSeen) {
        // Small delay so the root layout is mounted before navigating
        setTimeout(() => {
          router.replace("/onboarding");
        }, 100);
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    }
  };

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{
          headerShown: false,
          presentation: "modal",
          title: "Change Categories",
        }}
      />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          presentation: "modal",
          animation: "fade_from_bottom",
        }}
      />
    </Stack>
  );
}
