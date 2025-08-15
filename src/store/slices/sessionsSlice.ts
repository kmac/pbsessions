import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session, SessionState } from '@/src/types';

interface SessionsState {
  sessions: Session[];
  loading: boolean;
  error: string | null;
}

const initialState: SessionsState = {
  sessions: [],
  loading: false,
  error: null,
};

/*
function convertAssignmentsToGames(liveSession: Session, assignments: GameAssignment[]) {
  const liveData = liveSession.liveData!;
  const newGames: Game[] = assignments.map((assignment, index) => ({
    id: `game_${liveData.currentRoundNumber}_${assignment.court.id}_${Date.now()}_${index}`,
    sessionId: liveSession!.id,
    gameNumber: liveData.currentRoundNumber,
    courtId: assignment.court.id,
    serveTeam: {
      player1Id: assignment.serveTeam[0].id,
      player2Id: assignment.serveTeam[1].id,
    },
    receiveTeam: {
      player1Id: assignment.receiveTeam[0].id,
      player2Id: assignment.receiveTeam[1].id,
    },
    sittingOutIds: assignment.sittingOut.map(p => p.id),
    isCompleted: false,
  }));

  return newGames;
}


export const validateLive = (session?: Session) => {
  if (!session) {
    throw Error("session is null");
  }
  if (session.state !== SessionState.Live || !session.liveData) {
    throw Error(`session is not live, session: ${session}`)
  }
}

const convertAssignmentToRound = (liveSession: Session, roundAssignment: RoundAssignment): Round => {
  const newGames: Game[] = roundAssignment.gameAssignments.map((ra, index) => ({
    id: `game_${roundAssignment.roundNumber}_${ra.court.id}_${Date.now()}_${index}`,
    sessionId: liveSession!.id,
    gameNumber: roundAssignment.roundNumber,
    courtId: ra.court.id,
    serveTeam: {
      player1Id: ra.serveTeam[0].id,
      player2Id: ra.serveTeam[1].id,
    },
    receiveTeam: {
      player1Id: ra.receiveTeam[0].id,
      player2Id: ra.receiveTeam[1].id,
    },
    isCompleted: false,
  }));
  const nextRound = {
    games: newGames,
    sittingOutIds: roundAssignment.sittingOut.map(player => player.id)
  };
  return nextRound;
}

export const getCurrentRoundNumber = (session: Session): number => {
  validateLive(session);
  return session.liveData!.rounds.length - 1;
}

export const getCurrentRound = (session: Session): Round => {
  validateLive(session);
  return session.liveData!.rounds[session.liveData!.rounds.length - 1];
}

const playerStatsToString = (stats: PlayerStats[]): string => {
  if (!stats || stats.length === 0) {
    return "No player statistics available.";
  }
  const lines: string[] = ["=== Player Statistics ==="];
  stats.forEach((pstat, index) => {
    lines.push(`Player ${index + 1}: ${pstat.playerId}`);
    lines.push(`  Games Played: ${pstat.gamesPlayed}`);
    lines.push(`  Games Sat Out: ${pstat.gamesSatOut}`);
    lines.push(`  Total Score: ${pstat.totalScore}`);

    // Show partners and game counts
    const partnerEntries = Object.entries(pstat.partners);
    if (partnerEntries.length > 0) {
      lines.push(`  Partners:`);
      partnerEntries.forEach(([partnerId, gameCount]) => {
        lines.push(`    ${partnerId}: ${gameCount} games`);
      });
    } else {
      lines.push(`  Partners: None`);
    }
  });
  return lines.join("\n");
}
*/

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    addSession: (state, action: PayloadAction<Omit<Session, 'id' | 'state' | 'createdAt' | 'updatedAt'>>) => {
      const now = new Date().toISOString();
      const newSession: Session = {
        ...action.payload,
        id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        state: SessionState.Unstarted,
        createdAt: now,
        updatedAt: now,
      };
      state.sessions.push(newSession);
    },
    updateSession: (state, action: PayloadAction<Session>) => {
      const index = state.sessions.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.sessions[index] = {
          ...action.payload,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    removeSession: (state, action: PayloadAction<string>) => {
      state.sessions = state.sessions.filter(s => s.id !== action.payload);
    },
    archiveSession: (state, action: PayloadAction<string>) => {
      const session = state.sessions.find(s => s.id === action.payload);
      if (session) {
        session.state = SessionState.Archived;
        session.updatedAt = new Date().toISOString();
      }
    },
    restoreSession: (state, action: PayloadAction<string>) => {
      const session = state.sessions.find(s => s.id === action.payload);
      if (session) {
        session.state = SessionState.Complete;
        session.updatedAt = new Date().toISOString();
      }
    },
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.sessions = action.payload;
      state.loading = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },




    // TODO live session - need to move these out of the slice - they need to operate on the session, then we update the session via one of the above

    // addPlayerToSession: (state, action: PayloadAction<{ sessionId: string; playerId: string }>) => {
    //   const session = state.sessions.find(s => s.id === action.payload.sessionId);
    /*
    applyNextRound: (state, action: PayloadAction<{ sessionId: string; assignment: RoundAssignment }>) => {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      validateLive(session);

      const newRound: Round = convertAssignmentToRound(session!, action.payload.assignment);
      session!.liveData!.rounds.push(newRound);
    },
    startRound: (state) => {
      const session = state.sessions.find(s => s.id === action.payload.sessionId);
      validateLive(session);
      const now = new Date().toISOString();

      // Mark all games in the round as started
      state.liveSession.activeGames.forEach(game => {
        game.startedAt = now;
      });
    },
    completeRound: (state, action: PayloadAction<{
      scores: { [gameId: string]: { serveScore: number; receiveScore: number } | null }
    }>) => {
      if (!state.liveSession) {
        return;
      }
      const now = new Date().toISOString();

      // Mark all games as completed and apply scores
      state.liveSession.activeGames.forEach(game => {
        game.isCompleted = true;
        game.completedAt = now;

        const score = action.payload.scores[game.id];
        if (score) {
          game.score = score;
        }
      });

      // Increment the round number for the next round
      state.liveSession.currentGameNumber += 1;
    },
    updatePlayerStats: (state, action: PayloadAction<PlayerStats[]>) => {
      if (!state.liveSession) {
        return;
      }
      console.log(`updatePlayerStats: ${action.payload}`);
      state.liveSession.playerStats = action.payload;
    },
    endLiveSession: (state) => {
      state.liveSession = null;
    },
    updateGameScore: (state, action: PayloadAction<{
      gameId: string;
      score: { serveScore: number; receiveScore: number }
    }>) => {
      if (!state.liveSession) { return };

      const game = state.liveSession.activeGames.find(g => g.id === action.payload.gameId);
      if (game) {
        game.score = action.payload.score;
      }
    },
    */
  },
});

export const {
  addSession,
  archiveSession,
  removeSession,
  restoreSession,
  setError,
  setLoading,
  setSessions,
  updateSession,
} = sessionsSlice.actions;

export default sessionsSlice.reducer;
