import json
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, date
from pathlib import Path
from typing import List, Dict, Any, Tuple
import requests

logger = logging.getLogger(__name__)

DEFAULT_PROJECTS = [
  {
    "id": "proj-lms-01",
    "name": "Oo Ko - LMS (Learning Management System)",
    "client": "Oo Ko Education",
    "start_date": "2026-05-01",
    "deadline": "2026-10-10",
    "status": "In Progress",
    "progress_percentage": 75,
    "priority": "High",
    "team_leads": ["Ayeminn Thu", "Su Latt"],
    "description": "Mobile app UI/UX revision, private video streaming server migration, and subscription unlock flow."
  },
  {
    "id": "proj-lib-02",
    "name": "Library & Digital Comic Reader Platform",
    "client": "Digital Media Group",
    "start_date": "2026-09-01",
    "deadline": "2026-10-05",
    "status": "Review",
    "progress_percentage": 92,
    "priority": "Urgent",
    "team_leads": ["Tech Lead Ko Oo"],
    "description": "Multi-tier physical library management, comic reader, VIP subscriptions and audit logging."
  },
  {
    "id": "proj-mej-03",
    "name": "My Easy Job Automated Executive Suite",
    "client": "My Easy Job Internal",
    "start_date": "2026-10-12",
    "deadline": "2026-12-20",
    "status": "Planning",
    "progress_percentage": 20,
    "priority": "Medium",
    "team_leads": ["My Easy Job PMO"],
    "description": "Automated meeting minute transcription, executive project report generation, and multi-channel deadline alerts."
  },
  {
    "id": "proj-fin-04",
    "name": "FinTech Multi-Currency Payment Gateway",
    "client": "KBZ & WavePay Partner",
    "start_date": "2026-08-15",
    "deadline": "2026-11-30",
    "status": "In Progress",
    "progress_percentage": 50,
    "priority": "Medium",
    "team_leads": ["Senior Backend Dev"],
    "description": "Secure webhook handler, HMAC signatures, and instant settlement ledger."
  }
]

class WarningService:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.projects_file = data_dir / "projects.json"
        self.config_file = data_dir / "config.json"

    def get_projects(self) -> List[Dict[str, Any]]:
        if not self.projects_file.exists():
            self.save_projects(DEFAULT_PROJECTS)
            return DEFAULT_PROJECTS
        try:
            with open(self.projects_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                if not data:
                    self.save_projects(DEFAULT_PROJECTS)
                    return DEFAULT_PROJECTS
                return data
        except Exception:
            return DEFAULT_PROJECTS

    def save_projects(self, projects: List[Dict[str, Any]]) -> None:
        with open(self.projects_file, "w", encoding="utf-8") as f:
            json.dump(projects, f, indent=2, ensure_ascii=False)

    def get_config(self) -> Dict[str, Any]:
        if not self.config_file.exists():
            return {}
        try:
            with open(self.config_file, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {}

    def save_config(self, cfg: Dict[str, Any]) -> None:
        with open(self.config_file, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2, ensure_ascii=False)

    def analyze_project_dates(self, proj: Dict[str, Any]) -> Dict[str, Any]:
        today = date.today()
        start_date_str = proj.get("start_date", "")
        deadline_str = proj.get("deadline", "")
        status = proj.get("status", "In Progress")

        analysis = {
            "project_id": proj.get("id"),
            "project_name": proj.get("name"),
            "start_date": start_date_str,
            "deadline": deadline_str,
            "status": status,
            "days_until_start": None,
            "days_until_deadline": None,
            "is_overdue": False,
            "is_imminent": False,
            "is_starting_soon": False,
            "warning_level": "normal", # normal, info, warning, danger
            "alert_message": "ပုံမှန် အခြေအနေတွင် ရှိနေပါသည်"
        }

        if status == "Completed":
            analysis["alert_message"] = "ပရောဂျက် ပြီးစီးပြီးဖြစ်ပါသည်"
            analysis["warning_level"] = "success"
            return analysis

        # Parse start date
        try:
            s_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
            diff_start = (s_date - today).days
            analysis["days_until_start"] = diff_start
            if 0 < diff_start <= 7:
                analysis["is_starting_soon"] = True
                analysis["warning_level"] = "info"
                analysis["alert_message"] = f"Start Date နီးကပ်နေပါသည် ({diff_start} ရက်အတွင်း စတင်မည်)"
            elif diff_start == 0:
                analysis["warning_level"] = "info"
                analysis["alert_message"] = "ယနေ့ စတင်သည့် ပရောဂျက် ဖြစ်ပါသည်"
        except Exception:
            pass

        # Parse deadline
        try:
            d_date = datetime.strptime(deadline_str, "%Y-%m-%d").date()
            diff_deadline = (d_date - today).days
            analysis["days_until_deadline"] = diff_deadline

            if diff_deadline < 0:
                analysis["is_overdue"] = True
                analysis["warning_level"] = "danger"
                analysis["alert_message"] = f"🚨 သတိပေးချက်: သတ်မှတ်ရက်ထက် {abs(diff_deadline)} ရက် ကျော်လွန်နေပါသည် (Overdue)!"
            elif diff_deadline == 0:
                analysis["is_imminent"] = True
                analysis["warning_level"] = "danger"
                analysis["alert_message"] = "⚠️ သတိပေးချက်: ယနေ့ နောက်ဆုံး သတ်မှတ်ရက် ဖြစ်ပါသည် (Due Today)!"
            elif 0 < diff_deadline <= 3:
                analysis["is_imminent"] = True
                analysis["warning_level"] = "warning"
                analysis["alert_message"] = f"⚠️ သတိပေးချက်: သတ်မှတ်ရက် ပြည့်ရန် {diff_deadline} ရက်သာ ကျန်ရှိပါသည် (Deadline Imminent)!"
            elif 3 < diff_deadline <= 7:
                analysis["warning_level"] = "warning"
                analysis["alert_message"] = f"သတ်မှတ်ရက် ပြည့်ရန် {diff_deadline} ရက် ကျန်ရှိပါသည်"
            elif diff_deadline > 7:
                if analysis["warning_level"] == "normal":
                    analysis["alert_message"] = f"သတ်မှတ်ရက် ပြည့်ရန် {diff_deadline} ရက် ကျန်ရှိပါသည် (On Track)"
        except Exception:
            pass

        return analysis

    def get_all_warnings(self) -> Dict[str, Any]:
        projects = self.get_projects()
        analyses = [self.analyze_project_dates(p) for p in projects]

        overdue_list = [a for a in analyses if a["is_overdue"]]
        imminent_list = [a for a in analyses if a["is_imminent"]]
        starting_soon_list = [a for a in analyses if a["is_starting_soon"]]

        return {
            "total_projects": len(projects),
            "overdue_count": len(overdue_list),
            "imminent_count": len(imminent_list),
            "starting_soon_count": len(starting_soon_list),
            "alerts": analyses,
            "overdue_projects": overdue_list,
            "imminent_projects": imminent_list,
            "starting_soon_projects": starting_soon_list
        }

    def format_telegram_alert(self, warnings: Dict[str, Any]) -> str:
        lines = [
            "🔔 *[My Easy Job] Project Date Warning Alert*",
            f"📅 Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            "-------------------------------------"
        ]

        if warnings["overdue_count"] > 0:
            lines.append(f"\n🚨 *OVERDUE PROJECTS ({warnings['overdue_count']}):*")
            for p in warnings["overdue_projects"]:
                lines.append(f"• *{p['project_name']}*: Deadline {p['deadline']} ({p['alert_message']})")

        if warnings["imminent_count"] > 0:
            lines.append(f"\n⚠️ *DEADLINE IMMINENT ({warnings['imminent_count']}):*")
            for p in warnings["imminent_projects"]:
                lines.append(f"• *{p['project_name']}*: Deadline {p['deadline']} ({p['alert_message']})")

        if warnings["starting_soon_count"] > 0:
            lines.append(f"\nℹ️ *STARTING SOON ({warnings['starting_soon_count']}):*")
            for p in warnings["starting_soon_projects"]:
                lines.append(f"• *{p['project_name']}*: Starts on {p['start_date']}")

        if warnings["overdue_count"] == 0 and warnings["imminent_count"] == 0 and warnings["starting_soon_count"] == 0:
            lines.append("\n✅ All projects are currently on track with no critical date warnings.")

        lines.append("\n---\n*My Easy Job - Business IT Solution Management*")
        return "\n".join(lines)

    def send_telegram_alert(self, message: str) -> Tuple[bool, str]:
        cfg = self.get_config()
        token = cfg.get("telegram_bot_token")
        chat_id = cfg.get("telegram_chat_id")

        if not token or not chat_id:
            return False, "Telegram Bot Token သို့မဟုတ် Chat ID ထည့်သွင်းထားခြင်း မရှိပါ"

        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "Markdown"
        }
        try:
            res = requests.post(url, json=payload, timeout=10)
            if res.status_code == 200:
                return True, "Telegram Alert အောင်မြင်စွာ ပေးပို့ပြီးပါပြီ"
            return False, f"Telegram error: {res.text}"
        except Exception as e:
            return False, f"Telegram dispatch failed: {str(e)}"

    def send_webhook_alert(self, payload: Dict[str, Any]) -> Tuple[bool, str]:
        cfg = self.get_config()
        webhook_url = cfg.get("webhook_url")
        if not webhook_url:
            return False, "Webhook URL ထည့်သွင်းထားခြင်း မရှိပါ"
        try:
            res = requests.post(webhook_url, json=payload, timeout=10)
            return True, f"Webhook response status: {res.status_code}"
        except Exception as e:
            return False, f"Webhook failed: {str(e)}"

    def send_email_alert(self, subject: str, body: str) -> Tuple[bool, str]:
        cfg = self.get_config()
        server = cfg.get("smtp_server")
        port = cfg.get("smtp_port", 587)
        user = cfg.get("smtp_user")
        pwd = cfg.get("smtp_password")
        recipient = cfg.get("alert_recipient_email")

        if not server or not user or not recipient:
            return False, "SMTP server, user သို့မဟုတ် recipient email မပြည့်စုံပါ"

        msg = MIMEMultipart()
        msg["From"] = user
        msg["To"] = recipient
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))

        try:
            with smtplib.SMTP(server, int(port), timeout=10) as s:
                s.starttls()
                if pwd:
                    s.login(user, pwd)
                s.send_message(msg)
            return True, "Email Alert အောင်မြင်စွာ ပေးပို့ပြီးပါပြီ"
        except Exception as e:
            return False, f"Email failed: {str(e)}"

    def dispatch_all_warnings(self) -> Dict[str, Any]:
        warnings = self.get_all_warnings()
        msg_text = self.format_telegram_alert(warnings)
        
        results = {}
        # Telegram
        tg_ok, tg_msg = self.send_telegram_alert(msg_text)
        results["telegram"] = {"success": tg_ok, "message": tg_msg}
        
        # Webhook
        wh_ok, wh_msg = self.send_webhook_alert(warnings)
        results["webhook"] = {"success": wh_ok, "message": wh_msg}
        
        # Email
        em_ok, em_msg = self.send_email_alert("[My Easy Job] Project Deadline Warning Alert", msg_text)
        results["email"] = {"success": em_ok, "message": em_msg}
        
        return results
