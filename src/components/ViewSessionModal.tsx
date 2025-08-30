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

  const renderGame = (game: Game) => (
    <Card key={game.id} style={styles.gameCard}>
      <Card.Content>
        <View style={styles.gameHeader}>
          <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
            Game {game.gameNumber}
          </Text>
          <Chip compact>
            {getCourtName(game.courtId)}
          </Chip>
        </View>

        <View style={styles.teamsContainer}>
          <View style={styles.team}>
            {/*<Text variant="bodyMedium" style={styles.teamLabel}>
              Serve Team:
            </Text>*/}
            <Text variant="bodySmall">
              {getPlayerName(game.serveTeam.player1Id)} & {getPlayerName(game.serveTeam.player2Id)}
            </Text>
          </View>

          <View style={styles.team}>
            {/*<Text variant="bodyMedium" style={styles.teamLabel}>
              Receive Team:
            </Text>*/}
            <Text variant="bodySmall">
              {getPlayerName(game.receiveTeam.player1Id)} & {getPlayerName(game.receiveTeam.player2Id)}
            </Text>
          </View>
        </View>

        {!game.score && (
          <View style={styles.scoreContainer}>
            <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
              Score: n/a - n/a
            </Text>
          </View>
        )}

        {game.score && (
          <View style={styles.scoreContainer}>
            <Text variant="titleMedium" style={{ color: theme.colors.primary }}>
              Score: {game.score?.serveScore} - {game.score.receiveScore}
            </Text>
          </View>
        )}

        {false && game.isCompleted && (
          <Chip
            icon="check-circle"
            compact
            style={[styles.statusChip, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            Completed
          </Chip>
        )}
      </Card.Content>
    </Card>
  );

  const renderRound = ({ item, index }: { item: Round; index: number }) => (
    <List.Accordion
      title={`Round ${index + 1}`}
      description={`${item.games.length} games${item.sittingOutIds.length > 0 ? ` • ${item.sittingOutIds.length} sitting out` : ""}`}
      left={(props) => <List.Icon {...props} icon="view-list" />}
      id={index}
    >
      {item.games.map(renderGame)}

      {item.sittingOutIds.length > 0 && (
        <View style={styles.sittingOutContainer}>
          <Text variant="labelMedium" style={styles.sittingOutLabel}>
            Sitting Out:
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
            <Text variant="bodySmall" style={styles.statLabel}>Games Played</Text>
            <Text variant="titleMedium">{item.gamesPlayed}</Text>
          </View>

          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Games Sat Out</Text>
            <Text variant="titleMedium">{item.gamesSatOut}</Text>
          </View>

          <View style={styles.statItem}>
            <Text variant="bodySmall" style={styles.statLabel}>Total Score</Text>
            <Text variant="titleMedium">{item.totalScore}</Text>
          </View>

          {item.averageRating && (
            <View style={styles.statItem}>
              <Text variant="bodySmall" style={styles.statLabel}>Avg Rating</Text>
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
          <Text variant="bodyMedium">
            {formatDate(session.dateTime)} at {formatTime(session.dateTime)}
          </Text>
          <Chip compact style={styles.stateChip}>
            {session.state}
          </Chip>
        </View>

        <View style={styles.sessionMetrics}>
          <Chip icon="account-group" compact>
            {session.playerIds.length} players
          </Chip>
          <Chip icon="map-marker-outline" compact>
            {session.courts.filter(c => c.isActive).length} courts
          </Chip>
          {session.scoring && (
            <Chip icon="scoreboard" compact>
              Scoring
            </Chip>
          )}
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
            />
          </List.AccordionGroup>
        ) : (
          <View style={styles.emptyContainer}>
            <Text variant="bodyMedium">No rounds available</Text>
          </View>
        )
      ) : (
        playerStats.length > 0 ? (
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
        )
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
    marginHorizontal: 16,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  teamsContainer: {
    marginBottom: 12,
  },
  team: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 4,
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
    alignSelf: "flex-start",
    marginTop: 8,
  },
  sittingOutContainer: {
    margin: 16,
    padding: 12,
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
    marginRight: 4,
    marginBottom: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
