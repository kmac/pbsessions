import { View } from "react-native";
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  Dialog,
  FAB,
  Surface,
  Text,
  TextInput,
} from "react-native-paper";
import { Court, Player, Score } from "@/src/types";

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

  private renderSideScore(score: number | undefined, side: string) {
    return (
      <View>
        {score ? (
          <Chip elevated={true}>
            <Text variant="titleMedium">{score}</Text>
          </Chip>
        ) : (
          false && (
            <Text
              variant="labelMedium"
              style={{
                //fontWeight: "bold",
                marginBottom: 4,
                color: this.theme.colors.onPrimaryContainer,
              }}
            >
              {side}
            </Text>
          )
        )}
      </View>
    );
  }

  public renderSide(
    player1Data: PlayerRenderData,
    player2Data: PlayerRenderData,
    score: number | undefined,
    side: "Serve" | "Receive",
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
          backgroundColor: this.theme.colors.primaryContainer,
        }}
      >
        {side === "Receive" && this.renderSideScore(score, side)}

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
            {this.showRating &&
              player1.rating &&
              ` (${player1.rating.toFixed(2)})`}
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
            {this.showRating &&
              player2.rating &&
              ` (${player2.rating.toFixed(2)})`}
          </Chip>
        </View>

        {side === "Serve" && this.renderSideScore(score, side)}
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
                <Badge size={22}>{court.minimumRating}</Badge>
              )}
            </Chip>
          </View>

          <View
            style={{ flexDirection: "row", alignItems: "center", columnGap: 6 }}
          >
            {this.renderSide(
              servePlayer1Data,
              servePlayer2Data,
              score?.serveScore,
              "Serve",
            )}
            {this.renderSide(
              receivePlayer1Data,
              receivePlayer2Data,
              score?.receiveScore,
              "Receive",
            )}
          </View>
        </Card.Content>
      </Card>
    );
  }
}
