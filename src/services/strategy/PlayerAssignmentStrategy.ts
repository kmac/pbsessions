import { Player, Court, PlayerStats, PartnershipConstraint } from "@/src/types";
import { APP_CONFIG } from "../../constants";

export interface PartnershipConstraints {
  fixedPairs: Map<string, string>; // playerId -> partnerId
  flexiblePlayers: Player[];
  partnershipUnits: PartnershipUnit[];
}

export interface PartnershipUnit {
  players: [Player, Player];
  partnership: any; // FixedPartnership type
  maxRating: number; // Higher of the two player ratings
}

export abstract class PlayerAssignmentStrategy {
  protected activeCourts: Court[];
  protected playerStats: Map<string, PlayerStats>;
  protected partnershipConstraint?: PartnershipConstraint;

  constructor(
    activeCourts: Court[],
    playerStats: Map<string, PlayerStats>,
    partnershipConstraint?: PartnershipConstraint,
  ) {
    this.activeCourts = activeCourts;
    this.playerStats = playerStats;
    this.partnershipConstraint = partnershipConstraint;
  }

  abstract selectSittingOutPlayersWithPartnerships(
    constraints: PartnershipConstraints,
    numPlaying: number,
  ): Player[];

  abstract assignPlayersToCourtsWithPartnerships(
    playingPlayers: Player[],
    constraints: PartnershipConstraints,
  ): Player[][];

  // Utility methods that strategies can use
  protected shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  protected selectSittingOutPlayers(
    players: Player[],
    numPlaying: number,
  ): Player[] {
    if (players.length <= numPlaying) {
      return [];
    }
    const sittingOutCount = players.length - numPlaying;

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

      // Tertiary: most consecutive games played
      if (bStats.consecutiveGames !== aStats.consecutiveGames) {
        return bStats.consecutiveGames - aStats.consecutiveGames;
      }
      // Tiebreak: random for fairness when stats are identical
      return Math.random() - 0.5;
    });

    // select the exact number of players to sit out
    return playersSortedBySitOuts.slice(0, sittingOutCount);
  }
}

export class DefaultPlayerAssignmentStrategy extends PlayerAssignmentStrategy {
  public selectSittingOutPlayersWithPartnerships(
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
    const sittingOut: Player[] = [];

    // If enforcing partnerships, we need to sit out in units
    if (
      this.partnershipConstraint &&
      this.partnershipConstraint.partnerships.length > 0 &&
      this.partnershipConstraint.enforceAllPairings
    ) {
      // Calculate how many partnership units need to sit out
      const partnershipUnitsToSitOut = Math.floor(sittingOutCount / 2);
      const remainingSittingOut = sittingOutCount % 2;

      // Sort partnership units by combined sit-out count and games played
      const sortedUnits = [...constraints.partnershipUnits].sort((a, b) => {
        const aStats1 = this.playerStats.get(a.players[0].id)!;
        const aStats2 = this.playerStats.get(a.players[1].id)!;
        const bStats1 = this.playerStats.get(b.players[0].id)!;
        const bStats2 = this.playerStats.get(b.players[1].id)!;

        const aTotalSitOuts = aStats1.gamesSatOut + aStats2.gamesSatOut;
        const bTotalSitOuts = bStats1.gamesSatOut + bStats2.gamesSatOut;

        if (aTotalSitOuts !== bTotalSitOuts) {
          return aTotalSitOuts - bTotalSitOuts;
        }

        const aTotalGames = aStats1.gamesPlayed + aStats2.gamesPlayed;
        const bTotalGames = bStats1.gamesPlayed + bStats2.gamesPlayed;

        return bTotalGames - aTotalGames;
      });

      // Sit out partnership units
      for (let i = 0; i < partnershipUnitsToSitOut; i++) {
        sittingOut.push(...sortedUnits[i].players);
      }

      // Handle remaining individual flexible players
      if (remainingSittingOut > 0) {
        const flexibleSittingOut = this.selectSittingOutPlayers(
          constraints.flexiblePlayers,
          constraints.flexiblePlayers.length - remainingSittingOut,
        );
        sittingOut.push(...flexibleSittingOut);
      }
    } else {
      // Not enforcing partnerships - treat all as individuals but prefer to keep partnerships together
      const allPlayers = [
        ...constraints.flexiblePlayers,
        ...constraints.partnershipUnits.flatMap((unit) => unit.players),
      ];

      const individualSittingOut = this.selectSittingOutPlayers(
        allPlayers,
        numPlaying,
      );
      sittingOut.push(...individualSittingOut);
    }

    return sittingOut;
  }

  public assignPlayersToCourtsWithPartnerships(
    playingPlayers: Player[],
    constraints: PartnershipConstraints,
  ): Player[][] {
    const courtAssignments: Player[][] = Array(this.activeCourts.length)
      .fill(null)
      .map(() => []);

    // Filter partnership units to only include those where both players are playing
    const playingPlayerIds = new Set(playingPlayers.map((p) => p.id));
    const playingPartnershipUnits: PartnershipUnit[] =
      constraints.partnershipUnits.filter((unit) =>
        unit.players.every((player) => playingPlayerIds.has(player.id)),
      );

    const flexiblePlayingPlayers: Player[] = constraints.flexiblePlayers.filter(
      (player) => playingPlayerIds.has(player.id),
    );

    let remainingFlexiblePlayers: Player[] = this.shuffleArray(
      flexiblePlayingPlayers,
    );

    // Sort courts by minimum rating (highest first) to assign partnerships appropriately
    const sortedCourts = [...this.activeCourts]
      .map((court, index) => ({ court, index }))
      .sort(
        (a, b) => (b.court.minimumRating || 0) - (a.court.minimumRating || 0),
      );

    // Step 1: Assign partnership units to courts
    const remainingUnits = [...playingPartnershipUnits];

    for (const { court, index: courtIndex } of sortedCourts) {
      if (remainingUnits.length === 0) break;
      if (courtAssignments[courtIndex].length >= 4) continue;

      // Find partnerships that can play on this court
      let eligibleUnits: PartnershipUnit[] = remainingUnits.filter((unit) => {
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

    // Step 3: Fill remaining court slots with flexible players
    for (const { court, index: courtIndex } of sortedCourts) {
      if (
        court.minimumRating &&
        remainingFlexiblePlayers.length >=
          4 - courtAssignments[courtIndex].length
      ) {
        // Get players who meet the rating requirement
        const eligiblePlayers = remainingFlexiblePlayers.filter(
          (player) => player.rating && player.rating >= court.minimumRating!,
        );

        while (
          courtAssignments[courtIndex].length < 4 &&
          eligiblePlayers.length > 0
        ) {
          // Sort by rating (highest first for balanced distribution)
          eligiblePlayers.sort((a, b) => (b.rating || 0) - (a.rating || 0));

          const player = eligiblePlayers.shift()!;
          courtAssignments[courtIndex].push(player);

          // Remove from remaining pool
          const index = remainingFlexiblePlayers.indexOf(player);
          if (index > -1) remainingFlexiblePlayers.splice(index, 1);
        }
      }
    }

    // Step 4: Assign remaining flexible players to unfilled courts
    let playerIndex = 0;
    for (const { court, index: courtIndex } of sortedCourts) {
      while (
        courtAssignments[courtIndex].length < 4 &&
        playerIndex < remainingFlexiblePlayers.length
      ) {
        // Check if court has rating requirement
        if (court.minimumRating) {
          // Find next player who meets the rating requirement
          let foundEligiblePlayer = false;
          for (let i = playerIndex; i < remainingFlexiblePlayers.length; i++) {
            const player = remainingFlexiblePlayers[i];
            if (player.rating && player.rating >= court.minimumRating) {
              // Move eligible player to current position and assign
              [
                remainingFlexiblePlayers[playerIndex],
                remainingFlexiblePlayers[i],
              ] = [
                remainingFlexiblePlayers[i],
                remainingFlexiblePlayers[playerIndex],
              ];
              courtAssignments[courtIndex].push(
                remainingFlexiblePlayers[playerIndex],
              );
              playerIndex++;
              foundEligiblePlayer = true;
              break;
            }
          }
          if (!foundEligiblePlayer) {
            // No more eligible players for this court, move to next court
            break;
          }
        } else {
          // No rating requirement - assign any remaining player
          courtAssignments[courtIndex].push(
            remainingFlexiblePlayers[playerIndex],
          );
          playerIndex++;
        }
      }
    }
    // Step 5: Remove courts with insufficient players
    return courtAssignments.filter(
      (court) => court.length >= APP_CONFIG.MIN_PLAYERS_PER_GAME,
    );
  }
}

export class LotteryPlayerAssignmentStrategy extends PlayerAssignmentStrategy {
  public selectSittingOutPlayersWithPartnerships(
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

  public assignPlayersToCourtsWithPartnerships(
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
}

export class FairWeightedPlayerAssignmentStrategy extends PlayerAssignmentStrategy {
  public selectSittingOutPlayersWithPartnerships(
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

    // Step 1: Create unified player pool with fairness scores
    const allPlayers = [
      ...constraints.flexiblePlayers,
      ...constraints.partnershipUnits.flatMap((unit) => unit.players),
    ];

    const playerSelectScores = allPlayers.map((player) => {
      const stats = this.playerStats.get(player.id)!;
      const isPartnered = constraints.fixedPairs.has(player.id);
      return {
        player,
        sitOutCount: stats.gamesSatOut,
        gamesPlayed: stats.gamesPlayed,
        consecutiveGames: stats.consecutiveGames,
        isPartnered,
        // fairnessScore: stats.gamesSatOut - stats.gamesPlayed, // Lower is higher priority for sitting out
      };
    });

    // Step 2: Sort by fairness criteria (same as selectSittingOutPlayers)
    playerSelectScores.sort((a, b) => {
      // Primary: least sit-outs first (higher priority to sit out)
      if (a.sitOutCount !== b.sitOutCount) {
        return a.sitOutCount - b.sitOutCount;
      }
      // Secondary: most games played first (so they sit out to balance)
      if (b.gamesPlayed !== a.gamesPlayed) {
        return b.gamesPlayed - a.gamesPlayed;
      }
      // Tertiary: most consecutive games played
      if (b.consecutiveGames !== a.consecutiveGames) {
        return b.consecutiveGames - a.consecutiveGames;
      }
      // Tiebreak: random for fairness when stats are identical
      return Math.random() - 0.5;
    });

    // Step 3: Select players using equal weighting strategy
    const selectedToSitOut: Player[] = [];
    const processedPlayerIds = new Set<string>();

    for (const selectionScore of playerSelectScores) {
      if (selectedToSitOut.length >= sittingOutCount) break;
      if (processedPlayerIds.has(selectionScore.player.id)) continue;

      const player = selectionScore.player;
      const partnerId = constraints.fixedPairs.get(player.id);

      if (partnerId) {
        // This is a partnered player
        const partner = allPlayers.find((p) => p.id === partnerId);

        if (!partner || processedPlayerIds.has(partnerId)) {
          // Partner already processed or not found, skip
          processedPlayerIds.add(player.id);
          continue;
        }

        // Check if we can sit out both partners
        if (selectedToSitOut.length + 2 <= sittingOutCount) {
          // Can sit out both partners
          selectedToSitOut.push(player, partner);
          processedPlayerIds.add(player.id);
          processedPlayerIds.add(partnerId);
        } else if (selectedToSitOut.length + 1 <= sittingOutCount) {
          // Only room for one more player
          if (this.partnershipConstraint?.enforceAllPairings) {
            // Can't break partnerships, skip this pair
            processedPlayerIds.add(player.id);
            processedPlayerIds.add(partnerId);
            continue;
          } else {
            // Can break partnership if needed - sit out just this player
            selectedToSitOut.push(player);
            processedPlayerIds.add(player.id);
          }
        }
      } else {
        // Non-partnered player
        if (selectedToSitOut.length < sittingOutCount) {
          selectedToSitOut.push(player);
          processedPlayerIds.add(player.id);
        }
      }
    }

    // Step 4: Handle case where we selected a partnered player but need to make room
    // This handles the "adjust sitting out players" requirement
    if (selectedToSitOut.length > sittingOutCount) {
      const excess = selectedToSitOut.length - sittingOutCount;

      if (!this.partnershipConstraint?.enforceAllPairings && excess > 0) {
        // Find non-partnered players to remove (reverse priority order)
        const nonPartneredInSelection = selectedToSitOut.filter(
          (player) => !constraints.fixedPairs.has(player.id),
        );

        // Sort non-partnered players by reverse fairness (remove those with better stats first)
        const nonPartneredScores = nonPartneredInSelection.map((player) => {
          const stats = this.playerStats.get(player.id)!;
          return {
            player,
            sitOutCount: stats.gamesSatOut,
            gamesPlayed: stats.gamesPlayed,
            consecutiveGames: stats.consecutiveGames,
          };
        });

        nonPartneredScores.sort((a, b) => {
          // Remove those with MOST sit-outs first (reverse of selection criteria)
          if (b.sitOutCount !== a.sitOutCount) {
            return b.sitOutCount - a.sitOutCount;
          }
          // Remove those with LEAST games played first (reverse of selection criteria)
          if (a.gamesPlayed !== b.gamesPlayed) {
            return a.gamesPlayed - b.gamesPlayed;
          }
          // Remove those with LEAST consecutive games played first (reverse of selection criteria)
          if (a.consecutiveGames !== b.consecutiveGames) {
            return a.consecutiveGames - b.consecutiveGames;
          }
          // tiebreak
          return Math.random() - 0.5;
        });

        // Remove excess non-partnered players
        for (let i = 0; i < Math.min(excess, nonPartneredScores.length); i++) {
          const playerToRemove = nonPartneredScores[i].player;
          const index = selectedToSitOut.indexOf(playerToRemove);
          if (index > -1) {
            selectedToSitOut.splice(index, 1);
          }
        }
      }
    }
    return selectedToSitOut;
  }

  public assignPlayersToCourtsWithPartnerships(
    playingPlayers: Player[],
    constraints: PartnershipConstraints,
  ): Player[][] {
    // Use the same court assignment logic as DefaultPlayerAssignmentStrategy
    // since the fairness improvement is in player selection, not court assignment
    const defaultStrategy = new DefaultPlayerAssignmentStrategy(
      this.activeCourts,
      this.playerStats,
      this.partnershipConstraint,
    );

    return defaultStrategy.assignPlayersToCourtsWithPartnerships(
      playingPlayers,
      constraints,
    );
  }
}
