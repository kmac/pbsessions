import type { Action, ThunkAction } from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";
import playersReducer from "./slices/playersSlice";
import groupsReducer from "./slices/groupsSlice";
import sessionsReducer from "./slices/sessionsSlice";
import appSettingsReducer from "./slices/appSettingsSlice";
import appReducer from "./slices/appSlice";
import { storageListenerMiddleware } from "./middleware/storageMiddleware";
import { courtUpdateListenerMiddleware } from "./middleware/courtUpdateListener";

export const store = configureStore({
  reducer: {
    app: appReducer,
    players: playersReducer,
    groups: groupsReducer,
    sessions: sessionsReducer,
    appSettings: appSettingsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
        ignoredActionPaths: ["meta.arg", "payload.timestamp"],
        ignoredPaths: ["items.dates"],
      },
    })
      .prepend(storageListenerMiddleware.middleware)
      .prepend(courtUpdateListenerMiddleware.middleware)
});

export type AppStore = typeof store;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

// Define a reusable type describing thunk functions
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;

// Export typed hooks for use throughout the app
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

// Use throughout your app instead of plain `useDispatch` and `useSelector`
//export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
//export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppSelector = useSelector.withTypes<RootState>();
