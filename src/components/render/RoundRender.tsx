import { View } from "react-native";
import { Badge, Card, Chip, Divider, Surface, Text } from "react-native-paper";
import { Court, Player, PlayerStats, Score } from "@/src/types";
import { isNarrowScreen } from "@/src/utils/screenUtil";

export type PlayerRenderData = {
  player: Player;
  selected: boolean;
  selectDisabled: boolean;
  onSelected?: () => void;
};

export class RoundRender {
  private theme;
  private showRating: boolean;
  private chipMode: "flat" | "outlined" | undefined;

  constructor(
    theme: any,
    showRating: boolean,
    chipMode: "flat" | "outlined" | undefined,
  ) {
    this.theme = theme;
    this.showRating = showRating;
    this.chipMode = chipMode;
  }

  private renderScore(
    serveScore: number | undefined,
    receiveScore: number | undefined,
  ) {
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
          style={{ backgroundColor: this.theme.colors.tertiaryContainer }}
          elevated={true}
        >
          <Text variant="titleSmall">
            {serveScore} - {receiveScore}
          </Text>
        </Chip>
      </View>
    );
  }

  public renderSideWithScore(
    player1Data: PlayerRenderData,
    player2Data: PlayerRenderData,
    side: "Serve" | "Receive",
    score: number | undefined,
  ) {
    const player1 = player1Data.player;
    const player2 = player2Data.player;

    return (
      <Surface
        style={{
          flexDirection: "row",
          flex: 1,
          gap: 10,
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
          backgroundColor: this.theme.colors.surfaceVariant,
        }}
      >
        <View
          style={{
            flexDirection: "column",
            alignItems: "stretch",
            gap: 5,
            flex: 1,
          }}
        >
          <Chip
            mode={this.chipMode}
            disabled={player1Data.selectDisabled}
            elevated={!player1Data.selectDisabled}
            selected={player1Data.selected}
            onPress={() => {
              player1Data.onSelected && player1Data.onSelected();
            }}
          >
            {player1.name}
            {this.showRating && player1.rating && (
              <Badge
                size={22}
                style={{
                  backgroundColor: this.theme.colors.primary,
                  marginLeft: 6,
                }}
              >
                {player1.rating!.toFixed(2)}
              </Badge>
            )}
          </Chip>
          <Chip
            mode={this.chipMode}
            disabled={player2Data.selectDisabled}
            elevated={!player2Data.selectDisabled}
            selected={player2Data.selected}
            onPress={() => {
              player2Data.onSelected && player2Data.onSelected();
            }}
          >
            {player2.name}
            {this.showRating && player2.rating && (
              <Badge
                size={22}
                style={{
                  backgroundColor: this.theme.colors.primary,
                  marginLeft: 6,
                }}
              >
                {player2.rating!.toFixed(2)}
              </Badge>
            )}
          </Chip>
        </View>

        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            minWidth: 40,
          }}
        >
          {score !== undefined ? (
            <Text variant="titleLarge" style={{ fontWeight: "bold" }}>
              {score}
            </Text>
          ) : (
            <Text
              variant="bodySmall"
              style={{ color: this.theme.colors.outline }}
            >
              --
            </Text>
          )}
        </View>
      </Surface>
    );
  }
  public renderSide(
    player1Data: PlayerRenderData,
    player2Data: PlayerRenderData,
  ) {
    const player1 = player1Data.player;
    const player2 = player2Data.player;

    return (
      <Surface
        style={{
          flexDirection: "row",
          flex: 1,
          gap: 10,
          padding: 12,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: this.theme.colors.surfaceVariant,
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
            mode={this.chipMode}
            disabled={player1Data.selectDisabled}
            elevated={!player1Data.selectDisabled}
            selected={player1Data.selected}
            onPress={() => {
              player1Data.onSelected && player1Data.onSelected();
            }}
          >
            {player1.name}
            {/* {this.showRating &&
              player1.rating &&
              ` (${player1.rating.toFixed(2)})`} */}
            {this.showRating && player1.rating && (
              <Badge
                size={22}
                style={{
                  backgroundColor: this.theme.colors.primary,
                  marginLeft: 6,
                }}
              >
                {player1.rating!.toFixed(2)}
              </Badge>
            )}
          </Chip>
          <Chip
            mode={this.chipMode}
            disabled={player2Data.selectDisabled}
            elevated={!player2Data.selectDisabled}
            selected={player2Data.selected}
            onPress={() => {
              player2Data.onSelected && player2Data.onSelected();
            }}
          >
            {player2.name}
            {this.showRating && player2.rating && (
              <Badge
                size={22}
                style={{
                  backgroundColor: this.theme.colors.primary,
                  marginLeft: 6,
                }}
              >
                {player2.rating!.toFixed(2)}
              </Badge>
            )}
          </Chip>
        </View>
      </Surface>
    );
  }

  public renderGame(
    servePlayer1Data: PlayerRenderData,
    servePlayer2Data: PlayerRenderData,
    receivePlayer1Data: PlayerRenderData,
    receivePlayer2Data: PlayerRenderData,
    court: Court,
    score?: Score,
    handleCourtSetting?: (courtId: string) => void,
  ) {
    return (
      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <View
            style={{
              flexDirection: "row",
              // flexDirection: "column",
              // alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <Chip // Court
              mode={this.chipMode}
              //disabled={!editing}
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
              {/* {!court.isActive && <Badge size={22}>Disabled</Badge>} */}
              {court.minimumRating && (
                <Badge
                  size={22}
                  style={{
                    backgroundColor: this.theme.colors.tertiary,
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
            {this.renderSide(
              servePlayer1Data,
              servePlayer2Data,
            )}
            {this.renderScore(score?.serveScore, score?.receiveScore)}
            {this.renderSide(
              receivePlayer1Data,
              receivePlayer2Data,
            )}
            {/*
            {this.renderSide(
              servePlayer1Data,
              servePlayer2Data,
              score?.serveScore,
            )}
            <Divider />
            {false && this.renderScore(score?.serveScore, score?.receiveScore)}
            {this.renderSide(
              receivePlayer1Data,
              receivePlayer2Data,
              score?.receiveScore,
            )}
            */}
          </View>
        </Card.Content>
      </Card>
    );
  }
}
