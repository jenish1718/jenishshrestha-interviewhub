// userManagementService.ts - API calls for admin user management
// Handles user listing, details, status updates, deletion, and statistics.

const API_URL = "https://jenishshrestha-interviewhub-production.up.railway.app/api/admin/users";

const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

// Fetch paginated user list with search and filters
export const getUsers = async (
    page = 1,
    pageSize = 10,
    search = "",
    role = "",
    status = ""
) => {
    const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
    });
    if (search) params.append("search", search);
    if (role) params.append("role", role);
    if (status) params.append("status", status);

    const response = await fetch(`${API_URL}?${params}`, {
        headers: authHeaders(),
    });
    return await response.json();
};

// Fetch single user details
export const getUserById = async (userId: number) => {
    const response = await fetch(`${API_URL}/${userId}`, {
        headers: authHeaders(),
    });
    return await response.json();
};

// Update user status (enable/disable/suspend)
export const updateUserStatus = async (
    userId: number,
    statusUpdate: { isActive?: boolean; isSuspended?: boolean }
) => {
    const response = await fetch(`${API_URL}/${userId}/status`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(statusUpdate),
    });
    return await response.json();
};

// Delete a user (soft delete)
export const deleteUser = async (userId: number) => {
    const response = await fetch(`${API_URL}/${userId}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return await response.json();
};

// Fetch user statistics for dashboard cards
export const getUserStats = async () => {
    const response = await fetch(`${API_URL}/stats`, {
        headers: authHeaders(),
    });
    return await response.json();
};
