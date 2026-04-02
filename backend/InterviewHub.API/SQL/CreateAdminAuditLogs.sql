-- SQL Migration: Create AdminAuditLogs table
-- Run this script against your database to add audit logging for admin actions.

-- Only create the table if it does not already exist
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AdminAuditLogs')
BEGIN
    CREATE TABLE AdminAuditLogs (
        LogId INT IDENTITY(1,1) PRIMARY KEY,
        AdminUserId INT NOT NULL,
        Action NVARCHAR(100) NOT NULL,
        Details NVARCHAR(500) NULL,
        TargetUserId INT NULL,
        TargetEntityType NVARCHAR(100) NULL,
        TargetEntityId INT NULL,
        IpAddress NVARCHAR(50) NULL,
        PerformedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),

        -- Foreign key to Users table
        CONSTRAINT FK_AdminAuditLogs_Users FOREIGN KEY (AdminUserId)
            REFERENCES Users(UserId)
            ON DELETE NO ACTION
    );

    -- Indexes for common queries (filtering by admin or date range)
    CREATE NONCLUSTERED INDEX IX_AdminAuditLogs_AdminUserId
        ON AdminAuditLogs(AdminUserId);

    CREATE NONCLUSTERED INDEX IX_AdminAuditLogs_PerformedAt
        ON AdminAuditLogs(PerformedAt);

    PRINT 'AdminAuditLogs table created successfully.';
END
ELSE
BEGIN
    PRINT 'AdminAuditLogs table already exists — skipping creation.';
END
