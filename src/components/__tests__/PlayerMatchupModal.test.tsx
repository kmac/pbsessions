import React from "react";
import { render, fireEvent, screen } from "@testing-library/react-native";
import { Provider } from "react-redux";
import { PaperProvider } from "react-native-paper";
import { configureStore } from "@reduxjs/toolkit";
import { PlayerMatchupModal } from "../PlayerMatchupModal";
import { Session, SessionState, Player } from "@/src/types";
import { v4 as uuidv4 } from "uuid";

// Mock the matchup service and display component
jest.mock("@/src/utils/playerMatchups", () => ({
  generateSessionMatchupData: jest.fn(() => ({})),
}));

jest.mock("../PlayerMatchupDisplay", () => {
  const React = require("react");
  const { View, Text } = require("react-native");
  return {
    PlayerMatchupDisplay: ({ session }: { session: any }) => (
      <View testID="player-matchup-display">
        <Text>{`Matchup Display for ${session.name}`}</Text>
      </View>
    ),
  };
});

// Mock screen util
jest.mock("@/src/utils/screenUtil", () => ({
  isNarrowScreen: jest.fn(() => false),
}));

// Mock utility functions
jest.mock("@/src/utils/util", () => ({
  getSessionPlayers: jest.fn(() => []),
}));

const createTestPlayer = (name: string): Player => ({
  id: uuidv4(),
  name,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const createTestSession = (name: string): Session => ({
  id: uuidv4(),
  name,
  dateTime: new Date().toISOString(),
  playerIds: [],
  courts: [],
  state: SessionState.Live,
  scoring: true,
  showRatings: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
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

describe("PlayerMatchupModal", () => {
  let session: Session;
  const players: Player[] = [];

  beforeEach(() => {
    session = createTestSession("Test Session");
  });

  it("renders correctly when visible", () => {
    render(
      <TestWrapper players={players}>
        <PlayerMatchupModal
          visible={true}
          session={session}
          onClose={() => {}}
        />
      </TestWrapper>,
    );

    expect(screen.getByText("Player Matchups")).toBeTruthy();
    expect(screen.getByTestId("player-matchup-display")).toBeTruthy();
  });

  it("does not render when not visible", () => {
    render(
      <TestWrapper players={players}>
        <PlayerMatchupModal
          visible={false}
          session={session}
          onClose={() => {}}
        />
      </TestWrapper>,
    );

    expect(screen.queryByText("Player Matchups")).toBeFalsy();
  });

  it("calls onClose when back button is pressed", () => {
    const mockOnClose = jest.fn();

    render(
      <TestWrapper players={players}>
        <PlayerMatchupModal
          visible={true}
          session={session}
          onClose={mockOnClose}
        />
      </TestWrapper>,
    );

    // Find and press the back button
    const backButton = screen.getByLabelText("Back");
    fireEvent.press(backButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("passes the session to PlayerMatchupDisplay", () => {
    render(
      <TestWrapper players={players}>
        <PlayerMatchupModal
          visible={true}
          session={session}
          onClose={() => {}}
        />
      </TestWrapper>,
    );

    expect(screen.getByText("Matchup Display for Test Session")).toBeTruthy();
  });
});
