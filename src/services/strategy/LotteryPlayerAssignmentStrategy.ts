import { Player } from "@/src/types";
import { APP_CONFIG } from "../../constants";
import { PartnershipContext, PlayerAssignmentStrategy } from "./PlayerAssignmentStrategy";

export class LotteryPlayerAssignmentStrategy extends PlayerAssignmentStrategy {
  public selectSittingOutPlayers(
    context: PartnershipContext,
    numPlaying: number,
  ): Player[] {
    const totalPlayers =
      context.unpairedPlayers.length +
      context.pairs.length * 2;

    if (totalPlayers <= numPlaying) {
      return [];
    }
    const sittingOutCount = totalPlayers - numPlaying;

    // Step 1: Calculate fairness scores for all players
    const allPlayers = [
      ...context.unpairedPlayers,
      ...context.pairs.flatMap((pair) => pair.players),
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
        context.partnerMap.has(ps.player.id),
      );
      const nonPartneredPlayers = group.filter(
        (ps) => !context.partnerMap.has(ps.player.id),
      );

      // Run weighted lottery within this group
      const lotteryResults = this.runWeightedLottery(
        partneredPlayers.map((ps) => ps.player),
        nonPartneredPlayers.map((ps) => ps.player),
        remainingNeeded,
        context.partnerMap,
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
          context.partnerMap,
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

  public assignPlayersToCourts(
    playingPlayers: Player[],
    context: PartnershipContext,
  ): Player[][] {
    const courtAssignments: Player[][] = Array(this.activeCourts.length)
      .fill(null)
      .map(() => []);

    // Filter partnership pairs to only include those where both players are playing
    const playingPlayerIds = new Set(playingPlayers.map((p) => p.id));
    const playingPairs = context.pairs.filter(
      (pair) => pair.players.every((player) => playingPlayerIds.has(player.id)),
    );

    const unpairedPlayingPlayers = context.unpairedPlayers.filter(
      (player) => playingPlayerIds.has(player.id),
    );

    let remainingUnpairedPlayers = this.shuffleArray(unpairedPlayingPlayers);

    // Sort courts by minimum rating (highest first) to assign partnerships appropriately
    const sortedCourts = [...this.activeCourts]
      .map((court, index) => ({ court, index }))
      .sort(
        (a, b) => (b.court.minimumRating || 0) - (a.court.minimumRating || 0),
      );

    // Step 1: Assign partnership pairs to courts
    const remainingPairs = [...playingPairs];

    for (const { court, index: courtIndex } of sortedCourts) {
      if (remainingPairs.length === 0) break;
      if (courtAssignments[courtIndex].length >= 4) continue;

      // Find partnerships that can play on this court
      const eligiblePairs = remainingPairs.filter((pair) => {
        if (!court.minimumRating) return true;
        return pair.maxRating >= court.minimumRating;
      });

      if (eligiblePairs.length > 0) {
        // Take the first eligible partnership
        const selectedPair = eligiblePairs[0];
        courtAssignments[courtIndex].push(...selectedPair.players);

        // Remove from remaining pairs
        const pairIndex = remainingPairs.indexOf(selectedPair);
        remainingPairs.splice(pairIndex, 1);
      }
    }

    // Step 2: Handle remaining partnership pairs that couldn't be placed due to rating constraints
    // These partnerships will sit out together
    const unplacedPartnershipPlayers = remainingPairs.flatMap(
      (pair) => pair.players,
    );

    // Add unplaced partnership players back to unpaired pool if not enforcing all pairings
    if (
      !this.partnershipConstraint?.enforceAllPairings &&
      unplacedPartnershipPlayers.length > 0
    ) {
      remainingUnpairedPlayers.push(...unplacedPartnershipPlayers);
      remainingUnpairedPlayers = this.shuffleArray(remainingUnpairedPlayers);
    }

    // Step 3: Fill remaining court slots with unpaired players (FIXED: Respect rating constraints)
    for (const { court, index: courtIndex } of sortedCourts) {
      const slotsNeeded = 4 - courtAssignments[courtIndex].length;
      if (slotsNeeded <= 0) continue;

      if (court.minimumRating) {
        // Get players who meet the rating requirement
        const eligiblePlayers = remainingUnpairedPlayers.filter(
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
          const index = remainingUnpairedPlayers.indexOf(player);
          if (index > -1) remainingUnpairedPlayers.splice(index, 1);
          assigned++;
        }
      } else {
        // No rating requirement - assign any remaining players
        let assigned = 0;
        while (
          courtAssignments[courtIndex].length < 4 &&
          assigned < remainingUnpairedPlayers.length &&
          assigned < slotsNeeded
        ) {
          courtAssignments[courtIndex].push(remainingUnpairedPlayers[assigned]);
          assigned++;
        }
        // Remove assigned players from remaining pool
        remainingUnpairedPlayers.splice(0, assigned);
      }
    }

    // Step 4: Remove courts with insufficient players
    return courtAssignments.filter(
      (court) => court.length >= APP_CONFIG.MIN_PLAYERS_PER_GAME,
    );
  }
}

