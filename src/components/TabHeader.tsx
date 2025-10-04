import { Image, View } from "react-native";
import { Avatar, Text, useTheme } from "react-native-paper";

interface TabHeaderProps {
  title: string;
  showIcon?: boolean;
}

export const TabHeader: React.FC<TabHeaderProps> = ({ title, showIcon=false }) => {
  const theme = useTheme();

  return (
    <>
      {false && showIcon && (
        <Image
          style={{
            width: 48,
            height: 48,
            backgroundColor: theme.colors.primaryContainer,
            marginRight: 8,
            borderWidth: 0,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          }}
          source={require("@/assets/images/pbsessions.webp")}
        />
      )}
      {showIcon && (
      <Avatar.Image
        size={48}
        source={require("@/assets/images/pbsessions.webp")}
        style={{
          marginRight: 10,
          backgroundColor: "grey",
        }}
      />
      )}
      <View style={{ flex: 1 }}>
        <Text variant="headlineSmall" style={{
          fontWeight: "bold",
          marginLeft: showIcon ? 2 : 12,
        }}>
          {title}
        </Text>
      </View>
    </>
  );
};
