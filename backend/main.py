from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import pandas as pd
import numpy as np
import io
import os
import uuid
import json
from cleaner import clean_dataset, profile_dataset

app = FastAPI(title="Dataset Auto-Cleaner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/tmp/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

sessions = {}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a valid CSV file")

    content = await file.read()

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Max size is 5MB")

    try:
        df = pd.read_csv(io.BytesIO(content))
    except Exception:
        raise HTTPException(status_code=400, detail="Error reading file. Check format")

    if df.empty:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    session_id = str(uuid.uuid4())
    raw_path = os.path.join(UPLOAD_DIR, f"{session_id}_raw.csv")
    df.to_csv(raw_path, index=False)

    profile = profile_dataset(df)
    sessions[session_id] = {"raw_path": raw_path, "profile": profile}

    return {
        "session_id": session_id,
        "filename": file.filename,
        "rows": len(df),
        "columns": len(df.columns),
        "profile": profile,
        "preview": df.head(5).to_dict(orient="records"),
        "column_names": df.columns.tolist(),
    }


@app.post("/clean")
async def clean_data(payload: dict):
    session_id = payload.get("session_id")
    if not session_id or session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found. Please upload a file first.")

    session = sessions[session_id]
    df = pd.read_csv(session["raw_path"])

    cleaned_df, report = clean_dataset(df)

    cleaned_path = os.path.join(UPLOAD_DIR, f"{session_id}_cleaned.csv")
    cleaned_df.to_csv(cleaned_path, index=False)
    sessions[session_id]["cleaned_path"] = cleaned_path
    sessions[session_id]["report"] = report

    return {
        "session_id": session_id,
        "rows_before": report["rows_before"],
        "rows_after": report["rows_after"],
        "columns": len(cleaned_df.columns),
        "report": report,
        "preview": cleaned_df.head(5).to_dict(orient="records"),
        "column_names": cleaned_df.columns.tolist(),
    }


@app.get("/download/{session_id}")
async def download_cleaned(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    cleaned_path = sessions[session_id].get("cleaned_path")
    if not cleaned_path or not os.path.exists(cleaned_path):
        raise HTTPException(status_code=404, detail="Cleaned file not ready. Run /clean first.")
    return FileResponse(cleaned_path, media_type="text/csv", filename="cleaned_dataset.csv")


@app.get("/report/{session_id}")
async def get_report(session_id: str):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    report = sessions[session_id].get("report")
    if not report:
        raise HTTPException(status_code=404, detail="Report not ready. Run /clean first.")
    return report


@app.get("/health")
async def health():
    return {"status": "ok"}
