import { Stack } from "expo-router";
import type { NativeStackNavigationOptions } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { RoutineServicesProvider } from "../providers/RoutineServicesProvider";
import { appTheme, colors, radii } from "../shared/ui/theme";

const isWeb = Platform.OS === "web";

function sheetOptions(
  detents: number[] | "fitToContents",
): NativeStackNavigationOptions {
  return {
    animation: isWeb ? "fade" : "default",
    contentStyle: {
      backgroundColor: isWeb ? "transparent" : colors.surface,
    },
    headerShown: false,
    presentation: isWeb ? "transparentModal" : "formSheet",
    ...(isWeb
      ? {}
      : {
          sheetAllowedDetents: detents,
          sheetCornerRadius: radii.xl,
          sheetGrabberVisible: true,
        }),
  };
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={appTheme}>
        <RoutineServicesProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.background },
              headerBackButtonDisplayMode: "minimal",
              headerShadowVisible: false,
              headerStyle: { backgroundColor: colors.surface },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: "700" },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="routines/new" options={sheetOptions([1])} />
            <Stack.Screen
              name="routines/[id]/index"
              options={{ title: "Rutina" }}
            />
            <Stack.Screen
              name="routines/[id]/edit"
              options={{ title: "Editar nombre" }}
            />
            <Stack.Screen
              name="sheets/assign-routine"
              options={sheetOptions([0.6, 1])}
            />
            <Stack.Screen
              name="sheets/duplicate-routine"
              options={sheetOptions("fitToContents")}
            />
            <Stack.Screen
              name="sheets/recurring-days"
              options={sheetOptions("fitToContents")}
            />
            <Stack.Screen
              name="sheets/exercise"
              options={sheetOptions([0.6, 1])}
            />
          </Stack>
        </RoutineServicesProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
