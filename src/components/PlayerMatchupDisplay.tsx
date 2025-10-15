import React, { useState, useMemo } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  Icon,
  Text,
  Surface,
  DataTable,
  Searchbar,
  Card,
  useTheme,
  Divider,
  SegmentedButtons,
} from "react-native-paper";
import Dropdown from "react-native-input-select";
import { Score, Session, Player } from "@/src/types";
import {
  generateSessionMatchupData,
  PlayerMatchupStats,
  SessionMatchupData,
} from "@/src/services/matchupService";
import { getSessionPlayers, getPlayerName } from "@/src/utils/util";
import { useAppSelector } from "@/src/store";
import { isNarrowScreen } from "@/src/utils/screenUtil";

interface PlayerMatchupDisplayProps {
  session: Session;
}

interface MatchupTableRow {
  playerId: string;
  playerName: string;
  partnered: number;
  partneredWins: number;
  partneredLosses: number;
  against: number;
  againstWins: number;
  againstLosses: number;
  sameCourt: number;
  winPercentage: number;
}

interface GamePartnerInfo {
  gameIndex: number;
  partnerId: string;
  partnerName: string;
  courtName: string;
  roundIndex: number;
}

interface GameOpponentInfo {
  gameIndex: number;
  opponent1Id: string;
  opponent1Name: string;
  opponent2Id: string;
  opponent2Name: string;
  courtName: string;
  roundIndex: number;
}

interface RoundParticipation {
  roundNumber: number;
  participated: boolean;
  partnerId?: string;
  partnerName?: string;
  opponent1Id?: string;
  opponent1Name?: string;
  opponent2Id?: string;
  opponent2Name?: string;
  score?: string; // from perspective of player
  courtName?: string;
}

type ViewMode = "summary" | "detailed";

const useStyles = () => {
  const theme = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          padding: 16,
        },
        playerSelector: {
          marginBottom: 16,
        },
        sectionTitle: {
          marginBottom: 12,
          fontWeight: "600",
        },
        selectorTitle: {
          marginBottom: 8,
          fontWeight: "600",
        },
        viewModeSelector: {
          marginBottom: 16,
        },
        summaryCard: {
          marginBottom: 16,
        },
        summaryTitle: {
          marginBottom: 16,
          textAlign: "center",
          fontWeight: "600",
        },
        summaryGrid: {
          flexDirection: "row",
          justifyContent: "space-around",
          marginBottom: 16,
        },
        statItem: {
          alignItems: "center",
          flex: 1,
        },
        statNumber: {
          fontWeight: "bold",
          marginBottom: 4,
        },
        statLabel: {
          textAlign: "center",
          opacity: 0.7,
        },
        divider: {
          marginVertical: 16,
        },
        detailGrid: {
          gap: 12,
        },
        detailItem: {
          gap: 4,
        },
        gameList: {
          marginTop: 8,
          paddingLeft: 8,
        },
        gameListItem: {
          marginBottom: 4,
          opacity: 0.8,
        },
        satOutItem: {
          opacity: 0.5,
          fontStyle: "italic",
        },
        gameTable: {
          borderWidth: 1,
          borderColor: theme.colors.outline,
          borderRadius: 8,
          overflow: "hidden",
        },
        tableHeader: {
          flexDirection: "row",
          backgroundColor: theme.colors.surfaceVariant,
          paddingVertical: 12,
          paddingHorizontal: 8,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outline,
        },
        tableHeaderText: {
          fontWeight: "bold",
          fontSize: 14,
          color: theme.colors.onSurface,
        },
        tableRow: {
          flexDirection: "row",
          paddingVertical: 10,
          paddingHorizontal: 8,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.outlineVariant,
        },
        evenRow: {
          backgroundColor: theme.colors.surfaceVariant,
        },
        satOutRow: {
          backgroundColor: theme.colors.tertiaryContainer,
        },
        tableCellText: {
          fontSize: 13,
          color: theme.colors.onSurfaceVariant,
        },
        roundColumn: {
          flex: 1,
          textAlign: "center",
        },
        partnerColumn: {
          flex: 2,
        },
        opponentsColumn: {
          flex: 3,
        },
        courtColumn: {
          flex: 1.5,
          justifyContent: "center",
        },
        scoreText: {
          fontSize: 12,
          fontWeight: "600",
          color: theme.colors.primary,
          marginBottom: 2,
        },
        emptyCard: {
          marginTop: 32,
        },
        emptyContent: {
          alignItems: "center",
          paddingVertical: 32,
        },
        emptyTitle: {
          marginBottom: 8,
          textAlign: "center",
        },
        emptyText: {
          textAlign: "center",
          opacity: 0.7,
        },
        statusColumn: {
          flex: 1.5,
        },
        detailsColumn: {
          flex: 4,
        },
        emptyListText: {
          fontStyle: "italic",
          opacity: 0.6,
        },
        detailedView: {
          flex: 1,
        },
        searchbar: {
          marginBottom: 16,
        },
        playerColumn: {
          flex: 2,
        },
        numberColumn: {
          flex: 1,
          minWidth: 60,
        },
        subText: {
          opacity: 0.6,
        },
        heatmapContainer: {
          marginTop: 16,
        },
        heatmapSubtitle: {
          marginBottom: 16,
          opacity: 0.7,
        },
        heatmapRow: {
          flexDirection: "row",
        },
        heatmapCell: {
          width: 60,
          height: 40,
          justifyContent: "center",
          alignItems: "center",
          borderWidth: 0.5,
          borderColor: theme.colors.outlineVariant,
        },
        heatmapHeaderCell: {
          backgroundColor: theme.colors.surfaceVariant,
        },
        heatmapHeaderText: {
          fontWeight: "600",
          textAlign: "center",
        },
      }),
    [theme],
  );
};

export const PlayerMatchupDisplay: React.FC<PlayerMatchupDisplayProps> = ({
  session,
}) => {
  const styles = useStyles();
  const theme = useTheme();
  const { players } = useAppSelector((state) => state.players);
  const ALL = "all";
  const [selectedPlayerId, setSelectedPlayerId] = useState<any>(ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("summary");

  const isPlayerSelected = () => {
    return selectedPlayerId && selectedPlayerId !== ALL;
  };

  const sessionPlayers = getSessionPlayers(session, players);

  const matchupData = useMemo(
    () => generateSessionMatchupData(session),
    [session],
  );

  const dropdownOptions = useMemo(() => {
    const allPlayersOption = {
      label: "All Players (Heatmap View)",
      value: ALL,
    };
    const playerOptions = sessionPlayers.map((player) => ({
      value: player.id,
      label: player.name,
    }));

    return [
      allPlayersOption,
      ...playerOptions.sort((a, b) => a.label.localeCompare(b.label)),
    ];
  }, [sessionPlayers]);

  // Get comprehensive round-by-round participation for selected player
  const selectedPlayerRoundParticipation = useMemo(() => {
    if (!isPlayerSelected() || !session.liveData) return [];

    const roundParticipation: RoundParticipation[] = [];

    session.liveData.rounds.forEach((round, roundIndex) => {
      let participated = false;
      let partnerId: string | undefined;
      let opponent1Id: string | undefined;
      let opponent2Id: string | undefined;
      let score: string | undefined;
      let courtName: string | undefined;

      // Check all games in this round for the selected player
      for (const game of round.games) {
        const isServePlayer1 = game.serveTeam.player1Id === selectedPlayerId;
        const isServePlayer2 = game.serveTeam.player2Id === selectedPlayerId;
        const isReceivePlayer1 =
          game.receiveTeam.player1Id === selectedPlayerId;
        const isReceivePlayer2 =
          game.receiveTeam.player2Id === selectedPlayerId;

        const playerInGame =
          isServePlayer1 ||
          isServePlayer2 ||
          isReceivePlayer1 ||
          isReceivePlayer2;

        if (playerInGame) {
          participated = true;
          const court = session.courts.find((c) => c.id === game.courtId);
          courtName = court?.name || "Unknown Court";

          // Get partner
          if (isServePlayer1) {
            partnerId = game.serveTeam.player2Id;
          } else if (isServePlayer2) {
            partnerId = game.serveTeam.player1Id;
          } else if (isReceivePlayer1) {
            partnerId = game.receiveTeam.player2Id;
          } else if (isReceivePlayer2) {
            partnerId = game.receiveTeam.player1Id;
          }

          // Get opponents
          if (isServePlayer1 || isServePlayer2) {
            // Player is on serve team, opponents are on receive team
            opponent1Id = game.receiveTeam.player1Id;
            opponent2Id = game.receiveTeam.player2Id;
            if (game.score) {
              let result =
                game.score.serveScore > game.score.receiveScore ? "W" : "L";
              score = `${result}: ${game.score.serveScore} - ${game.score.receiveScore}`;
            }
          } else {
            // Player is on receive team, opponents are on serve team
            opponent1Id = game.serveTeam.player1Id;
            opponent2Id = game.serveTeam.player2Id;
            if (game.score) {
              let result =
                game.score.serveScore < game.score.receiveScore ? "W" : "L";
              score = `${result}: ${game.score.receiveScore} - ${game.score.serveScore}`;
            }
          }
          break; // Player found in this round, no need to check other games
        }
      }

      roundParticipation.push({
        roundNumber: roundIndex + 1,
        participated,
        partnerId,
        partnerName: partnerId ? getPlayerName(players, partnerId) : undefined,
        opponent1Id,
        opponent1Name: opponent1Id
          ? getPlayerName(players, opponent1Id)
          : undefined,
        opponent2Id,
        opponent2Name: opponent2Id
          ? getPlayerName(players, opponent2Id)
          : undefined,
        score: score,
        courtName,
      });
    });

    return roundParticipation;
  }, [selectedPlayerId, session, players]);

  // Get count of rounds played and sat out
  const playerStats = useMemo(() => {
    const played = selectedPlayerRoundParticipation.filter(
      (r) => r.participated,
    ).length;
    const satOut = selectedPlayerRoundParticipation.filter(
      (r) => !r.participated,
    ).length;
    const total = selectedPlayerRoundParticipation.length;

    return { played, satOut, total };
  }, [selectedPlayerRoundParticipation]);

  // Get selected player's matchups
  const selectedPlayerMatchups = useMemo(() => {
    if (!isPlayerSelected() || !matchupData[selectedPlayerId]) return [];

    const playerMatchups = matchupData[selectedPlayerId];
    return Object.entries(playerMatchups)
      .map(([playerId, stats]) => {
        const player = sessionPlayers.find((p) => p.id === playerId);
        if (!player) return null;

        const totalGames = stats.partneredCount + stats.againstCount;
        const totalWins = stats.partneredWins + stats.againstWins;
        const winPercentage =
          totalGames > 0 ? (totalWins / totalGames) * 100 : 0;

        return {
          playerId,
          playerName: player.name,
          partnered: stats.partneredCount,
          partneredWins: stats.partneredWins,
          partneredLosses: stats.partneredLosses,
          against: stats.againstCount,
          againstWins: stats.againstWins,
          againstLosses: stats.againstLosses,
          sameCourt: stats.sameCourtCount,
          winPercentage,
        } as MatchupTableRow;
      })
      .filter((row): row is MatchupTableRow => row !== null)
      .filter(
        (row) =>
          searchQuery === "" ||
          row.playerName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      .sort((a, b) => b.sameCourt - a.sameCourt);
  }, [selectedPlayerId, matchupData, sessionPlayers, searchQuery]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!isPlayerSelected()) return null;

    const stats = selectedPlayerMatchups.reduce(
      (acc, row) => ({
        totalPartnerships: acc.totalPartnerships + row.partnered,
        totalOppositions: acc.totalOppositions + row.against,
        totalCourtTime: acc.totalCourtTime + row.sameCourt,
        totalWins: acc.totalWins + row.partneredWins + row.againstWins,
        totalLosses: acc.totalLosses + row.partneredLosses + row.againstLosses,
        uniquePartners: acc.uniquePartners + (row.partnered > 0 ? 1 : 0),
        uniqueOpponents: acc.uniqueOpponents + (row.against > 0 ? 1 : 0),
      }),
      {
        totalPartnerships: 0,
        totalOppositions: 0,
        totalCourtTime: 0,
        totalWins: 0,
        totalLosses: 0,
        uniquePartners: 0,
        uniqueOpponents: 0,
      },
    );

    const totalGames = stats.totalPartnerships + stats.totalOppositions;
    const winPercentage =
      totalGames > 0 ? (stats.totalWins / totalGames) * 100 : 0;

    return { ...stats, totalGames, winPercentage };
  }, [selectedPlayerMatchups, selectedPlayerId]);

  const renderPlayerSelector = () => (
    <View style={styles.playerSelector}>
      <Text
        variant="titleSmall"
        style={[styles.selectorTitle, { color: theme.colors.onSurface }]}
      >
        Select Player to View Matchups
      </Text>
      <Dropdown
        options={dropdownOptions}
        selectedValue={selectedPlayerId || ALL}
        onValueChange={(value) => {
          setSelectedPlayerId(value || "");
        }}
        isSearchable={true}
        placeholder="Select a player..."
        dropdownIconStyle={{ top: 24, right: 20 }}
        dropdownStyle={{
          borderColor: theme.colors.outline,
          borderRadius: 8,
          minHeight: 40,
          backgroundColor: theme.colors.surface,
        }}
        dropdownContainerStyle={{
          borderColor: theme.colors.outline,
          backgroundColor: theme.colors.surface,
        }}
        selectedItemStyle={{
          color: theme.colors.onSurface,
          backgroundColor: theme.colors.surface,
        }}
        placeholderStyle={{
          color: theme.colors.onSurfaceVariant,
        }}
        // dropdownIconStyle={{
        //   tintColor: theme.colors.onSurfaceVariant,
        // }}
        // listItemLabelStyle={{
        //   color: theme.colors.onSurface,
        // }}
        // modalBackgroundStyle={{
        //   backgroundColor: theme.colors.backdrop,
        // }}
        // searchInputStyle={{
        //   color: theme.colors.onSurface,
        //   borderColor: theme.colors.outline,
        //   backgroundColor: theme.colors.surface,
        // }}
        // checkboxComponentStyles={{
        //   checkboxStyle: {
        //     backgroundColor: theme.colors.primary,
        //     borderColor: theme.colors.primary,
        //   },
        //   checkboxLabelStyle: {
        //     color: theme.colors.onSurface,
        //   },
        // }}
      />
    </View>
  );

  const renderViewModeSelector = () => {
    if (!isPlayerSelected()) return null;

    return (
      <SegmentedButtons
        value={viewMode}
        onValueChange={(value) => setViewMode(value as ViewMode)}
        buttons={[
          { value: "summary", label: "Summary" },
          { value: "detailed", label: "Details" },
        ]}
        style={styles.viewModeSelector}
      />
    );
  };

  const renderSummaryView = () => {
    if (!summaryStats || !isPlayerSelected()) return null;

    const selectedPlayer = sessionPlayers.find(
      (p) => p.id === selectedPlayerId,
    );

    return (
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.summaryTitle}>
            {selectedPlayer?.name} - Session Summary
          </Text>

          <View style={styles.summaryGrid}>
            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {playerStats.total}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Total Rounds
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {playerStats.played}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Rounds Played
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {playerStats.satOut}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Rounds Sat Out
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {summaryStats.winPercentage.toFixed(0)}%
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Win Rate
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text variant="titleMedium">Round-by-Round Summary</Text>

              <View style={styles.gameTable}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.roundColumn]}>
                    Round
                  </Text>
                  <Text style={[styles.tableHeaderText, styles.partnerColumn]}>
                    Partner
                  </Text>
                  <Text
                    style={[styles.tableHeaderText, styles.opponentsColumn]}
                  >
                    Opponents
                  </Text>
                  <Text style={[styles.tableHeaderText, styles.courtColumn]}>
                    {session.scoring ? "Result" : "Court"}
                  </Text>
                </View>

                {/* Table Rows */}
                {selectedPlayerRoundParticipation.map((round, index) => (
                  <View
                    key={index}
                    style={[
                      styles.tableRow,
                      index % 2 === 0 && styles.evenRow,
                      !round.participated && styles.satOutRow,
                    ]}
                  >
                    <Text style={[styles.tableCellText, styles.roundColumn]}>
                      {round.roundNumber}
                    </Text>
                    <Text style={[styles.tableCellText, styles.partnerColumn]}>
                      {round.participated
                        ? round.partnerName || "Unknown"
                        : "Sat Out"}
                    </Text>
                    <Text
                      style={[styles.tableCellText, styles.opponentsColumn]}
                    >
                      {round.participated
                        ? `${round.opponent1Name || "Unknown"}, ${round.opponent2Name || "Unknown"}`
                        : "-"}
                    </Text>
                    <View style={styles.courtColumn}>
                      {round.participated ? (
                        <>
                          {round.score && (
                            <Text
                              style={[styles.tableCellText, styles.scoreText]}
                            >
                              {round.score}
                            </Text>
                          )}
                          <Text style={styles.tableCellText}>
                            {round.courtName || "-"}
                          </Text>
                        </>
                      ) : (
                        <Text style={styles.tableCellText}>-</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderDetailedView = () => {
    if (!isPlayerSelected() || selectedPlayerMatchups.length === 0) return null;

    return (
      <View style={styles.detailedView}>
        <Searchbar
          placeholder="Search players..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchbar}
        />

        <DataTable>
          <DataTable.Header>
            <DataTable.Title style={styles.playerColumn}>
              Player
            </DataTable.Title>
            <DataTable.Title numeric style={styles.numberColumn}>
              Partnered
            </DataTable.Title>
            <DataTable.Title numeric style={styles.numberColumn}>
              Against
            </DataTable.Title>
            {session.scoring && (
              <DataTable.Title numeric style={styles.numberColumn}>
                Win %
              </DataTable.Title>
            )}
            <DataTable.Title numeric style={styles.numberColumn}>
              {isNarrowScreen() ? "Total" : "Court Time"}
            </DataTable.Title>
          </DataTable.Header>

          {selectedPlayerMatchups.map((row) => (
            <DataTable.Row key={row.playerId}>
              <DataTable.Cell style={styles.playerColumn}>
                <Text variant="bodyMedium" numberOfLines={1}>
                  {row.playerName}
                </Text>
              </DataTable.Cell>
              <DataTable.Cell numeric style={styles.numberColumn}>
                <Text variant="bodyMedium">
                  {row.partnered}
                  {session.scoring && row.partnered > 0 && (
                    <Text variant="bodySmall" style={styles.subText}>
                      {"\n"}W:{row.partneredWins} L:{row.partneredLosses}
                    </Text>
                  )}
                </Text>
              </DataTable.Cell>
              <DataTable.Cell numeric style={styles.numberColumn}>
                <Text variant="bodyMedium">
                  {row.against}
                  {session.scoring && row.against > 0 && (
                    <Text variant="bodySmall" style={styles.subText}>
                      {"\n"}W:{row.againstWins} L:{row.againstLosses}
                    </Text>
                  )}
                </Text>
              </DataTable.Cell>
              {session.scoring && (
                <DataTable.Cell numeric style={styles.numberColumn}>
                  <Text variant="bodyMedium">
                    {row.partnered + row.against > 0
                      ? `${row.winPercentage.toFixed(0)}%`
                      : "-"}
                  </Text>
                </DataTable.Cell>
              )}
              <DataTable.Cell numeric style={styles.numberColumn}>
                <Text variant="bodyMedium">{row.sameCourt}</Text>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>
      </View>
    );
  };

  const getHeatmapColor = (value: number, maxValue: number) => {
    if (maxValue === 0) return theme.colors.surface;
    const intensity = value / maxValue;
    return `rgba(${parseInt(theme.colors.primary.slice(1, 3), 16)}, ${parseInt(
      theme.colors.primary.slice(3, 5),
      16,
    )}, ${parseInt(theme.colors.primary.slice(5, 7), 16)}, ${
      0.1 + intensity * 0.8
    })`;
  };

  const renderHeatmapView = () => {
    if (sessionPlayers.length === 0) return null;

    const maxCourtTime = Math.max(
      ...Object.values(matchupData).flatMap((playerMatchups) =>
        Object.values(playerMatchups).map((stats) => stats.sameCourtCount),
      ),
    );

    return (
      <View style={styles.heatmapContainer}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Court Time Heatmap
        </Text>
        <Text variant="bodySmall" style={styles.heatmapSubtitle}>
          Intensity shows total games played on same court
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View>
            {/* Header row */}
            <View style={styles.heatmapRow}>
              <View style={[styles.heatmapCell, styles.heatmapHeaderCell]} />
              {sessionPlayers
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((player) => (
                  <View
                    key={player.id}
                    style={[styles.heatmapCell, styles.heatmapHeaderCell]}
                  >
                    <Text
                      variant="labelSmall"
                      style={styles.heatmapHeaderText}
                      numberOfLines={1}
                    >
                      {player.name.split(" ")[0]}
                    </Text>
                  </View>
                ))}
            </View>

            {/* Data rows */}
            {sessionPlayers.map((rowPlayer) => (
              <View key={rowPlayer.id} style={styles.heatmapRow}>
                <View style={[styles.heatmapCell, styles.heatmapHeaderCell]}>
                  <Text
                    variant="labelSmall"
                    style={styles.heatmapHeaderText}
                    numberOfLines={1}
                  >
                    {rowPlayer.name.split(" ")[0]}
                  </Text>
                </View>
                {sessionPlayers.map((colPlayer) => {
                  const stats = matchupData[rowPlayer.id]?.[colPlayer.id];
                  const value = stats?.sameCourtCount || 0;
                  const isself = rowPlayer.id === colPlayer.id;

                  return (
                    <View
                      key={colPlayer.id}
                      style={[
                        styles.heatmapCell,
                        {
                          backgroundColor: isself
                            ? theme.colors.surfaceVariant
                            : getHeatmapColor(value, maxCourtTime),
                        },
                      ]}
                    >
                      <Text
                        variant="labelSmall"
                        style={{
                          color: isself
                            ? theme.colors.onSurfaceVariant
                            : theme.colors.onSurface,
                          fontWeight: value > 0 ? "bold" : "normal",
                        }}
                      >
                        {isself ? "-" : value > 0 ? value.toString() : ""}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  const hasMatchupData =
    Object.keys(matchupData).length > 0 && sessionPlayers.length > 0;

  if (!hasMatchupData) {
    return (
      <Surface style={styles.container}>
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Matchup Data Available
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Start playing games in this session to see player matchup
              statistics.
            </Text>
          </Card.Content>
        </Card>
      </Surface>
    );
  }

  return (
    <Surface style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderPlayerSelector()}
        {renderViewModeSelector()}

        {/* Show player-specific views when a player is selected */}
        {isPlayerSelected() && viewMode === "summary" && renderSummaryView()}
        {isPlayerSelected() && viewMode === "detailed" && renderDetailedView()}

        {/* Show heatmap when no player is selected */}
        {!isPlayerSelected() && renderHeatmapView()}
      </ScrollView>
    </Surface>
  );
};
