import React, { useState } from "react";
import { Dimensions, View, Modal, FlatList, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Chip,
  IconButton,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import {
  Trophy,
  Users,
  Clock,
  Star,
  BarChart3,
  TrendingUp,
  UserCheck,
} from "lucide-react-native";
import { Player, PlayerStats } from "../types";
import { getPlayer } from "@/src/utils/util";
import { isNarrowScreen } from "@/src/utils/screenUtil";
import PlayerStatsCard from "@/src/components/PlayerStatsCard";

interface PlayerStatsModalProps {
  visible: boolean;
  players: Player[];
  stats: PlayerStats[];
  onClose: () => void;
}

type SortOption = "name" | "gamesPlayed" | "gamesSatOut" | "totalScore";

export default function PlayerStatsModal({
  visible,
  players,
  stats,
  onClose,
}: PlayerStatsModalProps) {
  const theme = useTheme();
  const [sortBy, setSortBy] = useState<SortOption>("gamesPlayed");

  const narrowScreen = isNarrowScreen();

  const getPlayerStats = (playerId: string): PlayerStats => {
    return (
      stats.find((s) => s.playerId === playerId) || {
        playerId,
        gamesPlayed: 0,
        gamesSatOut: 0,
        partners: {},
        totalScore: 0,
        totalScoreAgainst: 0,
      }
    );
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const aStats = getPlayerStats(a.id);
    const bStats = getPlayerStats(b.id);

    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "gamesPlayed":
        return bStats.gamesPlayed - aStats.gamesPlayed;
      case "gamesSatOut":
        return bStats.gamesSatOut - aStats.gamesSatOut;
      case "totalScore":
        return bStats.totalScore - aStats.totalScore;
      default:
        return 0;
    }
  });

  const totalGames = Math.max(
    ...stats.map((s) => s.gamesPlayed + s.gamesSatOut),
    0,
  );
  const averageGamesPlayed =
    stats.length > 0
      ? stats.reduce((sum, s) => sum + s.gamesPlayed, 0) / stats.length
      : 0;

  const renderPlayerStat = ({ item }: { item: Player }) => {
    const playerStats = getPlayerStats(item.id);
    const totalParticipation =
      playerStats.gamesPlayed + playerStats.gamesSatOut;
    const playingPercentage =
      totalParticipation > 0
        ? (playerStats.gamesPlayed / totalParticipation) * 100
        : 0;

    const averageScore =
      playerStats.gamesPlayed > 0
        ? playerStats.totalScore / playerStats.gamesPlayed
        : 0;

    const partnerCount = Object.keys(playerStats.partners).length;
    const mostFrequentPartner = Object.entries(playerStats.partners).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return (
      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Text variant="titleMedium" style={{ fontWeight: "600" }}>
                {item.name}
              </Text>
              {item.rating && (
                <Chip
                  icon={() => <Star size={12} color={theme.colors.primary} />}
                  style={{ backgroundColor: theme.colors.secondaryContainer }}
                >
                  <Text variant="labelSmall">{item.rating.toFixed(1)}</Text>
                </Chip>
              )}
            </View>

            <Chip style={{ backgroundColor: theme.colors.primaryContainer }}>
              <Text
                variant="labelMedium"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                {playingPercentage.toFixed(0)}% playing
              </Text>
            </Chip>
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 12,
            }}
          >
            <View style={{ alignItems: "center", gap: 4 }}>
              <Trophy size={16} color={theme.colors.primary} />
              <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
                {playerStats.gamesPlayed}
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
              <Clock size={16} color={theme.colors.onSurfaceVariant} />
              <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
                {playerStats.gamesSatOut}
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
              <Users size={16} color={theme.colors.primary} />
              <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
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
              <BarChart3 size={16} color={theme.colors.primary} />
              <Text variant="titleMedium" style={{ fontWeight: "bold" }}>
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
          </View>

          {mostFrequentPartner && (
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
                  {getPlayer(players, mostFrequentPartner[0])?.name || "Unknown"}
                </Text>{" "}
                ({mostFrequentPartner[1]} games)
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  const SessionSummary = () => (
    <Card style={{ margin: 16 }}>
      <Card.Content>
        <Text
          variant="titleLarge"
          style={{
            fontWeight: "600",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          Session Summary
        </Text>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
          }}
        >
          <View style={{ alignItems: "center", gap: 8 }}>
            <Users size={20} color={theme.colors.primary} />
            <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
              {players.length}
            </Text>
            <Text
              variant="labelMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
              }}
            >
              Total Players
            </Text>
          </View>

          <View style={{ alignItems: "center", gap: 8 }}>
            <Trophy size={20} color={theme.colors.primary} />
            <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
              {totalGames}
            </Text>
            <Text
              variant="labelMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
              }}
            >
              Total Games
            </Text>
          </View>

          <View style={{ alignItems: "center", gap: 8 }}>
            <TrendingUp size={20} color={theme.colors.primary} />
            {/* <Icon size={20} source="trophy" color={theme.colors.primary} /> */}
            <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
              {averageGamesPlayed.toFixed(1)}
            </Text>
            <Text
              variant="labelMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: "center",
              }}
            >
              Avg Games/Player
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <Surface
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
          }}
          elevation={1}
        >
          <IconButton icon="close" size={24} onPress={onClose} />
          <Text variant="titleLarge" style={{ fontWeight: "600" }}>
            Player Statistics
          </Text>
          <View style={{ width: 48 }} />
        </Surface>

        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <SessionSummary />

          {/* Sort Options */}
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 16,
            }}
          >
            <Text
              variant="titleMedium"
              style={{
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              Sort by:
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Button
                mode={sortBy === "name" ? "contained" : "outlined"}
                onPress={() => setSortBy("name")}
                compact={true}
              >
                Name
              </Button>

              <Button
                mode={sortBy === "gamesPlayed" ? "contained" : "outlined"}
                onPress={() => setSortBy("gamesPlayed")}
                compact={true}
              >
                #Games
              </Button>

              <Button
                mode={sortBy === "gamesSatOut" ? "contained" : "outlined"}
                onPress={() => setSortBy("gamesSatOut")}
                compact={true}
              >
                #Sat
              </Button>

              <Button
                mode={sortBy === "totalScore" ? "contained" : "outlined"}
                onPress={() => setSortBy("totalScore")}
                compact={true}
              >
                Score
              </Button>
            </ScrollView>
          </View>

          {/* Player Stats List */}
          {(sortedPlayers || []).map((item) => (
            <PlayerStatsCard
              key={item.id}
              stats={getPlayerStats(item.id)}
              players={players}
              narrowScreen={narrowScreen}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
