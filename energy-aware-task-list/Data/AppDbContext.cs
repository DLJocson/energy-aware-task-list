using BatteryWorkflowMVC.Models;
using Microsoft.EntityFrameworkCore;

namespace BatteryWorkflowMVC.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<TaskItem> Tasks { get; set; }
        public DbSet<AppSetting> Settings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Seed default settings
            modelBuilder.Entity<AppSetting>().HasData(
                new AppSetting { Id = 1, Key = "DailyBudget", Value = "100" },
                new AppSetting { Id = 2, Key = "ResetTime", Value = "04:00" }
            );
        }
    }
}