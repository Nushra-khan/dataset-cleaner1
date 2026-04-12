# DataClean — Dataset Auto-Cleaning Platform

Upload a CSV → auto-clean → download ML-ready data + report.

## Project Structure

```
dataset-cleaner/
├── backend/
│   ├── main.py          # FastAPI app & endpoints
│   ├── cleaner.py       # Cleaning & profiling logic
│   ├── requirements.txt
│   └── render.yaml
└── frontend/
    ├── src/
    │   ├── App.js       # Full React UI
    │   └── index.js
    ├── public/
    │   └── index.html
    ├── package.json
    └── vercel.json
```

## Cleaning Pipeline

1. **Normalize column names** → snake_case
2. **Remove duplicates**
3. **Trim whitespace**
4. **Infer & fix types** (numeric, boolean, datetime, categorical)
5. **Convert word numbers** ("twenty five" → 25)
6. **Fill missing values** (median / mode / forward-fill)
7. **Handle outliers** via IQR capping

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
# Set REACT_APP_API_URL=http://localhost:8000 in .env
npm start
```

## Deploy

### Backend → Render
1. Push `backend/` folder to a GitHub repo
2. Create new **Web Service** on [render.com](https://render.com)
3. Set **Build Command**: `pip install -r requirements.txt`
4. Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Note your Render URL: `https://your-app.onrender.com`

### Frontend → Vercel
1. Push `frontend/` folder to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Set env variable: `REACT_APP_API_URL=https://your-app.onrender.com`
4. Deploy — Vercel auto-detects Create React App

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/upload` | Upload CSV file |
| POST | `/clean` | Run cleaning pipeline |
| GET | `/download/{session_id}` | Download cleaned CSV |
| GET | `/report/{session_id}` | Get cleaning report JSON |
| GET | `/health` | Health check |
