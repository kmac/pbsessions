import {
  Court,
  Game,
  PlayerStats,
  Results,
  Round,
  RoundAssignment,
  Session,
  SessionState,
} from "@/src/types";

export const getCurrentRoundInfo = (liveData?: {
  rounds: Round[];
  playerStats: any[];
}) => {
  const safeData = liveData ?? { rounds: [], playerStats: [] };
  const roundsLength = safeData.rounds.length;

  return {
    liveData: safeData,
    currentRound:
      roundsLength === 0
        ? ({ games: [], sittingOutIds: [] } as Round)
        : safeData.rounds[roundsLength - 1],
  };
};

export const validateLive = (session?: Session): void => {
  if (!session) {
    throw new Error("session is null");
  }
  if (session.state !== SessionState.Live || !session.liveData) {
    throw new Error(`session is not live, session: ${session}`);
  }
};

export const getRoundNumber = (roundIndex: number): number => roundIndex + 1; // 1-based for display

export const getCurrentRoundIndex = (session: Session): number =>
  Math.max(0, (session.liveData?.rounds.length || 0) - 1);

export const getCurrentRoundNumber = (session: Session): number => {
  console.log("getCurrentRoundNumber:")
  console.log(session.liveData)
  return getRoundNumber(getCurrentRoundIndex(session));
};

export const getCurrentRound = (
  session: Session,
  live: boolean = true,
  roundIndex?: number,
): Round => {
  if (live) {
    validateLive(session);
  } else if (!session || !session.liveData) {
    return { games: [], sittingOutIds: [] };
  }
  const rounds = session.liveData!.rounds;
  const length = rounds.length;
  if (length === 0) {
    return { games: [], sittingOutIds: [] };
  }

  // Use provided index or default to last round
  const index = roundIndex !== undefined ? roundIndex : rounds.length - 1;

  // Validate bounds
  if (index < 0 || index >= rounds.length) {
    throw new Error(
      `Round index ${index} out of bounds. Available rounds: 0-${rounds.length - 1}`,
    );
  }
  return rounds[index];
};

const convertAssignmentToRound = (
  session: Session,
  roundAssignment: RoundAssignment,
): Round => {
  const nextRoundIndex = getCurrentRoundIndex(session);
  const newGames: Game[] = roundAssignment.gameAssignments.map((ra, index) => ({
    id: `game_${nextRoundIndex}_${ra.courtId}_${Date.now()}_${index}`,
    sessionId: session!.id,
    courtId: ra.courtId,
    serveTeam: ra.serveTeam,
    receiveTeam: ra.receiveTeam,
    isCompleted: false,
  }));
  const nextRound = {
    games: newGames,
    sittingOutIds: roundAssignment.sittingOutIds,
  };
  return nextRound;
};

export const convertToRound = (
  session: Session,
  assignments: RoundAssignment,
): Session => {
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
    lines.push(`  Consecutive Games: ${pstat.consecutiveGames}`);
    lines.push(`  Games Sat Out: ${pstat.gamesSatOut}`);
    lines.push(`  Total Score (for): ${pstat.totalScore}`);
    lines.push(`  Total Score (against): ${pstat.totalScoreAgainst}`);

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
  static startLiveSession = (session: Session): Session => {
    return {
      ...session,
      state: SessionState.Live,
      liveData: {
        rounds: [],
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
      index === session.liveData!.rounds.length - 1 ? newRound : round,
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

  static removeCourt = (session: Session, courtId: string): Session => {
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
      courts: session.courts.map((court) =>
        court.id === updatedCourt.id ? updatedCourt : court,
      ),
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

  static removePlayer = (session: Session, playerId: string): Session => {
    return {
      ...session,
      playerIds: session.playerIds.filter((id) => id !== playerId),
      updatedAt: new Date().toISOString(),
    };
  };

  static togglePausePlayer = (session: Session, playerId: string): Session => {
    if (!session.playerIds.includes(playerId)) {
      throw new Error(`Player ${playerId} is not in this session`);
    }
    let pausedPlayerIds: string[] = [];
    if (!session.pausedPlayerIds) {
      pausedPlayerIds = [playerId];
    } else if (session.pausedPlayerIds.find((pid) => pid === playerId)) {
      pausedPlayerIds = session.pausedPlayerIds.filter(
        (pid) => pid !== playerId,
      );
    } else {
      pausedPlayerIds = [...session.pausedPlayerIds, playerId];
    }
    return {
      ...session,
      pausedPlayerIds: pausedPlayerIds,
      updatedAt: new Date().toISOString(),
    };
  };
  static addPartnership = (
    session: Session,
    player1Id: string,
    player2Id: string,
  ): Session => {
    if (
      !session.playerIds.includes(player1Id) ||
      !session.playerIds.includes(player2Id)
    ) {
      throw new Error("Both players must be in the session");
    }

    const partnerships = session.partnershipConstraint?.partnerships || [];

    // Check if either player is already in a partnership
    const existingPartnership = partnerships.find(
      (p) =>
        p.player1Id === player1Id ||
        p.player2Id === player1Id ||
        p.player1Id === player2Id ||
        p.player2Id === player2Id,
    );

    if (existingPartnership) {
      throw new Error("One or both players are already in a partnership");
    }

    const { v4: uuidv4 } = require("uuid");
    const newPartnership = {
      id: uuidv4(),
      player1Id,
      player2Id,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updatedPartnerships = [...partnerships, newPartnership];

    return {
      ...session,
      partnershipConstraint: {
        partnerships: updatedPartnerships,
        enforceAllPairings:
          session.partnershipConstraint?.enforceAllPairings || false,
      },
      updatedAt: new Date().toISOString(),
    };
  };

  static removePartnership = (session: Session, playerId: string): Session => {
    const partnerships = session.partnershipConstraint?.partnerships || [];

    const updatedPartnerships = partnerships.filter(
      (p) => p.player1Id !== playerId && p.player2Id !== playerId,
    );

    return {
      ...session,
      partnershipConstraint:
        updatedPartnerships.length > 0
          ? {
              partnerships: updatedPartnerships,
              enforceAllPairings:
                session.partnershipConstraint?.enforceAllPairings || false,
            }
          : undefined,
      updatedAt: new Date().toISOString(),
    };
  };

  static updatePartnership = (
    session: Session,
    playerId: string,
    newPartnerId: string | null,
  ): Session => {
    // First remove any existing partnership for this player
    let updatedSession = SessionService.removePartnership(session, playerId);

    // If newPartnerId is provided, create new partnership
    if (newPartnerId) {
      updatedSession = SessionService.addPartnership(
        updatedSession,
        playerId,
        newPartnerId,
      );
    }

    return updatedSession;
  };
}
