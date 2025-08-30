import React, { useState } from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Card,
  Chip,
  List,
  SegmentedButtons,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useAppSelector } from "@/src/store";
import { Session, Game, PlayerStats, Round } from "@/src/types";

interface ViewSessionModalProps {
  session: Session | null;
  onCancel: () => void;
}

export default function ViewSessionModal({
  session,
  onCancel,
}: ViewSessionModalProps) {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState("rounds");

  const { players } = useAppSelector((state) => state.players);

  if (!session) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    return player?.name || "Unknown Player";
  };

  const getCourtName = (courtId: string) => {
    const court = session.courts.find((c) => c.id === courtId);
    return court?.name || "Unknown Court";
  };

  const getSessionPlayers = () => {
    return players.filter((player) => session.playerIds.includes(player.id));
  };

  const renderGame = (game: Game) => (
    <Card key={game.id} style={styles.gameCard}>
      <Card.Content>
        <View style={styles.gameHeader}>
          <Chip
            compact
            style={{ backgroundColor: theme.colors.tertiaryContainer }}
          >
            {getCourtName(game.courtId)}
          </Chip>
        </View>

        <View style={styles.teamsContainer}>
          <View style={styles.team}>
            <Chip compact style={styles.partnerChip}>
              {getPlayerName(game.serveTeam.player1Id)}
            </Chip>
            <Chip compact style={styles.partnerChip}>
              {getPlayerName(game.serveTeam.player2Id)}
            </Chip>
          </View>

          <Chip
            compact
            style={[
              styles.statusChip,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            {game.score
              ? `${game.score.serveScore} - ${game.score.receiveScore}`
              : "vs."}
          </Chip>

          <View style={styles.team}>
            <Chip compact style={styles.partnerChip}>
              {getPlayerName(game.receiveTeam.player1Id)}
            </Chip>
            <Chip compact style={styles.partnerChip}>
              {getPlayerName(game.receiveTeam.player2Id)}
            </Chip>
          </View>
        </View>

        {!game.isCompleted && (
          <Chip
            icon="check-circle"
            compact
            style={[
              styles.statusChip,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            Incomplete
          </Chip>
        )}
      </Card.Content>
    </Card>
  );

  const renderRound = ({ item, index }: { item: Round; index: number }) => (
    <List.Accordion
      title={`Round ${index + 1}`}
      //description={`${item.games.length} games`}
      right={(props) => <View style={{flexDirection: "row"}}><Text style={{marginRight: 10}}>{item.games.length} games</Text><List.Icon {...props} icon="chevron-down" /></View>}
      left={(props) => <List.Icon {...props} icon="view-list" />}
      id={index}
    >
      {item.games.map(renderGame)}

      {item.sittingOutIds.length > 0 && (
        <View style={styles.sittingOutContainer}>
          <Text variant="labelMedium" style={styles.sittingOutLabel}>
            Sat Out:
          </Text>
          <Text variant="bodySmall">
            {item.sittingOutIds.map(getPlayerName).join(", ")}
          </Text>
        </View>
      )}
    </List.Accordion>
  );

  const renderPlayerStats = ({ item }: { item: PlayerStats }) => (
    <Card style={styles.playerStatsCard}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.playerName}>
          {getPlayerName(item.playerId)}
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Games Played
            </Text>
            <Text variant="titleMedium">{item.gamesPlayed}</Text>
          </View>

          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Games Sat Out
            </Text>
            <Text variant="titleMedium">{item.gamesSatOut}</Text>
          </View>

          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>
              Total Score
            </Text>
            <Text variant="titleMedium">{item.totalScore}</Text>
          </View>

          {item.averageRating && (
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>
                Avg Rating
              </Text>
              <Text variant="titleMedium">{item.averageRating.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {Object.keys(item.partners).length > 0 && (
          <View style={styles.partnersContainer}>
            <Text variant="labelMedium" style={styles.partnersLabel}>
              Partners:
            </Text>
            <View style={styles.partnersChips}>
              {Object.entries(item.partners).map(([partnerId, count]) => (
                <Chip key={partnerId} compact style={styles.partnerChip}>
                  {getPlayerName(partnerId)} ({count})
                </Chip>
              ))}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );

  const rounds = session.liveData?.rounds || [];
  const playerStats = session.liveData?.playerStats || [];

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={onCancel} />
        <Appbar.Content title="Session Details" />
      </Appbar.Header>

      <Surface style={styles.headerContainer}>
        <Text variant="headlineSmall" style={styles.sessionName}>
          {session.name}
        </Text>

        <View style={styles.sessionInfo}>
          <View style={styles.sessionMetrics}>
            <Chip icon="account-group" compact>
              {session.playerIds.length} players
            </Chip>
            <Chip icon="map-marker-outline" compact>
              {session.courts.filter((c) => c.isActive).length} courts
            </Chip>
            {session.scoring && (
              <Chip icon="scoreboard" compact>
                Scoring
              </Chip>
            )}
          </View>
          <Text variant="bodyMedium">
            {formatDate(session.dateTime)} at {formatTime(session.dateTime)}
          </Text>
          <Chip compact style={styles.stateChip}>
            {session.state}
          </Chip>
        </View>
      </Surface>

      <View style={styles.tabContainer}>
        <SegmentedButtons
          value={activeTab}
          onValueChange={setActiveTab}
          buttons={[
            {
              value: "rounds",
              label: "Rounds",
              icon: "view-list",
            },
            {
              value: "stats",
              label: "Player Stats",
              icon: "chart-line",
            },
          ]}
        />
      </View>

      {activeTab === "rounds" ? (
        rounds.length > 0 ? (
          <List.AccordionGroup>
            <FlatList
              data={rounds}
              renderItem={renderRound}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={styles.listContainer}
              ListFooterComponent={
                <View>
                  <Text
                    variant="titleSmall"
                    style={{
                      color: theme.colors.onSurfaceVariant,
                      marginTop: 12,
                      marginHorizontal: 22,
                    }}
                  >
                    Players:
                  </Text>
                  <Text
                    variant="bodySmall"
                    //numberOfLines={2}
                    //style={{ color: theme.colors.onSurfaceVariant, margin: 16 }}
                    style={{ marginHorizontal: 22 }}
                  >
                    {getSessionPlayers()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => p.name)
                      .join(", ")}
                  </Text>
                </View>
              }
            />
          </List.AccordionGroup>
        ) : (
          <View style={styles.emptyContainer}>
            <Text variant="bodyMedium">No rounds available</Text>
          </View>
        )
      ) : playerStats.length > 0 ? (
        <FlatList
          data={playerStats}
          renderItem={renderPlayerStats}
          keyExtractor={(item) => item.playerId}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text variant="bodyMedium">No player stats available</Text>
        </View>
      )}
    </SafeAreaView>
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
    gap: 16,
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
    // TODO: fix for theme:
    backgroundColor: "#f5f5f5",
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
    minWidth: 80,
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
