import { Dimensions } from "react-native";

export const isNarrowScreen = (): boolean => {
  const { width: screenWidth } = Dimensions.get("window");
  return screenWidth < 768;
};
