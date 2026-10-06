import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

BASE_DIR = Path(__file__).resolve().parent
TEMPLATES_DIR = BASE_DIR / "templates"
OUTPUT_DIR = BASE_DIR / "generated_pdfs"
OUTPUT_DIR.mkdir(exist_ok=True, parents=True)

env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))

def find_browser_executable() -> str:
    candidates = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe"),
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    ]
    for p in candidates:
        if os.path.exists(p):
            return p
    return "msedge"

def render_html_to_pdf(html_content: str, output_filename: str) -> str:
    browser_exe = find_browser_executable()
    output_pdf_path = OUTPUT_DIR / output_filename
    
    # Write temp html file with utf-8 encoding
    temp_html_path = OUTPUT_DIR / f"temp_{uuid.uuid4().hex[:8]}.html"
    with open(temp_html_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    cmd = [
        browser_exe,
        "--headless",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={str(output_pdf_path)}",
        str(temp_html_path)
    ]
    
    try:
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        if not output_pdf_path.exists():
            raise RuntimeError(f"Browser failed to generate PDF: {res.stderr}")
    finally:
        if temp_html_path.exists():
            try:
                temp_html_path.unlink()
            except Exception:
                pass
                
    return str(output_pdf_path)

def generate_meeting_minute_pdf(minute_dict: dict, filename: str = None) -> str:
    if not filename:
        proj_slug = minute_dict.get("meeting_info", {}).get("project", "meeting").replace(" ", "_")
        filename = f"Meeting_Minute_{proj_slug}_{uuid.uuid4().hex[:6]}.pdf"
    template = env.get_template("meeting_minute.html")
    html_content = template.render(minute=minute_dict)
    return render_html_to_pdf(html_content, filename)

def generate_project_report_pdf(report_dict: dict, filename: str = None) -> str:
    if not filename:
        proj_slug = report_dict.get("project_name", "project").replace(" ", "_")
        filename = f"Project_Report_{proj_slug}_{uuid.uuid4().hex[:6]}.pdf"
    template = env.get_template("project_report.html")
    html_content = template.render(report=report_dict)
    return render_html_to_pdf(html_content, filename)

def generate_daily_work_report_pdf(report_dict: dict, filename: str = None) -> str:
    if not filename:
        name_slug = report_dict.get("name", "Report").replace(" ", "_")
        date_slug = report_dict.get("date", "Today").replace("-", "_").replace("/", "_")
        filename = f"Daily_Work_Report_{name_slug}_{date_slug}_{uuid.uuid4().hex[:6]}.pdf"
    template = env.get_template("daily_work_report.html")
    html_content = template.render(report=report_dict)
    return render_html_to_pdf(html_content, filename)
