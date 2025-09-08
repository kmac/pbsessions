import React, { useState, useEffect } from "react";
import { FlatList, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
  Surface,
  Text,
  TextInput,
  useTheme,
  Dialog,
} from "react-native-paper";
import GroupPlayerManager from "@/src/components/GroupPlayerManager";
import { useAppSelector } from "@/src/store";
import { Group, Player } from "../types";
import { Alert } from "../utils/alert";

interface GroupFormProps {
  group: Group | null;
  onSave: (
    group: Group | Omit<Group, "id" | "createdAt" | "updatedAt">,
  ) => void;
  onCancel: () => void;
}

export default function GroupForm({ group, onSave, onCancel }: GroupFormProps) {
  const theme = useTheme();
  const [playerManagerVisible, setPlayerManagerVisible] = useState(false);
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const { players: allPlayers } = useAppSelector((state) => state.players);

  const [formData, setFormData] = useState({
    name: group?.name || "",
    description: group?.description || "",
    playerIds: group?.playerIds || [],
  });

  // Track original player IDs to detect changes
  const [originalPlayerIds, setOriginalPlayerIds] = useState<string[]>(
    group?.playerIds || [],
  );

  useEffect(() => {
    const newFormData = {
      name: group?.name || "",
      description: group?.description || "",
      playerIds: group?.playerIds || [],
    };
    setFormData(newFormData);
    setOriginalPlayerIds(group?.playerIds || []);
  }, [group]);

  // Check if there are unsaved changes to players
  const hasUnsavedPlayerChanges = () => {
    const currentIds = [...formData.playerIds].sort();
    const originalIds = [...originalPlayerIds].sort();
    return JSON.stringify(currentIds) !== JSON.stringify(originalIds);
  };

  const currentGroupPlayers = allPlayers.filter((player) =>
    formData.playerIds.includes(player.id),
  );

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Group name is required");
      return;
    }

    const groupData = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      playerIds: formData.playerIds || [],
    };

    if (group) {
      onSave({ ...group, ...groupData });
    } else {
      onSave(groupData);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedPlayerChanges()) {
      setCancelDialogVisible(true);
    } else {
      onCancel();
    }
  };

  const handleConfirmCancel = () => {
    setCancelDialogVisible(false);
    onCancel();
  };

  const handleKeepEditing = () => {
    setCancelDialogVisible(false);
  };

  const handleSaveGroupPlayers = (gp: Player[]) => {
    const newPlayerIds: string[] = gp.map((p) => p.id);
    setFormData({ ...formData, playerIds: newPlayerIds });
    setPlayerManagerVisible(false);
  };

  const handleManagePlayers = () => {
    setPlayerManagerVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={handleCancel} />
        <Appbar.Content
          title={group ? "Edit Group" : "Add Group"}
          titleStyle={{ fontWeight: "600" }}
        />
        <Button
          mode="text"
          onPress={handleCancel}
          style={{ marginRight: 8 }}
          textColor={theme.colors.onSurface}
        >
          Cancel
        </Button>
        <Button
          icon="content-save"
          mode="contained"
          onPress={handleSave}
          style={{ marginRight: 8 }}
        >
          Save
        </Button>
      </Appbar.Header>

      <ScrollView
        style={{ flex: 1, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Surface
          style={{
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "column",
              columnGap: 12,
            }}
          >
            <Text
              variant="labelLarge"
              style={{
                marginBottom: 8,
                color: theme.colors.onSurface,
              }}
            >
              Group Name *
            </Text>
            <TextInput
              mode="outlined"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter group name"
              autoFocus={!group}
              style={{ marginBottom: 16 }}
            />
            <Text
              variant="labelLarge"
              style={{
                marginBottom: 8,
                color: theme.colors.onSurface,
              }}
            >
              Description
            </Text>
            <TextInput
              mode="outlined"
              value={formData.description}
              onChangeText={(text) =>
                setFormData({ ...formData, description: text })
              }
              placeholder="Enter group description (optional)"
              multiline
              numberOfLines={4}
              contentStyle={{ minHeight: 100 }}
            />
            <View
              style={{
                flexDirection: "row",
                marginTop: 16,
                marginBottom: 12,
              }}
            >
              <Button
                icon="account-multiple-plus-outline"
                mode="contained-tonal"
                compact={true}
                onPress={() => handleManagePlayers()}
                contentStyle={{ paddingHorizontal: 12 }}
              >
                {formData.playerIds.length > 0
                  ? "Manage Players"
                  : "Add Players"}
              </Button>
            </View>
            {formData.playerIds && (
              <View style={{ marginVertical: 12 }}>
                <Text
                  variant="labelLarge"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginBottom: 4,
                  }}
                >
                  Players ({formData.playerIds.length}):
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  {currentGroupPlayers
                    .map((p) => p.name)
                    .sort((a, b) => a.localeCompare(b))
                    .join(", ")}
                </Text>
                {false && (
                  <FlatList
                    data={currentGroupPlayers
                      .map((p) => p.name)
                      .sort((a, b) => a.localeCompare(b))}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => {
                      return (
                        <View style={{ marginLeft: 10 }}>
                          <Text
                            variant="bodySmall"
                            style={{
                              color: theme.colors.onSurfaceVariant,
                            }}
                          >
                            {`\u2022 ${item}`}
                          </Text>
                        </View>
                      );
                    }}
                    showsVerticalScrollIndicator={true}
                  />
                )}
              </View>
            )}
          </View>
        </Surface>
      </ScrollView>

      <GroupPlayerManager
        visible={playerManagerVisible}
        groupName={formData.name || "New Group"}
        groupPlayers={currentGroupPlayers}
        onSave={(gp) => {
          handleSaveGroupPlayers(gp);
        }}
        onCancel={() => {
          setPlayerManagerVisible(false);
        }}
      />

      <Dialog visible={cancelDialogVisible} onDismiss={handleKeepEditing}>
        <Dialog.Title>Unsaved Changes</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">
            You have unsaved changes to the player list. Are you sure you want
            to cancel?
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={handleKeepEditing}>Keep Editing</Button>
          <Button onPress={handleConfirmCancel} textColor={theme.colors.error}>
            Discard Changes
          </Button>
        </Dialog.Actions>
      </Dialog>
    </SafeAreaView>
  );
}
