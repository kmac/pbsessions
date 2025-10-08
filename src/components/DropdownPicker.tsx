import React, { useState } from "react";
import { View } from "react-native";
import {
  Icon,
  Menu,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";

// NOT USED YET, but adding in case I decide to move away from 'picker'

export interface DropdownPickerOption<T> {
  value: T;
  label: string;
  leadingIcon?: () => React.ReactNode;
  trailingIcon?: string;
}

interface DropdownPickerProps<T> {
  title: string;
  options: DropdownPickerOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  placeholder?: string;
  disabled?: boolean;
  renderCurrentValue?: (value: T) => React.ReactNode;
  renderLeadingIcon?: (value: T) => React.ReactNode;
}

export function DropdownPicker<T>({
  title,
  options,
  value,
  onValueChange,
  placeholder = "Select option...",
  disabled = false,
  renderCurrentValue,
  renderLeadingIcon,
}: DropdownPickerProps<T>) {
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);

  const currentOption = options.find((option) => option.value === value);

  const handleSelect = (selectedValue: T) => {
    onValueChange(selectedValue);
    setMenuVisible(false);
  };

  const renderCurrentDisplay = () => {
    if (renderCurrentValue && currentOption) {
      return renderCurrentValue(currentOption.value);
    }
    return currentOption?.label || placeholder;
  };

  const renderLeadingIconDisplay = () => {
    if (renderLeadingIcon && currentOption) {
      return renderLeadingIcon(currentOption.value);
    }
    if (currentOption?.leadingIcon) {
      return currentOption.leadingIcon();
    }
    return null;
  };

  return (
    <View>
      <Text variant="titleSmall" style={{ marginBottom: 8 }}>
        {title}
      </Text>
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TouchableRipple
            onPress={() => !disabled && setMenuVisible(true)}
            style={{
              padding: 12,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.colors.outline,
              opacity: disabled ? 0.6 : 1,
            }}
            disabled={disabled}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                {renderLeadingIconDisplay()}
                <Text
                  variant="bodyMedium"
                  style={{
                    marginLeft: renderLeadingIconDisplay() ? 12 : 0,
                    color: currentOption
                      ? theme.colors.onSurface
                      : theme.colors.onSurfaceVariant,
                  }}
                >
                  {renderCurrentDisplay()}
                </Text>
              </View>
              <Icon source="chevron-down" size={20} />
            </View>
          </TouchableRipple>
        }
      >
        {options.map((option, index) => (
          <Menu.Item
            key={index}
            onPress={() => handleSelect(option.value)}
            title={option.label}
            leadingIcon={option.leadingIcon}
            trailingIcon={
              option.value === value ? "check" : option.trailingIcon
            }
          />
        ))}
      </Menu>
    </View>
  );
}
