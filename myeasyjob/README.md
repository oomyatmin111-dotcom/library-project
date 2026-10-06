# My Easy Job — Management Suite
### Automated Meeting Minutes Transcription, Project Status Reports & Deadline Warnings

---

## 📌 မိတ်ဆက် (Overview)

ဤ **My Easy Job Management Suite** သည် အောက်ပါ အဓိက လုပ်ငန်းစဉ် (၃) ခုကို အလိုအလျောက် ဆောင်ရွက်ပေးနိုင်ရန် တည်ဆောက်ထားသော စနစ်ဖြစ်ပါသည်:

1. **🎙️ အစည်းအဝေး မှတ်တမ်း (Meeting Minutes Process):**
   - အစည်းအဝေး ဗီဒီယို သို့မဟုတ် အသံဖိုင် (MP4, MKV, MP3, etc.) ကို Gemini AI ဖြင့် Transcribe ပြုလုပ်ခြင်း။
   - ပေးပို့ထားသော စံနမူနာ Document အတိုင်း အပိုင်း (၁၀) ပိုင်း အတိအကျဖြင့် **My Easy Job** Branding ပါဝင်သော Print-Quality PDF ဖိုင် ထုတ်ပေးခြင်း။
   - မြန်မာစာ Font (Myanmar Unicode) ပုံစံမပျက်စေဘဲ ပြီးပြည့်စုံစွာ ဖွဲ့စည်းပေးခြင်း။

2. **📊 ပရောဂျက် အစီရင်ခံစာ (Report Generation Process):**
   - ပရောဂျက်တစ်ခုချင်းစီ၏ လက်ရှိအခြေအနေ၊ ပြီးစီးမှု ရာခိုင်နှုန်း (Progress %)، အဓိကပြီးစီးမှုမှတ်တိုင်များ (Milestones) နှင့် ရှေ့ဆက်ဆောင်ရွက်မည့် အစီအစဉ်များကို ထည့်သွင်း၍ Executive Project Status Report (PDF) ထုတ်ယူခြင်း။

3. **⏰ Start Date & Deadline Warning စနစ် (Date Warning Process):**
   - Projects များ၏ Start Date နှင့် Deadline များကို နေ့စဉ်တွက်ချက်စစ်ဆေးခြင်း။
   - ရက်လွန်နေသော ပရောဂျက်များ (🚨 Overdue Alert)၊ သတ်မှတ်ရက် နီးကပ်နေသော ပရောဂျက်များ (⚠️ Imminent < 3 Days) နှင့် မကြာမီ စတင်တော့မည့် ပရောဂျက်များ (ℹ️ Starting Soon < 7 Days) ကို Web Dashboard တွင် Banner / Badges များဖြင့် ပြသခြင်း။
   - Telegram Bot, Webhook နှင့် Email (SMTP) သို့ သတိပေးချက်များ အလိုအလျောက် ပေးပို့နိုင်ခြင်း။

---

## 🚀 စတင် အသုံးပြုနည်း (Quick Start)

### ၁။ Run ပြုလုပ်ရန်:
ဖိုင်တွဲထဲရှိ `run.bat` ကို Double Click နှိပ်၍ run နိုင်ပါသည် သို့မဟုတ် Terminal တွင်:
```powershell
cd c:\repos\library-project\myeasyjob
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

### ၂။ Web Browser တွင် ဖွင့်ရန်:
Browser တွင် `http://127.0.0.1:8000` သို့ ဝင်ရောက်အသုံးပြုနိုင်ပါသည်။

---

## 📑 အစည်းအဝေး မှတ်တမ်း Format ဖွဲ့စည်းပုံ (၁၀ ပိုင်း)

အစည်းအဝေးမှတ်တမ်း PDF အား ပေးထားသော Format အတိုင်း အောက်ပါ အပိုင်း ၁၀ ပိုင်းဖြင့် တိကျစွာ ထုတ်ပေးပါသည်:
- **Header:** My Easy Job Business IT Solution Logo & Contact Information
- **Title:** အစည်းအဝေး မှတ်တမ်း
- **၁။ အစည်းအဝေး အချက်အလက် (Meeting Information)**
- **၂။ တက်ရောက်သူများ (Attendees)**
- **၃။ ရည်ရွယ်ချက် (Purpose)**
- **၄။ ဆွေးနွေးချက်များ (Discussion Points)**
- **၅။ ဆုံးဖြတ်ချက်များ (Decisions)**
- **၆။ လုပ်ဆောင်ရန်တာဝန်များ (Action Items - UI/UX Team, Dev Team စသည်ဖြင့်)**
- **၇။ ပြဿနာ / အန္တရာယ်များ (Issues / Risks)**
- **၈။ အတည်ပြုရန်လိုအပ်ချက်များ (Pending Clarifications)**
- **၉။ နောက်အစည်းအဝေး (Next Meeting)**
- **၁၀။ အခြားမှတ်ချက်များ (Additional Notes)**

---

## ⚙️ ဆက်တင်များ ပြင်ဆင်ခြင်း (Configuration)

Web UI ရှိ **Settings** tab တွင် အောက်ပါတို့ကို ထည့်သွင်းနိုင်ပါသည်:
- **Gemini API Key:** Google AI Studio မှ API Key ထည့်သွင်းခြင်း (ဗီဒီယိုကို AI ဖြင့် အလိုအလျောက် နားထောင်၍ အစည်းအဝေး မှတ်တမ်း ထုတ်ယူရန်)
- **Telegram Bot Token & Chat ID:** ပရောဂျက် Deadline သတိပေးချက်များ Telegram သို့ တိုက်ရိုက် ပေးပို့ရန်
- **Webhook URL:** Slack / Discord သို့ သတိပေးချက် ပို့ရန်
- **Email SMTP:** သတိပေးချက် အီးမေးလ်များ ပို့ရန်
