import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Appbar,
  Button,
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

export default function PlayerForm({
  player,
  onSave,
  onCancel,
}: PlayerFormProps) {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "" as "male" | "female" | "other" | "",
    rating: "",
  });

  useEffect(() => {
    if (player) {
      setFormData({
        name: player.name,
        email: player.email || "",
        phone: player.phone || "",
        gender: player.gender || "",
        rating: player.rating?.toString() || "",
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
      rating,
    };

    if (player) {
      onSave({ ...player, ...playerData });
    } else {
      onSave(playerData);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
            padding: 16,
            borderRadius: 12,
            marginBottom: 16,
          }}
        >
          <Text
            variant="labelLarge"
            style={{
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            Name *
          </Text>
          <View>
            <TextInput
              mode="outlined"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter player name"
              autoFocus={!player}
            />
            <HelperText type="error" visible={!formData.name}>
              Name is required
            </HelperText>
          </View>

          <Text
            variant="labelLarge"
            style={{
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            Email
          </Text>
          <TextInput
            mode="outlined"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Email (optional)"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ marginBottom: 16 }}
          />

          <Text
            variant="labelLarge"
            style={{
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            Phone
          </Text>
          <TextInput
            mode="outlined"
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Phone (optional)"
            keyboardType="phone-pad"
            style={{ marginBottom: 16 }}
          />

          <Text
            variant="labelLarge"
            style={{
              marginBottom: 8,
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
              marginBottom: 16,
            }}
          >
            <Picker
              selectedValue={formData.gender}
              onValueChange={(value) =>
                setFormData({ ...formData, gender: value })
              }
              style={{ height: 50 }}
            >
              <Picker.Item label="Select (optional)" value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Other" value="other" />
            </Picker>
          </Surface>

          <Text
            variant="labelLarge"
            style={{
              marginBottom: 8,
              color: theme.colors.onSurface,
            }}
          >
            Rating (0.0 - 10.0)
          </Text>
          <TextInput
            mode="outlined"
            value={formData.rating}
            onChangeText={(text) => setFormData({ ...formData, rating: text })}
            placeholder="Enter rating (DUPR-style)"
            keyboardType="decimal-pad"
          />
          <Text
            variant="bodySmall"
            style={{
              color: theme.colors.onSurfaceVariant,
              marginTop: 4,
            }}
          >
            Optional: DUPR-style rating for skill-based court assignments
          </Text>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
}
