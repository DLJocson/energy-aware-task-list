namespace BatteryWorkflowMVC.ViewModels
{
    public class BatteryViewModel
    {
        public int DailyBudget { get; set; }
        public int EnergyUsed { get; set; }
        public int Percentage => DailyBudget > 0 ? (int)(((double)(DailyBudget - EnergyUsed) / DailyBudget) * 100) : 0;
        public string ResetTime { get; set; } = "04:00";
    }
}