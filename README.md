# TaskTrack

TaskTrack is a modern, cross-platform process and resource monitoring application built with Tauri, React, and TypeScript. It provides a sleek, responsive interface for monitoring system processes and resource usage with real-time updates.

## Features

- **Process Management**: View, sort, search, and manage all running processes
- **Resource Monitoring**: Track CPU, memory, and disk usage in real-time
- **Process Tree View**: Visualize parent-child relationships between processes
- **Process Details**: Get detailed information about individual processes
- **Process Control**: Kill, suspend, and resume processes with proper permission handling
- **Multi-theme Support**: Choose between Light, Dark, and Purple themes
- **Responsive Design**: Optimized for various screen sizes
- **Low Resource Usage**: Built for efficiency with minimal impact on system performance

## Getting Started

### Prerequisites

- Make sure you have [Rust](https://www.rust-lang.org/tools/install) installed (required for Tauri)
- [Node.js](https://nodejs.org/) (v14 or later)
- npm or yarn

### Installation

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/KareemElnaghy/Task-Track.git
   cd Task-Track
2. **Run Development Server:**
   ```bash
   npm run tauri dev
   # or
   yarn tauri dev
3. **Build the Application:**
   ```bash  
   npm run tauri build
   # or
   yarn tauri build

## Usage

### Main Views

- **Processes**: Lists all running processes with sortable columns for PID, name, CPU usage, memory usage, etc.
- **Resources**: Shows real-time graphs and statistics for CPU, memory, and disk usage
- **Process Tree**: Visualizes the hierarchical relationship between processes

### Process Management

Right-click on any process to access context menu options:
- Kill Process
- Suspend/Resume Process
- View Process Details
- View in Process Tree

### Theme Switching

Use the theme toggles in the top-right corner to switch between:
- Light Theme
- Dark Theme
- Purple Theme

## Technologies Used

- **[Tauri](https://tauri.app/)**: Framework for building lightweight, secure desktop applications
- **[React](https://reactjs.org/)**: Frontend library for building user interfaces
- **[TypeScript](https://www.typescriptlang.org/)**: Type-safe JavaScript
- **[React Router](https://reactrouter.com/)**: For navigation between different views
- **[Chart.js](https://www.chartjs.org/)**: For resource usage visualizations
- **CSS Variables**: For theming and styling

---

Made by Farida Bey, Jana Elfeky and Kareem Elnaghy
