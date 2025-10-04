import { useEffect } from "react";
import { BackHandler } from "react-native";

export const useBackHandler = (handler: () => boolean, deps: any[] = []) => {
  useEffect(() => {
    const backAction = () => {
      return handler();
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => {
      backHandler.remove();
    };
  }, deps);
};

export const useModalBackHandler = (visible: boolean, onClose: () => void) => {
  useBackHandler(() => {
    if (visible) {
      onClose();
      // Prevent default back action
      return true;
    }
    // Allow default back action
    return false;
  }, [visible, onClose]);
};

{/*
export const useTabBackHandler = (
  currentRoute: string,
  isFirstTab: boolean = false,
) => {
  useBackHandler(() => {
    // If on first tab, show app exit confirmation
    if (isFirstTab) {
      return true; // We'll handle this in individual tab components
    }
    return false; // Allow default back action for other tabs
  }, [currentRoute, isFirstTab]);
};

// Enhanced modal handler for complex scenarios with nested modals and change detection
export const useComplexModalBackHandler = (
  visible: boolean,
  nestedModals: { [key: string]: boolean },
  hasUnsavedChanges: boolean,
  onClose: () => void,
  closeNestedModal?: (modalKey: string) => void,
  confirmMessage?: string,
) => {
  useBackHandler(() => {
    if (!visible) return false;

    // Close nested modals first (in reverse priority order)
    const openNestedModal = Object.entries(nestedModals).find(
      ([_, isOpen]) => isOpen,
    );
    if (openNestedModal && closeNestedModal) {
      closeNestedModal(openNestedModal[0]);
      return true;
    }

    // Handle unsaved changes
    if (hasUnsavedChanges) {
      const message =
        confirmMessage ||
        "You have unsaved changes. Are you sure you want to close?";
      // We can't use Alert here directly as it would create a circular dependency
      // The component should handle the confirmation
      return true; // Let the component handle the confirmation
    }

    // Close normally
    onClose();
    return true;
  }, [visible, nestedModals, hasUnsavedChanges, onClose, closeNestedModal]);
};
*/}
