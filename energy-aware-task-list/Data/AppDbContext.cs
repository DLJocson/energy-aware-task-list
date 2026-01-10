// ========================================
// AppDbContext.cs
// Entity Framework database context
// 
// Purpose:
// - Defines database schema and tables (Tasks, Settings)
// - Manages database connections and queries
// - Seeds default settings on first run
// - Uses SQLite for lightweight data storage
// 
// Database Tables:
// - Tasks: Stores all task records with energy costs, status, and metadata
// - Settings: Key-value store for app configuration (DailyBudget, ResetTime)
// 
// Connection String:
// - Configured in appsettings.json as "DefaultConnection"
// - Default: "Data Source=battery.db" (SQLite file in app directory)
// 
// Data Seeding:
// - Automatically seeds default settings on database creation
// - DailyBudget: 100 (default energy points)
// - ResetTime: 04:00 (default reset time)
// ========================================

using BatteryWorkflowMVC.Models;
using Microsoft.EntityFrameworkCore;

namespace BatteryWorkflowMVC.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Database table: Tasks
        // Stores all task records with CRUD operations
        public DbSet<TaskItem> Tasks { get; set; }
        
        // Database table: Settings
        // Key-value store for application configuration
        public DbSet<AppSetting> Settings { get; set; }

        // Configure database model and seed initial data
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Seed default settings for first-time database creation
            // These will be inserted automatically when database is initialized
            modelBuilder.Entity<AppSetting>().HasData(
                new AppSetting { Id = 1, Key = "DailyBudget", Value = "100" },
                new AppSetting { Id = 2, Key = "ResetTime", Value = "04:00" }
            );
            
            // Configure TaskItem table indexes for better query performance
            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.Status)
                .HasDatabaseName("IX_Tasks_Status");
                
            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.CreatedAt)
                .HasDatabaseName("IX_Tasks_CreatedAt");
                
            // Configure Settings table unique constraint on Key
            modelBuilder.Entity<AppSetting>()
                .HasIndex(s => s.Key)
                .IsUnique()
                .HasDatabaseName("IX_Settings_Key");
        }
    }
}