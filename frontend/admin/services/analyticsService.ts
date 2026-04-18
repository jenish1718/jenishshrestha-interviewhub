const API_URL = "http://localhost:5052/api/admin";

const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

export const getDashboardStats = async () => {
    const response = await fetch(`${API_URL}/analytics/dashboard`, { headers: authHeaders() });
    return await response.json();
};

export const getUserGrowth = async (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const response = await fetch(`${API_URL}/analytics/user-growth?${params}`, { headers: authHeaders() });
    return await response.json();
};

export const getSessionTrends = async (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const response = await fetch(`${API_URL}/analytics/session-trends?${params}`, { headers: authHeaders() });
    return await response.json();
};

export const getSkillPopularity = async () => {
    const response = await fetch(`${API_URL}/analytics/skill-popularity`, { headers: authHeaders() });
    return await response.json();
};

export interface SkillInterviewStatsDto {
    skillName: string;
    interviewCount: number;
    percentage: number;
}

export interface SkillsDistributionResponse {
    skills: SkillInterviewStatsDto[];
    totalInterviews: number;
    dateFrom: string;
    dateTo: string;
}

export const getSkillsDistribution = async (from?: string, to?: string): Promise<SkillsDistributionResponse> => {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const response = await fetch(`${API_URL}/analytics/skills-distribution?${params}`, { headers: authHeaders() });
    return await response.json();
};
