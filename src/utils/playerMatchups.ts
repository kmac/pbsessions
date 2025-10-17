import { Session } from "@/src/types";

export interface PlayerMatchupStats {
  partneredCount: number;
  partneredWins: number;
  partneredLosses: number;
  againstCount: number;
  againstWins: number;
  againstLosses: number;
  sameCourtCount: number;
}

export interface PlayerMatchups {
  [playerId: string]: PlayerMatchupStats;
}

export interface SessionMatchupData {
  [playerId: string]: PlayerMatchups;
}

export function generateSessionMatchupData(
  session: Session,
): SessionMatchupData {
  const result: SessionMatchupData = {};

  // Initialize the data structure for all players in the session
  session.playerIds.forEach((playerId) => {
    result[playerId] = {};
    session.playerIds.forEach((otherPlayerId) => {
      if (playerId !== otherPlayerId) {
        result[playerId][otherPlayerId] = {
          partneredCount: 0,
          partneredWins: 0,
          partneredLosses: 0,
          againstCount: 0,
          againstWins: 0,
          againstLosses: 0,
          sameCourtCount: 0,
        };
      }
    });
  });

  // If no live data exists, return the initialized structure
  if (!session.liveData) {
    return result;
  }

  // Process each round and game
  session.liveData.rounds.forEach((round) => {
    round.games.forEach((game) => {
      const servePlayer1 = game.serveTeam.player1Id;
      const servePlayer2 = game.serveTeam.player2Id;
      const receivePlayer1 = game.receiveTeam.player1Id;
      const receivePlayer2 = game.receiveTeam.player2Id;

      const allPlayers = [
        servePlayer1,
        servePlayer2,
        receivePlayer1,
        receivePlayer2,
      ];

      // Update same court counts for all player pairs
      for (let i = 0; i < allPlayers.length; i++) {
        for (let j = i + 1; j < allPlayers.length; j++) {
          const player1 = allPlayers[i];
          const player2 = allPlayers[j];

          // Only update if both players are in the session
          if (result[player1] && result[player1][player2]) {
            result[player1][player2].sameCourtCount++;
            result[player2][player1].sameCourtCount++;
          }
        }
      }

      // Update partnership counts
      if (result[servePlayer1]?.[servePlayer2]) {
        result[servePlayer1][servePlayer2].partneredCount++;
        result[servePlayer2][servePlayer1].partneredCount++;
      }

      if (result[receivePlayer1]?.[receivePlayer2]) {
        result[receivePlayer1][receivePlayer2].partneredCount++;
        result[receivePlayer2][receivePlayer1].partneredCount++;
      }

      // Update against counts
      const serveTeamPlayers = [servePlayer1, servePlayer2];
      const receiveTeamPlayers = [receivePlayer1, receivePlayer2];

      serveTeamPlayers.forEach((servePlayer) => {
        receiveTeamPlayers.forEach((receivePlayer) => {
          if (result[servePlayer]?.[receivePlayer]) {
            result[servePlayer][receivePlayer].againstCount++;
            result[receivePlayer][servePlayer].againstCount++;
          }
        });
      });

      // Update wins/losses if scoring is enabled and game is completed with a score
      if (session.scoring && game.score && game.isCompleted) {
        const serveWon = game.score.serveScore > game.score.receiveScore;

        if (serveWon) {
          // Serve team won - update partnership wins/losses
          if (result[servePlayer1]?.[servePlayer2]) {
            result[servePlayer1][servePlayer2].partneredWins++;
            result[servePlayer2][servePlayer1].partneredWins++;
          }
          if (result[receivePlayer1]?.[receivePlayer2]) {
            result[receivePlayer1][receivePlayer2].partneredLosses++;
            result[receivePlayer2][receivePlayer1].partneredLosses++;
          }

          // Update against wins/losses
          serveTeamPlayers.forEach((servePlayer) => {
            receiveTeamPlayers.forEach((receivePlayer) => {
              if (result[servePlayer]?.[receivePlayer]) {
                result[servePlayer][receivePlayer].againstWins++;
                result[receivePlayer][servePlayer].againstLosses++;
              }
            });
          });
        } else {
          // Receive team won - update partnership wins/losses
          if (result[receivePlayer1]?.[receivePlayer2]) {
            result[receivePlayer1][receivePlayer2].partneredWins++;
            result[receivePlayer2][receivePlayer1].partneredWins++;
          }
          if (result[servePlayer1]?.[servePlayer2]) {
            result[servePlayer1][servePlayer2].partneredLosses++;
            result[servePlayer2][servePlayer1].partneredLosses++;
          }

          // Update against wins/losses
          receiveTeamPlayers.forEach((receivePlayer) => {
            serveTeamPlayers.forEach((servePlayer) => {
              if (result[receivePlayer]?.[servePlayer]) {
                result[receivePlayer][servePlayer].againstWins++;
                result[servePlayer][receivePlayer].againstLosses++;
              }
            });
          });
        }
      }
    });
  });

  return result;
}

// Helper function to get matchup summary for a specific player pair
export function getPlayerPairSummary(
  matchupData: SessionMatchupData,
  player1Id: string,
  player2Id: string,
): PlayerMatchupStats | null {
  return matchupData[player1Id]?.[player2Id] || null;
}

// Helper function to get all matchups for a specific player
export function getPlayerMatchups(
  matchupData: SessionMatchupData,
  playerId: string,
): PlayerMatchups | null {
  return matchupData[playerId] || null;
}
