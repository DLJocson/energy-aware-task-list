// ========================================
// TasksController.cs
// Main controller for task management and dashboard
// 
// Purpose:
// - Handles all task CRUD operations (Create, Read, Update, Delete)
// - Calculates energy usage and battery percentage
// - Manages task status transitions (Backlog → Active → Completed)
// - Provides filtered task views based on status and search
// - Handles settings updates for daily budget and reset time
// 
// CRUD Operations:
// - CREATE: Create() - Adds new tasks to database with validation
// - READ: Index() - Retrieves and filters tasks with energy calculations
// - UPDATE: Edit(), UpdateStatus() - Modifies task properties and status
// - DELETE: Delete() - Removes tasks from database with confirmation
// 
// Database Integration:
// - Uses Entity Framework Core with SQLite
// - AppDbContext manages Tasks and Settings tables
// - Async operations for better performance
// - Transaction safety with SaveChangesAsync()
// ========================================

using BatteryWorkflowMVC.Data;
using BatteryWorkflowMVC.Models;
using BatteryWorkflowMVC.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace BatteryWorkflowMVC.Controllers
{
    public class TasksController : Controller
    {
        private readonly AppDbContext _context;
        private readonly ILogger<TasksController> _logger;

        public TasksController(AppDbContext context, ILogger<TasksController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // --- Action: Display Dashboard (READ Operation) ---
        // CRUD: READ - Retrieves tasks from database with filtering and energy calculations
        // Database Query: Fetches Tasks and Settings tables
        // Error Handling: Returns default values if settings missing
        // Performance: Uses async operations and indexed queries
        public async Task<IActionResult> Index(string status = "Backlog", string search = "")
        {
            try
            {
                // Step 1: Retrieve user settings from database
                // Database Query: SELECT * FROM Settings WHERE Key IN ('DailyBudget', 'ResetTime')
                var budgetSetting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "DailyBudget");
                var resetSetting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "ResetTime");
                
                // Fallback to defaults if settings not found
                int budget = int.Parse(budgetSetting?.Value ?? "100");
                string resetTime = resetSetting?.Value ?? "04:00";

                // Step 2: Calculate current energy usage
                // Database Query: SELECT * FROM Tasks WHERE Status IN ('Active', 'Completed')
                // Only count tasks that are Active or completed after last reset
                var allActiveOrRecentTasks = await _context.Tasks
                    .Where(t => t.Status == Models.TaskStatus.Active || t.Status == Models.TaskStatus.Completed)
                    .ToListAsync();

                var resetDateTime = GetLastResetTime(resetTime);
                int energyUsed = allActiveOrRecentTasks
                    .Where(t => t.Status == Models.TaskStatus.Active || (t.CompletedAt.HasValue && t.CompletedAt > resetDateTime))
                    .Sum(t => t.EnergyCost);

                // Step 3: Apply filters (status and search query)
                // Database Query: Dynamic filtering based on status and search term
                var query = _context.Tasks.AsQueryable();

                // Filter by status (Backlog, Active, Completed, or All)
                if (status != "All")
                {
                    if (Enum.TryParse<Models.TaskStatus>(status, out var statusEnum))
                    {
                        query = query.Where(t => t.Status == statusEnum);
                    }
                }

                // Filter by search text (case-insensitive title search)
                if (!string.IsNullOrEmpty(search))
                {
                    query = query.Where(t => t.Title.ToLower().Contains(search.ToLower()));
                }

                // Execute query and order by creation date
                var tasks = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();

                // Step 4: Build view model with battery status and task list
                var vm = new DashboardViewModel
                {
                    Battery = new BatteryViewModel
                    {
                        DailyBudget = budget,
                        EnergyUsed = energyUsed,
                        ResetTime = resetTime
                    },
                    Tasks = tasks,
                    CurrentFilter = status,
                    SearchQuery = search
                };

                return View(vm);
            }
            catch (Exception ex)
            {
                // Log database errors
                _logger.LogError(ex, "Error loading dashboard with status={Status}, search={Search}", status, search);
                
                // Return error view with friendly message
                return View("Error", new ErrorViewModel 
                { 
                    RequestId = HttpContext.TraceIdentifier 
                });
            }
        }

        // --- Action: Display Create Task Form (READ for form display) ---
        // CRUD: Prepares empty form for CREATE operation
        // No database interaction - displays empty form
        [HttpGet]
        public IActionResult Create()
        {
            return View(new TaskFormViewModel());
        }

        // --- Action: Handle Create Task Submission (CREATE Operation) ---
        // CRUD: CREATE - Inserts new task record into database
        // Database Query: INSERT INTO Tasks (Title, EnergyCost, Category, etc.) VALUES (...)
        // Validation: Server-side validation via ModelState
        // Error Handling: Returns to form with validation errors if data invalid
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(TaskFormViewModel model)
        {
            // Validate input data
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Create task validation failed: {Errors}", 
                    string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                return View(model);
            }

            try
            {
                // Map form data to TaskItem entity
                var task = new TaskItem
                {
                    Title = model.Title.Trim(),
                    EnergyCost = model.EnergyCost,
                    Category = model.Category,
                    Deadline = model.Deadline,
                    Description = model.Description?.Trim(),
                    Status = Models.TaskStatus.Backlog,  // New tasks start in Backlog
                    CreatedAt = DateTime.Now
                };

                // Database operation: Add new task
                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Task created successfully: {TaskId} - {Title}", task.Id, task.Title);
                
                // Redirect to dashboard after successful creation
                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateException ex)
            {
                // Handle database-specific errors
                _logger.LogError(ex, "Database error creating task: {Title}", model.Title);
                ModelState.AddModelError("", "Unable to save task. Please try again.");
                return View(model);
            }
            catch (Exception ex)
            {
                // Handle unexpected errors
                _logger.LogError(ex, "Unexpected error creating task: {Title}", model.Title);
                ModelState.AddModelError("", "An unexpected error occurred. Please try again.");
                return View(model);
            }
        }

        // --- Action: Display Edit Task Form (READ Operation) ---
        // CRUD: READ - Retrieves specific task for editing
        // Database Query: SELECT * FROM Tasks WHERE Id = @id
        // Error Handling: Returns 404 if task not found
        [HttpGet]
        public async Task<IActionResult> Edit(int id)
        {
            // Validate ID parameter
            if (id <= 0)
            {
                _logger.LogWarning("Edit called with invalid ID: {Id}", id);
                return NotFound();
            }

            try
            {
                // Database query: Find task by primary key
                var task = await _context.Tasks.FindAsync(id);
                
                // Check if task exists
                if (task == null)
                {
                    _logger.LogWarning("Task not found for editing: {Id}", id);
                    return NotFound();
                }

                // Map TaskItem to form view model
                var vm = new TaskFormViewModel
                {
                    Id = task.Id,
                    Title = task.Title,
                    EnergyCost = task.EnergyCost,
                    Category = task.Category,
                    Deadline = task.Deadline,
                    Description = task.Description,
                    Status = task.Status
                };

                return View(vm);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error loading task for edit: {Id}", id);
                return View("Error", new ErrorViewModel { RequestId = HttpContext.TraceIdentifier });
            }
        }

        // --- Action: Handle Edit Task Submission (UPDATE Operation) ---
        // CRUD: UPDATE - Modifies existing task in database
        // Database Query: UPDATE Tasks SET Title=@title, EnergyCost=@cost... WHERE Id=@id
        // Validation: Server-side validation via ModelState
        // Error Handling: Returns to form if validation fails or task not found
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(TaskFormViewModel model)
        {
            // Validate input data
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Edit task validation failed for ID {Id}: {Errors}", 
                    model.Id, string.Join(", ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)));
                return View(model);
            }

            try
            {
                // Database query: Find existing task
                var task = await _context.Tasks.FindAsync(model.Id);
                
                if (task == null)
                {
                    _logger.LogWarning("Task not found during update: {Id}", model.Id);
                    return NotFound();
                }

                // Update task properties with form data
                task.Title = model.Title.Trim();
                task.EnergyCost = model.EnergyCost;
                task.Category = model.Category;
                task.Deadline = model.Deadline;
                task.Description = model.Description?.Trim();
                // Note: Status not updated here - use UpdateStatus endpoint instead

                // Save changes to database
                await _context.SaveChangesAsync();

                _logger.LogInformation("Task updated successfully: {TaskId} - {Title}", task.Id, task.Title);

                return RedirectToAction(nameof(Index));
            }
            catch (DbUpdateConcurrencyException ex)
            {
                // Handle concurrent update conflicts
                _logger.LogError(ex, "Concurrency error updating task: {Id}", model.Id);
                ModelState.AddModelError("", "This task was modified by another user. Please refresh and try again.");
                return View(model);
            }
            catch (DbUpdateException ex)
            {
                // Handle database-specific errors
                _logger.LogError(ex, "Database error updating task: {Id}", model.Id);
                ModelState.AddModelError("", "Unable to save changes. Please try again.");
                return View(model);
            }
            catch (Exception ex)
            {
                // Handle unexpected errors
                _logger.LogError(ex, "Unexpected error updating task: {Id}", model.Id);
                return View("Error", new ErrorViewModel { RequestId = HttpContext.TraceIdentifier });
            }
        }

        // --- Action: Update Task Status (UPDATE Operation) ---
        // CRUD: UPDATE - Changes task status (Backlog → Active → Completed)
        // Database Query: UPDATE Tasks SET Status=@status, CompletedAt=@time WHERE Id=@id
        // Use Case: Used by dashboard buttons to move tasks through workflow
        // Error Handling: Silently fails if task not found (returns to dashboard)
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateStatus(int id, Models.TaskStatus newStatus)
        {
            // Validate ID parameter
            if (id <= 0)
            {
                _logger.LogWarning("UpdateStatus called with invalid ID: {Id}", id);
                return RedirectToAction(nameof(Index));
            }

            try
            {
                // Database query: Find task by ID
                var task = await _context.Tasks.FindAsync(id);
                
                if (task == null)
                {
                    _logger.LogWarning("Task not found for status update: {Id}", id);
                    return RedirectToAction(nameof(Index));
                }

                // Store old status for logging
                var oldStatus = task.Status;

                // Update status
                task.Status = newStatus;
                
                // Record completion timestamp when task is marked as Completed
                if (newStatus == Models.TaskStatus.Completed)
                {
                    task.CompletedAt = DateTime.Now;
                }
                // Clear completion timestamp if moving back from Completed
                else if (oldStatus == Models.TaskStatus.Completed)
                {
                    task.CompletedAt = null;
                }

                // Save changes to database
                await _context.SaveChangesAsync();

                _logger.LogInformation("Task status updated: {TaskId} - {OldStatus} → {NewStatus}", 
                    id, oldStatus, newStatus);

                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task status: {Id} to {Status}", id, newStatus);
                return RedirectToAction(nameof(Index));
            }
        }

        // --- Action: Delete Task (DELETE Operation) ---
        // CRUD: DELETE - Removes task from database permanently
        // Database Query: DELETE FROM Tasks WHERE Id=@id
        // Warning: No soft delete - permanent removal
        // Error Handling: Silently fails if task not found
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            // Validate ID parameter
            if (id <= 0)
            {
                _logger.LogWarning("Delete called with invalid ID: {Id}", id);
                return RedirectToAction(nameof(Index));
            }

            try
            {
                // Database query: Find task to delete
                var task = await _context.Tasks.FindAsync(id);
                
                if (task == null)
                {
                    _logger.LogWarning("Task not found for deletion: {Id}", id);
                    return RedirectToAction(nameof(Index));
                }

                // Store task details for logging before deletion
                var taskTitle = task.Title;

                // Remove task from database
                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Task deleted: {TaskId} - {Title}", id, taskTitle);

                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task: {Id}", id);
                return RedirectToAction(nameof(Index));
            }
        }

        // --- Action: Update Application Settings (UPDATE Operation) ---
        // CRUD: UPDATE - Modifies global app settings (Daily Budget, Reset Time)
        // Database Query: UPDATE Settings SET Value=@value WHERE Key=@key
        // Note: Creates settings if they don't exist (upsert pattern)
        // Validation: Ensures dailyBudget is positive and resetTime is valid format
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateSettings(int dailyBudget, string resetTime)
        {
            // Validate input parameters
            if (dailyBudget <= 0)
            {
                _logger.LogWarning("Invalid daily budget value: {Budget}", dailyBudget);
                return RedirectToAction(nameof(Index));
            }

            if (string.IsNullOrWhiteSpace(resetTime) || !TimeSpan.TryParse(resetTime, out _))
            {
                _logger.LogWarning("Invalid reset time format: {ResetTime}", resetTime);
                return RedirectToAction(nameof(Index));
            }

            try
            {
                // Update or create Daily Budget setting
                // Database query: SELECT then UPDATE or INSERT
                var budgetSetting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "DailyBudget");
                if (budgetSetting == null)
                {
                    // Create new setting if it doesn't exist
                    budgetSetting = new AppSetting { Key = "DailyBudget" };
                    _context.Settings.Add(budgetSetting);
                }
                budgetSetting.Value = dailyBudget.ToString();

                // Update or create Reset Time setting
                var timeSetting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "ResetTime");
                if (timeSetting == null)
                {
                    // Create new setting if it doesn't exist
                    timeSetting = new AppSetting { Key = "ResetTime" };
                    _context.Settings.Add(timeSetting);
                }
                timeSetting.Value = resetTime;

                // Save all changes to database
                await _context.SaveChangesAsync();

                _logger.LogInformation("Settings updated: DailyBudget={Budget}, ResetTime={ResetTime}", 
                    dailyBudget, resetTime);

                return RedirectToAction(nameof(Index));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating settings: Budget={Budget}, ResetTime={ResetTime}", 
                    dailyBudget, resetTime);
                return RedirectToAction(nameof(Index));
            }
        }

        // --- Helper: Calculate Last Reset DateTime ---
        // Determines when the energy budget last reset based on configured time
        // If reset time hasn't occurred today, returns yesterday's reset time
        private DateTime GetLastResetTime(string resetTimeStr)
        {
            var parts = resetTimeStr.Split(':').Select(int.Parse).ToArray();
            var now = DateTime.Now;
            var todayReset = new DateTime(now.Year, now.Month, now.Day, parts[0], parts[1], 0);

            // If current time is past reset time, use today's reset; otherwise use yesterday's
            return now >= todayReset ? todayReset : todayReset.AddDays(-1);
        }
    }
}