// ========================================
// TaskStatus.cs
// Task lifecycle status enumeration
// 
// Purpose:
// - Defines the three states of a task:
//   • Backlog: Planned but not started
//   • Active: Currently being worked on
//   • Completed: Finished tasks
// ========================================

namespace BatteryWorkflowMVC.Models
{
    public enum TaskStatus
    {
        Backlog,
        Active,
        Completed
    }
}