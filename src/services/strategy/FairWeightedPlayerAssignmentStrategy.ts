import { Player } from "@/src/types";
import {
  PartnershipContext,
  PlayerAssignmentStrategy,
} from "./PlayerAssignmentStrategy";

export class FairWeightedPlayerAssignmentStrategy extends PlayerAssignmentStrategy {
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

    // Step 1: Create unified player pool with fairness scores
    const allPlayers = [
      ...context.unpairedPlayers,
      ...context.pairs.flatMap((pair) => pair.players),
    ];

    const playerSelectScores = allPlayers.map((player) => {
      const stats = this.playerStats.get(player.id)!;
      const isPartnered = context.partnerMap.has(player.id);
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
      const partnerId = context.partnerMap.get(player.id);

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
          (player) => !context.partnerMap.has(player.id),
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

  // Use the same court assignment logic as DefaultPlayerAssignmentStrategy
  // since the fairness improvement is in player selection, not court assignment
}
