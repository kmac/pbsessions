import React, { useState } from 'react';
import {
  View,
  Modal,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  Card,
  Chip,
  Icon,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import { Game, Player } from '../types';
import { COURT_COLORS } from '../theme';

interface BetweenRoundsModalProps {
  visible: boolean;
  currentRound: number;
  games: Game[];
  allPlayers: Player[];
  onStartRound: () => void;
  onClose: () => void;
}

export default function BetweenRoundsModal({
  visible,
  currentRound,
  games,
  allPlayers,
  onStartRound,
  onClose
}: BetweenRoundsModalProps) {
  const theme = useTheme();
  const getPlayer = (playerId: string) => allPlayers.find(p => p.id === playerId);

  const playingPlayers = games.flatMap(game => [
    game.serveTeam.player1Id,
    game.serveTeam.player2Id,
    game.receiveTeam.player1Id,
    game.receiveTeam.player2Id,
  ]).map(getPlayer).filter(Boolean) as Player[];

  const sittingOutPlayers = games.length > 0
    ? games[0].sittingOutIds.map(getPlayer).filter(Boolean) as Player[]
    : [];

  const renderCourtAssignment = ({ item, index }: { item: Game; index: number }) => {
    const servePlayer1 = getPlayer(item.serveTeam.player1Id);
    const servePlayer2 = getPlayer(item.serveTeam.player2Id);
    const receivePlayer1 = getPlayer(item.receiveTeam.player1Id);
    const receivePlayer2 = getPlayer(item.receiveTeam.player2Id);

    const courtColor = COURT_COLORS[index % COURT_COLORS.length];

    return (
      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 12,
          }}>
            <View style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: courtColor
            }} />
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>
              Court {item.courtId.slice(-1)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Surface style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: theme.colors.primaryContainer
            }}>
              <Text variant="labelMedium" style={{
                fontWeight: '600',
                marginBottom: 4,
                color: theme.colors.onPrimaryContainer
              }}>
                Serve
              </Text>
              <Text variant="bodySmall" style={{
                textAlign: 'center',
                marginBottom: 4,
                color: theme.colors.onPrimaryContainer
              }}>
                {servePlayer1?.name} & {servePlayer2?.name}
              </Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {servePlayer1?.rating && (
                  <Chip compact textStyle={{ fontSize: 9 }}>
                    {servePlayer1.rating.toFixed(1)}
                  </Chip>
                )}
                {servePlayer2?.rating && (
                  <Chip compact textStyle={{ fontSize: 9 }}>
                    {servePlayer2.rating.toFixed(1)}
                  </Chip>
                )}
              </View>
            </Surface>

            <View style={{ paddingHorizontal: 8 }}>
              <Text variant="labelSmall" style={{
                fontWeight: 'bold',
                color: theme.colors.onSurfaceVariant
              }}>
                VS
              </Text>
            </View>

            <Surface style={{
              flex: 1,
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: theme.colors.secondaryContainer
            }}>
              <Text variant="labelMedium" style={{
                fontWeight: '600',
                marginBottom: 4,
                color: theme.colors.onSecondaryContainer
              }}>
                Receive
              </Text>
              <Text variant="bodySmall" style={{
                textAlign: 'center',
                marginBottom: 4,
                color: theme.colors.onSecondaryContainer
              }}>
                {receivePlayer1?.name} & {receivePlayer2?.name}
              </Text>
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {receivePlayer1?.rating && (
                  <Chip compact textStyle={{ fontSize: 9 }}>
                    {receivePlayer1.rating.toFixed(1)}
                  </Chip>
                )}
                {receivePlayer2?.rating && (
                  <Chip compact textStyle={{ fontSize: 9 }}>
                    {receivePlayer2.rating.toFixed(1)}
                  </Chip>
                )}
              </View>
            </Surface>
          </View>
        </Card.Content>
      </Card>
    );
  };

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
            title={`Round ${currentRound} Ready`}
            subtitle="Review assignments and start when ready"
          />
        </Appbar.Header>

        <ScrollView
          style={{ flex: 1, padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Card style={{ marginBottom: 24 }}>
            <Card.Content>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}>
                <Icon source="check-circle" size={20} />
                <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                  Round {currentRound} Generated
                </Text>
              </View>

              <View style={{ gap: 8 }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text variant="bodyMedium" style={{
                    color: theme.colors.onSurfaceVariant
                  }}>
                    Playing:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                    {playingPlayers.length} players
                  </Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text variant="bodyMedium" style={{
                    color: theme.colors.onSurfaceVariant
                  }}>
                    Courts:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                    {games.length} courts
                  </Text>
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Text variant="bodyMedium" style={{
                    color: theme.colors.onSurfaceVariant
                  }}>
                    Sitting out:
                  </Text>
                  <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                    {sittingOutPlayers.length} players
                  </Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          <View style={{ marginBottom: 24 }}>
            <Text variant="titleMedium" style={{
              fontWeight: '600',
              marginBottom: 12
            }}>
              Court Assignments
            </Text>
            <FlatList
              data={games}
              renderItem={renderCourtAssignment}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>

          {sittingOutPlayers.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text variant="titleMedium" style={{
                fontWeight: '600',
                marginBottom: 12
              }}>
                Sitting Out This Round
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {sittingOutPlayers.map(player => (
                  <Chip key={player.id} icon="account">
                    {player.name}
                    {player.rating && ` (${player.rating.toFixed(1)})`}
                  </Chip>
                ))}
              </View>
            </View>
          )}

          <Surface style={{
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            backgroundColor: theme.colors.tertiaryContainer
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              marginBottom: 8,
            }}>
              <Icon source="refresh" size={16} />
              <Text variant="titleSmall" style={{
                fontWeight: '600',
                color: theme.colors.onTertiaryContainer
              }}>
                Manual Adjustments
              </Text>
            </View>
            <Text variant="bodySmall" style={{
              color: theme.colors.onTertiaryContainer,
              lineHeight: 16
            }}>
              Player swapping and manual sit-out selection coming in future updates.
            </Text>
          </Surface>

          <View style={{ gap: 12, marginBottom: 32 }}>
            <Button
              icon="play"
              mode="contained"
              onPress={onStartRound}
              contentStyle={{ paddingVertical: 8 }}
            >
              Start Round {currentRound}
            </Button>

            <Button
              mode="outlined"
              onPress={onClose}
              contentStyle={{ paddingVertical: 8 }}
            >
              Make Adjustments
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
