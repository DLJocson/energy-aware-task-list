// ========================================
// Program.cs
// Application entry point and startup configuration
// 
// Purpose:
// - Configures dependency injection and services
// - Sets up SQLite database with Entity Framework
// - Seeds initial settings (daily budget, reset time)
// - Configures HTTP request pipeline and routing
// ========================================

using BatteryWorkflowMVC.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// --- Service Configuration ---
// Register MVC controllers and views
builder.Services.AddControllersWithViews();

// Configure SQLite database with Entity Framework
// Connection string defined in appsettings.json
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// --- Database Initialization ---
// Ensure database exists and seed default settings
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    context.Database.EnsureCreated();  // Creates database if it doesn't exist
    
    // Seed default settings on first run
    if (!context.Settings.Any())
    {
        context.Settings.Add(new BatteryWorkflowMVC.Models.AppSetting 
        { 
            Key = "DailyBudget",
            Value = "100"  // Default daily energy budget
        });
        context.Settings.Add(new BatteryWorkflowMVC.Models.AppSetting 
        { 
            Key = "ResetTime",
            Value = "04:00"  // Default reset time (4:00 AM)
        });
        context.SaveChanges();
    }
}

// --- HTTP Pipeline Configuration ---
// Configure error handling for production
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");  // Redirect to error page
    app.UseHsts();  // Enable HTTP Strict Transport Security
}

app.UseHttpsRedirection();  // Redirect HTTP to HTTPS
app.UseStaticFiles();  // Serve static files (CSS, JS, images)

app.UseRouting();  // Enable endpoint routing

app.UseAuthorization();  // Enable authorization middleware (not currently used)

// --- Route Configuration ---
// Default route: /Tasks/Index
// Pattern: /{controller}/{action}/{id?}
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Tasks}/{action=Index}/{id?}");

app.Run();  // Start the application