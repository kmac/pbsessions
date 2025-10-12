import { 
  getRoundNumber, 
  getCurrentRoundIndex,
  getCurrentRound,
  validateLive 
} from "../sessionService";
import { Session, SessionState, Round } from "../../types";

describe("SessionService - Round Index Helpers", () => {
  let mockSession: Session;
  let mockRounds: Round[];

  beforeEach(() => {
    mockRounds = [
      { games: [], sittingOutIds: [] },
      { games: [], sittingOutIds: [] },
      { games: [], sittingOutIds: [] },
    ];

    mockSession = {
      id: "session1",
      name: "Test Session",
      dateTime: new Date().toISOString(),
      playerIds: ["player1", "player2", "player3", "player4"],
      pausedPlayerIds: [],
      courts: [
        { id: "court1", name: "Court 1", isActive: true },
        { id: "court2", name: "Court 2", isActive: true },
      ],
      state: SessionState.Live,
      scoring: false,
      showRatings: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      liveData: {
        rounds: mockRounds,
        playerStats: [],
      },
    };
  });

  describe("getRoundNumber", () => {
    test("should convert 0-based to 1-based", () => {
      expect(getRoundNumber(0)).toBe(1);
      expect(getRoundNumber(1)).toBe(2);
      expect(getRoundNumber(5)).toBe(6);
    });

    test("should handle negative numbers", () => {
      expect(getRoundNumber(-1)).toBe(0);
    });
  });

  describe("getCurrentRoundIndex", () => {
    test("should return current round index for session with rounds", () => {
      expect(getCurrentRoundIndex(mockSession)).toBe(2); // Current round is index 2
    });

    test("should return 0 for session with no rounds", () => {
      const emptySession = {
        ...mockSession,
        liveData: {
          rounds: [],
          playerStats: [],
        },
      };
      expect(getCurrentRoundIndex(emptySession)).toBe(0);
    });

    test("should return 0 for session with single round", () => {
      const singleRoundSession = {
        ...mockSession,
        liveData: {
          rounds: [{ games: [], sittingOutIds: [] }],
          playerStats: [],
        },
      };
      expect(getCurrentRoundIndex(singleRoundSession)).toBe(0);
    });

    test("should handle session without liveData", () => {
      const sessionWithoutLiveData = {
        ...mockSession,
        liveData: undefined,
      };
      expect(getCurrentRoundIndex(sessionWithoutLiveData)).toBe(0);
    });
  });

  describe("getCurrentRound", () => {
    test("should return current round for session with rounds", () => {
      const currentRound = getCurrentRound(mockSession, true);
      expect(currentRound).toEqual(mockRounds[2]); // Last round
    });

    test("should return specific round by index", () => {
      const specificRound = getCurrentRound(mockSession, true, 1);
      expect(specificRound).toEqual(mockRounds[1]);
    });

    test("should return empty round for session with no rounds", () => {
      const emptySession = {
        ...mockSession,
        liveData: {
          rounds: [],
          playerStats: [],
        },
      };
      const currentRound = getCurrentRound(emptySession, true);
      expect(currentRound).toEqual({ games: [], sittingOutIds: [] });
    });

    test("should throw error for out of bounds index", () => {
      expect(() => {
        getCurrentRound(mockSession, true, 10);
      }).toThrow("Round index 10 out of bounds");
    });

    test("should handle non-live sessions when live=false", () => {
      const nonLiveSession = {
        ...mockSession,
        state: SessionState.Complete,
      };
      expect(() => {
        getCurrentRound(nonLiveSession, false);
      }).not.toThrow();
    });
  });

  describe("validateLive", () => {
    test("should not throw for valid live session", () => {
      expect(() => {
        validateLive(mockSession);
      }).not.toThrow();
    });

    test("should throw for null session", () => {
      expect(() => {
        validateLive(undefined);
      }).toThrow("session is null");
    });

    test("should throw for non-live session", () => {
      const nonLiveSession = {
        ...mockSession,
        state: SessionState.Complete,
      };
      expect(() => {
        validateLive(nonLiveSession);
      }).toThrow("session is not live");
    });

    test("should throw for session without liveData", () => {
      const sessionWithoutLiveData = {
        ...mockSession,
        liveData: undefined,
      };
      expect(() => {
        validateLive(sessionWithoutLiveData);
      }).toThrow("session is not live");
    });
  });

  describe("Integration - Round number consistency", () => {

    test("should display correct round numbers", () => {
      const currentRoundIndex = getCurrentRoundIndex(mockSession);
      const displayRoundNumber = getRoundNumber(currentRoundIndex);

      expect(currentRoundIndex).toBe(2); // Array index
      expect(displayRoundNumber).toBe(3); // Display number (1-based)
    });

    test("should work correctly for new session", () => {
      const newSession = {
        ...mockSession,
        liveData: {
          rounds: [],
          playerStats: [],
        },
      };

      const currentRoundIndex = getCurrentRoundIndex(newSession);
      const displayRoundNumber = getRoundNumber(currentRoundIndex);

      expect(currentRoundIndex).toBe(0);
      expect(displayRoundNumber).toBe(1); // First round displays as "Round 1"
    });
  });
});
