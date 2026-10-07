# QueueLess Local Execution & Installation Guide

This guide provides the exact commands to run the **QueueLess** digital queue platform components. To run QueueLess, you will need to open **three separate terminals** (or terminal tabs) to run the services in parallel. Since you have already created and activated the virtual environment (`.venv`), follow these quick steps:

---

## 🐍 Terminal 1: Run Python FastAPI Service (Estimation & PDF/QR Engine)

Since your terminal is already inside the project directory and has the virtual environment activated:

1. **Navigate to the python-service folder:**
   ```powershell
   cd python-service
   ```
2. **Install Python packages inside the active `.venv`:**
   ```powershell
   pip install -r requirements.txt
   ```
3. **Run the uvicorn development server:**
   ```powershell
   python main.py
   ```
   *The Python microservice runs on `http://127.0.0.1:8001`.*

---

## 🌐 Terminal 2: Run Express.js Backend Server & Seed Database

*Make sure you have a local MongoDB instance running on your default port (`27017`).*

1. **Open a new terminal and navigate to the backend directory:**
   ```powershell
   cd server
   ```
2. **Install Node.js packages:**
   ```powershell
   npm install
   ```
3. **Run the seed script to populate test data (users, businesses, and token history charts):**
   ```powershell
   npm run seed
   ```
4. **Start the Express server:**
   ```powershell
   npm run dev
   ```
   *The Express backend server runs on `http://localhost:5001`.*

---

## 🖥️ Terminal 3: Run React Frontend Client (Vite)

1. **Open a new terminal and navigate to the client directory:**
   ```powershell
   cd client
   ```
2. **Install dependencies (we bypass React 19 package warnings using peer-deps):**
   ```powershell
   npm install --legacy-peer-deps
   ```
3. **Start the Vite React client dev server:**
   ```powershell
   npm run dev
   ```
   *Open your browser and navigate to `http://localhost:5173` to access the portal.*

---

## 🔑 Test Logins

Once the servers are online, you can immediately test all features using these seeded accounts:

### 👤 Customer (browse, join queue, view wait timer & QR code)
* **Email:** `customer1@queueless.com`
* **Password:** `customer123`

### 💼 Business Owner (live ticket dashboard, service manager, analytics charts)
* **Email:** `hospital@queueless.com` (City General Hospital) OR `retail@queueless.com` (FreshMart Supermarket)
* **Password:** `owner123`

### 🛡️ System Admin (suspend/activate businesses, view platform metrics)
* **Email:** `admin@queueless.com`
* **Password:** `admin123`

---

*For complete configuration and environment details, check the root [README.md](../README.md) file.*
