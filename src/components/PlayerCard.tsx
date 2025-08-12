import { TouchableOpacity, View } from "react-native";
import {
  Card,
  Chip,
  Icon,
  IconButton,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { Player } from "@/src/types";
import { Alert } from "@/src/utils/alert";
import { APP_CONFIG } from "@/src/constants";

export default function PlayerCard({
  player,
  isSelected,
  onToggle,
  showActions = true,
}: {
  player: Player;
  isSelected: boolean;
  onToggle: (player: Player) => void;
  showActions?: boolean;
}) {

  const theme = useTheme();

  function handleToggle(player: Player) {
    onToggle(player);
  }

  return (
    <TouchableOpacity
      onPress={() => handleToggle(player)}
    >
    <Card
      style={{
        marginBottom: 8,
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
                marginBottom: 8,
              }}
            >
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: "600",
                  flex: 1,
                  color: isSelected
                    ? theme.colors.onPrimaryContainer
                    : theme.colors.onSurface,
                }}
              >
                {player.name}
              </Text>
              {player.rating && (
                <Chip icon="star-outline" compact>
                  {player.rating.toFixed(APP_CONFIG.RATING_DECIMAL_PLACES)}
                </Chip>
              )}
            </View>

            <View style={{ gap: 4 }}>
              {player.gender && (
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
              onPress={() => {}}
            />
          )}
        </View>
      </Card.Content>
    </Card>
    </TouchableOpacity>
  );
}
