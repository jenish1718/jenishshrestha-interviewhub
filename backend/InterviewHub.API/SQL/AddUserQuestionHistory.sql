-- SQL Migration: Add UserQuestionHistory table and new columns to Questions
-- Run this script against your InterviewHub database

-- 1. Add new columns to Questions table (if not already present)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Questions' AND COLUMN_NAME = 'UsageCount')
BEGIN
    ALTER TABLE Questions ADD UsageCount INT NOT NULL DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Questions' AND COLUMN_NAME = 'Source')
BEGIN
    ALTER TABLE Questions ADD Source INT NOT NULL DEFAULT 0; -- 0 = Auto, 1 = Manual
END
GO

-- 2. Create index on SkillId for Questions table (if not already present)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Questions_SkillId' AND object_id = OBJECT_ID('Questions'))
BEGIN
    CREATE NONCLUSTERED INDEX IX_Questions_SkillId ON Questions (SkillId);
END
GO

-- 3. Create UserQuestionHistories table
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserQuestionHistories')
BEGIN
    CREATE TABLE UserQuestionHistories (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        QuestionId INT NOT NULL,
        SessionId INT NULL,
        AskedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
        UserAnswer NVARCHAR(2000) NULL,

        CONSTRAINT FK_UserQuestionHistories_Users FOREIGN KEY (UserId)
            REFERENCES Users(UserId) ON DELETE NO ACTION,
        CONSTRAINT FK_UserQuestionHistories_Questions FOREIGN KEY (QuestionId)
            REFERENCES Questions(QuestionId) ON DELETE NO ACTION,
        CONSTRAINT FK_UserQuestionHistories_Sessions FOREIGN KEY (SessionId)
            REFERENCES InterviewSessions(SessionId) ON DELETE NO ACTION
    );

    CREATE NONCLUSTERED INDEX IX_UserQuestionHistories_UserId ON UserQuestionHistories (UserId);
    CREATE NONCLUSTERED INDEX IX_UserQuestionHistories_QuestionId ON UserQuestionHistories (QuestionId);
    CREATE NONCLUSTERED INDEX IX_UserQuestionHistories_SessionId ON UserQuestionHistories (SessionId);
END
GO

PRINT 'Migration complete: UserQuestionHistories table created, Questions table updated.';
GO
