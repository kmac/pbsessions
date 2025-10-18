import {
  Court,
  Game,
  GameAssignment,
  PartnershipConstraint,
  PartnershipContext,
  Player,
  PlayerStats,
  Results,
  Round,
  RoundAssignment,
  Score,
  Session,
  Team,
} from "@/src/types";
import { APP_CONFIG } from "../constants";
import { Alert } from "@/src/utils/alert";
import {
  DefaultPlayerAssignmentStrategy,
  PlayerAssignmentStrategy,
} from "./strategy/PlayerAssignmentStrategy";
import { FairWeightedPlayerAssignmentStrategy } from "./strategy/FairWeightedPlayerAssignmentStrategy";
import { LotteryPlayerAssignmentStrategy } from "./strategy/LotteryPlayerAssignmentStrategy";
import { getCurrentRoundIndex } from "./sessionService";

type Strategy = "default" | "lottery" | "fairweight";

//
// IMPORTANT: maintain that this class never uses the redux data store
//
export class SessionCoordinator {
  private activeCourts: Court[];
  private players: Player[];
  private pausedPlayerIds: Set<string>;
  private playerStats: Map<string, PlayerStats> = new Map();
  private liveData: NonNullable<Session["liveData"]>;
  private currentRound: Round;
  private currentRoundIndex: number;
  private partnershipConstraint?: PartnershipConstraint;
  private assignmentStrategy: PlayerAssignmentStrategy;

  constructor(
    session: Session,
    players: Player[],
    pausedPlayers: Player[],
    strategy: Strategy = "fairweight", // "default"
  ) {
    if (!session.liveData) {
      throw new Error(
        `Invalid session: missing required live data. session: ${session}`,
      );
    }
    this.liveData = session.liveData;
    this.activeCourts = session.courts.filter((c) => c.isActive);
    this.players = players;
    this.pausedPlayerIds = new Set<string>(
      pausedPlayers.map((player) => player.id),
    );
    this.partnershipConstraint = session.partnershipConstraint;
    this.currentRoundIndex = getCurrentRoundIndex(session); // Use helper function
    this.currentRound = session.liveData.rounds[this.currentRoundIndex] || {
      games: [],
      sittingOutIds: [],
    };

    // Initialize or load existing stats
    players.forEach((player) => {
      const existingStats = this.liveData.playerStats.find(
        (s) => s.playerId === player.id,
      );
      this.playerStats.set(
        player.id,
        existingStats || {
          playerId: player.id,
          gamesPlayed: 0,
          gamesSatOut: 0,
          consecutiveGames: 0,
          partners: {},
          opponents: {},
          gamesOnCourt: {},
          fixedPartnershipGames: 0,
          totalScore: 0,
          totalScoreAgainst: 0,
          lastPartnerId: undefined,
          lastOpponentIds: undefined,
        },
      );
    });

    // Initialize assignment strategy
    if (strategy === "lottery") {
      this.assignmentStrategy = new LotteryPlayerAssignmentStrategy(
        this.activeCourts,
        this.playerStats,
        this.partnershipConstraint,
      );
    } else if (strategy === "fairweight") {
      this.assignmentStrategy = new FairWeightedPlayerAssignmentStrategy(
        this.activeCourts,
        this.playerStats,
        this.partnershipConstraint,
      );
    } else {
      this.assignmentStrategy = new DefaultPlayerAssignmentStrategy(
        this.activeCourts,
        this.playerStats,
        this.partnershipConstraint,
      );
    }
  }

  public setAssignmentStrategy(strategy: PlayerAssignmentStrategy): void {
    this.assignmentStrategy = strategy;
  }

  // This function orchestrates the assignment of players to courts and teams for a new round of pickleball games, considering player fairness, partnership constraints, and court rating requirements.
  //
  // #### High-Level Algorithm:
  //
  // **Step 1: Extract Partnership Constraints**
  // - Processes fixed partnerships from session configuration
  // - Identifies which players must play together vs. flexible players
  // - Creates partnership units with their maximum ratings for court assignment
  //
  // **Step 2: Determine Sitting Players**
  // - Calculates how many players need to sit out based on available courts
  // - When enforcing partnerships, sits out complete partnership units together
  // - Uses fairness scoring prioritizing players who have sat out less and played more
  // - Falls back to individual selection when partnerships aren't enforced
  //
  // **Step 3: Assign Players to Courts**
  // - Sorts courts by minimum rating requirements (highest first)
  // - Places partnership units on appropriate courts based on their maximum rating
  // - Fills remaining slots with flexible players who meet court rating requirements
  // - Ensures rating constraints are respected for both partnerships and individuals
  //
  // **Step 4: Create Team Assignments**
  // - For courts with two partnerships: they become opposing teams
  // - For courts with one partnership: pairs it against two flexible players
  // - For courts with no partnerships: uses either balanced rating teams or diverse partnership combinations
  // - Prioritizes new partner pairings to maximize player variety
  //   - Also want to prioritize new opponents
  //
  // **Step 5: Finalize Results**
  // - Updates sitting out list to include any players who couldn't be assigned due to constraints
  // - Returns structured assignment with court games and sitting players
  // - Includes detailed logging for debugging round generation
  //
  // The algorithm balances multiple competing priorities: partnership enforcement, rating fairness, equal playing time, and partnership diversity, while respecting court capacity and rating restrictions.
  public generateRoundAssignment(sittingOut?: Player[]): RoundAssignment {
    const gameAssignments: GameAssignment[] = [];
    const availablePlayers = [...this.players].filter((player) => {
      return !this.pausedPlayerIds.has(player.id);
    });
    const playersPerRound =
      this.activeCourts.length * APP_CONFIG.MIN_PLAYERS_PER_GAME;

    // Step 1: Extract partnership context
    const partnershipContext: PartnershipContext =
      this.buildPartnershipContext(availablePlayers);

    // Step 2: Determine who sits out (considering partnerships)
    if (!sittingOut) {
      sittingOut = this.assignmentStrategy.selectSittingOutPlayers(
        partnershipContext,
        playersPerRound,
      );
    }
    const sittingOutIds = new Set(sittingOut.map((player) => player.id));
    const playingPlayers = availablePlayers.filter(
      (p) => !sittingOutIds.has(p.id),
    );

    // Step 3: Assign players to courts based on rating requirements and partnerships
    const courtAssignments: Player[][] =
      this.assignmentStrategy.assignPlayersToCourts(
        playingPlayers,
        partnershipContext,
      );

    // Step 4: We now have players assigned to courts.  We need to create teams.
    // Create team assignments for each court (honoring partnerships)
    courtAssignments.forEach((courtPlayers, courtIndex) => {
      if (courtPlayers.length === 4 && courtIndex < this.activeCourts.length) {
        const court = this.activeCourts[courtIndex];

        const teams = this.assignTeamsOnCourt(
          court,
          courtPlayers,
          partnershipContext,
        );

        gameAssignments.push({
          courtId: court.id,
          serveTeam: teams.serveTeam,
          receiveTeam: teams.receiveTeam,
        });
      }
    });

    // Step 5: Update sitting out list to include players who couldn't be assigned to courts
    const assignedPlayerIds = new Set(
      courtAssignments.flat().map((player) => player.id),
    );
    const actualSittingOut = availablePlayers.filter(
      (player) => !assignedPlayerIds.has(player.id),
    );

    const log_for_browser = false; //__DEV__;
    const log_for_console = false;
    if (log_for_console) {
      // console friendly
      console.log(
        `generateRoundAssignment ${this.currentRoundIndex}: ${JSON.stringify(
          {
            playingPlayers,
            sittingOut,
            actualSittingOut,
            partnershipContext,
            courtAssignments,
            gameAssignments,
            assignedPlayerIds,
          },
          undefined,
          2,
        )}`,
      );
    }
    if (log_for_browser) {
      // browser friendly
      console.log(`generateRoundAssignment ${this.currentRoundIndex}:`, {
        playingPlayers,
        sittingOut,
        actualSittingOut,
        partnershipContext,
        courtAssignments,
        gameAssignments,
        assignedPlayerIds,
      });
    }
    return {
      gameAssignments: gameAssignments,
      sittingOutIds: actualSittingOut.map((player) => player.id),
    };
  }

  private buildPartnershipContext(players: Player[]): PartnershipContext {
    const partnerMap = new Map<string, string>(); // maps each partner to the other
    const pairs: Array<{ players: [Player, Player]; maxRating: number }> = [];
    const playerSet = new Set(players.map((p) => p.id));

    if (
      this.partnershipConstraint &&
      this.partnershipConstraint.partnerships.length > 0
    ) {
      // Process active partnerships
      this.partnershipConstraint.partnerships
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

  private assignTeamsOnCourt(
    court: Court,
    players: Player[],
    context: PartnershipContext,
  ): {
    serveTeam: Team;
    receiveTeam: Team;
  } {
    // Check for fixed partnerships in this court
    const playerIds = new Set(players.map((p) => p.id));
    const courtPartnerships = context.pairs.filter((pair) =>
      pair.players.every((player) => playerIds.has(player.id)),
    );

    if (courtPartnerships.length === 2) {
      // Two partnerships - they become opposing teams
      return {
        serveTeam: {
          player1Id: courtPartnerships[0].players[0].id,
          player2Id: courtPartnerships[0].players[1].id,
        },
        receiveTeam: {
          player1Id: courtPartnerships[1].players[0].id,
          player2Id: courtPartnerships[1].players[1].id,
        },
      };
    } else if (courtPartnerships.length === 1) {
      // One partnership + two flexible players
      const partnership = courtPartnerships[0];
      const flexiblePlayers = players.filter(
        (p) => !partnership.players.includes(p),
      );

      return {
        serveTeam: {
          player1Id: partnership.players[0].id,
          player2Id: partnership.players[1].id,
        },
        receiveTeam: {
          player1Id: flexiblePlayers[0].id,
          player2Id: flexiblePlayers[1].id,
        },
      };
    } else {
      // No partnerships
      const allHaveRatings = players.every((p) => p.rating !== undefined);

      if (allHaveRatings && court.minimumRating) {
        return this.createBalancedTeams(players);
      }
      return this.createDiversePartnerTeams(players);
    }
  }

  public updateStatsForRound(games: Game[], results: Results): PlayerStats[] {
    games.forEach((game) => {
      const score = results.scores[game.id];
      this.updatePlayerStatsForGame(game, score || undefined);
    });
    this.updateSittingOutStats(this.currentRound.sittingOutIds);

    const allPlayerStats = this.getPlayerStats();

    // Debug logging
    console.info(
      "Updated player stats:",
      allPlayerStats.map((s) => ({
        playerId: s.playerId,
        gamesPlayed: s.gamesPlayed,
        gamesSatOut: s.gamesSatOut,
        consecutiveGames: s.consecutiveGames,
        partnerships: Object.keys(s.partners).length,
        opponents: Object.keys(s.opponents).length,
        // TODO print out this array:
        //gamesOnCourt:  Object.keys(s.gamesOnCourt).length,
        fixedPartnershipGames: s.fixedPartnershipGames,
      })),
    );
    return allPlayerStats;
  }

  private updatePlayerStatsForGame(game: Game, score?: Score): void {
    const allGamePlayerIds = [
      game.serveTeam.player1Id,
      game.serveTeam.player2Id,
      game.receiveTeam.player1Id,
      game.receiveTeam.player2Id,
    ];

    // Update stats for playing players
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
    if (!this.partnershipConstraint) {
      return false;
    }
    return this.partnershipConstraint.partnerships.some(
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
        const mutableStats = { ...stats };
        mutableStats.gamesSatOut++;
        mutableStats.consecutiveGames = 0;
        this.playerStats.set(playerId, mutableStats);
      } else {
        console.error(
          `updateSittingOutStats: no stats for playerId: ${playerId}`,
        );
      }
    });
  }

  private createBalancedTeams(players: Player[]): {
    serveTeam: Team;
    receiveTeam: Team;
  } {
    // Generate all possible team combinations
    const combinations = this.getAllTeamCombinations(players);
    let bestBalance = {
      difference: Infinity,
      diversityScore: -Infinity,
      teams: null as any,
    };

    combinations.forEach(({ team1, team2 }) => {
      // Calculate rating balance
      const team1Rating = (team1[0].rating! + team1[1].rating!) / 2;
      const team2Rating = (team2[0].rating! + team2[1].rating!) / 2;
      const ratingDifference = Math.abs(team1Rating - team2Rating);

      // Calculate partner diversity score (higher is better)
      const diversityScore =
        this.getPlayedWithScore(team1[0], team1[1]) +
        this.getPlayedWithScore(team2[0], team2[1]);

      // Prefer rating balance, but use diversity as tiebreaker
      const isBetter =
        ratingDifference < bestBalance.difference ||
        (ratingDifference === bestBalance.difference &&
          diversityScore > bestBalance.diversityScore);

      if (isBetter) {
        bestBalance = {
          difference: ratingDifference,
          diversityScore,
          teams: { team1, team2 },
        };
      }
    });

    return {
      serveTeam: {
        player1Id: bestBalance.teams.team1[0].id,
        player2Id: bestBalance.teams.team1[1].id,
      },
      receiveTeam: {
        player1Id: bestBalance.teams.team2[0].id,
        player2Id: bestBalance.teams.team2[1].id,
      },
    };
  }

  // This is post court assignment. We're just dividing up the players into two teams.
  private createDiversePartnerTeams(players: Player[]): {
    serveTeam: Team;
    receiveTeam: Team;
  } {
    // Find the combination with the highest diversity score
    const combinations = this.getAllTeamCombinations(players);
    let bestDiversity = { score: -Infinity, teams: null as any };

    combinations.forEach(({ team1, team2 }) => {
      // Calculate diversity score (negative partnership counts, so higher is better)
      const team1Score = this.getPlayedWithScore(team1[0], team1[1]);
      const team2Score = this.getPlayedWithScore(team2[0], team2[1]);
      const totalScore = team1Score + team2Score;

      if (totalScore > bestDiversity.score) {
        bestDiversity = { score: totalScore, teams: { team1, team2 } };
      }
    });

    return {
      serveTeam: {
        player1Id: bestDiversity.teams.team1[0].id,
        player2Id: bestDiversity.teams.team1[1].id,
      },
      receiveTeam: {
        player1Id: bestDiversity.teams.team2[0].id,
        player2Id: bestDiversity.teams.team2[1].id,
      },
    };
  }

  private getAllTeamCombinations(players: Player[]): Array<{
    team1: Player[];
    team2: Player[];
  }> {
    const combinations = [];

    // Generate all possible partnerships for team 1
    for (let i = 0; i < players.length - 1; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const team1 = [players[i], players[j]];
        const remaining = players.filter(
          (_, index) => index !== i && index !== j,
        );
        if (remaining.length >= 2) {
          const team2 = [remaining[0], remaining[1]];
          combinations.push({
            team1: team1,
            team2: team2,
          });
        }
      }
    }
    return combinations;
  }

  private getPlayedWithScore(player1: Player, player2: Player): number {
    const stats1 = this.playerStats.get(player1.id)!;
    const timesPartnered = stats1.partners[player2.id] || 0;
    // Return negative score so that fewer partnerships = higher score for diversity
    return -timesPartnered;
  }

  private getPlayedAgainstScore(player1: Player, player2: Player): number {
    const stats1 = this.playerStats.get(player1.id)!;
    const timesOpposed = stats1.opponents[player2.id] || 0;
    // Return negative score so that fewer times opposed = higher score for diversity
    return -timesOpposed;
  }

  private getTeammateId(game: Game, playerId: string): string | null {
    // Determine which team the player is on and return their teammate ID
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
    // Determine which team the player is on and return the opposing team's player IDs
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
