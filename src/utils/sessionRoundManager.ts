import { Player, Game, PlayerStats, Court } from '../types';

export interface GameAssignment {
  court: Court;
  serveTeam: [Player, Player];
  receiveTeam: [Player, Player];
  sittingOut: Player[];
}

export interface TeamBalance {
  team1Rating: number;
  team2Rating: number;
  difference: number;
}

export class SessionRoundManager {
  private players: Player[];
  private courts: Court[];
  private playerStats: Map<string, PlayerStats>;

  constructor(players: Player[], courts: Court[], existingStats?: PlayerStats[]) {
    this.players = players;
    this.courts = courts.filter(c => c.isActive);
    this.playerStats = new Map();

    // Initialize or load existing stats
    players.forEach(player => {
      const existing = existingStats?.find(s => s.playerId === player.id);
      this.playerStats.set(player.id, existing || {
        playerId: player.id,
        gamesPlayed: 0,
        gamesSatOut: 0,
        partners: {},
        totalScore: 0,
      });
    });
  }

  generateGameAssignments(gameNumber: number): GameAssignment[] {
    const assignments: GameAssignment[] = [];
    const availablePlayers = [...this.players];
    const playersPerGame = this.courts.length * 4;

    // Step 1: Determine who sits out (Equal playing time - Priority #2)
    const sittingOut = this.selectSittingOutPlayers(availablePlayers, playersPerGame);
    const playingPlayers = availablePlayers.filter(p => !sittingOut.includes(p));

    // Step 2: Assign players to courts based on rating requirements (Priority #1)
    const courtAssignments = this.assignPlayersToCourts(playingPlayers);

    // Step 3: Create team assignments for each court (Partner diversity - Priority #3)
    courtAssignments.forEach((courtPlayers, courtIndex) => {
      if (courtPlayers.length === 4 && courtIndex < this.courts.length) {
        const court = this.courts[courtIndex];
        const teams = this.assignTeamsForCourt(courtPlayers, court);

        assignments.push({
          court,
          serveTeam: teams.serveTeam,
          receiveTeam: teams.receiveTeam,
          sittingOut: courtIndex === 0 ? sittingOut : [], // Only include sitting out once
        });
      }
    });

    return assignments;
  }

  private selectSittingOutPlayers(players: Player[], neededPlayers: number): Player[] {
    if (players.length <= neededPlayers) return [];

    const sittingOutCount = players.length - neededPlayers;

    // Sort by: 1) sit-out count (ascending), 2) games played (descending)
    const playersSortedBySitOuts = players.sort((a, b) => {
      const aStats = this.playerStats.get(a.id)!;
      const bStats = this.playerStats.get(b.id)!;

      // Primary: least sit-outs first
      if (aStats.gamesSatOut !== bStats.gamesSatOut) {
        return aStats.gamesSatOut - bStats.gamesSatOut;
      }

      // Secondary: most games played first (so they sit out to balance)
      if (bStats.gamesPlayed !== aStats.gamesPlayed) {
        return bStats.gamesPlayed - aStats.gamesPlayed;
      }

      // Tertiary: alphabetical for consistency
      return a.name.localeCompare(b.name);
    });

    return playersSortedBySitOuts.slice(0, sittingOutCount);
  }

  private assignPlayersToCourts(playingPlayers: Player[]): Player[][] {
    const courtAssignments: Player[][] = Array(this.courts.length).fill(null).map(() => []);
    const remainingPlayers = [...playingPlayers];

    // TODO: it looks to me that we'll have to sort the courts by minimum
    // rating first, so that higher rating players get selected for higher
    // courts first.

    // Step 1: Assign players to courts with rating requirements first
    this.courts.forEach((court, courtIndex) => {
      if (court.minimumRating && remainingPlayers.length >= 4) {
        // Get players who meet the rating requirement
        const eligiblePlayers = remainingPlayers.filter(player =>
          player.rating && player.rating >= court.minimumRating!
        );

        if (eligiblePlayers.length >= 4) {
          // Sort by rating (highest first for balanced distribution)
          eligiblePlayers.sort((a, b) => (b.rating || 0) - (a.rating || 0));

          // Take 4 players for this court
          const courtPlayers = eligiblePlayers.slice(0, 4);
          courtAssignments[courtIndex] = courtPlayers;

          // Remove assigned players from remaining pool
          courtPlayers.forEach(player => {
            const index = remainingPlayers.indexOf(player);
            if (index > -1) remainingPlayers.splice(index, 1);
          });
        }
      }
    });

    // Step 2: Assign remaining players to unfilled courts
    let playerIndex = 0;
    this.courts.forEach((court, courtIndex) => {
      while (courtAssignments[courtIndex].length < 4 && playerIndex < remainingPlayers.length) {
        courtAssignments[courtIndex].push(remainingPlayers[playerIndex]);
        playerIndex++;
      }
    });

    return courtAssignments;
  }

  private assignTeamsForCourt(players: Player[], court: Court): {
    serveTeam: [Player, Player];
    receiveTeam: [Player, Player];
  } {
    // If we have ratings for all players, try to balance teams
    const allHaveRatings = players.every(p => p.rating !== undefined);

    if (allHaveRatings && court.minimumRating) {
      return this.createBalancedTeams(players);
    }

    // Otherwise, prioritize partner diversity
    return this.createDiversePartnerTeams(players);
  }

  private createBalancedTeams(players: Player[]): {
    serveTeam: [Player, Player];
    receiveTeam: [Player, Player];
  } {
    // Generate all possible team combinations
    const combinations = this.getAllTeamCombinations(players);
    let bestBalance = {
      difference: Infinity,
      diversityScore: -Infinity,
      teams: null as any
    };

    combinations.forEach(({ team1, team2 }) => {
      // Calculate rating balance
      const team1Rating = (team1[0].rating! + team1[1].rating!) / 2;
      const team2Rating = (team2[0].rating! + team2[1].rating!) / 2;
      const ratingDifference = Math.abs(team1Rating - team2Rating);

      // Calculate partner diversity score (higher is better)
      const diversityScore = this.getPartnershipScore(team1[0], team1[1]) +
                            this.getPartnershipScore(team2[0], team2[1]);

      // Prefer rating balance, but use diversity as tiebreaker
      const isBetter = ratingDifference < bestBalance.difference ||
                      (ratingDifference === bestBalance.difference && diversityScore > bestBalance.diversityScore);

      if (isBetter) {
        bestBalance = {
          difference: ratingDifference,
          diversityScore,
          teams: { team1, team2 }
        };
      }
    });

    return {
      serveTeam: [bestBalance.teams.team1[0], bestBalance.teams.team1[1]],
      receiveTeam: [bestBalance.teams.team2[0], bestBalance.teams.team2[1]],
    };
  }

  private createDiversePartnerTeams(players: Player[]): {
    serveTeam: [Player, Player];
    receiveTeam: [Player, Player];
  } {
    // Find the combination with the highest diversity score
    const combinations = this.getAllTeamCombinations(players);
    let bestDiversity = { score: -Infinity, teams: null as any };

    combinations.forEach(({ team1, team2 }) => {
      // Calculate diversity score (negative partnership counts, so higher is better)
      const team1Score = this.getPartnershipScore(team1[0], team1[1]);
      const team2Score = this.getPartnershipScore(team2[0], team2[1]);
      const totalScore = team1Score + team2Score;

      if (totalScore > bestDiversity.score) {
        bestDiversity = { score: totalScore, teams: { team1, team2 } };
      }
    });

    return {
      serveTeam: [bestDiversity.teams.team1[0], bestDiversity.teams.team1[1]],
      receiveTeam: [bestDiversity.teams.team2[0], bestDiversity.teams.team2[1]],
    };
  }

  private getAllTeamCombinations(players: Player[]): Array<{
    team1: [Player, Player];
    team2: [Player, Player];
  }> {
    const combinations = [];

    // Generate all possible partnerships for team 1
    for (let i = 0; i < players.length - 1; i++) {
      for (let j = i + 1; j < players.length; j++) {
        const team1 = [players[i], players[j]];
        const remaining = players.filter((_, index) => index !== i && index !== j);

        if (remaining.length >= 2) {
          const team2 = [remaining[0], remaining[1]];
          combinations.push({
            team1: team1 as [Player, Player],
            team2: team2 as [Player, Player]
          });
        }
      }
    }

    return combinations;
  }

  private getPartnershipScore(player1: Player, player2: Player): number {
    const stats1 = this.playerStats.get(player1.id)!;
    const timesPartnered = stats1.partners[player2.id] || 0;
    // Return negative score so that fewer partnerships = higher score for diversity
    return -timesPartnered;
  }

  updatePlayerStatsForGame(game: Game, score?: { serveScore: number; receiveScore: number }): void {
    const allGamePlayerIds = [
      game.serveTeam.player1Id,
      game.serveTeam.player2Id,
      game.receiveTeam.player1Id,
      game.receiveTeam.player2Id,
    ];

    // Update stats for playing players
    allGamePlayerIds.forEach(playerId => {
      const stats = this.playerStats.get(playerId);

      if (!stats) {
        console.warn(`No stats found for player ${playerId}`);
        return;
      }

      const mutableStats = {
        ...stats,
        partners: { ...stats.partners }
      };
      mutableStats.gamesPlayed++;

      // Update partnership counts - only with actual teammate
      const teammateId = this.getTeammateId(game, playerId);
      if (teammateId) {
        mutableStats.partners[teammateId] = (mutableStats.partners[teammateId] || 0) + 1;
      }

      // Update score if provided
      if (score) {
        const playerScore = this.getPlayerScore(game, playerId, score);
        mutableStats.totalScore += playerScore;
      }
      this.playerStats.set(playerId, mutableStats);
    });

    // Update sit-out stats
    game.sittingOutIds.forEach(playerId => {
      const stats = this.playerStats.get(playerId);
      if (stats) {
        const mutableStats = { ...stats };
        mutableStats.gamesSatOut++;
        this.playerStats.set(playerId, mutableStats);
      }
    });

    // Debug logging
    console.log('Updated player stats:', this.getPlayerStats().map(s => ({
      playerId: s.playerId,
      gamesPlayed: s.gamesPlayed,
      gamesSatOut: s.gamesSatOut,
      partnerships: Object.keys(s.partners).length
    })));
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

  private getPlayerScore(game: Game, playerId: string, score: { serveScore: number; receiveScore: number }): number {
    const isOnServeTeam = game.serveTeam.player1Id === playerId || game.serveTeam.player2Id === playerId;
    return isOnServeTeam ? score.serveScore : score.receiveScore;
  }

  // This is the key method - it returns the current stats
  getPlayerStats(): PlayerStats[] {
    return Array.from(this.playerStats.values());
  }

  // Method to sync stats from external source (Redux store)
  syncPlayerStats(externalStats: PlayerStats[]): void {
    externalStats.forEach(stats => {
      this.playerStats.set(stats.playerId, { ...stats });
    });
  }

  getTeamBalance(team1: Player[], team2: Player[]): TeamBalance | null {
    if (!team1.every(p => p.rating) || !team2.every(p => p.rating)) {
      return null;
    }

    const team1Rating = team1.reduce((sum, p) => sum + p.rating!, 0) / team1.length;
    const team2Rating = team2.reduce((sum, p) => sum + p.rating!, 0) / team2.length;

    return {
      team1Rating,
      team2Rating,
      difference: Math.abs(team1Rating - team2Rating),
    };
  }

  // Statistical methods for analysis
  getSessionStats(): {
    totalGames: number;
    averageGamesPerPlayer: number;
    averageSitOutsPerPlayer: number;
    mostActivePlayer: string | null;
    fairnessScore: number; // 0-1, where 1 is perfectly fair
  } {
    const stats = this.getPlayerStats();
    const totalGames = Math.max(...stats.map(s => s.gamesPlayed + s.gamesSatOut), 0);
    const averageGamesPerPlayer = stats.length > 0
      ? stats.reduce((sum, s) => sum + s.gamesPlayed, 0) / stats.length
      : 0;
    const averageSitOutsPerPlayer = stats.length > 0
      ? stats.reduce((sum, s) => sum + s.gamesSatOut, 0) / stats.length
      : 0;

    // Find most active player
    const mostActive = stats.reduce((max, current) =>
      current.gamesPlayed > max.gamesPlayed ? current : max,
      stats[0] || { gamesPlayed: 0, playerId: null }
    );

    // Calculate fairness score based on standard deviation of games played
    const gamesPlayedArray = stats.map(s => s.gamesPlayed);
    const mean = averageGamesPerPlayer;
    const variance = gamesPlayedArray.length > 0
      ? gamesPlayedArray.reduce((sum, games) => sum + Math.pow(games - mean, 2), 0) / gamesPlayedArray.length
      : 0;
    const stdDev = Math.sqrt(variance);

    // Fairness score: closer to 0 standard deviation = closer to 1 fairness
    const fairnessScore = Math.max(0, 1 - (stdDev / (mean || 1)));

    return {
      totalGames,
      averageGamesPerPlayer,
      averageSitOutsPerPlayer,
      mostActivePlayer: mostActive.playerId,
      fairnessScore,
    };
  }

  // Debugging and validation methods
  validateAssignments(assignments: GameAssignment[]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const allAssignedPlayerIds = new Set<string>();

    assignments.forEach((assignment, index) => {
      // Check that each court has exactly 4 players
      const courtPlayerIds = [
        ...Object.values(assignment.serveTeam),
        ...Object.values(assignment.receiveTeam)
      ].map(p => p.id);

      if (courtPlayerIds.length !== 4) {
        errors.push(`Court ${index + 1} has ${courtPlayerIds.length} players instead of 4`);
      }

      // Check for duplicate players across courts
      courtPlayerIds.forEach(playerId => {
        if (allAssignedPlayerIds.has(playerId)) {
          errors.push(`Player ${playerId} is assigned to multiple courts`);
        }
        allAssignedPlayerIds.add(playerId);
      });

      // Check court rating requirements
      if (assignment.court.minimumRating) {
        const playersWithLowRating = [
          ...Object.values(assignment.serveTeam),
          ...Object.values(assignment.receiveTeam)
        ].filter(player => !player.rating || player.rating < assignment.court.minimumRating!);

        if (playersWithLowRating.length > 0) {
          errors.push(`Court ${index + 1} has players below minimum rating requirement`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
