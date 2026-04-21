const API_URL = "https://jenishshrestha-interviewhub-production.up.railway.app/api/admin/questions";

const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

export const getQuestions = async (page = 1, pageSize = 10, search = "", type = "", skillId?: number, approved?: boolean) => {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    if (search) params.append("search", search);
    if (type) params.append("type", type);
    if (skillId) params.append("skillId", skillId.toString());
    if (approved !== undefined) params.append("approved", approved.toString());

    const response = await fetch(`${API_URL}?${params}`, { headers: authHeaders() });
    return await response.json();
};

export const createQuestion = async (data: { questionText: string; questionType: number; difficulty: number; skillId?: number; sampleAnswer?: string }) => {
    const response = await fetch(API_URL, { method: "POST", headers: authHeaders(), body: JSON.stringify(data) });
    return await response.json();
};

export const updateQuestion = async (id: number, data: { questionText: string; questionType: number; difficulty: number; skillId?: number; sampleAnswer?: string }) => {
    const response = await fetch(`${API_URL}/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(data) });
    return await response.json();
};

export const deleteQuestion = async (id: number) => {
    const response = await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: authHeaders() });
    return response.ok;
};

export const approveQuestion = async (id: number) => {
    const response = await fetch(`${API_URL}/${id}/approve`, { method: "PUT", headers: authHeaders() });
    return await response.json();
};

export const getPendingQuctions = async (page = 1, pageSize = 10) => {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    const response = await fetch(`${API_URL}/pending-approval?${params}`, { headers: authHeaders() });
    return await response.json();
};
