import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { Player, PlayerStats } from "@/src/types";
import {
  getPlayerText,
  getPlayerRating,
  getPartnerDecoration,
} from "./RoundGameCard";
import { isNarrowScreen } from "@/src/utils/screenUtil";

export interface PlayerButtonProps {
  player: Player;
  partner?: Player;
  stats?: PlayerStats;
  selected: boolean;
  disabled: boolean;
  showRating: boolean;
  onPress?: () => void;
}

export const PlayerButton: React.FC<PlayerButtonProps> = ({
  player,
  partner,
  stats,
  selected,
  disabled,
  showRating,
  onPress,
}) => {
  const theme = useTheme();

  const playerName = selected
    ? `${player.name} (${stats?.gamesSatOut || 0})`
    : player.name;

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
        backgroundColor: selected
          ? theme.colors.tertiaryContainer
          : theme.colors.secondaryContainer,
        borderColor: theme.colors.outline,
        // borderColor: selected
        //   ? theme.colors.tertiary
        //   : theme.colors.secondary,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View style={styles.content}>
        {getPlayerText(playerName)}
        <View style={styles.bottomRow}>
          {partner && getPartnerDecoration(theme)}
          {showRating && player.rating && getPlayerRating(player.rating, theme)}
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

