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

        public TasksController(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> Index(string status = "Backlog", string search = "")
        {
            // 1. Get Settings
            var budgetSetting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "DailyBudget");
            var resetSetting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "ResetTime");
            
            int budget = int.Parse(budgetSetting?.Value ?? "100");
            string resetTime = resetSetting?.Value ?? "04:00";

            // 2. Calculate Energy Used based on Reset Time logic
            var allActiveOrRecentTasks = await _context.Tasks
                .Where(t => t.Status == Models.TaskStatus.Active || t.Status == Models.TaskStatus.Completed)
                .ToListAsync();

            var resetDateTime = GetLastResetTime(resetTime);
            int energyUsed = allActiveOrRecentTasks
                .Where(t => t.Status == Models.TaskStatus.Active || (t.CompletedAt.HasValue && t.CompletedAt > resetDateTime))
                .Sum(t => t.EnergyCost);

            // 3. Filter Tasks for View
            var query = _context.Tasks.AsQueryable();

            if (status != "All")
            {
                if (Enum.TryParse<Models.TaskStatus>(status, out var statusEnum))
                {
                    query = query.Where(t => t.Status == statusEnum);
                }
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(t => t.Title.ToLower().Contains(search.ToLower()));
            }

            var tasks = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();

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

        [HttpGet]
        public IActionResult Create()
        {
            return View(new TaskFormViewModel());
        }

        [HttpPost]
        public async Task<IActionResult> Create(TaskFormViewModel model)
        {
            if (ModelState.IsValid)
            {
                var task = new TaskItem
                {
                    Title = model.Title,
                    EnergyCost = model.EnergyCost,
                    Category = model.Category,
                    Deadline = model.Deadline,
                    Description = model.Description,
                    Status = Models.TaskStatus.Backlog
                };
                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();
                return RedirectToAction(nameof(Index));
            }
            return View(model);
        }

        [HttpGet]
        public async Task<IActionResult> Edit(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task == null) return NotFound();

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

        [HttpPost]
        public async Task<IActionResult> Edit(TaskFormViewModel model)
        {
            if (ModelState.IsValid)
            {
                var task = await _context.Tasks.FindAsync(model.Id);
                if (task != null)
                {
                    task.Title = model.Title;
                    task.EnergyCost = model.EnergyCost;
                    task.Category = model.Category;
                    task.Deadline = model.Deadline;
                    task.Description = model.Description;
                    
                    await _context.SaveChangesAsync();
                }
                return RedirectToAction(nameof(Index));
            }
            return View(model);
        }

        [HttpPost]
        public async Task<IActionResult> UpdateStatus(int id, Models.TaskStatus newStatus)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task != null)
            {
                task.Status = newStatus;
                if (newStatus == Models.TaskStatus.Completed)
                {
                    task.CompletedAt = DateTime.Now;
                }
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> Delete(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task != null)
            {
                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        public async Task<IActionResult> UpdateSettings(int dailyBudget, string resetTime)
        {
            var budgetSetting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "DailyBudget");
            if (budgetSetting == null)
            {
                budgetSetting = new AppSetting { Key = "DailyBudget" };
                _context.Settings.Add(budgetSetting);
            }
            budgetSetting.Value = dailyBudget.ToString();

            var timeSetting = await _context.Settings.FirstOrDefaultAsync(s => s.Key == "ResetTime");
            if (timeSetting == null)
            {
                timeSetting = new AppSetting { Key = "ResetTime" };
                _context.Settings.Add(timeSetting);
            }
            timeSetting.Value = resetTime;

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        private DateTime GetLastResetTime(string resetTimeStr)
        {
            var parts = resetTimeStr.Split(':').Select(int.Parse).ToArray();
            var now = DateTime.Now;
            var todayReset = new DateTime(now.Year, now.Month, now.Day, parts[0], parts[1], 0);

            return now >= todayReset ? todayReset : todayReset.AddDays(-1);
        }
    }
}