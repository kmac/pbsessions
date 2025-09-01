import React, { useState } from "react";
import { View, StyleSheet, FlatList, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Button,
  Card,
  Chip,
  Icon,
  Surface,
  Text,
  useTheme,
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
import SessionFormModal from "@/src/components/SessionFormModal";
import ViewSessionModal from "@/src/components/ViewSessionModal";
import { Alert } from "@/src/utils/alert";
import {
  endSessionThunk,
  startLiveSessionThunk,
  updateCourtInSessionThunk,
} from "@/src/store/actions/sessionActions";

export default function SessionsTab() {
  const theme = useTheme();
  const dispatch = useAppDispatch();

  const { sessions, loading } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);
  const { groups } = useAppSelector((state) => state.groups);

  const [editSessionModalVisible, setEditSessionModalVisible] = useState(false);
  const [modalArchiveVisible, setArchiveModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [viewSessionModalVisible, setViewSessionModalVisible] = useState(false);
  const [viewingSession, setViewingSession] = useState<Session | null>(null);

  const allLiveSessions = sessions.filter(
    (session) => session.state === SessionState.Live,
  );
  const allLiveSessionIds: string[] = allLiveSessions.map(
    (session) => session.id,
  );
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);

  const getSession = (sessionId: string) => {
    return sessions.find((session) => session.id === sessionId);
  };

  const isSessionLive = (sessionId: string) => {
    const session = getSession(sessionId);
    return session ? isLive(session) : false;
  };

  const isUnstarted = (session: Session) => {
    return session.state === SessionState.Unstarted;
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
          text: "Delete",
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
        sessionPlayers: getSessionPlayers(session),
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
    router.navigate("/");
  };

  const getSessionPlayers = (session: Session) => {
    return players.filter((player) => session.playerIds.includes(player.id));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
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
      >
        <Card.Content>
          {isSessionLive(session.id) && (
            <Chip
              icon="record"
              style={{
                alignSelf: "flex-start",
                marginBottom: 12,
                backgroundColor: theme.colors.inversePrimary,
              }}
              textStyle={{ color: theme.colors.primary, fontWeight: "bold" }}
              compact={true}
            >
              LIVE
            </Chip>
          )}

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
              <Text
                variant="titleSmall"
                style={{ fontWeight: "400", marginBottom: 8 }}
              >
                {session.state}
              </Text>
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
            {activeCourts.some((c) => c.minimumRating) && (
              <Chip icon="cog-outline" compact={true}>
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
          {isLive(session) && (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                icon="play"
                mode="contained"
                onPress={() => router.navigate("/live-session")}
              >
                Continue Live Session
              </Button>
              <Button
                icon="stop"
                mode="outlined"
                onPress={() => handleEndSession(session)}
              >
                End Session
              </Button>
            </View>
          )}
          {isUnstarted(session) && (
            <Button
              icon="play"
              mode="contained"
              onPress={() => handleStartLiveSession(session)}
            >
              Start Session
            </Button>
          )}
          <View style={{ flexDirection: "row", gap: 2 }}>
            {!isArchived(session) && (
              <Button
                icon="archive"
                mode="text"
                disabled={false}
                onPress={() => handleViewSession(session)}
              >
                View
              </Button>
            )}
            {!isComplete(session) && (
              <Button
                icon="pencil"
                mode="text"
                onPress={() => handleEditSession(session)}
              >
                Edit
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
          </View>
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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Surface
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
        elevation={1}
      >
        <View style={{ flex: 1 }}>
          <Text variant="headlineMedium" style={{ fontWeight: "bold" }}>
            Sessions (
            {sessions.filter((s) => s.state !== SessionState.Archived).length})
          </Text>
          {allLiveSessionIds.length > 0 && (
            <Text
              variant="bodyMedium"
              style={{
                marginTop: 2,
                fontWeight: "500",
              }}
            >
              Live session in progress
            </Text>
          )}
        </View>

        <View style={{ marginLeft: 12 }}>
          {players.length === 0 ? (
            <Button
              icon="open-in-new"
              mode="outlined"
              onPress={navigateToPlayers}
            >
              Add Players
            </Button>
          ) : (
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                icon="plus"
                mode="contained"
                onPress={() => setEditSessionModalVisible(true)}
              >
                New Session
              </Button>
              <Button
                icon="archive"
                mode="elevated"
                onPress={() => setArchiveModalVisible(true)}
              >
                View Archive
              </Button>
            </View>
          )}
        </View>
      </Surface>

      <FlatList
        data={sessions
          .filter((session) => session.state != SessionState.Archived)
          .sort((a, b) => {
            return a.createdAt.localeCompare(b.createdAt);
          })}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />

      {/*
      <FAB
        icon="plus"
        label="New Session"
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
        }}
        onPress={() => setEditSessionModalVisible(true)}
      />
      */}

      <Modal
        visible={modalArchiveVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ArchivedSessions
          onCancel={() => {
            setArchiveModalVisible(false);
          }}
        />
      </Modal>

      <Modal
        visible={editSessionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SessionFormModal
          session={editingSession}
          onSave={handleSaveSession}
          onCancel={closeEditSessionModal}
        />
      </Modal>

      <Modal
        visible={viewSessionModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ViewSessionModal
          session={viewingSession}
          onCancel={closeViewSessionModal}
        />
      </Modal>
    </SafeAreaView>
  );
}
