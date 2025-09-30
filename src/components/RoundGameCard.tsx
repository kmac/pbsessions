import React from "react";
import { View, StyleSheet } from "react-native";
import { Badge, Card, Chip, Icon, Text, useTheme } from "react-native-paper";
import { Court, CourtLayout, Player, PlayerStats, Score } from "@/src/types";
import { isNarrowScreen } from "@/src/utils/screenUtil";

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
  chipMode: "flat" | "outlined" | undefined;
  showRating: boolean;
  handleCourtSetting?: (courtId: string) => void;
  courtLayout?: CourtLayout;
}

const GameSide: React.FC<{
  player1Data: PlayerRenderData;
  player2Data: PlayerRenderData;
  chipMode: "flat" | "outlined" | undefined;
  showRating: boolean;
}> = ({ player1Data, player2Data, chipMode, showRating }) => {
  const theme = useTheme();

  const ratingBadge = {
    fontSize: 9,
    color: theme.colors.onPrimary,
    backgroundColor: theme.colors.primary,
    marginLeft: 6,
  };
  const badgeSize = 20;

  return (
    // Player's box
    <View
      style={{
        flexDirection: "row",
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 8,
        justifyContent: "center",
        backgroundColor: theme.colors.surfaceVariant,
      }}
    >
      <View
        style={{
          flexDirection: "column",
          alignItems: "stretch", // "center",
          gap: 4,
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
          <View
            style={{
              flexDirection: "column",
            }}
          >
            {getPlayerText(
              player1Data.selected
                ? `${player1Data.player.name} (${player1Data.stats?.gamesSatOut || 0})`
                : player1Data.player.name,
            )}
            <View
              style={{
                flexDirection: "row",
                alignSelf: "flex-end",
                gap: 2
              }}
            >
              {player1Data.partner && getPartnerDecoration(theme)}
              {showRating &&
                player1Data.player.rating &&
                getPlayerRating(player1Data.player.rating, theme)}
            </View>
          </View>
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
          <View
            style={{
              //flexDirection: isNarrowScreen() ? "column" : "row",
              flexDirection: "column",
              //rowGap: 4,
            }}
          >
            {getPlayerText(
              player2Data.selected
                ? `${player2Data.player.name} (${player2Data.stats?.gamesSatOut || 0})`
                : player2Data.player.name,
            )}
            <View
              style={{ flexDirection: "row", alignSelf: "flex-end", gap: 2 }}
            >
              {player2Data.partner && getPartnerDecoration(theme)}
              {showRating &&
                player2Data.player.rating &&
                getPlayerRating(player2Data.player.rating, theme)}
            </View>
          </View>
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

  if (serveScore === undefined || !receiveScore === undefined) {
    return (
      <View style={{
        alignItems: "center"
      }}>
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
  chipMode,
  showRating,
  handleCourtSetting,
  courtLayout = "horizontal"
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
          <Chip
            mode={chipMode}
            //style={{ backgroundColor: theme.colors.primaryContainer }}
            onPress={() => {
              handleCourtSetting && handleCourtSetting(court.id);
            }}
          >
            <View style={{ flexDirection: "column" }}>
              {court.isActive && (
                <Text
                  variant="titleMedium"
                  style={{
                    fontWeight: "600",
                  }}
                >
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
              {court.minimumRating &&
                !useBadge &&
                getPlayerRating(court.minimumRating, theme)}
              {useBadge && court.minimumRating && (
                <Badge
                  size={20}
                  style={{
                    fontSize: 10,
                    color: theme.colors.onPrimary,
                    backgroundColor: theme.colors.primary,
                  }}
                >
                  {court.minimumRating.toFixed(2)}
                </Badge>
              )}
            </View>
          </Chip>
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
              columnGap: 8,
              // backgroundColor: theme.colors.surfaceVariant,
            }}
          >
            <GameSide
              player1Data={servePlayer1Data}
              player2Data={servePlayer2Data}
              chipMode={chipMode}
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
              chipMode={chipMode}
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
