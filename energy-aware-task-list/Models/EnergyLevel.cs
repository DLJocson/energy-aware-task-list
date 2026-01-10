namespace BatteryWorkflowMVC.Models
{
    public class EnergyLevel
    {
        public string Label { get; set; } = "";
        public string CssClass { get; set; } = "";
        public string BorderClass { get; set; } = "";

        public static EnergyLevel GetLevel(int cost)
        {
            return cost switch
            {
                <= 5 => new EnergyLevel { Label = "Tiny", CssClass = "bg-teal-50 text-teal-600", BorderClass = "border-teal-200" },
                <= 10 => new EnergyLevel { Label = "Small", CssClass = "bg-emerald-50 text-emerald-600", BorderClass = "border-emerald-200" },
                <= 20 => new EnergyLevel { Label = "Medium", CssClass = "bg-[#F5EFFF] text-[#4D2FB2]", BorderClass = "border-[#A594F9]" },
                <= 40 => new EnergyLevel { Label = "High", CssClass = "bg-amber-50 text-amber-600", BorderClass = "border-amber-200" },
                <= 60 => new EnergyLevel { Label = "Intense", CssClass = "bg-orange-50 text-orange-600", BorderClass = "border-orange-200" },
                _ => new EnergyLevel { Label = "Draining", CssClass = "bg-rose-50 text-rose-600", BorderClass = "border-rose-200" }
            };
        }
    }
}