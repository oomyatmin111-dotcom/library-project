import os
import uuid
import json
import logging
from datetime import datetime, date
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from models import MeetingMinute, Project, ProjectReport, DailyWorkReport, DailyWorkItem, NotificationConfig
from gemini_transcriber import transcribe_and_structure_video, SAMPLE_MEETING_DATA
from pdf_generator import generate_meeting_minute_pdf, generate_project_report_pdf, generate_daily_work_report_pdf, OUTPUT_DIR
from warning_service import WarningService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("MyEasyJob")

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data"
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True, parents=True)

app = FastAPI(
    title="My Easy Job - Executive Management Suite",
    description="Automated Meeting Minutes Transcription, Project Status Reports & Deadline Warnings",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

warning_service = WarningService(DATA_DIR)

# Mount static and generated PDFs
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
app.mount("/pdfs", StaticFiles(directory=str(OUTPUT_DIR)), name="pdfs")

MEETING_MINUTES_FILE = DATA_DIR / "meeting_minutes.json"

def load_meeting_minutes() -> List[dict]:
    if not MEETING_MINUTES_FILE.exists():
        sample = dict(SAMPLE_MEETING_DATA)
        sample["id"] = "mm-lms-001"
        sample["created_at"] = "02/05/2026 10:00"
        save_meeting_minutes([sample])
        return [sample]
    try:
        with open(MEETING_MINUTES_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if data is None:
                return []
            return data
    except Exception:
        return []

def save_meeting_minutes(minutes: List[dict]):
    with open(MEETING_MINUTES_FILE, "w", encoding="utf-8") as f:
        json.dump(minutes, f, indent=2, ensure_ascii=False)

@app.get("/", response_class=HTMLResponse)
async def serve_index():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>My Easy Job Suite</h1><p>Static index not found.</p>")

# ==================== 1. MEETING MINUTES PROCESS ====================

@app.get("/api/meeting-minutes")
async def list_meeting_minutes():
    return load_meeting_minutes()

@app.get("/api/meeting-minutes/sample")
async def get_sample_meeting_minute():
    return SAMPLE_MEETING_DATA

@app.post("/api/meeting-minutes/generate-sample-pdf")
async def generate_sample_pdf():
    pdf_path = generate_meeting_minute_pdf(SAMPLE_MEETING_DATA, "My_Easy_Job_Meeting_Minute_Oo_Ko_LMS.pdf")
    filename = Path(pdf_path).name
    return {
        "status": "success",
        "pdf_url": f"/pdfs/{filename}",
        "filename": filename,
        "data": SAMPLE_MEETING_DATA
    }

@app.post("/api/meeting-minutes/upload-and-transcribe")
async def upload_and_transcribe(
    file: Optional[UploadFile] = File(None),
    transcript_text: Optional[str] = Form(None),
    project_name: Optional[str] = Form(None),
    meeting_date: Optional[str] = Form(None),
    gemini_api_key: Optional[str] = Form(None)
):
    saved_file_path = None
    if file and file.filename:
        safe_name = f"{uuid.uuid4().hex[:6]}_{file.filename}"
        saved_file_path = str(UPLOADS_DIR / safe_name)
        with open(saved_file_path, "wb") as f_out:
            content = await file.read()
            f_out.write(content)

    cfg = warning_service.get_config()
    api_key = gemini_api_key or cfg.get("gemini_api_key") or os.getenv("GEMINI_API_KEY")

    # Transcribe & format
    structured_data = transcribe_and_structure_video(
        file_path=saved_file_path,
        transcript_text=transcript_text,
        api_key=api_key
    )

    if project_name:
        structured_data["meeting_info"]["project"] = project_name
    if meeting_date:
        structured_data["meeting_info"]["date"] = meeting_date
    structured_data["meeting_info"]["prepared_by"] = "App.com.mm"

    minute_id = f"mm-{uuid.uuid4().hex[:8]}"
    structured_data["id"] = minute_id
    structured_data["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")

    # Generate PDF
    pdf_path = generate_meeting_minute_pdf(structured_data)
    pdf_filename = Path(pdf_path).name
    structured_data["pdf_url"] = f"/pdfs/{pdf_filename}"

    # Save to history
    history = load_meeting_minutes()
    history.insert(0, structured_data)
    save_meeting_minutes(history)

    return {
        "status": "success",
        "minute": structured_data,
        "pdf_url": f"/pdfs/{pdf_filename}"
    }

@app.post("/api/meeting-minutes/{minute_id}/pdf")
async def export_minute_pdf(minute_id: str):
    history = load_meeting_minutes()
    for item in history:
        if item.get("id") == minute_id:
            pdf_path = generate_meeting_minute_pdf(item)
            filename = Path(pdf_path).name
            return {
                "status": "success",
                "pdf_url": f"/pdfs/{filename}",
                "download_url": f"/api/meeting-minutes/{minute_id}/download-pdf"
            }
    raise HTTPException(status_code=404, detail="Meeting minute not found")

@app.get("/api/meeting-minutes/{minute_id}/download-pdf")
async def download_minute_pdf(minute_id: str):
    history = load_meeting_minutes()
    target_item = None
    for item in history:
        if item.get("id") == minute_id:
            target_item = item
            break
            
    if not target_item:
        if minute_id == "sample" or minute_id == "mm-lms-001":
            target_item = dict(SAMPLE_MEETING_DATA)
            target_item["id"] = "mm-lms-001"
        else:
            raise HTTPException(status_code=404, detail="Meeting minute not found")

    pdf_path = generate_meeting_minute_pdf(target_item)
    proj_name = target_item.get("meeting_info", {}).get("project", "Meeting").replace(" ", "_")
    download_filename = f"Meeting_Minute_{proj_name}.pdf"
    
    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=download_filename,
        headers={"Content-Disposition": f'attachment; filename="{download_filename}"'}
    )

@app.put("/api/meeting-minutes/{minute_id}")
@app.post("/api/meeting-minutes/{minute_id}/update")
async def update_meeting_minute(minute_id: str, updated_minute: dict):
    history = load_meeting_minutes()
    found = False
    for i, item in enumerate(history):
        if item.get("id") == minute_id:
            updated_minute["id"] = minute_id
            updated_minute.setdefault("created_at", item.get("created_at", datetime.now().strftime("%Y-%m-%d %H:%M")))
            pdf_path = generate_meeting_minute_pdf(updated_minute)
            filename = Path(pdf_path).name
            updated_minute["pdf_url"] = f"/pdfs/{filename}"
            history[i] = updated_minute
            found = True
            break

    if not found:
        updated_minute["id"] = minute_id
        pdf_path = generate_meeting_minute_pdf(updated_minute)
        filename = Path(pdf_path).name
        updated_minute["pdf_url"] = f"/pdfs/{filename}"
        history.insert(0, updated_minute)

    save_meeting_minutes(history)
    return {
        "status": "success",
        "minute": updated_minute,
        "pdf_url": updated_minute["pdf_url"],
        "download_url": f"/api/meeting-minutes/{minute_id}/download-pdf"
    }

@app.delete("/api/meeting-minutes/{minute_id}")
async def delete_meeting_minute(minute_id: str):
    history = load_meeting_minutes()
    target = None
    new_history = []
    for item in history:
        if item.get("id") == minute_id:
            target = item
        else:
            new_history.append(item)
    
    if not target:
        raise HTTPException(status_code=404, detail="Meeting minute not found")
        
    save_meeting_minutes(new_history)
    
    if target.get("pdf_url"):
        pdf_name = target["pdf_url"].split("/")[-1]
        pdf_file = OUTPUT_DIR / pdf_name
        if pdf_file.exists():
            try:
                pdf_file.unlink()
            except Exception:
                pass
                
    return {"status": "success", "message": "Meeting minute and PDF deleted"}

@app.post("/api/meeting-minutes/clear-all")
async def clear_all_meeting_minutes():
    history = load_meeting_minutes()
    for item in history:
        if item.get("pdf_url"):
            pdf_name = item["pdf_url"].split("/")[-1]
            pdf_file = OUTPUT_DIR / pdf_name
            if pdf_file.exists():
                try:
                    pdf_file.unlink()
                except Exception:
                    pass
    save_meeting_minutes([])
    return {"status": "success", "message": "All meeting minutes and PDFs cleared"}

@app.get("/api/reports/download-pdf/{filename}")
async def download_report_pdf(filename: str):
    pdf_path = OUTPUT_DIR / filename
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found")
    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=filename,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

# ==================== 2. REPORT GENERATION PROCESS ====================

@app.post("/api/reports/generate")
async def generate_report(report_data: ProjectReport):
    report_dict = report_data.dict()
    if not report_dict.get("report_date"):
        report_dict["report_date"] = date.today().strftime("%d/%m/%Y")
    report_dict["prepared_by"] = "My Easy Job PMO"

    pdf_path = generate_project_report_pdf(report_dict)
    filename = Path(pdf_path).name

    return {
        "status": "success",
        "pdf_url": f"/pdfs/{filename}",
        "filename": filename,
        "download_url": f"/api/reports/download-pdf/{filename}",
        "report": report_dict
    }

SAMPLE_DAILY_REPORT = {
    "name": "Myat Min Htet",
    "department": "Project Team",
    "position": "Project Admin",
    "date": "2-10-2026",
    "report_type": "Daily Report",
    "work_details": [
        {
            "project": "Oo Ko - LMS",
            "task": "Mobile App UI/UX Revision & Video Server Migration Review",
            "status": "In Progress",
            "remark": "Meeting discussion points recorded and action items delegated to Dev Team",
            "tomorrow_plan": "Follow up with client regarding Theme Color and verify Private Video Streaming API",
            "meeting_minute_ref": "Shane ( Meeting Minute )"
        }
    ]
}

@app.get("/api/reports/daily-sample")
async def get_daily_sample():
    return SAMPLE_DAILY_REPORT

@app.post("/api/reports/daily-generate")
async def generate_daily_report(report_data: DailyWorkReport):
    report_dict = report_data.dict()
    report_id = f"dwr-{uuid.uuid4().hex[:8]}"
    report_dict["id"] = report_id
    report_dict["created_at"] = datetime.now().strftime("%Y-%m-%d %H:%M")

    pdf_path = generate_daily_work_report_pdf(report_dict)
    filename = Path(pdf_path).name

    return {
        "status": "success",
        "pdf_url": f"/pdfs/{filename}",
        "filename": filename,
        "download_url": f"/api/reports/download-pdf/{filename}",
        "report": report_dict
    }

# ==================== 3. PROJECT & WARNING PROCESS ====================

@app.get("/api/projects")
async def get_projects():
    projects = warning_service.get_projects()
    analyses = {a["project_id"]: a for a in warning_service.get_all_warnings()["alerts"]}
    
    enriched = []
    for p in projects:
        p_copy = dict(p)
        p_copy["analysis"] = analyses.get(p.get("id"), {})
        enriched.append(p_copy)
    return enriched

@app.post("/api/projects")
async def create_project(project: Project):
    projects = warning_service.get_projects()
    # Check duplicate id
    for p in projects:
        if p["id"] == project.id:
            raise HTTPException(status_code=400, detail="Project ID already exists")
    projects.append(project.dict())
    warning_service.save_projects(projects)
    return {"status": "success", "project": project}

@app.put("/api/projects/{project_id}")
async def update_project(project_id: str, updated: Project):
    projects = warning_service.get_projects()
    found = False
    for i, p in enumerate(projects):
        if p["id"] == project_id:
            projects[i] = updated.dict()
            found = True
            break
    if not found:
        raise HTTPException(status_code=404, detail="Project not found")
    warning_service.save_projects(projects)
    return {"status": "success", "project": updated}

@app.delete("/api/projects/{project_id}")
async def delete_project(project_id: str):
    projects = warning_service.get_projects()
    new_projects = [p for p in projects if p["id"] != project_id]
    warning_service.save_projects(new_projects)
    return {"status": "success", "message": "Project deleted"}

@app.post("/api/projects/clear-all")
async def clear_all_projects():
    warning_service.clear_all_projects()
    return {"status": "success", "message": "All projects and deadlines cleared successfully"}

@app.post("/api/projects/restore-defaults")
async def restore_default_projects():
    projects = warning_service.restore_default_projects()
    return {"status": "success", "message": "Default sample projects restored successfully", "projects": projects}

@app.get("/api/warnings")
async def get_warnings():
    return warning_service.get_all_warnings()

@app.post("/api/warnings/dispatch")
async def dispatch_warnings():
    results = warning_service.dispatch_all_warnings()
    return {"status": "success", "dispatch_results": results}

@app.post("/api/warnings/test-telegram")
async def test_telegram_alert():
    warnings = warning_service.get_all_warnings()
    msg = warning_service.format_telegram_alert(warnings)
    ok, message = warning_service.send_telegram_alert(msg)
    return {"success": ok, "message": message}

# ==================== CONFIGURATION & DATA MANAGEMENT ====================

@app.get("/api/config")
async def get_config():
    cfg = warning_service.get_config()
    cfg["gemini_api_key_set"] = bool(cfg.get("gemini_api_key"))
    cfg["telegram_bot_token_set"] = bool(cfg.get("telegram_bot_token"))
    return cfg

@app.post("/api/config")
async def save_config(config: NotificationConfig):
    current = warning_service.get_config()
    new_cfg = config.dict()
    # Don't overwrite with empty if already set
    for k, v in new_cfg.items():
        if v == "" and current.get(k):
            new_cfg[k] = current[k]
    warning_service.save_config(new_cfg)
    return {"status": "success", "message": "Settings saved successfully", "config": new_cfg}

@app.get("/api/pdfs")
async def list_generated_pdfs():
    files = []
    if OUTPUT_DIR.exists():
        for p in OUTPUT_DIR.glob("*.pdf"):
            st = p.stat()
            files.append({
                "filename": p.name,
                "size_kb": round(st.st_size / 1024, 1),
                "modified": datetime.fromtimestamp(st.st_mtime).strftime("%Y-%m-%d %H:%M"),
                "url": f"/pdfs/{p.name}",
                "download_url": f"/api/reports/download-pdf/{p.name}"
            })
    files.sort(key=lambda x: x["modified"], reverse=True)
    return files

@app.delete("/api/pdfs/{filename}")
async def delete_pdf_file(filename: str):
    safe_name = Path(filename).name
    target_file = OUTPUT_DIR / safe_name
    if not target_file.exists():
        raise HTTPException(status_code=404, detail="PDF file not found")
    try:
        target_file.unlink()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"status": "success", "message": f"{safe_name} deleted successfully"}

@app.post("/api/pdfs/clear-all")
async def clear_all_generated_pdfs():
    deleted_count = 0
    if OUTPUT_DIR.exists():
        for p in OUTPUT_DIR.glob("*.pdf"):
            try:
                p.unlink()
                deleted_count += 1
            except Exception:
                pass
    return {"status": "success", "message": f"{deleted_count} PDF files cleared"}

@app.post("/api/data/clear-all")
async def clear_all_data():
    # 1. Clear meeting minutes
    save_meeting_minutes([])
    # 2. Clear projects and deadlines
    warning_service.clear_all_projects()
    # 3. Delete all PDFs in generated_pdfs
    if OUTPUT_DIR.exists():
        for p in OUTPUT_DIR.glob("*.pdf"):
            try:
                p.unlink()
            except Exception:
                pass
    # 4. Clear uploads
    if UPLOADS_DIR.exists():
        for u in UPLOADS_DIR.glob("*"):
            try:
                u.unlink()
            except Exception:
                pass
    return {"status": "success", "message": "All data, deadlines, and PDFs cleared successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
