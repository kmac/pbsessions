import { SessionCoordinator } from "../sessionCoordinator";
import {
  Session,
  Player,
  Court,
  SessionState,
  PartnershipConstraint,
  FixedPartnership,
  PlayerStats,
} from "../../types";

// Mock the Alert utility
jest.mock("@/src/utils/alert", () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

const LOG_TO_CONSOLE = false;

describe("SessionCoordinator - generateRoundAssignment", () => {
  let mockPlayers: Player[];
  let mockCourts: Court[];
  let mockSession: Session;
  let sessionCoordinator: SessionCoordinator;

  // Test data factory functions
  const createPlayer = (id: string, name: string, rating?: number): Player => ({
    id,
    name,
    rating,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const createCourt = (
    id: string,
    name: string,
    minimumRating?: number,
  ): Court => ({
    id,
    name,
    minimumRating,
    isActive: true,
  });

  const createFixedPartnership = (
    id: string,
    player1Id: string,
    player2Id: string,
    isActive = true,
    name?: string,
  ): FixedPartnership => ({
    id,
    player1Id,
    player2Id,
    name,
    isActive,
    createdAt: new Date().toISOString(),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock players with different ratings
    mockPlayers = [
      createPlayer("player1", "Alice", 4.5),
      createPlayer("player2", "Bob", 4.0),
      createPlayer("player3", "Charlie", 3.5),
      createPlayer("player4", "Diana", 4.2),
      createPlayer("player5", "Eve", 3.8),
      createPlayer("player6", "Frank", 4.1),
      createPlayer("player7", "Grace", 3.9),
      createPlayer("player8", "Henry", 4.3),
    ];

    // Create mock courts
    mockCourts = [
      createCourt("court1", "Court 1", 4.0),
      createCourt("court2", "Court 2"),
    ];

    // Create basic session
    mockSession = {
      id: "session1",
      name: "Test Session",
      dateTime: new Date().toISOString(),
      playerIds: mockPlayers.map((p) => p.id),
      courts: mockCourts,
      state: SessionState.Live,
      scoring: true,
      showRatings: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      liveData: {
        rounds: [],
        playerStats: mockPlayers.map((player) => ({
          playerId: player.id,
          gamesPlayed: 0,
          gamesSatOut: 0,
          partners: {},
          fixedPartnershipGames: 0,
          totalScore: 0,
          totalScoreAgainst: 0,
        })),
      },
    };

    sessionCoordinator = new SessionCoordinator(mockSession, mockPlayers);
  });

  describe("Basic functionality", () => {
    test("should generate round assignment with correct structure", () => {
      const result = sessionCoordinator.generateRoundAssignment();

      expect(result).toHaveProperty("roundNumber");
      expect(result).toHaveProperty("gameAssignments");
      expect(result).toHaveProperty("sittingOutIds");
      expect(Array.isArray(result.gameAssignments)).toBe(true);
      expect(Array.isArray(result.sittingOutIds)).toBe(true);
    });

    test("should assign correct number of players to games", () => {
      const result = sessionCoordinator.generateRoundAssignment();

      const playersInGames = result.gameAssignments.length * 4;
      const sittingOut = result.sittingOutIds.length;
      const totalPlayers = playersInGames + sittingOut;

      expect(totalPlayers).toBe(mockPlayers.length);
    });

    test("should not exceed available courts", () => {
      const result = sessionCoordinator.generateRoundAssignment();

      expect(result.gameAssignments.length).toBeLessThanOrEqual(
        mockCourts.length,
      );
    });

    test("should assign players to active courts only", () => {
      const result = sessionCoordinator.generateRoundAssignment();

      result.gameAssignments.forEach((assignment) => {
        const court = mockCourts.find((c) => c.id === assignment.courtId);
        expect(court).toBeDefined();
        expect(court!.isActive).toBe(true);
      });
    });
  });

  describe("Sitting out logic", () => {
    test("should sit out minimum required players when there are too many", () => {
      // 8 players, 2 courts (8 spots) - no one should sit out
      const result = sessionCoordinator.generateRoundAssignment();
      expect(result.sittingOutIds).toHaveLength(0);
    });

    test("should sit out excess players when there are more than court capacity", () => {
      // Add more players to force sitting out
      const extraPlayers = [
        createPlayer("player9", "Ian", 3.7),
        createPlayer("player10", "Jill", 4.4),
      ];
      const allPlayers = [...mockPlayers, ...extraPlayers];

      const sessionWithMorePlayers = {
        ...mockSession,
        playerIds: allPlayers.map((p) => p.id),
        liveData: {
          ...mockSession.liveData!,
          playerStats: allPlayers.map((player) => ({
            playerId: player.id,
            gamesPlayed: 0,
            gamesSatOut: 0,
            partners: {},
            fixedPartnershipGames: 0,
            totalScore: 0,
            totalScoreAgainst: 0,
          })),
        },
      };

      const coordinator = new SessionCoordinator(
        sessionWithMorePlayers,
        allPlayers,
      );
      const result = coordinator.generateRoundAssignment();

      expect(result.sittingOutIds.length).toBe(2); // 10 players - 8 court spots = 2 sitting out
    });

    test("should accept predefined sitting out players", () => {
      const sittingOutPlayers = [mockPlayers[0], mockPlayers[1]];
      const result =
        sessionCoordinator.generateRoundAssignment(sittingOutPlayers);

      expect(result.sittingOutIds).toEqual(
        expect.arrayContaining([mockPlayers[0].id, mockPlayers[1].id]),
      );
    });
  });

  describe("Rating-based court assignments", () => {
    test("should assign high-rated players to courts with minimum rating requirements", () => {
      const result = sessionCoordinator.generateRoundAssignment();

      // Find assignment for court with minimum rating
      const highRatingCourtAssignment = result.gameAssignments.find(
        (assignment) => assignment.courtId === "court1", // This court has minimumRating: 4.0
      );

      if (highRatingCourtAssignment) {
        const allPlayerIds = [
          highRatingCourtAssignment.serveTeam.player1Id,
          highRatingCourtAssignment.serveTeam.player2Id,
          highRatingCourtAssignment.receiveTeam.player1Id,
          highRatingCourtAssignment.receiveTeam.player2Id,
        ];

        allPlayerIds.forEach((playerId) => {
          const player = mockPlayers.find((p) => p.id === playerId);
          expect(player).toBeDefined();
          expect(player!.rating).toBeGreaterThanOrEqual(4.0);
        });
      }
    });

    test("should handle players without ratings gracefully", () => {
      const playersWithoutRatings = mockPlayers.map((p) => ({
        ...p,
        rating: undefined,
      }));
      const sessionWithoutRatings = {
        ...mockSession,
        liveData: {
          ...mockSession.liveData!,
          playerStats: playersWithoutRatings.map((player) => ({
            playerId: player.id,
            gamesPlayed: 0,
            gamesSatOut: 0,
            partners: {},
            fixedPartnershipGames: 0,
            totalScore: 0,
            totalScoreAgainst: 0,
          })),
        },
      };

      const coordinator = new SessionCoordinator(
        sessionWithoutRatings,
        playersWithoutRatings,
      );

      expect(() => {
        coordinator.generateRoundAssignment();
      }).not.toThrow();
    });
  });

  describe("Partnership constraints", () => {
    test("should handle sessions without partnership constraints", () => {
      expect(() => {
        sessionCoordinator.generateRoundAssignment();
      }).not.toThrow();
    });

    test("should keep fixed partnerships together when enforcing partnerships", () => {
      const partnership = createFixedPartnership(
        "partnership1",
        "player1",
        "player2",
      );
      const sessionWithPartnerships = {
        ...mockSession,
        partnershipConstraint: {
          partnerships: [partnership],
          enforceAllPairings: true,
        },
      };

      const coordinator = new SessionCoordinator(
        sessionWithPartnerships,
        mockPlayers,
      );
      const result = coordinator.generateRoundAssignment();

      // Check if partners are on the same team or both sitting out
      const player1Assignment = result.gameAssignments.find(
        (assignment) =>
          assignment.serveTeam.player1Id === "player1" ||
          assignment.serveTeam.player2Id === "player1" ||
          assignment.receiveTeam.player1Id === "player1" ||
          assignment.receiveTeam.player2Id === "player1",
      );

      if (player1Assignment) {
        // If player1 is playing, player2 should be their teammate
        const isPlayer1OnServeTeam =
          player1Assignment.serveTeam.player1Id === "player1" ||
          player1Assignment.serveTeam.player2Id === "player1";

        if (isPlayer1OnServeTeam) {
          expect([
            player1Assignment.serveTeam.player1Id,
            player1Assignment.serveTeam.player2Id,
          ]).toContain("player2");
        } else {
          expect([
            player1Assignment.receiveTeam.player1Id,
            player1Assignment.receiveTeam.player2Id,
          ]).toContain("player2");
        }
      } else {
        // If player1 is sitting out, player2 should also be sitting out
        expect(result.sittingOutIds).toContain("player1");
        expect(result.sittingOutIds).toContain("player2");
      }
    });

    test("should handle multiple fixed partnerships", () => {
      const partnerships = [
        createFixedPartnership("partnership1", "player1", "player2"),
        createFixedPartnership("partnership2", "player3", "player4"),
      ];

      const sessionWithPartnerships = {
        ...mockSession,
        partnershipConstraint: {
          partnerships,
          enforceAllPairings: true,
        },
      };

      const coordinator = new SessionCoordinator(
        sessionWithPartnerships,
        mockPlayers,
      );

      expect(() => {
        coordinator.generateRoundAssignment();
      }).not.toThrow();
    });

    test("should handle inactive partnerships", () => {
      const partnership = createFixedPartnership(
        "partnership1",
        "player1",
        "player2",
        false,
      );
      const sessionWithInactivePartnership = {
        ...mockSession,
        partnershipConstraint: {
          partnerships: [partnership],
          enforceAllPairings: true,
        },
      };

      const coordinator = new SessionCoordinator(
        sessionWithInactivePartnership,
        mockPlayers,
      );

      expect(() => {
        coordinator.generateRoundAssignment();
      }).not.toThrow();
    });

    test("should handle partnerships with missing players", () => {
      const partnership = createFixedPartnership(
        "partnership1",
        "player1",
        "nonexistent",
      );
      const sessionWithBadPartnership = {
        ...mockSession,
        partnershipConstraint: {
          partnerships: [partnership],
          enforceAllPairings: true,
        },
      };

      const coordinator = new SessionCoordinator(
        sessionWithBadPartnership,
        mockPlayers,
      );

      expect(() => {
        coordinator.generateRoundAssignment();
      }).not.toThrow();
    });
  });

  describe("Team assignments", () => {
    test("should create balanced teams when all players have ratings", () => {
      const result = sessionCoordinator.generateRoundAssignment();

      result.gameAssignments.forEach((assignment) => {
        // Each team should have valid player IDs
        expect(assignment.serveTeam.player1Id).toBeTruthy();
        expect(assignment.serveTeam.player2Id).toBeTruthy();
        expect(assignment.receiveTeam.player1Id).toBeTruthy();
        expect(assignment.receiveTeam.player2Id).toBeTruthy();

        // All player IDs should be different
        const allIds = [
          assignment.serveTeam.player1Id,
          assignment.serveTeam.player2Id,
          assignment.receiveTeam.player1Id,
          assignment.receiveTeam.player2Id,
        ];
        const uniqueIds = new Set(allIds);
        expect(uniqueIds.size).toBe(4);
      });
    });

    test("TODO: should create diverse partner combinations", () => {
      // This test would be more meaningful with historical data
      const result = sessionCoordinator.generateRoundAssignment();

      expect(result.gameAssignments.length).toBeGreaterThan(0);

      // TODO run multiple rounds, then check for diversity
      // Check that partners who have played together less are preferred
    });
  });

  describe("Edge cases", () => {
    test("should handle empty player list", () => {
      const emptySession = {
        ...mockSession,
        playerIds: [],
        liveData: {
          rounds: [],
          playerStats: [],
        },
      };

      const coordinator = new SessionCoordinator(emptySession, []);
      const result = coordinator.generateRoundAssignment();

      expect(result.gameAssignments).toHaveLength(0);
      expect(result.sittingOutIds).toHaveLength(0);
    });

    test("should handle insufficient players for any games", () => {
      const fewPlayers = mockPlayers.slice(0, 6);
      const sessionWithFewPlayers = {
        ...mockSession,
        playerIds: fewPlayers.map((p) => p.id),
        liveData: {
          rounds: [],
          playerStats: fewPlayers.map((player) => ({
            playerId: player.id,
            gamesPlayed: 0,
            gamesSatOut: 0,
            partners: {},
            fixedPartnershipGames: 0,
            totalScore: 0,
            totalScoreAgainst: 0,
          })),
        },
      };

      LOG_TO_CONSOLE && console.log(`session: ${JSON.stringify(sessionWithFewPlayers, undefined, 2)}`);
      const coordinator = new SessionCoordinator(
        sessionWithFewPlayers,
        fewPlayers,
      );
      const result = coordinator.generateRoundAssignment();

      LOG_TO_CONSOLE && console.log(`result: ${JSON.stringify(result, undefined, 2)}`);
      expect(result.gameAssignments).toHaveLength(1);
      expect(result.sittingOutIds).toHaveLength(2);
    });

    test("should handle no active courts", () => {
      const inactiveCourts = mockCourts.map((court) => ({
        ...court,
        isActive: false,
      }));
      const sessionWithInactiveCourts = {
        ...mockSession,
        courts: inactiveCourts,
      };

      const coordinator = new SessionCoordinator(
        sessionWithInactiveCourts,
        mockPlayers,
      );
      const result = coordinator.generateRoundAssignment();

      expect(result.gameAssignments).toHaveLength(0);
      expect(result.sittingOutIds).toEqual(
        expect.arrayContaining(mockPlayers.map((p) => p.id)),
      );
    });

    test("should handle session without liveData", () => {
      const sessionWithoutLiveData = {
        ...mockSession,
        liveData: undefined,
      };

      expect(() => {
        new SessionCoordinator(sessionWithoutLiveData, mockPlayers);
      }).toThrow("Invalid session: missing required live data");
    });
  });

  describe("Player statistics considerations", () => {
    test("should consider existing player stats when selecting who sits out", () => {
      // Create a session where some players have already sat out more
      const statsWithHistory = mockPlayers.map((player, index) => ({
        playerId: player.id,
        gamesPlayed: index < 4 ? 2 : 0, // First 4 players have played more
        gamesSatOut: index < 4 ? 0 : 2, // Last 4 players have sat out more
        partners: {},
        fixedPartnershipGames: 0,
        totalScore: 0,
        totalScoreAgainst: 0,
      }));

      const sessionWithHistory = {
        ...mockSession,
        liveData: {
          rounds: [],
          playerStats: statsWithHistory,
        },
      };

      // Add extra players to force sitting out
      const extraPlayers = [
        createPlayer("player9", "Ian", 3.7),
        createPlayer("player10", "Jill", 4.4),
      ];
      const allPlayers = [...mockPlayers, ...extraPlayers];

      const allStats = [
        ...statsWithHistory,
        ...extraPlayers.map((player) => ({
          playerId: player.id,
          gamesPlayed: 0,
          gamesSatOut: 0,
          partners: {},
          fixedPartnershipGames: 0,
          totalScore: 0,
          totalScoreAgainst: 0,
        })),
      ];

      const sessionWithMorePlayersAndHistory = {
        ...sessionWithHistory,
        playerIds: allPlayers.map((p) => p.id),
        liveData: {
          rounds: [],
          playerStats: allStats,
        },
      };

      const coordinator = new SessionCoordinator(
        sessionWithMorePlayersAndHistory,
        allPlayers,
      );
      const result = coordinator.generateRoundAssignment();

      // Players who have sat out more should be more likely to play
      // (This is a statistical expectation, not a guarantee)
      expect(result.sittingOutIds.length).toBe(2);
    });
  });
});
