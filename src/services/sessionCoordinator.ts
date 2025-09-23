import {
  Court,
  FixedPartnership,
  Game,
  GameAssignment,
  PartnershipConstraint,
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

interface PartnershipUnit {
  players: [Player, Player];
  partnership: FixedPartnership;
  maxRating: number; // Higher of the two player ratings
}

interface PartnershipConstraints {
  fixedPairs: Map<string, string>; // playerId -> partnerId
  flexiblePlayers: Player[];
  partnershipUnits: PartnershipUnit[];
}

export class SessionCoordinator {
  private activeCourts: Court[];
  private players: Player[];
  private pausedPlayerIds: Set<string>;
  private playerStats: Map<string, PlayerStats> = new Map();
  private liveData: NonNullable<Session["liveData"]>;
  private currentRound: Round;
  private currentRoundIndex: number;
  private partnershipConstraint?: PartnershipConstraint;

  constructor(session: Session, players: Player[], pausedPlayers: Player[]) {
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
    this.currentRoundIndex = this.liveData.rounds.length;
    this.currentRound = this.liveData.rounds[this.currentRoundIndex - 1];

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
          partners: {},
          fixedPartnershipGames: 0,
          totalScore: 0,
          totalScoreAgainst: 0,
        },
      );
    });
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

    // Step 1: Extract partnership constraints
    const partnershipConstraints =
      this.extractPartnershipConstraints(availablePlayers);

    // Step 2: Determine who sits out (considering partnerships)
    if (!sittingOut) {
      sittingOut = this.selectSittingOutPlayersWithPartnerships(
        partnershipConstraints,
        playersPerRound,
      );
    }

    const sittingOutIds = new Set(sittingOut.map(player => player.id));
    const playingPlayers = availablePlayers.filter(
      (p) => !sittingOutIds.has(p.id),
    );

    // Step 3: Assign players to courts based on rating requirements and partnerships
    const courtAssignments: Player[][] =
      this.assignPlayersToCourtsWithPartnerships(
        playingPlayers,
        partnershipConstraints,
      );

    // Step 4: Create team assignments for each court (honoring partnerships)
    courtAssignments.forEach((courtPlayers, courtIndex) => {
      if (courtPlayers.length === 4 && courtIndex < this.activeCourts.length) {
        const court = this.activeCourts[courtIndex];
        const teams = this.assignTeamsForCourtWithPartnerships(
          courtPlayers,
          court,
          partnershipConstraints,
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

    const log_for_browser = true; //__DEV__;
    const log_for_console = false;
    if (log_for_console) {
      // console friendly
      console.log(
        `generateRoundAssignment ${this.currentRoundIndex}: ${JSON.stringify(
          {
            playingPlayers,
            sittingOut,
            actualSittingOut,
            partnershipConstraints,
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
        partnershipConstraints,
        courtAssignments,
        gameAssignments,
        assignedPlayerIds,
      });
    }
    return {
      roundIndex: this.currentRoundIndex,
      gameAssignments: gameAssignments,
      sittingOutIds: actualSittingOut.map((player) => player.id),
    };
  }

  private extractPartnershipConstraints(
    players: Player[],
  ): PartnershipConstraints {
    const fixedPairs = new Map<string, string>(); // maps each partner to the other
    const partnershipUnits: PartnershipUnit[] = [];
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
              // map each partner to the other
              fixedPairs.set(partnership.player1Id, partnership.player2Id);
              fixedPairs.set(partnership.player2Id, partnership.player1Id);

              const maxRating = Math.max(
                player1.rating || 0,
                player2.rating || 0,
              );

              partnershipUnits.push({
                players: [player1, player2],
                partnership,
                maxRating,
              });
            } else {
              // very unexpected
              const partnershipInfo = partnership.name
                ? partnership.name
                : `${partnership.player1Id} / ${partnership.player2Id}`;
              Alert.alert(
                "Error",
                `Partnership has invalid data: ${partnershipInfo}`,
              );
            }
          }
        });
    }

    const flexiblePlayers = players.filter((p) => !fixedPairs.has(p.id));

    return {
      fixedPairs,
      flexiblePlayers,
      partnershipUnits,
    };
  }

  private selectSittingOutPlayersWithPartnerships(
    constraints: PartnershipConstraints,
    numPlaying: number,
  ): Player[] {
    const totalPlayers =
      constraints.flexiblePlayers.length +
      constraints.partnershipUnits.length * 2;

    if (totalPlayers <= numPlaying) {
      return [];
    }
    const sittingOutCount = totalPlayers - numPlaying;

    // Step 1: Calculate fairness scores for all players
    const allPlayers = [
      ...constraints.flexiblePlayers,
      ...constraints.partnershipUnits.flatMap((unit) => unit.players),
    ];

    const playerScores = allPlayers.map((player) => {
      const stats = this.playerStats.get(player.id)!;
      const fairnessScore = stats.gamesSatOut - stats.gamesPlayed;
      return { player, fairnessScore };
    });

    // Step 2: Group players by fairness score
    const scoreGroups = new Map<
      number,
      { player: Player; fairnessScore: number }[]
    >();
    playerScores.forEach((playerScore) => {
      const group = scoreGroups.get(playerScore.fairnessScore) || [];
      group.push(playerScore);
      scoreGroups.set(playerScore.fairnessScore, group);
    });

    // Step 3: Process each fairness score group (lowest to highest priority)
    const sortedScores = Array.from(scoreGroups.keys()).sort((a, b) => a - b);
    const selectedPlayers: Player[] = [];
    const selectionOrder: Player[] = []; // Track order for priority removal

    for (const score of sortedScores) {
      if (selectedPlayers.length >= sittingOutCount) break;

      const group = scoreGroups.get(score)!;
      const remainingNeeded = sittingOutCount - selectedPlayers.length;

      // Separate partnered vs non-partnered players in this group
      const partneredPlayers = group.filter((ps) =>
        constraints.fixedPairs.has(ps.player.id),
      );
      const nonPartneredPlayers = group.filter(
        (ps) => !constraints.fixedPairs.has(ps.player.id),
      );

      // Run weighted lottery within this group
      const lotteryResults = this.runWeightedLottery(
        partneredPlayers.map((ps) => ps.player),
        nonPartneredPlayers.map((ps) => ps.player),
        remainingNeeded,
        constraints.fixedPairs,
      );

      selectedPlayers.push(...lotteryResults.selected);
      selectionOrder.push(...lotteryResults.selectionOrder);
    }

    // Step 4: Handle excess players due to partnership enforcement
    if (selectedPlayers.length > sittingOutCount) {
      const excess = selectedPlayers.length - sittingOutCount;

      if (this.partnershipConstraint?.enforceAllPairings) {
        // Can't break partnerships, so we'll sit out extra players
        // This is acceptable as per requirements
      } else {
        // Can break partnerships if needed
        const playersToRemove = this.selectPlayersToRemove(
          selectedPlayers,
          selectionOrder,
          excess,
          constraints.fixedPairs,
        );

        playersToRemove.forEach((player) => {
          const index = selectedPlayers.indexOf(player);
          if (index > -1) selectedPlayers.splice(index, 1);
        });
      }
    }

    return selectedPlayers;
  }

  private runWeightedLottery(
    partneredPlayers: Player[],
    nonPartneredPlayers: Player[],
    maxSelections: number,
    fixedPairs: Map<string, string>,
  ): { selected: Player[]; selectionOrder: Player[] } {
    const selected: Player[] = [];
    const selectionOrder: Player[] = [];
    const availablePartnered = [...partneredPlayers];
    const availableNonPartnered = [...nonPartneredPlayers];

    while (
      selected.length < maxSelections &&
      (availablePartnered.length > 0 || availableNonPartnered.length > 0)
    ) {
      // Create weighted pool
      const weightedPool: {
        player: Player;
        weight: number;
        isPartnered: boolean;
      }[] = [];

      // Add non-partnered players with weight 2
      availableNonPartnered.forEach((player) => {
        weightedPool.push({ player, weight: 2, isPartnered: false });
      });

      // Add partnered players with weight 1
      availablePartnered.forEach((player) => {
        weightedPool.push({ player, weight: 1, isPartnered: true });
      });

      if (weightedPool.length === 0) break;

      // Calculate total weight
      const totalWeight = weightedPool.reduce(
        (sum, item) => sum + item.weight,
        0,
      );

      // Select random player based on weights
      let random = Math.random() * totalWeight;
      let selectedItem = weightedPool[0];

      for (const item of weightedPool) {
        random -= item.weight;
        if (random <= 0) {
          selectedItem = item;
          break;
        }
      }

      const selectedPlayer = selectedItem.player;
      selected.push(selectedPlayer);
      selectionOrder.push(selectedPlayer);

      // Remove selected player from available pools
      if (selectedItem.isPartnered) {
        const partnerIndex = availablePartnered.indexOf(selectedPlayer);
        if (partnerIndex > -1) availablePartnered.splice(partnerIndex, 1);

        // Auto-add partner if enforcing partnerships or if partner is also in this score group
        const partnerId = fixedPairs.get(selectedPlayer.id);
        if (partnerId) {
          const partner = availablePartnered.find((p) => p.id === partnerId);
          if (partner) {
            selected.push(partner);
            selectionOrder.push(partner);
            const partnerIndexInAvailable = availablePartnered.indexOf(partner);
            if (partnerIndexInAvailable > -1)
              availablePartnered.splice(partnerIndexInAvailable, 1);
          }
        }
      } else {
        const nonPartnerIndex = availableNonPartnered.indexOf(selectedPlayer);
        if (nonPartnerIndex > -1)
          availableNonPartnered.splice(nonPartnerIndex, 1);
      }
    }

    return { selected, selectionOrder };
  }

  private selectPlayersToRemove(
    selectedPlayers: Player[],
    selectionOrder: Player[],
    excessCount: number,
    fixedPairs: Map<string, string>,
  ): Player[] {
    const toRemove: Player[] = [];
    const reverseOrder = [...selectionOrder].reverse();

    for (const player of reverseOrder) {
      if (toRemove.length >= excessCount) break;

      // Check if this player is still in selected list and not already marked for removal
      if (selectedPlayers.includes(player) && !toRemove.includes(player)) {
        const partnerId = fixedPairs.get(player.id);

        if (partnerId) {
          // This is a partnered player
          const partner = selectedPlayers.find((p) => p.id === partnerId);

          if (this.partnershipConstraint?.enforceAllPairings) {
            // Can't break partnership, skip this player
            continue;
          } else {
            // Can break partnership - remove just this player
            toRemove.push(player);
          }
        } else {
          // Non-partnered player, safe to remove
          toRemove.push(player);
        }
      }
    }

    return toRemove;
  }

  private assignPlayersToCourtsWithPartnerships(
    playingPlayers: Player[],
    constraints: PartnershipConstraints,
  ): Player[][] {
    const courtAssignments: Player[][] = Array(this.activeCourts.length)
      .fill(null)
      .map(() => []);

    // Filter partnership units to only include those where both players are playing
    const playingPlayerIds = new Set(playingPlayers.map((p) => p.id));
    const playingPartnershipUnits = constraints.partnershipUnits.filter(
      (unit) => unit.players.every((player) => playingPlayerIds.has(player.id)),
    );

    const flexiblePlayingPlayers = constraints.flexiblePlayers.filter(
      (player) => playingPlayerIds.has(player.id),
    );

    let remainingFlexiblePlayers = this.shuffleArray(flexiblePlayingPlayers);

    // Sort courts by minimum rating (highest first) to assign partnerships appropriately
    const sortedCourts = [...this.activeCourts]
      .map((court, index) => ({ court, index }))
      .sort(
        (a, b) => (b.court.minimumRating || 0) - (a.court.minimumRating || 0),
      );

    // Step 1: Assign partnership units to courts
    const remainingUnits = [...playingPartnershipUnits];
    //const remainingUnits = this.shuffleArray(playingPartnershipUnits);

    for (const { court, index: courtIndex } of sortedCourts) {
      if (remainingUnits.length === 0) break;
      if (courtAssignments[courtIndex].length >= 4) continue;

      // Find partnerships that can play on this court
      const eligibleUnits = remainingUnits.filter((unit) => {
        if (!court.minimumRating) return true;
        return unit.maxRating >= court.minimumRating;
      });

      if (eligibleUnits.length > 0) {
        // Take the first eligible partnership
        const selectedUnit = eligibleUnits[0];
        courtAssignments[courtIndex].push(...selectedUnit.players);

        // Remove from remaining units
        const unitIndex = remainingUnits.indexOf(selectedUnit);
        remainingUnits.splice(unitIndex, 1);
      }
    }

    // Step 2: Handle remaining partnership units that couldn't be placed due to rating constraints
    // These partnerships will sit out together
    const unplacedPartnershipPlayers = remainingUnits.flatMap(
      (unit) => unit.players,
    );

    // Add unplaced partnership players back to flexible pool if not enforcing all pairings
    if (
      !this.partnershipConstraint?.enforceAllPairings &&
      unplacedPartnershipPlayers.length > 0
    ) {
      remainingFlexiblePlayers.push(...unplacedPartnershipPlayers);
      remainingFlexiblePlayers = this.shuffleArray(remainingFlexiblePlayers);
    }

    // Step 3: Fill remaining court slots with flexible players (FIXED: Respect rating constraints)
    for (const { court, index: courtIndex } of sortedCourts) {
      const slotsNeeded = 4 - courtAssignments[courtIndex].length;
      if (slotsNeeded <= 0) continue;

      if (court.minimumRating) {
        // Get players who meet the rating requirement
        const eligiblePlayers = remainingFlexiblePlayers.filter(
          (player) => player.rating && player.rating >= court.minimumRating!,
        );

        // Sort by rating (highest first for balanced distribution)
        eligiblePlayers.sort((a, b) => (b.rating || 0) - (a.rating || 0));

        let assigned = 0;
        while (
          courtAssignments[courtIndex].length < 4 &&
          assigned < eligiblePlayers.length &&
          assigned < slotsNeeded
        ) {
          const player = eligiblePlayers[assigned];
          courtAssignments[courtIndex].push(player);

          // Remove from remaining pool
          const index = remainingFlexiblePlayers.indexOf(player);
          if (index > -1) remainingFlexiblePlayers.splice(index, 1);
          assigned++;
        }
      } else {
        // No rating requirement - assign any remaining players
        let assigned = 0;
        while (
          courtAssignments[courtIndex].length < 4 &&
          assigned < remainingFlexiblePlayers.length &&
          assigned < slotsNeeded
        ) {
          courtAssignments[courtIndex].push(remainingFlexiblePlayers[assigned]);
          assigned++;
        }
        // Remove assigned players from remaining pool
        remainingFlexiblePlayers.splice(0, assigned);
      }
    }

    // Step 4: Remove courts with insufficient players
    return courtAssignments.filter(
      (court) => court.length >= APP_CONFIG.MIN_PLAYERS_PER_GAME,
    );
  }

  private assignTeamsForCourtWithPartnerships(
    players: Player[],
    court: Court,
    constraints: PartnershipConstraints,
  ): {
    serveTeam: Team;
    receiveTeam: Team;
  } {
    // Check for fixed partnerships in this court
    const playerIds = new Set(players.map((p) => p.id));
    const courtPartnerships = constraints.partnershipUnits.filter((unit) =>
      unit.players.every((player) => playerIds.has(player.id)),
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
        partnerships: Object.keys(s.partners).length,
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
      };
      mutableStats.gamesPlayed++;

      // Update partnership counts - only with actual teammate
      const teammateId = this.getTeammateId(game, playerId);
      if (teammateId) {
        mutableStats.partners[teammateId] =
          (mutableStats.partners[teammateId] || 0) + 1;

        // Check if this was a fixed partnership game
        if (this.isFixedPartnership(playerId, teammateId)) {
          mutableStats.fixedPartnershipGames++;
        }
      }

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
        this.playerStats.set(playerId, mutableStats);
      } else {
        console.error(`updateSittingOutStats: no stats for playerId: ${playerId}`)
      }
    });
  }

  private selectSittingOutPlayers(
    players: Player[],
    numPlaying: number,
  ): Player[] {
    if (players.length <= numPlaying) {
      return [];
    }
    const sittingOutCount = players.length - numPlaying;
    const randomPlayers = this.shuffleArray(players);

    // Sort by: 1) sit-out count (ascending), 2) games played (descending)
    const playersSortedBySitOuts = randomPlayers.sort((a, b) => {
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

  // Fisher-Yates shuffle algorithm
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
        this.getPartnershipScore(team1[0], team1[1]) +
        this.getPartnershipScore(team2[0], team2[1]);

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

  private createDiversePartnerTeams(players: Player[]): {
    serveTeam: Team;
    receiveTeam: Team;
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

  private getPartnershipScore(player1: Player, player2: Player): number {
    const stats1 = this.playerStats.get(player1.id)!;
    const timesPartnered = stats1.partners[player2.id] || 0;
    // Return negative score so that fewer partnerships = higher score for diversity
    return -timesPartnered;
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
