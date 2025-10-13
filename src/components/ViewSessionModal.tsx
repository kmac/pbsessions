import React, { useMemo, useState } from "react";
import { View, FlatList, Modal, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
  Chip,
  IconButton,
  List,
  Surface,
  Text,
  useTheme,
  Menu,
  SegmentedButtons,
} from "react-native-paper";
import * as Print from "expo-print";
import { File, Directory, Paths } from "expo-file-system";
import Sharing from "expo-sharing";
import { useAppSelector } from "@/src/store";
import { PlayerStatsModal } from "@/src/components/PlayerStatsModal";
import { PlayerMatchupModal } from "@/src/components/PlayerMatchupModal";
import { RoundComponent } from "@/src/components/RoundComponent";
import { ViewSessionTable } from "@/src/components/ViewSessionTable";
import { Session, SessionState, Game, Round } from "@/src/types";
import { getPlayerName, getSessionPlayers } from "@/src/utils/util";
import { isNarrowScreen } from "@/src/utils/screenUtil";

interface ViewSessionModalProps {
  visible: boolean;
  session: Session | null;
  onCancel: () => void;
}

type ViewMode = "rounds" | "table";

export const ViewSessionModal: React.FC<ViewSessionModalProps> = ({
  visible,
  session,
  onCancel,
}) => {
  const theme = useTheme();

  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [matchupModalVisible, setMatchupModalVisible] = useState(false);
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("rounds");
  const { players } = useAppSelector((state) => state.players);
  const isNarrow = isNarrowScreen();

  if (!session) {
    return null;
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${dateStr} : ${timeStr}`;
  };

  const sessionPlayers = getSessionPlayers(session, players);

  const getPlayerName = (playerId: string) => {
    const player = sessionPlayers.find((p) => p.id === playerId);
    return player ? player.name : `Player ${playerId}`;
  };

  const getCourtName = (courtId: string) => {
    const court = session.courts.find((c) => c.id === courtId);
    return court ? court.name : `Court ${courtId}`;
  };

  const formatScore = (score?: {
    serveScore: number;
    receiveScore: number;
  }) => {
    if (!score) return "No score recorded";
    return `${score.serveScore} - ${score.receiveScore}`;
  };

  const rounds = session.liveData?.rounds || [];
  const playerStats = session.liveData?.playerStats || [];

  // Check if matchup data is available (session has live data with games)
  const hasMatchupData = rounds.some((round) => round.games.length > 0);

  // Toggle individual round expansion
  const toggleRound = (roundIndex: number) => {
    const newExpanded = new Set(expandedRounds);
    if (newExpanded.has(roundIndex)) {
      newExpanded.delete(roundIndex);
    } else {
      newExpanded.add(roundIndex);
    }
    setExpandedRounds(newExpanded);

    // Update allExpanded state based on whether all rounds are now expanded
    setAllExpanded(newExpanded.size === rounds.length);
  };

  // Toggle all rounds
  const toggleAllRounds = () => {
    if (allExpanded) {
      setExpandedRounds(new Set());
      setAllExpanded(false);
    } else {
      setExpandedRounds(new Set(rounds.map((_, index) => index)));
      setAllExpanded(true);
    }
  };

  const expandAllRounds = () => {
    setExpandedRounds(new Set(rounds.map((_, index) => index)));
    setAllExpanded(true);
  };

  const collapseAllRounds = () => {
    setExpandedRounds(new Set());
    setAllExpanded(false);
  };

  const renderRound = ({ item, index }: { item: Round; index: number }) => (
    <List.Accordion
      title={`Round ${index + 1}`}
      expanded={expandedRounds.has(index)}
      onPress={() => toggleRound(index)}
      right={(props) => (
        <View style={{ flexDirection: "row" }}>
          <Text style={{ marginRight: 10 }}>{item.games.length} games</Text>
          <List.Icon
            {...props}
            icon={expandedRounds.has(index) ? "chevron-up" : "chevron-down"}
          />
        </View>
      )}
      left={(props) => <List.Icon {...props} icon="view-list" />}
    >
      <RoundComponent
        session={session}
        editing={false}
        ratingSwitch={false}
        roundIndex={index}
      />
    </List.Accordion>
  );

  const handleBackPress = () => {
    collapseAllRounds();
    setViewMode("rounds");
    onCancel();
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleBackPress}
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
        >
          <Appbar.Header>
            <Appbar.BackAction onPress={handleBackPress} />
            <Appbar.Content
              title={
                <>
                  <Text
                    variant="titleLarge"
                    style={{
                      alignItems: "center",
                      fontWeight: "600",
                    }}
                  >
                    Session Details
                  </Text>
                  <Text
                    variant="titleSmall"
                    style={{
                      alignItems: "center",
                      fontWeight: "400",
                    }}
                  >
                    {session.name}
                  </Text>
                </>
              }
            />
          </Appbar.Header>

          <Surface style={styles.headerContainer}>
            {/* Combined Controls Row */}
            <View style={styles.controlsRow}>
              {/* Left side: Player Stats, Matchups buttons and expand/collapse buttons */}
              <View style={styles.leftControls}>
                <View
                  style={[
                    styles.statsButtons,
                    isNarrow && styles.statsButtonsNarrow,
                  ]}
                >
                  {playerStats.length > 0 && (
                    <Button
                      icon="chart-box"
                      mode="outlined"
                      onPress={() => setStatsModalVisible(true)}
                      compact
                      style={isNarrow && styles.narrowButton}
                      labelStyle={isNarrow && styles.narrowButtonLabel}
                    >
                      {isNarrow ? "Stats" : "Player Stats"}
                    </Button>
                  )}
                  {hasMatchupData && (
                    <Button
                      icon="account-network"
                      mode="outlined"
                      onPress={() => setMatchupModalVisible(true)}
                      compact
                      style={isNarrow && styles.narrowButton}
                      labelStyle={isNarrow && styles.narrowButtonLabel}
                    >
                      {isNarrow ? "Matchups" : "Matchups"}
                    </Button>
                  )}
                </View>
                {viewMode === "rounds" && rounds.length > 0 && (
                  <View style={styles.expandCollapseButtons}>
                    <IconButton
                      icon="expand-all"
                      mode="contained-tonal"
                      size={20}
                      onPress={expandAllRounds}
                    />
                    <IconButton
                      icon="collapse-all"
                      mode="contained-tonal"
                      size={20}
                      onPress={collapseAllRounds}
                    />
                  </View>
                )}
              </View>

              {/* Right side: View mode toggle */}
              {false && rounds.length > 0 && (
                <View style={styles.rightControls}>
                  <SegmentedButtons
                    value={viewMode}
                    onValueChange={(value) => setViewMode(value as ViewMode)}
                    buttons={[
                      {
                        value: "rounds",
                        label: "Rounds",
                        icon: "view-list",
                      },
                      {
                        value: "table",
                        label: "Table",
                        icon: "table",
                      },
                    ]}
                    density="small"
                  />
                </View>
              )}
            </View>
          </Surface>

          {rounds.length === 0 && (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: theme.colors.background,
              }}
            >
              <Text variant="bodyMedium">No rounds available</Text>
            </View>
          )}

          {rounds.length > 0 && viewMode === "rounds" && (
            <FlatList
              data={rounds}
              renderItem={renderRound}
              keyExtractor={(item, index) =>
                `round-${index}-${item.games.length}`
              }
              contentContainerStyle={styles.listContainer}
              ListHeaderComponent={
                <View style={{ flexDirection: "column", marginBottom: 8 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <Text variant="bodyMedium">
                      {formatDate(session.dateTime)}
                    </Text>
                    <Text variant="bodySmall">
                      {session.scoring ? "(Scoring, " : "(No Scoring, "}
                      {session.showRatings ? "Ratings)" : "No Ratings)"}
                    </Text>
                  </View>
                  <View style={styles.sessionInfo}>
                    <View style={styles.sessionMetrics}>
                      <Chip icon="account-group" compact>
                        {session.playerIds.length} players
                      </Chip>
                      <Chip icon="map-marker-outline" compact>
                        {session.courts.filter((c) => c.isActive).length} courts
                      </Chip>
                      {session.state === SessionState.Live ? (
                        <Chip
                          icon="record"
                          style={{
                            alignSelf: "flex-start",
                            backgroundColor: theme.colors.inversePrimary,
                          }}
                          textStyle={{
                            color: theme.colors.primary,
                            fontWeight: "bold",
                          }}
                          compact
                        >
                          LIVE
                        </Chip>
                      ) : (
                        <Chip compact style={styles.stateChip}>
                          {session.state}
                        </Chip>
                      )}
                    </View>
                  </View>
                </View>
              }
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
                  <Text variant="bodySmall" style={{ marginHorizontal: 22 }}>
                    {sessionPlayers
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((p) => p.name)
                      .join(", ")}
                  </Text>
                </View>
              }
            />
          )}

          {rounds.length > 0 && viewMode === "table" && (
            <ViewSessionTable session={session} />
          )}
        </SafeAreaView>
      </Modal>

      <PlayerStatsModal
        visible={statsModalVisible}
        players={sessionPlayers}
        stats={playerStats}
        onClose={() => setStatsModalVisible(false)}
      />

      <PlayerMatchupModal
        visible={matchupModalVisible}
        session={session}
        onClose={() => setMatchupModalVisible(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    padding: 16,
    elevation: 1,
    marginBottom: 2,
  },
  sessionName: {
    fontWeight: "bold",
    marginBottom: 8,
  },
  sessionInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stateChip: {
    alignSelf: "flex-start",
  },
  sessionMetrics: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rightControls: {
    flexShrink: 1,
  },
  statsButtons: {
    flexDirection: "row",
    gap: 8,
  },
  statsButtonsNarrow: {
    gap: 4,
  },
  narrowButton: {
    minWidth: 80,
  },
  narrowButtonLabel: {
    fontSize: 12,
  },
  expandCollapseButtons: {
    flexDirection: "row",
    gap: 4,
  },
  listContainer: {
    padding: 16,
  },
  sittingOutContainer: {
    margin: 16,
    padding: 12,
    borderRadius: 8,
  },
  sittingOutLabel: {
    fontWeight: "600",
    marginBottom: 4,
  },
  partnerChip: {
    marginBottom: 4,
  },
});
