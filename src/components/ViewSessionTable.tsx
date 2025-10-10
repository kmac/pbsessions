import React, { useMemo, useState, useCallback } from "react";
import { View, StyleSheet, ScrollView, FlatList } from "react-native";
import {
  DataTable,
  Searchbar,
  Button,
  Text,
  Surface,
  useTheme,
} from "react-native-paper";
import { useAppSelector } from "@/src/store";
import { Session, Game, Round } from "@/src/types";
import {
  getSessionPlayers,
  getPlayerName,
  getCourtName,
} from "@/src/utils/util";

interface ViewSessionTableProps {
  session: Session;
}

interface TableRowData {
  id: string;
  roundNumber: number;
  courtName: string;
  roundCourtKey: string;
  servePlayers: string;
  receivePlayers: string;
  combinedScore: string;
  game: Game;
}

type SortField =
  | "roundCourtKey"
  | "servePlayers"
  | "receivePlayers"
  | "combinedScore";
type SortDirection = "ascending" | "descending";

export const ViewSessionTable: React.FC<ViewSessionTableProps> = ({
  session,
}) => {
  const theme = useTheme();
  const { players } = useAppSelector((state) => state.players);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("roundCourtKey");
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("ascending");

  const sessionPlayers = getSessionPlayers(session, players);
  const rounds = session.liveData?.rounds || [];

  // Convert rounds and games into table row data
  const tableData = useMemo<TableRowData[]>(() => {
    const rows: TableRowData[] = [];

    rounds.forEach((round: Round, roundIndex: number) => {
      round.games.forEach((game: Game) => {
        const courtName = getCourtName(session.courts, game.courtId);
        const servePlayer1Name = getPlayerName(
          sessionPlayers,
          game.serveTeam.player1Id,
        );
        const servePlayer2Name = getPlayerName(
          sessionPlayers,
          game.serveTeam.player2Id,
        );
        const receivePlayer1Name = getPlayerName(
          sessionPlayers,
          game.receiveTeam.player1Id,
        );
        const receivePlayer2Name = getPlayerName(
          sessionPlayers,
          game.receiveTeam.player2Id,
        );

        // Combine and sort players alphabetically
        const servePlayers = [servePlayer1Name, servePlayer2Name]
          .sort()
          .join(" & ");
        const receivePlayers = [receivePlayer1Name, receivePlayer2Name]
          .sort()
          .join(" & ");

        // Format combined score
        const combinedScore = game.score
          ? `${game.score.serveScore} - ${game.score.receiveScore}`
          : "-";

        rows.push({
          id: game.id,
          roundNumber: roundIndex + 1,
          courtName,
          roundCourtKey: `${roundIndex + 1} - ${courtName}`,
          servePlayers,
          receivePlayers,
          combinedScore,
          game,
        });
      });
    });

    return rows;
  }, [rounds, session.courts, sessionPlayers]);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    let filtered = tableData;

    // Apply search filter (search in combined player names)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          row.servePlayers.toLowerCase().includes(query) ||
          row.receivePlayers.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [tableData, searchQuery]);

  // Sort filtered data
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case "roundCourtKey":
          aValue = `${a.roundNumber.toString().padStart(3, "0")}-${a.courtName}`;
          bValue = `${b.roundNumber.toString().padStart(3, "0")}-${b.courtName}`;
          break;
        case "combinedScore":
          // Handle no-score cases - put them at the end
          aValue = a.combinedScore === "-" ? "zzz" : a.combinedScore;
          bValue = b.combinedScore === "-" ? "zzz" : b.combinedScore;
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === "ascending" ? comparison : -comparison;
      } else {
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return sortDirection === "ascending" ? comparison : -comparison;
      }
    });

    return sorted;
  }, [filteredData, sortField, sortDirection]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((current) =>
          current === "ascending" ? "descending" : "ascending",
        );
      } else {
        setSortField(field);
        setSortDirection("ascending");
      }
    },
    [sortField],
  );

  const getSortIcon = useCallback(
    (field: SortField) => {
      if (sortField !== field) return undefined;
      return sortDirection === "ascending" ? "ascending" : "descending";
    },
    [sortField, sortDirection],
  );

  const clearFilters = () => {
    setSearchQuery("");
  };

  const renderTableHeader = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      contentContainerStyle={styles.headerScrollContent}
    >
      <View style={styles.headerRow}>
        <View style={[styles.headerCell, styles.roundCourtColumn]}>
          <DataTable.Title
            sortDirection={getSortIcon("roundCourtKey")}
            onPress={() => handleSort("roundCourtKey")}
            style={styles.headerTitle}
          >
            Round - Court
          </DataTable.Title>
        </View>
        <View style={[styles.headerCell, styles.playersColumn]}>
          <DataTable.Title
            sortDirection={getSortIcon("servePlayers")}
            onPress={() => handleSort("servePlayers")}
            style={styles.headerTitle}
          >
            Serve Players
          </DataTable.Title>
        </View>
        <View style={[styles.headerCell, styles.playersColumn]}>
          <DataTable.Title
            sortDirection={getSortIcon("receivePlayers")}
            onPress={() => handleSort("receivePlayers")}
            style={styles.headerTitle}
          >
            Receive Players
          </DataTable.Title>
        </View>
        <View style={[styles.headerCell, styles.scoreColumn]}>
          <DataTable.Title
            sortDirection={getSortIcon("combinedScore")}
            onPress={() => handleSort("combinedScore")}
            style={styles.headerTitle}
            numeric
          >
            Score
          </DataTable.Title>
        </View>
      </View>
    </ScrollView>
  );

  const renderTableRow = ({ item: row }: { item: TableRowData }) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      contentContainerStyle={styles.rowScrollContent}
    >
      <View style={styles.dataRow}>
        <View style={[styles.dataCell, styles.roundCourtColumn]}>
          <Text variant="bodySmall" numberOfLines={2}>
            {row.roundCourtKey}
          </Text>
        </View>
        <View style={[styles.dataCell, styles.playersColumn]}>
          <Text variant="bodySmall" numberOfLines={3}>
            {row.servePlayers}
          </Text>
        </View>
        <View style={[styles.dataCell, styles.playersColumn]}>
          <Text variant="bodySmall" numberOfLines={3}>
            {row.receivePlayers}
          </Text>
        </View>
        <View style={[styles.dataCell, styles.scoreColumn]}>
          <Text variant="bodySmall" style={styles.numericText}>
            {row.combinedScore}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  if (rounds.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="bodyLarge">No rounds available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Control */}
      <Surface style={styles.controlsContainer}>
        <Searchbar
          placeholder="Search players..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <View style={styles.filtersRow}>
          {searchQuery && (
            <Button mode="outlined" onPress={clearFilters} icon="close" compact>
              Clear
            </Button>
          )}
        </View>

        {/* Results Summary */}
        <View style={styles.summaryRow}>
          <Text variant="bodySmall">
            Showing {sortedData.length} of {tableData.length} games
          </Text>
        </View>
      </Surface>

      {/* Table with vertical scrolling FlatList and horizontal scrolling rows */}
      <View style={styles.tableContainer}>
        <Surface style={styles.tableHeader}>{renderTableHeader()}</Surface>
        <FlatList
          data={sortedData}
          renderItem={renderTableRow}
          keyExtractor={(item) => item.id}
          style={styles.tableBody}
          showsVerticalScrollIndicator={true}
          ItemSeparatorComponent={() => (
            <View
              style={[
                styles.rowSeparator,
                { backgroundColor: theme.colors.outline },
              ]}
            />
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  controlsContainer: {
    padding: 16,
    elevation: 1,
  },
  searchbar: {
    marginBottom: 8,
  },
  filtersRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  summaryRow: {
    alignItems: "flex-end",
  },
  tableContainer: {
    flex: 1,
  },
  tableHeader: {
    elevation: 2,
    zIndex: 1,
  },
  tableBody: {
    flex: 1,
  },
  headerScrollContent: {
    minWidth: 550, // Further reduced width with fewer columns
  },
  rowScrollContent: {
    minWidth: 550,
  },
  headerRow: {
    flexDirection: "row",
    minHeight: 56,
    alignItems: "center",
  },
  dataRow: {
    flexDirection: "row",
    minHeight: 48,
    alignItems: "center",
  },
  headerCell: {
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  dataCell: {
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    margin: 0,
    padding: 0,
  },
  roundCourtColumn: {
    width: 120,
    minWidth: 120,
  },
  playersColumn: {
    width: 150, // Wider to accommodate two player names with "&"
    minWidth: 150,
  },
  scoreColumn: {
    width: 100,
    minWidth: 100,
    alignItems: "center",
  },
  numericText: {
    textAlign: "center",
  },
  rowSeparator: {
    height: 1,
    opacity: 0.2,
  },
});
