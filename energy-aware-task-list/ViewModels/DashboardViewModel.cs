using BatteryWorkflowMVC.Models;

namespace BatteryWorkflowMVC.ViewModels
{
    public class DashboardViewModel
    {
        public BatteryViewModel Battery { get; set; } = new();
        public List<TaskItem> Tasks { get; set; } = new();
        
        public string CurrentFilter { get; set; } = "Backlog";
        public string SearchQuery { get; set; } = "";
        
        public int RemainingEnergy => Math.Max(0, Battery.DailyBudget - Battery.EnergyUsed);
    }
}