import React, { useState } from "react";
import { View, StyleSheet, FlatList, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Avatar,
  Button,
  Card,
  Chip,
  Icon,
  IconButton,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { router } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/src/store";
import {
  addGroup,
  updateGroup,
  removeGroup,
} from "@/src/store/slices/groupsSlice";
import { Group, Player } from "@/src/types";
import GroupForm from "@/src/components/GroupForm";
import GroupPlayerManager from "@/src/components/GroupPlayerManager";
import { Alert } from "@/src/utils/alert";

export default function GroupsTab() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { groups, loading } = useAppSelector((state) => state.groups);
  const { players: allPlayers } = useAppSelector((state) => state.players);

  const [groupModalVisible, setGroupModalVisible] = useState(false);
  const [playerManagerVisible, setPlayerManagerVisible] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  const handleDeleteGroup = (group: Group) => {
    Alert.alert(
      "Delete Group",
      `Are you sure you want to delete "${group.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => dispatch(removeGroup(group.id)),
        },
      ],
    );
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupModalVisible(true);
  };

  const handleManagePlayers = (group: Group) => {
    setSelectedGroup(group);
    setPlayerManagerVisible(true);
  };

  const navigateToPlayers = () => {
    router.navigate("/players");
  };

  const getGroupPlayers = (group: Group): Player[] => {
    return allPlayers.filter((player) => group.playerIds.includes(player.id));
  };

  const renderGroup = ({ item }: { item: Group }) => {
    const groupPlayers = getGroupPlayers(item);
    const averageRating =
      groupPlayers.length > 0
        ? groupPlayers.reduce((sum, p) => sum + (p.rating || 0), 0) /
          groupPlayers.filter((p) => p.rating).length
        : 0;

    return (
      <Card
        style={{
          marginBottom: 12,
        }}
      >
        <Card.Content>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 12,
            }}
          >
            <View
              style={{
                flex: 1,
                marginRight: 12,
              }}
            >
              <Text
                variant="titleMedium"
                style={{ fontWeight: "600", marginBottom: 4 }}
              >
                {item.name}
              </Text>
              {item.description && (
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {item.description}
                </Text>
              )}
            </View>
            <View
              style={{
                alignItems: "flex-end",
                gap: 8,
              }}
            >
              <View style={{ flexDirection: "row" }}>
                {averageRating > 0 && (
                  <Chip
                    icon="star-outline"
                    elevated
                    style={{ backgroundColor: theme.colors.secondaryContainer }}
                  >
                    <Text variant="labelSmall">
                      Avg: {averageRating.toFixed(1)}
                    </Text>
                  </Chip>
                )}
                <Chip icon="account-group" elevated>
                  <Text variant="labelMedium">{groupPlayers.length}</Text>
                </Chip>
              </View>
            </View>
          </View>

          {groupPlayers.length > 0 && (
            <View style={{ marginVertical: 12 }}>
              <Text
                variant="labelMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 4,
                }}
              >
                Players ({groupPlayers.length}):
              </Text>
              <Text
                variant="bodyMedium"
                numberOfLines={2}
                style={{
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                {groupPlayers
                  .map((p) => p.name)
                  .sort((a, b) => a.localeCompare(b))
                  .join(", ")}
              </Text>
            </View>
          )}
        </Card.Content>

        <Card.Actions style={{ justifyContent: "space-between" }}>
          <Button
            icon="account-multiple-plus-outline"
            mode="contained-tonal"
            onPress={() => handleManagePlayers(item)}
          >
            Players
          </Button>

          <View style={{ flexDirection: "row", gap: 4 }}>
            <IconButton icon="pencil" onPress={() => handleEditGroup(item)} />
            <IconButton icon="delete" onPress={() => handleDeleteGroup(item)} />
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
      <Icon source="account-group" size={48} />
      <Text
        variant="titleMedium"
        style={{
          fontWeight: "600",
          marginTop: 16,
          color: theme.colors.onSurfaceVariant,
        }}
      >
        No groups yet
      </Text>
      <Text
        variant="bodyMedium"
        style={{
          color: theme.colors.onSurfaceVariant,
          marginTop: 4,
          textAlign: "center",
          marginBottom: 20,
        }}
      >
        Create groups to organize players for sessions
      </Text>

      {allPlayers.length === 0 && (
        <Button icon="open-in-new" mode="outlined" onPress={navigateToPlayers}>
          Add Players First
        </Button>
      )}
    </View>
  );

  const handleSaveGroup = (
    groupData: Group | Omit<Group, "id" | "createdAt" | "updatedAt">,
  ) => {
    if (editingGroup) {
      dispatch(updateGroup(groupData as Group));
      setEditingGroup(null);
    } else {
      dispatch(
        addGroup(groupData as Omit<Group, "id" | "createdAt" | "updatedAt">),
      );
    }
    setGroupModalVisible(false);
  };

  const handleSaveGroupPlayers = (group: Group, players: Player[]) => {
    if (!players || !Array.isArray(players)) {
      console.error("Players is not an array:", players);
      return;
    }
    const newPlayerIds: string[] = players.map((player) => player.id);
    const newGroup: Group = { ...group, playerIds: newPlayerIds };
    dispatch(updateGroup(newGroup));
    setPlayerManagerVisible(false);
  };

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
        <View
          style={{
            flex: 1,
          }}
        >
          <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
            Groups ({groups.length})
          </Text>
          {allPlayers.length > 0 && (
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 2,
              }}
            >
              {allPlayers.length} players available
            </Text>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginLeft: 12,
          }}
        >
          {/*
          <Button
            icon="open-in-new"
            mode="outlined"
            onPress={navigateToPlayers}
          >
            Manage Players
          </Button>
          */}
          <Button
            icon="plus"
            mode="contained"
            onPress={() => setGroupModalVisible(true)}
          >
            Add Group
          </Button>
        </View>
      </Surface>

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />
      <Modal
        visible={groupModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <GroupForm
          group={editingGroup}
          onSave={(groupData) => {
            handleSaveGroup(groupData);
          }}
          onCancel={() => {
            setGroupModalVisible(false);
            setEditingGroup(null);
          }}
        />
      </Modal>

      {selectedGroup && (
        <GroupPlayerManager
          visible={playerManagerVisible}
          groupName={selectedGroup.name}
          groupPlayers={getGroupPlayers(selectedGroup)}
          onSave={(groupPlayers) => {
            handleSaveGroupPlayers(selectedGroup, groupPlayers);
          }}
          onCancel={() => {
            setPlayerManagerVisible(false);
            setSelectedGroup(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}
