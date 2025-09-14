import { Linking, Platform } from "react-native";
import { Alert } from "@/src/utils/alert";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";

export const copyToClipboard = async (
  stringData: string,
  onSuccess: () => void,
): Promise<boolean> => {
  try {
    await Clipboard.setStringAsync(stringData);
    Alert.alert("Success", "Data copied to clipboard");
    onSuccess();
    return true;
  } catch (error) {
    console.log(error);
    Alert.alert("Error", "Failed to copy to clipboard");
    return false;
  }
};

export const saveToFile = async (
  stringData: string,
  fileName: string,
  onSuccess: () => void,
): Promise<boolean> => {
  try {
    if (Platform.OS === "web") {
      // Web: Use browser download
      const blob = new Blob([stringData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      Alert.alert("Success", "File downloaded successfully");
    } else {
      // Mobile: Use file system
      const fileUri = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(fileUri, stringData);

      Alert.alert("Success", `File saved to: ${fileName}`, [
        { text: "OK" },
        {
          text: "Share",
          onPress: () => {
            // Optional: Add sharing functionality here if needed
            Linking.openURL(`file://${fileUri}`);
          },
        },
      ]);
    }
    onSuccess();
    return true;

  } catch (error) {
    console.log(error);
    Alert.alert("Error", "Failed to save file");
    return false;
  }
};

export const readSelectedFile = async (
  handleContent: (content: string) => void,
) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const file = result.assets[0];
      let content = "";

      if (Platform.OS === "web") {
        // Web: Read file directly
        const response = await fetch(file.uri);
        content = await response.text();
      } else {
        // Mobile: Read from file system
        content = await FileSystem.readAsStringAsync(file.uri);
      }

      handleContent(content);
    }
  } catch (error) {
    console.log(error);
    Alert.alert("Error", "Failed to read file");
  }
};

export const pasteFromClipboard = async (
  handleContent: (content: string) => void,
) => {
  try {
    const clipboardContent = await Clipboard.getStringAsync();
    handleContent(clipboardContent);
  } catch (error) {
    console.log(error);
    Alert.alert("Error", "Failed to read clipboard");
  }
};
