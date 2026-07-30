// frontend/src/core/data/redux/authSlice.tsx
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
    id: number;
    name: string;
    email: string;
    role: "SUPER_ADMIN" | "HR" | "MANAGER" | "EMPLOYEE";
    companyId: number | null;
    subdomain: string | null;
}

export interface AuthState {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
}

// Load token from localStorage on app start
const savedToken = localStorage.getItem("token");
const savedUser = localStorage.getItem("authUser");

const initialState: AuthState = {
    token: savedToken || null,
    user: savedUser ? JSON.parse(savedUser) : null,
    isAuthenticated: !!savedToken,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        // Called after successful login
        setCredentials: (state, action: PayloadAction<{ token: string; user: AuthUser }>) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.isAuthenticated = true;
            // Persist to localStorage so page refresh doesn't log out
            localStorage.setItem("token", action.payload.token);
            localStorage.setItem("authUser", JSON.stringify(action.payload.user));
        },
        // Called on logout
        logout: (state) => {
            state.token = null;
            state.user = null;
            state.isAuthenticated = false;
            localStorage.removeItem("token");
            localStorage.removeItem("authUser");
            localStorage.removeItem("userRole");
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
