import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { Court } from "@/src/types";
import { isNarrowScreen } from "@/src/utils/screenUtil";
import { getPlayerRating } from "./PlayerButton";

export interface CourtButtonProps {
  court: Court;
  disabled: boolean;
  onPress?: () => void;
}

export const CourtButton: React.FC<CourtButtonProps> = ({
  court,
  disabled,
  onPress,
}) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={{
        borderRadius: 8,
        borderWidth: 1,
        borderStyle: "dotted",
        paddingVertical: 12,
        //paddingVertical: isNarrowScreen() ? 8 : 12,
        //paddingHorizontal: 16,
        paddingHorizontal: isNarrowScreen() ? 12 : 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        //shadowOpacity: 0.2,
        shadowOpacity: 0.4,
        shadowRadius: 2,
        // backgroundColor: theme.colors.secondaryContainer,
        borderColor: theme.colors.outline,
        // borderColor: selected
        //   ? theme.colors.tertiary
        //   : theme.colors.secondary,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View style={styles.content}>
        {court.isActive && (
          <Text
            variant="titleMedium"
            style={{
              fontWeight: "600",
            }}
          >
            {court.name}
          </Text>
        )}
        {!court.isActive && (
          <Text
            variant="titleMedium"
            style={{
              fontWeight: "600",
              textDecorationLine: "line-through",
            }}
          >
            {court.name}
          </Text>
        )}
        <View style={styles.bottomRow}>
          {court.minimumRating && getPlayerRating(court.minimumRating, theme)}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  content: {
    flexDirection: "column",
  },
  bottomRow: {
    flexDirection: "row",
    alignSelf: "flex-end",
    gap: 2,
  },
});
