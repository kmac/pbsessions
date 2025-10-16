import React from "react";
import { View } from "react-native";
import { Chip, Icon, Text, useTheme } from "react-native-paper";
import { Clock, Users, BarChart3, UserCheck } from "lucide-react-native";
import { Player, PlayerStats } from "@/src/types";

interface PlayerStatsDisplayProps {
  player: Player;
  stats: PlayerStats;
  allPlayers: Player[];
  compact?: boolean; // For smaller displays like dialogs
  showPlayingPercentage?: boolean;
  showMostFrequentPartner?: boolean;
  showMostFrequentOpponent?: boolean;
}

export const PlayerStatsDisplay: React.FC<PlayerStatsDisplayProps> = ({
  player,
  stats,
  allPlayers,
  compact = false,
  showPlayingPercentage = true,
  showMostFrequentPartner = true,
  showMostFrequentOpponent = true,
}) => {
  const theme = useTheme();

  const totalParticipation = stats.gamesPlayed + stats.gamesSatOut;
  const playingPercentage =
    totalParticipation > 0 ? (stats.gamesPlayed / totalParticipation) * 100 : 0;

  const averageScore =
    stats.gamesPlayed > 0 ? stats.totalScore / stats.gamesPlayed : 0;

  const partnerCount = Object.keys(stats.partners).length;
  const mostFrequentPartner = Object.entries(stats.partners).sort(
    ([, a], [, b]) => b - a,
  )[0];

  const opponentCount = Object.keys(stats.opponents).length;
  const mostFrequentOpponent = Object.entries(stats.opponents).sort(
    ([, a], [, b]) => b - a,
  )[0];

  const getPlayerName = (playerId: string): string => {
    return allPlayers.find((p) => p.id === playerId)?.name || "Unknown";
  };

  const iconSize = compact ? 16 : 20;
  const titleVariant = compact ? "titleSmall" : "titleMedium";

  return (
    <View>
      {/* Playing percentage chip */}
      {showPlayingPercentage && (
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Chip style={{ backgroundColor: theme.colors.primaryContainer }}>
            <Text
              variant="labelMedium"
              style={{ color: theme.colors.onPrimaryContainer }}
            >
              {playingPercentage.toFixed(0)}% playing time
            </Text>
          </Chip>
        </View>
      )}

      {/* Stats grid */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginBottom: 12,
        }}
      >
        <View style={{ alignItems: "center", gap: 4 }}>
          <Icon source="trophy" size={iconSize} color={theme.colors.primary} />
          <Text variant={titleVariant} style={{ fontWeight: "bold" }}>
            {stats.gamesPlayed}
          </Text>
          <Text
            variant="labelSmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            Games
          </Text>
        </View>

        <View style={{ alignItems: "center", gap: 4 }}>
          <Clock size={iconSize} color={theme.colors.onSurfaceVariant} />
          <Text variant={titleVariant} style={{ fontWeight: "bold" }}>
            {stats.gamesSatOut}
          </Text>
          <Text
            variant="labelSmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            Sat Out
          </Text>
        </View>

        <View style={{ alignItems: "center", gap: 4 }}>
          <Icon
            source="trending-up"
            size={iconSize}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant={titleVariant} style={{ fontWeight: "bold" }}>
            {stats.consecutiveGames}
          </Text>
          <Text
            variant="labelSmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            Since Sat
          </Text>
        </View>
      </View>

      {/* Second row of stats */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginBottom: 12,
        }}
      >
        <View style={{ alignItems: "center", gap: 4 }}>
          <Users size={iconSize} color={theme.colors.primary} />
          <Text variant={titleVariant} style={{ fontWeight: "bold" }}>
            {partnerCount}
          </Text>
          <Text
            variant="labelSmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            Partners
          </Text>
        </View>

        <View style={{ alignItems: "center", gap: 4 }}>
          <Users size={iconSize} color={theme.colors.primary} />
          <Text variant={titleVariant} style={{ fontWeight: "bold" }}>
            {opponentCount}
          </Text>
          <Text
            variant="labelSmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            Opponents
          </Text>
        </View>

        <View style={{ alignItems: "center", gap: 4 }}>
          <BarChart3 size={iconSize} color={theme.colors.primary} />
          <Text variant={titleVariant} style={{ fontWeight: "bold" }}>
            {averageScore.toFixed(1)}
          </Text>
          <Text
            variant="labelSmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            Avg Score
          </Text>
        </View>

        <View style={{ alignItems: "center", gap: 4 }}>
          <Icon
            source="account-group"
            size={iconSize}
            color={theme.colors.primary}
          />
          <Text variant={titleVariant} style={{ fontWeight: "bold" }}>
            {stats.totalScore}
          </Text>
          <Text
            variant="labelSmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: "center",
            }}
          >
            Total Score
          </Text>
        </View>
      </View>

      {/* Most frequent partner */}
      {showMostFrequentPartner && mostFrequentPartner && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: theme.colors.outline,
          }}
        >
          <UserCheck size={14} color={theme.colors.onSurfaceVariant} />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Most partnered with{" "}
            <Text
              style={{ fontWeight: "500", color: theme.colors.onSurface }}
            >
              {getPlayerName(mostFrequentPartner[0])}
            </Text>{" "}
            ({mostFrequentPartner[1]} games)
          </Text>
        </View>
      )}

      {/* Most frequent opponent */}
      {showMostFrequentOpponent && mostFrequentOpponent && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: theme.colors.outline,
          }}
        >
          <UserCheck size={14} color={theme.colors.onSurfaceVariant} />
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            Most played against{" "}
            <Text
              style={{ fontWeight: "500", color: theme.colors.onSurface }}
            >
              {getPlayerName(mostFrequentOpponent[0])}
            </Text>{" "}
            ({mostFrequentOpponent[1]} games)
          </Text>
        </View>
      )}
    </View>
  );
};

