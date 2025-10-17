import React, { useState, useCallback, useRef, useEffect } from "react";
import { View, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Banner,
  Button,
  Card,
  Divider,
  IconButton,
  List,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { router, useLocalSearchParams } from "expo-router";
import { useAppDispatch, useAppSelector } from "@/src/store";
import { SessionState, Player } from "@/src/types";
import { PlayerStatsModal } from "@/src/components/PlayerStatsModal";
import { RoundComponent } from "@/src/components/RoundComponent";
import { TopDescription } from "@/src/components/TopDescription";
import { SessionCoordinator } from "@/src/services/sessionCoordinator";
import {
  getCurrentRoundInfo,
  getCurrentRoundNumber,
} from "@/src/services/sessionService";
import { getSessionPlayers, getSessionPausedPlayers } from "@/src/utils/util";
import { isNarrowScreen } from "@/src/utils/screenUtil";
import { Alert } from "@/src/utils/alert";
import { updateCurrentRoundThunk } from "@/src/store/actions/sessionActions";
import {
  registerCourtUpdateCallback,
  unregisterCourtUpdateCallback,
} from "@/src/store/middleware/courtUpdateListener";

export default function BetweenRoundsScreen() {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 768;
  const params = useLocalSearchParams<{
    sessionId: string;
    canEditSession?: string;
  }>();

  const sessionId = params.sessionId;
  const canEditSession = params.canEditSession === "true";

  const scrollViewRef = useRef<ScrollView>(null);
  const [statsModalVisible, setStatsModalVisible] = useState(false);

  const { players } = useAppSelector((state) => state.players);
  const { sessions } = useAppSelector((state) => state.sessions);

  const isFirstRound = () => {
    const length = sessions.find((s) => s.id === sessionId)?.liveData?.rounds
      ?.length;
    if (length) {
      return length < 1;
    }
    return true;
  };

  const [helpBannerVisible, setHelpBannerVisible] = useState(false);

  const toggleBanner = () => {
    let visible = helpBannerVisible;
    setHelpBannerVisible(!visible);
    if (!visible && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  // Use useCallback to ensure we always get fresh session data
  const handleReshufflePlayers = useCallback(() => {
    console.debug("handleReshufflePlayers: in callback");

    // Get fresh session data on each call
    const currentSession = sessions.find((s) => s.id === sessionId);

    if (!currentSession || currentSession.state !== SessionState.Live) {
      return;
    }

    const sessionPlayers: Player[] = getSessionPlayers(currentSession, players);

    const sessionCoordinator = new SessionCoordinator(
      currentSession,
      sessionPlayers,
      getSessionPausedPlayers(currentSession, players),
    );
    const roundAssignment = sessionCoordinator.generateRoundAssignment();

    if (roundAssignment.gameAssignments.length === 0) {
      Alert.alert(
        "Cannot Generate Round",
        "Unable to create game assignments. Check player and court availability.",
        [{ text: "OK" }],
      );
      return;
    }

    dispatch(
      updateCurrentRoundThunk({
        sessionId: sessionId,
        assignment: roundAssignment,
      }),
    );
  }, [sessionId, sessions, players, dispatch]);

  // Register court update callback when component mounts
  useEffect(() => {
    const handleCourtUpdate = () => {
      handleReshufflePlayers();
    };

    registerCourtUpdateCallback(sessionId, handleCourtUpdate);

    // Cleanup on unmount
    return () => {
      unregisterCourtUpdateCallback(sessionId);
    };
  }, [sessionId, handleReshufflePlayers]);

  const handleStartRound = () => {
    // Return to live-session with indication to start the round
    router.navigate({
      pathname: "/live-session",
      params: { action: "startRound" },
    });
  };

  const handleEditSession = () => {
    // Return to live-session with indication to open edit session modal
    router.navigate({
      pathname: "/live-session",
      params: { action: "editSession" },
    });
  };

  const handleClose = () => {
    router.back();
  };

  // Get current session for rendering
  const currentSession = sessions.find((s) => s.id === sessionId);

  // Early return if session not found
  if (!currentSession) {
    return null;
  }

  const { liveData, currentRound } = getCurrentRoundInfo(
    currentSession.liveData,
  );

  const playerStats = liveData.playerStats;
  const sessionPlayers: Player[] = getSessionPlayers(currentSession, players);

  return (
    <>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <Appbar.Header>
          <Appbar.BackAction onPress={handleClose} />
          <Appbar.Content
            title={
              <>
                <Text
                  variant="titleLarge"
                  style={{
                    alignItems: "center",
                    fontWeight: "600",
                  }}
                >
                  New Round
                </Text>
                <Text
                  variant="titleSmall"
                  style={{
                    alignItems: "center",
                    fontWeight: "400",
                  }}
                >
                  Round {getCurrentRoundNumber(currentSession)}
                </Text>
              </>
            }
          />
          {canEditSession && (
            <Button
              icon="pencil"
              mode="outlined"
              onPress={handleEditSession}
              compact={isNarrowScreen()}
              style={{ marginRight: 4 }}
            >
              {isNarrowScreen() ? "Session" : "Session"}
            </Button>
          )}
          <IconButton
            icon="tooltip-question"
            size={30}
            mode="contained"
            onPress={() => {
              toggleBanner();
            }}
          />
        </Appbar.Header>

        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IconButton
              icon={helpBannerVisible ? "chevron-up" : "chevron-down"}
              size={16}
              onPress={() => {
                toggleBanner();
              }}
            />
          </View>

          <Banner
            visible={helpBannerVisible}
            contentStyle={{
              width: "90%",
            }}
            actions={[
              {
                label: "Dismiss",
                onPress: () => {
                  setHelpBannerVisible(false);
                },
              },
            ]}
          >
            <View
              style={{
                alignItems: "stretch",
                marginTop: 20,
              }}
            >
              <TopDescription
                visible={true}
                description={
                  "Configure players and court settings for this round. " +
                  "Select a player or court to enable further actions. " +
                  "Start the round when ready to play."
                }
              />
              <Card>
                <List.Item
                  descriptionNumberOfLines={5}
                  title="Select Single Player"
                  description="Selecting a single player will show the number of times they have sat out."
                />
                <List.Item
                  descriptionNumberOfLines={5}
                  title="Swap Any Two Players"
                  description="Select any two players to enable the swap action. You can swap any active or sitting-out players."
                />
                <List.Item
                  descriptionNumberOfLines={5}
                  title="Long Press on Player"
                  description="Long-press on any player button to show details, pause player, or setup a fixed partnership."
                />
                <List.Item
                  descriptionNumberOfLines={5}
                  title="Courts"
                  description="Select any court to enable/disable/modify the court parameters."
                />
                <List.Item
                  descriptionNumberOfLines={5}
                  title="Reshuffle"
                  description="Create a new lineup by reshuffling all players."
                />
                <List.Item
                  descriptionNumberOfLines={5}
                  title="Start Round"
                  description="Select the 'Start Round' button to begin playing."
                />
                <Divider />
                <List.Item
                  descriptionNumberOfLines={5}
                  title="Edit Session (top right)"
                  description="View the session settings to modify courts, add players, or change session-level details (e.g. using scoring or ratings)."
                />
              </Card>
            </View>
          </Banner>

          <Surface
            style={{
              padding: 16,
              elevation: 1,
              marginBottom: 2,
            }}
          >
            <View style={{ flexDirection: "column", marginBottom: 8 }}>
              <RoundComponent
                session={currentSession}
                editing={true}
                ratingSwitch={true}
                // onSwapPlayersChange={handleSwapPlayersChange}
              />

              <View // Action buttons
                style={{
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <Button
                  icon="play"
                  mode="contained"
                  onPress={handleStartRound}
                  contentStyle={{ padding: 2 }}
                  style={isSmallScreen ? { flex: 1 } : undefined}
                >
                  Start Round
                </Button>
                <View // Action buttons
                  style={{
                    flexDirection: isSmallScreen ? "column" : "row",
                    alignContent: "space-between",
                    gap: 12,
                  }}
                >
                  <Button
                    icon="refresh"
                    mode="outlined"
                    onPress={() => {
                      handleReshufflePlayers();
                    }}
                    contentStyle={{ padding: 2 }}
                    style={isSmallScreen ? { flex: 1 } : undefined}
                  >
                    Reshuffle
                  </Button>
                  <Button
                    icon="chart-box"
                    mode="outlined"
                    onPress={() => {
                      setStatsModalVisible(true);
                    }}
                    contentStyle={{ padding: 2 }}
                    style={isSmallScreen ? { flex: 1 } : undefined}
                  >
                    {isSmallScreen ? "Stats" : "Player Stats"}
                  </Button>
                </View>
              </View>
            </View>
          </Surface>
        </ScrollView>

      </SafeAreaView>

      <PlayerStatsModal
        visible={statsModalVisible}
        players={sessionPlayers}
        stats={playerStats}
        onClose={() => {
          setStatsModalVisible(false);
        }}
      />
    </>
  );
}

