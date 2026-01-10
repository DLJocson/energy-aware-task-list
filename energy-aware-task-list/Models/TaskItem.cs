using System;
using System.ComponentModel.DataAnnotations;

namespace BatteryWorkflowMVC.Models
{
    public class TaskItem
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [Range(5, 100)]
        public int EnergyCost { get; set; }

        [Required]
        public string Category { get; set; } = "Personal";

        public DateTime? Deadline { get; set; }

        public string? Description { get; set; }

        public TaskStatus Status { get; set; } = TaskStatus.Backlog;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? CompletedAt { get; set; }
    }
    
    // Simple Key-Value store for settings (Budget/ResetTime)
    public class AppSetting
    {
        public int Id { get; set; }
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }
}