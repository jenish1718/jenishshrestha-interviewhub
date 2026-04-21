# InterviewHub

InterviewHub is an AI-powered interview preparation platform. It allows users to simulate mock interviews and receive real-time scoring, confidence metrics, and feedback using AI. It features speech recognition, video analysis, and detailed post-interview reporting.

## Project Structure

- **backend/**: ASP.NET Core Web API serving as the application backbone, integrating with generative AI (Gemini), managing data persistence via Entity Framework, and handling authentication/authorization.
- **frontend/**: React + Vite web application containing Candidate and Admin dashboards, real-time interview interfaces, and detailed analytics.
- **scripts/**: Utility scripts (e.g., helpers for password hashing).

## Running Locally

### Backend
1. Navigate to `backend/InterviewHub.API/`
2. Update the connection string in `appsettings.Development.json` if needed.
3. Apply database migrations: `dotnet ef database update`
4. Run the API: `dotnet run`

### Frontend
1. Navigate to `frontend/`
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
