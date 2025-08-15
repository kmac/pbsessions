import React, { useState } from 'react';
import {
  View,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  Card,
  Icon,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useAppSelector, useAppDispatch } from '@/src/store';
import { addPlayer } from '@/src/store/slices/playersSlice';
import { Group, Player } from '@/src/types';
import PlayerCard from './PlayerCard';
import QuickPlayerForm from './QuickPlayerForm';
import { Alert } from '@/src/utils/alert'
import { APP_CONFIG } from '@/src/constants';

interface GroupPlayerManagerProps {
  visible: boolean;
  groupName: string;
  groupPlayers: Player[];
  onSave: (groupPlayers: Player[]) => void;
  onCancel: () => void;
}

type ViewMode = 'select' | 'add';

export default function GroupPlayerManager({
  visible,
  groupName,
  groupPlayers,
  onSave,
  onCancel
}: GroupPlayerManagerProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { players: allPlayers } = useAppSelector((state) => state.players);

  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>(groupPlayers);
  const selectedPlayerIds = selectedPlayers.map(item => item.id);

  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  function isPlayerSelected(player: Player) {
    return selectedPlayerIds.includes(player.id);
  };

  function addPlayerToSelected(player: Player) {
    setSelectedPlayers([...selectedPlayers, player]);
  }

  function handleTogglePlayer(player: Player) {
    if (isPlayerSelected(player)) {
      setSelectedPlayers(selectedPlayers.filter(item => item.id !== player.id));
    } else {
      addPlayerToSelected(player);
    }
  };

  const filteredPlayers = allPlayers.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.email && player.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const availablePlayers = filteredPlayers.filter(player => !isPlayerSelected(player));

  function handleQuickAddPlayer(playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) {
    dispatch(addPlayer(playerData));

    setTimeout(() => {
      const newPlayer = allPlayers[allPlayers.length - 1];
      addPlayerToSelected(newPlayer);
    }, 100);

    setShowQuickAdd(false);
    Alert.alert('Success', `${playerData.name} has been added to the group!`);
  };

  const handleSave = () => {
    onSave(selectedPlayers);
  };

  function renderPlayer({ item }: { item: Player }) {
    return (
      <PlayerCard
        player={item}
        isSelected={selectedPlayerIds.includes(item.id)}
        onToggle={handleTogglePlayer}
        showActions={true}
      />
    );
  };

  const SelectExistingView = () => (
    <>
      <TextInput
        mode="outlined"
        placeholder="Search players..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        left={<TextInput.Icon icon="magnify" />}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      />

      {/*
      <List.Section title="Group">
        <List.Accordion
          title={groupName}
          left={props => <List.Icon {...props} icon="folder" />}>
          {selectedPlayers.sort((a, b) => a.name.localeCompare(b.name)).map(player => (
            <List.Item
              title={player.name}
              description="player description"
              left={props => <List.Icon {...props} icon="account" />}
            />
          ))}
        </List.Accordion>
      </List.Section>
      */}

      {selectedPlayers.length > 0 && (
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <Text variant="titleMedium" style={{
            fontWeight: '600',
            marginBottom: 12
          }}>
            Selected Players ({selectedPlayers.length})
          </Text>
          <FlatList
            data={[...selectedPlayers].sort((a, b) => a.name.localeCompare(b.name))}
            renderItem={({ item }) => renderPlayer({ item })}
            keyExtractor={(item) => `selected-${item.id}`}
            scrollEnabled={false}
          />
        </View>
      )}

      <View style={{ marginHorizontal: 16 }}>
        <Text variant="titleMedium" style={{
          fontWeight: '600',
          marginBottom: 12
        }}>
          Available Players ({availablePlayers.length})
        </Text>

        {availablePlayers.length === 0 ? (
          <Surface style={{
            alignItems: 'center',
            paddingVertical: 32,
            borderRadius: 8
          }}>
            {searchQuery ? (
              <Text variant="bodyLarge" style={{
                color: theme.colors.onSurfaceVariant
              }}>
                No players match your search
              </Text>
            ) : (
              <>
                <Text variant="bodyLarge" style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 16
                }}>
                  All players are already in this group
                </Text>
                <Button
                  icon="plus"
                  mode="outlined"
                  onPress={() => setViewMode('add')}
                >
                  Add New Player
                </Button>
              </>
            )}
          </Surface>
        ) : (
          <FlatList
            data={[...availablePlayers].sort((a, b) => a.name.localeCompare(b.name))}
            renderItem={({ item }) => renderPlayer({ item })}
            keyExtractor={(item) => `available-${item.id}`}
            scrollEnabled={false}
          />
        )}
      </View>
    </>
  );

  const AddNewView = () => (
    <View style={{ padding: 16 }}>
      <Surface style={{
        alignItems: 'center',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24
      }}>
        <Icon source="account" size={32} />
        <Text variant="headlineSmall" style={{
          fontWeight: '600',
          marginTop: 12,
          textAlign: 'center'
        }}>
          Add New Player to Group
        </Text>
        <Text variant="bodyMedium" style={{
          color: theme.colors.onSurfaceVariant,
          marginTop: 8,
          textAlign: 'center',
          lineHeight: 20
        }}>
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
            <Text variant="titleMedium" style={{
              fontWeight: '600',
              marginBottom: 12
            }}>
              Current players in this group:
            </Text>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={true}>
              {selectedPlayers.map(player => (
                <View
                  key={player.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.surfaceVariant
                  }}
                >
                  <Text variant="bodyMedium">{player.name}</Text>
                  {player.rating && (
                    <Text
                      variant="bodySmall"
                      style={{
                        color: theme.colors.primary,
                        fontWeight: '500'
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Appbar.Header>
          <Appbar.BackAction onPress={onCancel} />
          <Appbar.Content title={groupName} />
          <Button
            style={{ marginRight: 8 }}
            icon="cancel"
            mode="outlined"
            onPress={onCancel}
          >Cancel</Button>
          <Button
            style={{ marginRight: 8 }}
            icon="content-save"
            mode="contained"
            onPress={handleSave}
          >Save</Button>
        </Appbar.Header>

        <SegmentedButtons
          value={viewMode}
          onValueChange={(value) => setViewMode(value as ViewMode)}
          buttons={[
            {
              value: 'select',
              label: 'Select Existing',
              icon: 'account-group'
            },
            {
              value: 'add',
              label: 'Add New',
              icon: 'plus'
            }
          ]}
          style={{ margin: 16 }}
        />

        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {viewMode === 'select' ? <SelectExistingView /> : <AddNewView />}
        </ScrollView>

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
