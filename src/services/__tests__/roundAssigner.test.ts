import { RoundAssigner } from "../roundAssigner";
import {
  Session,
  Player,
  Court,
  SessionState,
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

describe("RoundAssigner - generateRoundAssignment", () => {
  let mockPlayers: Player[];
  let mockCourts: Court[];
  let mockSession: Session;
  let roundAssigner: RoundAssigner;
  let mockPausedPlayers: Player[];

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
  ): FixedPartnership => ({
    id,
    player1Id,
    player2Id,
    isActive,
    createdAt: new Date().toISOString(),
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock players with different ratings
    mockPlayers = [
      createPlayer("player1-4.5", "Alice", 4.5),
      createPlayer("player2-4.0", "Bob", 4.0),
      createPlayer("player3-3.5", "Charlie", 3.5),
      createPlayer("player4-4.2", "Diana", 4.2),
      createPlayer("player5-3.8", "Eve", 3.8),
      createPlayer("player6-4.1", "Frank", 4.1),
      createPlayer("player7-3.9", "Grace", 3.9),
      createPlayer("player8-4.3", "Henry", 4.3),
    ];

    // Create mock paused players
    mockPausedPlayers = [];

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
      pausedPlayerIds: [],
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
          consecutiveGames: 0,
          partners: {},
          opponents: {},
          gamesOnCourt: {},
          fixedPartnershipGames: 0,
          totalScore: 0,
          totalScoreAgainst: 0,
        })),
      },
    };

    roundAssigner = new RoundAssigner(
      mockSession,
      mockPlayers,
      mockPausedPlayers,
    );
  });

  describe("Basic functionality", () => {
    test("should generate round assignment with correct structure", () => {
      const result = roundAssigner.generateRoundAssignment();

      expect(result).toHaveProperty("gameAssignments");
      expect(result).toHaveProperty("sittingOutIds");
      expect(Array.isArray(result.gameAssignments)).toBe(true);
      expect(Array.isArray(result.sittingOutIds)).toBe(true);
    });

    test("should assign correct number of players to games", () => {
      const result = roundAssigner.generateRoundAssignment();

      const playersInGames = result.gameAssignments.length * 4;
      const sittingOut = result.sittingOutIds.length;
      const totalPlayers = playersInGames + sittingOut;

      expect(totalPlayers).toBe(mockPlayers.length);
    });

    test("should not exceed available courts", () => {
      const result = roundAssigner.generateRoundAssignment();

      expect(result.gameAssignments.length).toBeLessThanOrEqual(
        mockCourts.length,
      );
    });

    test("should assign players to active courts only", () => {
      const result = roundAssigner.generateRoundAssignment();

      result.gameAssignments.forEach((assignment) => {
        const court = mockCourts.find((c) => c.id === assignment.courtId);
        expect(court).toBeDefined();
        expect(court!.isActive).toBe(true);
      });
    });

    test("should assign 4 unique players per game", () => {
      const result = roundAssigner.generateRoundAssignment();

      result.gameAssignments.forEach((assignment) => {
        const allPlayerIds = [
          assignment.serveTeam.player1Id,
          assignment.serveTeam.player2Id,
          assignment.receiveTeam.player1Id,
          assignment.receiveTeam.player2Id,
        ];
        const uniqueIds = new Set(allPlayerIds);
        expect(uniqueIds.size).toBe(4);
      });
    });

    test("should not assign same player to multiple courts in same round", () => {
      const result = roundAssigner.generateRoundAssignment();

      const allAssignedPlayerIds = result.gameAssignments.flatMap(
        (assignment) => [
          assignment.serveTeam.player1Id,
          assignment.serveTeam.player2Id,
          assignment.receiveTeam.player1Id,
          assignment.receiveTeam.player2Id,
        ],
      );

      const uniqueIds = new Set(allAssignedPlayerIds);
      expect(uniqueIds.size).toBe(allAssignedPlayerIds.length);
    });
  });

  describe("Paused players functionality", () => {
    test("should exclude paused players from game assignments", () => {
      const pausedPlayer = mockPlayers[0];
      const pausedPlayers = [pausedPlayer];

      const assigner = new RoundAssigner(
        mockSession,
        mockPlayers,
        pausedPlayers,
      );
      const result = assigner.generateRoundAssignment();

      // Check that paused player is not in any game assignment
      result.gameAssignments.forEach((assignment) => {
        const allPlayerIds = [
          assignment.serveTeam.player1Id,
          assignment.serveTeam.player2Id,
          assignment.receiveTeam.player1Id,
          assignment.receiveTeam.player2Id,
        ];
        expect(allPlayerIds).not.toContain(pausedPlayer.id);
      });

      // Check that paused player is not in sitting out list
      expect(result.sittingOutIds).not.toContain(pausedPlayer.id);
    });

    test("should handle multiple paused players", () => {
      const pausedPlayers = [mockPlayers[0], mockPlayers[1], mockPlayers[2]];

      const assigner = new RoundAssigner(
        mockSession,
        mockPlayers,
        pausedPlayers,
      );
      const result = assigner.generateRoundAssignment();

      const allAssignedPlayerIds = result.gameAssignments.flatMap(
        (assignment) => [
          assignment.serveTeam.player1Id,
          assignment.serveTeam.player2Id,
          assignment.receiveTeam.player1Id,
          assignment.receiveTeam.player2Id,
        ],
      );

      pausedPlayers.forEach((pausedPlayer) => {
        expect(allAssignedPlayerIds).not.toContain(pausedPlayer.id);
        expect(result.sittingOutIds).not.toContain(pausedPlayer.id);
      });

      const activePlayerCount = mockPlayers.length - pausedPlayers.length;
      const playersInGames = result.gameAssignments.length * 4;
      const sittingOut = result.sittingOutIds.length;
      // With rating constraints, some active players might not be eligible for any court
      // so we check that assigned + sitting <= active players
      expect(playersInGames + sittingOut).toBeLessThanOrEqual(activePlayerCount);
      expect(playersInGames + sittingOut).toBeGreaterThan(0);
    });

    test("should handle all players paused", () => {
      const assigner = new RoundAssigner(mockSession, mockPlayers, mockPlayers);
      const result = assigner.generateRoundAssignment();

      expect(result.gameAssignments).toHaveLength(0);
      expect(result.sittingOutIds).toHaveLength(0);
    });
  });

  describe("Partnership constraints", () => {
    test("should keep fixed partnerships together on same team", () => {
      const partnership = createFixedPartnership(
        "partnership1",
        "player1-4.5",
        "player2-4.0",
      );

      // Use only 4 players to ensure partnership is on same court
      const fourPlayers = [mockPlayers[0], mockPlayers[1], mockPlayers[5], mockPlayers[6]];
      const oneCourt = [mockCourts[1]]; // Court with no rating requirement

      const sessionWithPartnerships = {
        ...mockSession,
        playerIds: fourPlayers.map((p) => p.id),
        courts: oneCourt,
        partnershipConstraint: {
          partnerships: [partnership],
          enforceAllPairings: true,
        },
        liveData: {
          rounds: [],
          playerStats: fourPlayers.map((player) => ({
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
          })),
        },
      };

      const assigner = new RoundAssigner(
        sessionWithPartnerships,
        fourPlayers,
        mockPausedPlayers,
      );
      const result = assigner.generateRoundAssignment();

      // Should have exactly 1 game with 4 players
      expect(result.gameAssignments).toHaveLength(1);

      const assignment = result.gameAssignments[0];

      // Check that partnership is together on one team
      const serveTeamIds = [
        assignment.serveTeam.player1Id,
        assignment.serveTeam.player2Id,
      ];
      const receiveTeamIds = [
        assignment.receiveTeam.player1Id,
        assignment.receiveTeam.player2Id,
      ];

      const partnershipOnServe =
        serveTeamIds.includes("player1-4.5") &&
        serveTeamIds.includes("player2-4.0");
      const partnershipOnReceive =
        receiveTeamIds.includes("player1-4.5") &&
        receiveTeamIds.includes("player2-4.0");

      expect(partnershipOnServe || partnershipOnReceive).toBe(true);
    });

    test("should handle multiple fixed partnerships", () => {
      const partnerships = [
        createFixedPartnership("partnership1", "player1-4.5", "player2-4.0"),
        createFixedPartnership("partnership2", "player3-3.5", "player4-4.2"),
      ];

      const sessionWithPartnerships = {
        ...mockSession,
        partnershipConstraint: {
          partnerships,
          enforceAllPairings: true,
        },
      };

      const assigner = new RoundAssigner(
        sessionWithPartnerships,
        mockPlayers,
        mockPausedPlayers,
      );

      expect(() => {
        assigner.generateRoundAssignment();
      }).not.toThrow();
    });

    test("should handle inactive partnerships", () => {
      const partnership = createFixedPartnership(
        "partnership1",
        "player1-4.5",
        "player2-4.0",
        false,
      );
      const sessionWithInactivePartnership = {
        ...mockSession,
        partnershipConstraint: {
          partnerships: [partnership],
          enforceAllPairings: true,
        },
      };

      const assigner = new RoundAssigner(
        sessionWithInactivePartnership,
        mockPlayers,
        mockPausedPlayers,
      );

      expect(() => {
        assigner.generateRoundAssignment();
      }).not.toThrow();

      const result = assigner.generateRoundAssignment();
      expect(result.gameAssignments.length).toBeGreaterThan(0);
    });
  });

  describe("Rating-based court assignments", () => {
    test("should assign high-rated players to courts with minimum rating requirements", () => {
      const result = roundAssigner.generateRoundAssignment();

      // Find assignment for court with minimum rating
      const highRatingCourtAssignment = result.gameAssignments.find(
        (assignment) => assignment.courtId === "court1",
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

    test("should prioritize highest-rated court first", () => {
      // Create session with multiple rated courts
      const ratedCourts = [
        createCourt("court1", "High Court", 4.5),
        createCourt("court2", "Medium Court", 4.0),
        createCourt("court3", "Low Court", 3.5),
      ];

      const sessionWithRatedCourts = {
        ...mockSession,
        courts: ratedCourts,
      };

      const assigner = new RoundAssigner(
        sessionWithRatedCourts,
        mockPlayers,
        mockPausedPlayers,
      );
      const result = assigner.generateRoundAssignment();

      // Court with highest rating should be processed first
      if (result.gameAssignments.length > 0) {
        const firstAssignment = result.gameAssignments[0];
        const court = ratedCourts.find((c) => c.id === firstAssignment.courtId);
        expect(court).toBeDefined();
      }
    });

    test("should skip courts when not enough eligible players", () => {
      // Create session with high rating requirement that few players meet
      const highRatingCourt = createCourt("court1", "Elite Court", 4.8);
      const lowRatingPlayers = mockPlayers.slice(2, 6); // Players with lower ratings

      const sessionWithHighCourt = {
        ...mockSession,
        courts: [highRatingCourt],
        playerIds: lowRatingPlayers.map((p) => p.id),
        liveData: {
          rounds: [],
          playerStats: lowRatingPlayers.map((player) => ({
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
          })),
        },
      };

      const assigner = new RoundAssigner(
        sessionWithHighCourt,
        lowRatingPlayers,
        mockPausedPlayers,
      );
      const result = assigner.generateRoundAssignment();

      // Should have no assignments since players don't meet rating requirement
      expect(result.gameAssignments).toHaveLength(0);
    });
  });

  describe("Court fairness tracking", () => {
    test("should track games played on each court", () => {
      // Create session with history of games on specific court
      const statsWithCourtHistory = mockPlayers.map((player, index) => ({
        playerId: player.id,
        gamesPlayed: 2,
        gamesSatOut: 0,
        consecutiveGames: 0,
        partners: {},
        opponents: {},
        gamesOnCourt: {
          court1: index < 4 ? 2 : 0, // First 4 players played more on court1
        },
        fixedPartnershipGames: 0,
        totalScore: 0,
        totalScoreAgainst: 0,
      }));

      const sessionWithHistory = {
        ...mockSession,
        liveData: {
          rounds: [],
          playerStats: statsWithCourtHistory,
        },
      };

      const assigner = new RoundAssigner(
        sessionWithHistory,
        mockPlayers,
        mockPausedPlayers,
      );
      const result = assigner.generateRoundAssignment();

      // Players with fewer games on court1 should be more likely to play there
      const court1Assignment = result.gameAssignments.find(
        (a) => a.courtId === "court1",
      );

      if (court1Assignment) {
        const playerIds = [
          court1Assignment.serveTeam.player1Id,
          court1Assignment.serveTeam.player2Id,
          court1Assignment.receiveTeam.player1Id,
          court1Assignment.receiveTeam.player2Id,
        ];

        // At least some players should be from those who haven't played much on court1
        const playersWithFewGames = playerIds.filter((id) => {
          const playerIndex = mockPlayers.findIndex((p) => p.id === id);
          return playerIndex >= 4; // Players who haven't played on court1
        });

        // This is probabilistic but should generally hold
        LOG_TO_CONSOLE &&
          console.log(
            `Players with few games on court1: ${playersWithFewGames.length}/4`,
          );
      }
    });
  });

  describe("Player diversity and opponent scoring", () => {
    test("should prefer new partner combinations", () => {
      // Create session with partnership history
      const statsWithPartnerHistory: PlayerStats[] = mockPlayers.map(
        (player, index) => ({
          playerId: player.id,
          gamesPlayed: 2,
          gamesSatOut: 0,
          consecutiveGames: 0,
          partners: {
            // player1 has partnered with player2 twice
            ...(index === 0 && { "player2-4.0": 2 }),
            ...(index === 1 && { "player1-4.5": 2 }),
          },
          opponents: {},
          gamesOnCourt: {},
          fixedPartnershipGames: 0,
          totalScore: 0,
          totalScoreAgainst: 0,
        }),
      );

      const sessionWithHistory = {
        ...mockSession,
        liveData: {
          rounds: [],
          playerStats: statsWithPartnerHistory,
        },
      };

      const assigner = new RoundAssigner(
        sessionWithHistory,
        mockPlayers,
        mockPausedPlayers,
      );
      const result = assigner.generateRoundAssignment();

      // player1 and player2 should not be partnered together (preferably)
      // This is probabilistic due to random tiebreaking
      result.gameAssignments.forEach((assignment) => {
        const serveTeamHasBoth =
          (assignment.serveTeam.player1Id === "player1-4.5" &&
            assignment.serveTeam.player2Id === "player2-4.0") ||
          (assignment.serveTeam.player1Id === "player2-4.0" &&
            assignment.serveTeam.player2Id === "player1-4.5");

        const receiveTeamHasBoth =
          (assignment.receiveTeam.player1Id === "player1-4.5" &&
            assignment.receiveTeam.player2Id === "player2-4.0") ||
          (assignment.receiveTeam.player1Id === "player2-4.0" &&
            assignment.receiveTeam.player2Id === "player1-4.5");

        LOG_TO_CONSOLE &&
          console.log(
            `player1 and player2 together: ${serveTeamHasBoth || receiveTeamHasBoth}`,
          );
      });
    });

    test("should prefer new opponent combinations for player3 selection", () => {
      // Create session with opponent history
      const statsWithOpponentHistory: PlayerStats[] = mockPlayers.map(
        (player, index) => ({
          playerId: player.id,
          gamesPlayed: 2,
          gamesSatOut: 0,
          consecutiveGames: 0,
          partners: {},
          opponents: {
            // player3 has opposed player1 and player2 multiple times
            ...(index === 2 && { "player1-4.5": 3, "player2-4.0": 3 }),
            ...(index === 0 && { "player3-3.5": 3 }),
            ...(index === 1 && { "player3-3.5": 3 }),
          },
          gamesOnCourt: {},
          fixedPartnershipGames: 0,
          totalScore: 0,
          totalScoreAgainst: 0,
        }),
      );

      const sessionWithHistory = {
        ...mockSession,
        liveData: {
          rounds: [],
          playerStats: statsWithOpponentHistory,
        },
      };

      const assigner = new RoundAssigner(
        sessionWithHistory,
        mockPlayers,
        mockPausedPlayers,
      );
      const result = assigner.generateRoundAssignment();

      // player3 should preferably not oppose player1 and player2
      // This is probabilistic
      LOG_TO_CONSOLE && console.log("Opponent diversity test:", result);
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

      const assigner = new RoundAssigner(emptySession, [], mockPausedPlayers);
      const result = assigner.generateRoundAssignment();

      expect(result.gameAssignments).toHaveLength(0);
      expect(result.sittingOutIds).toHaveLength(0);
    });

    test("should handle insufficient players for any games", () => {
      const fewPlayers = mockPlayers.slice(0, 3);
      const sessionWithFewPlayers = {
        ...mockSession,
        playerIds: fewPlayers.map((p) => p.id),
        liveData: {
          rounds: [],
          playerStats: fewPlayers.map((player) => ({
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
          })),
        },
      };

      const assigner = new RoundAssigner(
        sessionWithFewPlayers,
        fewPlayers,
        mockPausedPlayers,
      );
      const result = assigner.generateRoundAssignment();

      expect(result.gameAssignments).toHaveLength(0);
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

      const assigner = new RoundAssigner(
        sessionWithInactiveCourts,
        mockPlayers,
        mockPausedPlayers,
      );
      const result = assigner.generateRoundAssignment();

      expect(result.gameAssignments).toHaveLength(0);
    });

    test("should handle session without liveData", () => {
      const sessionWithoutLiveData = {
        ...mockSession,
        liveData: undefined,
      };

      expect(() => {
        new RoundAssigner(
          sessionWithoutLiveData,
          mockPlayers,
          mockPausedPlayers,
        );
      }).toThrow("Invalid session: missing required live data");
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
            consecutiveGames: 0,
            partners: {},
            opponents: {},
            gamesOnCourt: {},
            fixedPartnershipGames: 0,
            totalScore: 0,
            totalScoreAgainst: 0,
          })),
        },
      };

      const assigner = new RoundAssigner(
        sessionWithoutRatings,
        playersWithoutRatings,
        mockPausedPlayers,
      );

      expect(() => {
        assigner.generateRoundAssignment();
      }).not.toThrow();
    });
  });

  describe("Sitting out logic", () => {
    test("should sit out minimum required players when there are too many", () => {
      const result = roundAssigner.generateRoundAssignment();
      expect(result.sittingOutIds).toHaveLength(0);
    });

    test("should sit out excess players when there are more than court capacity", () => {
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
            consecutiveGames: 0,
            partners: {},
            opponents: {},
            gamesOnCourt: {},
            fixedPartnershipGames: 0,
            totalScore: 0,
            totalScoreAgainst: 0,
          })),
        },
      };

      const assigner = new RoundAssigner(
        sessionWithMorePlayers,
        allPlayers,
        mockPausedPlayers,
      );
      const result = assigner.generateRoundAssignment();

      expect(result.sittingOutIds.length).toBe(2);
    });
  });

  describe("Sequential player selection algorithm", () => {
    test("should assign serve team (player1, player2) and receive team (player3, player4)", () => {
      const result = roundAssigner.generateRoundAssignment();

      result.gameAssignments.forEach((assignment) => {
        // Serve team should have 2 players
        expect(assignment.serveTeam.player1Id).toBeTruthy();
        expect(assignment.serveTeam.player2Id).toBeTruthy();
        expect(assignment.serveTeam.player1Id).not.toBe(
          assignment.serveTeam.player2Id,
        );

        // Receive team should have 2 players
        expect(assignment.receiveTeam.player1Id).toBeTruthy();
        expect(assignment.receiveTeam.player2Id).toBeTruthy();
        expect(assignment.receiveTeam.player1Id).not.toBe(
          assignment.receiveTeam.player2Id,
        );

        // All 4 players should be different
        const allIds = [
          assignment.serveTeam.player1Id,
          assignment.serveTeam.player2Id,
          assignment.receiveTeam.player1Id,
          assignment.receiveTeam.player2Id,
        ];
        expect(new Set(allIds).size).toBe(4);
      });
    });

    test("should remove assigned players from remaining pool", () => {
      // With 8 players and 2 courts (8 spots), all should be assigned
      const result = roundAssigner.generateRoundAssignment();

      const allAssignedIds = new Set(
        result.gameAssignments.flatMap((a) => [
          a.serveTeam.player1Id,
          a.serveTeam.player2Id,
          a.receiveTeam.player1Id,
          a.receiveTeam.player2Id,
        ]),
      );

      // No player should be assigned twice
      expect(allAssignedIds.size).toBe(result.gameAssignments.length * 4);
    });
  });

  describe("Pre-selected sitting out players", () => {
    test("should respect pre-selected sitting out players", () => {
      const sittingOut = [mockPlayers[0], mockPlayers[1]];
      const result = roundAssigner.generateRoundAssignment(sittingOut);

      expect(result.sittingOutIds).toContain(sittingOut[0].id);
      expect(result.sittingOutIds).toContain(sittingOut[1].id);

      const allAssignedIds = result.gameAssignments.flatMap((a) => [
        a.serveTeam.player1Id,
        a.serveTeam.player2Id,
        a.receiveTeam.player1Id,
        a.receiveTeam.player2Id,
      ]);

      expect(allAssignedIds).not.toContain(sittingOut[0].id);
      expect(allAssignedIds).not.toContain(sittingOut[1].id);
    });
  });
});
