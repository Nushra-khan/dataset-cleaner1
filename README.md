# DataClean — Dataset Auto-Cleaning Platform

🌐 **Live Demo:** https://dataset-cleaner1.vercel.app/

> Upload a raw CSV → auto-clean → download ML-ready data + cleaning report.

---

## What It Does

DataClean automatically processes your CSV files through a 7-step cleaning pipeline:

1. **Normalize column names** — converts to snake_case
2. **Remove duplicate rows**
3. **Trim whitespace** — cleans all text columns
4. **Fix data types** — detects and converts numeric, boolean, datetime, categorical
5. **Word-to-number conversion** — `"twenty five"` → `25`
6. **Fill missing values** — median for numbers, mode for text, forward-fill for dates
7. **Cap outliers** — uses IQR method to handle extreme values

---

## Project Structure

```
dataset-cleaner/
├── backend/
│   ├── main.py            # FastAPI app & API endpoints
│   ├── cleaner.py         # All cleaning & profiling logic
│   └── requirements.txt   # Python dependencies
└── frontend/
    ├── src/
    │   ├── App.js         # Full React UI (single file)
    │   └── index.js       # Entry point
    ├── public/
    │   └── index.html
    ├── package.json
    └── vercel.json        # Vercel deployment config
```

---

## Local Development

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API will be running at `http://localhost:8000`

### 2. Frontend

```bash
cd frontend
npm install
```

Create a `.env` file inside the `frontend/` folder:

```
REACT_APP_API_URL=http://localhost:8000
```

Then start the dev server:

```bash
npm start
```

Frontend will open at `http://localhost:3000`

---

## Deploy

### Backend → Railway

1. Go to [railway.app](https://railway.app) and create a new project
2. Click **"Deploy from GitHub repo"** and select your repo
3. Railway will auto-detect Python — it installs from `requirements.txt` automatically
4. Set the **Start Command** in Railway service settings:
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```
5. Go to **Settings → Networking → Generate Domain** to get your public URL
6. Copy the URL — looks like: `https://your-app.up.railway.app`

> **Tip:** If deploying the whole monorepo, set the **Root Directory** to `backend/` in Railway's service settings.

---

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**
2. Import your GitHub repo (set root directory to `frontend/` if monorepo)
3. Under **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `REACT_APP_API_URL` | `https://your-app.up.railway.app` |

4. Click **Deploy** — Vercel auto-detects Create React App

> **Important:** Replace the value with your actual Railway URL. No trailing slash.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload a CSV file |
| `POST` | `/clean` | Run the cleaning pipeline |
| `GET` | `/download/{session_id}` | Download the cleaned CSV |
| `GET` | `/report/{session_id}` | Get the cleaning report as JSON |
| `GET` | `/health` | Health check |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 |
| Backend | FastAPI (Python) |
| Data Processing | Pandas, NumPy |
| Backend Hosting | Railway |
| Frontend Hosting | Vercel |
| Storage | File-based (no database) |

---

## Error Handling

| Situation | Message Shown |
|-----------|---------------|
| Empty file | "Uploaded file is empty" |
| File over 5MB | "File too large. Max size is 5MB" |
| Wrong file type | "Please upload a valid CSV file" |
| Corrupted file | "Error reading file. Check format" |

----

## Notes

- Sessions are stored in memory — restarting the server clears them
- Max file size: **5MB**
- Accepted format: **CSV only**
- Cleaned file is available for download immediately after processing
