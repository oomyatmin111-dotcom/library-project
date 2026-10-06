from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict, Union

class MeetingInfo(BaseModel):
    project: str = "Oo Ko - LMS"
    meeting_type: str = "Feature Revision / UI Update Discussion"
    date: str = "02/05/2026"
    prepared_by: str = "My Easy Job"

class ActionItemGroup(BaseModel):
    team: str
    items: List[str] = []

class NextMeeting(BaseModel):
    agenda: str = "UI Revision Review Meeting"
    date: str = "မဖော်ပြထားပါ"

class MeetingMinute(BaseModel):
    id: Optional[str] = None
    meeting_info: MeetingInfo
    attendees: List[str] = []
    purpose: List[str] = []
    discussion_points: List[str] = []
    decisions: List[str] = []
    action_items_grouped: List[ActionItemGroup] = []
    issues_risks: List[str] = []
    pending_clarifications: List[Union[str, Dict[str, Any]]] = []
    next_meeting: NextMeeting = Field(default_factory=NextMeeting)
    additional_notes: List[str] = []
    raw_transcript: Optional[str] = None
    created_at: Optional[str] = None

class MilestoneItem(BaseModel):
    title: str
    description: str = ""
    team: str = "Dev Team"
    target_date: str = ""
    status: str = "In Progress" # Completed, In Progress, Pending

class Project(BaseModel):
    id: str
    name: str
    client: str = ""
    start_date: str # YYYY-MM-DD
    deadline: str # YYYY-MM-DD
    status: str = "In Progress" # Planning, In Progress, Review, Completed, Delayed
    progress_percentage: int = 0
    priority: str = "Medium" # Low, Medium, High, Urgent
    team_leads: List[str] = []
    description: str = ""

class ProjectReport(BaseModel):
    id: Optional[str] = None
    project_id: str
    project_name: str
    period: str = "Current Sprint"
    report_date: str = ""
    prepared_by: str = "My Easy Job"
    progress_percentage: int = 0
    status: str = "On Track"
    start_date: str = ""
    deadline: str = ""
    summary: str = ""
    milestones: List[MilestoneItem] = []
    upcoming_steps: List[str] = []
    risks: List[str] = []
    notes: List[str] = []
    created_at: Optional[str] = None

class DailyWorkItem(BaseModel):
    project: str = ""
    task: str = ""
    status: str = "In Progress"
    remark: str = ""
    tomorrow_plan: str = ""
    meeting_minute_ref: Optional[str] = "Shane ( Meeting Minute )"

class DailyWorkReport(BaseModel):
    id: Optional[str] = None
    name: str = "Myat Min Htet"
    department: str = "Project Team"
    position: str = "Project Admin"
    date: str = "2-10-2026"
    report_type: str = "Daily Report"
    work_details: List[DailyWorkItem] = []
    created_at: Optional[str] = None

class NotificationConfig(BaseModel):
    gemini_api_key: Optional[str] = ""
    telegram_bot_token: Optional[str] = ""
    telegram_chat_id: Optional[str] = ""
    webhook_url: Optional[str] = ""
    smtp_server: Optional[str] = ""
    smtp_port: Optional[int] = 587
    smtp_user: Optional[str] = ""
    smtp_password: Optional[str] = ""
    alert_recipient_email: Optional[str] = ""
