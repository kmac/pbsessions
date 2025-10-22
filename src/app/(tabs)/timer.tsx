import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Appbar, Banner, IconButton, Text, useTheme } from "react-native-paper";
import { TimerComponent } from "@/src/components/TimerComponent";
import { Alert } from "@/src/utils/alert";
import { TopDescription } from "@/src/components/TopDescription";
import { isNarrowScreen } from "@/src/utils/screenUtil";

export default function TimerScreen() {
  const theme = useTheme();
  const [helpBannerVisible, setHelpBannerVisible] = useState(false);

  const toggleBanner = () => {
    let visible = helpBannerVisible;
    setHelpBannerVisible(!visible);
  };

  const handleTimerComplete = (totalTimeElapsed: number) => {
    // const minutes = Math.floor(totalTimeElapsed / 60);
    // Alert.alert(
    //   "Timer Complete!",
    //   `Time's up! ${minutes} minute${minutes !== 1 ? "s" : ""} elapsed.`
    // );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header>
        <Appbar.Content
          title={
            <Text
              variant="titleLarge"
              style={{
                alignItems: "center",
                fontWeight: "600",
              }}
            >
              Timer
            </Text>
          }
        />
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <IconButton
            icon="tooltip-question"
            size={30}
            onPress={() => {
              toggleBanner();
            }}
          />
        </View>
      </Appbar.Header>

      <Banner
        visible={helpBannerVisible}
        contentStyle={{
          width: "90%",
        }}
        actions={[
          {
            label: "Dismiss",
            onPress: () => {
              setHelpBannerVisible(false);
            },
          },
        ]}
      >
        <View
          style={{
            alignItems: "stretch",
            marginTop: 20,
          }}
        >
          <TopDescription
            visible={true}
            description={`Adjust the timer and start when ready.\nThe timer will keep running in the background.`}
            //onClose={() => setDescriptionVisible(false)}
          />
        </View>
      </Banner>

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          alignItems: "center",
          justifyContent: "center",
          flexGrow: 1,
        }}
      >
        <TimerComponent visible={true} onComplete={handleTimerComplete} />
      </ScrollView>
    </SafeAreaView>
  );
}
