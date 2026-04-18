const API_URL = "http://localhost:5052/api/admin/moderation";

const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

export const getModerationQueue = async (page = 1, pageSize = 10, type?: string, status?: string) => {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    const response = await fetch(`${API_URL}/queue?${params}`, { headers: authHeaders() });
    return await response.json();
};

export const approveContent = async (id: number, notes?: string) => {
    const response = await fetch(`${API_URL}/${id}/approve`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ notes }) });
    return await response.json();
};

export const rejectContent = async (id: number, notes?: string) => {
    const response = await fetch(`${API_URL}/${id}/reject`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ notes }) });
    return await response.json();
};

export const getModerationHistory = async (page = 1, pageSize = 10) => {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    const response = await fetch(`${API_URL}/history?${params}`, { headers: authHeaders() });
    return await response.json();
};
