const API_URL = "https://jenishshrestha-interviewhub-production.up.railway.app/api/admin/sessions";

const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

export const getSessions = async (page = 1, pageSize = 10, userId?: number, dateFrom?: string, dateTo?: string, status?: string) => {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    if (userId) params.append("userId", userId.toString());
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);
    if (status) params.append("status", status);

    const response = await fetch(`${API_URL}?${params}`, { headers: authHeaders() });
    return await response.json();
};

export const getSessionDetail = async (id: number) => {
    const response = await fetch(`${API_URL}/${id}`, { headers: authHeaders() });
    return await response.json();
};

export const getSessionStats = async () => {
    const response = await fetch(`${API_URL}/stats`, { headers: authHeaders() });
    return await response.json();
};

export const getSessionTranscript = async (id: number) => {
    const response = await fetch(`${API_URL}/${id}/transcript`, { headers: authHeaders() });
    return await response.json();
};
