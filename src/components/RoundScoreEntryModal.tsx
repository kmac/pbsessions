import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Appbar,
  Button,
  Card,
  Chip,
  Icon,
  IconButton,
  Surface,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { Court, Game, Player, Results } from '../types';
import { COURT_COLORS } from '../theme';

interface RoundScoreEntryModalProps {
  visible: boolean;
  games: Game[];
  players: Player[];
  courts: Court[],
  onSave: (results: Results) => void;
  onClose: () => void;
}

interface CourtScore {
  gameId: string;
  courtName: string;
  serveScore: number;
  receiveScore: number;
  hasScore: boolean;
  serveTeam: [Player | undefined, Player | undefined];
  receiveTeam: [Player | undefined, Player | undefined];
}

export default function RoundScoreEntryModal({
  visible,
  games,
  players,
  courts,
  onSave,
  onClose
}: RoundScoreEntryModalProps) {
  const theme = useTheme();
  const [courtScores, setCourtScores] = useState<CourtScore[]>([]);

  const getCourtName = (courtId: string) : string => {
    return courts.find(c => c.id === courtId)?.name || "unknown";
  }

  useEffect(() => {
    if (games.length > 0) {
      const scores = games.map(game => {
        const getPlayer = (playerId: string) => players.find(p => p.id === playerId);

        return {
          gameId: game.id,
          courtName: getCourtName(game.courtId),
          serveScore: game.score?.serveScore || 0,
          receiveScore: game.score?.receiveScore || 0,
          hasScore: !!game.score,
          serveTeam: [
            getPlayer(game.serveTeam.player1Id),
            getPlayer(game.serveTeam.player2Id)
          ] as [Player | undefined, Player | undefined],
          receiveTeam: [
            getPlayer(game.receiveTeam.player1Id),
            getPlayer(game.receiveTeam.player2Id)
          ] as [Player | undefined, Player | undefined],
        } as CourtScore;
      });
      setCourtScores(scores);
    }
  }, [games, players]);

  const updateCourtScore = (gameId: string, field: 'serveScore' | 'receiveScore', value: number) => {
    setCourtScores(prev => prev.map(court =>
      court.gameId === gameId
        ? {
            ...court,
            [field]: Math.max(0, Math.min(99, value)),
            hasScore: true
          }
        : court
    ));
  };

  const toggleCourtScore = (gameId: string) => {
    setCourtScores(prev => prev.map(court =>
      court.gameId === gameId
        ? {
            ...court,
            hasScore: !court.hasScore,
            serveScore: court.hasScore ? 0 : court.serveScore,
            receiveScore: court.hasScore ? 0 : court.receiveScore,
          }
        : court
    ));
  };

  const adjustScore = (gameId: string, team: 'serve' | 'receive', delta: number) => {
    const court = courtScores.find(c => c.gameId === gameId);
    if (!court) return;

    const currentScore = team === 'serve' ? court.serveScore : court.receiveScore;
    updateCourtScore(gameId, team === 'serve' ? 'serveScore' : 'receiveScore', currentScore + delta);
  };

  const setCommonScore = (gameId: string, serveScore: number, receiveScore: number) => {
    setCourtScores(prev => prev.map(court =>
      court.gameId === gameId
        ? {
            ...court,
            serveScore,
            receiveScore,
            hasScore: true
          }
        : court
    ));
  };

  const handleSave = () => {
    const results: Results = {scores: {} };

    courtScores.forEach(court => {
      if (court.hasScore && (court.serveScore > 0 || court.receiveScore > 0)) {
        results.scores[court.gameId] = {
          serveScore: court.serveScore,
          receiveScore: court.receiveScore,
        };
      } else {
        results.scores[court.gameId] = null;
      }
    });

    onSave(results);
  };

  const getWinner = (court: CourtScore) => {
    if (!court.hasScore || (court.serveScore === 0 && court.receiveScore === 0)) {
      return null;
    }
    return court.serveScore > court.receiveScore ? 'serve' :
           court.receiveScore > court.serveScore ? 'receive' : 'tie';
  };

  const renderCourtScore = (court: CourtScore, index: number) => {
    const winner = getWinner(court);
    const courtColor = COURT_COLORS[index % COURT_COLORS.length];

    return (
      <Card key={court.gameId} style={{ marginBottom: 16 }}>
        <Card.Content>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/*<View style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: courtColor
              }} />*/}
              <Text variant="titleMedium" style={{ fontWeight: '600' }}>
                {court.courtName}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text variant="labelMedium">
                {court.hasScore ? 'Remove Score' : 'Add Score'}
              </Text>
              <Switch
                value={court.hasScore}
                onValueChange={() => toggleCourtScore(court.gameId)}
              />
            </View>
          </View>

          {court.hasScore && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Surface style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: theme.colors.primaryContainer
                }}>
                  {/*<View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}>
                    <Text variant="titleSmall" style={{
                      fontWeight: '600',
                      color: theme.colors.onPrimaryContainer
                    }}>
                      Serve Team
                    </Text>
                    {winner === 'serve' && <Icon source="trophy" size={16} />}
                  </View>*/}

                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <Text variant="bodyMedium" style={{
                      fontWeight: '600',
                      color: theme.colors.onPrimaryContainer
                    }}>
                      {court.serveTeam[0]?.name || 'Player 1'}
                    </Text>
                    <Text variant="bodyMedium" style={{
                      fontWeight: '600',
                      color: theme.colors.onPrimaryContainer
                    }}>
                      {court.serveTeam[1]?.name || 'Player 2'}
                    </Text>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <IconButton
                      icon="minus"
                      size={20}
                      mode="contained-tonal"
                      onPress={() => adjustScore(court.gameId, 'serve', -1)}
                    />
                    <TextInput
                      mode="outlined"
                      value={court.serveScore.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text) || 0;
                        if (num >= 0 && num <= 99) {
                          updateCourtScore(court.gameId, 'serveScore', num);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                      dense
                      style={{ width: 80, textAlign: 'center' }}
                      contentStyle={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}
                    />
                    <IconButton
                      icon="plus"
                      size={20}
                      mode="contained-tonal"
                      onPress={() => adjustScore(court.gameId, 'serve', 1)}
                    />
                  </View>
                </Surface>

                <View style={{ paddingHorizontal: 12 }}>
                  <Text variant="labelSmall" style={{
                    fontWeight: 'bold',
                    color: theme.colors.onSurfaceVariant
                  }}>
                    VS
                  </Text>
                </View>

                <Surface style={{
                  flex: 1,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: theme.colors.secondaryContainer
                }}>
                  {/*<View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}>
                    <Text variant="titleMedium" style={{
                      fontWeight: '600',
                      color: theme.colors.onSecondaryContainer
                    }}>
                      Receive Team
                    </Text>
                    {winner === 'receive' && <Icon source="trophy" size={16} />}
                  </View>*/}

                  <View style={{ alignItems: 'center', marginBottom: 16 }}>
                    <Text variant="bodyMedium" style={{
                      fontWeight: '600',
                      color: theme.colors.onSecondaryContainer
                    }}>
                      {court.receiveTeam[0]?.name || 'Player 1'}
                    </Text>
                    <Text variant="bodyMedium" style={{
                      fontWeight: '600',
                      color: theme.colors.onSecondaryContainer
                    }}>
                      {court.receiveTeam[1]?.name || 'Player 2'}
                    </Text>
                  </View>

                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <IconButton
                      icon="minus"
                      size={20}
                      mode="contained-tonal"
                      onPress={() => adjustScore(court.gameId, 'receive', -1)}
                    />
                    <TextInput
                      mode="outlined"
                      value={court.receiveScore.toString()}
                      onChangeText={(text) => {
                        const num = parseInt(text) || 0;
                        if (num >= 0 && num <= 99) {
                          updateCourtScore(court.gameId, 'receiveScore', num);
                        }
                      }}
                      keyboardType="number-pad"
                      maxLength={2}
                      dense
                      style={{ width: 80, textAlign: 'center' }}
                      contentStyle={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}
                    />
                    <IconButton
                      icon="plus"
                      size={20}
                      mode="contained-tonal"
                      onPress={() => adjustScore(court.gameId, 'receive', 1)}
                    />
                  </View>
                </Surface>
              </View>

              <View style={{ alignItems: 'center' }}>
                <Text variant="labelSmall" style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 8
                }}>
                  Quick Scores
                </Text>
                <View style={{
                  flexDirection: 'row',
                  gap: 8,
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}>
                  {[
                    { serve: 11, receive: 9 },
                    { serve: 11, receive: 7 },
                    { serve: 9, receive: 11 },
                    { serve: 7, receive: 11 }
                  ].map((score, idx) => (
                    <Chip
                      key={idx}
                      onPress={() => setCommonScore(court.gameId, score.serve, score.receive)}
                      compact={true}
                    >
                      {score.serve} - {score.receive}
                    </Chip>
                  ))}
                </View>
              </View>
            </>
          )}
        </Card.Content>
      </Card>
    );
  };

  const courtsWithScores = courtScores.filter(c => c.hasScore).length;
  const totalCourts = courtScores.length;

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
            title="Round Scores"
            subtitle={`${courtsWithScores} of ${totalCourts} courts with scores`}
          />
          <Button
            icon="content-save"
            mode="contained"
            onPress={handleSave}
            style={{ marginRight: 8 }}
          >
            Complete
          </Button>
        </Appbar.Header>

        <ScrollView
          style={{ flex: 1, padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <Surface style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 20,
            backgroundColor: theme.colors.primaryContainer
          }}>
            <Text variant="bodyMedium" style={{
              color: theme.colors.onPrimaryContainer,
              textAlign: 'center'
            }}>
              Enter scores for completed games or skip scoring for games that didn't finish.
            </Text>
          </Surface>

          {courtScores.map(renderCourtScore)}

          <Button
            icon="trophy"
            mode="contained"
            onPress={handleSave}
            contentStyle={{ paddingVertical: 8 }}
            style={{ marginTop: 16, marginBottom: 32 }}
          >
            Complete Round
          </Button>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}
