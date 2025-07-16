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
import { addPlayerToGroup, removePlayerFromGroup } from '@/src/store/slices/groupsSlice';
import { addPlayer } from '@/src/store/slices/playersSlice';
import { Group, Player } from '@/src/types';
import QuickPlayerForm from './QuickPlayerForm';
import { Alert } from '@/src/utils/alert'
import { APP_CONFIG } from '@/src/constants';

interface GroupPlayerManagerProps {
  visible: boolean;
  group: Group;
  onClose: () => void;
}

type ViewMode = 'select' | 'add';

export default function GroupPlayerManager({
  visible,
  group,
  onClose
}: GroupPlayerManagerProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { players } = useAppSelector((state) => state.players);

  const currentGroup = useAppSelector((state) =>
    state.groups.groups.find(g => g.id === group.id)
  ) || group;

  const [viewMode, setViewMode] = useState<ViewMode>('select');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const isPlayerInGroup = (playerId: string) => {
    return currentGroup.playerIds.includes(playerId);
  };

  const handleTogglePlayer = (player: Player) => {
    if (isPlayerInGroup(player.id)) {
      dispatch(removePlayerFromGroup({ groupId: currentGroup.id, playerId: player.id }));
    } else {
      dispatch(addPlayerToGroup({ groupId: currentGroup.id, playerId: player.id }));
    }
  };

  const handleQuickAddPlayer = (playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch(addPlayer(playerData));

    setTimeout(() => {
      const allPlayers = players;
      const newPlayer = allPlayers[allPlayers.length - 1];
      if (newPlayer && !isPlayerInGroup(newPlayer.id)) {
        dispatch(addPlayerToGroup({ groupId: group.id, playerId: newPlayer.id }));
      }
    }, 100);

    setShowQuickAdd(false);
    Alert.alert('Success', `${playerData.name} has been added to the group!`);
  };

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.email && player.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const groupPlayers = players.filter(player => isPlayerInGroup(player.id));
  const availablePlayers = filteredPlayers.filter(player => !isPlayerInGroup(player.id));

  const renderPlayerItem = ({ item, showActions = true }: {
    item: Player;
    showActions?: boolean;
  }) => {
    const isSelected = isPlayerInGroup(item.id);

    return (
      <Card
        style={{
          marginBottom: 8,
          backgroundColor: isSelected
            ? theme.colors.primaryContainer
            : theme.colors.surface
        }}
      >
        <Card.Content>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <View style={{ flex: 1 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8
              }}>
                <Text
                  variant="titleMedium"
                  style={{
                    fontWeight: '600',
                    flex: 1,
                    color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface
                  }}
                >
                  {item.name}
                </Text>
                {item.rating && (
                  <Chip icon="star-outline" compact>
                    {item.rating.toFixed(APP_CONFIG.RATING_DECIMAL_PLACES)}
                  </Chip>
                )}
              </View>

              <View style={{ gap: 4 }}>
                {item.gender && (
                  <Text
                    variant="bodySmall"
                    style={{
                      color: isSelected
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant,
                      fontStyle: 'italic'
                    }}
                  >
                    {item.gender}
                  </Text>
                )}
              </View>
            </View>

            {showActions && (
              <IconButton
                icon={isSelected ? "check-circle" : "circle-outline"}
                size={24}
                iconColor={isSelected ? theme.colors.primary : theme.colors.outline}
                onPress={() => handleTogglePlayer(item)}
              />
            )}
          </View>
        </Card.Content>
      </Card>
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

      {groupPlayers.length > 0 && (
        <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
          <Text variant="titleMedium" style={{
            fontWeight: '600',
            marginBottom: 12
          }}>
            Selected Players ({groupPlayers.length})
          </Text>
          <FlatList
            data={[...groupPlayers].sort((a, b) => a.name.localeCompare(b.name))}
            renderItem={({ item }) => renderPlayerItem({ item })}
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
          Add a new player and they'll be automatically added to "{group.name}"
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

      {groupPlayers.length > 0 && (
        <Card>
          <Card.Content>
            <Text variant="titleMedium" style={{
              fontWeight: '600',
              marginBottom: 12
            }}>
              Current players in this group:
            </Text>
            <ScrollView style={{ maxHeight: 200 }} showsVerticalScrollIndicator={true}>
              {groupPlayers.map(player => (
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

  const groupPlayerCount = group.playerIds.length;

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
            title={group.name}
            subtitle={`${groupPlayerCount} player${groupPlayerCount !== 1 ? 's' : ''}`}
          />
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
            groupName={group.name}
          />
        </Modal>
      </SafeAreaView>
    </Modal>
  );
}
