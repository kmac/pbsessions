// These tests cover:
//
// ### Core Functionality:
// - ✅ Empty sessions and sessions without live data
// - ✅ Partnership counting (same team players)
// - ✅ Opposition counting (different team players)
// - ✅ Same court counting (all players on same court)
//
// ### Scoring Logic:
// - ✅ Win/loss tracking when scoring is enabled
// - ✅ No win/loss tracking when scoring is disabled
// - ✅ No win/loss tracking for incomplete games
// - ✅ Both serve team wins and receive team wins
//
// ### Edge Cases:
// - ✅ Multiple games accumulating stats
// - ✅ Players not in session playerIds list
// - ✅ Invalid player IDs in helper functions
//
// ### Helper Functions:
// - ✅ `getPlayerPairSummary` with valid and invalid inputs
// - ✅ `getPlayerMatchups` with valid and invalid inputs
//
// Run these tests with: `npm test -- src/utils/__tests__/playerMatchups.test.ts`
import {
  generateSessionMatchupData,
  getPlayerPairSummary,
  getPlayerMatchups,
  PlayerMatchupStats,
} from "../playerMatchups";
import {
  Session,
  SessionState,
  Game,
  Round,
  PlayerStats,
  Court,
  Score,
} from "@/src/types";
import { v4 as uuidv4 } from "uuid";

// Test data helpers
const createTestPlayer = (name: string): string => uuidv4();

const createTestCourt = (name: string): Court => ({
  id: uuidv4(),
  name,
  isActive: true,
});

const createTestGame = (
  sessionId: string,
  courtId: string,
  player1Id: string,
  player2Id: string,
  player3Id: string,
  player4Id: string,
  isCompleted = false,
  score?: Score,
): Game => ({
  id: uuidv4(),
  sessionId,
  courtId,
  serveTeam: {
    player1Id: player1Id,
    player2Id: player2Id,
  },
  receiveTeam: {
    player1Id: player3Id,
    player2Id: player4Id,
  },
  isCompleted,
  score,
});

const createTestSession = (
  playerIds: string[],
  scoring = false,
  liveData?: { rounds: Round[]; playerStats: PlayerStats[] },
): Session => ({
  id: uuidv4(),
  name: "Test Session",
  dateTime: new Date().toISOString(),
  playerIds,
  courts: [createTestCourt("Court 1")],
  state: SessionState.Live,
  scoring,
  showRatings: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  liveData,
});

describe("playerMatchups", () => {
  let player1Id: string;
  let player2Id: string;
  let player3Id: string;
  let player4Id: string;
  let player5Id: string;
  let player6Id: string;
  let courtId: string;

  beforeEach(() => {
    player1Id = createTestPlayer("Player 1");
    player2Id = createTestPlayer("Player 2");
    player3Id = createTestPlayer("Player 3");
    player4Id = createTestPlayer("Player 4");
    player5Id = createTestPlayer("Player 5");
    player6Id = createTestPlayer("Player 6");
    courtId = uuidv4();
  });

  describe("generateSessionMatchupData", () => {
    it("should return empty matchup data for session without live data", () => {
      const session = createTestSession([
        player1Id,
        player2Id,
        player3Id,
        player4Id,
      ]);
      const result = generateSessionMatchupData(session);

      expect(result[player1Id]).toBeDefined();
      expect(result[player1Id][player2Id]).toEqual({
        partneredCount: 0,
        partneredWins: 0,
        partneredLosses: 0,
        againstCount: 0,
        againstWins: 0,
        againstLosses: 0,
        sameCourtCount: 0,
      });
    });

    it("should initialize data structure for all players in session", () => {
      const playerIds = [player1Id, player2Id, player3Id, player4Id];
      const session = createTestSession(playerIds);
      const result = generateSessionMatchupData(session);

      // Check that all players have entries
      playerIds.forEach((playerId) => {
        expect(result[playerId]).toBeDefined();

        // Check that each player has entries for all other players
        playerIds.forEach((otherPlayerId) => {
          if (playerId !== otherPlayerId) {
            expect(result[playerId][otherPlayerId]).toBeDefined();
          }
        });
      });

      // Check that players don't have entries for themselves
      expect(result[player1Id][player1Id]).toBeUndefined();
    });

    it("should count partnerships correctly", () => {
      const game = createTestGame(
        "session1",
        courtId,
        player1Id,
        player2Id,
        player3Id,
        player4Id,
      );
      const session = createTestSession(
        [player1Id, player2Id, player3Id, player4Id],
        false,
        {
          rounds: [{ games: [game], sittingOutIds: [] }],
          playerStats: [],
        },
      );

      const result = generateSessionMatchupData(session);

      // Player 1 and 2 were partners (serve team)
      expect(result[player1Id][player2Id].partneredCount).toBe(1);
      expect(result[player2Id][player1Id].partneredCount).toBe(1);

      // Player 3 and 4 were partners (receive team)
      expect(result[player3Id][player4Id].partneredCount).toBe(1);
      expect(result[player4Id][player3Id].partneredCount).toBe(1);

      // Cross-team partnerships should be 0
      expect(result[player1Id][player3Id].partneredCount).toBe(0);
      expect(result[player1Id][player4Id].partneredCount).toBe(0);
    });

    it("should count opposition correctly", () => {
      const game = createTestGame(
        "session1",
        courtId,
        player1Id,
        player2Id,
        player3Id,
        player4Id,
      );
      const session = createTestSession(
        [player1Id, player2Id, player3Id, player4Id],
        false,
        {
          rounds: [{ games: [game], sittingOutIds: [] }],
          playerStats: [],
        },
      );

      const result = generateSessionMatchupData(session);

      // Serve team vs receive team
      expect(result[player1Id][player3Id].againstCount).toBe(1);
      expect(result[player1Id][player4Id].againstCount).toBe(1);
      expect(result[player2Id][player3Id].againstCount).toBe(1);
      expect(result[player2Id][player4Id].againstCount).toBe(1);

      // Reverse direction should also be counted
      expect(result[player3Id][player1Id].againstCount).toBe(1);
      expect(result[player4Id][player1Id].againstCount).toBe(1);

      // Same team players should not count against each other
      expect(result[player1Id][player2Id].againstCount).toBe(0);
      expect(result[player3Id][player4Id].againstCount).toBe(0);
    });

    it("should count same court occurrences correctly", () => {
      const game = createTestGame(
        "session1",
        courtId,
        player1Id,
        player2Id,
        player3Id,
        player4Id,
      );
      const session = createTestSession(
        [player1Id, player2Id, player3Id, player4Id],
        false,
        {
          rounds: [{ games: [game], sittingOutIds: [] }],
          playerStats: [],
        },
      );

      const result = generateSessionMatchupData(session);

      // All players were on the same court, so each pair should have count of 1
      expect(result[player1Id][player2Id].sameCourtCount).toBe(1);
      expect(result[player1Id][player3Id].sameCourtCount).toBe(1);
      expect(result[player1Id][player4Id].sameCourtCount).toBe(1);
      expect(result[player2Id][player3Id].sameCourtCount).toBe(1);
      expect(result[player2Id][player4Id].sameCourtCount).toBe(1);
      expect(result[player3Id][player4Id].sameCourtCount).toBe(1);
    });

    it("should not track wins/losses when scoring is disabled", () => {
      const score: Score = { serveScore: 11, receiveScore: 8 };
      const game = createTestGame(
        "session1",
        courtId,
        player1Id,
        player2Id,
        player3Id,
        player4Id,
        true,
        score,
      );
      const session = createTestSession(
        [player1Id, player2Id, player3Id, player4Id],
        false, // scoring disabled
        {
          rounds: [{ games: [game], sittingOutIds: [] }],
          playerStats: [],
        },
      );

      const result = generateSessionMatchupData(session);

      // All win/loss counts should remain 0
      expect(result[player1Id][player2Id].partneredWins).toBe(0);
      expect(result[player1Id][player2Id].partneredLosses).toBe(0);
      expect(result[player1Id][player3Id].againstWins).toBe(0);
      expect(result[player1Id][player3Id].againstLosses).toBe(0);
    });

    it("should track wins/losses when scoring is enabled and game is completed", () => {
      const score: Score = { serveScore: 11, receiveScore: 8 }; // Serve team wins
      const game = createTestGame(
        "session1",
        courtId,
        player1Id,
        player2Id,
        player3Id,
        player4Id,
        true,
        score,
      );
      const session = createTestSession(
        [player1Id, player2Id, player3Id, player4Id],
        true, // scoring enabled
        {
          rounds: [{ games: [game], sittingOutIds: [] }],
          playerStats: [],
        },
      );

      const result = generateSessionMatchupData(session);

      // Serve team (player1, player2) won
      expect(result[player1Id][player2Id].partneredWins).toBe(1);
      expect(result[player2Id][player1Id].partneredWins).toBe(1);
      expect(result[player1Id][player2Id].partneredLosses).toBe(0);

      // Receive team (player3, player4) lost
      expect(result[player3Id][player4Id].partneredLosses).toBe(1);
      expect(result[player4Id][player3Id].partneredLosses).toBe(1);
      expect(result[player3Id][player4Id].partneredWins).toBe(0);

      // Against stats - serve team beat receive team
      expect(result[player1Id][player3Id].againstWins).toBe(1);
      expect(result[player1Id][player4Id].againstWins).toBe(1);
      expect(result[player3Id][player1Id].againstLosses).toBe(1);
      expect(result[player4Id][player1Id].againstLosses).toBe(1);
    });

    it("should handle receive team winning", () => {
      const score: Score = { serveScore: 8, receiveScore: 11 }; // Receive team wins
      const game = createTestGame(
        "session1",
        courtId,
        player1Id,
        player2Id,
        player3Id,
        player4Id,
        true,
        score,
      );
      const session = createTestSession(
        [player1Id, player2Id, player3Id, player4Id],
        true,
        {
          rounds: [{ games: [game], sittingOutIds: [] }],
          playerStats: [],
        },
      );

      const result = generateSessionMatchupData(session);

      // Receive team (player3, player4) won
      expect(result[player3Id][player4Id].partneredWins).toBe(1);
      expect(result[player4Id][player3Id].partneredWins).toBe(1);

      // Serve team (player1, player2) lost
      expect(result[player1Id][player2Id].partneredLosses).toBe(1);
      expect(result[player2Id][player1Id].partneredLosses).toBe(1);

      // Against stats - receive team beat serve team
      expect(result[player3Id][player1Id].againstWins).toBe(1);
      expect(result[player4Id][player2Id].againstWins).toBe(1);
      expect(result[player1Id][player3Id].againstLosses).toBe(1);
      expect(result[player2Id][player4Id].againstLosses).toBe(1);
    });

    it("should not track wins/losses for incomplete games even with scoring enabled", () => {
      const score: Score = { serveScore: 11, receiveScore: 8 };
      const game = createTestGame(
        "session1",
        courtId,
        player1Id,
        player2Id,
        player3Id,
        player4Id,
        false,
        score,
      ); // not completed
      const session = createTestSession(
        [player1Id, player2Id, player3Id, player4Id],
        true,
        {
          rounds: [{ games: [game], sittingOutIds: [] }],
          playerStats: [],
        },
      );

      const result = generateSessionMatchupData(session);

      // Should still count partnerships and opposition
      expect(result[player1Id][player2Id].partneredCount).toBe(1);
      expect(result[player1Id][player3Id].againstCount).toBe(1);

      // But not wins/losses
      expect(result[player1Id][player2Id].partneredWins).toBe(0);
      expect(result[player1Id][player3Id].againstWins).toBe(0);
    });

    it("should handle multiple games and accumulate stats", () => {
      const score1: Score = { serveScore: 11, receiveScore: 8 };
      const score2: Score = { serveScore: 6, receiveScore: 11 };

      const game1 = createTestGame(
        "session1",
        courtId,
        player1Id,
        player2Id,
        player3Id,
        player4Id,
        true,
        score1,
      );
      const game2 = createTestGame(
        "session1",
        courtId,
        player1Id,
        player3Id,
        player2Id,
        player4Id,
        true,
        score2,
      );

      const session = createTestSession(
        [player1Id, player2Id, player3Id, player4Id],
        true,
        {
          rounds: [
            { games: [game1], sittingOutIds: [] },
            { games: [game2], sittingOutIds: [] },
          ],
          playerStats: [],
        },
      );

      const result = generateSessionMatchupData(session);

      // Player1 partnered with both player2 and player3 once each
      expect(result[player1Id][player2Id].partneredCount).toBe(1);
      expect(result[player1Id][player3Id].partneredCount).toBe(1);

      // Player1 played against player3 twice (once as partner, once as opponent)
      expect(result[player1Id][player3Id].againstCount).toBe(1);
      expect(result[player1Id][player3Id].sameCourtCount).toBe(2);

      // Win/loss records
      expect(result[player1Id][player2Id].partneredWins).toBe(1); // Won game1
      expect(result[player1Id][player3Id].partneredLosses).toBe(1); // Lost game2
    });

    it("should handle players not in session playerIds gracefully", () => {
      const extraPlayerId = createTestPlayer("Extra Player");
      const game = createTestGame(
        "session1",
        courtId,
        player1Id,
        player2Id,
        player3Id,
        extraPlayerId,
      );
      const session = createTestSession(
        [player1Id, player2Id, player3Id, player4Id], // extraPlayerId not in session
        false,
        {
          rounds: [{ games: [game], sittingOutIds: [] }],
          playerStats: [],
        },
      );

      const result = generateSessionMatchupData(session);

      // Should not crash and should only have data for session players
      expect(result[extraPlayerId]).toBeUndefined();
      expect(result[player1Id][extraPlayerId]).toBeUndefined();

      // But should still track stats for valid players
      expect(result[player1Id][player2Id].partneredCount).toBe(1);
      expect(result[player1Id][player3Id].againstCount).toBe(1);
    });
  });

  describe("getPlayerPairSummary", () => {
    it("should return correct matchup stats for valid player pair", () => {
      const game = createTestGame(
        "session1",
        courtId,
        player1Id,
        player2Id,
        player3Id,
        player4Id,
        true,
        { serveScore: 11, receiveScore: 8 },
      );
      const session = createTestSession(
        [player1Id, player2Id, player3Id, player4Id],
        true,
        {
          rounds: [{ games: [game], sittingOutIds: [] }],
          playerStats: [],
        },
      );

      const matchupData = generateSessionMatchupData(session);
      const result = getPlayerPairSummary(matchupData, player1Id, player2Id);

      expect(result).toEqual({
        partneredCount: 1,
        partneredWins: 1,
        partneredLosses: 0,
        againstCount: 0,
        againstWins: 0,
        againstLosses: 0,
        sameCourtCount: 1,
      });
    });

    it("should return null for invalid player pair", () => {
      const session = createTestSession([player1Id, player2Id]);
      const matchupData = generateSessionMatchupData(session);
      const result = getPlayerPairSummary(matchupData, player1Id, "invalid-id");

      expect(result).toBeNull();
    });

    it("should return null for non-existent player", () => {
      const session = createTestSession([player1Id, player2Id]);
      const matchupData = generateSessionMatchupData(session);
      const result = getPlayerPairSummary(matchupData, "invalid-id", player2Id);

      expect(result).toBeNull();
    });
  });

  describe("getPlayerMatchups", () => {
    it("should return all matchups for valid player", () => {
      const game = createTestGame(
        "session1",
        courtId,
        player1Id,
        player2Id,
        player3Id,
        player4Id,
      );
      const session = createTestSession(
        [player1Id, player2Id, player3Id, player4Id],
        false,
        {
          rounds: [{ games: [game], sittingOutIds: [] }],
          playerStats: [],
        },
      );

      const matchupData = generateSessionMatchupData(session);
      const result = getPlayerMatchups(matchupData, player1Id);

      expect(result).toBeDefined();
      expect(result![player2Id]).toBeDefined();
      expect(result![player3Id]).toBeDefined();
      expect(result![player4Id]).toBeDefined();
      expect(result![player1Id]).toBeUndefined(); // Should not have self-matchup
    });

    it("should return null for non-existent player", () => {
      const session = createTestSession([player1Id, player2Id]);
      const matchupData = generateSessionMatchupData(session);
      const result = getPlayerMatchups(matchupData, "invalid-id");

      expect(result).toBeNull();
    });
  });
});
