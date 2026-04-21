const API_URL = "https://jenishshrestha-interviewhub-production.up.railway.app/api/admin";

const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

export const getAuditLogs = async (page = 1, pageSize = 10, adminId?: number, action?: string, from?: string, to?: string) => {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    if (adminId) params.append("adminId", adminId.toString());
    if (action) params.append("action", action);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await fetch(`${API_URL}/audit-logs?${params}`, { headers: authHeaders() });
    return await response.json();
};

export const getActivityLogs = async (page = 1, pageSize = 10, userId?: number, from?: string, to?: string) => {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    if (userId) params.append("userId", userId.toString());
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await fetch(`${API_URL}/activity-logs?${params}`, { headers: authHeaders() });
    return await response.json();
};

export const exportLogs = async (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const response = await fetch(`${API_URL}/logs/export`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
    });
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
};
