import React, { useState } from "react";
import { View, FlatList, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
  Card,
  Chip,
  Icon,
  IconButton,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  removeSession,
  restoreSession,
} from "@/src/store/slices/sessionsSlice";
import ViewSessionModal from "@/src/components/ViewSessionModal";
import { Session, SessionState } from "@/src/types";
import { Alert } from "@/src/utils/alert";

interface ArchivedSessionsProps {
  visible: boolean;
  onCancel: () => void;
}

export default function ArchivedSessions({
  visible,
  onCancel,
}: ArchivedSessionsProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { sessions, loading } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);

  const [viewSessionModalVisible, setViewSessionModalVisible] = useState(false);
  const [viewingSession, setViewingSession] = useState<Session | null>(null);

  const handleRestoreSession = (session: Session) => {
    Alert.alert(
      "Restore Session?",
      `Are you sure you want to restore "${session.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restore",
          style: "default",
          onPress: () => dispatch(restoreSession(session.id)),
        },
      ],
    );
  };

  const handleDeleteSession = (session: Session) => {
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

  // TODO need to handle deleted players
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

  function isComplete(session: Session) {
    return session.state === SessionState.Complete;
  }

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

  const renderSession = ({ item }: { item: Session }) => {
    const sessionPlayers = getSessionPlayers(item);
    const activeCourts = item.courts.filter((c) => c.isActive);

    return (
      <Card
        style={[{ marginBottom: 12 }]}
        onPress={() => handleViewSession(item)}
      >
        <Card.Content>
          <View style={{ marginBottom: 12 }}>
            <Text
              variant="titleMedium"
              style={{ fontWeight: "600", marginBottom: 8 }}
            >
              {isComplete(item) ? `${item.name} (Complete)` : item.name}
            </Text>
            <View style={{ flexDirection: "row", gap: 16 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
              >
                <Icon source="calendar" size={14} />
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {formatDate(item.dateTime)}
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
                  {formatTime(item.dateTime)}
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
                {sessionPlayers.map((p) => p.name).join(", ")}
              </Text>
            </View>
          )}
        </Card.Content>

        <Card.Actions style={{ justifyContent: "space-between" }}>
          <>
            <Button
              icon="archive"
              mode="outlined"
              onPress={() => handleViewSession(item)}
            >
              View Session
            </Button>
            <View style={{ flexDirection: "row", gap: 4 }}>
              <IconButton
                icon="restore"
                mode="contained"
                disabled={false}
                onPress={() => {
                  handleRestoreSession(item);
                }}
              />
              <IconButton
                icon="delete"
                mode="contained-tonal"
                onPress={() => handleDeleteSession(item)}
              />
            </View>
          </>
        </Card.Actions>
      </Card>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
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
              Archives
            </Text>
          }
        />
      </Appbar.Header>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
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
            <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
              Archived Sessions (
              {sessions.filter((s) => s.state === SessionState.Archived).length}
              )
            </Text>
          </View>
        </Surface>

        <FlatList
          data={sessions.filter(
            (session) => session.state === SessionState.Archived,
          )}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          // ListEmptyComponent={<EmptyState />}
        />

        <ViewSessionModal
          visible={viewSessionModalVisible}
          session={viewingSession}
          onCancel={closeViewSessionModal}
        />
      </SafeAreaView>
    </Modal>
  );
}
