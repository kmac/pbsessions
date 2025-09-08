import React, { useState, useEffect } from "react";
import { View, Modal, FlatList, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
  Card,
  Icon,
  SegmentedButtons,
  Searchbar,
  Surface,
  Text,
  useTheme,
  FAB,
} from "react-native-paper";
import { useAppSelector, useAppDispatch } from "@/src/store";
import { addPlayer } from "@/src/store/slices/playersSlice";
import { Group, Player } from "@/src/types";
import PlayerCard from "./PlayerCard";
import QuickPlayerForm from "./QuickPlayerForm";
import { Alert } from "@/src/utils/alert";
import { isNarrowScreen } from "@/src/utils/screenUtil";

interface GroupPlayerManagerProps {
  visible: boolean;
  groupName: string;
  groupPlayers: Player[];
  onSave: (groupPlayers: Player[]) => void;
  onCancel: () => void;
}

type ViewMode = "select" | "add";

export default function GroupPlayerManager({
  visible,
  groupName,
  groupPlayers,
  onSave,
  onCancel,
}: GroupPlayerManagerProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { players: allPlayers } = useAppSelector((state) => state.players);

  const [selectedPlayers, setSelectedPlayers] =
    useState<Player[]>(groupPlayers);

  const narrowScreen = isNarrowScreen();

  // Sync selectedPlayers with groupPlayers when props change
  useEffect(() => {
    setSelectedPlayers(groupPlayers);
  }, [groupPlayers]);

  const selectedPlayerIds = selectedPlayers.map((item) => item.id);

  const [viewMode, setViewMode] = useState<ViewMode>("select");
  const [groupPlayerSearchQuery, setGroupPlayerSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  function isPlayerSelected(player: Player) {
    return selectedPlayerIds.includes(player.id);
  }

  function addPlayerToSelected(player: Player) {
    setSelectedPlayers([...selectedPlayers, player]);
  }

  function handleTogglePlayer(player: Player) {
    if (isPlayerSelected(player)) {
      setSelectedPlayers(
        selectedPlayers.filter((item) => item.id !== player.id),
      );
    } else {
      addPlayerToSelected(player);
    }
  }

  const filteredPlayers = allPlayers.filter(
    (player) =>
      player.name
        .toLowerCase()
        .includes(groupPlayerSearchQuery.toLowerCase()) ||
      (player.email &&
        player.email
          .toLowerCase()
          .includes(groupPlayerSearchQuery.toLowerCase())),
  );

  const availablePlayers = filteredPlayers.filter(
    (player) => !isPlayerSelected(player),
  );

  const filteredSelectedPlayers = selectedPlayers.filter(
    (player) =>
      player.name
        .toLowerCase()
        .includes(groupPlayerSearchQuery.toLowerCase()) ||
      (player.email &&
        player.email
          .toLowerCase()
          .includes(groupPlayerSearchQuery.toLowerCase())),
  );

  function handleQuickAddPlayer(
    playerData: Omit<Player, "id" | "createdAt" | "updatedAt">,
  ) {
    dispatch(addPlayer(playerData));

    setTimeout(() => {
      const newPlayer = allPlayers[allPlayers.length - 1];
      addPlayerToSelected(newPlayer);
    }, 100);

    setShowQuickAdd(false);
    Alert.alert("Success", `${playerData.name} has been added to the group!`);
  }

  const handleSave = () => {
    onSave(selectedPlayers);
  };

  const SelectExistingView = () => (
    <>
      {selectedPlayers.length > 0 && (
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <Text
            variant="titleMedium"
            style={{
              fontWeight: "600",
              marginBottom: 12,
            }}
          >
            Selected Players ({selectedPlayers.length})
          </Text>
          <View>
            {[...filteredSelectedPlayers]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((item) => (
                <PlayerCard
                  key={`selected-${item.id}`}
                  player={item}
                  isSelected={selectedPlayerIds.includes(item.id)}
                  onToggle={handleTogglePlayer}
                  showActions={true}
                />
              ))}
          </View>
        </View>
      )}

      <View style={{ marginHorizontal: 16 }}>
        <Text
          variant="titleMedium"
          style={{
            fontWeight: "600",
            marginBottom: 12,
          }}
        >
          Available Players ({availablePlayers.length})
        </Text>

        {availablePlayers.length === 0 ? (
          <Surface
            style={{
              alignItems: "center",
              paddingVertical: 32,
              borderRadius: 8,
            }}
          >
            {groupPlayerSearchQuery ? (
              <Text
                variant="bodyLarge"
                style={{
                  color: theme.colors.onSurfaceVariant,
                }}
              >
                No players match your search
              </Text>
            ) : (
              <>
                <Text
                  variant="bodyLarge"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginBottom: 16,
                  }}
                >
                  All players are already in this group
                </Text>
                <Button
                  icon="plus"
                  mode="outlined"
                  onPress={() => setViewMode("add")}
                >
                  Add New Player
                </Button>
              </>
            )}
          </Surface>
        ) : (
          <View>
            {[...availablePlayers]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((item) => (
                <PlayerCard
                  key={`available-${item.id}`}
                  player={item}
                  isSelected={selectedPlayerIds.includes(item.id)}
                  onToggle={handleTogglePlayer}
                  showActions={true}
                />
              ))}
          </View>
        )}
      </View>
    </>
  );

  const AddNewView = () => (
    <View style={{ padding: 16 }}>
      <Surface
        style={{
          alignItems: "center",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <Icon source="account" size={32} />
        <Text
          variant="headlineSmall"
          style={{
            fontWeight: "600",
            marginTop: 12,
            textAlign: "center",
          }}
        >
          Add New Player to Group
        </Text>
        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.onSurfaceVariant,
            marginTop: 8,
            textAlign: "center",
            lineHeight: 20,
          }}
        >
          Add a new player and they'll be automatically added to "{groupName}"
        </Text>
      </Surface>

      <Button
        icon="plus"
        mode="contained"
        onPress={() => setShowQuickAdd(true)}
        contentStyle={{ paddingVertical: 8 }}
        style={{ marginBottom: 24 }}
      >
        Add New Player
      </Button>

      {selectedPlayers.length > 0 && (
        <Card>
          <Card.Content>
            <Text
              variant="titleMedium"
              style={{
                fontWeight: "600",
                marginBottom: 12,
              }}
            >
              Current players in this group:
            </Text>
            <ScrollView
              style={{ maxHeight: 200 }}
              showsVerticalScrollIndicator={true}
            >
              {selectedPlayers.map((player) => (
                <View
                  key={player.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.surfaceVariant,
                  }}
                >
                  <Text variant="bodyMedium">{player.name}</Text>
                  {player.rating && (
                    <Text
                      variant="bodySmall"
                      style={{
                        color: theme.colors.primary,
                        fontWeight: "500",
                      }}
                    >
                      {player.rating.toFixed(1)}
                    </Text>
                  )}
                </View>
              ))}
            </ScrollView>
          </Card.Content>
        </Card>
      )}
    </View>
  );

  const BottomActionBar = () => (
    <Surface
      style={{
        flexDirection: narrowScreen ? "column" : "row",
        padding: 16,
        gap: narrowScreen ? 12 : 16,
        borderTopWidth: 1,
        borderTopColor: theme.colors.outlineVariant,
        backgroundColor: theme.colors.surface,
      }}
      elevation={3}
    >
      {narrowScreen ? (
        // Stack buttons vertically on narrow screens
        <>
          <Button
            icon="content-save"
            mode="contained"
            onPress={handleSave}
            //contentStyle={{ paddingVertical: 12 }}
          >
            Save Changes
          </Button>
          <Button
            icon="cancel"
            mode="outlined"
            onPress={onCancel}
            //contentStyle={{ paddingVertical: 12 }}
          >
            Cancel
          </Button>
        </>
      ) : (
        // Side by side on wider screens
        <>
          <Button
            icon="cancel"
            mode="outlined"
            onPress={onCancel}
            style={{ flex: 1 }}
            //contentStyle={{ paddingVertical: 8 }}
          >
            Cancel
          </Button>
          <Button
            icon="content-save"
            mode="contained"
            onPress={handleSave}
            style={{ flex: 1 }}
            //contentStyle={{ paddingVertical: 8 }}
          >
            Save Changes
          </Button>
        </>
      )}
    </Surface>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={{ flex: 1 }}>
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
                {groupName}
              </Text>
            }
          />
          {/* Keep one action button on wider screens */}
          {!narrowScreen && (
            <Appbar.Action icon="content-save" onPress={handleSave} />
          )}
        </Appbar.Header>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: narrowScreen ? 160 : 100 }}
        >
          <SegmentedButtons
            value={viewMode}
            onValueChange={(value) => setViewMode(value as ViewMode)}
            buttons={[
              {
                value: "select",
                label: "Select Existing",
                icon: "account-group",
              },
              {
                value: "add",
                label: "Add New",
                icon: "plus",
              },
            ]}
            style={{ margin: 16 }}
          />

          <Searchbar
            placeholder="Search players..."
            onChangeText={setGroupPlayerSearchQuery}
            value={groupPlayerSearchQuery}
            mode="bar"
            style={{ marginHorizontal: 16, marginTop: 6, marginBottom: 12 }}
          />

          {viewMode === "select" ? <SelectExistingView /> : <AddNewView />}
        </ScrollView>

        {false && narrowScreen && (
          <FAB
            icon="content-save"
            onPress={handleSave}
            color={theme.colors.onPrimary}
            size="medium"
            style={{
              position: "absolute",
              margin: 16,
              right: 0,
              bottom: 100, // Above the bottom action bar
              backgroundColor: theme.colors.primary,
            }}
          />
        )}

        <BottomActionBar />

        <Modal
          visible={showQuickAdd}
          animationType="slide"
          presentationStyle="formSheet"
        >
          <QuickPlayerForm
            onSave={handleQuickAddPlayer}
            onCancel={() => setShowQuickAdd(false)}
            groupName={groupName}
          />
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}
