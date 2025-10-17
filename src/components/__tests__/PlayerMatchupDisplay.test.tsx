import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { PaperProvider } from "react-native-paper";
import { configureStore } from "@reduxjs/toolkit";
import { PlayerMatchupDisplay } from "../PlayerMatchupDisplay";
import { Session, SessionState, Player, Game, Round } from "@/src/types";
import { v4 as uuidv4 } from "uuid";

// Mock the matchup service
jest.mock("@/src/utils/playerMatchups", () => ({
  generateSessionMatchupData: jest.fn(),
}));

// Mock screen util
jest.mock("@/src/utils/screenUtil", () => ({
  isNarrowScreen: jest.fn(() => false),
}));

// Mock utility functions
jest.mock("@/src/utils/util", () => ({
  getSessionPlayers: jest.fn(),
  getPlayerName: jest.fn(),
}));

import { generateSessionMatchupData } from "@/src/utils/playerMatchups";
import { getSessionPlayers } from "@/src/utils/util";

const mockGenerateSessionMatchupData =
  generateSessionMatchupData as jest.MockedFunction<
    typeof generateSessionMatchupData
  >;
const mockGetSessionPlayers = getSessionPlayers as jest.MockedFunction<
  typeof getSessionPlayers
>;

// Test data
const createTestPlayer = (name: string): Player => ({
  id: uuidv4(),
  name,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createTestSession = (playerIds: string[]): Session => ({
  id: uuidv4(),
  name: "Test Session",
  dateTime: new Date().toISOString(),
  playerIds,
  courts: [{ id: uuidv4(), name: "Court 1", isActive: true }],
  state: SessionState.Live,
  scoring: true,
  showRatings: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  liveData: {
    rounds: [],
    playerStats: [],
  },
});

const createTestStore = (players: Player[]) => {
  return configureStore({
    reducer: {
      players: () => ({ players }),
    },
  });
};

const TestWrapper: React.FC<{
  children: React.ReactNode;
  players: Player[];
}> = ({ children, players }) => {
  const store = createTestStore(players);
  return (
    <Provider store={store}>
      <PaperProvider>{children}</PaperProvider>
    </Provider>
  );
};

describe("PlayerMatchupDisplay", () => {
  let player1: Player;
  let player2: Player;
  let player3: Player;
  let player4: Player;
  let players: Player[];
  let session: Session;

  beforeEach(() => {
    jest.clearAllMocks();

    player1 = createTestPlayer("Alice");
    player2 = createTestPlayer("Bob");
    player3 = createTestPlayer("Charlie");
    player4 = createTestPlayer("Diana");
    players = [player1, player2, player3, player4];
    session = createTestSession([
      player1.id,
      player2.id,
      player3.id,
      player4.id,
    ]);

    mockGetSessionPlayers.mockReturnValue(players);
  });

  it("renders empty state when no matchup data available", () => {
    mockGenerateSessionMatchupData.mockReturnValue({});
    mockGetSessionPlayers.mockReturnValue([]);

    render(
      <TestWrapper players={players}>
        <PlayerMatchupDisplay session={session} />
      </TestWrapper>,
    );

    expect(screen.getByText("No Matchup Data Available")).toBeTruthy();
    expect(
      screen.getByText(
        "Start playing games in this session to see player matchup statistics.",
      ),
    ).toBeTruthy();
  });

  it("renders player selector when matchup data is available", () => {
    const mockMatchupData = {
      [player1.id]: {
        [player2.id]: {
          partneredCount: 2,
          partneredWins: 1,
          partneredLosses: 1,
          againstCount: 1,
          againstWins: 1,
          againstLosses: 0,
          sameCourtCount: 3,
        },
      },
      [player2.id]: {
        [player1.id]: {
          partneredCount: 2,
          partneredWins: 1,
          partneredLosses: 1,
          againstCount: 1,
          againstWins: 0,
          againstLosses: 1,
          sameCourtCount: 3,
        },
      },
    };

    mockGenerateSessionMatchupData.mockReturnValue(mockMatchupData);

    render(
      <TestWrapper players={players}>
        <PlayerMatchupDisplay session={session} />
      </TestWrapper>,
    );

    expect(screen.getByText("Select Player to View Matchups")).toBeTruthy();
    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.getByText("Charlie")).toBeTruthy();
    expect(screen.getByText("Diana")).toBeTruthy();
  });

  it("displays summary view when player is selected", () => {
    const mockMatchupData = {
      [player1.id]: {
        [player2.id]: {
          partneredCount: 2,
          partneredWins: 1,
          partneredLosses: 1,
          againstCount: 1,
          againstWins: 1,
          againstLosses: 0,
          sameCourtCount: 3,
        },
        [player3.id]: {
          partneredCount: 1,
          partneredWins: 1,
          partneredLosses: 0,
          againstCount: 2,
          againstWins: 1,
          againstLosses: 1,
          sameCourtCount: 3,
        },
      },
    };

    mockGenerateSessionMatchupData.mockReturnValue(mockMatchupData);

    render(
      <TestWrapper players={players}>
        <PlayerMatchupDisplay session={session} />
      </TestWrapper>,
    );

    // Select Alice
    fireEvent.press(screen.getByText("Alice"));

    // Should show summary view by default
    expect(screen.getByText("Alice - Session Summary")).toBeTruthy();
    expect(screen.getByText("Total Games")).toBeTruthy();
    expect(screen.getByText("Win Rate")).toBeTruthy();
    expect(screen.getByText("Partners")).toBeTruthy();
    expect(screen.getByText("Opponents")).toBeTruthy();
  });

  it("switches to detailed view when selected", () => {
    const mockMatchupData = {
      [player1.id]: {
        [player2.id]: {
          partneredCount: 2,
          partneredWins: 1,
          partneredLosses: 1,
          againstCount: 1,
          againstWins: 1,
          againstLosses: 0,
          sameCourtCount: 3,
        },
      },
    };

    mockGenerateSessionMatchupData.mockReturnValue(mockMatchupData);

    render(
      <TestWrapper players={players}>
        <PlayerMatchupDisplay session={session} />
      </TestWrapper>,
    );

    // Select Alice
    fireEvent.press(screen.getByText("Alice"));

    // Switch to detailed view
    fireEvent.press(screen.getByText("Details"));

    expect(screen.getByPlaceholderText("Search players...")).toBeTruthy();
    expect(screen.getByText("Player")).toBeTruthy();
    expect(screen.getByText("Partnered")).toBeTruthy();
    expect(screen.getByText("Against")).toBeTruthy();
  });

  it("shows heatmap view when selected", () => {
    const mockMatchupData = {
      [player1.id]: {
        [player2.id]: {
          partneredCount: 2,
          partneredWins: 1,
          partneredLosses: 1,
          againstCount: 1,
          againstWins: 1,
          againstLosses: 0,
          sameCourtCount: 3,
        },
      },
      [player2.id]: {
        [player1.id]: {
          partneredCount: 2,
          partneredWins: 1,
          partneredLosses: 1,
          againstCount: 1,
          againstWins: 0,
          againstLosses: 1,
          sameCourtCount: 3,
        },
      },
    };

    mockGenerateSessionMatchupData.mockReturnValue(mockMatchupData);

    render(
      <TestWrapper players={players}>
        <PlayerMatchupDisplay session={session} />
      </TestWrapper>,
    );

    // Switch to heatmap view
    fireEvent.press(screen.getByText("Heatmap"));

    expect(screen.getByText("Court Time Heatmap")).toBeTruthy();
    expect(
      screen.getByText("Intensity shows total games played on same court"),
    ).toBeTruthy();
  });

  it("filters players in detailed view when searching", () => {
    const mockMatchupData = {
      [player1.id]: {
        [player2.id]: {
          partneredCount: 2,
          partneredWins: 1,
          partneredLosses: 1,
          againstCount: 1,
          againstWins: 1,
          againstLosses: 0,
          sameCourtCount: 3,
        },
        [player3.id]: {
          partneredCount: 1,
          partneredWins: 1,
          partneredLosses: 0,
          againstCount: 2,
          againstWins: 1,
          againstLosses: 1,
          sameCourtCount: 3,
        },
      },
    };

    mockGenerateSessionMatchupData.mockReturnValue(mockMatchupData);

    render(
      <TestWrapper players={players}>
        <PlayerMatchupDisplay session={session} />
      </TestWrapper>,
    );

    // Select Alice and switch to detailed view
    fireEvent.press(screen.getByText("Alice"));
    fireEvent.press(screen.getByText("Details"));

    // Search for "Bob"
    const searchInput = screen.getByPlaceholderText("Search players...");
    fireEvent.changeText(searchInput, "Bob");

    // Should show Bob but not Charlie in the table
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.queryByText("Charlie")).toBeFalsy();
  });

  it("handles session without scoring correctly", () => {
    const sessionWithoutScoring = {
      ...session,
      scoring: false,
    };

    const mockMatchupData = {
      [player1.id]: {
        [player2.id]: {
          partneredCount: 2,
          partneredWins: 0, // No wins tracked when scoring disabled
          partneredLosses: 0,
          againstCount: 1,
          againstWins: 0,
          againstLosses: 0,
          sameCourtCount: 3,
        },
      },
    };

    mockGenerateSessionMatchupData.mockReturnValue(mockMatchupData);

    render(
      <TestWrapper players={players}>
        <PlayerMatchupDisplay session={sessionWithoutScoring} />
      </TestWrapper>,
    );

    // Select Alice and switch to detailed view
    fireEvent.press(screen.getByText("Alice"));
    fireEvent.press(screen.getByText("Details"));

    // Win % column should not be present when scoring is disabled
    expect(screen.queryByText("Win %")).toBeFalsy();
  });
});
