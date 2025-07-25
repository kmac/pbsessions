import { LiveSession, Player, Session, } from "@/src/types";

export function getEmptyLiveSession() : LiveSession {
  const emptyLiveSession = {
    sessionId: '0',
    currentGameNumber: 0,
    courts: [],
    activeGames: [],
    playerStats: [],
    scoring: false,
    showRatings: false,
    isActive: false,
  } as LiveSession;
  return emptyLiveSession;
}

// note: this should be up to date when new players are added to a session
export function getLiveSessionPlayers(
  liveSession: LiveSession,
  sessions: Session[],
  players: Player[],
): Player[] {
  if (!liveSession || !sessions || !players) {
    return [];
  }
  return players.filter(
    (p) =>
      liveSession?.sessionId &&
      sessions
        .find((s) => s.id === liveSession.sessionId)
        ?.playerIds.includes(p.id),
  );
}
