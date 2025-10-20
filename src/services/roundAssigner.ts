import {
  Court,
  Game,
  GameAssignment,
  PartnershipContext,
  Player,
  PlayerStats,
  Results,
  RoundAssignment,
  Score,
  Session,
  emptyPlayerStats,
} from "@/src/types";
import { APP_CONFIG } from "../constants";
import { Alert } from "@/src/utils/alert";
import { PlayerAssignmentStrategy } from "./strategy/PlayerAssignmentStrategy";
import { FairWeightedPlayerAssignmentStrategy } from "./strategy/FairWeightedPlayerAssignmentStrategy";
import { getCurrentRoundNumber } from "./sessionService";
import {
  getRandomElement,
  getRandomElementRequired,
} from "@/src/utils/arrayUtils";

/*
```
New round assigner.  This will replace `sessionCoordinator` for a new approach to player selection.
The main method is `generateRoundAssignment`

Algorithm

Multi-Iteration Round Optimization:
- Generate 3 complete round assignments
- Calculate total freshness score for each round (sum of all court scores)
- Select the round assignment with the lowest total freshness score
- This ensures we get the freshest possible matchups across the entire round

Input:
- Session
- List of available players, including paused players (sitting out players are already calculated)
- List of paused players (these are ineligible)

Internal Data:
- list of playing players (sitouts are already decided)
- partner map
Function:
- get fixed partner (player)

Get list of courts, ordered by minimum rating
Iterate over courts, assigning players to each court based on the following.

Get list of eligible players for court - account for court minimum rating

Choose serve player1 - select by:
    - create list: players with least games on this court (ensure fairness on rated court)
    - tiebreak: select random from list

Update list of eligible players for court (remove player1)

Choose serve player2 - select by:
    - player1 has fixed partner? -> becomes player2 (done)
    - calculate partner scores:
        - for all remaining players -> create list: number of times partnered with player1
          tiebreak 1 (avoid consecutive partnering):
              - filter out player1's last partner (soft constraint: keep all if no alternatives)
          tiebreak 2 (court fairness):
              - create list: least games on this court (if rated)
              - list > 1? random select from list

Update list of eligible players for court (remove player2)

Choose receive player3 - select by:
    - calculate "opponent score":
         - for each eligible player, generate a list weighted towards unseen players:
             - for each of player1 and player2:
                 - base score = 2 * number of times partnered with + 2 * number of times opponent (using factor of 2 here to weigh player1/player2)
             - add recency penalty (soft constraint):
                 - if player is in player1's lastOpponentIds: add recency penalty
                 - if player is in player2's lastOpponentIds: add recency penalty
    - select player3 by lowest opponent score (base + recency penalty)

Update list of eligible players for court (remove player3)

Choose receive player4 - select by:
    - player3 has partner? -> becomes player4 (done)
    - calculate partner scores:
        - for all remaining players -> create list: number of times partnered with player3
          tiebreak 1 (avoid consecutive partnering):
              - filter out player3's last partner (soft constraint: keep all if no alternatives)
          tiebreak 2 (court fairness):
              - least games on this court (if court is rated)
          tiebreak 3 (minimax with recency penalty):
              - for each candidate, calculate total interactions (partners + opponents) with all 3 players (player1, player2, player3)
              - for each candidate, find their maximum interaction count among the 3 players
              - add recency penalty (soft constraint):
                  - if candidate was player1's last partner or opponent
                  - if candidate was player2's last partner or opponent
                  - if candidate was player3's last partner or opponent
              - select candidate(s) with the lowest score (max interactions + recency penalty)
              - random select if still tied

Proceed to next court.
```
*/

const filterEligible = (player: Player, eligiblePlayers: Player[]) => {
  return eligiblePlayers.filter((p) => p.id !== player.id);
};

//
// IMPORTANT: maintain that this class never uses the redux data store
//
export class RoundAssigner {
  private activeCourts: Court[];
  private availablePlayers: Player[];
  private playerStats: Map<string /* playerId */, PlayerStats> = new Map();
  private session: Session;
  private liveData: NonNullable<Session["liveData"]>;
  private partnershipContext: PartnershipContext;
  private assignmentStrategy: PlayerAssignmentStrategy;

  constructor(session: Session, availablePlayers: Player[]) {
    if (!session.liveData) {
      throw new Error(
        `Invalid session: missing required live data. session: ${session}`,
      );
    }
    this.session = session;
    this.liveData = session.liveData;
    this.activeCourts = session.courts.filter((c) => c.isActive);
    this.availablePlayers = availablePlayers;
    this.partnershipContext = this.buildPartnershipContext(availablePlayers);

    // Initialize or load existing stats
    availablePlayers.forEach((player) => {
      const existingStats = this.liveData.playerStats.find(
        (s) => s.playerId === player.id,
      );
      this.playerStats.set(
        player.id,
        existingStats || emptyPlayerStats(player.id),
      );
    });

    this.assignmentStrategy = new FairWeightedPlayerAssignmentStrategy(
      this.activeCourts,
      this.playerStats,
      this.session.partnershipConstraint,
    );
  }

  public generateRoundAssignment(sittingOut?: Player[]): RoundAssignment {
    // Generate 3 complete round assignments and pick the one with lowest total freshness score
    const iterations = 3;
    const candidates: Array<{
      assignment: RoundAssignment;
      totalScore: number;
      courtScores: Array<{ courtName: string; score: number; players: string }>;
    }> = [];

    const enableLog = false;
    enableLog &&
      console.log(
        `\n=== Generating ${iterations} round assignment candidates ===\n`,
      );

    for (let i = 0; i < iterations; i++) {
      const result = this.generateSingleRoundAssignment(sittingOut);
      candidates.push(result);

      if (enableLog) {
        console.log(`\n--- Candidate ${i + 1} ---`);
        result.courtScores.forEach((cs) => {
          console.log(
            `Court ${cs.courtName}: ${cs.players} - Score: ${cs.score}`,
          );
        });
        console.log(`Total Freshness Score: ${result.totalScore}`);
      }
    }

    // Select the candidate with the lowest total score
    const best = candidates.reduce((prev, curr) =>
      curr.totalScore < prev.totalScore ? curr : prev,
    );

    const bestIndex = candidates.indexOf(best);
    enableLog &&
      console.log(
        `\n✓ Selected Candidate ${bestIndex + 1} with lowest score: ${best.totalScore}\n`,
      );

    return best.assignment;
  }

  private generateSingleRoundAssignment(sittingOut?: Player[]): {
    assignment: RoundAssignment;
    totalScore: number;
    courtScores: Array<{ courtName: string; score: number; players: string }>;
  } {
    const gameAssignments: GameAssignment[] = [];
    const courtScores: Array<{
      courtName: string;
      score: number;
      players: string;
    }> = [];
    let totalScore = 0;

    const playersPerRound =
      this.activeCourts.length * APP_CONFIG.MIN_PLAYERS_PER_GAME;

    // Step 2: Determine who sits out (considering partnerships)
    if (!sittingOut) {
      sittingOut = this.assignmentStrategy.selectSittingOutPlayers(
        this.partnershipContext,
        playersPerRound,
      );
    }
    const sittingOutIds = new Set(sittingOut.map((player) => player.id));

    let remainingPlayers = this.availablePlayers.filter(
      (p) => !sittingOutIds.has(p.id),
    );

    const rankedCourts: Court[] = this.getRankedCourts();
    for (const court of rankedCourts) {
      // Get eligible players for this court from remaining players
      let eligiblePlayers = this.getEligiblePlayersForCourt(
        court,
        remainingPlayers,
      );

      if (eligiblePlayers.length < APP_CONFIG.MIN_PLAYERS_PER_GAME) {
        continue;
      }

      const player1 = this.choosePlayer1(court, eligiblePlayers);
      if (!player1) {
        continue;
      }
      eligiblePlayers = filterEligible(player1, eligiblePlayers);

      const player2 = this.choosePlayer2(court, player1, eligiblePlayers);
      eligiblePlayers = filterEligible(player2, eligiblePlayers);

      const player3 = this.choosePlayer3(player1, player2, eligiblePlayers);
      eligiblePlayers = filterEligible(player3, eligiblePlayers);

      const player4 = this.choosePlayer4(
        court,
        player1,
        player2,
        player3,
        eligiblePlayers,
      );

      // Create game assignment
      const gameAssignment: GameAssignment = {
        courtId: court.id,
        serveTeam: {
          player1Id: player1.id,
          player2Id: player2.id,
        },
        receiveTeam: {
          player1Id: player3.id,
          player2Id: player4.id,
        },
      };
      gameAssignments.push(gameAssignment);

      // Calculate matchup freshness score
      const freshnessScore = this.calculateMatchupFreshnessScore(
        player1,
        player2,
        player3,
        player4,
      );
      totalScore += freshnessScore;

      courtScores.push({
        courtName: court.name || court.id,
        score: freshnessScore,
        players: `[${player1.name}, ${player2.name}] vs [${player3.name}, ${player4.name}]`,
      });

      // Remove all 4 players from remaining players pool
      const assignedPlayerIds = new Set([
        player1.id,
        player2.id,
        player3.id,
        player4.id,
      ]);
      remainingPlayers = remainingPlayers.filter(
        (player) => !assignedPlayerIds.has(player.id),
      );
    }

    return {
      assignment: {
        gameAssignments,
        sittingOutIds: sittingOut.map((player) => player.id),
      },
      totalScore,
      courtScores,
    };
  }

  private choosePlayer1(
    court: Court,
    eligiblePlayers: Player[],
  ): Player | undefined {
    let lowestScorePlayers: Player[];

    if (court.minimumRating) {
      // Limit the selection pool to those players with same lowest number of games on this court

      // Order players by games on this court
      eligiblePlayers = this.orderPlayersByCourtScore(court, eligiblePlayers);

      const lowestGamesOnCourt =
        this.playerStats.get(eligiblePlayers[0].id)!.gamesOnCourt[court.id] ||
        0;

      lowestScorePlayers = eligiblePlayers.filter(
        (player) =>
          (this.playerStats.get(player.id)!.gamesOnCourt[court.id] || 0) ===
          lowestGamesOnCourt,
      );
    } else {
      // Use all eligible
      lowestScorePlayers = eligiblePlayers;
    }

    // Prioritize players with partnerships to ensure partnerships can be kept together
    // If there are partnerships, try to select a partnered player first
    const partneredPlayers = lowestScorePlayers.filter((p) =>
      this.partnershipContext.partnerMap.has(p.id),
    );
    if (
      partneredPlayers.length > 0 &&
      this.session.partnershipConstraint?.enforceAllPairings
    ) {
      // Check if their partners are also eligible
      const partnersWithEligiblePartner = partneredPlayers.filter((p) => {
        const partnerId = this.partnershipContext.partnerMap.get(p.id)!;
        return eligiblePlayers.some((ep) => ep.id === partnerId);
      });
      if (partnersWithEligiblePartner.length > 0) {
        lowestScorePlayers = partnersWithEligiblePartner;
        console.log(
          "Choosing player1 from partnered players with eligible partners:",
          lowestScorePlayers.map((p) => `${p.name} (${p.id})`).join(", "),
        );
      }
    }

    // Now choose randomly from the lowest score players
    const player1 = getRandomElement(lowestScorePlayers);
    return player1;
  }

  private choosePlayer2(
    court: Court,
    player1: Player,
    eligiblePlayers: Player[],
  ): Player {
    // Check if player1 has a fixed partner AND that partner is eligible for this court
    const partnerId = this.partnershipContext.partnerMap.get(player1.id);
    if (partnerId) {
      const partner = eligiblePlayers.find((p) => p.id === partnerId);
      if (partner) {
        return partner;
      }
      // Partner exists but not eligible for this court (e.g., rating constraint)
      // Fall through to regular selection logic
    }

    // When enforceAllPairings is true, filter out players who have a fixed partner
    // that is also available (to avoid breaking up partnerships)
    let availableCandidates = eligiblePlayers;
    if (this.session.partnershipConstraint?.enforceAllPairings) {
      availableCandidates = eligiblePlayers.filter((player) => {
        const playerPartnerId = this.partnershipContext.partnerMap.get(player.id);
        if (!playerPartnerId) {
          // Player has no fixed partner, so they're available
          return true;
        }
        // Player has a fixed partner - only include them if their partner is NOT in eligible players
        return !eligiblePlayers.some((p) => p.id === playerPartnerId);
      });
    }

    // Calculate partner scores for all available candidates
    const partnerCounts: { [playerId: string]: number } = {};
    for (const player of availableCandidates) {
      partnerCounts[player.id] =
        this.playerStats.get(player.id)!.partners[player1.id] || 0;
    }

    // Find minimum partner count
    const minPartnerCount = Math.min(...Object.values(partnerCounts));

    // Select all players with minimum partner count
    let candidates = availableCandidates.filter(
      (player) => partnerCounts[player.id] === minPartnerCount,
    );

    // Tiebreak 1: Avoid consecutive partnering (soft constraint)
    if (candidates.length > 1) {
      const player1Stats = this.playerStats.get(player1.id)!;
      const nonRecentPartners = candidates.filter(
        (p) => p.id !== player1Stats.lastPartnerId,
      );
      if (nonRecentPartners.length > 0) {
        candidates = nonRecentPartners;
      }
      // Otherwise keep all candidates (necessary when limited options)
    }

    // Tiebreak 2: if court is rated, filter by least games on this court
    if (court.minimumRating && candidates.length > 1) {
      const courtGames = candidates.map((player) => ({
        player,
        games: this.playerStats.get(player.id)!.gamesOnCourt[court.id] || 0,
      }));
      const minCourtGames = Math.min(...courtGames.map((cg) => cg.games));
      candidates = courtGames
        .filter((cg) => cg.games === minCourtGames)
        .map((cg) => cg.player);
    }

    // Random select from remaining candidates
    const player2 = getRandomElementRequired(candidates);
    return player2;
  }

  private choosePlayer3(
    player1: Player,
    player2: Player,
    eligiblePlayers: Player[],
  ): Player {
    // Calculate opponent score from player1, player2 for each eligible player3:
    //
    // Score = 2 * (times partnered with p1 + times opposed to p1)
    //      +  2 * (times partnered with p2 + times opposed to p2)
    //      +  recency penalty for being a recent opponent of player1 or 2
    //
    // We will choose from lowest of this score
    //
    const player1Stats = this.playerStats.get(player1.id)!;
    const player2Stats = this.playerStats.get(player2.id)!;

    const opponentScores: { player: Player; score: number }[] =
      eligiblePlayers.map((player) => {
        const stats = this.playerStats.get(player.id)!;

        const p1Partners = stats.partners[player1.id] || 0;
        const p1Opponents = stats.opponents[player1.id] || 0;
        const p2Partners = stats.partners[player2.id] || 0;
        const p2Opponents = stats.opponents[player2.id] || 0;

        const baseScore =
          2 * (p1Partners + p1Opponents + p2Partners + p2Opponents);

        // Add large penalty for being a recent opponent (soft constraint)
        let recencyPenalty = 0;
        if (player1Stats.lastOpponentIds?.includes(player.id)) {
          recencyPenalty += 15;
        }
        if (player2Stats.lastOpponentIds?.includes(player.id)) {
          recencyPenalty += 15;
        }
        const score = baseScore + recencyPenalty;

        return { player, score };
      });

    // Find minimum score
    const minScore = Math.min(...opponentScores.map((os) => os.score));

    // Filter to players with minimum score
    const candidates = opponentScores
      .filter((os) => os.score === minScore)
      .map((os) => os.player);

    // Random select from candidates
    return getRandomElementRequired(candidates);
  }

  private choosePlayer4(
    court: Court,
    player1: Player,
    player2: Player,
    player3: Player,
    eligiblePlayers: Player[],
  ): Player {
    // Check if player3 has a fixed partner AND that partner is eligible for this court
    const partnerId = this.partnershipContext.partnerMap.get(player3.id);
    if (partnerId) {
      const partner = eligiblePlayers.find((p) => p.id === partnerId);
      if (partner) {
        return partner;
      }
      // Partner exists but not eligible for this court (e.g., rating constraint)
      // Fall through to regular selection logic
    }

    // When enforceAllPairings is true, filter out players who have a fixed partner
    // that is also available (to avoid breaking up partnerships)
    let availableCandidates = eligiblePlayers;
    if (this.session.partnershipConstraint?.enforceAllPairings) {
      availableCandidates = eligiblePlayers.filter((player) => {
        const playerPartnerId = this.partnershipContext.partnerMap.get(player.id);
        if (!playerPartnerId) {
          // Player has no fixed partner, so they're available
          return true;
        }
        // Player has a fixed partner - only include them if their partner is NOT in eligible players
        return !eligiblePlayers.some((p) => p.id === playerPartnerId);
      });
    }

    // Calculate partner counts for all available candidates with player3
    const partnerCounts: { [playerId: string]: number } = {};
    for (const player of availableCandidates) {
      partnerCounts[player.id] =
        this.playerStats.get(player.id)!.partners[player3.id] || 0;
    }

    // Find minimum partner count
    const minPartnerCount = Math.min(...Object.values(partnerCounts));

    // Filter to players with minimum partner count
    let candidates = availableCandidates.filter(
      (player) => partnerCounts[player.id] === minPartnerCount,
    );

    // Tiebreak 1: Avoid consecutive partnering (soft constraint)
    if (candidates.length > 1) {
      const player3Stats = this.playerStats.get(player3.id)!;
      const nonRecentPartners = candidates.filter(
        (p) => p.id !== player3Stats.lastPartnerId,
      );
      if (nonRecentPartners.length > 0) {
        candidates = nonRecentPartners;
      }
      // Otherwise keep all candidates (necessary when limited options)
    }

    // Tiebreak 2: if court is rated, filter by least games on this court
    if (court.minimumRating && candidates.length > 1) {
      const courtGames = candidates.map((player) => ({
        player,
        games: this.playerStats.get(player.id)!.gamesOnCourt[court.id] || 0,
      }));
      const minCourtGames = Math.min(...courtGames.map((cg) => cg.games));
      candidates = courtGames
        .filter((cg) => cg.games === minCourtGames)
        .map((cg) => cg.player);
    }

    // Tiebreak 3: Minimax - choose player with lowest maximum interaction count
    // among all three players (player1, player2, player3)
    // Plus recency penalty for recent interactions
    if (candidates.length > 1) {
      const player1Stats = this.playerStats.get(player1.id)!;
      const player2Stats = this.playerStats.get(player2.id)!;
      const player3Stats = this.playerStats.get(player3.id)!;

      const interactionAnalysis = candidates.map((candidate) => {
        const stats = this.playerStats.get(candidate.id)!;

        // Calculate total interactions with each of the three players
        const p1Total =
          (stats.partners[player1.id] || 0) +
          (stats.opponents[player1.id] || 0);
        const p2Total =
          (stats.partners[player2.id] || 0) +
          (stats.opponents[player2.id] || 0);
        const p3Total =
          (stats.partners[player3.id] || 0) +
          (stats.opponents[player3.id] || 0);

        // Find the maximum interaction count across all three players
        const maxInteractions = Math.max(p1Total, p2Total, p3Total);

        // Add recency penalty for recent partner or opponent interactions
        const penalty = 10;
        let recencyPenalty = 0;
        if (player1Stats.lastPartnerId === candidate.id) {
          recencyPenalty += penalty;
        }
        if (player1Stats.lastOpponentIds?.includes(candidate.id)) {
          recencyPenalty += penalty;
        }
        if (player2Stats.lastPartnerId === candidate.id) {
          recencyPenalty += penalty;
        }
        if (player2Stats.lastOpponentIds?.includes(candidate.id)) {
          recencyPenalty += penalty;
        }
        if (player3Stats.lastPartnerId === candidate.id) {
          recencyPenalty += penalty;
        }
        if (player3Stats.lastOpponentIds?.includes(candidate.id)) {
          recencyPenalty += penalty;
        }
        const score = maxInteractions + recencyPenalty;
        return { player: candidate, score };
      });

      // Find minimum score (including recency penalty)
      const minScore = Math.min(...interactionAnalysis.map((ia) => ia.score));

      // Filter to candidates with the minimum score
      candidates = interactionAnalysis
        .filter((ia) => ia.score === minScore)
        .map((ia) => ia.player);
    }

    // Random select from remaining candidates
    return getRandomElementRequired(candidates);
  }

  private calculateMatchupFreshnessScore(
    player1: Player,
    player2: Player,
    player3: Player,
    player4: Player,
  ): number {
    // Calculate freshness score for the entire matchup
    // Lower score = fresher matchup
    // Score considers all 6 pairings in the game:
    // - p1-p2 (teammates), p1-p3 (opponents), p1-p4 (opponents)
    // - p2-p3 (opponents), p2-p4 (opponents), p3-p4 (teammates)

    const players = [player1, player2, player3, player4];
    let totalScore = 0;

    const roundNumber = getCurrentRoundNumber(this.session);
    const partnerPenalty = 35 + roundNumber; // Higher penalty for recent partners
    const opponentPenalty = 15 + roundNumber; // Lower penalty for recent opponents

    // Check all pairings
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const playerA = players[i];
        const playerB = players[j];
        const statsA = this.playerStats.get(playerA.id)!;
        const statsB = this.playerStats.get(playerB.id)!;

        // Add historical interaction counts
        const partnerCount = statsA.partners[playerB.id] || 0;
        const opponentCount = statsA.opponents[playerB.id] || 0;
        totalScore += partnerCount + opponentCount;

        // Add recency penalties
        // Check if they were recent partners - ONLY for actual teammates in this game
        // Teammates are: p1-p2 (i=0,j=1) and p3-p4 (i=2,j=3)
        const areTeammatesInThisGame =
          (i === 0 && j === 1) || (i === 2 && j === 3);
        if (areTeammatesInThisGame && statsA.lastPartnerId === playerB.id) {
          totalScore += partnerPenalty;
        }
        // Check if they were recent opponents - applies to any pairing
        if (statsA.lastOpponentIds?.includes(playerB.id)) {
          totalScore += opponentPenalty;
        }
      }
    }
    return totalScore;
  }

  private buildPartnershipContext(players: Player[]): PartnershipContext {
    const partnerMap = new Map<string, string>(); // maps each partner to the other
    const pairs: Array<{ players: [Player, Player]; maxRating: number }> = [];
    const playerSet = new Set(players.map((p) => p.id));

    if (
      this.session.partnershipConstraint &&
      this.session.partnershipConstraint.partnerships.length > 0
    ) {
      // Process active partnerships
      this.session.partnershipConstraint.partnerships
        .filter((p) => p.isActive)
        .forEach((partnership) => {
          // Only include partnerships where both players are in the session
          if (
            playerSet.has(partnership.player1Id) &&
            playerSet.has(partnership.player2Id)
          ) {
            const player1 = players.find(
              (p) => p.id === partnership.player1Id,
            )!;
            const player2 = players.find(
              (p) => p.id === partnership.player2Id,
            )!;

            if (player1 && player2) {
              // Build bidirectional map
              partnerMap.set(partnership.player1Id, partnership.player2Id);
              partnerMap.set(partnership.player2Id, partnership.player1Id);

              const maxRating = Math.max(
                player1.rating || 0,
                player2.rating || 0,
              );

              pairs.push({
                players: [player1, player2],
                maxRating,
              });
            } else {
              // very unexpected
              const partnershipInfo = `${partnership.player1Id} / ${partnership.player2Id}`;
              Alert.alert(
                "Error",
                `Partnership has invalid data: ${partnershipInfo}`,
              );
            }
          }
        });
    }

    const unpairedPlayers = players.filter((p) => !partnerMap.has(p.id));

    return {
      partnerMap,
      unpairedPlayers,
      pairs,
    };
  }

  private getRankedCourts(): Court[] {
    const sortedCourts = [...this.activeCourts].sort(
      (a, b) => (b.minimumRating || 0) - (a.minimumRating || 0),
    );
    return sortedCourts;
  }

  private getEligiblePlayersForCourt(
    court: Court,
    players: Player[],
  ): Player[] {
    return players.filter((player) => {
      if (!court.minimumRating) {
        return true;
      }
      return player.rating && player.rating >= court.minimumRating;
    });
  }

  private orderPlayersByCourtScore(court: Court, players: Player[]): Player[] {
    return players.sort((a, b) => {
      const aStats = this.playerStats.get(a.id);
      const bStats = this.playerStats.get(b.id);
      return (
        (aStats?.gamesOnCourt[court.id] || 0) -
        (bStats?.gamesOnCourt[court.id] || 0)
      );
    });
  }

  public updateStatsForRound(games: Game[], results: Results): PlayerStats[] {
    games.forEach((game) => {
      const score = results.scores[game.id];
      this.updatePlayerStatsForGame(game, score || undefined);
    });

    const currentRoundIndex =
      this.liveData.rounds.findIndex((round) =>
        round.games.some((g) => g.id === games[0]?.id),
      ) ?? this.liveData.rounds.length - 1;
    const currentRound = this.liveData.rounds[currentRoundIndex];
    if (currentRound) {
      this.updateSittingOutStats(currentRound.sittingOutIds);
    }

    return this.getPlayerStats();
  }

  private updatePlayerStatsForGame(game: Game, score?: Score): void {
    const allGamePlayerIds = [
      game.serveTeam.player1Id,
      game.serveTeam.player2Id,
      game.receiveTeam.player1Id,
      game.receiveTeam.player2Id,
    ];

    allGamePlayerIds.forEach((playerId) => {
      const stats = this.playerStats.get(playerId);

      if (!stats) {
        console.error(`No stats found for player ${playerId}`);
        return;
      }

      const mutableStats = {
        ...stats,
        partners: { ...stats.partners },
        opponents: { ...stats.opponents },
        gamesOnCourt: { ...stats.gamesOnCourt },
      };
      mutableStats.gamesPlayed++;
      mutableStats.consecutiveGames++;

      // Update partnership counts - only with actual teammate
      const teammateId = this.getTeammateId(game, playerId);
      if (teammateId) {
        mutableStats.partners[teammateId] =
          (mutableStats.partners[teammateId] || 0) + 1;

        // Check if this was a fixed partnership game
        if (this.isFixedPartnership(playerId, teammateId)) {
          mutableStats.fixedPartnershipGames++;
        }

        // Track last partner
        mutableStats.lastPartnerId = teammateId;
      }

      // Update opponent counts - with players on the opposing team
      const opponentIds = this.getOpponentIds(game, playerId);
      opponentIds.forEach((opponentId) => {
        mutableStats.opponents[opponentId] =
          (mutableStats.opponents[opponentId] || 0) + 1;
      });

      // Track last opponents
      mutableStats.lastOpponentIds = opponentIds;

      // Update games on court
      mutableStats.gamesOnCourt[game.courtId] =
        (mutableStats.gamesOnCourt[game.courtId] || 0) + 1;

      // Update score if provided
      if (score) {
        const playerScore = this.getPlayerScore(game, playerId, score);
        mutableStats.totalScore += playerScore.for;
        mutableStats.totalScoreAgainst += playerScore.against;
      }
      this.playerStats.set(playerId, mutableStats);
    });
  }

  private isFixedPartnership(player1Id: string, player2Id: string): boolean {
    if (!this.session.partnershipConstraint) {
      return false;
    }
    return this.session.partnershipConstraint.partnerships.some(
      (p) =>
        p.isActive &&
        ((p.player1Id === player1Id && p.player2Id === player2Id) ||
          (p.player1Id === player2Id && p.player2Id === player1Id)),
    );
  }

  private updateSittingOutStats(sittingOutIds: string[]) {
    sittingOutIds.forEach((playerId) => {
      const stats = this.playerStats.get(playerId);
      if (stats) {
        // Only updating primitive fields, so shallow copy is sufficient
        const mutableStats = { ...stats };
        mutableStats.gamesSatOut++;
        mutableStats.consecutiveGames = 0;
        this.playerStats.set(playerId, mutableStats);
      }
    });
  }

  private getTeammateId(game: Game, playerId: string): string | null {
    if (game.serveTeam.player1Id === playerId) {
      return game.serveTeam.player2Id;
    } else if (game.serveTeam.player2Id === playerId) {
      return game.serveTeam.player1Id;
    } else if (game.receiveTeam.player1Id === playerId) {
      return game.receiveTeam.player2Id;
    } else if (game.receiveTeam.player2Id === playerId) {
      return game.receiveTeam.player1Id;
    }
    return null;
  }

  private getOpponentIds(game: Game, playerId: string): string[] {
    if (
      game.serveTeam.player1Id === playerId ||
      game.serveTeam.player2Id === playerId
    ) {
      return [game.receiveTeam.player1Id, game.receiveTeam.player2Id];
    } else {
      return [game.serveTeam.player1Id, game.serveTeam.player2Id];
    }
  }

  private getPlayerScore(
    game: Game,
    playerId: string,
    score: Score,
  ): { for: number; against: number } {
    const isOnServeTeam =
      game.serveTeam.player1Id === playerId ||
      game.serveTeam.player2Id === playerId;
    return isOnServeTeam
      ? { for: score.serveScore, against: score.receiveScore }
      : { for: score.receiveScore, against: score.serveScore };
  }

  public getPlayerStats(): PlayerStats[] {
    return Array.from(this.playerStats.values());
  }
}
