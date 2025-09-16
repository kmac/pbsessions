import { Court, Player, Group, Session } from "@/src/types";

export function getShortGender(
  gender: "male" | "female" | "other" | undefined,
  parenthesize?: boolean,
): string {
  if (typeof parenthesize === "undefined") {
    parenthesize = true;
  }
  switch (gender) {
    case "male":
      return parenthesize ? "(M)" : "M";
    case "female":
      return parenthesize ? "(F)" : "F";
    case "other":
      return parenthesize ? "(O)" : "O";
    default:
      return "";
  }
}

export function playerDetailsToString(item: Player): String {
  let details = "";
  let separator = "";
  if (item.gender) {
    details = getShortGender(item.gender, true);
    separator = ", ";
  }
  if (item.email) {
    details = details + separator + `${item.email}`;
    separator = ", ";
  }
  if (item.phone) {
    details = details + separator + `${item.phone}`;
    separator = ", ";
  }
  return details;
}

export function logSession(session: Session | undefined, msg = "Session: ") {
  if (session) {
    console.log(
      `${msg}: ${session.name}, state: ${session.state}, updatedAt: ${session.updatedAt}, liveData: ${session.liveData}`,
    );
  } else {
    console.log(`${msg}: no session`);
  }
}

export function getSessionPlayers(
  session: Session,
  allPlayers: Player[],
): Player[] {
  if (!session || !allPlayers) {
    return [];
  }
  return session.playerIds.flatMap((pid) => {
    const player = allPlayers.find((p) => p.id === pid);
    return player ? [player] : [];
  });
}

export function getSessionPausedPlayers(
  session: Session,
  allPlayers: Player[],
): Player[] {
  if (!session || !allPlayers || !session.pausedPlayerIds) {
    return [];
  }
  return session.pausedPlayerIds.flatMap((pid) => {
    const player = allPlayers.find((p) => p.id === pid);
    return player ? [player] : [];
  });
}

export function getPlayer(players: Player[], playerId: string): Player {
  const player = players.find((p) => p.id === playerId);
  if (player) {
    return player;
  }
  const now = new Date().toISOString();
  return {
    id: playerId,
    name: "UNKNOWN",
    createdAt: now,
    updatedAt: now,
  };
}

export function getPlayerName(players: Player[], playerId: string) {
  const player = players.find((p) => p.id === playerId);
  return player?.name || "Unknown Player";
}

export function getCourt(courts: Court[], courtId: string): Court {
  const court = courts.find((c) => c.id === courtId);
  return court
    ? court
    : {
        id: courtId,
        name: "UNKNOWN",
        isActive: false,
      };
}

export function getCourtName(courts: Court[], courtId: string) {
  const court = courts.find((c) => c.id === courtId);
  return court?.name || "Unknown Court";
}
