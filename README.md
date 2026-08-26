# IT Asset Management System

A high-fidelity, responsive IT Asset Management System dashboard built to track hardware inventory, manage employee device assignments, process returns, schedule repairs, and generate visual data reports.

---

## 📂 Project Structure

- **`/frontend/`**: Vite-scaffolded Single Page Application built on React 19, Tailwind CSS v4, Lucide React, and Recharts. Operates on a persistent `localStorage` database.
- **`/backend/`**: FastAPI codebase skeleton folder structure containing directory templates (`/app/`, `/routers/`, `/models/`, etc.) and a placeholder `main.py` entrypoint.

---

## 💻 Running the App Locally

### 1. Frontend (React 19 + Vite)
Ensure you have [Node.js](https://nodejs.org/) installed.

```bash
# Navigate to the frontend directory
cd frontend

# Install package dependencies
npm install

# Start the Vite development server
npm run dev
```
*The application will boot and display the local URL in the terminal (usually `http://localhost:5173` or `http://localhost:5174`).*

### 2. Backend Stub (FastAPI)
Ensure you have [Python 3.10+](https://www.python.org/) installed.

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Linux/macOS:
source venv/bin/activate
# On Windows (Command Prompt):
venv\Scripts\activate.bat
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Install FastAPI and Uvicorn
pip install fastapi uvicorn

# Start the local development server
uvicorn main:app --reload
```
*The mock API server will start on `http://127.0.0.1:8000`.*

---

## 🐳 Running in Docker Containers

You can containerize and run the frontend and backend services individually or together.

### 1. Running Containers Individually

#### **Backend Service**
```bash
# Go to the backend folder
cd backend

# Build the Docker image
docker build -t asset-manager-backend .

# Run the container in detached mode on port 8000
docker run -d -p 8000:8000 --name backend-container asset-manager-backend
```

#### **Frontend Service**
```bash
# Go to the frontend folder
cd frontend

# Build the Docker image
docker build -t asset-manager-frontend .

# Run the container in detached mode on port 3000
docker run -d -p 3000:80 --name frontend-container asset-manager-frontend
```
*Once running, navigate to `http://localhost:3000` in your web browser.*

#### **Useful Container Controls**
```bash
# List all running containers
docker ps

# Stop a container
docker stop frontend-container

# Start a stopped container
docker start frontend-container

# Remove a container
docker rm -f frontend-container
```

---

### 2. Running Services Together (Docker Compose)

To coordinate both services automatically, make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) running and execute the following in the **root directory**:

```bash
# Build and start all services defined in docker-compose.yml
docker compose up --build -d

# Stop and remove all active containers
docker compose down
```
