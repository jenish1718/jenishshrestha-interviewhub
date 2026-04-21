# =============================================================================
# InterviewHub Git History Rewrite Script
# Splits the monolithic commit into feature-based commits from March 24 - April 21
# Both GIT_AUTHOR_DATE and GIT_COMMITTER_DATE will match for each commit
# =============================================================================

$ErrorActionPreference = "Stop"
$repoDir = "c:\Users\acer\OneDrive\Desktop\interviewhub"
$backupDir = "c:\Users\acer\OneDrive\Desktop\interviewhub_backup_temp"

Set-Location $repoDir

Write-Host "============================================" -ForegroundColor Cyan
Write-Host " InterviewHub Git History Rewrite" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# ------------------------------------------------------------------
# Step 1: Backup the entire working directory (excluding .git and node_modules)
# ------------------------------------------------------------------
Write-Host "`n[Step 1] Creating backup of working directory..." -ForegroundColor Yellow

if (Test-Path $backupDir) {
    Remove-Item -Recurse -Force $backupDir
}

# Use robocopy to copy everything except .git and node_modules
robocopy $repoDir $backupDir /E /XD ".git" "node_modules" ".vs" /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
Write-Host "  Backup created at: $backupDir" -ForegroundColor Green

# ------------------------------------------------------------------
# Step 2: Create a safety backup branch, then hard reset to first commit
# ------------------------------------------------------------------
Write-Host "`n[Step 2] Creating safety backup branch and resetting..." -ForegroundColor Yellow

# Delete backup branch if exists (ignore error if it doesn't exist)
try { git branch -D backup-before-rewrite 2>$null } catch {}
git branch backup-before-rewrite

# Hard reset to first commit
git reset --hard 7f0e5a4946c98e88599fd63dd9db124b7593340e
Write-Host "  Reset to initial commit (7f0e5a4)" -ForegroundColor Green

# ------------------------------------------------------------------
# Helper function: Create a commit with specific date
# ------------------------------------------------------------------
function Make-Commit {
    param(
        [string]$Date,
        [string]$Message
    )
    
    $env:GIT_AUTHOR_DATE = $Date
    $env:GIT_COMMITTER_DATE = $Date
    
    git commit -m $Message
    
    $env:GIT_AUTHOR_DATE = $null
    $env:GIT_COMMITTER_DATE = $null
    
    Write-Host "  Committed: $Message ($Date)" -ForegroundColor Green
}

# Helper function: Copy file from backup to repo
function Copy-FromBackup {
    param([string]$RelativePath)
    
    $src = Join-Path $backupDir $RelativePath
    $dst = Join-Path $repoDir $RelativePath
    
    if (Test-Path $src) {
        $dstDir = Split-Path $dst -Parent
        if (!(Test-Path $dstDir)) {
            New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
        }
        Copy-Item -Path $src -Destination $dst -Force
        git add $RelativePath
        return $true
    } else {
        Write-Host "  WARNING: $RelativePath not found in backup" -ForegroundColor Red
        return $false
    }
}

# Helper function: Remove a tracked file
function Remove-TrackedFile {
    param([string]$RelativePath)
    
    $fullPath = Join-Path $repoDir $RelativePath
    if (Test-Path $fullPath) {
        git rm -f $RelativePath 2>$null
    }
}

# ==================================================================
# COMMIT 1: March 24 - Initialize backend project structure
# ==================================================================
Write-Host "`n[Commit 1] Backend project initialization..." -ForegroundColor Cyan

$backendFiles = @(
    "backend/InterviewHub.API/InterviewHub.API.csproj",
    "backend/InterviewHub.API/Program.cs",
    "backend/InterviewHub.API/Properties/launchSettings.json",
    "backend/InterviewHub.API/appsettings.json",
    "backend/InterviewHub.API/appsettings.Development.json"
)

foreach ($f in $backendFiles) {
    Copy-FromBackup $f | Out-Null
}

git add -A backend/InterviewHub.API/InterviewHub.API.csproj backend/InterviewHub.API/Program.cs backend/InterviewHub.API/Properties/ backend/InterviewHub.API/appsettings*.json 2>$null
Make-Commit "2026-03-24T10:30:00+05:45" "feat: initialize backend .NET API project structure"

# ==================================================================
# COMMIT 2: March 25 - Database models
# ==================================================================
Write-Host "`n[Commit 2] Database models..." -ForegroundColor Cyan

$modelFiles = @(
    "backend/InterviewHub.API/Models/User.cs",
    "backend/InterviewHub.API/Models/UserRole.cs",
    "backend/InterviewHub.API/Models/Skill.cs",
    "backend/InterviewHub.API/Models/SkillCategory.cs",
    "backend/InterviewHub.API/Models/Question.cs",
    "backend/InterviewHub.API/Models/QuestionEnums.cs",
    "backend/InterviewHub.API/Models/InterviewSession.cs",
    "backend/InterviewHub.API/Models/SessionAnswer.cs",
    "backend/InterviewHub.API/Models/InterviewReport.cs",
    "backend/InterviewHub.API/Models/ConfidenceMetrics.cs",
    "backend/InterviewHub.API/Models/RefreshToken.cs",
    "backend/InterviewHub.API/Models/UserActivityLog.cs",
    "backend/InterviewHub.API/Models/UserQuestionHistory.cs",
    "backend/InterviewHub.API/Models/AdminAuditLog.cs",
    "backend/InterviewHub.API/Models/FlaggedContent.cs",
    "backend/InterviewHub.API/Models/JobEmail.cs",
    "backend/InterviewHub.API/Models/SystemSetting.cs"
)

foreach ($f in $modelFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-03-25T11:15:00+05:45" "feat: add database entity models"

# ==================================================================
# COMMIT 3: March 26 - Database context and migrations
# ==================================================================
Write-Host "`n[Commit 3] Database context and migrations..." -ForegroundColor Cyan

Copy-FromBackup "backend/InterviewHub.API/Data/ApplicationDbContext.cs" | Out-Null

# Copy migration files
$migrationSrc = Join-Path $backupDir "backend/InterviewHub.API/Migrations"
$migrationDst = Join-Path $repoDir "backend/InterviewHub.API/Migrations"
if (Test-Path $migrationSrc) {
    if (!(Test-Path $migrationDst)) {
        New-Item -ItemType Directory -Path $migrationDst -Force | Out-Null
    }
    Copy-Item -Path "$migrationSrc\*" -Destination $migrationDst -Recurse -Force
    git add "backend/InterviewHub.API/Migrations/"
}

Make-Commit "2026-03-26T14:00:00+05:45" "feat: add database context and EF Core migrations"

# ==================================================================
# COMMIT 4: March 27 - Backend DTOs
# ==================================================================
Write-Host "`n[Commit 4] Backend DTOs..." -ForegroundColor Cyan

$dtoFiles = @(
    "backend/InterviewHub.API/DTOs/Candidate/QuestionDTOs.cs",
    "backend/InterviewHub.API/DTOs/Candidate/UserDtos.cs",
    "backend/InterviewHub.API/DTOs/SkillDtos.cs",
    "backend/InterviewHub.API/DTOs/Admin/AnalyticsDtos.cs",
    "backend/InterviewHub.API/DTOs/Admin/AuditLogDtos.cs",
    "backend/InterviewHub.API/DTOs/Admin/ModerationDtos.cs",
    "backend/InterviewHub.API/DTOs/Admin/QuestionDtos.cs",
    "backend/InterviewHub.API/DTOs/Admin/SessionDtos.cs",
    "backend/InterviewHub.API/DTOs/Admin/SettingsDtos.cs",
    "backend/InterviewHub.API/DTOs/Admin/SkillsDistributionDtos.cs"
)

foreach ($f in $dtoFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-03-27T10:00:00+05:45" "feat: add data transfer objects for API endpoints"

# ==================================================================
# COMMIT 5: March 28 - Candidate services (Auth, JWT)
# ==================================================================
Write-Host "`n[Commit 5] Candidate authentication services..." -ForegroundColor Cyan

$authServiceFiles = @(
    "backend/InterviewHub.API/Services/Candidate/AuthService.cs",
    "backend/InterviewHub.API/Services/Candidate/IAuthService.cs",
    "backend/InterviewHub.API/Services/Candidate/JwtService.cs",
    "backend/InterviewHub.API/Services/Candidate/IJwtService.cs"
)

foreach ($f in $authServiceFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-03-28T11:30:00+05:45" "feat: implement JWT authentication services"

# ==================================================================
# COMMIT 6: March 29 - AI, Scoring, Question services
# ==================================================================
Write-Host "`n[Commit 6] AI and scoring services..." -ForegroundColor Cyan

$aiServiceFiles = @(
    "backend/InterviewHub.API/Services/Candidate/GeminiAIService.cs",
    "backend/InterviewHub.API/Services/Candidate/ScoringService.cs",
    "backend/InterviewHub.API/Services/Candidate/QuestionService.cs",
    "backend/InterviewHub.API/Services/Candidate/JobEmailParserService.cs"
)

foreach ($f in $aiServiceFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-03-29T15:00:00+05:45" "feat: add Gemini AI integration and scoring engine"

# ==================================================================
# COMMIT 7: March 31 - Admin backend services
# ==================================================================
Write-Host "`n[Commit 7] Admin backend services..." -ForegroundColor Cyan

$adminServiceFiles = @(
    "backend/InterviewHub.API/Services/Admin/AdminAuthService.cs",
    "backend/InterviewHub.API/Services/Admin/AdminAuthorizeAttribute.cs",
    "backend/InterviewHub.API/Services/Admin/IAdminAuthService.cs",
    "backend/InterviewHub.API/Services/Admin/AnalyticsService.cs",
    "backend/InterviewHub.API/Services/Admin/AuditLogService.cs",
    "backend/InterviewHub.API/Services/Admin/ContentModerationService.cs",
    "backend/InterviewHub.API/Services/Admin/JobEmailManagementService.cs",
    "backend/InterviewHub.API/Services/Admin/IJobEmailManagementService.cs",
    "backend/InterviewHub.API/Services/Admin/QuestionManagementService.cs",
    "backend/InterviewHub.API/Services/Admin/SessionMonitoringService.cs",
    "backend/InterviewHub.API/Services/Admin/SettingsService.cs",
    "backend/InterviewHub.API/Services/Admin/SkillManagementService.cs",
    "backend/InterviewHub.API/Services/Admin/ISkillManagementService.cs",
    "backend/InterviewHub.API/Services/Admin/UserManagementService.cs",
    "backend/InterviewHub.API/Services/Admin/IUserManagementService.cs"
)

foreach ($f in $adminServiceFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-03-31T14:30:00+05:45" "feat: implement admin panel backend services"

# ==================================================================
# COMMIT 8: April 1 - Backend controllers (Candidate)
# ==================================================================
Write-Host "`n[Commit 8] Candidate API controllers..." -ForegroundColor Cyan

$candidateControllerFiles = @(
    "backend/InterviewHub.API/Controllers/Candidate/AuthController.cs",
    "backend/InterviewHub.API/Controllers/Candidate/InterviewSessionController.cs",
    "backend/InterviewHub.API/Controllers/Candidate/ConfidenceMetricsController.cs",
    "backend/InterviewHub.API/Controllers/Candidate/QuestionController.cs",
    "backend/InterviewHub.API/Controllers/Candidate/QuestionsController.cs",
    "backend/InterviewHub.API/Controllers/Candidate/ReportController.cs",
    "backend/InterviewHub.API/Controllers/Candidate/SkillController.cs",
    "backend/InterviewHub.API/Controllers/Candidate/JobEmailController.cs"
)

foreach ($f in $candidateControllerFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-01T11:00:00+05:45" "feat: add candidate API controllers"

# ==================================================================
# COMMIT 9: April 2 - Backend controllers (Admin) + SQL
# ==================================================================
Write-Host "`n[Commit 9] Admin API controllers and SQL scripts..." -ForegroundColor Cyan

$adminControllerFiles = @(
    "backend/InterviewHub.API/Controllers/Admin/AdminAuthController.cs",
    "backend/InterviewHub.API/Controllers/Admin/AnalyticsController.cs",
    "backend/InterviewHub.API/Controllers/Admin/AuditLogsController.cs",
    "backend/InterviewHub.API/Controllers/Admin/JobEmailManagementController.cs",
    "backend/InterviewHub.API/Controllers/Admin/ModerationController.cs",
    "backend/InterviewHub.API/Controllers/Admin/QuestionsController.cs",
    "backend/InterviewHub.API/Controllers/Admin/SessionsController.cs",
    "backend/InterviewHub.API/Controllers/Admin/SettingsController.cs",
    "backend/InterviewHub.API/Controllers/Admin/SkillsController.cs",
    "backend/InterviewHub.API/Controllers/Admin/UserManagementController.cs",
    "backend/InterviewHub.API/SQL/AddUserQuestionHistory.sql",
    "backend/InterviewHub.API/SQL/CreateAdminAuditLogs.sql"
)

foreach ($f in $adminControllerFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-02T10:30:00+05:45" "feat: add admin API controllers and SQL scripts"

# ==================================================================
# COMMIT 10: April 3 - Restructure frontend project
# ==================================================================
Write-Host "`n[Commit 10] Restructure frontend project..." -ForegroundColor Cyan

# Remove old root-level files that are moving to frontend/
Remove-TrackedFile "App.tsx"
Remove-TrackedFile "components/Button.tsx"
Remove-TrackedFile "components/FeatureCard.tsx"
Remove-TrackedFile "components/Footer.tsx"
Remove-TrackedFile "components/Navbar.tsx"
Remove-TrackedFile "constants.ts"
Remove-TrackedFile "index.html"
Remove-TrackedFile "index.tsx"
Remove-TrackedFile "metadata.json"
Remove-TrackedFile "package.json"
Remove-TrackedFile "package-lock.json"
Remove-TrackedFile "pages/LandingPage.tsx"
Remove-TrackedFile "pages/SignIn.tsx"
Remove-TrackedFile "pages/SignUp.tsx"
Remove-TrackedFile "tsconfig.json"
Remove-TrackedFile "types.ts"
Remove-TrackedFile "vite.config.ts"

# Remove .vs files (IDE state)
Remove-TrackedFile ".vs/VSWorkspaceState.json"
Remove-TrackedFile ".vs/interviewhub/CopilotIndices/17.14.1518.61961/CodeChunks.db"
Remove-TrackedFile ".vs/interviewhub/CopilotIndices/17.14.1518.61961/SemanticSymbols.db"
Remove-TrackedFile ".vs/interviewhub/FileContentIndex/5002a4a3-b849-423d-9085-f197739a281b.vsidx"
Remove-TrackedFile ".vs/interviewhub/v17/.wsuo"
Remove-TrackedFile ".vs/interviewhub/v17/DocumentLayout.json"
Remove-TrackedFile ".vs/slnx.sqlite"

# Copy new frontend project files
$frontendCoreFiles = @(
    "frontend/package.json",
    "frontend/package-lock.json",
    "frontend/tsconfig.json",
    "frontend/vite.config.ts",
    "frontend/index.html",
    "frontend/index.tsx",
    "frontend/types.ts",
    "frontend/constants.ts"
)

foreach ($f in $frontendCoreFiles) {
    Copy-FromBackup $f | Out-Null
}

# Update .gitignore
Copy-FromBackup ".gitignore" | Out-Null

Make-Commit "2026-04-03T10:30:00+05:45" "refactor: restructure frontend into dedicated directory"

# ==================================================================
# COMMIT 11: April 5 - Frontend components
# ==================================================================
Write-Host "`n[Commit 11] Frontend components..." -ForegroundColor Cyan

$componentFiles = @(
    "frontend/components/Button.tsx",
    "frontend/components/FeatureCard.tsx",
    "frontend/components/Footer.tsx",
    "frontend/components/Navbar.tsx",
    "frontend/components/WebcamFeed.tsx",
    "frontend/components/ConfidenceIndicators.tsx"
)

foreach ($f in $componentFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-05T14:00:00+05:45" "feat: add frontend UI components with webcam and confidence indicators"

# ==================================================================
# COMMIT 12: April 7 - Frontend hooks
# ==================================================================
Write-Host "`n[Commit 12] Frontend custom hooks..." -ForegroundColor Cyan

$hookFiles = @(
    "frontend/hooks/index.ts",
    "frontend/hooks/useConfidenceAnalysis.ts",
    "frontend/hooks/useInterviewSession.ts",
    "frontend/hooks/useSpeakingMetrics.ts",
    "frontend/hooks/useSpeechRecognition.ts",
    "frontend/hooks/useSpeechSynthesis.ts",
    "frontend/hooks/useWebcam.ts"
)

foreach ($f in $hookFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-07T11:00:00+05:45" "feat: implement custom React hooks for interview features"

# ==================================================================
# COMMIT 13: April 8 - Frontend services
# ==================================================================
Write-Host "`n[Commit 13] Frontend services..." -ForegroundColor Cyan

Copy-FromBackup "frontend/services/questionService.ts" | Out-Null

Make-Commit "2026-04-08T10:30:00+05:45" "feat: add frontend API service layer"

# ==================================================================
# COMMIT 14: April 9 - Authentication pages
# ==================================================================
Write-Host "`n[Commit 14] Authentication pages..." -ForegroundColor Cyan

$authPageFiles = @(
    "frontend/pages/SignIn.tsx",
    "frontend/pages/SignUp.tsx"
)

foreach ($f in $authPageFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-09T15:30:00+05:45" "feat: build sign in and sign up pages"

# ==================================================================
# COMMIT 15: April 10 - Dashboard and landing page
# ==================================================================
Write-Host "`n[Commit 15] Dashboard and landing page..." -ForegroundColor Cyan

$dashboardFiles = @(
    "frontend/pages/LandingPage.tsx",
    "frontend/pages/Dashboard.tsx"
)

foreach ($f in $dashboardFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-10T10:00:00+05:45" "feat: create landing page and user dashboard"

# ==================================================================
# COMMIT 16: April 11 - Mock interview flow
# ==================================================================
Write-Host "`n[Commit 16] Mock interview pages..." -ForegroundColor Cyan

$interviewFiles = @(
    "frontend/pages/MockInterview.tsx",
    "frontend/pages/InterviewResults.tsx",
    "frontend/pages/InterviewReport.tsx"
)

foreach ($f in $interviewFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-11T14:00:00+05:45" "feat: implement mock interview flow with results and reports"

# ==================================================================
# COMMIT 17: April 12 - Report history and questions pages
# ==================================================================
Write-Host "`n[Commit 17] Report history and questions pages..." -ForegroundColor Cyan

$reportFiles = @(
    "frontend/pages/ReportHistory.tsx",
    "frontend/pages/MyQuestionsPage.tsx"
)

foreach ($f in $reportFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-12T11:30:00+05:45" "feat: add report history and question bank pages"

# ==================================================================
# COMMIT 18: April 14 - Admin authentication
# ==================================================================
Write-Host "`n[Commit 18] Admin authentication system..." -ForegroundColor Cyan

$adminAuthFiles = @(
    "frontend/admin/context/AdminAuthContext.tsx",
    "frontend/admin/components/AdminRoute.tsx",
    "frontend/admin/pages/AdminLogin.tsx",
    "frontend/admin/services/adminAuthService.ts"
)

foreach ($f in $adminAuthFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-14T10:00:00+05:45" "feat: set up admin authentication and protected routes"

# ==================================================================
# COMMIT 19: April 15 - Admin dashboard + App.tsx
# ==================================================================
Write-Host "`n[Commit 19] Admin dashboard and app routing..." -ForegroundColor Cyan

$adminDashFiles = @(
    "frontend/admin/pages/AdminDashboard.tsx",
    "frontend/admin/pages/AdminHome.tsx",
    "frontend/App.tsx"
)

foreach ($f in $adminDashFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-15T15:00:00+05:45" "feat: build admin dashboard and configure app routing"

# ==================================================================
# COMMIT 20: April 16 - Admin management pages
# ==================================================================
Write-Host "`n[Commit 20] Admin management pages..." -ForegroundColor Cyan

$adminMgmtFiles = @(
    "frontend/admin/pages/UserManagement.tsx",
    "frontend/admin/pages/QuestionManagement.tsx",
    "frontend/admin/pages/SkillManagement.tsx",
    "frontend/admin/pages/SessionMonitoring.tsx"
)

foreach ($f in $adminMgmtFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-16T11:00:00+05:45" "feat: add user, question, skill, and session management pages"

# ==================================================================
# COMMIT 21: April 17 - Admin analytics and settings
# ==================================================================
Write-Host "`n[Commit 21] Admin analytics and settings..." -ForegroundColor Cyan

$adminAnalyticsFiles = @(
    "frontend/admin/pages/Analytics.tsx",
    "frontend/admin/pages/AdminSkillsAnalytics.tsx",
    "frontend/admin/pages/SystemSettings.tsx",
    "frontend/admin/pages/AuditLogs.tsx",
    "frontend/admin/pages/ContentModeration.tsx"
)

foreach ($f in $adminAnalyticsFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-17T14:30:00+05:45" "feat: implement analytics dashboard and system settings"

# ==================================================================
# COMMIT 22: April 18 - Admin frontend services
# ==================================================================
Write-Host "`n[Commit 22] Admin frontend services..." -ForegroundColor Cyan

$adminFrontendServiceFiles = @(
    "frontend/admin/services/analyticsService.ts",
    "frontend/admin/services/auditLogService.ts",
    "frontend/admin/services/jobEmailManagementService.ts",
    "frontend/admin/services/moderationService.ts",
    "frontend/admin/services/questionService.ts",
    "frontend/admin/services/sessionService.ts",
    "frontend/admin/services/settingsService.ts",
    "frontend/admin/services/skillService.ts",
    "frontend/admin/services/userManagementService.ts"
)

foreach ($f in $adminFrontendServiceFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-18T10:00:00+05:45" "feat: add admin frontend API services"

# ==================================================================
# COMMIT 23: April 19 - Skill components and job email management
# ==================================================================
Write-Host "`n[Commit 23] Skill components and job email management..." -ForegroundColor Cyan

$skillComponentFiles = @(
    "frontend/admin/components/skills/AddSkillModal.tsx",
    "frontend/admin/components/skills/DeleteSkillModal.tsx",
    "frontend/admin/components/skills/EditSkillModal.tsx",
    "frontend/admin/components/skills/ImportSkillsModal.tsx",
    "frontend/admin/components/skills/SkillStatsPanel.tsx",
    "frontend/admin/pages/JobEmailManagement.tsx"
)

foreach ($f in $skillComponentFiles) {
    Copy-FromBackup $f | Out-Null
}

Make-Commit "2026-04-19T11:30:00+05:45" "feat: add skill management modals and job email management"

# ==================================================================
# COMMIT 24: April 21 - Final polish, README, scripts, cleanup
# ==================================================================
Write-Host "`n[Commit 24] Final cleanup and documentation..." -ForegroundColor Cyan

# Copy README
Copy-FromBackup "README.md" | Out-Null

# Copy scripts
Copy-FromBackup "scripts/HashHelper.csx" | Out-Null

# Stage everything remaining
git add -A

Make-Commit "2026-04-21T14:00:00+05:45" "docs: update README and add utility scripts"

# ------------------------------------------------------------------
# Done! Show the new history
# ------------------------------------------------------------------
Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host " HISTORY REWRITE COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "New commit history:" -ForegroundColor Yellow
git log --oneline --format="%h %ai %s"

Write-Host "`nBackup branch: backup-before-rewrite" -ForegroundColor Yellow
Write-Host "Backup directory: $backupDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "To push, run: git push origin main --force" -ForegroundColor Magenta
Write-Host "To clean up backup: Remove-Item -Recurse -Force '$backupDir'" -ForegroundColor Magenta
