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
  Portal,
} from "react-native-paper";
import * as Print from "expo-print";
import { File, Directory, Paths } from "expo-file-system";
import Sharing from "expo-sharing";
import { useAppSelector } from "@/src/store";
import PlayerStatsModal from "@/src/components/PlayerStatsModal";
import RoundComponent from "@/src/components/RoundComponent";
import { Session, SessionState, Game, Round } from "@/src/types";
import { getPlayerName, getSessionPlayers } from "@/src/utils/util";
import { isNarrowScreen } from "@/src/utils/screenUtil";

interface ViewSessionModalProps {
  visible: boolean;
  session: Session | null;
  onCancel: () => void;
}

export default function ViewSessionModal({
  visible,
  session,
  onCancel,
}: ViewSessionModalProps) {
  const theme = useTheme();

  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const { players } = useAppSelector((state) => state.players);

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

  const exportToPDF = async () => {
    try {
      setMenuVisible(false);

      const rounds = session.liveData?.rounds || [];

      // Generate HTML content for PDF
      let roundsHTML = "";
      rounds.forEach((round, index) => {
        // Add sitting out players if any
        let sittingOutHTML = "";
        if (round.sittingOutIds.length > 0) {
          const sittingOutNames = round.sittingOutIds
            .map(getPlayerName)
            .join(", ");
          sittingOutHTML = `
            <div style="margin-bottom: 10px; padding: 8px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px;">
              <strong>Sitting Out:</strong> ${sittingOutNames}
            </div>
          `;
        }

        roundsHTML += `
          <div style="margin-bottom: 30px; page-break-inside: avoid;">
            <h3 style="color: #333; border-bottom: 2px solid #ccc; padding-bottom: 8px; margin-bottom: 15px;">
              Round ${index + 1} - ${round.games.length} game${round.games.length !== 1 ? "s" : ""}
            </h3>
            ${sittingOutHTML}
            <div style="margin-left: 10px;">
              ${round.games
                .map(
                  (game, gameIndex) => `
                  <div style="margin-bottom: 15px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; background-color: #fafafa;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                      <strong style="color: #2c3e50;">Game ${gameIndex + 1}</strong>
                      <span style="color: #7f8c8d; font-size: 0.9em;">${getCourtName(game.courtId)}</span>
                    </div>
                    <div style="margin-bottom: 8px;">
                      <div style="margin-bottom: 4px;">
                        <strong>Serve Team:</strong> ${getPlayerName(game.serveTeam.player1Id)} & ${getPlayerName(game.serveTeam.player2Id)}
                      </div>
                      <div style="margin-bottom: 4px;">
                        <strong>Receive Team:</strong> ${getPlayerName(game.receiveTeam.player1Id)} & ${getPlayerName(game.receiveTeam.player2Id)}
                      </div>
                    </div>
                    <div style="font-weight: 500; color: ${game.score ? "#27ae60" : "#95a5a6"};">
                      <strong>Score:</strong> ${formatScore(game.score)}
                    </div>
                    ${
                      game.isCompleted
                        ? `
                      <div style="margin-top: 4px; color: #27ae60; font-size: 0.9em;">
                        ✓ Completed${game.completedAt ? ` at ${new Date(game.completedAt).toLocaleTimeString()}` : ""}
                      </div>
                    `
                        : ""
                    }
                  </div>
                `,
                )
                .join("")}
            </div>
          </div>
        `;
      });

      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <title>${session.name} - Session Report asfafafa</title>
            <style>
              body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                margin: 20px;
                color: #2c3e50;
                line-height: 1.6;
              }
              .header {
                border-bottom: 3px solid #3498db;
                padding-bottom: 15px;
                margin-bottom: 25px;
              }
              .session-info {
                background-color: #ecf0f1;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 25px;
                border-left: 4px solid #3498db;
              }
              .players-section {
                margin-top: 25px;
                padding-top: 20px;
                border-top: 2px solid #bdc3c7;
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
              }
              h1 {
                color: #2c3e50;
                margin: 0;
                font-size: 2.2em;
                font-weight: 300;
              }
              h2 {
                color: #34495e;
                margin-top: 30px;
                font-size: 1.8em;
                font-weight: 400;
              }
              h3 {
                color: #34495e;
                font-size: 1.4em;
                font-weight: 500;
              }
              .info-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
                margin: 10px 0;
              }
              .info-item {
                background: white;
                padding: 10px;
                border-radius: 4px;
                border: 1px solid #ddd;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${session.name}</h1>
              <p style="margin: 10px 0 5px 0; font-size: 1.1em;"><strong>Date:</strong> ${formatDate(session.dateTime)}</p>
              <p style="margin: 5px 0;"><strong>Configuration:</strong> ${session.scoring ? "Scoring Enabled" : "No Scoring"}, ${session.showRatings ? "Ratings Shown" : "No Ratings"}</p>
            </div>

            <div class="session-info">
              <div class="info-grid">
                <div class="info-item">
                  <strong>Total Players:</strong> ${session.playerIds.length}
                </div>
                <div class="info-item">
                  <strong>Active Courts:</strong> ${session.courts.filter((c) => c.isActive).length}
                </div>
                <div class="info-item">
                  <strong>Session Status:</strong> ${session.state}
                </div>
                <div class="info-item">
                  <strong>Total Rounds:</strong> ${rounds.length}
                </div>
              </div>
            </div>

            <h2>Round Details</h2>
            ${rounds.length > 0 ? roundsHTML : "<p style='text-align: center; color: #7f8c8d; font-style: italic; margin: 40px 0;'>No rounds have been played yet</p>"}

            <div class="players-section">
              <h3>Session Participants</h3>
              <p style="font-size: 1.1em; line-height: 1.8;">${sessionPlayers
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((p) => p.name)
                .join(" • ")}</p>
            </div>

            <div style="margin-top: 30px; padding: 15px; background-color: #f1f2f6; border-radius: 8px; text-align: center; color: #57606f;">
              <small>Generated on ${new Date().toLocaleString()}</small>
            </div>
          </body>
        </html>
      `;

      //console.log(htmlContent);
      const { uri } = await Print.printToFileAsync({ html: htmlContent });

      // // Create a better filename
      const fileName = `${session.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      const newUri = new File(Paths.document, fileName);
      //
      // // Move the file to a more accessible location
      new File(uri).move(newUri);

      // Share the PDF
      await Sharing.shareAsync(newUri.uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Session Report",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      // You might want to show an error message to the user here
    }
  };

  const rounds = session.liveData?.rounds || [];
  const playerStats = session.liveData?.playerStats || [];

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
        roundNumber={index}
      />
    </List.Accordion>
  );

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
        >
          <Appbar.Header>
            <Appbar.BackAction onPress={onCancel} />
            <Appbar.Content
              title={
                <Text
                  variant="titleLarge"
                  style={{
                    alignItems: "center",
                    fontWeight: "600",
                  }}
                >
                  Session Details
                </Text>
              }
            />
            {/*
              This action is disabled until we can properly export to PDF...
            <Appbar.Action icon="file-pdf-box" onPress={() => exportToPDF()} />
            */}
          </Appbar.Header>

          <Surface style={styles.headerContainer}>
            <View style={{ flexDirection: "column", marginBottom: 8 }}>
              <Text variant="titleMedium" style={styles.sessionName}>
                {session.name}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignContent: "center",
                  gap: 10,
                  marginBottom: 1,
                }}
              >
                <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                  {formatDate(session.dateTime)}
                </Text>
                <Text variant="bodyMedium" style={{ marginBottom: 8 }}>
                  {session.scoring ? "( Scoring, " : "( No Scoring, "}
                  {session.showRatings ? "Ratings )" : "No Ratings )"}
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
                      compact={true}
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
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 2 }}
            >
              {playerStats.length > 0 && (
                <Button
                  icon="chart-box"
                  mode="outlined"
                  onPress={() => setStatsModalVisible(true)}
                  // style={{
                  //   marginBottom: 2,
                  //   //flex: 1,
                  // }}
                >
                  Player Stats
                </Button>
              )}
              {rounds.length > 0 && (
                // <Button
                //   icon={allExpanded ? "collapse-all" : "expand-all"}
                //   mode="outlined"
                //   onPress={toggleAllRounds}
                //   style={{
                //     marginBottom: 2,
                //   }}
                // >
                //   {allExpanded ? "Collapse All" : "Expand All"}
                // </Button>
                <>
                  <IconButton
                    icon="expand-all"
                    mode="contained"
                    onPress={expandAllRounds}
                    // style={{
                    //   backgroundColor: theme.colors.primary,
                    // }}
                  />
                  <IconButton
                    icon="collapse-all"
                    mode="contained"
                    onPress={collapseAllRounds}
                    // style={{
                    //   backgroundColor: theme.colors.onPrimary,
                    // }}
                  />
                </>
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

          {rounds.length > 0 && (
            <FlatList
              data={rounds}
              renderItem={renderRound}
              keyExtractor={(item) => item.roundNumber.toString()}
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
        </SafeAreaView>
      </Modal>

      <Portal>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-vertical"
              onPress={() => setMenuVisible(true)}
            />
          }
          // anchor={{ x: 0, y: 100 }}
          anchorPosition="bottom"
        >
          <Menu.Item
            onPress={exportToPDF}
            title="Export to PDF"
            leadingIcon="file-pdf-box"
          />
        </Menu>
      </Portal>

      <PlayerStatsModal
        visible={statsModalVisible}
        players={sessionPlayers}
        stats={playerStats}
        onClose={() => setStatsModalVisible(false)}
      />
    </>
  );
}

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
