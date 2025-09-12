import React, { useMemo, useState } from "react";
import { View, FlatList, Modal, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
  Chip,
  List,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useAppSelector } from "@/src/store";
import PlayerStatsModal from "@/src/components/PlayerStatsModal";
import RoundComponent from "@/src/components/RoundComponent";
import { Session, SessionState, Game, Round } from "@/src/types";
import { getPlayerName, getSessionPlayers } from "@/src/utils/util";

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

  const renderRound = ({ item, index }: { item: Round; index: number }) => (
    <List.Accordion
      title={`Round ${index + 1}`}
      right={(props) => (
        <View style={{ flexDirection: "row" }}>
          <Text style={{ marginRight: 10 }}>{item.games.length} games</Text>
          <List.Icon {...props} icon="chevron-down" />
        </View>
      )}
      left={(props) => <List.Icon {...props} icon="view-list" />}
      id={index}
    >
      <RoundComponent editing={false} session={session} roundNumber={index} />

      {item.sittingOutIds.length > 0 && (
        <View style={styles.sittingOutContainer}>
          <Text variant="labelMedium" style={styles.sittingOutLabel}>
            Sat Out:
          </Text>
          <Text variant="bodySmall">
            {item.sittingOutIds
              .map((id) => getPlayerName(players, id))
              .join(", ")}
          </Text>
        </View>
      )}
    </List.Accordion>
  );

  const rounds = session.liveData?.rounds || [];
  const playerStats = session.liveData?.playerStats || [];

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <Appbar.Header>
          <Appbar.BackAction onPress={onCancel} />
          <Appbar.Content title="Session Details" />
        </Appbar.Header>

        <SafeAreaView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
        >
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
              {/*
              <View style={{ flexDirection: "row", marginBottom: 12, gap: 8 }}>
                {session.scoring && (
                  <Chip
                    icon="scoreboard-outline"
                    compact
                    textStyle={{ fontSize: 9 }}
                  >
                    Scoring
                  </Chip>
                )}
                {session.showRatings && (
                  <Chip icon="star-outline" compact textStyle={{ fontSize: 9 }}>
                    Ratings
                  </Chip>
                )}
              </View>
              */}
            </View>
            {playerStats.length > 0 && (
              <Button
                icon="chart-box"
                mode="outlined"
                onPress={() => setStatsModalVisible(true)}
                style={{
                  marginBottom: 2,
                  //maxWidth: 200,
                }}
              >
                Player Stats
              </Button>
            )}
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
            <List.AccordionGroup>
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
            </List.AccordionGroup>
          )}
        </SafeAreaView>
      </Modal>

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
