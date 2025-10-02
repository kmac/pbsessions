import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Badge, Icon, Text, useTheme } from "react-native-paper";
import { Player, PlayerStats } from "@/src/types";
import { isNarrowScreen } from "@/src/utils/screenUtil";

const useBadge = false;
const useTextVariant = true;

export const getPlayerText = (name: string) => {
  if (useTextVariant) {
    const variant = name.length > 12 ? "labelLarge" : "labelLarge";
    //const variant = name.length > 100 ? "titleSmall" : "titleMedium";
    return <Text variant={variant}>{name}</Text>;
  }
  const fontSize = name.length > 12 ? 14 : 15;
  return (
    <Text
      style={{
        fontSize: fontSize,
        fontWeight: "500",
      }}
    >
      {name}
    </Text>
  );
};

export const getPlayerRating = (rating: number, theme: any) => {
  if (useBadge) {
    return (
      <Badge
        size={20}
        style={{
          fontSize: 10,
          color: theme.colors.onPrimary,
          backgroundColor: theme.colors.primary,
        }}
      >
        {rating.toFixed(2)}
      </Badge>
    );
  }
  if (useTextVariant) {
    return (
      <Text
        variant="labelSmall"
        style={{
          color: theme.colors.tertiary,
          //fontSize: 9,
          fontWeight: "400",
          alignSelf: /*"center"*/ "flex-end",
          marginLeft: isNarrowScreen() ? 0 : 8,
        }}
      >
        {rating.toFixed(2)}
      </Text>
    );
  }
  return (
    <Text
      //variant="bodySmall"
      style={{
        color: theme.colors.tertiary,
        fontSize: 9,
        alignSelf: /*"center"*/ "flex-end",
        marginLeft: isNarrowScreen() ? 0 : 8,
      }}
    >
      {rating.toFixed(2)}
    </Text>
  );
};

export const getPartnerDecoration = (theme: any) => {
  const useIcon = true;
  if (useIcon) {
    return <Icon source="vector-link" size={12} color={theme.colors.primary} />;
  } else {
    return (
      <Badge
        size={12}
        style={{
          //fontSize: 10,
          color: theme.colors.onPrimary,
          backgroundColor: theme.colors.primary,
        }}
      >
        P
      </Badge>
    );
  }
};

export interface PlayerButtonProps {
  player: Player;
  partner?: Player;
  stats?: PlayerStats;
  selected: boolean;
  disabled: boolean;
  showRating: boolean;
  icon?: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const PlayerButton: React.FC<PlayerButtonProps> = ({
  player,
  partner,
  stats,
  selected,
  disabled,
  showRating,
  icon,
  onPress,
  onLongPress,
}) => {
  const theme = useTheme();

  const playerName = selected
    ? `${player.name} (${stats?.gamesSatOut || 0})`
    : player.name;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
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
      <View
        style={{
          flexDirection: "column",
        }}
      >
      <View
        style={{
          flexDirection: "row",
        }}
      >
        {icon && <Icon source={icon} size={20} color={theme.colors.tertiary} />}
        {getPlayerText(playerName)}
        </View>
        <View
          style={{
            flexDirection: "row",
            alignSelf: "flex-end",
            gap: 2,
          }}
        >
          {partner && getPartnerDecoration(theme)}
          {showRating && player.rating && getPlayerRating(player.rating, theme)}
        </View>
      </View>
    </TouchableOpacity>
  );
};
