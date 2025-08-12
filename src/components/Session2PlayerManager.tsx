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
  Chip,
  Icon,
  IconButton,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { useAppSelector, useAppDispatch } from '@/src/store';
import { addPlayerToSession, removePlayerFromSession } from '@/src/store/slices/sessionsSlice';
import { addPlayer } from '@/src/store/slices/playersSlice';
import { Player } from '@/src/types';
import PlayerCard from './PlayerCard';
import QuickPlayerForm from './QuickPlayerForm';
import { Alert } from '@/src/utils/alert'
import { APP_CONFIG } from '@/src/constants';

interface Session2PlayerManagerProps {
  visible: boolean;
  name: string;
  selectedPlayerIds: string[];
  onSelectionChange: (playerIds: string[]) => void;
  onClose: () => void;
}

type ViewMode = 'select' | 'add';


export default function Session2PlayerManager({
  visible,
  name,
  selectedPlayerIds,
  onSelectionChange,
  onClose
}: Session2PlayerManagerProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { players: allPlayers } = useAppSelector((state) => state.players);

  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  function isPlayerSelected(playerId: string) {
    return selectedPlayerIds.includes(playerId);
  };

  function handleTogglePlayer(playerId: string) {
    if (isPlayerSelected(playerId)) {
      onSelectionChange(selectedPlayerIds.filter(id => id !== playerId));
    } else {
      onSelectionChange([...selectedPlayerIds, playerId]);
    }
  };

  function updateSearch(query: string) {
    setTimeout(() => {
      setSearchQuery(query)
    }, 100);
  }

  const handleQuickAddPlayer = (playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch(addPlayer(playerData));

    setTimeout(() => {
      const newPlayer = allPlayers[allPlayers.length - 1];
      handleTogglePlayer(newPlayer.id)
    }, 100);

    setShowQuickAdd(false);
    // Alert.alert('Success', `${playerData.name} has been added to the session!`);
  };

  const filteredPlayers = allPlayers.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.email && player.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedPlayers = allPlayers.filter(player => isPlayerSelected(player.id));
  const availablePlayers = filteredPlayers.filter(player => !isPlayerSelected(player.id));

  function renderPlayerItem({ item, showActions = true }: {
    item: Player;
    showActions?: boolean;
  }) {
    return (
      <PlayerCard
        player={item}
        isSelected={isPlayerSelected(item.id)}
        onToggle={handleTogglePlayer}
        showActions={showActions}
      />
    );
  };

  const SelectExistingView = () => (
    <>
      {/*
      <TextInput
        mode="outlined"
        placeholder="Search players..."
        value={searchQuery}
        onChangeText={text => updateSearch(text)}
        // onChangeText={text => updateSearch(text)}
        left={<TextInput.Icon icon="magnify" />}
        style={{ marginHorizontal: 16, marginBottom: 16 }}
      />
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
            renderItem={({ item }) => renderPlayerItem({ item })}
            keyExtractor={(item) => `selected-${item.id}`}
            scrollEnabled={false}
          />
        </View>
      )}

      <View style={{ marginHorizontal: 16 }}>

        <TextInput
          mode="outlined"
          placeholder="Search available..."
          value={searchQuery}
          onChangeText={text => setSearchQuery(text)}
          left={<TextInput.Icon icon="magnify" />}
          style={{ marginHorizontal: 16, marginBottom: 16 }}
        />

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
            renderItem={({ item }) => renderPlayerItem({ item })}
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
          Add a new player and they'll be automatically added to this session"
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

  const selectedPlayerCount = selectedPlayerIds.length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={{ flex: 1 }}>
        <Appbar.Header>
          <Appbar.BackAction onPress={onClose} />
          <Appbar.Content
            title={`Select players: ${name}`}
            subtitle={`${selectedPlayerCount} player${selectedPlayerCount !== 1 ? 's' : ''}`}
          />
        </Appbar.Header>

        {/*
        <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.surfaceVariant
        }}
        >
          <Text variant="titleSmall" style={{
            fontWeight: '600',
          }}>
            Select Players for Session</Text>
        </View>
        */}
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
            groupName={name}
          />
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}
