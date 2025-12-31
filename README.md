# Project Survey Tracker

A full-stack web application for tracking survey projects with an Excel/spreadsheet-like interface.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB

## Prerequisites

Before running this application, you need to have MongoDB installed and running.

### Installing MongoDB on Ubuntu/Debian

```bash
# Import MongoDB public GPG key
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod

# Enable MongoDB to start on boot
sudo systemctl enable mongod
```

### Alternative: Using Docker

```bash
docker run -d --name mongodb -p 27017:27017 mongo:7.0
```

## Quick Start

### 1. Start MongoDB

Make sure MongoDB is running on `localhost:27017`.

### 2. Start the Backend Server

```bash
cd server
npm install
npm start
```

The server will run on `http://localhost:5000`.

### 3. Start the Frontend Development Server

```bash
cd client
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`.

## Features

- **Excel-like Spreadsheet View**: Display projects in a table format similar to Excel
- **Smart Project Name Suggestions**: Autocomplete with fuzzy matching to avoid duplicate names
- **Row Grouping**: Same project names are grouped together with merged cells
- **Rich Form Inputs**:
  - Dropdown menus for status fields (Report Survey, WO, Material, Status)
  - Date pickers for Due Date and Date
  - Multi-tag input for PIC Team members
  - Text area for Progress notes

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | Get all projects |
| GET | `/api/projects/grouped` | Get projects grouped by name |
| GET | `/api/projects/suggestions?q=term` | Get autocomplete suggestions |
| POST | `/api/projects` | Create new entry |
| PUT | `/api/projects/:id` | Update entry |
| DELETE | `/api/projects/:id` | Delete entry |

## Project Structure

```
project-01/
├── server/
│   ├── package.json
│   ├── index.js              # Express server
│   ├── models/
│   │   └── Project.js        # Mongoose model
│   └── routes/
│       └── projects.js       # API routes
│
├── client/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── api/
│       │   └── projects.js
│       └── components/
│           ├── SpreadsheetTable.jsx
│           └── EntryForm.jsx
│
└── README.md
```

## License

MIT
