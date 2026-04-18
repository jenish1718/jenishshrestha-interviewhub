const API_URL = "http://localhost:5052/api/admin/settings";

const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

export const getAllSettings = async () => {
    const response = await fetch(API_URL, { headers: authHeaders() });
    return await response.json();
};

export const getSettingByKey = async (key: string) => {
    const response = await fetch(`${API_URL}/${key}`, { headers: authHeaders() });
    return await response.json();
};

export const updateSetting = async (key: string, value: string) => {
    const response = await fetch(`${API_URL}/${key}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify({ value }) });
    return await response.json();
};

export const resetDefaults = async () => {
    const response = await fetch(`${API_URL}/reset-defaults`, { method: "POST", headers: authHeaders() });
    return await response.json();
};
