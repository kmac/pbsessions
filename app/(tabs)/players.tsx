import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Avatar,
  Button,
  Card,
  Chip,
  Icon,
  IconButton,
  List,
  Surface,
  Text,
} from 'react-native-paper';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, Edit2, Trash2, Users } from 'lucide-react-native';
import { RootState } from '@/src/store';
import { addPlayer, updatePlayer, removePlayer } from '@/src/store/slices/playersSlice';
import { Player } from '@/src/types';
import PlayerForm from '@/src/components/PlayerForm';
import BulkAddModal from '@/src/components/BulkAddModal';
import { colors } from '@/src/theme';
import { Alert } from '@/src/utils/alert'
import { APP_CONFIG } from '@/src/constants';
// import Colors from '@/src/ui/styles/colors';
// import Themes from '@/src/ui/styles/themes';

import { useTheme } from 'react-native-paper'

const theme = useTheme()

export default function PlayersTab() {
  const dispatch = useDispatch();
  const { players, loading } = useSelector((state: RootState) => state.players);
  const groups = useSelector((state: RootState) => state.groups.groups);

  const [modalVisible, setModalVisible] = useState(false);
  const [bulkModalVisible, setBulkModalVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const handleAddPlayer = (playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch(addPlayer(playerData));
    setModalVisible(false);
  };

  const handleUpdatePlayer = (playerData: Player) => {
    dispatch(updatePlayer(playerData));
    setEditingPlayer(null);
    setModalVisible(false);
  };

  const handleSavePlayer = (playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'> | Player) => {
    if (editingPlayer && 'id' in playerData) {
      handleUpdatePlayer(playerData as Player);
    } else {
      handleAddPlayer(playerData as Omit<Player, 'id' | 'createdAt' | 'updatedAt'>);
    }
  };

  const handleDeletePlayer = (player: Player) => {
    // Check if player is in any groups
    const playerGroups = groups.filter(group =>
      group.playerIds.includes(player.id)
    );
    if (playerGroups.length > 0) {
      Alert.alert(
        'Cannot Delete Player',
        `${player.name} is assigned to ${playerGroups.length} group(s). Remove them from all groups first.`,
        [{ text: 'OK' }]
      );
      return;
    }
    Alert.alert(
      'Delete Player',
      `Are you sure you want to delete ${player.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(removePlayer(player.id)),
        },
      ]
    );
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setModalVisible(true);
  };

  const getPlayerGroupCount = (playerId: string) => {
    return groups.filter(group => group.playerIds.includes(playerId)).length;
  };

  const getPlayerDetails = (item: Player) => {
    let details = "";
    let separator = "";
    if (item.gender) {
      details = `${item.gender}`;
      separator = ", "
    }
    if (item.email) {
      details = details + separator + `${item.email}`;
      separator = ", "
    }
    if (item.phone) {
      details = details + separator + `${item.phone}`;
      separator = ", "
    }
    return details;
  };

  function getPlayerName(name: string, gender: 'male' | 'female' | 'other' | undefined) {
    if (gender) {
      return `${name} ${getShortGender(gender)}`;
    }
    return name;
  }

  const getShortGender = (gender: 'male' | 'female' | 'other' | undefined) => {
    switch (gender) {
      case 'male':
        return '(M)';
      case 'female':
        return '(F)';
      case 'other':
        return '(O)';
      default:
        return '';
    }
  }

  function getAvatar(gender: 'male' | 'female' | 'other' | undefined, props: any) {
    let iconName = "account";
    if (gender === 'male') {
      // iconName = "human-male";
      iconName = "face-man"
    }
    if (gender === 'female') {
      iconName = "face-woman"
      // iconName = "human-female";
    }
    return (
      <Avatar.Icon icon={iconName} size={40} />
    );
  }

  function getAvatarName(name: string, props: any) {
    let initials: string = "";
    if (name.length > 1) {
      name.split(' ').forEach((val) => {
        initials += val.charAt(0);
      });
    } else {
      initials = name.charAt(0)
    }

    return (
      <Avatar.Text /*...props*/ style={{ marginLeft: 12 }} label={initials} size={40} />
    );
  }

  const renderPlayerList = ({ item }: { item: Player }) => (
    <Surface style={{ margin: 0 }}>
      <List.Item
        title={() => (
          <Text variant="titleMedium" style={{
            fontWeight: '600',
            marginBottom: 4,
          }}>{item.name}</Text>
        )}
        description={() => (
          <View>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 20,
            }}>
              <View style={{ flexDirection: 'row', flex: 3 }}>
                {item.gender && (<Text style={{
                  fontSize: 12,
                  marginRight: 4,
                }}>{getShortGender(item.gender)}</Text>)}
                {item.email && (<Text style={{
                  fontSize: 12,
                  marginRight: 4,
                }}>{item.email}</Text>)}
                {item.phone && (<Text style={{
                  fontSize: 12,
                  marginRight: 4,
                }}>{item.phone}</Text>)}
              </View>
              {item.rating && <Chip icon="star-outline" elevated={true} compact={true}
                textStyle={{
                  fontSize: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>{item.rating.toFixed(APP_CONFIG.RATING_DECIMAL_PLACES)}</Chip>}
            </View>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 20,
            }}>
              <Icon source="account-group" size={20} />
              <Text style={{
                fontSize: 10,
                fontWeight: '300',
                // color: theme.colors.primary,
                // backgroundColor: themeColors.backdrop,
                flexDirection: 'row',
                alignItems: 'center',
                flex: 3, marginLeft: 5
              }}>{getPlayerGroupCount(item.id)} groups</Text>
            </View>
          </View>
        )}
        //left={(props) => getAvatar(item.gender, props)}
        left={(props) => getAvatarName(item.name, props)}
        right={(props) => (
          <View {...props} style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => handleEditPlayer(item)}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeletePlayer(item)}
            />
          </View>
        )}
      />
    </Surface>
  );

  return (
    <SafeAreaView style={{
      flex: 1,
      // backgroundColor: colors.background,
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.surfaceVariant
      }}>
        <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
          Players ({players.length})
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, }}>
          <Button icon="account-multiple-plus-outline" mode="elevated" onPress={() => setBulkModalVisible(true)}>Bulk Add</Button>
          <Button icon="import" mode="elevated" disabled={true} onPress={() => { }}>Import</Button>
          <Button icon="account-plus-outline" mode="contained-tonal" onPress={() => setModalVisible(true)}><Text style={{ fontWeight: '600' }}>Add Player</Text></Button>
        </View>
      </View>

      <FlatList
        data={[...players].sort((a, b) => a.name.localeCompare(b.name))}
        renderItem={renderPlayerList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, }}
        showsVerticalScrollIndicator={true}
        ListEmptyComponent={
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 64,
          }}>
            <Users size={48} />
            <Text style={{
              fontSize: 18,
              fontWeight: '600',
              marginTop: 16,
            }}>No players yet</Text>
            <Text style={{
              fontSize: 14,
              // color: colors.gray,
              marginTop: 4,
            }}>
              Add players to start organizing sessions
            </Text>
          </View>
        }
      />

      {/*<FAB
        icon="account-plus"
        label="Add Player"
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
        }}
        onPress={() => setModalVisible(true)}
      />*/}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <PlayerForm
          player={editingPlayer}
          onSave={handleSavePlayer}
          onCancel={() => {
            setModalVisible(false);
            setEditingPlayer(null);
          }}
        />
      </Modal>

      <BulkAddModal
        visible={bulkModalVisible}
        onClose={() => setBulkModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  playerDetails: {
    fontSize: 14,
    marginBottom: 8,
    marginRight: 4,
  },
});

