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

export function getSessionPlayers(
  session: Session,
  allPlayers: Player[],
): Player[] {
  if (!session || !allPlayers) {
    return [];
  }
  return session.playerIds.flatMap(pid => {
    const player = allPlayers.find((p) => p.id === pid);
    return player ? [player] : [];
  });
}
