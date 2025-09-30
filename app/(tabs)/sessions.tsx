import React, { useState } from "react";
import { View, FlatList } from "react-native";
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
  FAB,
  Menu,
  Divider,
  IconButton,
} from "react-native-paper";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  addSession,
  archiveSession,
  cloneSession,
  updateSession,
  removeSession,
} from "@/src/store/slices/sessionsSlice";
import { Court, Session, SessionState } from "@/src/types";
import ArchivedSessions from "@/src/components/ArchivedSessions";
import EditSessionModal from "@/src/components/EditSessionModal";
import ViewSessionModal from "@/src/components/ViewSessionModal";
import TabHeader from "@/src/components/TabHeader";
import { isNarrowScreen } from "@/src/utils/screenUtil";
import { Alert } from "@/src/utils/alert";
import {
  endSessionThunk,
  startLiveSessionThunk,
} from "@/src/store/actions/sessionActions";

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
  const [editSessionModalVisible, setEditSessionModalVisible] = useState(false);
  const [modalArchiveVisible, setArchiveModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [viewSessionModalVisible, setViewSessionModalVisible] = useState(false);
  const [viewingSession, setViewingSession] = useState<Session | null>(null);

  const allLiveSessions = sessions.filter(
    (session) => session.state === SessionState.Live,
  );
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);

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
    openViewSessionModal(session);
  };

  function openViewSessionModal(session: Session) {
    setViewingSession(session);
    setViewSessionModalVisible(true);
  }

  function closeViewSessionModal() {
    setViewingSession(null);
    setViewSessionModalVisible(false);
  }

  function openEditSessionModal(session: Session) {
    setEditingSession(session);
    setEditSessionModalVisible(true);
  }

  function closeEditSessionModal() {
    setEditingSession(null);
    setEditSessionModalVisible(false);
  }

  const handleEditSession = (session: Session) => {
    // if (isSessionLive(session.id)) {
    //   Alert.alert(
    //     'Cannot Edit',
    //     'Cannot edit a live session. End the session first.',
    //     [{ text: 'OK' }]
    //   );
    //   return;
    // }
    if (editingSession) {
      Alert.alert(
        "Cannot Edit",
        "Cannot edit a live session. End the session first.",
        [{ text: "OK" }],
      );
      return;
    }
    openEditSessionModal(session);
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

    setTimeout(() => {
      setLiveSessionId(session.id);
    }, 100);

    router.navigate("/live-session");
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

  function handleSaveSession(
    sessionData:
      | Session
      | Omit<Session, "id" | "state" | "createdAt" | "updatedAt">,
  ) {
    if (editingSession) {
      const data = sessionData as Session;
      dispatch(updateSession(data));
      // if (data.state === SessionState.Live) {
      //   updateCourtInSessionThunk({sessionId: data.id, court: data.courts});
      //   dispatch(updateCourts(data.courts));
      // }
    } else {
      dispatch(
        addSession(
          sessionData as Omit<
            Session,
            "id" | "state" | "createdAt" | "updatedAt"
          >,
        ),
      );
    }
    closeEditSessionModal();
  }

  const toggleSessionMenu = (sessionId: string, visible: boolean) => {
    setSessionMenuVisible((prev) => ({
      ...prev,
      [sessionId]: visible,
    }));
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
              onPress={() => setEditSessionModalVisible(true)}
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
                  setArchiveModalVisible(true);
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
              onPress={() => setEditSessionModalVisible(true)}
            >
              New
            </Button>
            <Button
              icon="archive"
              mode="elevated"
              onPress={() => setArchiveModalVisible(true)}
            >
              Archives
            </Button>
          </View>
        )}
      </View>
    </Surface>
  );

  // Mobile FAB for primary action
  const PrimaryFAB = () => {
    if (!narrowScreen || players.length === 0) return null;

    return (
      <FAB
        icon="plus"
        onPress={() => setEditSessionModalVisible(true)}
        color={theme.colors.onSecondary}
        style={{
          position: "absolute",
          margin: 16,
          right: 0,
          bottom: 0,
          backgroundColor: theme.colors.secondary,
        }}
      />
    );
  };

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
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Icon source="calendar" size={14} />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {formatDate(session.dateTime)}
                </Text>
              </View>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Icon source="clock-outline" size={14} />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {formatTime(session.dateTime)}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", marginBottom: 12, gap: 8 }}>
            <Chip icon="account-group" compact={true}>
              {sessionPlayers.length} players
            </Chip>
            <Chip icon="map-marker-outline" compact={true}>
              {activeCourts.length} courts
            </Chip>
          </View>
          <View style={{ flexDirection: "row", marginBottom: 12, gap: 8 }}>
            {session.scoring && (
              <Chip icon="scoreboard-outline" compact={true}>
                Scoring
              </Chip>
            )}
            {activeCourts.some((c) => c.minimumRating) && (
              <Chip icon="star-outline" compact={true}>
                Rated
              </Chip>
            )}
          </View>

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
                numberOfLines={2}
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {sessionPlayers
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((p) => p.name)
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
                  onPress={() => router.navigate("/live-session")}
                  compact={narrowScreen}
                >
                  {narrowScreen ? "Continue" : "Continue Session"}
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
          </View>

          {/* Secondary actions */}
          {narrowScreen ? (
            // Mobile: Show essential actions + menu
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Menu
                visible={sessionMenuVisible[session.id] || false}
                onDismiss={() => toggleSessionMenu(session.id, false)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    onPress={() => toggleSessionMenu(session.id, true)}
                  />
                }
              >
                {!isComplete(session) && (
                  <Menu.Item
                    leadingIcon="pencil"
                    onPress={() => {
                      toggleSessionMenu(session.id, false);
                      handleEditSession(session);
                    }}
                    title="Edit"
                  />
                )}
                <Menu.Item
                  leadingIcon="eye"
                  onPress={() => {
                    toggleSessionMenu(session.id, false);
                    handleViewSession(session);
                  }}
                  title="View"
                />
                {isComplete(session) && (
                  <Menu.Item
                    leadingIcon="archive"
                    onPress={() => {
                      toggleSessionMenu(session.id, false);
                      handleArchiveSession(session);
                    }}
                    title="Archive"
                  />
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
                <Divider />
                <Menu.Item
                  leadingIcon="delete"
                  onPress={() => {
                    toggleSessionMenu(session.id, false);
                    handleDeleteSession(session);
                  }}
                  title="Delete"
                />
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
              {!isArchived(session) && (
                <Button
                  icon="eye"
                  mode="text"
                  onPress={() => handleViewSession(session)}
                >
                  View
                </Button>
              )}
              {isComplete(session) && (
                <Button
                  icon="archive"
                  mode="text"
                  onPress={() => handleArchiveSession(session)}
                >
                  Archive
                </Button>
              )}
              <Button
                icon="delete"
                mode="text"
                onPress={() => handleDeleteSession(session)}
              >
                Delete
              </Button>
              {!isLive(session) && (
                <Button
                  icon="content-duplicate"
                  mode="text"
                  onPress={() => handleCloneSession(session)}
                >
                  Clone
                </Button>
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
      <Icon source="calendar" size={48} />
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
            onPress={() => setEditSessionModalVisible(true)}
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

      {false && <PrimaryFAB />}

      <ArchivedSessions
        visible={modalArchiveVisible}
        onCancel={() => {
          setArchiveModalVisible(false);
        }}
      />

      <EditSessionModal
        visible={editSessionModalVisible}
        session={editingSession}
        onSave={handleSaveSession}
        onCancel={closeEditSessionModal}
      />

      <ViewSessionModal
        visible={viewSessionModalVisible}
        session={viewingSession}
        onCancel={closeViewSessionModal}
      />
    </SafeAreaView>
  );
}
