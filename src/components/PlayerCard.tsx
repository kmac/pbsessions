import { TouchableOpacity, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  Text,
  useTheme,
  Menu,
  Portal,
} from "react-native-paper";
import { Player, FixedPartnership } from "@/src/types";
import { getShortGender, playerDetailsToString } from "@/src/utils/util";
import { APP_CONFIG } from "@/src/constants";
import { useState, useRef } from "react";

export interface PlayerCardProps {
  player: Player;
  isSelected: boolean;
  onToggle: (player: Player) => void;
  compact?: boolean;
  showActions?: boolean;
  isPaused?: boolean;
  partnerName?: string;
  onPlayerAction?: (
    player: Player,
    action: "pause" | "unpause" | "link" | "unlink",
  ) => void;
  availableForLinking?: Player[];
  onLinkPartner?: (player1: Player, player2: Player) => void;
  onMenuPress?: (player: Player) => void;
  showMenu?: boolean;
}

export default function PlayerCard({
  player,
  isSelected,
  onToggle,
  compact = true,
  showActions = true,
  isPaused = false,
  partnerName,
  onPlayerAction,
  availableForLinking = [],
  onLinkPartner,
  onMenuPress,
  showMenu = true,
}: PlayerCardProps) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  // const menuAnchorRef = useRef<View>(null);

  function handleToggle(player: Player) {
    if (showActions) {
      onToggle(player);
    }
  }

  function handlePlayerDetails() {
    // TODO
  }

  return (
    // <TouchableOpacity onPress={() => handleToggle(player)}>
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
                {compact && (
                  <Text variant="bodySmall">
                    {getShortGender(player.gender)}
                  </Text>
                )}

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
                  {false && compact && (
                    <Chip compact mode="outlined" textStyle={{ fontSize: 10 }}>
                      {getShortGender(player.gender)}
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

            {!compact && (
              <View style={{ gap: 4, marginTop: 8 }}>
                <Text
                  variant="bodySmall"
                  style={{
                    color: isSelected
                      ? theme.colors.onPrimaryContainer
                      : theme.colors.onSurfaceVariant,
                    fontStyle: "italic",
                  }}
                >
                  {getShortGender(player.gender)}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {showActions && (
              <IconButton
                icon={isSelected ? "check-circle" : "circle-outline"}
                size={32}
                iconColor={
                  isSelected ? theme.colors.primary : theme.colors.outline
                }
                onPress={() => handleToggle(player)}
              />
            )}

            <Chip
              icon="dots-vertical"
              compact
              mode="outlined"
              textStyle={{ fontSize: 10 }}
              style={{
                backgroundColor: theme.colors.secondaryContainer,
                //borderColor: theme.colors.error,
              }}
              onPress={() => setDialogVisible(true)}
            >
              Details
            </Chip>

            <Chip
              icon={isPaused ? "play" : "pause"}
              compact
              mode="outlined"
              textStyle={{ fontSize: 10 }}
              style={{
                backgroundColor: theme.colors.secondaryContainer,
                //borderColor: theme.colors.error,
              }}
              onPress={() => {
                if (onPlayerAction) {
                  onPlayerAction(player, isPaused ? "unpause" : "pause");
                }
              }}
            >
              {isPaused ? "Paused" : "Pause"}
            </Chip>

            {/* Menu button */}
            {false && onPlayerAction && showMenu && (
              <IconButton
                icon="dots-vertical"
                size={20}
                iconColor={theme.colors.onSurfaceVariant}
                onPress={(e) => {
                  e.stopPropagation();
                  onMenuPress?.(player);
                }}
              />
            )}

            {/* Menu button - only show if onPlayerAction is provided */}
            {onPlayerAction && false && (
              // <Portal>
              <Menu
                visible={menuVisible}
                onDismiss={() => setMenuVisible(false)}
                anchor={
                  //<View ref={menuAnchorRef}>
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    iconColor={theme.colors.onSurfaceVariant}
                    // onPress={() => setMenuVisible(true)}
                    onPress={(e) => {
                      e.stopPropagation();
                      setMenuVisible(true);
                    }}
                  />
                  //</View>
                }
                contentStyle={{
                  backgroundColor: theme.colors.surface,
                  elevation: 20, // Very high elevation
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.5,
                  shadowRadius: 15,
                }}
                anchorPosition="bottom"
              >
                <Menu.Item
                  onPress={() => {
                    //onPlayerAction(player, isPaused ? "unpause" : "pause");
                    setMenuVisible(false);
                  }}
                  title={isPaused ? "Resume Player" : "Pause Player"}
                  leadingIcon={isPaused ? "play" : "pause"}
                />

                {partnerName ? (
                  <Menu.Item
                    onPress={() => {
                      //onPlayerAction(player, "unlink");
                      setMenuVisible(false);
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
                            setMenuVisible(false);
                          }}
                          title={`  ${availablePlayer.name}`}
                          leadingIcon="account"
                        />
                      ))}
                    </>
                  )
                )}
              </Menu>
              // </Portal>
            )}
          </View>
        </View>
      </Card.Content>

      <Dialog
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        //style={{ alignSelf: "center", width: "80%", maxWidth: 400 }}
        style={{
          alignSelf: "center",
          width: "80%",
          maxWidth: 400,
          position: "absolute",
          top: "20%",
          zIndex: 1000,
          elevation: 40,
        }}
      >
        <Dialog.Title>Player Details</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
            Configure player
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text variant="bodyMedium" style={{ marginLeft: 8 }}>
              TODO
            </Text>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
          <Button onPress={() => handlePlayerDetails}>Save</Button>
        </Dialog.Actions>
      </Dialog>
    </View>
    // </TouchableOpacity>
  );
}
