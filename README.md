# energy-aware-task-list

<div align="center">
	<h1>⚡ Energy-Aware Task List</h1>
	<hr/>
	<div align="center">
		<b>Tags:</b>
		<img src="https://img.shields.io/badge/Language-C%23-blue" alt="C#"/>
		<img src="https://img.shields.io/badge/Language-JavaScript-blue" alt="JavaScript"/>
		<img src="https://img.shields.io/badge/Language-HTML%2FCSS-blue" alt="HTML/CSS"/>
		<img src="https://img.shields.io/badge/Status-Active-brightgreen" alt="Status: Active"/>
		<img src="https://img.shields.io/badge/License-Educational-gold" alt="License: Educational"/>
	</div>
</div>

---

<div align="center">
	<h2>Overview</h2>
</div>

<div align="center">
<em>
An educational ASP.NET Core MVC web application that helps users manage their daily tasks while considering their energy levels. Designed for students and professionals who want to optimize productivity and well-being.
</em>
</div>

---

<div align="center">
	<h2>✨ Feature Summary</h2>
</div>

- 📝 Create, edit, and delete tasks
- ⚡ Assign energy levels to each task (High, Medium, Low)
- 📊 Dashboard with battery-style energy visualization
- 🔍 Search and filter tasks by category, status, or energy
- 🌙 Tired mode and theme switching
- 📅 Task status tracking (To Do, In Progress, Done)
- 🎨 Responsive UI with Bootstrap
- 🔒 Data persistence with Entity Framework Core

---

<div align="center">
	<h2>🚀 How to Run</h2>
</div>

```bash
# 1. Clone the repository
git clone https://github.com/DLJocson/energy-aware-task-list.git
cd energy-aware-task-list

# 2. Restore dependencies
dotnet restore

# 3. Build the project
dotnet build

# 4. Run the application
dotnet run --project energy-aware-task-list/energy-aware-task-list.csproj

# 5. Open your browser and go to:
http://localhost:5000
```

---

<div align="center">
	<h2>📁 Project Structure</h2>
</div>

```text
energy-aware-task-list/
├── Controllers/         # MVC Controllers
├── Data/                # Entity Framework DbContext
├── Models/              # Data models (TaskItem, EnergyLevel, etc.)
├── ViewModels/          # View models for UI
├── Views/               # Razor views (UI pages)
│   ├── Shared/          # Shared layouts and partials
│   └── Tasks/           # Task-related views
├── wwwroot/             # Static files (CSS, JS, images)
├── appsettings.json     # App configuration
├── Program.cs           # Main entry point
└── ...
```

---

<div align="center">
	<h2>🛠️ Technical Details</h2>
</div>

- **Framework:** ASP.NET Core MVC (.NET 8+)
- **Frontend:** Razor, Bootstrap, JavaScript
- **ORM:** Entity Framework Core
- **Database:** SQLite (default, can be changed)
- **Authentication:** None (for educational/demo use)
- **Platform:** Cross-platform (Windows, macOS, Linux)

---

<div align="center">
	<h2>📦 Requirements</h2>
</div>

- [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download/dotnet/8.0)
- Modern web browser (Chrome, Edge, Firefox, etc.)

---

<div align="center">
	<h2>👤 Author</h2>
</div>

<div align="center">
	<b>Dan Louie M. Jocson</b>
</div>

---

<div align="center">
	<h2>🎓 Made For</h2>
</div>

<div align="center">
	<b>COMP 019 – Applications Development and Emerging Technologies</b>
</div>
# energy-aware-task-list