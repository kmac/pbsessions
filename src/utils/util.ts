import { LiveSession, Player, Group, Session, } from "@/src/types";

export function getShortGender(gender: 'male' | 'female' | 'other' | undefined, parenthesize?: boolean): string {
  if (typeof parenthesize === 'undefined') {
    parenthesize = true;
  }
  switch (gender) {
    case 'male':
      return parenthesize ? '(M)' : 'M';
    case 'female':
      return parenthesize ? '(F)' : 'F';
    case 'other':
      return parenthesize ? '(O)' : 'O';
    default:
      return '';
  }
}

export function playerDetailsToString(item: Player): String {
  let details = "";
  let separator = "";
  if (item.gender) {
    details = getShortGender(item.gender, true)
    separator = ", "
  }
  if (item.email) {
    details = details + separator + `${item.email}`;
    separator = ", "
  }
  if (item.phone) {
    details = details + separator + `${item.phone}`;
    separator = ", "
  }
  return details;
};

export function getEmptyLiveSession(): LiveSession {
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
