import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import themeSettingSlice from "./themeSettingSlice";
import sidebarSlice from "./sidebarSlice";
import authSlice from "./authSlice";

const store = configureStore({
  reducer: {
    themeSetting: themeSettingSlice,
    sidebarSlice: sidebarSlice,
    auth: authSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
        // Ignore these field paths in all actions
        ignoredActionPaths: ["meta.arg", "payload.timestamp"],
        // Ignore these paths in the state
        ignoredPaths: ["items.dates"],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

// Export types for use in components
export type AppDispatch = typeof store.dispatch;
export type AppRootState = ReturnType<typeof store.getState>;


// Export typed hooks for use in components
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <TSelected = unknown,>(
  selector: (state: AppRootState) => TSelected
) => useSelector<AppRootState, TSelected>(selector);

export default store;
