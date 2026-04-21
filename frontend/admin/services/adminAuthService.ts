// adminAuthService.ts - API calls for admin authentication
// Handles login, logout, token validation, password change, and profile retrieval.

const API_URL = "https://jenishshrestha-interviewhub-production.up.railway.app/api/admin/auth";

// Get stored admin token
const getToken = (): string | null => localStorage.getItem("adminToken");

// Shared headers with auth token
const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
});

// Admin login â€” sends credentials and stores token on success
export const adminLogin = async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (data.success) {
        localStorage.setItem("adminToken", data.accessToken);
        localStorage.setItem("adminRefreshToken", data.refreshToken);
        localStorage.setItem("adminUser", JSON.stringify(data.admin));
    }

    return data;
};

// Validate admin token
export const validateAdminToken = async () => {
    const token = getToken();
    if (!token) return { success: false };

    try {
        const response = await fetch(`${API_URL}/validate`, {
            method: "POST",
            headers: authHeaders(),
        });
        return await response.json();
    } catch {
        return { success: false };
    }
};

// Get admin profile
export const getAdminProfile = async () => {
    const response = await fetch(`${API_URL}/profile`, {
        headers: authHeaders(),
    });
    return await response.json();
};

// Change admin password
export const changeAdminPassword = async (currentPassword: string, newPassword: string) => {
    const response = await fetch(`${API_URL}/change-password`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    return await response.json();
};

// Admin logout â€” clears all admin storage
export const adminLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminRefreshToken");
    localStorage.removeItem("adminUser");
};

// Check if admin is currently logged in
export const isAdminLoggedIn = (): boolean => {
    return !!getToken();
};

// Get stored admin user info
export const getStoredAdminUser = () => {
    const user = localStorage.getItem("adminUser");
    return user ? JSON.parse(user) : null;
};
