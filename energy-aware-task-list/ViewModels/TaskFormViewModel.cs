using BatteryWorkflowMVC.Models;
using System.ComponentModel.DataAnnotations;

namespace BatteryWorkflowMVC.ViewModels
{
    public class TaskFormViewModel
    {
        public int Id { get; set; }
        
        [Required(ErrorMessage = "Task title is required.")]
        public string Title { get; set; } = string.Empty;

        [Range(5, 100, ErrorMessage = "Energy cost must be between 5 and 100.")]
        public int EnergyCost { get; set; } = 10;

        public string Category { get; set; } = "Personal";
        
        public DateTime? Deadline { get; set; }
        
        public string? Description { get; set; }
        
        public BatteryWorkflowMVC.Models.TaskStatus Status { get; set; }

        public static List<string> Categories => new() { "Work", "Personal", "Health", "Chores", "Social", "Learning" };
    }
}