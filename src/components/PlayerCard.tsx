import { TouchableOpacity, View } from "react-native";
import { Card, Chip, IconButton, Text, useTheme } from "react-native-paper";
import { Player } from "@/src/types";
import { getShortGender, playerDetailsToString } from "@/src/utils/util";
import { APP_CONFIG } from "@/src/constants";

export default function PlayerCard({
  player,
  isSelected,
  onToggle,
  compact = true,
  showActions = true,
}: {
  player: Player;
  isSelected: boolean;
  onToggle: (player: Player) => void;
  compact?: boolean;
  showActions?: boolean;
}) {
  const theme = useTheme();

  function handleToggle(player: Player) {
    if (showActions) {
      onToggle(player);
    }
  }

  const useCard = false;

  if (!useCard) {
    return (
      <TouchableOpacity onLongPress={() => handleToggle(player)}>
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
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Text
                      variant="titleMedium"
                      style={{
                        marginRight: 10,
                        fontWeight: "600",
                        flex: 1,
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
                  </View>
                  {player.rating && (
                    <Chip icon="star-outline" compact>
                      <Text variant="bodySmall">
                        {player.rating.toFixed(
                          APP_CONFIG.RATING_DECIMAL_PLACES,
                        )}
                      </Text>
                    </Chip>
                  )}
                </View>

                <View style={{ gap: 4 }}>
                  {!compact && (
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
                  )}
                  {false && player.gender && (
                    <Text
                      variant="bodySmall"
                      style={{
                        color: isSelected
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                        fontStyle: "italic",
                      }}
                    >
                      {player.gender}
                    </Text>
                  )}
                </View>
              </View>

              {showActions && (
                <IconButton
                  icon={isSelected ? "check-circle" : "circle-outline"}
                  size={24}
                  iconColor={
                    isSelected ? theme.colors.primary : theme.colors.outline
                  }
                  onPress={() => handleToggle(player)}
                />
              )}
            </View>
          </Card.Content>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onLongPress={() => handleToggle(player)}>
      <Card
        mode="contained"
        style={{
          //marginBottom: 2,
          //borderWidth: 0,
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
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    // variant="bodyMedium"
                    variant="titleMedium"
                    style={{
                      marginRight: 10,
                      fontWeight: "600",
                      flex: 1,
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
                </View>
                {player.rating && (
                  <Chip icon="star-outline" compact>
                    <Text variant="bodySmall">
                      {player.rating.toFixed(APP_CONFIG.RATING_DECIMAL_PLACES)}
                    </Text>
                  </Chip>
                )}
              </View>

              <View style={{ gap: 4 }}>
                {!compact && (
                  <Text
                    variant="bodySmall"
                    style={{
                      color: isSelected
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant,
                      fontStyle: "italic",
                    }}
                  >
                    {playerDetailsToString(player)}
                  </Text>
                )}
                {false && player.gender && (
                  <Text
                    variant="bodySmall"
                    style={{
                      color: isSelected
                        ? theme.colors.onPrimaryContainer
                        : theme.colors.onSurfaceVariant,
                      fontStyle: "italic",
                    }}
                  >
                    {player.gender}
                  </Text>
                )}
              </View>
            </View>

            {showActions && (
              <IconButton
                icon={isSelected ? "check-circle" : "circle-outline"}
                size={24}
                iconColor={
                  isSelected ? theme.colors.primary : theme.colors.outline
                }
                onPress={() => handleToggle(player)}
              />
            )}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}
