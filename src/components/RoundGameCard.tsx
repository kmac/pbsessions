import React from "react";
import { View } from "react-native";
import { Badge, Card, Chip, Text, useTheme } from "react-native-paper";
import { Court, Player, Score } from "@/src/types";
import { isNarrowScreen } from "@/src/utils/screenUtil";

export type PlayerRenderData = {
  player: Player;
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
  chipMode: "flat" | "outlined" | undefined;
  showRating: boolean;
  handleCourtSetting?: (courtId: string) => void;
}

const GameSide: React.FC<{
  player1Data: PlayerRenderData;
  player2Data: PlayerRenderData;
  chipMode: "flat" | "outlined" | undefined;
  showRating: boolean;
}> = ({ player1Data, player2Data, chipMode, showRating }) => {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        flex: 1,
        gap: 10,
        padding: 12,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.surfaceVariant,
      }}
    >
      <View
        style={{
          flexDirection: "column",
          alignItems: "stretch",
          gap: 5,
        }}
      >
        <Chip
          mode={chipMode}
          disabled={player1Data.selectDisabled}
          elevated={!player1Data.selectDisabled}
          selected={player1Data.selected}
          onPress={() => {
            player1Data.onSelected && player1Data.onSelected();
          }}
        >
          {player1Data.player.name}
          {showRating && player1Data.player.rating && (
            <Badge
              size={22}
              style={{
                backgroundColor: theme.colors.primary,
                marginLeft: 6,
              }}
            >
              {player1Data.player.rating!.toFixed(2)}
            </Badge>
          )}
        </Chip>
        <Chip
          mode={chipMode}
          disabled={player2Data.selectDisabled}
          elevated={!player2Data.selectDisabled}
          selected={player2Data.selected}
          onPress={() => {
            player2Data.onSelected && player2Data.onSelected();
          }}
        >
          {player2Data.player.name}
          {showRating && player2Data.player.rating && (
            <Badge
              size={22}
              style={{
                backgroundColor: theme.colors.primary,
                marginLeft: 6,
              }}
            >
              {player2Data.player.rating!.toFixed(2)}
            </Badge>
          )}
        </Chip>
      </View>
    </View>
  );
};

const ScoreDisplay: React.FC<{
  serveScore: number | undefined;
  receiveScore: number | undefined;
}> = ({ serveScore, receiveScore }) => {
  const theme = useTheme();

  if (!serveScore || !receiveScore) {
    return (
      <View style={{ alignItems: "center" }}>
        <Text variant="titleMedium">vs.</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        alignItems: "center",
        marginVertical: 8,
      }}
    >
      <Chip
        style={{ backgroundColor: theme.colors.tertiaryContainer }}
        elevated={true}
      >
        <Text variant="titleSmall">
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
  chipMode,
  showRating,
  handleCourtSetting,
}) => {
  const theme = useTheme();

  return (
    <Card style={{ marginBottom: 12 }}>
      <Card.Content>
        <View
          style={{
            flexDirection: "row",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <Chip
            mode={chipMode}
            onPress={() => {
              handleCourtSetting && handleCourtSetting(court.id);
            }}
          >
            {court.isActive && (
              <Text variant="titleMedium" style={{ fontWeight: "600" }}>
                {court.name}
              </Text>
            )}
            {!court.isActive && (
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: "600",
                  textDecorationLine: "line-through",
                }}
              >
                {court.name}
              </Text>
            )}
            {court.minimumRating && (
              <Badge
                size={22}
                style={{
                  backgroundColor: theme.colors.tertiary,
                  marginLeft: 6,
                }}
              >
                {court.minimumRating.toFixed(2)}
              </Badge>
            )}
          </Chip>
        </View>

        <View
          style={{
            flexDirection: isNarrowScreen() ? "column" : "row",
            alignItems: "stretch",
            columnGap: 6,
          }}
        >
          <GameSide
            player1Data={servePlayer1Data}
            player2Data={servePlayer2Data}
            chipMode={chipMode}
            showRating={showRating}
          />
          <ScoreDisplay
            serveScore={score?.serveScore}
            receiveScore={score?.receiveScore}
          />
          <GameSide
            player1Data={receivePlayer1Data}
            player2Data={receivePlayer2Data}
            chipMode={chipMode}
            showRating={showRating}
          />
        </View>
      </Card.Content>
    </Card>
  );
};
