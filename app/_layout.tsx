import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SeasonPassProvider } from "@/providers/SeasonPassProvider";
import { trpc, trpcClient } from "@/lib/trpc";

// Disable font scaling to prevent system settings from affecting layout
const TextAny = Text as unknown as { defaultProps?: Record<string, any> };
const TextInputAny = TextInput as unknown as { defaultProps?: Record<string, any> };
if (TextAny.defaultProps == null) TextAny.defaultProps = {};
TextAny.defaultProps.allowFontScaling = false;
if (TextInputAny.defaultProps == null) TextInputAny.defaultProps = {};
TextInputAny.defaultProps.allowFontScaling = false;

SplashScreen.preventAutoHideAsync();

const DEFAULT_MAX_FONT_SIZE_MULTIPLIER = 1.0 as const;

const ensureDefaultProps = (Component: unknown) => {
  const c = Component as { defaultProps?: Record<string, unknown> };
  if (!c.defaultProps) c.defaultProps = {};
  return c;
};

ensureDefaultProps(Text).defaultProps = {
  ...ensureDefaultProps(Text).defaultProps,
  allowFontScaling: false,
  maxFontSizeMultiplier: DEFAULT_MAX_FONT_SIZE_MULTIPLIER,
};

ensureDefaultProps(TextInput).defaultProps = {
  ...ensureDefaultProps(TextInput).defaultProps,
  allowFontScaling: false,
  maxFontSizeMultiplier: DEFAULT_MAX_FONT_SIZE_MULTIPLIER,
};

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="edit-pass"
        options={{
          title: "Edit Season Pass",
          presentation: "modal",
        }}
      />
      <Stack.Screen 
        name="setup" 
        options={{ 
          headerShown: false,
          presentation: "fullScreenModal",
          gestureEnabled: false,
        }} 
      />
      <Stack.Screen 
        name="restore" 
        options={{ 
          headerShown: false,
          presentation: "modal",
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SeasonPassProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </SeasonPassProvider>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
