const API_URL = "https://jenishshrestha-interviewhub-production.up.railway.app/api/questions";

const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
});

export interface QuestionsBySkillDto {
    questionId: number;
    questionText: string;
    questionType: string;
    difficulty: string;
    skillName: string;
    usageCount: number;
    source: string;
    generatedAt: string;
    sampleAnswer?: string;
}

export interface UserQuestionHistoryDto {
    id: number;
    questionId: number;
    questionText: string;
    questionType: string;
    difficulty: string;
    skillName: string;
    sessionId?: number;
    jobTitle?: string;
    askedAt: string;
    userAnswer?: string;
}

export interface UserSkillDto {
    skillId: number;
    skillName: string;
    category: string;
    questionCount: number;
}

export interface PaginatedQuestionResponse {
    success: boolean;
    message: string;
    questions: QuestionsBySkillDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface UserQuestionHistoryResponse {
    success: boolean;
    message: string;
    history: UserQuestionHistoryDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface UserSkillsResponse {
    success: boolean;
    message: string;
    skills: UserSkillDto[];
    totalCount: number;
}

export const getQuestionsBySkill = async (
    skillId: number,
    search?: string,
    page: number = 1,
    pageSize: number = 10
): Promise<PaginatedQuestionResponse> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    const response = await fetch(`${API_URL}/by-skill/${skillId}?${params}`, { headers: authHeaders() });
    return await response.json();
};

export const getMyQuestionHistory = async (
    search?: string,
    skillId?: number,
    page: number = 1,
    pageSize: number = 10
): Promise<UserQuestionHistoryResponse> => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (skillId) params.append("skillId", skillId.toString());
    params.append("page", page.toString());
    params.append("pageSize", pageSize.toString());
    const response = await fetch(`${API_URL}/my-history?${params}`, { headers: authHeaders() });
    return await response.json();
};

export const getMySkills = async (): Promise<UserSkillsResponse> => {
    const response = await fetch(`${API_URL}/skills`, { headers: authHeaders() });
    return await response.json();
};
