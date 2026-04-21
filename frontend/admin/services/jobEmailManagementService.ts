// jobEmailManagementService.ts - API calls for admin job email management
// Handles listing, details, editing, deletion, and statistics for job emails.

const API_URL = "https://jenishshrestha-interviewhub-production.up.railway.app/api/admin/job-emails";

const authHeaders = (): Record<string, string> => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
});

// Fetch paginated job emails with search and filters
export const getJobEmails = async (
    page = 1,
    pageSize = 10,
    search = "",
    userId?: number,
    dateFrom?: string,
    dateTo?: string
) => {
    const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
    });
    if (search) params.append("search", search);
    if (userId) params.append("userId", userId.toString());
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);

    const response = await fetch(`${API_URL}?${params}`, {
        headers: authHeaders(),
    });
    return await response.json();
};

// Fetch single job email details
export const getJobEmailById = async (emailId: number) => {
    const response = await fetch(`${API_URL}/${emailId}`, {
        headers: authHeaders(),
    });
    return await response.json();
};

// Update job email fields
export const updateJobEmail = async (
    emailId: number,
    update: { jobTitle?: string; companyName?: string; emailContent?: string; status?: string }
) => {
    const response = await fetch(`${API_URL}/${emailId}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(update),
    });
    return await response.json();
};

// Delete a job email
export const deleteJobEmail = async (emailId: number) => {
    const response = await fetch(`${API_URL}/${emailId}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    return await response.json();
};

// Fetch job email statistics
export const getJobEmailStats = async () => {
    const response = await fetch(`${API_URL}/stats`, {
        headers: authHeaders(),
    });
    return await response.json();
};
