/*
 * ApplicationDbContext.cs - Entity Framework Core Database Context
 * Configures database mappings for all user-facing entities.
 */

using InterviewHub.API.Models;
using Microsoft.EntityFrameworkCore;

namespace InterviewHub.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.ConfigureWarnings(warnings =>
            warnings.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
        base.OnConfiguring(optionsBuilder);
    }

    // User-facing entities
    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<JobEmail> JobEmails { get; set; }
    public DbSet<Skill> Skills { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<InterviewSession> InterviewSessions { get; set; }
    public DbSet<SessionAnswer> SessionAnswers { get; set; }
    public DbSet<ConfidenceMetrics> ConfidenceMetrics { get; set; }
    public DbSet<InterviewReport> InterviewReports { get; set; }

    // Admin entities
    public DbSet<AdminAuditLog> AdminAuditLogs { get; set; }
    public DbSet<FlaggedContent> FlaggedContents { get; set; }
    public DbSet<SystemSetting> SystemSettings { get; set; }
    public DbSet<UserActivityLog> UserActivityLogs { get; set; }
    public DbSet<UserQuestionHistory> UserQuestionHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.UserId);
            
            entity.Property(u => u.Email)
                .IsRequired()
                .HasMaxLength(256);
            
            entity.HasIndex(u => u.Email).IsUnique();
            
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.FirstName).IsRequired().HasMaxLength(50);
            entity.Property(u => u.LastName).IsRequired().HasMaxLength(50);
            
            entity.Property(u => u.Role).HasConversion<int>();
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(u => u.IsActive).HasDefaultValue(true);

            entity.HasMany(u => u.RefreshTokens)
                .WithOne(rt => rt.User)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // RefreshToken configuration
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(rt => rt.Id);
            entity.Property(rt => rt.Token).IsRequired();
            entity.Property(rt => rt.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.HasIndex(rt => rt.Token);
        });

        // JobEmail configuration
        modelBuilder.Entity<JobEmail>(entity =>
        {
            entity.HasKey(e => e.EmailId);
            entity.Property(e => e.EmailContent).IsRequired();
            entity.Property(e => e.UploadDate).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Status).HasDefaultValue("Pending");
            entity.HasIndex(e => e.UserId);
            
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // Skill configuration
        modelBuilder.Entity<Skill>(entity =>
        {
            entity.HasKey(s => s.SkillId);
            entity.Property(s => s.SkillName).IsRequired().HasMaxLength(100);
            entity.Property(s => s.Category).HasConversion<int>();
            entity.Property(s => s.ExtractedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(s => s.IsDeleted).HasDefaultValue(false);
            entity.Property(s => s.IsGlobal).HasDefaultValue(false);
            
            entity.HasIndex(s => s.EmailId);
            entity.HasIndex(s => s.IsGlobal);
            
            entity.HasOne(s => s.JobEmail)
                .WithMany()
                .HasForeignKey(s => s.EmailId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false);
        });

        // Question configuration
        modelBuilder.Entity<Question>(entity =>
        {
            entity.HasKey(q => q.QuestionId);
            entity.Property(q => q.QuestionText).IsRequired().HasMaxLength(1000);
            entity.Property(q => q.QuestionType).HasConversion<int>();
            entity.Property(q => q.Difficulty).HasConversion<int>();
            entity.Property(q => q.GeneratedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(q => q.IsAI).HasDefaultValue(true);
            entity.Property(q => q.IsApproved).HasDefaultValue(true);
            entity.Property(q => q.IsDeleted).HasDefaultValue(false);
            
            entity.HasIndex(q => q.EmailId);
            entity.HasIndex(q => q.IsApproved);
            entity.HasIndex(q => q.IsAI);
            
            entity.HasOne(q => q.JobEmail)
                .WithMany()
                .HasForeignKey(q => q.EmailId)
                .OnDelete(DeleteBehavior.SetNull)
                .IsRequired(false);
            
            entity.HasOne(q => q.Skill)
                .WithMany()
                .HasForeignKey(q => q.SkillId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(q => q.UsageCount).HasDefaultValue(0);
            entity.Property(q => q.Source).HasConversion<int>().HasDefaultValue(QuestionSource.Auto);
            entity.HasIndex(q => q.SkillId);
        });

        // InterviewSession configuration
        modelBuilder.Entity<InterviewSession>(entity =>
        {
            entity.HasKey(s => s.SessionId);
            entity.Property(s => s.Status).HasConversion<int>();
            entity.Property(s => s.StartTime).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.HasIndex(s => s.UserId);
            entity.HasIndex(s => s.EmailId);
            
            entity.HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.NoAction);
            
            entity.HasOne(s => s.JobEmail)
                .WithMany()
                .HasForeignKey(s => s.EmailId)
                .OnDelete(DeleteBehavior.NoAction);
            
            entity.HasMany(s => s.Answers)
                .WithOne(a => a.Session)
                .HasForeignKey(a => a.SessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // SessionAnswer configuration
        modelBuilder.Entity<SessionAnswer>(entity =>
        {
            entity.HasKey(a => a.AnswerId);
            entity.Property(a => a.SpeakingPaceWPM).HasColumnType("decimal(5,2)");
            entity.Property(a => a.AnsweredAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.HasIndex(a => a.SessionId);
            entity.HasIndex(a => a.QuestionId);
            
            entity.HasOne(a => a.Question)
                .WithMany()
                .HasForeignKey(a => a.QuestionId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ConfidenceMetrics configuration
        modelBuilder.Entity<ConfidenceMetrics>(entity =>
        {
            entity.HasKey(c => c.MetricId);
            entity.Property(c => c.SmileScore).HasColumnType("decimal(5,2)");
            entity.Property(c => c.EyeContactScore).HasColumnType("decimal(5,2)");
            entity.Property(c => c.HeadPoseScore).HasColumnType("decimal(5,2)");
            entity.Property(c => c.AnalysisTimestamp).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.HasIndex(c => c.SessionId);
            entity.HasIndex(c => c.QuestionId);
            
            entity.HasOne(c => c.Session)
                .WithMany()
                .HasForeignKey(c => c.SessionId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(c => c.Question)
                .WithMany()
                .HasForeignKey(c => c.QuestionId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // InterviewReport configuration
        modelBuilder.Entity<InterviewReport>(entity =>
        {
            entity.HasKey(r => r.ReportId);
            entity.Property(r => r.OverallScore).HasColumnType("decimal(5,2)");
            entity.Property(r => r.SpeechScore).HasColumnType("decimal(5,2)");
            entity.Property(r => r.VisualScore).HasColumnType("decimal(5,2)");
            entity.Property(r => r.Grade).HasMaxLength(5);
            entity.Property(r => r.GeneratedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            
            entity.HasIndex(r => r.SessionId).IsUnique();
            entity.HasIndex(r => r.UserId);
            
            entity.HasOne(r => r.Session)
                .WithMany()
                .HasForeignKey(r => r.SessionId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // AdminAuditLog configuration
        modelBuilder.Entity<AdminAuditLog>(entity =>
        {
            entity.HasKey(a => a.LogId);
            entity.Property(a => a.Action).IsRequired().HasMaxLength(100);
            entity.Property(a => a.Details).HasMaxLength(500);
            entity.Property(a => a.TargetEntityType).HasMaxLength(100);
            entity.Property(a => a.IpAddress).HasMaxLength(50);
            entity.Property(a => a.PerformedAt).HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(a => a.AdminUserId);
            entity.HasIndex(a => a.PerformedAt);

            entity.HasOne(a => a.AdminUser)
                .WithMany()
                .HasForeignKey(a => a.AdminUserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // FlaggedContent configuration
        modelBuilder.Entity<FlaggedContent>(entity =>
        {
            entity.HasKey(f => f.Id);
            entity.Property(f => f.ContentType).IsRequired().HasMaxLength(50);
            entity.Property(f => f.Reason).HasMaxLength(500);
            entity.Property(f => f.Status).HasMaxLength(20).HasDefaultValue("Pending");
            entity.Property(f => f.ModeratorNotes).HasMaxLength(500);
            entity.Property(f => f.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            entity.HasOne(f => f.Reporter)
                .WithMany()
                .HasForeignKey(f => f.ReportedBy)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(f => f.Moderator)
                .WithMany()
                .HasForeignKey(f => f.ModeratedBy)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // SystemSetting configuration
        modelBuilder.Entity<SystemSetting>(entity =>
        {
            entity.HasKey(s => s.Id);
            entity.Property(s => s.Key).IsRequired().HasMaxLength(100);
            entity.HasIndex(s => s.Key).IsUnique();
            entity.Property(s => s.Value).IsRequired();
            entity.Property(s => s.Type).HasMaxLength(50);
            entity.Property(s => s.Description).HasMaxLength(200);
            entity.Property(s => s.Category).HasMaxLength(50);
            entity.Property(s => s.UpdatedAt).HasDefaultValueSql("GETUTCDATE()");
        });

        // UserActivityLog configuration
        modelBuilder.Entity<UserActivityLog>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Action).IsRequired().HasMaxLength(100);
            entity.Property(u => u.Details).HasMaxLength(500);
            entity.Property(u => u.IpAddress).HasMaxLength(50);
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("GETUTCDATE()");

            entity.HasIndex(u => u.UserId);
            entity.HasIndex(u => u.CreatedAt);

            entity.HasOne(u => u.User)
                .WithMany()
                .HasForeignKey(u => u.UserId)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // UserQuestionHistory configuration
        modelBuilder.Entity<UserQuestionHistory>(entity =>
        {
            entity.HasKey(h => h.Id);
            entity.Property(h => h.AskedAt).HasDefaultValueSql("GETUTCDATE()");
            entity.Property(h => h.UserAnswer).HasMaxLength(2000);

            entity.HasIndex(h => h.UserId);
            entity.HasIndex(h => h.QuestionId);
            entity.HasIndex(h => h.SessionId);

            entity.HasOne(h => h.User)
                .WithMany()
                .HasForeignKey(h => h.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(h => h.Question)
                .WithMany()
                .HasForeignKey(h => h.QuestionId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(h => h.Session)
                .WithMany()
                .HasForeignKey(h => h.SessionId)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);
        });
    }
}
