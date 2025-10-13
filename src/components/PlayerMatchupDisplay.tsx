import React, { useState, useMemo } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import {
  Text,
  Surface,
  DataTable,
  Searchbar,
  Chip,
  Card,
  useTheme,
  IconButton,
  Divider,
  SegmentedButtons,
} from "react-native-paper";
import { Session, Player } from "@/src/types";
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

type ViewMode = "summary" | "detailed" | "heatmap";

export const PlayerMatchupDisplay: React.FC<PlayerMatchupDisplayProps> = ({
  session,
}) => {
  const theme = useTheme();
  const { players } = useAppSelector((state) => state.players);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("summary");
  const isNarrow = isNarrowScreen();

  const sessionPlayers = getSessionPlayers(session, players);
  const matchupData = useMemo(
    () => generateSessionMatchupData(session),
    [session],
  );

  // Get selected player's matchups
  const selectedPlayerMatchups = useMemo(() => {
    if (!selectedPlayerId || !matchupData[selectedPlayerId]) return [];

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
    if (!selectedPlayerId) return null;

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
      <Text variant="titleMedium" style={styles.sectionTitle}>
        Select Player to View Matchups
      </Text>
      {/*<ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.playerChipsContainer}
      >*/}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {sessionPlayers.map((player) => (
          <Chip
            key={player.id}
            selected={selectedPlayerId === player.id}
            onPress={() => setSelectedPlayerId(player.id)}
            style={styles.playerChip}
          >
            {player.name}
          </Chip>
        ))}
      </View>
      {/*</ScrollView>*/}
    </View>
  );

  const renderViewModeSelector = () => (
    <SegmentedButtons
      value={viewMode}
      onValueChange={(value) => setViewMode(value as ViewMode)}
      buttons={[
        { value: "summary", label: "Summary" },
        { value: "detailed", label: "Details" },
        { value: "heatmap", label: "Heatmap" },
      ]}
      style={styles.viewModeSelector}
    />
  );

  const renderSummaryView = () => {
    if (!summaryStats || !selectedPlayerId) return null;

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
                {summaryStats.totalGames}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Total Games
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

            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {summaryStats.uniquePartners}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Partners
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text variant="headlineMedium" style={styles.statNumber}>
                {summaryStats.uniqueOpponents}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>
                Opponents
              </Text>
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text variant="titleSmall">Partnerships</Text>
              <Text variant="bodyMedium">
                {summaryStats.totalPartnerships} games (
                {summaryStats.totalWins > 0
                  ? `${((summaryStats.totalWins / summaryStats.totalGames) * 100).toFixed(0)}% win rate`
                  : "No wins tracked"}
                )
              </Text>
            </View>

            <View style={styles.detailItem}>
              <Text variant="titleSmall">Oppositions</Text>
              <Text variant="bodyMedium">
                {summaryStats.totalOppositions} games
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderDetailedView = () => {
    if (!selectedPlayerId || selectedPlayerMatchups.length === 0) return null;

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

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* Header row */}
            <View style={styles.heatmapRow}>
              <View style={[styles.heatmapCell, styles.heatmapHeaderCell]} />
              {sessionPlayers.map((player) => (
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

        {selectedPlayerId && (
          <>
            {renderViewModeSelector()}

            {viewMode === "summary" && renderSummaryView()}
            {viewMode === "detailed" && renderDetailedView()}
            {viewMode === "heatmap" && renderHeatmapView()}
          </>
        )}

        {!selectedPlayerId && viewMode === "heatmap" && renderHeatmapView()}
      </ScrollView>
    </Surface>
  );
};

const styles = StyleSheet.create({
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
  playerChipsContainer: {
    paddingHorizontal: 0,
    gap: 8,
  },
  playerChip: {
    marginRight: 8,
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
    borderColor: "rgba(0,0,0,0.1)",
  },
  heatmapHeaderCell: {
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  heatmapHeaderText: {
    fontWeight: "600",
    textAlign: "center",
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
});
