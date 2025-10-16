import React, { useState } from "react";
import { View, FlatList, Modal, Platform } from "react-native";
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
  Portal,
  Dialog,
  TextInput,
} from "react-native-paper";
import { router } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  removeSession,
  restoreSession,
} from "@/src/store/slices/sessionsSlice";
import { Session, SessionState } from "@/src/types";
import { Alert } from "@/src/utils/alert";
import { exportSessionResultsToCsv } from "@/src/utils/csv";
import { saveToFile, copyToClipboard } from "@/src/utils/fileClipboardUtil";

interface ArchivedSessionsProps {
  visible: boolean;
  onCancel: () => void;
}

export const ArchivedSessions: React.FC<ArchivedSessionsProps> = ({
  visible,
  onCancel,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { sessions, loading } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);

  const [exportDialogVisible, setExportDialogVisible] = useState(false);
  const [exportCsvContent, setExportCsvContent] = useState("");
  const [exportingSession, setExportingSession] = useState<Session | null>(
    null,
  );

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
    router.navigate({
      pathname: "/view-session",
      params: { sessionId: session.id },
    });
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
            <Chip icon="account-group" compact>
              {sessionPlayers.length} players
            </Chip>
            <Chip icon="map-marker-outline" compact>
              {activeCourts.length} courts
            </Chip>
            {activeCourts.some((c) => c.minimumRating) && (
              <Chip icon="cog-outline" compact>
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
          <Button
            icon="archive"
            mode="outlined"
            onPress={() => handleViewSession(item)}
          >
            View Session
          </Button>
          <View style={{ flexDirection: "row", gap: 4 }}>
            <IconButton
              icon="file-export-outline"
              mode="contained-tonal"
              onPress={() => handleExportSession(item)}
            />
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
        </Card.Actions>
      </Card>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
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
      </SafeAreaView>
    </Modal>
  );
};
