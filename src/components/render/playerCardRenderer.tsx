import React from "react";
import { View } from "react-native";
import { Card, Chip, IconButton, Text } from "react-native-paper";
import { Player } from "@/src/types";
import { getShortGender } from "@/src/utils/util";
import { APP_CONFIG } from "@/src/constants";

export interface PlayerCardConfig {
  player: Player;
  isSelected: boolean;
  isPaused?: boolean;
  partnerName?: string;
  showActions?: boolean;
  showPauseButton?: boolean;
  showDetailsButton?: boolean;
  canBeRemoved?: boolean;
  removalReason?: string | null;
}

export interface PlayerCardHandlers {
  onToggle: (player: Player) => void;
  onPlayerAction?: (
    player: Player,
    action: "pause" | "unpause" | "link" | "unlink",
  ) => void;
  onLinkPartner?: (player1: Player, player2: Player) => void;
  onShowDetails?: (player: Player) => void;
}

export function renderPlayerCard(
  config: PlayerCardConfig,
  handlers: PlayerCardHandlers,
  theme: any,
): React.ReactElement {
  const {
    player,
    isSelected,
    isPaused = false,
    partnerName,
    showActions = true,
    showPauseButton = true,
    showDetailsButton = true,
    canBeRemoved = true, // Default to true for backwards compatibility
    removalReason = null,
  } = config;

  const { onToggle, onPlayerAction, onLinkPartner, onShowDetails } = handlers;

  const getToggleIcon = () => {
    if (!isSelected) return "circle-outline";
    if (!canBeRemoved) return "lock-outline";
    return "check-circle";
  };

  const getToggleColor = () => {
    if (!isSelected) return theme.colors.outline;
    if (!canBeRemoved) return theme.colors.error;
    return theme.colors.primary;
  };

  return (
    <View
      style={{
        marginBottom: 2,
        borderWidth: 0,
        backgroundColor: isSelected
          ? theme.colors.primaryContainer
          : theme.colors.surface,
        //opacity: !isSelected || canBeRemoved ? 1 : 0.7, // Slightly dim locked players
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
            {/* ... existing player info ... */}
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
                <Text variant="bodySmall">{getShortGender(player.gender)}</Text>

                {/* Status chips */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    marginTop: 4,
                  }}
                >
                  {partnerName && (
                    <Chip
                      icon="account-multiple-outline"
                      compact
                      mode="flat"
                      textStyle={{ fontSize: 12 }}
                    >
                      {partnerName}
                    </Chip>
                  )}
                  {isPaused && (
                    <Chip
                      icon="pause"
                      compact
                      mode="flat"
                      textStyle={{ fontSize: 10 }}
                      style={{
                        backgroundColor: theme.colors.tertiaryContainer,
                      }}
                    >
                      Paused
                    </Chip>
                  )}
                  {false && isSelected && !canBeRemoved && (
                    <Chip
                      icon="lock-outline"
                      compact
                      mode="flat"
                      textStyle={{ fontSize: 10 }}
                      style={{
                        backgroundColor: theme.colors.errorContainer,
                      }}
                    >
                      Cannot Remove
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
                icon={getToggleIcon()}
                size={32}
                iconColor={getToggleColor()}
                onPress={() => {
                  onToggle(player);
                }}
              />
            )}

            {showDetailsButton && onShowDetails && (
              <IconButton
                // icon="circle-edit-outline"
                icon="pencil"
                mode="outlined"
                size={20}
                style={{
                  backgroundColor: theme.colors.secondaryContainer,
                }}
                onPress={() => onShowDetails(player)}
              />
            )}
          </View>
        </View>
      </Card.Content>
    </View>
  );
}
