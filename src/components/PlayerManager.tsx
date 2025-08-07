import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import {
  DataTable,
  List,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useAppSelector, useAppDispatch } from '@/src/store';
import { X, Check, Plus } from 'lucide-react-native';
import { RootState } from '../store';
import { addPlayerToGroup, removePlayerFromGroup } from '../store/slices/groupsSlice';
import { getShortGender } from '@/src/utils/util';
import { Group, Player } from '../types';
import { colors } from '../theme';
import { Alert } from '../utils/alert'


interface PlayerManagerProps {
  players: Player[],
}

// This component handles a list of all players:
// Requirements:
// - create, update, delete
// - multiselect: bulk delete
// - sort by columns
// - filter (as search)
// - bulk add, import --> maybe done by parent?
//
// maybe: pull-down for group, create/update/delete group
//
export default function PlayerManager({
  players,
}: PlayerManagerProps) {
  const dispatch = useDispatch();
  const [page, setPage] = React.useState<number>(0);
  const [groupName, setGroupName] = React.useState<string>('');
  const [numberOfItemsPerPageList] = React.useState([10, 20, 40]);
  const [itemsPerPage, setItemsPerPage] = React.useState(
    numberOfItemsPerPageList[0]
  );

  const from = page * itemsPerPage;
  const to = Math.min((page + 1) * itemsPerPage, players.length);

  const { groups: allGroups } = useAppSelector((state) => state.groups);

  function lookupGroup(groupName: string) {
    return allGroups.find(group => group.name === groupName);
  }

  const isPlayerInGroup = (groupName: string, playerId: string) => {
    return lookupGroup(groupName)?.playerIds.includes(playerId);
  };

  function getPlayerGroups(playerId: string): Group[] {
    return allGroups.filter(group => group.playerIds.includes(playerId));
  }

  function getPlayerGroupNames(playerId: string): string {
    return getPlayerGroups(playerId)
      .map(group => group.name)
      .join(', ');
  }


  const handleSelectPlayer = (player: Player) => {
  }

  const handleTogglePlayer = (player: Player) => {
    // if (groupName) {
    //   if (isPlayerInGroup(groupName), player.id)) {
    //     dispatch(removePlayerFromGroup({ groupId: group.id, playerId: player.id }));
    //   } else {
    //     dispatch(addPlayerToGroup({ groupId: group.id, playerId: player.id }));
    //   }
    // }
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>PlayerManager</Text>
          <Text style={styles.subtitle}>(selected)</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView>
        <DataTable>
          <ScrollView horizontal contentContainerStyle={{ flexDirection: 'column' }}>
            <DataTable.Header>
              <DataTable.Title sortDirection='ascending'>Name</DataTable.Title>
              <DataTable.Title>Gender</DataTable.Title>
              <DataTable.Title>Phone</DataTable.Title>
              <DataTable.Title>Email</DataTable.Title>
              <DataTable.Title>Rating</DataTable.Title>
              <DataTable.Title>Groups</DataTable.Title>
            </DataTable.Header>

            {players.slice(from, to).map(player => (
              <DataTable.Row key={player.id} onPress={() => handleSelectPlayer(player)}>
                <DataTable.Cell>{player.name}</DataTable.Cell>
                <DataTable.Cell>{getShortGender(player.gender, false)}</DataTable.Cell>
                <DataTable.Cell>{player.phone || ''}</DataTable.Cell>
                <DataTable.Cell>{player.email || ''}</DataTable.Cell>
                <DataTable.Cell numeric>{player.rating || ''}</DataTable.Cell>
                <DataTable.Cell>{getPlayerGroupNames(player.id)}</DataTable.Cell>
              </DataTable.Row>
            ))}

            <DataTable.Pagination
              page={page}
              numberOfPages={Math.ceil(players.length / itemsPerPage)}
              onPageChange={setPage}
              label={`${page * itemsPerPage + 1}-${Math.min((page + 1) * itemsPerPage, players.length)} of ${players.length}`}
              numberOfItemsPerPageList={[10, 20, 40]}
              numberOfItemsPerPage={itemsPerPage}
              onItemsPerPageChange={setItemsPerPage}
              showFastPaginationControls
              selectPageDropdownLabel="Rows per page"
            />
          </ScrollView>
        </DataTable>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 8,
  },
  headerInfo: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  listContainer: {
    padding: 16,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  playerItemSelected: {
    backgroundColor: colors.primaryLight,
    shadowOpacity: 0.1,
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  playerNameSelected: {
    color: 'white',
  },
  playerRating: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  playerRatingSelected: {
    color: colors.grayLight,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4,
    textAlign: 'center',
  },
});



