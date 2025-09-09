import { View } from "react-native";
import { Badge, Chip, Surface, Text } from "react-native-paper";
import { Player } from "@/src/types";

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
}
