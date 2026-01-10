// ========================================
// ErrorViewModel.cs
// Error page view model
// 
// Purpose:
// - Provides error information for the Error view
// - Displays request ID for debugging purposes
// - Used by exception handler middleware
// ========================================

namespace BatteryWorkflowMVC.Models
{
    public class ErrorViewModel
    {
        public string? RequestId { get; set; }

        public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);
    }
}
