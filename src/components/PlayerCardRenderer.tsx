import React, { useState } from "react";
import { View } from "react-native";
import {
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  Menu,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";
import { Player } from "../types";
import { getShortGender } from "../utils/util";
import { APP_CONFIG } from "../constants";

export interface PlayerCardRendererProps {
  player: Player;
  isSelected: boolean;
  onToggle: (player: Player) => void;
  isPaused?: boolean;
  partnerName?: string;
  onPlayerAction?: (
    player: Player,
    action: "pause" | "unpause" | "link" | "unlink",
  ) => void;
  availableForLinking?: Player[];
  onLinkPartner?: (player1: Player, player2: Player) => void;
  showActions?: boolean;
  showMenu?: boolean;
  showDetailsDialog?: boolean;
  onShowDetailsDialog?: (player: Player) => void;
}

export default function PlayerCardRenderer({
  player,
  isSelected,
  onToggle,
  isPaused = false,
  partnerName,
  onPlayerAction,
  availableForLinking = [],
  onLinkPartner,
  showActions = true,
  showMenu = true,
  showDetailsDialog = true,
  onShowDetailsDialog,
}: PlayerCardRendererProps) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const closeDialog = () => {
    setDialogVisible(false);
  };

  const handleShowDetails = () => {
    if (onShowDetailsDialog) {
      onShowDetailsDialog(player);
    } else {
      setDialogVisible(true);
    }
  };

  return (
    <>
      <View
        style={{
          marginBottom: 2,
          borderWidth: 0,
          backgroundColor: isSelected
            ? theme.colors.primaryContainer
            : theme.colors.surface,
        }}
      >
        <Card.Content>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    variant="titleMedium"
                    style={{
                      marginRight: 10,
                      fontWeight: "600",
                      color: isSelected
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurface,
                    }}
                  >
                    {player.name}
                  </Text>
                  <Text variant="bodySmall">
                    {getShortGender(player.gender)}
                  </Text>

                  {/* Status chips */}
                  <View style={{ flexDirection: "row", gap: 4, marginTop: 4 }}>
                    {partnerName && (
                      <Chip
                        icon="account-heart"
                        compact
                        mode="outlined"
                        textStyle={{ fontSize: 10 }}
                        style={{
                          backgroundColor: theme.colors.tertiaryContainer,
                          borderColor: theme.colors.tertiary,
                        }}
                      >
                        {partnerName}
                      </Chip>
                    )}
                    {isPaused && (
                      <Chip
                        icon="pause"
                        compact
                        mode="outlined"
                        textStyle={{ fontSize: 10 }}
                        style={{
                          backgroundColor: theme.colors.errorContainer,
                          borderColor: theme.colors.error,
                        }}
                      >
                        Paused
                      </Chip>
                    )}
                  </View>
                </View>

                {player.rating && (
                  <Chip icon="star-outline" compact>
                    <Text variant="bodySmall">
                      {player.rating.toFixed(APP_CONFIG.RATING_DECIMAL_PLACES)}
                    </Text>
                  </Chip>
                )}
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              {showActions && (
                <IconButton
                  icon={isSelected ? "check-circle" : "circle-outline"}
                  size={32}
                  iconColor={
                    isSelected ? theme.colors.primary : theme.colors.outline
                  }
                  onPress={() => onToggle(player)}
                />
              )}

              {showDetailsDialog && (
                <Chip
                  icon="dots-vertical"
                  compact
                  mode="outlined"
                  textStyle={{ fontSize: 10 }}
                  style={{
                    backgroundColor: theme.colors.secondaryContainer,
                  }}
                  onPress={handleShowDetails}
                >
                  Details
                </Chip>
              )}

              {onPlayerAction && (
                <Chip
                  icon={isPaused ? "play" : "pause"}
                  compact
                  mode="outlined"
                  textStyle={{ fontSize: 10 }}
                  style={{
                    backgroundColor: theme.colors.secondaryContainer,
                  }}
                  onPress={() => {
                    onPlayerAction(player, isPaused ? "unpause" : "pause");
                  }}
                >
                  {isPaused ? "Paused" : "Pause"}
                </Chip>
              )}

              {/* Partnership Menu */}
              {showMenu && onPlayerAction && (partnerName || availableForLinking.length > 0) && (
                <Menu
                  visible={menuVisible}
                  onDismiss={closeMenu}
                  anchor={
                    <IconButton
                      icon="account-heart-outline"
                      size={20}
                      iconColor={theme.colors.onSurfaceVariant}
                      onPress={() => setMenuVisible(true)}
                    />
                  }
                  contentStyle={{
                    backgroundColor: theme.colors.surface,
                    elevation: 20,
                  }}
                  anchorPosition="bottom"
                >
                  {partnerName ? (
                    <Menu.Item
                      onPress={() => {
                        onPlayerAction(player, "unlink");
                        closeMenu();
                      }}
                      title={`Unlink from ${partnerName}`}
                      leadingIcon="account-heart-outline"
                    />
                  ) : (
                    availableForLinking.length > 0 && (
                      <>
                        <Menu.Item
                          title="Link with Partner"
                          leadingIcon="account-heart"
                          disabled
                        />
                        {availableForLinking.map((availablePlayer) => (
                          <Menu.Item
                            key={availablePlayer.id}
                            onPress={() => {
                              onLinkPartner?.(player, availablePlayer);
                              closeMenu();
                            }}
                            title={`  ${availablePlayer.name}`}
                            leadingIcon="account"
                          />
                        ))}
                      </>
                    )
                  )}
                </Menu>
              )}
            </View>
          </View>
        </Card.Content>
      </View>

      {/* Details Dialog - only render if not using external dialog handler */}
      {!onShowDetailsDialog && (
        <Portal>
          <Dialog
            visible={dialogVisible}
            onDismiss={closeDialog}
            style={{
              alignSelf: "center",
              width: "80%",
              maxWidth: 400,
            }}
          >
            <Dialog.Title>Player Details</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                Configure {player.name}
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 16,
                }}
              >
                <Text variant="bodyMedium" style={{ marginLeft: 8 }}>
                  TODO: Player configuration options
                </Text>
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeDialog}>Cancel</Button>
              <Button onPress={closeDialog}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      )}
    </>
  );
}

