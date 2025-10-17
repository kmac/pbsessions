import React, { useRef, useState } from "react";
import { View, ScrollView, FlatList, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Banner,
  Button,
  Card,
  Divider,
  Chip,
  Icon,
  IconButton,
  List,
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
import { GroupForm } from "@/src/components/GroupForm";
import { GroupPlayerManager } from "@/src/components/GroupPlayerManager";
import { TabHeader } from "@/src/components/TabHeader";
import { TopDescription } from "@/src/components/TopDescription";
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
  const isAppInitialized = useAppSelector((state) => state.app.isInitialized);
  const [bannerVisible, setBannerVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const toggleBanner = () => {
    let visible = bannerVisible;
    setBannerVisible(!visible);
    if (!visible && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

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

  const renderGroup = ({ item: group }: { item: Group }) => {
    const groupPlayers = getGroupPlayers(group);
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
              // justifyContent: "space-between",
              // alignItems: "flex-start",
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
                {group.name}
              </Text>
              {group.description && (
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {group.description}
                </Text>
              )}
            </View>
            <View
              style={{
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 4,
              }}
            >
              <Chip icon="account-group" elevated compact>
                <Text variant="labelMedium">{groupPlayers.length}</Text>
              </Chip>
              {averageRating > 0 && (
                <Chip
                  icon="star-outline"
                  elevated
                  compact
                  style={{ backgroundColor: theme.colors.secondaryContainer }}
                >
                  <Text variant="labelSmall">
                    Avg: {averageRating.toFixed(1)}
                  </Text>
                </Chip>
              )}
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
            mode="outlined"
            compact
            onPress={() => handleManagePlayers(group)}
          >
            Manage Players
          </Button>

          <View style={{ flexDirection: "row", gap: 4 }}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleEditGroup(group)}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteGroup(group)}
            />
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
        <Text style={{ marginTop: 16 }}>Loading groups...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
        <TabHeader title="Groups" />

          <Button
            icon="plus"
            mode="contained"
            onPress={() => setGroupModalVisible(true)}
          >
            Add Group
          </Button>
          <IconButton
            icon="tooltip-question"
            mode="contained"
            size={30}
            onPress={() => {
              toggleBanner();
            }}
          />
      </Surface>

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          padding: 16,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <IconButton
                icon={bannerVisible ? "chevron-up" : "chevron-down"}
                onPress={() => {
                  toggleBanner();
                }}
              />
            </View>
            <Banner
              visible={bannerVisible}
              contentStyle={{
                width: "90%",
              }}
              actions={[
                {
                  label: "Dismiss",
                  onPress: () => {
                    setBannerVisible(false);
                  },
                },
              ]}
            >
              <View
                style={{
                  alignItems: "stretch",
                  marginTop: 20,
                }}
              >
                <TopDescription
                  visible={true}
                  description={
                    "Organize players in groups for easier session management. " +
                    "Create a new group and add players to it. " +
                    "You can then use this group when creating a new session."
                  }
                />
                <Card>
                  <List.Item
                    descriptionNumberOfLines={5}
                    title="Add Group"
                    description="The top button lets you add a new group of players."
                  />
                  <Divider />
                  <List.Item
                    descriptionNumberOfLines={5}
                    title="Manage Players"
                    description="Once a group has been created you can add/remove players from the players list."
                  />
                </Card>
              </View>
            </Banner>
          </ScrollView>
        }
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
