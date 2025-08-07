import React, { useState } from 'react';
import {
  View,
} from 'react-native';
import {
  Button,
  Card,
  Chip,
  Icon,
  Text,
  useTheme,
} from 'react-native-paper';
import { Game, Player } from '../types';
import { Alert } from '../utils/alert'

// TODO not used - delete

interface GameCardProps {
  game: Game;
  players: Player[];
  courtColor: string;
  isInProgress?: boolean;
  isCompleted?: boolean;
  onStart?: () => void;
  onComplete?: (score?: { serveScore: number; receiveScore: number }) => void;
  onScoreEntry?: () => void;
}

export default function GameCard({
  game,
  players,
  courtColor,
  isInProgress = false,
  isCompleted = false,
  onStart,
  onComplete,
  onScoreEntry
}: GameCardProps) {
  const theme = useTheme();

  const getPlayer = (playerId: string) => {
    return players.find(p => p.id === playerId);
  };

  const servePlayer1 = getPlayer(game.serveTeam.player1Id);
  const servePlayer2 = getPlayer(game.serveTeam.player2Id);
  const receivePlayer1 = getPlayer(game.receiveTeam.player1Id);
  const receivePlayer2 = getPlayer(game.receiveTeam.player2Id);

  const hasScore = game.score && (game.score.serveScore > 0 || game.score.receiveScore > 0);
  const actuallyCompleted = game.isCompleted || isCompleted;

  const handleGameAction = () => {
    if (actuallyCompleted) {
      onScoreEntry?.();
    } else if (isInProgress) {
      if (onComplete) {
        Alert.alert(
          'Complete Game',
          'Mark this game as completed?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Enter Score',
              onPress: () => onScoreEntry?.(),
            },
            {
              text: 'Complete Without Score',
              onPress: () => onComplete(),
            },
          ]
        );
      }
    } else {
      onStart?.();
    }
  };

  const getActionButton = () => {
    if (actuallyCompleted) {
      return (
        <Button
          icon="pencil"
          mode="outlined"
          onPress={onScoreEntry}
          compact={true}
        >
          {hasScore ? 'Edit Score' : 'Add Score'}
        </Button>
      );
    }

    if (isInProgress) {
      return (
        <Button
          icon="stop"
          mode="contained"
          onPress={handleGameAction}
          compact={true}
        >
          Complete
        </Button>
      );
    }

    return (
      <Button
        icon="play"
        mode="contained"
        onPress={handleGameAction}
        compact={true}
      >
        Start
      </Button>
    );
  };

  const getStatusChip = () => {
    if (actuallyCompleted) {
      return (
        <Chip
          icon="trophy"
          compact={true}
          style={{ backgroundColor: theme.colors.tertiaryContainer }}
          textStyle={{ color: theme.colors.onTertiaryContainer }}
        >
          Completed
        </Chip>
      );
    }

    if (isInProgress) {
      return (
        <Chip
          icon="clock-outline"
          compact={true}
          style={{ backgroundColor: theme.colors.errorContainer }}
          textStyle={{ color: theme.colors.onErrorContainer }}
        >
          In Progress
        </Chip>
      );
    }

    return (
      <Chip
        icon="pause"
        compact={true}
        style={{ backgroundColor: theme.colors.surfaceVariant }}
        textStyle={{ color: theme.colors.onSurfaceVariant }}
      >
        Pending
      </Chip>
    );
  };

  return (
    <Card style={{ marginBottom: 16 }}>
      <Card.Content>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: courtColor
            }} />
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>
              Court {game.courtId.slice(-1)}
            </Text>
          </View>
          {getStatusChip()}
        </View>

        {hasScore && (
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
              <Text variant="headlineLarge" style={{
                fontWeight: 'bold',
                color: theme.colors.primary
              }}>
                {game.score!.serveScore}
              </Text>
              <Text variant="headlineSmall" style={{
                fontWeight: 'bold',
                color: theme.colors.onSurfaceVariant
              }}>
                -
              </Text>
              <Text variant="headlineLarge" style={{
                fontWeight: 'bold',
                color: theme.colors.primary
              }}>
                {game.score!.receiveScore}
              </Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <Card style={{
            flex: 1,
            backgroundColor: theme.colors.primaryContainer
          }}>
            <Card.Content style={{ padding: 12 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
                <Text variant="labelMedium" style={{
                  fontWeight: '600',
                  color: theme.colors.onPrimaryContainer
                }}>
                  Serve
                </Text>
                {hasScore && game.score!.serveScore > game.score!.receiveScore && (
                  <Icon source="trophy" size={14} />
                )}
              </View>
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon source="account" size={14} />
                  <Text variant="bodySmall" style={{
                    flex: 1,
                    fontWeight: '500',
                    color: theme.colors.onPrimaryContainer
                  }}>
                    {servePlayer1?.name || 'Player 1'}
                  </Text>
                  {servePlayer1?.rating && (
                    <Chip compact={true} textStyle={{ fontSize: 10 }}>
                      {servePlayer1.rating.toFixed(1)}
                    </Chip>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon source="account" size={14} />
                  <Text variant="bodySmall" style={{
                    flex: 1,
                    fontWeight: '500',
                    color: theme.colors.onPrimaryContainer
                  }}>
                    {servePlayer2?.name || 'Player 2'}
                  </Text>
                  {servePlayer2?.rating && (
                    <Chip compact={true} textStyle={{ fontSize: 10 }}>
                      {servePlayer2.rating.toFixed(1)}
                    </Chip>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>

          <View style={{ paddingHorizontal: 12, alignItems: 'center' }}>
            <Text variant="labelSmall" style={{
              fontWeight: 'bold',
              color: theme.colors.onSurfaceVariant
            }}>
              VS
            </Text>
          </View>

          <Card style={{
            flex: 1,
            backgroundColor: theme.colors.secondaryContainer
          }}>
            <Card.Content style={{ padding: 12 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
                <Text variant="labelMedium" style={{
                  fontWeight: '600',
                  color: theme.colors.onSecondaryContainer
                }}>
                  Receive
                </Text>
                {hasScore && game.score!.receiveScore > game.score!.serveScore && (
                  <Icon source="trophy" size={14} />
                )}
              </View>
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon source="account" size={14} />
                  <Text variant="bodySmall" style={{
                    flex: 1,
                    fontWeight: '500',
                    color: theme.colors.onSecondaryContainer
                  }}>
                    {receivePlayer1?.name || 'Player 1'}
                  </Text>
                  {receivePlayer1?.rating && (
                    <Chip compact={true} textStyle={{ fontSize: 10 }}>
                      {receivePlayer1.rating.toFixed(1)}
                    </Chip>
                  )}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon source="account" size={14} />
                  <Text variant="bodySmall" style={{
                    flex: 1,
                    fontWeight: '500',
                    color: theme.colors.onSecondaryContainer
                  }}>
                    {receivePlayer2?.name || 'Player 2'}
                  </Text>
                  {receivePlayer2?.rating && (
                    <Chip compact={true} textStyle={{ fontSize: 10 }}>
                      {receivePlayer2.rating.toFixed(1)}
                    </Chip>
                  )}
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>
      </Card.Content>

      <Card.Actions>
        {getActionButton()}
      </Card.Actions>
    </Card>
  );
}
