const API_URL = "https://jenishshrestha-interviewhub-production.up.railway.app/api/admin/skills";

const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

export interface Skill {
    skillId: number;
    skillName: string;
    category: string;
    difficultyLevel: string;
    usageCount: number;
    isGlobal: boolean;
    createdAt: string;
}

export interface SkillStats {
    totalSkills: number;
    technicalSkills: number;
    softSkills: number;
    mostUsedSkillId: number;
    mostUsedSkillName: string;
    mostUsedSkillCount: number;
}

export interface CreateSkillDto {
    skillName: string;
    category: number;
    difficultyLevel: number;
    isGlobal: boolean;
}

export interface UpdateSkillDto {
    skillName: string;
    category: number;
    difficultyLevel: number;
    isGlobal: boolean;
}

export const getAllSkills = async (page = 1, pageSize = 10, search = "", category = "", isGlobal?: boolean) => {
    const params = new URLSearchParams({ page: page.toString(), pageSize: pageSize.toString() });
    if (search) params.append("search", search);
    if (category) params.append("category", category);
    if (isGlobal !== undefined) params.append("isGlobal", isGlobal.toString());
    const response = await fetch(`${API_URL}?${params}`, { headers: authHeaders() });
    return await response.json();
};

export const createSkill = async (skill: CreateSkillDto) => {
    const response = await fetch(API_URL, { method: "POST", headers: authHeaders(), body: JSON.stringify(skill) });
    return await response.json();
};

export const updateSkill = async (id: number, skill: UpdateSkillDto) => {
    const response = await fetch(`${API_URL}/${id}`, { method: "PUT", headers: authHeaders(), body: JSON.stringify(skill) });
    return await response.json();
};

export const deleteSkill = async (id: number) => {
    await fetch(`${API_URL}/${id}`, { method: "DELETE", headers: authHeaders() });
};

export const getSkillStats = async () => {
    const response = await fetch(`${API_URL}/stats`, { headers: authHeaders() });
    return await response.json();
};

export const importSkills = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_URL}/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
        body: formData,
    });
    return await response.json();
};

export const exportSkills = async () => {
    const response = await fetch(`${API_URL}/export`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` },
    });
    return await response.blob();
};
