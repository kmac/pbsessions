import React, { useState } from "react";
import { View, FlatList, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Avatar,
  Button,
  Card,
  Chip,
  Icon,
  Surface,
  Text,
  useTheme,
  Menu,
  IconButton,
  Portal,
  Dialog,
  TextInput,
} from "react-native-paper";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  archiveSession,
  cloneSession,
  removeSession,
} from "@/src/store/slices/sessionsSlice";
import { Court, Session, SessionState } from "@/src/types";
import { TabHeader } from "@/src/components/TabHeader";
import { isNarrowScreen } from "@/src/utils/screenUtil";
import { Alert } from "@/src/utils/alert";
import {
  endSessionThunk,
  startLiveSessionThunk,
} from "@/src/store/actions/sessionActions";
import { getCurrentRoundNumber } from "@/src/services/sessionService";
import { exportSessionResultsToCsv } from "@/src/utils/csv";
import { saveToFile, copyToClipboard } from "@/src/utils/fileClipboardUtil";

export default function SessionsTab() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const narrowScreen = isNarrowScreen();

  const { sessions, loading } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);
  const { groups } = useAppSelector((state) => state.groups);
  const isAppInitialized = useAppSelector((state) => state.app.isInitialized);

  const [menuVisible, setMenuVisible] = useState(false);
  const [sessionMenuVisible, setSessionMenuVisible] = useState<{
    [key: string]: boolean;
  }>({});
  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const [exportCsvContent, setExportCsvContent] = useState("");
  const [exportingSession, setExportingSession] = useState<Session | null>(
    null,
  );

  const getSession = (sessionId: string) => {
    return sessions.find((session) => session.id === sessionId);
  };

  const isSessionLive = (sessionId: string) => {
    const session = getSession(sessionId);
    return session ? isLive(session) : false;
  };

  const isNew = (session: Session) => {
    return session.state === SessionState.New;
  };

  const isLive = (session: Session) => {
    return session.state === SessionState.Live;
  };

  const isComplete = (session: Session) => {
    return session.state === SessionState.Complete;
  };

  const isArchived = (session: Session) => {
    return session.state === SessionState.Archived;
  };

  const handleEndSession = (session: Session) => {
    if (!isSessionLive(session.id)) {
      Alert.alert(
        "Cannot End Session",
        "Cannot end session. Session is not live.",
        [{ text: "OK" }],
      );
      return;
    }

    Alert.alert(
      "End Session",
      `Are you sure you want to end "${session.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Proceed",
          style: "destructive",
          onPress: () => dispatch(endSessionThunk({ sessionId: session.id })),
        },
      ],
    );
  };

  const handleDeleteSession = (session: Session) => {
    if (isSessionLive(session.id)) {
      Alert.alert(
        "Cannot Delete",
        "Cannot delete a live session. End the session first.",
        [{ text: "OK" }],
      );
      return;
    }

    Alert.alert(
      "Delete Session",
      `Are you sure you want to delete "${session.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => dispatch(removeSession(session.id)),
        },
      ],
    );
  };

  const handleViewSession = (session: Session) => {
    router.navigate({
      pathname: "/view-session",
      params: { sessionId: session.id },
    });
  };

  const handleEditSession = (session: Session) => {
    // if (isSessionLive(session.id)) {
    //   Alert.alert(
    //     'Cannot Edit',
    //     'Cannot edit a live session. End the session first.',
    //     [{ text: 'OK' }]
    //   );
    //   return;
    // }

    // if (editingSession) {
    //   Alert.alert(
    //     "Cannot Edit",
    //     "Cannot edit a live session. End the session first.",
    //     [{ text: "OK" }],
    //   );
    //   return;
    // }

    router.navigate({
      pathname: "/edit-session",
      params: {
        sessionId: session?.id,
        returnTo: "/sessions", // or "/live-session"
      },
    });
  };

  const handleCloneSession = (session: Session) => {
    dispatch(
      cloneSession(
        session as Omit<
          Session,
          "id" | "state" | "createdAt" | "updatedAt" | "liveData"
        >,
      ),
    );
  };

  const handleStartLiveSession = (session: Session) => {
    if (session.playerIds.length < 4) {
      Alert.alert(
        "Not Enough Players",
        "Need at least 4 players to start a live session.",
        [{ text: "OK" }],
      );
      return;
    }

    const activeCourts = session.courts.filter((c) => c.isActive);
    const minPlayersNeeded = activeCourts.length * 4;

    if (session.playerIds.length < minPlayersNeeded) {
      Alert.alert(
        "Not Enough Players",
        `Need at least ${minPlayersNeeded} players for ${activeCourts.length} active courts.`,
        [
          {
            text: "Adjust Courts",
            onPress: () => handleEditSession(session),
          },
          { text: "Cancel", style: "cancel" },
        ],
      );
      return;
    }

    dispatch(
      startLiveSessionThunk({
        sessionId: session.id,
      }),
    );

    router.navigate({
      pathname: "/live-session",
      params: { sessionId: session.id },
    });
  };

  const handleArchiveSession = (session: Session) => {
    if (isSessionLive(session.id)) {
      Alert.alert(
        "Cannot Archive",
        "Cannot archive a live session. End the session first.",
        [{ text: "OK" }],
      );
      return;
    }
    dispatch(archiveSession(session.id));
  };

  const handleExportSession = async (session: Session) => {
    try {
      const csvData = exportSessionResultsToCsv(session, players);
      const fileName = `${session.name.replace(/[^a-zA-Z0-9]/g, "_")}_results.csv`;

      if (Platform.OS !== "web") {
        await saveToFile(csvData, fileName);
      } else {
        setExportingSession(session);
        setExportCsvContent(csvData);
        setExportDialogVisible(true);
      }
    } catch (error) {
      console.error("Failed to export CSV:", error);
      Alert.alert("Export Failed", "Failed to export session data.");
    }
  };

  const handleCopyToClipboard = async () => {
    copyToClipboard(exportCsvContent, () => {
      setExportDialogVisible(false);
      setExportingSession(null);
    });
  };

  const handleSaveToFile = async () => {
    if (!exportingSession) return;
    const fileName = `${exportingSession.name.replace(/[^a-zA-Z0-9]/g, "_")}_results.csv`;
    saveToFile(exportCsvContent, fileName, () => {
      setExportDialogVisible(false);
      setExportingSession(null);
    });
  };

  const navigateToGroups = () => {
    router.navigate("/groups");
  };

  const navigateToPlayers = () => {
    router.navigate("/players");
  };

  const getSessionPlayers = (session: Session) => {
    return players.filter((player) => session.playerIds.includes(player.id));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const toggleSessionMenu = (sessionId: string, visible: boolean) => {
    // console.log(
    //   `toggleSessionMenu: sessionId: ${sessionId} visible=${visible}`,
    // );
    if (visible) {
      // When opening, use a small delay to prevent immediate closure
      // This is a workaround for android issue where the menu closes immediately
      setSessionMenuVisible((prev) => ({
        ...prev,
        [sessionId]: true,
      }));
    } else {
      setSessionMenuVisible((prev) => ({
        ...prev,
        [sessionId]: false,
      }));
    }
  };

  const SessionHeader = () => (
    <Surface
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
      elevation={1}
    >
      <TabHeader title="Sessions" />

      <View style={{ marginLeft: 12 }}>
        {players.length === 0 ? (
          <Button
            icon="open-in-new"
            mode="outlined"
            onPress={navigateToPlayers}
            compact={narrowScreen}
          >
            {narrowScreen ? "Add" : "Add Players"}
          </Button>
        ) : narrowScreen ? (
          // Mobile: Primary action + menu
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Button
              icon="plus"
              mode="contained"
              onPress={() => router.navigate("/edit-session")}
              compact
            >
              New
            </Button>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <IconButton
                  icon="dots-vertical"
                  onPress={() => setMenuVisible(true)}
                />
              }
            >
              <Menu.Item
                leadingIcon="archive"
                onPress={() => {
                  setMenuVisible(false);
                  router.navigate("/archived-sessions");
                }}
                title="Archives"
              />
            </Menu>
          </View>
        ) : (
          // Desktop: Show all buttons
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              icon="plus"
              mode="contained"
              onPress={() => router.navigate("/edit-session")}
            >
              New
            </Button>
            <Button
              icon="archive"
              mode="elevated"
              onPress={() => router.navigate("/archived-sessions")}
            >
              Archives
            </Button>
          </View>
        )}
      </View>
    </Surface>
  );

  const renderSession = ({ item: session }: { item: Session }) => {
    const sessionPlayers = getSessionPlayers(session);
    const activeCourts: Court[] = session.courts
      ? session.courts.filter((c) => c.isActive)
      : [];

    return (
      <Card
        style={[
          { marginBottom: 12 },
          isSessionLive(session.id) && {
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.tertiary,
          },
        ]}
        // onPress={() => handleViewSession(session)}
      >
        <Card.Content>
          <View style={{ marginBottom: 12 }}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 16 }}
            >
              <Text
                variant="titleMedium"
                style={{ fontWeight: "600", marginBottom: 8, flex: 2 }}
              >
                {session.name}
              </Text>
              {isSessionLive(session.id) && (
                <Chip
                  icon="record"
                  style={{
                    alignSelf: "flex-start",
                    marginBottom: 12,
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
              )}
              {!isSessionLive(session.id) && (
                <Chip
                  style={{
                    alignSelf: "flex-start",
                    marginBottom: 12,
                    backgroundColor: theme.colors.inverseOnSurface,
                  }}
                  textStyle={{
                    color: theme.colors.primary,
                    //fontWeight: "bold",
                  }}
                  compact={true}
                >
                  {session.state}
                </Chip>
              )}
            </View>
            {false && (
              <View style={{ flexDirection: "row", gap: 16 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                >
                  <Icon source="calendar" size={14} />
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Created: {formatDate(session.dateTime)} :{" "}
                    {formatTime(session.createdAt)}
                  </Text>
                </View>
              </View>
            )}
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Icon source="calendar" size={14} />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  Updated: {formatDate(session.updatedAt)} :{" "}
                  {formatTime(session.updatedAt)}
                </Text>
              </View>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginBottom: 12,
              gap: 8,
            }}
          >
            <Chip icon="account-group" compact={true}>
              {sessionPlayers.length} players
            </Chip>
            <Chip icon="map-marker-outline" compact={true}>
              {activeCourts.length} courts
            </Chip>
            {session.scoring && (
              <Chip icon="scoreboard-outline" compact={true}>
                Scores
              </Chip>
            )}
            {activeCourts.some((c) => c.minimumRating) && (
              <Chip icon="star-outline" compact={true}>
                Rated
              </Chip>
            )}
            {!isLive(session) && (
              <Chip icon="refresh" compact>
                {(() => {
                  const n = getCurrentRoundNumber(session);
                  return n === 1 ? `${n} round` : `${n} rounds`;
                })()}
              </Chip>
            )}
          </View>

          {false && !isLive(session) && (
            <View style={{ marginBottom: 8 }}>
              <Text
                variant="labelMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 4,
                }}
              >
                {(() => {
                  const n = getCurrentRoundNumber(session);
                  //return `Completed Rounds: ${n}`;
                  return `${n} Rounds`;
                })()}
              </Text>
            </View>
          )}
          {sessionPlayers.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text
                variant="labelMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 4,
                }}
              >
                Players:
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {sessionPlayers
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p) => p.name)
                  .join(", ")}
              </Text>
            </View>
          )}
          {session.partnershipConstraint?.partnerships &&
            session.partnershipConstraint.partnerships.length > 0 && (
              <View style={{ marginBottom: 12 }}>
                <Text
                  variant="labelMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginBottom: 4,
                  }}
                >
                  Fixed Partners (
                  {session.partnershipConstraint!.partnerships.length}):
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {session
                    .partnershipConstraint!.partnerships.map((partnership) => {
                      const player1 = players.find(
                        (p) => p.id === partnership.player1Id,
                      );
                      const player2 = players.find(
                        (p) => p.id === partnership.player2Id,
                      );
                      return `${player1?.name} & ${player2?.name}`;
                    })
                    .join(", ")}
                </Text>
              </View>
            )}
        </Card.Content>

        <Card.Actions style={{ justifyContent: "space-between" }}>
          {/* Primary actions - always visible */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {isLive(session) && (
              <>
                <Button
                  // icon={isNarrowScreen ? undefined : "play"}
                  icon="play"
                  mode="contained"
                  onPress={() =>
                    router.navigate({
                      pathname: "/live-session",
                      params: { sessionId: session.id },
                    })
                  }
                  compact={narrowScreen}
                >
                  {(() => {
                    const n = getCurrentRoundNumber(session);
                    return `Round ${n}`;
                  })()}
                </Button>
                <Button
                  // icon={isNarrowScreen ? undefined : "stop"}
                  icon="stop"
                  mode="outlined"
                  onPress={() => handleEndSession(session)}
                  compact={narrowScreen}
                >
                  {narrowScreen ? "End" : "End Session"}
                </Button>
              </>
            )}
            {isNew(session) && (
              <Button
                icon="play"
                mode="contained"
                onPress={() => handleStartLiveSession(session)}
                compact={narrowScreen}
              >
                Start
              </Button>
            )}
            {!isArchived(session) && isComplete(session) && (
              <Button
                icon="eye"
                mode="outlined"
                onPress={() => handleViewSession(session)}
                compact={narrowScreen}
              >
                View
              </Button>
            )}
          </View>

          {/* Secondary actions */}
          {narrowScreen ? (
            // Mobile: Show essential actions + menu
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Menu
                visible={sessionMenuVisible[session.id] || false}
                onDismiss={() => {
                  toggleSessionMenu(session.id, false);
                }}
                contentStyle={{ minWidth: 200 }}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => {
                      const isCurrentlyVisible =
                        sessionMenuVisible[session.id] || false;
                      // I think we are hitting this issue on android:
                      // https://github.com/callstack/react-native-paper/issues/4754
                      //
                      // Until this goes away, always toggle. Then at least we can open the menu eventually.
                      toggleSessionMenu(session.id, !isCurrentlyVisible);
                      // Proper code:
                      // if (!isCurrentlyVisible) {
                      //   toggleSessionMenu(session.id, true);
                      // }
                    }}
                  />
                }
              >
                {!isComplete(session) && (
                  <>
                    <Menu.Item
                      leadingIcon="pencil"
                      onPress={() => {
                        toggleSessionMenu(session.id, false);
                        handleEditSession(session);
                      }}
                      title="Edit"
                    />
                    <Menu.Item
                      leadingIcon="eye"
                      onPress={() => {
                        toggleSessionMenu(session.id, false);
                        handleViewSession(session);
                      }}
                      title="View"
                    />
                  </>
                )}
                {isComplete(session) && (
                  <>
                    <Menu.Item
                      leadingIcon="archive"
                      onPress={() => {
                        toggleSessionMenu(session.id, false);
                        handleArchiveSession(session);
                      }}
                      title="Archive"
                    />
                    <Menu.Item
                      leadingIcon="delete"
                      onPress={() => {
                        toggleSessionMenu(session.id, false);
                        handleDeleteSession(session);
                      }}
                      title="Delete"
                    />
                    <Menu.Item
                      leadingIcon="file-export-outline"
                      onPress={() => {
                        toggleSessionMenu(session.id, false);
                        handleExportSession(session);
                      }}
                      title="Export"
                    />
                  </>
                )}
                {!isLive(session) && (
                  <Menu.Item
                    leadingIcon="content-duplicate"
                    onPress={() => {
                      toggleSessionMenu(session.id, false);
                      handleCloneSession(session);
                    }}
                    title="Clone"
                  />
                )}
                {true && __DEV__ && (
                  <Menu.Item
                    leadingIcon="delete"
                    onPress={() => {
                      toggleSessionMenu(session.id, false);
                      console.log(session.liveData);
                    }}
                    title="Dump"
                  />
                )}
              </Menu>
            </View>
          ) : (
            // Desktop: Show all actions
            <View style={{ flexDirection: "row", gap: 2 }}>
              {!isComplete(session) && (
                <Button
                  icon="pencil"
                  mode="text"
                  onPress={() => handleEditSession(session)}
                >
                  Edit
                </Button>
              )}
              {!isArchived(session) && !isComplete(session) && (
                <Button
                  icon="eye"
                  mode="text"
                  onPress={() => handleViewSession(session)}
                >
                  View
                </Button>
              )}
              {isComplete(session) && (
                <>
                  <Button
                    icon="file-export-outline"
                    mode="text"
                    onPress={() => handleExportSession(session)}
                  >
                    Export
                  </Button>
                  <Button
                    icon="archive"
                    mode="text"
                    onPress={() => handleArchiveSession(session)}
                  >
                    Archive
                  </Button>
                </>
              )}
              {!isLive(session) && (
                <>
                  <Button
                    icon="delete"
                    mode="text"
                    onPress={() => handleDeleteSession(session)}
                  >
                    Delete
                  </Button>
                  <Button
                    icon="content-duplicate"
                    mode="text"
                    onPress={() => handleCloneSession(session)}
                  >
                    Clone
                  </Button>
                </>
              )}
              {true && __DEV__ && (
                <Button
                  icon="content-duplicate"
                  mode="text"
                  onPress={() => console.log(session.liveData)}
                >
                  Dump
                </Button>
              )}
            </View>
          )}
        </Card.Actions>
      </Card>
    );
  };

  const EmptyState = () => (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 64,
      }}
    >
      {/*<Icon source="view-grid" size={48} />*/}
      <Avatar.Image
        size={64}
        source={require("@/assets/images/pbsessions.webp")}
        style={{
          marginRight: 10,
          backgroundColor: "grey",
        }}
      />
      <Text
        variant="titleMedium"
        style={{
          fontWeight: "600",
          marginTop: 16,
          color: theme.colors.onSurfaceVariant,
        }}
      >
        No sessions yet
      </Text>
      <Text
        variant="bodyMedium"
        style={{
          color: theme.colors.onSurfaceVariant,
          marginTop: 4,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Create a session to start organizing games
      </Text>

      {players.length === 0 ? (
        <Button icon="open-in-new" mode="outlined" onPress={navigateToPlayers}>
          Add Players First
        </Button>
      ) : (
        <View style={{ alignItems: "center", gap: 12 }}>
          <Button
            icon="plus"
            mode="contained"
            onPress={() => router.navigate("/edit-session")}
          >
            Create Session
          </Button>

          {groups.length === 0 && (
            <Button
              icon="open-in-new"
              mode="outlined"
              onPress={navigateToGroups}
            >
              Create Groups
            </Button>
          )}
        </View>
      )}
    </View>
  );

  if (!isAppInitialized) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator
          size="large"
          animating={true}
          color={theme.colors.primary}
        />
        <Text style={{ marginTop: 16 }}>Loading sessions...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <SessionHeader />

      {/*<Text variant="labelMedium" style={{ marginHorizontal: 32 }}>
        {sessions.filter((s) => s.state !== SessionState.Archived).length}{" "}
        sessions
      </Text>*/}

      <FlatList
        data={sessions
          .filter((session) => session.state != SessionState.Archived)
          .sort((a, b) => {
            return a.createdAt.localeCompare(b.createdAt);
          })}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: narrowScreen ? 80 : 16, // Extra space for FAB
        }}
        showsVerticalScrollIndicator={false}
        // ListHeaderComponent={
        //   <TopDescription visible={true} description="Ready to play" />
        // }
        ListEmptyComponent={<EmptyState />}
      />

      <Portal>
        {/* Export CSV Dialog */}
        <Dialog
          visible={exportDialogVisible}
          onDismiss={() => {
            setExportDialogVisible(false);
            setExportingSession(null);
          }}
          style={{ maxHeight: "80%" }}
        >
          <Dialog.Title>Export Session Results</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
              {Platform.OS === "web"
                ? "Download or copy the CSV data below:"
                : "Save to file or copy the CSV data below:"}
            </Text>
            <TextInput
              mode="outlined"
              multiline
              value={exportCsvContent}
              editable={false}
              style={{
                flex: 1,
                minHeight: 340,
                maxHeight: "60%",
                fontSize: 12,
                fontFamily: "monospace",
              }}
              contentStyle={{
                paddingVertical: 8,
              }}
              scrollEnabled={true}
            />
          </Dialog.Content>
          <Dialog.Actions
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Button
              mode="contained-tonal"
              onPress={() => {
                setExportDialogVisible(false);
                setExportingSession(null);
              }}
            >
              Cancel
            </Button>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                mode="outlined"
                onPress={handleCopyToClipboard}
                icon="content-copy"
              >
                Copy
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveToFile}
                icon={Platform.OS === "web" ? "download" : "content-save"}
              >
                {Platform.OS === "web" ? "Download" : "Save File"}
              </Button>
            </View>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}
