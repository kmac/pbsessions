import { Player, Session, SessionState, Game, Round, Court } from "@/src/types";
import {
  parsePlayersFromCsv,
  exportSessionResultsToCsv,
} from "@/src/utils/csv";

// Mock data for testing
const mockAllPlayers: Player[] = [
  {
    id: "1",
    name: "Existing Player",
    email: "existing@test.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockPlayers: Player[] = [
  {
    id: "player1",
    name: "Alice Smith",
    email: "alice@test.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "player2",
    name: "Bob Johnson",
    email: "bob@test.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "player3",
    name: "Charlie, Wilson",
    email: "charlie@test.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "player4",
    name: 'Diana "The Ace" Brown',
    email: "diana@test.com",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockCourts: Court[] = [
  {
    id: "court1",
    name: "Court A",
    isActive: true,
  },
  {
    id: "court2",
    name: "Court B",
    isActive: true,
  },
];

const createMockGame = (
  id: string,
  courtId: string,
  servePlayer1Id: string,
  servePlayer2Id: string,
  receivePlayer1Id: string,
  receivePlayer2Id: string,
  serveScore?: number,
  receiveScore?: number,
): Game => ({
  id,
  sessionId: "session1",
  courtId,
  serveTeam: {
    player1Id: servePlayer1Id,
    player2Id: servePlayer2Id,
  },
  receiveTeam: {
    player1Id: receivePlayer1Id,
    player2Id: receivePlayer2Id,
  },
  isCompleted: serveScore !== undefined && receiveScore !== undefined,
  score:
    serveScore !== undefined && receiveScore !== undefined
      ? {
          serveScore,
          receiveScore,
        }
      : undefined,
});

const createMockSession = (
  rounds: Round[],
  playerIds: string[] = ["player1", "player2", "player3", "player4"],
): Session => ({
  id: "session1",
  name: "Test Session",
  dateTime: new Date().toISOString(),
  playerIds,
  courts: mockCourts,
  state: SessionState.Complete,
  scoring: true,
  showRatings: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  liveData:
    rounds.length > 0
      ? {
          rounds,
          playerStats: [],
        }
      : undefined,
});

describe("parsePlayersFromCsv", () => {
  describe("Valid CSV parsing", () => {
    it("should parse valid CSV with all fields", () => {
      const csvContent = `name,email,phone,gender,rating,notes
"John Doe","john@example.com","555-1234","male",4.5,"Good player"
"Jane Smith","jane@example.com","555-5678","female",3.0,"Beginner"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0]).toEqual({
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
        gender: "male",
        rating: 4.5,
        notes: "Good player",
      });
      expect(result.importedPlayers[1]).toEqual({
        name: "Jane Smith",
        email: "jane@example.com",
        phone: "555-5678",
        gender: "female",
        rating: 3.0,
        notes: "Beginner",
      });
    });

    it("should parse CSV with only required name field", () => {
      const csvContent = `name
"John Doe"
"Jane Smith"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0]).toEqual({
        name: "John Doe",
        email: undefined,
        phone: undefined,
        gender: undefined,
        rating: undefined,
        notes: undefined,
      });
    });

    it("should handle CSV with empty optional fields", () => {
      const csvContent = `name,email,phone,gender,rating,notes
"John Doe","","","","",""
"Jane Smith","jane@example.com","","female","","Good player"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0]).toEqual({
        name: "John Doe",
        email: undefined,
        phone: undefined,
        gender: undefined,
        rating: undefined,
        notes: undefined,
      });
      expect(result.importedPlayers[1]).toEqual({
        name: "Jane Smith",
        email: "jane@example.com",
        phone: undefined,
        gender: "female",
        rating: undefined,
        notes: "Good player",
      });
    });
  });

  describe("Header validation", () => {
    it("should reject CSV with invalid headers", () => {
      const csvContent = `name,email,invalidheader,gender
"John Doe","john@example.com","invalid","male"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        "Invalid header(s) found: invalidheader",
      );
      expect(result.importedPlayers).toHaveLength(0);
    });

    it("should reject CSV without name header", () => {
      const csvContent = `email,phone,gender
"john@example.com","555-1234","male"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('CSV must contain a "name" column.');
      expect(result.importedPlayers).toHaveLength(0);
    });

    it("should accept CSV with subset of valid headers", () => {
      const csvContent = `name,email,rating
"John Doe","john@example.com",4.5`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(1);
      expect(result.importedPlayers[0]).toEqual({
        name: "John Doe",
        email: "john@example.com",
        phone: undefined,
        gender: undefined,
        rating: 4.5,
        notes: undefined,
      });
    });
  });

  describe("Data validation", () => {
    it("should reject rows with empty names", () => {
      const csvContent = `name,email
"","john@example.com"
"Jane Smith","jane@example.com"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe("Row 2: Name is required");
      expect(result.importedPlayers).toHaveLength(1);
      expect(result.importedPlayers[0].name).toBe("Jane Smith");
    });

    it("should reject duplicate player names", () => {
      const csvContent = `name,email
"Existing Player","existing@example.com"
"New Player","new@example.com"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe(
        'Row 2: Player "Existing Player" already exists',
      );
      expect(result.importedPlayers).toHaveLength(1);
      expect(result.importedPlayers[0].name).toBe("New Player");
    });

    it("should validate rating range", () => {
      const csvContent = `name,rating
"John Doe",4.5
"Jane Smith",11
"Bob Johnson",-1
"Alice Brown",abc`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(3);
      expect(result.errors[0]).toContain('Row 3: Invalid rating "11"');
      expect(result.errors[1]).toContain('Row 4: Invalid rating "-1"');
      expect(result.errors[2]).toContain('Row 5: Invalid rating "abc"');
      expect(result.importedPlayers).toHaveLength(1);
      expect(result.importedPlayers[0].name).toBe("John Doe");
      expect(result.importedPlayers[0].rating).toBe(4.5);
    });

    it("should validate gender values", () => {
      const csvContent = `name,gender
"John Doe","male"
"Jane Smith","female"
"Bob Johnson","other"
"Alice Brown","invalid"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain(
        'Row 4: Invalid gender "other" (must be: male, female)',
      );
      expect(result.errors[1]).toContain(
        'Row 5: Invalid gender "invalid" (must be: male, female)',
      );
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0].gender).toBe("male");
      expect(result.importedPlayers[1].gender).toBe("female");
    });
  });

  describe("CSV format handling", () => {
    it("should handle CSV with quoted fields containing commas", () => {
      const csvContent = `name,notes
"John Doe","Good player, very skilled"
"Jane Smith","Notes with ""quotes"" inside"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0].notes).toBe("Good player, very skilled");
      expect(result.importedPlayers[1].notes).toBe(
        'Notes with "quotes" inside',
      );
    });

    it("should handle empty CSV", () => {
      const csvContent = "";

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe(
        "CSV data must contain headers and at least one data row.",
      );
      expect(result.importedPlayers).toHaveLength(0);
    });

    it("should handle CSV with only headers", () => {
      const csvContent = "name,email,phone";

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe(
        "CSV data must contain headers and at least one data row.",
      );
      expect(result.importedPlayers).toHaveLength(0);
    });
  });

  describe("Case sensitivity and trimming", () => {
    it("should handle case-insensitive headers", () => {
      const csvContent = `NAME,EMAIL,PHONE,GENDER,RATING,NOTES
"John Doe","john@example.com","555-1234","MALE",4.5,"Good player"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(1);
      expect(result.importedPlayers[0]).toEqual({
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
        gender: "male",
        rating: 4.5,
        notes: "Good player",
      });
    });

    it("should trim whitespace from values", () => {
      const csvContent = `name,email
"  John Doe  ","  john@example.com  "`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toEqual([]);
      expect(result.importedPlayers).toHaveLength(1);
      expect(result.importedPlayers[0].name).toBe("John Doe");
      expect(result.importedPlayers[0].email).toBe("john@example.com");
    });

    it("should handle case-insensitive duplicate detection", () => {
      const csvContent = `name,email
"existing player","test@example.com"`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe(
        'Row 2: Player "existing player" already exists',
      );
      expect(result.importedPlayers).toHaveLength(0);
    });
  });

  describe("Error handling", () => {
    it("should continue processing after individual row errors", () => {
      const csvContent = `name,rating
"John Doe",4.5
"",3.0
"Jane Smith","invalid"
"Bob Johnson",5.0`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toBe("Row 3: Name is required");
      expect(result.errors[1]).toContain('Row 4: Invalid rating "invalid"');
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0].name).toBe("John Doe");
      expect(result.importedPlayers[1].name).toBe("Bob Johnson");
    });

    it("should handle malformed CSV gracefully", () => {
      const csvContent = `name,email
"John Doe","john@example.com"
"Jane Smith"unclosed quote`;

      const result = parsePlayersFromCsv(mockAllPlayers, csvContent);

      // Should still process the valid row
      expect(result.importedPlayers).toHaveLength(2);
      expect(result.importedPlayers[0].name).toBe("John Doe");
    });
  });
});

describe("exportSessionResultsToCsv", () => {
  describe("Basic functionality", () => {
    it("should export session with single round and single game", () => {
      const games = [
        createMockGame(
          "game1",
          "court1",
          "player1",
          "player2",
          "player3",
          "player4",
          11,
          7,
        ),
      ];
      const rounds = [{ games, sittingOutIds: [] }];
      const session = createMockSession(rounds);

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      expect(lines).toHaveLength(2); // Header + 1 data row
      expect(lines[0]).toBe(
        "Round - Court,Serve Player 1,Serve Player 2,Serve Score,Receive Player 1,Receive Player 2,Receive Score",
      );
      expect(lines[1]).toBe(
        '1 - Court A,Alice Smith,Bob Johnson,11,"Charlie, Wilson","Diana ""The Ace"" Brown",7',
      );
    });

    it("should export session with multiple rounds and games", () => {
      const round1Games = [
        createMockGame(
          "game1",
          "court1",
          "player1",
          "player2",
          "player3",
          "player4",
          11,
          7,
        ),
        createMockGame(
          "game2",
          "court2",
          "player3",
          "player4",
          "player1",
          "player2",
          8,
          11,
        ),
      ];
      const round2Games = [
        createMockGame(
          "game3",
          "court1",
          "player1",
          "player3",
          "player2",
          "player4",
          11,
          9,
        ),
      ];
      const rounds = [
        { games: round1Games, sittingOutIds: [] },
        { games: round2Games, sittingOutIds: [] },
      ];
      const session = createMockSession(rounds);

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      expect(lines).toHaveLength(4); // Header + 3 data rows
      expect(lines[0]).toBe(
        "Round - Court,Serve Player 1,Serve Player 2,Serve Score,Receive Player 1,Receive Player 2,Receive Score",
      );
      expect(lines[1]).toBe(
        '1 - Court A,Alice Smith,Bob Johnson,11,"Charlie, Wilson","Diana ""The Ace"" Brown",7',
      );
      expect(lines[2]).toBe(
        '1 - Court B,"Charlie, Wilson","Diana ""The Ace"" Brown",8,Alice Smith,Bob Johnson,11',
      );
      expect(lines[3]).toBe(
        '2 - Court A,Alice Smith,"Charlie, Wilson",11,Bob Johnson,"Diana ""The Ace"" Brown",9',
      );
    });

    it("should handle games without scores", () => {
      const games = [
        createMockGame(
          "game1",
          "court1",
          "player1",
          "player2",
          "player3",
          "player4",
        ),
        createMockGame(
          "game2",
          "court2",
          "player3",
          "player4",
          "player1",
          "player2",
          11,
          7,
        ),
      ];
      const rounds = [{ games, sittingOutIds: [] }];
      const session = createMockSession(rounds);

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      expect(lines).toHaveLength(3); // Header + 2 data rows
      expect(lines[1]).toBe(
        '1 - Court A,Alice Smith,Bob Johnson,,"Charlie, Wilson","Diana ""The Ace"" Brown",',
      );
      expect(lines[2]).toBe(
        '1 - Court B,"Charlie, Wilson","Diana ""The Ace"" Brown",11,Alice Smith,Bob Johnson,7',
      );
    });
  });

  describe("Edge cases", () => {
    it("should handle session with no rounds", () => {
      const session = createMockSession([]);

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      expect(lines).toHaveLength(1); // Header only
      expect(lines[0]).toBe(
        "Round - Court,Serve Player 1,Serve Player 2,Serve Score,Receive Player 1,Receive Player 2,Receive Score",
      );
    });

    it("should handle session with no liveData", () => {
      const session: Session = {
        id: "session1",
        name: "Test Session",
        dateTime: new Date().toISOString(),
        playerIds: ["player1", "player2"],
        courts: mockCourts,
        state: SessionState.New,
        scoring: true,
        showRatings: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // No liveData property
      };

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      expect(lines).toHaveLength(1); // Header only
      expect(lines[0]).toBe(
        "Round - Court,Serve Player 1,Serve Player 2,Serve Score,Receive Player 1,Receive Player 2,Receive Score",
      );
    });

    it("should handle missing players gracefully", () => {
      const games = [
        createMockGame(
          "game1",
          "court1",
          "unknown1",
          "player2",
          "player3",
          "unknown2",
          11,
          7,
        ),
      ];
      const rounds = [{ games, sittingOutIds: [] }];
      const session = createMockSession(rounds);

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[1]).toBe(
        '1 - Court A,Unknown Player,Bob Johnson,11,"Charlie, Wilson",Unknown Player,7',
      );
    });

    it("should handle missing courts gracefully", () => {
      const games = [
        createMockGame(
          "game1",
          "unknownCourt",
          "player1",
          "player2",
          "player3",
          "player4",
          11,
          7,
        ),
      ];
      const rounds = [{ games, sittingOutIds: [] }];
      const session = createMockSession(rounds);

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      expect(lines).toHaveLength(2);
      expect(lines[1]).toBe(
        '1 - Unknown Court,Alice Smith,Bob Johnson,11,"Charlie, Wilson","Diana ""The Ace"" Brown",7',
      );
    });
  });

  describe("CSV escaping", () => {
    it("should properly escape player names with commas", () => {
      const games = [
        createMockGame(
          "game1",
          "court1",
          "player3",
          "player1",
          "player2",
          "player4",
          11,
          7,
        ),
      ];
      const rounds = [{ games, sittingOutIds: [] }];
      const session = createMockSession(rounds);

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      expect(lines[1]).toContain('"Charlie, Wilson"');
    });

    it("should properly escape player names with quotes", () => {
      const games = [
        createMockGame(
          "game1",
          "court1",
          "player1",
          "player4",
          "player2",
          "player3",
          11,
          7,
        ),
      ];
      const rounds = [{ games, sittingOutIds: [] }];
      const session = createMockSession(rounds);

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      expect(lines[1]).toContain('"Diana ""The Ace"" Brown"');
    });

    it("should handle court names with special characters", () => {
      const specialCourts: Court[] = [
        {
          id: "court1",
          name: "Court A, Main",
          isActive: true,
        },
        {
          id: "court2",
          name: 'Court "Premier"',
          isActive: true,
        },
      ];

      const session: Session = {
        ...createMockSession([]),
        courts: specialCourts,
        liveData: {
          rounds: [
            {
              games: [
                createMockGame(
                  "game1",
                  "court1",
                  "player1",
                  "player2",
                  "player3",
                  "player4",
                  11,
                  7,
                ),
                createMockGame(
                  "game2",
                  "court2",
                  "player1",
                  "player2",
                  "player3",
                  "player4",
                  8,
                  11,
                ),
              ],
              sittingOutIds: [],
            },
          ],
          playerStats: [],
        },
      };

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      expect(lines[1]).toContain('"1 - Court A, Main"');
      expect(lines[2]).toContain('"1 - Court ""Premier"""');
    });

    it("should handle numeric scores correctly", () => {
      const games = [
        createMockGame(
          "game1",
          "court1",
          "player1",
          "player2",
          "player3",
          "player4",
          0,
          15,
        ),
        createMockGame(
          "game2",
          "court2",
          "player1",
          "player2",
          "player3",
          "player4",
          21,
          19,
        ),
      ];
      const rounds = [{ games, sittingOutIds: [] }];
      const session = createMockSession(rounds);

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      expect(lines[1]).toContain(",0,");
      expect(lines[1]).toContain(",15");
      expect(lines[2]).toContain(",21,");
      expect(lines[2]).toContain(",19");
    });
  });

  describe("Data integrity", () => {
    it("should maintain correct round numbering", () => {
      const rounds = Array.from({ length: 5 }, (_, i) => ({
        games: [
          createMockGame(
            `game${i}`,
            "court1",
            "player1",
            "player2",
            "player3",
            "player4",
          ),
        ],
        sittingOutIds: [],
      }));
      const session = createMockSession(rounds);

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      expect(lines).toHaveLength(6); // Header + 5 data rows
      expect(lines[1]).toMatch("1 - Court A");
      expect(lines[2]).toMatch("2 - Court A");
      expect(lines[3]).toMatch("3 - Court A");
      expect(lines[4]).toMatch("4 - Court A");
      expect(lines[5]).toMatch("5 - Court A");
    });

    it("should handle empty rounds", () => {
      const rounds = [
        {
          games: [
            createMockGame(
              "game1",
              "court1",
              "player1",
              "player2",
              "player3",
              "player4",
            ),
          ],
          sittingOutIds: [],
        },
        { games: [], sittingOutIds: [] }, // Empty round
        {
          games: [
            createMockGame(
              "game2",
              "court1",
              "player1",
              "player2",
              "player3",
              "player4",
            ),
          ],
          sittingOutIds: [],
        },
      ];
      const session = createMockSession(rounds);

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      expect(lines).toHaveLength(3); // Header + 2 data rows (empty round produces no rows)
      expect(lines[1]).toMatch("1 - Court A");
      expect(lines[2]).toMatch("3 - Court A"); // Round 3, not 2, because round 2 was empty
    });

    it("should preserve original team assignments", () => {
      // Test that player1/player2 assignments are maintained correctly
      const games = [
        createMockGame(
          "game1",
          "court1",
          "player2",
          "player1",
          "player4",
          "player3",
          11,
          7,
        ),
      ];
      const rounds = [{ games, sittingOutIds: [] }];
      const session = createMockSession(rounds);

      const result = exportSessionResultsToCsv(session, mockPlayers);

      const lines = result.split("\n");
      // Should show Bob Johnson as Serve Player 1 and Alice Smith as Serve Player 2
      expect(lines[1]).toBe(
        '1 - Court A,Bob Johnson,Alice Smith,11,"Diana ""The Ace"" Brown","Charlie, Wilson",7',
      );
    });
  });
});
