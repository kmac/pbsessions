import { Linking, Platform } from "react-native";
import { Alert } from "@/src/utils/alert";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";

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
  onSuccess?: () => void,
): Promise<boolean> => {
  let fileUri;
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
      fileUri = new FileSystem.File(FileSystem.Paths.document, fileName);
      fileUri.write(stringData);

      let triggerShare: boolean = false;
      Alert.alert("Success", `File saved to: ${fileUri.uri}`, [
        { text: "OK" },
        {
          text: "Share",
          onPress: () => {
            triggerShare = true;
            //Linking.openURL(fileUri.uri);
          },
        },
      ]);
      if (triggerShare && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(fileUri.uri, {
          mimeType: "text/csv",
          dialogTitle: "Export Players",
        });
      } else {
        Alert.alert("Export Complete", `File saved as ${fileName}`);
      }
    }
    onSuccess?.();
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
