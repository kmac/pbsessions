import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
  Card,
  HelperText,
  Surface,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import { Player } from "../types";
import { Alert } from "../utils/alert";

interface PlayerFormProps {
  player?: Player | null;
  onSave: (
    player: Player | Omit<Player, "id" | "createdAt" | "updatedAt">,
  ) => void;
  onCancel: () => void;
}

export const PlayerForm: React.FC<PlayerFormProps> = ({
  player,
  onSave,
  onCancel,
}) => {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "" as "male" | "female" | "",
    rating: "",
    notes: "",
  });

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name,
        email: player.email || "",
        phone: player.phone || "",
        gender: player.gender || "",
        rating: player.rating?.toString() || "",
        notes: player.notes || "",
      });
    }
  }, [player]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      Alert.alert("Validation Error", "Player name is required");
      return;
    }

    const rating = formData.rating ? parseFloat(formData.rating) : undefined;
    if (formData.rating && (isNaN(rating!) || rating! < 0 || rating! > 10)) {
      Alert.alert(
        "Validation Error",
        "Rating must be a number between 0 and 10",
      );
      return;
    }

    const playerData = {
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      gender: formData.gender || undefined,
      rating: rating,
      notes: formData.notes.trim() || undefined,
    };

    if (player) {
      onSave({ ...player, ...playerData });
    } else {
      onSave(playerData);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Appbar.Header>
        <Appbar.BackAction onPress={onCancel} />
        <Appbar.Content
          title={
            <Text
              variant="titleLarge"
              style={{
                alignItems: "center",
                fontWeight: "600",
              }}
            >
              {player ? "Edit Player" : "Add Player"}
            </Text>
          }
        />
        <Button
          icon="content-save"
          mode="contained"
          onPress={handleSave}
          style={{ marginRight: 8 }}
        >
          Save
        </Button>
      </Appbar.Header>

      <ScrollView
        style={{ flex: 1, padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Surface
          style={{
            padding: 12,
            borderRadius: 8,
            marginBottom: 24,
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
            {player
              ? "Edit player details. Only the name is required."
              : "Add a new player. Only the name is required."}
          </Text>
        </Surface>

        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <View style={{ marginBottom: 0 }}>
              <Text
                variant="labelMedium"
                style={{
                  marginBottom: 4,
                  color: theme.colors.onSurface,
                }}
              >
                Name *
              </Text>
              <TextInput
                mode="outlined"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData({ ...formData, name: text })
                }
                placeholder="Enter player name"
                autoFocus={!player}
                dense
              />
              <HelperText type="error" visible={!formData.name}>
                Name is required
              </HelperText>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  variant="labelMedium"
                  style={{
                    marginBottom: 4,
                    color: theme.colors.onSurface,
                  }}
                >
                  Gender
                </Text>
                <Surface
                  style={{
                    borderRadius: 4,
                    borderWidth: 1,
                    borderColor: theme.colors.outline,
                  }}
                >
                  <Picker
                    selectedValue={formData.gender}
                    onValueChange={(value) =>
                      setFormData({ ...formData, gender: value })
                    }
                    style={{ height: 40 }}
                    //itemStyle={{ backgroundColor: 'cyan', color: 'red' }}
                  >
                    <Picker.Item label="Select (optional)" value="" />
                    <Picker.Item label="Male" value="male" />
                    <Picker.Item label="Female" value="female" />
                  </Picker>
                </Surface>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  variant="labelMedium"
                  style={{
                    marginBottom: 4,
                    color: theme.colors.onSurface,
                  }}
                >
                  Rating
                </Text>
                <TextInput
                  mode="outlined"
                  value={formData.rating}
                  onChangeText={(text) =>
                    setFormData({ ...formData, rating: text })
                  }
                  placeholder="0.0 (optional)"
                  keyboardType="decimal-pad"
                  dense
                />
              </View>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <View style={{ flex: 2 }}>
                <Text
                  variant="labelMedium"
                  style={{
                    marginBottom: 4,
                    color: theme.colors.onSurface,
                  }}
                >
                  Email
                </Text>
                <TextInput
                  mode="outlined"
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  placeholder="Email (optional)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  dense
                />
              </View>
              <View style={{ flex: 2 }}>
                <Text
                  variant="labelMedium"
                  style={{
                    marginBottom: 4,
                    color: theme.colors.onSurface,
                  }}
                >
                  Phone
                </Text>
                <TextInput
                  mode="outlined"
                  value={formData.phone}
                  onChangeText={(text) =>
                    setFormData({ ...formData, phone: text })
                  }
                  placeholder="Phone (optional)"
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  dense
                />
              </View>
            </View>

            <View>
              <Text
                variant="labelMedium"
                style={{
                  marginBottom: 4,
                  color: theme.colors.onSurface,
                }}
              >
                Notes
              </Text>
              <TextInput
                mode="outlined"
                value={formData.notes}
                onChangeText={(text) =>
                  setFormData({ ...formData, notes: text })
                }
                placeholder="Additional notes (optional)"
                multiline
                numberOfLines={3}
                style={{ marginBottom: 8 }}
              />
            </View>

            {/*<Text
              variant="bodySmall"
              style={{
                color: theme.colors.onSurfaceVariant,
                marginTop: 4,
              }}
            >
              Optional: DUPR-style rating (0.0-10.0) for skill-based court assignments
            </Text>*/}
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};
