import { Player, Court, PlayerStats, PartnershipConstraint, PartnershipContext } from "@/src/types";
import { APP_CONFIG } from "../../constants";

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

  abstract selectSittingOutPlayers(
    context: PartnershipContext,
    numPlaying: number,
  ): Player[];

  public assignPlayersToCourts(
    playingPlayers: Player[],
    context: PartnershipContext,
  ): Player[][] {
    const courtAssignments: Player[][] = Array(this.activeCourts.length)
      .fill(null)
      .map(() => []);

    // Filter partnership pairs to only include those where both players are playing
    const playingPlayerIds = new Set(playingPlayers.map((p) => p.id));
    const playingFixedPartners = context.pairs.filter((pair) =>
      pair.players.every((player) => playingPlayerIds.has(player.id)),
    );

    let remainingUnpairedPlayers: Player[] = context.unpairedPlayers.filter(
      (player) => playingPlayerIds.has(player.id),
    );
    remainingUnpairedPlayers = this.shuffleArray(remainingUnpairedPlayers);

    // Sort courts by minimum rating (highest first) to assign partnerships appropriately
    const sortedCourts = [...this.activeCourts]
      .map((court, index) => ({ court, index }))
      .sort(
        (a, b) => (b.court.minimumRating || 0) - (a.court.minimumRating || 0),
      );

    // Step 1: Assign fixed partner pairs to courts
    const remainingFixedPartners = [...playingFixedPartners];
    for (const { court, index: courtIndex } of sortedCourts) {
      if (remainingFixedPartners.length === 0) {
        // no more partnerships to fill
        break;
      }
      if (courtAssignments[courtIndex].length >= 4) {
        continue; // this court filled, on to next court
      }
      // If court has minimum rating, find partnerships that are eligible to play on this court
      let eligiblePairs = remainingFixedPartners.filter((pair) => {
        if (!court.minimumRating) return true;
        return pair.maxRating >= court.minimumRating;
      });

      if (eligiblePairs.length > 0) {
        // Take the first eligible partnership
        const selectedPair = eligiblePairs[0];
        courtAssignments[courtIndex].push(...selectedPair.players);

        // Remove from remaining pairs
        const pairIndex = remainingFixedPartners.indexOf(selectedPair);
        remainingFixedPartners.splice(pairIndex, 1);
      }
    }

    // Step 2: Handle remaining partnership pairs that couldn't be placed due to rating constraints
    // These partnerships will sit out together
    const unplacedPartnershipPlayers = remainingFixedPartners.flatMap(
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

    // Step 3: Fill remaining court slots with unpaired players
    for (const { court, index: courtIndex } of sortedCourts) {
      if (
        court.minimumRating &&
        remainingUnpairedPlayers.length >=
          4 - courtAssignments[courtIndex].length
      ) {
        // Get players who meet the rating requirement
        const eligiblePlayers = remainingUnpairedPlayers.filter(
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
          const index = remainingUnpairedPlayers.indexOf(player);
          if (index > -1) remainingUnpairedPlayers.splice(index, 1);
        }
      }
    }

    // Step 4: Assign remaining unpaired players to unfilled courts
    let playerIndex = 0;
    for (const { court, index: courtIndex } of sortedCourts) {
      while (
        courtAssignments[courtIndex].length < 4 &&
        playerIndex < remainingUnpairedPlayers.length
      ) {
        // Check if court has rating requirement
        if (court.minimumRating) {
          // Find next player who meets the rating requirement
          let foundEligiblePlayer = false;
          for (let i = playerIndex; i < remainingUnpairedPlayers.length; i++) {
            const player = remainingUnpairedPlayers[i];
            if (player.rating && player.rating >= court.minimumRating) {
              // Move eligible player to current position and assign
              [
                remainingUnpairedPlayers[playerIndex],
                remainingUnpairedPlayers[i],
              ] = [
                remainingUnpairedPlayers[i],
                remainingUnpairedPlayers[playerIndex],
              ];
              courtAssignments[courtIndex].push(
                remainingUnpairedPlayers[playerIndex],
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
            remainingUnpairedPlayers[playerIndex],
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

  // Fisher-Yates shuffle
  protected shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  protected chooseSitOuts(players: Player[], numPlaying: number): Player[] {
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
  public selectSittingOutPlayers(
    context: PartnershipContext,
    numPlaying: number,
  ): Player[] {
    const totalPlayers =
      context.unpairedPlayers.length + context.pairs.length * 2;

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
      const sortedPairs = [...context.pairs].sort((a, b) => {
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
        sittingOut.push(...sortedPairs[i].players);
      }

      // Handle remaining individual unpaired players
      if (remainingSittingOut > 0) {
        const unpairedSittingOut = this.chooseSitOuts(
          context.unpairedPlayers,
          context.unpairedPlayers.length - remainingSittingOut,
        );
        sittingOut.push(...unpairedSittingOut);
      }
    } else {
      // Not enforcing partnerships - treat all as individuals but prefer to keep partnerships together
      const allPlayers = [
        ...context.unpairedPlayers,
        ...context.pairs.flatMap((pair) => pair.players),
      ];

      const individualSittingOut = this.chooseSitOuts(allPlayers, numPlaying);
      sittingOut.push(...individualSittingOut);
    }

    return sittingOut;
  }
}
