// AdminAuthContext.tsx - React Context for admin session state management
// Provides admin authentication state (user info, login/logout functions)
// Wraps admin routes to ensure auth state is available throughout the admin panel.

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
    adminLogin as loginApi,
    adminLogout as logoutApi,
    validateAdminToken,
    getStoredAdminUser,
    isAdminLoggedIn,
} from "../services/adminAuthService";

interface AdminUser {
    userId: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    lastLoginAt?: string;
}

interface AdminAuthContextType {
    admin: AdminUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
    logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// Hook for consuming admin auth context
export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (!context) throw new Error("useAdminAuth must be used within AdminAuthProvider");
    return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount, check if admin is already logged in via stored token
    useEffect(() => {
        const checkAuth = async () => {
            if (!isAdminLoggedIn()) {
                setIsLoading(false);
                return;
            }

            try {
                const result = await validateAdminToken();
                if (result.success) {
                    setAdmin(getStoredAdminUser());
                } else {
                    logoutApi();
                    setAdmin(null);
                }
            } catch {
                logoutApi();
                setAdmin(null);
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    // Login handler — calls API service and updates context state
    const login = useCallback(async (email: string, password: string) => {
        try {
            const result = await loginApi(email, password);
            if (result.success) {
                setAdmin(result.admin);
                return { success: true, message: "Login successful" };
            }
            return { success: false, message: result.message || "Login failed" };
        } catch {
            return { success: false, message: "Network error. Please try again." };
        }
    }, []);

    // Logout handler — clears local storage and resets state
    const logout = useCallback(() => {
        logoutApi();
        setAdmin(null);
    }, []);

    return (
        <AdminAuthContext.Provider
            value={{
                admin,
                isAuthenticated: !!admin,
                isLoading,
                login,
                logout,
            }}
        >
            {children}
        </AdminAuthContext.Provider>
    );
};

export default AdminAuthContext;
