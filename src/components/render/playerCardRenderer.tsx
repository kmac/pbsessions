import React from "react";
import { View } from "react-native";
import {
  Card,
  Chip,
  IconButton,
  Menu,
  Text,
  useTheme,
} from "react-native-paper";
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
  showPartnershipMenu?: boolean;
  availableForLinking?: Player[];
}

export interface PlayerCardHandlers {
  onToggle: (player: Player) => void;
  onPlayerAction?: (
    player: Player,
    action: "pause" | "unpause" | "link" | "unlink",
  ) => void;
  onLinkPartner?: (player1: Player, player2: Player) => void;
  onShowDetails?: (player: Player) => void;
  onShowPartnershipMenu?: (player: Player) => void;
}

export function renderPlayerCard(
  config: PlayerCardConfig,
  handlers: PlayerCardHandlers,
  theme: any, // or proper theme type
): React.ReactElement {
  const {
    player,
    isSelected,
    isPaused = false,
    partnerName,
    showActions = true,
    showPauseButton = true,
    showDetailsButton = true,
    showPartnershipMenu = true,
    availableForLinking = [],
  } = config;

  const {
    onToggle,
    onPlayerAction,
    onLinkPartner,
    onShowDetails,
    onShowPartnershipMenu,
  } = handlers;

  return (
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
                <Text variant="bodySmall">{getShortGender(player.gender)}</Text>

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
                        //backgroundColor: theme.colors.secondaryContainer,
                        backgroundColor: theme.colors.tertiaryContainer,
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

            {false && showDetailsButton && onShowDetails && (
              <Chip
                icon="view-dashboard-edit-outline"
                compact
                mode="outlined"
                textStyle={{ fontSize: 10 }}
                style={{
                  backgroundColor: theme.colors.secondaryContainer,
                }}
                onPress={() => onShowDetails(player)}
              >
                Details
              </Chip>
            )}
            {showDetailsButton && onShowDetails && (
              <IconButton
                icon="circle-edit-outline"
                mode="outlined"
                size={20}
                style={{
                  backgroundColor: theme.colors.secondaryContainer,
                }}
                onPress={() => onShowDetails(player)}
              />
            )}

            {false && showPauseButton && onPlayerAction && (
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

            {/* Partnership button */}
            {false &&
              showPartnershipMenu &&
              (partnerName || availableForLinking.length > 0) &&
              onShowPartnershipMenu && (
                <IconButton
                  icon="account-heart-outline"
                  size={20}
                  iconColor={theme.colors.onSurfaceVariant}
                  onPress={() => onShowPartnershipMenu(player)}
                />
              )}
          </View>
        </View>
      </Card.Content>
    </View>
  );
}
