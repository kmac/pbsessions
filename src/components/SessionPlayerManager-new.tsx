import React, { useState } from 'react';
import { View, FlatList, Alert } from 'react-native';
import {
  Text,
  Button,
  Card,
  IconButton,
  useTheme,
  Surface,
  Divider
} from 'react-native-paper';
import { useAppSelector } from '../store';
import { Player, Session } from '../types';

interface SessionPlayerManagerProps {
  session: Session;
  onPlayersUpdate?: (players: Player[]) => void;
}

export const SessionPlayerManager: React.FC<SessionPlayerManagerProps> = ({
  session,
  onPlayersUpdate,
}) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  // Get players from Redux store
  const allPlayers = useAppSelector((state) => state.players.players);
  const sessionPlayers = allPlayers.filter(player =>
    player.sessionId === session.id
  );

  const removePlayerFromSession = (playerId: string) => {
    Alert.alert(
      'Remove Player',
      'Are you sure you want to remove this player from the session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // Here you would dispatch a Redux action to remove the player
            // dispatch(removePlayerFromSession({ sessionId: session.id, playerId }));
            console.log('Remove player:', playerId, 'from session:', session.id);
          },
        },
      ]
    );
  };

  const refreshPlayers = () => {
    setLoading(true);
    // Here you would dispatch a Redux action to refresh players
    // dispatch(fetchSessionPlayers(session.id));
    setTimeout(() => {
      setLoading(false);
      onPlayersUpdate?.(sessionPlayers);
    }, 1000);
  };

  const renderPlayer = ({ item: player }: { item: Player }) => (
    <Card style={{ marginVertical: 4, backgroundColor: theme.colors.surface }}>
      <Card.Content>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <View style={{ flex: 1 }}>
            <Text
              variant="titleMedium"
              style={{ color: theme.colors.onSurface }}
            >
              {player.name}
            </Text>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {player.email}
            </Text>
          </View>
          <IconButton
            icon="close"
            size={20}
            iconColor={theme.colors.error}
            onPress={() => removePlayerFromSession(player.id)}
            disabled={loading}
          />
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <Surface style={{
      flex: 1,
      padding: 16,
      backgroundColor: theme.colors.background
    }}>
      <Text
        variant="headlineSmall"
        style={{
          marginBottom: 16,
          color: theme.colors.onBackground
        }}
      >
        Session Players ({sessionPlayers.length})
      </Text>

      <Divider style={{ marginBottom: 16 }} />

      {sessionPlayers.length === 0 ? (
        <Surface style={{
          padding: 24,
          borderRadius: 8,
          backgroundColor: theme.colors.surfaceVariant,
          alignItems: 'center'
        }}>
          <Text
            variant="bodyLarge"
            style={{
              color: theme.colors.onSurfaceVariant,
              textAlign: 'center'
            }}
          >
            No players in this session yet.
          </Text>
        </Surface>
      ) : (
        <FlatList
          data={sessionPlayers}
          keyExtractor={(item) => item.id}
          renderItem={renderPlayer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
        />
      )}

      <Button
        mode="outlined"
        onPress={refreshPlayers}
        loading={loading}
        style={{
          marginTop: 16,
          borderColor: theme.colors.primary
        }}
        labelStyle={{ color: theme.colors.primary }}
      >
        Refresh Players
      </Button>
    </Surface>
  );
};
