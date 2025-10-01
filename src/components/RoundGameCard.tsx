import React from "react";
import { View } from "react-native";
import { Badge, Card, Chip, Icon, Text, useTheme } from "react-native-paper";
import { Court, CourtLayout, Player, PlayerStats, Score } from "@/src/types";
import { isNarrowScreen } from "@/src/utils/screenUtil";
import { PlayerButton } from "./PlayerButton";
import { CourtButton } from "./CourtButton";

const useBadge = false;
const useTextVariant = true;

export const getPlayerText = (name: string) => {
  if (useTextVariant) {
    const variant = name.length > 12 ? "labelLarge" : "labelLarge";
    //const variant = name.length > 100 ? "titleSmall" : "titleMedium";
    return <Text variant={variant}>{name}</Text>;
  }
  const fontSize = name.length > 12 ? 14 : 15;
  return (
    <Text
      style={{
        fontSize: fontSize,
        fontWeight: "500",
      }}
    >
      {name}
    </Text>
  );
};

export const getPlayerRating = (rating: number, theme: any) => {
  if (useBadge) {
    return (
      <Badge
        size={20}
        style={{
          fontSize: 10,
          color: theme.colors.onPrimary,
          backgroundColor: theme.colors.primary,
        }}
      >
        {rating.toFixed(2)}
      </Badge>
    );
  }
  if (useTextVariant) {
    return (
      <Text
        variant="labelSmall"
        style={{
          color: theme.colors.tertiary,
          //fontSize: 9,
          fontWeight: "400",
          alignSelf: /*"center"*/ "flex-end",
          marginLeft: isNarrowScreen() ? 0 : 8,
        }}
      >
        {rating.toFixed(2)}
      </Text>
    );
  }
  return (
    <Text
      //variant="bodySmall"
      style={{
        color: theme.colors.tertiary,
        fontSize: 9,
        alignSelf: /*"center"*/ "flex-end",
        marginLeft: isNarrowScreen() ? 0 : 8,
      }}
    >
      {rating.toFixed(2)}
    </Text>
  );
};

export const getPartnerDecoration = (theme: any) => {
  const useIcon = true;
  if (useIcon) {
    return <Icon source="vector-link" size={12} color={theme.colors.primary} />;
  } else {
    return (
      <Badge
        size={12}
        style={{
          //fontSize: 10,
          color: theme.colors.onPrimary,
          backgroundColor: theme.colors.primary,
        }}
      >
        P
      </Badge>
    );
  }
};

export type PlayerRenderData = {
  player: Player;
  partner?: Player;
  stats?: PlayerStats;
  selected: boolean;
  selectDisabled: boolean;
  onSelected?: () => void;
};

interface RoundGameCardProps {
  servePlayer1Data: PlayerRenderData;
  servePlayer2Data: PlayerRenderData;
  receivePlayer1Data: PlayerRenderData;
  receivePlayer2Data: PlayerRenderData;
  court: Court;
  score?: Score;
  showRating: boolean;
  handleCourtSetting?: (courtId: string) => void;
  courtLayout?: CourtLayout;
}

const GameSide: React.FC<{
  player1Data: PlayerRenderData;
  player2Data: PlayerRenderData;
  courtLayout: CourtLayout;
  showRating: boolean;
}> = ({ player1Data, player2Data, courtLayout, showRating }) => {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: courtLayout === "horizontal" ? 4 : 12,
        borderRadius: 8,
        justifyContent: "center",
        backgroundColor: theme.colors.surfaceVariant,
      }}
    >
      <View
        style={{
          flexDirection: courtLayout === "horizontal" ? "column" : "row",
          alignItems: "stretch",
        justifyContent: "center",
          gap: 8,
        }}
      >
        <PlayerButton
          player={player1Data.player}
          partner={player1Data.partner}
          stats={player1Data.stats}
          selected={player1Data.selected}
          disabled={player1Data.selectDisabled}
          showRating={showRating}
          onPress={player1Data.onSelected}
        />

        <PlayerButton
          player={player2Data.player}
          partner={player2Data.partner}
          stats={player2Data.stats}
          selected={player2Data.selected}
          disabled={player2Data.selectDisabled}
          showRating={showRating}
          onPress={player2Data.onSelected}
        />
      </View>
    </View>
  );
};

const ScoreDisplay: React.FC<{
  serveScore: number | undefined;
  receiveScore: number | undefined;
}> = ({ serveScore, receiveScore }) => {
  const theme = useTheme();

  if (serveScore === undefined || !receiveScore === undefined) {
    return (
      <View
        style={{
          alignItems: "center",
        }}
      >
        <Text variant="titleSmall">vs.</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        // alignItems: "center",
        marginVertical: 4,
      }}
    >
      <Chip
        style={{ backgroundColor: theme.colors.tertiaryContainer }}
        elevated={true}
      >
        <Text variant="labelSmall">
          {serveScore} - {receiveScore}
        </Text>
      </Chip>
    </View>
  );
};

export const RoundGameCard: React.FC<RoundGameCardProps> = ({
  servePlayer1Data,
  servePlayer2Data,
  receivePlayer1Data,
  receivePlayer2Data,
  court,
  score,
  showRating,
  handleCourtSetting,
  courtLayout = "horizontal",
}) => {
  const theme = useTheme();

  return (
    <Card
      style={{
        marginBottom: 8,
      }}
    >
      <Card.Content>
        {/* Court */}
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 8,
            flex: 1,
          }}
        >
          <CourtButton
            court={court}
            disabled={false}
            onPress={() => {
              handleCourtSetting && handleCourtSetting(court.id);
            }}
          />
        </View>

        {/* Full Game */}
        <View
          style={{
            flexDirection: "column",
            alignItems: "stretch", // "center"
          }}
        >
          <View
            style={{
              flexDirection: courtLayout === "vertical" ? "column" : "row",
              alignItems: courtLayout === "vertical" ? "center" : "stretch",
              //columnGap: 8,
              gap: 8,
              // backgroundColor: theme.colors.surfaceVariant,
            }}
          >
            <GameSide
              player1Data={servePlayer1Data}
              player2Data={servePlayer2Data}
              courtLayout={courtLayout}
              showRating={showRating}
            />
            {courtLayout === "vertical" && score && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <ScoreDisplay
                  serveScore={score?.serveScore}
                  receiveScore={score?.receiveScore}
                />
              </View>
            )}
            <GameSide
              player1Data={receivePlayer1Data}
              player2Data={receivePlayer2Data}
              courtLayout={courtLayout}
              showRating={showRating}
            />
          </View>
          {courtLayout === "horizontal" && score && (
            <View
              style={{
                alignItems: "center",
              }}
            >
              <ScoreDisplay
                serveScore={score?.serveScore}
                receiveScore={score?.receiveScore}
              />
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
};
