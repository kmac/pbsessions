import React from "react";
import { Stack } from "expo-router";

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        //gestureEnabled: false,
      }}
    >
      <Stack.Screen
        name="between-rounds"
        options={{
          presentation: "pageSheet",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-session"
        options={{
          presentation: "pageSheet",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="view-session"
        options={{
          presentation: "pageSheet",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="archived-sessions"
        options={{
          presentation: "pageSheet",
          headerShown: false,
        }}
      />
    </Stack>
  );
}
