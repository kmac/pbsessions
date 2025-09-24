import { StyleSheet, View } from "react-native";
import { Card, Chip, Text, useTheme } from "react-native-paper";
import { Player, PlayerStats } from "@/src/types";
import { getPlayer, getPlayerName } from "@/src/utils/util";

interface PlayerStatsCardProps {
  stats: PlayerStats;
  players: Player[];
  narrowScreen: Boolean;
}

// TODO NOT USED

export default function PlayerStatsCard({
  stats,
  players,
  narrowScreen: isNarrowScreen,
}: PlayerStatsCardProps) {
  const theme = useTheme();

  const totalParticipation = stats.gamesPlayed + stats.gamesSatOut;
  const playingPercentage =
    totalParticipation > 0 ? (stats.gamesPlayed / totalParticipation) * 100 : 0;

  const renderPlayer = (item: Player) => {
    return (
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
          <Text variant="titleMedium" style={{ flex: 2, fontWeight: "600" }}>
            {item.name}
          </Text>
          {item.rating && (
            <Chip
              icon="star-outline"
              style={{ backgroundColor: theme.colors.secondaryContainer }}
            >
              <Text variant="labelSmall">{item.rating.toFixed(2)}</Text>
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
    );
  };

  return (
    <Card style={styles.playerStatsCard}>
      <Card.Content>
        {renderPlayer(getPlayer(players, stats.playerId))}

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Games
            </Text>
            <Text variant="titleLarge">{stats.gamesPlayed}</Text>
          </View>

          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Sat Out
            </Text>
            <Text variant="titleLarge">{stats.gamesSatOut}</Text>
          </View>

          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              {isNarrowScreen ? "Points" : "Points For"}
            </Text>
            <Text variant="titleLarge">{stats.totalScore}</Text>
          </View>

          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              {isNarrowScreen ? "Against" : "Points Against"}
            </Text>
            <Text variant="titleLarge">{stats.totalScoreAgainst}</Text>
          </View>

          {stats.averageRating && (
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>
                Avg Rating
              </Text>
              <Text variant="titleLarge">
                {stats.averageRating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>
        {Object.keys(stats.partners).length > 0 && (
          <View style={styles.partnersContainer}>
            <Text variant="labelMedium" style={styles.partnersLabel}>
              Partners:
            </Text>
            <View style={styles.partnersChips}>
              {Object.entries(stats.partners)
                .map(([partnerId, count]) => ({
                  partnerId,
                  count,
                  name: getPlayerName(players, partnerId),
                }))
                .sort((a, b) => {
                  // First sort by count (descending - highest count first)
                  if (a.count !== b.count) {
                    return b.count - a.count;
                  }
                  // Then sort alphabetically by name
                  return a.name.localeCompare(b.name);
                })
                .map(({ partnerId, count, name }) => (
                  <Chip key={partnerId} compact style={styles.partnerChip}>
                    <Text variant="bodySmall" style={{ fontWeight: "bold" }}>
                      {name} ({count})
                    </Text>
                  </Chip>
                ))}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    padding: 16,
    elevation: 1,
  },
  sessionName: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  sessionInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  stateChip: {
    alignSelf: "flex-start",
  },
  sessionMetrics: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  tabContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  listContainer: {
    padding: 16,
  },
  gameCard: {
    marginVertical: 4,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 12,
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  team: {
    flexDirection: "column",
    alignItems: "center",
    minWidth: 80,
  },
  teamLabel: {
    fontWeight: "600",
    marginBottom: 2,
  },
  scoreContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  statusChip: {
    alignSelf: "center",
    marginTop: 8,
  },
  sittingOutContainer: {
    margin: 16,
    padding: 12,
    //backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 8,
  },
  sittingOutLabel: {
    fontWeight: "600",
    marginBottom: 4,
  },
  playerStatsCard: {
    marginBottom: 12,
  },
  playerName: {
    fontWeight: "bold",
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
    minWidth: 50,
  },
  statLabel: {
    marginBottom: 4,
    textAlign: "center",
  },
  partnersContainer: {
    marginTop: 8,
  },
  partnersLabel: {
    marginBottom: 8,
  },
  partnersChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  partnerChip: {
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
