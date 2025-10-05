import { useCallback, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { BackHandler } from "react-native";

// Returning true from onBackPress denotes that we have handled the event, and
// react-navigation's listener will not get called, thus not popping the
// screen. Returning false will cause the event to bubble up and
// react-navigation's listener will pop the screen.

export const useBackHandler = (
  handler: () => boolean,
  deps: any[] = [],
) => {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        return handler();
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => {
        backHandler.remove();
      };
    }, deps),
  );
};
