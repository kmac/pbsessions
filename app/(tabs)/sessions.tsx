import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Button,
  Card,
  Chip,
  FAB,
  Icon,
  IconButton,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import { useAppDispatch, useAppSelector } from '@/src/store';
import {
  addSession,
  archiveSession,
  updateSession,
  removeSession,
  startLiveSession
} from '@/src/store/slices/sessionsSlice';
import { setCurrentSession } from '@/src/store/slices/liveSessionSlice';
import { Session, SessionState } from '@/src/types';
import ArchivedSessions from '@/src/components/ArchivedSessions';
import SessionForm from '@/src/components/SessionForm';
import { Alert } from '@/src/utils/alert'

export default function SessionsTab() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { sessions, loading } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);
  const { groups } = useAppSelector((state) => state.groups);
  const { currentSession } = useAppSelector((state) => state.liveSession);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalArchiveVisible, setArchiveModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  // TODO rationalize with SessionState
  const isSessionLive = (sessionId: string) => currentSession ? sessionId === currentSession.sessionId : false;

  const handleDeleteSession = (session: Session) => {
    if (isSessionLive(session.id)) {
      Alert.alert(
        'Cannot Delete',
        'Cannot delete a live session. End the session first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Session',
      `Are you sure you want to delete "${session.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(removeSession(session.id)),
        },
      ]
    );
  };

  const handleEditSession = (session: Session) => {
    if (isSessionLive(session.id)) {
      Alert.alert(
        'Cannot Edit',
        'Cannot edit a live session. End the session first.',
        [{ text: 'OK' }]
      );
      return;
    }
    setEditingSession(session);
    setModalVisible(true);
  };

  const handleStartLiveSession = (session: Session) => {
    if (session.playerIds.length < 4) {
      Alert.alert(
        'Not Enough Players',
        'Need at least 4 players to start a live session.',
        [{ text: 'OK' }]
      );
      return;
    }

    const activeCourts = session.courts.filter(c => c.isActive);
    const minPlayersNeeded = activeCourts.length * 4;

    if (session.playerIds.length < minPlayersNeeded) {
      Alert.alert(
        'Not Enough Players',
        `Need at least ${minPlayersNeeded} players for ${activeCourts.length} active courts.`,
        [
          {
            text: 'Adjust Courts',
            onPress: () => handleEditSession(session),
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    dispatch(startLiveSession(session.id));
    dispatch(setCurrentSession({
      sessionId: session.id,
      currentGameNumber: 1,
      courts: [...session.courts],
      activeGames: [],
      playerStats: [],
      isActive: true,
    }));

    router.push('/live-session');
  };

  const handleArchiveSession = (session: Session) => {
    if (isSessionLive(session.id)) {
      Alert.alert(
        'Cannot Archive',
        'Cannot archive a live session. End the session first.',
        [{ text: 'OK' }]
      );
      return;
    }
    dispatch(archiveSession(session.id));
  };

  const navigateToGroups = () => {
    router.push('/groups');
  };

  const navigateToPlayers = () => {
    router.push('/');
  };

  const getSessionPlayers = (session: Session) => {
    return players.filter(player => session.playerIds.includes(player.id));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleSaveSession = (sessionData: Session | Omit<Session, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSession) {
      dispatch(updateSession(sessionData as Session));
      setEditingSession(null);
    } else {
      dispatch(addSession(sessionData as Omit<Session, 'id' | 'createdAt' | 'updatedAt'>));
    }
    setModalVisible(false);
  };

  function isUnstarted(session: Session) {
    return session.state === SessionState.Unstarted;
  };

  function isLive(session: Session) {
    return session.state === SessionState.Live;
  };

  function isComplete(session: Session) {
    return session.state === SessionState.Complete;
  };

  function isArchived(session: Session) {
    return session.state === SessionState.Archived;
  };

  const renderSession = ({ item }: { item: Session }) => {
    const sessionPlayers = getSessionPlayers(item);
    const activeCourts = item.courts.filter(c => c.isActive);
    const isCurrentLive = isSessionLive(item.id);

    return (
      <Card
        style={[
          { marginBottom: 12 },
          isCurrentLive && {
            borderLeftWidth: 4,
            borderLeftColor: theme.colors.tertiary,
          }
        ]}
      >
        <Card.Content>
          {isCurrentLive && (
            <Chip
              icon="record"
              style={{
                alignSelf: 'flex-start',
                marginBottom: 12,
                backgroundColor: theme.colors.tertiary
              }}
              textStyle={{ color: theme.colors.onTertiary, fontWeight: 'bold' }}
              compact={true}
            >
              LIVE
            </Chip>
          )}

          <View style={{ marginBottom: 12 }}>
            <Text variant="titleMedium" style={{ fontWeight: '600', marginBottom: 8 }}>
              {isComplete(item) ? `${item.name} (Complete)` : item.name}
            </Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon source="calendar" size={14} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {formatDate(item.dateTime)}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Icon source="clock-outline" size={14} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {formatTime(item.dateTime)}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 12, gap: 8 }}>
            <Chip icon="account-group" compact={true}>
              {sessionPlayers.length} players
            </Chip>
            <Chip icon="map-marker-outline" compact={true}>
              {activeCourts.length} courts
            </Chip>
            {activeCourts.some(c => c.minimumRating) && (
              <Chip icon="cog-outline" compact={true}>
                Rated
              </Chip>
            )}
          </View>

          {sessionPlayers.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text
                variant="labelMedium"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 4
                }}
              >
                Players:
              </Text>
              <Text
                variant="bodyMedium"
                numberOfLines={2}
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {sessionPlayers.map(p => p.name).join(', ')}
              </Text>
            </View>
          )}
        </Card.Content>

        <Card.Actions style={{ justifyContent: 'space-between' }}>
          {isCurrentLive ? (
            <Button
              icon="play"
              mode="contained"
              onPress={() => router.push('/live-session')}
            >
              Continue Live Session
            </Button>
          ) : (
            <>
              {isUnstarted(item) && (
                <Button
                  icon="play"
                  mode="contained"
                  onPress={() => handleStartLiveSession(item)}
                >
                  Start Session
                </Button>
              )}
              {isComplete(item) && !isArchived(item) && (
                <>
                  <Button
                    icon="archive"
                    mode="outlined"
                    disabled={true}
                    onPress={() => { }}
                  >
                    View Session
                  </Button>
                </>
              )}
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <IconButton
                  icon="archive"
                  mode="contained"
                  onPress={() => handleArchiveSession(item)}
                />
                {!isComplete(item) && <IconButton
                  icon="pencil"
                  mode="contained-tonal"
                  onPress={() => handleEditSession(item)}
                />}
                <IconButton
                  icon="delete"
                  mode="contained-tonal"
                  onPress={() => handleDeleteSession(item)}
                />
              </View>
            </>
          )}
        </Card.Actions>
      </Card>
    );
  };

  const EmptyState = () => (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 64,
    }}>
      <Icon source="calendar" size={48} />
      <Text variant="titleMedium" style={{
        fontWeight: '600',
        marginTop: 16,
        color: theme.colors.onSurfaceVariant
      }}>
        No sessions yet
      </Text>
      <Text variant="bodyMedium" style={{
        color: theme.colors.onSurfaceVariant,
        marginTop: 4,
        textAlign: 'center',
        marginBottom: 24
      }}>
        Create a session to start organizing games
      </Text>

      {players.length === 0 ? (
        <Button
          icon="open-in-new"
          mode="outlined"
          onPress={navigateToPlayers}
        >
          Add Players First
        </Button>
      ) : (
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Button
            icon="plus"
            mode="contained"
            onPress={() => setModalVisible(true)}
          >
            Create First Session
          </Button>

          {groups.length === 0 && (
            <Button
              icon="open-in-new"
              mode="outlined"
              onPress={navigateToGroups}
            >
              Create Groups
            </Button>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Surface style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 12,
      }} elevation={1}>
        <View style={{ flex: 1 }}>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold' }}>
            Sessions ({sessions.length})
          </Text>
          {currentSession?.isActive && (
            <Text variant="bodyMedium" style={{
              marginTop: 2,
              fontWeight: '500'
            }}>
              Live session in progress
            </Text>
          )}
        </View>

        <View style={{ marginLeft: 12 }}>
          {players.length === 0 ? (
            <Button
              icon="open-in-new"
              mode="outlined"
              onPress={navigateToPlayers}
            >
              Add Players
            </Button>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8, }}>
              <Button
                icon="plus"
                mode="contained"
                onPress={() => setModalVisible(true)}
              >
                New Session
              </Button>
              <Button
                icon="archive"
                mode="elevated"
                onPress={() => setArchiveModalVisible(true)}
              >
                View Archive
              </Button>
            </View>
          )}
        </View>
      </Surface>

      <FlatList
        data={sessions.filter((session) => session.state != SessionState.Archived)}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />

      <FAB
        icon="plus"
        label="New Session"
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 0,
        }}
        onPress={() => setModalVisible(true)}
      />

      <Modal
        visible={modalArchiveVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ArchivedSessions
          onCancel={() => {
            setArchiveModalVisible(false);
          }}
        />
      </Modal>
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SessionForm
          session={editingSession}
          onSave={handleSaveSession}
          onCancel={() => {
            setModalVisible(false);
            setEditingSession(null);
          }}
        />
      </Modal>
    </SafeAreaView>
  );
}
