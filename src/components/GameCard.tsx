import React from "react";
import { View, StyleSheet } from "react-native";
import { Card, Chip, useTheme } from "react-native-paper";
import { Game, Session } from "@/src/types";
import { getPlayerName, getCourtName } from "@/src/utils/util";

interface GameCardProps {
  game: Game;
  session: Session;
  players: any[];
}

export default function GameCard({ game, session, players }: GameCardProps) {
  const theme = useTheme();
  return (
    <Card style={styles.gameCard}>
      <Card.Content>
        <View style={styles.gameHeader}>
          <Chip
            compact
            style={{ backgroundColor: theme.colors.tertiaryContainer }}
          >
            {getCourtName(session.courts, game.courtId)}
          </Chip>
        </View>

        <View style={styles.teamsContainer}>
          <View style={styles.team}>
            <Chip compact style={styles.partnerChip}>
              {getPlayerName(players, game.serveTeam.player1Id)}
            </Chip>
            <Chip compact style={styles.partnerChip}>
              {getPlayerName(players, game.serveTeam.player2Id)}
            </Chip>
          </View>

          <Chip
            compact
            style={[
              styles.statusChip,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            {game.score
              ? `${game.score.serveScore} - ${game.score.receiveScore}`
              : "vs."}
          </Chip>

          <View style={styles.team}>
            <Chip compact style={styles.partnerChip}>
              {getPlayerName(players, game.receiveTeam.player1Id)}
            </Chip>
            <Chip compact style={styles.partnerChip}>
              {getPlayerName(players, game.receiveTeam.player2Id)}
            </Chip>
          </View>
        </View>

        {!game.isCompleted && (
          <Chip
            icon="timer-outline"
            compact
            style={[
              styles.statusChip,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            Incomplete
          </Chip>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  gameCard: {
    marginVertical: 4,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 12,
  },
  teamsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  team: {
    flexDirection: "column",
    alignItems: "center",
    minWidth: 80,
  },
  statusChip: {
    alignSelf: "center",
    marginTop: 8,
  },
  partnerChip: {
    marginBottom: 4,
  },
});
