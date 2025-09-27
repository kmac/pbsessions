import { Image, View } from "react-native";
import { Avatar, Text, useTheme } from "react-native-paper";

interface TabHeaderProps {
  title: string;
}

export default function TabHeader({ title }: TabHeaderProps) {

  const theme = useTheme();

  return (
    <>
      {false && ( <Image
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
      />)}
      <Avatar.Image
        size={32}
        source={require("@/assets/images/pbsessions.webp")}
        style={{
          marginRight: 10,
          backgroundColor: "grey",
        }}
      />
      <View style={{ flex: 1 }}>
        <Text variant="headlineSmall" style={{ fontWeight: "bold" }}>
          {title}
        </Text>
      </View>
    </>
  );
}
