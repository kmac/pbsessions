import React from "react";
import { Modal, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appbar, Surface, Text, useTheme } from "react-native-paper";
import { Session } from "@/src/types";
import { PlayerMatchupDisplay } from "./PlayerMatchupDisplay";

interface PlayerMatchupModalProps {
  visible: boolean;
  session: Session;
  onClose: () => void;
}

export const PlayerMatchupModal: React.FC<PlayerMatchupModalProps> = ({
  visible,
  session,
  onClose,
}) => {
  const theme = useTheme();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Appbar.Header>
          <Appbar.BackAction onPress={onClose} />
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
                  Player Matchups
                </Text>
                <Text
                  variant="titleSmall"
                  style={{
                    alignItems: "center",
                    fontWeight: "400",
                  }}
                >
                  {session.name}
                </Text>
              </>
            }
          />
        </Appbar.Header>

        <Surface style={styles.content}>
          <PlayerMatchupDisplay session={session} />
        </Surface>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});
