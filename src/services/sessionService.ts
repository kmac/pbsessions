import {
  Court,
  Game,
  Player,
  PlayerStats,
  Results,
  Round,
  RoundAssignment,
  Score,
  Session,
  SessionState,
} from "@/src/types";
import { SessionCoordinator } from "./sessionCoordinator";
import { getSessionPlayers, logSession } from "@/src/utils/util";

export const validateLive = (session?: Session): void => {
  if (!session) {
    throw new Error("session is null");
  }
  if (session.state !== SessionState.Live || !session.liveData) {
    throw new Error(`session is not live, session: ${session}`);
  }
};

export const getCurrentRoundIndex = (session: Session, live: boolean = true): number => {
  if (live) {
    validateLive(session);
  } else if (!session || !session.liveData) {
    return 0;
  }
  return session.liveData!.rounds.length;
};

export const getCurrentRoundNumber = (session: Session, live: boolean = true): number => {
  if (live) {
    validateLive(session);
  } else if (!session || !session.liveData) {
    return 0;
  }
  return session.liveData!.rounds.length;

  // if (session.state === SessionState.Live) {
  //   return length - 1;
  // }
  // if (session.state === SessionState.Unstarted) {
  //   return 0;
  // }
  // if (session.state === SessionState.Complete) {
  //   return length - 1;
  // }
  // return length === 0 ? 0 : length - 1;
};

export const getCurrentRound = (session: Session, live: boolean = true): Round => {
  if (live) {
    validateLive(session);
  } else if (!session || !session.liveData) {
    return { games: [], sittingOutIds: [] };
  }
  const length = session.liveData!.rounds.length;
  if (length === 0) {
    return { games: [], sittingOutIds: [] };
  }
  return session.liveData!.rounds[length - 1];
};

const convertAssignmentToRound = (session: Session, roundAssignment: RoundAssignment): Round => {
  const newGames: Game[] = roundAssignment.gameAssignments.map((ra, index) => ({
    id: `game_${roundAssignment.roundNumber}_${ra.courtId}_${Date.now()}_${index}`,
    sessionId: session!.id,
    gameNumber: roundAssignment.roundNumber,
    courtId: ra.courtId,
    serveTeam: ra.serveTeam,
    receiveTeam: ra.receiveTeam,
    isCompleted: false,
  }));
  const nextRound = {
    games: newGames,
    sittingOutIds: roundAssignment.sittingOutIds
  };
  return nextRound;
}

export const convertToRound = (session: Session, assignments: RoundAssignment): Session => {
  validateLive(session);
  const nextRound: Round = convertAssignmentToRound(session, assignments);
  session.liveData!.rounds.push(nextRound);
  return session;
};

export const playerStatsToString = (stats: PlayerStats[]): string => {
  if (!stats || stats.length === 0) {
    return "No player statistics available.";
  }

  const lines: string[] = ["=== Player Statistics ==="];
  stats.forEach((pstat, index) => {
    lines.push(`Player ${index + 1}: ${pstat.playerId}`);
    lines.push(`  Games Played: ${pstat.gamesPlayed}`);
    lines.push(`  Games Sat Out: ${pstat.gamesSatOut}`);
    lines.push(`  Total Score: ${pstat.totalScore}`);

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
};

export class SessionService {
  static startLiveSession = (session: Session, sessionPlayers: Player[]): Session => {
    // message: "Invalid session: missing required live data. session: [object Object]"
    const sessionCoordinator = new SessionCoordinator({...session, liveData: { rounds:[], playerStats: []}}, sessionPlayers);
    const roundAssignment = sessionCoordinator.generateRoundAssignment();
    const newRound = convertAssignmentToRound(session, roundAssignment);
    return {
      ...session,
      state: SessionState.Live,
      liveData: {
        rounds: [newRound],
        playerStats: [],
      },
      updatedAt: new Date().toISOString(),
    };
  };

  static endSession = (session: Session): Session => {
    return {
      ...session,
      state: SessionState.Complete,
      updatedAt: new Date().toISOString(),
    };
  };

  static applyNextRound(
    session: Session,
    assignment: RoundAssignment,
  ): Session {
    validateLive(session);
    const newRound = convertAssignmentToRound(session, assignment);

    return {
      ...session,
      liveData: {
        ...session.liveData!,
        rounds: [...session.liveData!.rounds, newRound],
      },
      updatedAt: new Date().toISOString(),
    };
  }

  static updateCurrentRound(
    session: Session,
    assignment: RoundAssignment,
  ): Session {
    validateLive(session);
    const newRound = convertAssignmentToRound(session, assignment);
    const updatedRounds = session.liveData!.rounds.map((round, index) =>
      index === session.liveData!.rounds.length - 1
        ? newRound
        : round,
    );
    return {
      ...session,
      liveData: {
        ...session.liveData!,
        rounds: updatedRounds,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  static startRound(session: Session): Session {
    validateLive(session);
    const now = new Date().toISOString();

    const currentRound = getCurrentRound(session);
    const updatedGames = currentRound.games.map((game) => ({
      ...game,
      startedAt: now,
    }));

    const updatedRounds = session.liveData!.rounds.map((round, index) =>
      index === session.liveData!.rounds.length - 1
        ? { ...round, games: updatedGames }
        : round,
    );

    return {
      ...session,
      liveData: {
        ...session.liveData!,
        rounds: updatedRounds,
      },
      updatedAt: now,
    };
  }

  // static updatePlayerStats(
  //   session: Session,
  //   playerStats: PlayerStats[],
  // ): Session {
  //   validateLive(session);
  //
  //   return {
  //     ...session,
  //     liveData: {
  //       ...session.liveData!,
  //       playerStats,
  //     },
  //     updatedAt: new Date().toISOString(),
  //   };
  // }
  //
  // static updateGameScore(
  //   session: Session,
  //   gameId: string,
  //   score: Score,
  // ): Session {
  //   validateLive(session);
  //
  //   const currentRound = getCurrentRound(session);
  //   const updatedGames = currentRound.games.map((game) =>
  //     game.id === gameId ? { ...game, score } : game,
  //   );
  //   const updatedRounds = session.liveData!.rounds.map((round, index) =>
  //     index === session.liveData!.rounds.length - 1
  //       ? { ...round, games: updatedGames }
  //       : round,
  //   );
  //
  //   return {
  //     ...session,
  //     liveData: {
  //       ...session.liveData!,
  //       rounds: updatedRounds,
  //     },
  //     updatedAt: new Date().toISOString(),
  //   };
  // }

  static completeRound(
    session: Session,
    results: Results,
    updatedPlayerStats: PlayerStats[],
  ): Session {
    validateLive(session);
    const now = new Date().toISOString();

    const currentRound = getCurrentRound(session);
    const updatedGames = currentRound.games.map((game) => ({
      ...game,
      isCompleted: true,
      completedAt: now,
      score: results ? results.scores[game.id] || game.score : game.score,
    }));

    const updatedRounds = session.liveData!.rounds.map((round, index) =>
      index === session.liveData!.rounds.length - 1
        ? { ...round, games: updatedGames }
        : round,
    );

    return {
      ...session,
      liveData: {
        ...session.liveData!,
        rounds: updatedRounds,
        playerStats: updatedPlayerStats,
      },
      updatedAt: now,
    };
  }

  static addCourt = (session: Session, court: Court): Session => {
    if (session && !session.courts.find((c) => c.id === court.id)) {
      session.courts.push(court);
      return {
        ...session,
        updatedAt: new Date().toISOString(),
      };
    }
    return session;
  };

  static removeCourt = (
    session: Session,
    courtId: string,
  ): Session => {
    return {
      ...session,
      courts: session.courts.filter((c) => c.id !== courtId),
      updatedAt: new Date().toISOString(),
    };
  };

  static updateCourt = (session: Session, updatedCourt: Court): Session => {
    if (!session) {
      return session;
    }
    return {
      ...session,
      courts: session.courts.map(court => court.id === updatedCourt.id ? updatedCourt : court),
      updatedAt: new Date().toISOString(),
    };
  };

  static addPlayer = (session: Session, playerId: string) => {
    if (session && !session.playerIds.includes(playerId)) {
      session.playerIds.push(playerId);
      return {
        ...session,
        updatedAt: new Date().toISOString(),
      };
    }
    return session;
  };

  static removePlayer = (
    session: Session,
    playerId: string,
  ): Session => {
    return {
      ...session,
      playerIds: session.playerIds.filter((id) => id !== playerId),
      updatedAt: new Date().toISOString(),
    };
  };
}
