import { View } from "react-native";
import { IconButton, Surface, Text, useTheme } from "react-native-paper";

interface TopDescriptionProps {
  visible: boolean;
  description: string;
  onClose?: () => void;
}

export const TopDescription: React.FC<TopDescriptionProps> = ({
  visible,
  description,
  onClose,
}) => {
  const theme = useTheme();

  if (!visible) {
    return;
  }

  return (
    <Surface
      style={{
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        backgroundColor: theme.colors.primaryContainer,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text
          variant="bodyMedium"
          style={{
            color: theme.colors.onPrimaryContainer,
            textAlign: "center",
            flex: 1,
          }}
        >
          {description}
        </Text>
        {onClose && (
          <IconButton
            icon="close"
            size={20}
            iconColor={theme.colors.onPrimaryContainer}
            onPress={onClose}
            style={{ margin: -8 }}
          />
        )}
      </View>
    </Surface>
  );
};
