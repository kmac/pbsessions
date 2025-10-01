import { Surface, Text, useTheme } from "react-native-paper";

interface TopDescriptionProps {
  visible: boolean;
  description: string;
}

export const TopDescription: React.FC<TopDescriptionProps> = ({
  visible,
  description,
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
      <Text
        variant="bodyMedium"
        style={{
          color: theme.colors.onPrimaryContainer,
          textAlign: "center",
        }}
      >
        {description}
      </Text>
    </Surface>
  );
};
