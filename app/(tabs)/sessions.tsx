// app/(tabs)/sessions.tsx (Complete Sessions Management)
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../src/store';
import {
  Plus,
  Calendar,
  Play,
  Edit2,
  Trash2,
  Users,
  MapPin,
  Clock,
  ExternalLink,
  Settings
} from 'lucide-react-native';
import { addSession, updateSession, removeSession, startLiveSession } from '../../src/store/slices/sessionsSlice';
import { setCurrentSession } from '../../src/store/slices/liveSessionSlice';
import { Session } from '../../src/types';
import SessionForm from '../../src/components/SessionForm';
import { colors } from '../../src/theme';
import { Alert } from '../../src/utils/alert'

export default function SessionsTab() {
  const dispatch = useAppDispatch();
  const { sessions, loading } = useAppSelector((state) => state.sessions);
  const { players } = useAppSelector((state) => state.players);
  const { groups } = useAppSelector((state) => state.groups);
  const { currentSession } = useAppSelector((state) => state.liveSession);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  const handleAddSession = (sessionData: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>) => {
    dispatch(addSession(sessionData));
    setModalVisible(false);
  };

  const handleUpdateSession = (sessionData: Session) => {
    dispatch(updateSession(sessionData));
    setEditingSession(null);
    setModalVisible(false);
  };

  const handleDeleteSession = (session: Session) => {
    if (session.isLive) {
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
    if (session.isLive) {
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
      activeGames: [],
      playerStats: [],
      isActive: true,
    }));

    router.push('/live-session');
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

  const renderSession = ({ item }: { item: Session }) => {
    const sessionPlayers = getSessionPlayers(item);
    const activeCourts = item.courts.filter(c => c.isActive);
    const isCurrentLive = currentSession?.sessionId === item.id;

    return (
      <View style={[styles.sessionCard, item.isLive && styles.liveSessionCard]}>
        {item.isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}

        <View style={styles.sessionHeader}>
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionName}>{item.name}</Text>
            <View style={styles.dateTimeContainer}>
              <View style={styles.dateTime}>
                <Calendar size={14} color={colors.textSecondary} />
                <Text style={styles.dateTimeText}>{formatDate(item.dateTime)}</Text>
              </View>
              <View style={styles.dateTime}>
                <Clock size={14} color={colors.textSecondary} />
                <Text style={styles.dateTimeText}>{formatTime(item.dateTime)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sessionStats}>
          <View style={styles.statItem}>
            <Users size={16} color={colors.primary} />
            <Text style={styles.statText}>{sessionPlayers.length} players</Text>
          </View>
          <View style={styles.statItem}>
            <MapPin size={16} color={colors.green} />
            <Text style={styles.statText}>{activeCourts.length} courts</Text>
          </View>
          {activeCourts.some(c => c.minimumRating) && (
            <View style={styles.statItem}>
              <Settings size={16} color={colors.orange} />
              <Text style={styles.statText}>Rated courts</Text>
            </View>
          )}
        </View>

        {sessionPlayers.length > 0 && (
          <View style={styles.playersPreview}>
            <Text style={styles.playersLabel}>Players:</Text>
            <Text style={styles.playersText} numberOfLines={2}>
              {sessionPlayers.map(p => p.name).join(', ')}
            </Text>
          </View>
        )}

        <View style={styles.sessionActions}>
          {item.isLive ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.continueButton]}
              onPress={() => router.push('/live-session')}
            >
              <Play size={16} color="white" />
              <Text style={styles.continueButtonText}>Continue Live Session</Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.startButton]}
                onPress={() => handleStartLiveSession(item)}
              >
                <Play size={16} color="white" />
                <Text style={styles.startButtonText}>Start Session</Text>
              </TouchableOpacity>

              <View style={styles.rightActions}>
                <TouchableOpacity
                  style={[styles.iconButton, styles.editButton]}
                  onPress={() => handleEditSession(item)}
                >
                  <Edit2 size={16} color={colors.blue} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, styles.deleteButton]}
                  onPress={() => handleDeleteSession(item)}
                >
                  <Trash2 size={16} color={colors.red} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Calendar size={48} color={colors.gray} />
      <Text style={styles.emptyText}>No sessions yet</Text>
      <Text style={styles.emptySubtext}>
        Create a session to start organizing games
      </Text>

      {players.length === 0 ? (
        <View style={styles.emptyActions}>
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={navigateToPlayers}
          >
            <ExternalLink size={16} color={colors.primary} />
            <Text style={styles.navigateButtonText}>Add Players First</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyActions}>
          <TouchableOpacity
            style={styles.createFirstButton}
            onPress={() => setModalVisible(true)}
          >
            <Plus size={16} color="white" />
            <Text style={styles.createFirstButtonText}>Create First Session</Text>
          </TouchableOpacity>

          {groups.length === 0 && (
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={navigateToGroups}
            >
              <ExternalLink size={16} color={colors.primary} />
              <Text style={styles.navigateButtonText}>Create Groups</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Sessions ({sessions.length})</Text>
          {currentSession?.isActive && (
            <Text style={styles.subtitle}>Live session in progress</Text>
          )}
        </View>

        <View style={styles.headerActions}>
          {players.length === 0 ? (
            <TouchableOpacity
              style={styles.navigateToPlayersButton}
              onPress={navigateToPlayers}
            >
              <ExternalLink size={16} color={colors.primary} />
              <Text style={styles.navigateToPlayersText}>Add Players</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Plus size={20} color="white" />
              <Text style={styles.addButtonText}>New Session</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState />}
      />

      {/* Session Form Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SessionForm
          session={editingSession}
          onSave={editingSession ? handleUpdateSession : handleAddSession}
          onCancel={() => {
            setModalVisible(false);
            setEditingSession(null);
          }}
        />
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'white',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.green,
    marginTop: 2,
    fontWeight: '500',
  },
  headerActions: {
    marginLeft: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  navigateToPlayersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  navigateToPlayersText: {
    color: colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  liveSessionCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.green,
    backgroundColor: colors.greenLight,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  liveText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sessionHeader: {
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTimeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  sessionStats: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  playersPreview: {
    marginBottom: 12,
  },
  playersLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.gray,
    marginBottom: 4,
  },
  playersText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  sessionActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  startButton: {
    backgroundColor: colors.green,
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: colors.primary,
    flex: 1,
    justifyContent: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 6,
  },
  editButton: {
    backgroundColor: colors.blueLight,
  },
  deleteButton: {
    backgroundColor: colors.redLight,
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
    marginBottom: 24,
  },
  emptyActions: {
    alignItems: 'center',
    gap: 12,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createFirstButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  navigateButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
});

