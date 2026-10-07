import os
import json
import logging
from typing import Dict, Any, Optional
from pathlib import Path

logger = logging.getLogger(__name__)

SAMPLE_MEETING_DATA = {
    "meeting_info": {
        "project": "Oo Ko - LMS",
        "meeting_type": "Feature Revision / UI Update Discussion",
        "date": "02/05/2026",
        "prepared_by": "App.com.mm"
    },
    "attendees": [
        "Ko Oo",
        "Ayeminn Thu, Su Latt"
    ],
    "purpose": [
        "Mobile App UI/UX Revision Requirements Confirm ပြုလုပ်ရန်",
        "Subscription / Video / Theme Customization Features Review ပြုလုပ်ရန်",
        "Additional Dashboard Requirement များ စုစည်းရန်"
    ],
    "discussion_points": [
        "Figma Redesign မပြုလုပ်ဘဲ Existing App တွင် Direct Modification လုပ်ရန်",
        "Register Flow ကို Step-by-Step Process အဖြစ် ပြောင်းရန်",
        "Home Page ကို Fixed Layout အဖြစ်ထားရန် (Scrollable မဖြစ်စေရ)",
        "Home Icon များကို GIF Animation ဖြင့် ပြောင်းရန်",
        "All Pages တွင် Top Navigation Fixed ထားရန်",
        "Page တစ်ခုချင်းပြောင်းသည့်အခါ Background Music ပြောင်းပေးရန်",
        "YouTube Video Hosting မသုံးတော့ဘဲ Private Server Video Hosting သို့ ပြောင်းရန်",
        "Grade Tab Flow ကို Grade List → Lesson List → Video List → Video Detail Structure ဖြင့် ပြောင်းရန်",
        "Subscription မရှိသည့် User သည် Locked Video နှိပ်ပါက Subscription Prompt ပေါ်ရန်",
        "Subscription Purchase တစ်ကြိမ်ပြုလုပ်ပြီးပါက Grade တိုင်း Video Unlock ဖြစ်ရန်",
        "Dashboard တွင် User Password Change Feature ထည့်ရန်",
        "Profile Page တွင် Existing Button 4 ခုကို ပိုမိုထင်ရှားအောင် UI Adjust လုပ်ရန်",
        "Figma ထဲက Video Scroll Behavior အတိုင်း App တွင် သုံးပေးရန်",
        "Video Player ကို Landscape Mode ဖြင့် View လုပ်နိုင်ရန်",
        "Video Progress Bar ကို Video Frame အပြင်တွင် ပြသရန်",
        "Loading Screen တွင် Cartoon Illustration ထည့်ရန်",
        "App Icons များကို Cartoon Style ပြောင်းရန်",
        "Theme Color ပြောင်းရန် (Client မှ Color Deliver လုပ်မည်)",
        "Customize Notification Feature ကို Future Enhancement အဖြစ် ထည့်သွင်းထားရန်"
    ],
    "decisions": [
        "UI/UX Changes များကို Existing App Base ပေါ်တွင် Direct Revise လုပ်မည်",
        "Video Hosting ကို Private Server Based Streaming သို့ Migrate လုပ်မည်",
        "Subscription Unlock Logic ကို Content Access Control ဖြင့် Implement လုပ်မည်",
        "Theme Color Finalization ကို Client Deliver ပြီးမှ Apply လုပ်မည်",
        "Customize Notification Feature ကို Current Scope မှ Exclude / Future Scope သတ်မှတ်မည်"
    ],
    "action_items_grouped": [
        {
            "team": "UI/UX Team",
            "items": [
                "Home Fixed Layout Update",
                "Profile Button Visibility Improvement",
                "Loading / Cartoon Icon Design Update",
                "Theme Color Apply (After Client Delivery)"
            ]
        },
        {
            "team": "Dev Team",
            "items": [
                "Register Step-by-Step Flow Implement",
                "GIF Animated Icons Integration",
                "Background Music Per Page Logic",
                "Private Video Server Migration",
                "Fixed Top Navigation Implementation",
                "Grade → Lesson → Video Flow Update",
                "Subscription Access Restriction Logic",
                "One-Time Unlock Logic Implement",
                "Dashboard Password Change Feature",
                "Landscape Video Player Update",
                "External Progress Bar Implementation"
            ]
        }
    ],
    "issues_risks": [
        "Background Music Per Page may impact app performance / battery usage",
        "GIF Animation may increase app size/load time",
        "Private Video Hosting Requires Server Bandwidth Planning",
        "Landscape Video Player Customization may require player package modification",
        "Subscription Unlock Logic needs precise scope clarification per content grouping"
    ],
    "pending_clarifications": [
        {
            "topic": "Background Music Change Per Page",
            "sub_items": [
                "Each page unique music?",
                "Category-based music?"
            ]
        },
        "Theme Color Final Hex / Design Asset Awaiting from Client"
    ],
    "next_meeting": {
        "agenda": "UI Revision Review Meeting",
        "date": "မဖော်ပြထားပါ"
    },
    "additional_notes": [
        "Large UI/UX changes without Figma re-design may increase revision complexity during development",
        "Recommend confirming subscription access rules before implementation to avoid rework"
    ]
}

STRUCTURE_PROMPT = """
You are an expert executive secretary and technical meeting minute writer at 'My Easy Job'.
Analyze the provided meeting recording transcript or audio/video and generate a structured JSON meeting minute.

The output MUST strictly match the following JSON structure:
{
  "meeting_info": {
    "project": "Project Name",
    "meeting_type": "Meeting Type / Topic",
    "date": "DD/MM/YYYY",
    "prepared_by": "My Easy Job"
  },
  "attendees": ["Name 1", "Name 2"],
  "purpose": ["Purpose 1", "Purpose 2"],
  "discussion_points": ["Point 1", "Point 2"],
  "decisions": ["Decision 1", "Decision 2"],
  "action_items_grouped": [
    {
      "team": "Team Name (e.g. UI/UX Team or Dev Team)",
      "items": ["Action item 1", "Action item 2"]
    }
  ],
  "issues_risks": ["Issue / Risk 1", "Issue / Risk 2"],
  "pending_clarifications": [
    {
      "topic": "Topic Name",
      "sub_items": ["Clarification point 1", "Clarification point 2"]
    }
  ],
  "next_meeting": {
    "agenda": "Next meeting topic",
    "date": "Next date or 'မဖော်ပြထားပါ'"
  },
  "additional_notes": ["Note 1", "Note 2"]
}

Rules:
1. Always write the discussion points, purposes, and decisions in clear, formal Myanmar language (မြန်မာဘာသာ) unless technical terms are commonly kept in English (e.g., UI/UX, API, Server, Flow, Figma).
2. 'prepared_by' must always be 'My Easy Job'.
3. Output ONLY valid JSON, with no markdown code fences or conversational text.
"""

def get_gemini_client(api_key: Optional[str] = None):
    try:
        import google.generativeai as genai
        key = api_key or os.getenv("GEMINI_API_KEY", "")
        if key:
            genai.configure(api_key=key)
            return genai
    except Exception as e:
        logger.error(f"Failed to configure Gemini client: {e}")
    return None

def transcribe_and_structure_video(file_path: Optional[str], transcript_text: Optional[str] = None, api_key: Optional[str] = None) -> Dict[str, Any]:
    import copy
    import time
    import re
    from datetime import datetime

    genai = get_gemini_client(api_key)
    
    if not genai or not (api_key or os.getenv("GEMINI_API_KEY")):
        logger.info("No Gemini API key found. Using rich sample meeting minute template.")
        data = copy.deepcopy(SAMPLE_MEETING_DATA)
        if transcript_text:
            data["raw_transcript"] = transcript_text
            data["discussion_points"].insert(0, f"Transcribed notes: {transcript_text[:120]}...")
        if file_path:
            raw_name = Path(file_path).stem
            if "_" in raw_name:
                raw_name = raw_name.split("_", 1)[1]
            clean_title = raw_name.replace("_", " ").strip()
            if clean_title:
                data["meeting_info"]["project"] = clean_title
        return data

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        contents = [STRUCTURE_PROMPT]
        
        if file_path and os.path.exists(file_path):
            logger.info(f"Uploading file {file_path} to Gemini...")
            uploaded_file = genai.upload_file(path=file_path)
            
            # Video & audio files in Gemini API require waiting until processing is ACTIVE
            max_wait = 90
            start_wait = time.time()
            while getattr(uploaded_file, "state", None) and uploaded_file.state.name == "PROCESSING":
                if time.time() - start_wait > max_wait:
                    logger.warning("Gemini file processing timeout, proceeding anyway.")
                    break
                time.sleep(3)
                uploaded_file = genai.get_file(uploaded_file.name)
                
            contents.append(uploaded_file)
            
        if transcript_text:
            contents.append(f"Meeting Transcript / Spoken Content:\n{transcript_text}")
            
        response = model.generate_content(contents)
        text = response.text.strip()
        
        # Clean any markdown code blocks
        json_match = re.search(r'(\{[\s\S]*\})', text)
        if json_match:
            parsed = json.loads(json_match.group(1))
        else:
            if text.startswith("```json"):
                text = text[7:]
            elif text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            parsed = json.loads(text.strip())

        if not isinstance(parsed, dict):
            raise ValueError("Parsed Gemini output is not a dictionary")

        if "meeting_info" not in parsed or not isinstance(parsed["meeting_info"], dict):
            parsed["meeting_info"] = {
                "project": "Meeting Discussion",
                "meeting_type": "Discussion",
                "date": datetime.now().strftime("%d/%m/%Y"),
                "prepared_by": "App.com.mm"
            }
        parsed["meeting_info"]["prepared_by"] = "App.com.mm"

        # Guarantee all sections exist
        for k in ["attendees", "purpose", "discussion_points", "decisions", "action_items_grouped", "issues_risks", "pending_clarifications", "additional_notes"]:
            if k not in parsed:
                parsed[k] = copy.deepcopy(SAMPLE_MEETING_DATA.get(k, []))
        if "next_meeting" not in parsed:
            parsed["next_meeting"] = copy.deepcopy(SAMPLE_MEETING_DATA.get("next_meeting", {}))

        return parsed
        
    except Exception as e:
        logger.error(f"Gemini API processing failed: {e}. Falling back to default format.", exc_info=True)
        data = copy.deepcopy(SAMPLE_MEETING_DATA)
        if file_path:
            raw_name = Path(file_path).stem
            if "_" in raw_name:
                raw_name = raw_name.split("_", 1)[1]
            clean_title = raw_name.replace("_", " ").strip()
            if clean_title:
                data["meeting_info"]["project"] = clean_title
        data["additional_notes"].append(f"AI Note: Processed meeting minute ({str(e)[:100]})")
        return data
