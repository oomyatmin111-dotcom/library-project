document.addEventListener("DOMContentLoaded", () => {
  // Tabs
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add("active");
    });
  });

  // State
  let projectsCache = [];

  // ================= 1. MEETING MINUTES =================
  const minutesList = document.getElementById("minutes-list");
  const transcribeForm = document.getElementById("transcribe-form");
  const minuteLoading = document.getElementById("minute-loading");
  const btnQuickSample = document.getElementById("btn-quick-sample");

  let minutesCache = [];

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function triggerDirectDownload(url) {
    const link = document.createElement("a");
    link.href = url;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function loadMeetingMinutes() {
    try {
      const res = await fetch("/api/meeting-minutes");
      const data = await res.json();
      minutesCache = data || [];
      renderMinutesList(minutesCache);
    } catch (err) {
      console.error("Failed to load minutes", err);
    }
  }

  function renderMinutesList(minutes) {
    minutesCache = minutes || [];
    if (!minutes || minutes.length === 0) {
      minutesList.innerHTML = `<div class="empty-state"><p>မှတ်တမ်းများ မရှိသေးပါ (No Meeting Minutes)</p></div>`;
      return;
    }
    minutesList.innerHTML = minutes.map(m => {
      const info = m.meeting_info || {};
      const downloadUrl = `/api/meeting-minutes/${m.id}/download-pdf`;
      return `
        <div class="minute-card">
          <div class="minute-card-header">
            <span class="minute-title">${escapeHtml(info.project || "Untitled Project")}</span>
            <span class="badge info">${escapeHtml(info.date || "")}</span>
          </div>
          <div class="minute-meta">
            <b>Topic:</b> ${escapeHtml(info.meeting_type || "Discussion")}<br>
            <b>Prepared By:</b> ${escapeHtml(info.prepared_by || "App.com.mm")}
          </div>
          <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
            <a href="${downloadUrl}" class="btn btn-primary btn-sm" download>
              📥 Download PDF
            </a>
            <button class="btn btn-secondary btn-sm" onclick="openMinuteDetailModal('${m.id}')">
              🔍 View Details & Edit
            </button>
            <button class="btn btn-secondary btn-sm" onclick="copyMinuteNumberedText('${m.id}')" title="နံပါတ်စဉ်ဖြင့် Text ကူးယူမည်">
              📋 Copy Text
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteMeetingMinute('${m.id}')" title="မှတ်တမ်းနှင့် PDF ဖျက်ရန်">
              🗑️ Delete
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  function toBurmeseNumerals(num) {
    const burmeseDigits = ["၀", "၁", "၂", "၃", "၄", "၅", "၆", "၇", "၈", "၉"];
    return String(num).replace(/[0-9]/g, d => burmeseDigits[parseInt(d)]);
  }

  function downloadTextFile(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function formatMeetingMinuteAsNumberedText(m, numStyle = "myanmar") {
    const isMm = (numStyle === "myanmar");
    const toNum = (n) => isMm ? toBurmeseNumerals(n) : String(n);
    const info = m.meeting_info || {};

    const lines = [
      "============================================================",
      "📋 အစည်းအဝေး မှတ်တမ်း (Meeting Minutes - App.com.mm)",
      "============================================================",
      "",
      `${isMm ? "၁" : "1"}။ အစည်းအဝေး အချက်အလက် (Meeting Information):`,
      `   • Project: ${info.project || "-"}`,
      `   • Meeting Type: ${info.meeting_type || "-"}`,
      `   • Date: ${info.date || "-"}`,
      `   • Prepared By: ${info.prepared_by || "App.com.mm"}`,
      "",
      `${isMm ? "၂" : "2"}။ တက်ရောက်သူများ (Attendees):`
    ];

    if (m.attendees && m.attendees.length > 0) {
      m.attendees.forEach((a, i) => lines.push(`   ${toNum(i + 1)}. ${a}`));
    } else {
      lines.push("   (မရှိပါ)");
    }
    lines.push("");

    lines.push(`${isMm ? "၃" : "3"}။ ရည်ရွယ်ချက် (Purpose):`);
    if (m.purpose && m.purpose.length > 0) {
      m.purpose.forEach((p, i) => lines.push(`   ${toNum(i + 1)}. ${p}`));
    } else {
      lines.push("   (မရှိပါ)");
    }
    lines.push("");

    lines.push(`${isMm ? "၄" : "4"}။ ဆွေးနွေးချက်များ (Discussion Points):`);
    if (m.discussion_points && m.discussion_points.length > 0) {
      m.discussion_points.forEach((d, i) => {
        if (typeof d === "string") lines.push(`   ${toNum(i + 1)}. ${d}`);
        else if (d && d.topic) {
          lines.push(`   ${toNum(i + 1)}. ${d.topic}`);
          if (d.sub_items) {
            d.sub_items.forEach((s) => lines.push(`      - ${s}`));
          }
        }
      });
    } else {
      lines.push("   (မရှိပါ)");
    }
    lines.push("");

    lines.push(`${isMm ? "၅" : "5"}။ ဆုံးဖြတ်ချက်များ (Decisions):`);
    if (m.decisions && m.decisions.length > 0) {
      m.decisions.forEach((dec, i) => lines.push(`   ${toNum(i + 1)}. ${dec}`));
    } else {
      lines.push("   (မရှိပါ)");
    }
    lines.push("");

    lines.push(`${isMm ? "၆" : "6"}။ ဆောင်ရွက်ရန် တာဝန်များ (Action Items):`);
    if (m.action_items_grouped && m.action_items_grouped.length > 0) {
      m.action_items_grouped.forEach((grp) => {
        lines.push(`   [${grp.team}]`);
        (grp.items || []).forEach((it, ii) => lines.push(`     ${toNum(ii + 1)}. ${it}`));
      });
    } else if (m.action_items && m.action_items.length > 0) {
      m.action_items.forEach((it, i) => lines.push(`   ${toNum(i + 1)}. ${it}`));
    } else {
      lines.push("   (မရှိပါ)");
    }
    lines.push("");

    lines.push(`${isMm ? "၇" : "7"}။ ကြုံတွေ့နေရသော အခက်အခဲနှင့် စိန်ခေါ်မှုများ (Issues & Risks):`);
    if (m.issues_risks && m.issues_risks.length > 0) {
      m.issues_risks.forEach((iss, i) => lines.push(`   ${toNum(i + 1)}. ${iss}`));
    } else {
      lines.push("   (မရှိပါ)");
    }
    lines.push("");

    lines.push(`${isMm ? "၈" : "8"}။ ရှင်းလင်းရန် လိုအပ်ဆဲ အချက်များ (Pending Clarifications):`);
    if (m.pending_clarifications && m.pending_clarifications.length > 0) {
      m.pending_clarifications.forEach((cl, i) => lines.push(`   ${toNum(i + 1)}. ${cl}`));
    } else {
      lines.push("   (မရှိပါ)");
    }
    lines.push("");

    const next = m.next_meeting || {};
    lines.push(`${isMm ? "၉" : "9"}။ နောက်တစ်ကြိမ် အစည်းအဝေး အစီအစဉ် (Next Meeting):`);
    lines.push(`   • Agenda: ${next.agenda || "-"}`);
    lines.push(`   • Date: ${next.date || "-"}`);
    lines.push("");

    lines.push(`${isMm ? "၁၀" : "10"}။ အခြားမှတ်ချက်များ (Additional Notes):`);
    if (m.additional_notes && m.additional_notes.length > 0) {
      m.additional_notes.forEach((nt, i) => lines.push(`   ${toNum(i + 1)}. ${nt}`));
    } else {
      lines.push("   (မရှိပါ)");
    }
    lines.push("============================================================");

    return lines.join("\n");
  }

  window.copyMinuteNumberedText = function(id) {
    const m = minutesCache.find(x => x.id === id);
    if (!m) {
      alert("အစည်းအဝေးမှတ်တမ်း ရှာမတွေ့ပါ");
      return;
    }
    const text = formatMeetingMinuteAsNumberedText(m, "myanmar");
    navigator.clipboard.writeText(text).then(() => {
      alert("✅ အစည်းအဝေးမှတ်တမ်းကို နံပါတ်စဉ်များဖြင့် Text အဖြစ် Clipboard သို့ အောင်မြင်စွာ ကူးယူပြီးပါပြီ!\n(Telegram, Viber စသည်တို့သို့ တိုက်ရိုက် Paste ချနိုင်ပါသည်)");
    }).catch(err => {
      alert("Copy failed: " + err.message);
    });
  };

  window.exportMinutePdf = function(id) {
    triggerDirectDownload(`/api/meeting-minutes/${id}/download-pdf`);
  };

  window.deleteMeetingMinute = async function(id) {
    if (!confirm("⚠️ ဤအစည်းအဝေးမှတ်တမ်းနှင့် ဆက်စပ်နေသော PDF ဖိုင်ကို အပြီးတိုင် ဖျက်ပစ်ရန် သေချာပါသလား?")) return;
    try {
      const res = await fetch(`/api/meeting-minutes/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("✅ မှတ်တမ်းနှင့် PDF ဖိုင်ကို အောင်မြင်စွာ ဖျက်ပစ်လိုက်ပါပြီ!");
        const modal = document.getElementById("minute-edit-modal");
        if (modal && !modal.classList.contains("hidden")) {
          modal.classList.add("hidden");
        }
        await loadMeetingMinutes();
        if (typeof loadGeneratedPdfList === "function") {
          await loadGeneratedPdfList();
        }
      } else {
        alert("Delete failed: " + (data.detail || "Error"));
      }
    } catch (err) {
      alert("Delete error: " + err.message);
    }
  };

  window.clearAllMeetingMinutes = async function() {
    if (!confirm("⚠️ အစည်းအဝေးမှတ်တမ်းများနှင့် ထွက်ရှိထားသော PDF ဖိုင်များအားလုံးကို အပြီးတိုင် ဖျက်ပစ်ရန် သေချာပါသလား?\n(ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍ မရပါ)")) return;
    try {
      const res = await fetch("/api/meeting-minutes/clear-all", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert("✅ " + (data.message || "အစည်းအဝေးမှတ်တမ်းအားလုံးကို ရှင်းလင်းပြီးပါပြီ"));
        await loadMeetingMinutes();
        if (typeof loadGeneratedPdfList === "function") {
          await loadGeneratedPdfList();
        }
      } else {
        alert("Clear failed: " + (data.detail || "Error"));
      }
    } catch (err) {
      alert("Clear error: " + err.message);
    }
  };

  function renderMinuteDocumentPreview(m) {
    const info = m.meeting_info || {};
    const downloadUrl = `/api/meeting-minutes/${m.id}/download-pdf`;

    let actionsHtml = "";
    if (m.action_items_grouped && m.action_items_grouped.length > 0) {
      actionsHtml = m.action_items_grouped.map(grp => `
        <div style="font-weight: 600; color: #111827; margin-top: 8px; margin-bottom: 4px;">• ${escapeHtml(grp.team)}</div>
        <ul style="margin: 4px 0 10px 22px; list-style-type: circle; color: #111827;">
          ${(grp.items || []).map(it => `<li style="margin-bottom: 4px;">${escapeHtml(it)}</li>`).join("")}
        </ul>
      `).join("");
    } else if (m.action_items && m.action_items.length > 0) {
      actionsHtml = `
        <ul style="margin: 6px 0 12px 22px; list-style-type: disc; color: #111827;">
          ${m.action_items.map(it => `<li style="margin-bottom: 4px;">${escapeHtml(it)}</li>`).join("")}
        </ul>
      `;
    } else {
      actionsHtml = `<p style="color: #94a3b8; font-style: italic; margin-left: 10px;">မရှိပါ</p>`;
    }

    const renderList = (items) => {
      if (!items || items.length === 0) return `<p style="color: #94a3b8; font-style: italic; margin-left: 10px;">မရှိပါ</p>`;
      return `
        <ul style="margin: 6px 0 12px 22px; list-style-type: disc; color: #111827;">
          ${items.map(it => {
            if (typeof it === 'string') return `<li style="margin-bottom: 4px;">${escapeHtml(it)}</li>`;
            if (it && it.topic) {
              const subHtml = it.sub_items && it.sub_items.length > 0
                ? `<ul style="margin: 4px 0 6px 18px; list-style-type: circle;">${it.sub_items.map(s => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
                : "";
              return `<li style="margin-bottom: 4px;"><b>${escapeHtml(it.topic)}</b>${subHtml}</li>`;
            }
            return `<li style="margin-bottom: 4px;">${escapeHtml(JSON.stringify(it))}</li>`;
          }).join("")}
        </ul>
      `;
    };

    return `
      <!-- Preview Header matching user's exact design -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 8px;">
        <tr>
          <td style="width: 54%; vertical-align: middle;">
            <div style="display: flex; align-items: center; gap: 16px;">
              <div style="width: 74px; height: 74px; min-width: 74px; background-color: #0b4578; display: inline-flex; align-items: center; justify-content: center; padding: 6px; box-sizing: border-box;">
                <img src="https://app.com.mm/wp-content/uploads/2021/04/app-logo.png" alt="App.com.mm Logo" style="max-width: 100%; max-height: 100%; object-fit: contain; display: block;">
              </div>
              <div>
                <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 24pt; font-weight: 550; color: #111827; letter-spacing: -0.5px; line-height: 1.1; margin: 0;">App.com.mm</div>
                <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 13.5pt; color: #1f2937; margin-top: 4px; font-weight: 400;">Business IT Solution</div>
              </div>
            </div>
          </td>
          <td style="width: 46%; vertical-align: top; padding-left: 20px;">
            <div style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 9.8pt; color: #111827; line-height: 1.45;">
              <div>No.12, Min Nandar Main Road,</div>
              <div>Dawbon Tsp, Yangon</div>
              <div><a href="https://www.app.com.mm" target="_blank" style="color: #2563eb; text-decoration: underline;">www.app.com.mm</a>, <a href="mailto:info@app.com.mm" style="color: #2563eb; text-decoration: underline;">info@app.com.mm</a></div>
              <div>Hotline : +95 9 421 014 055</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Header Divider -->
      <div style="height: 2.5px; background-color: #4a7bb5; margin: 14px 0 24px 0;"></div>

      <!-- Main Title -->
      <div style="font-family: 'Pyidaungsu', 'Myanmar Text', 'Padauk', sans-serif; font-size: 25pt; font-weight: 700; color: #000000; margin: 22px 0 18px 0; line-height: 1.25; letter-spacing: -0.2px;">
        အစည်းအဝေး မှတ်တမ်း
      </div>

      <!-- 1. Meeting Info Box -->
      <div style="font-family: 'Pyidaungsu', 'Myanmar Text', 'Padauk', 'Segoe UI', sans-serif; font-size: 13.5pt; font-weight: 600; color: #4a729a; margin-top: 22px; margin-bottom: 10px;">
        ၁။ အစည်းအဝေး အချက်အလက် (Meeting Information)
      </div>
      <ul style="list-style-type: disc; padding-left: 22px; margin: 6px 0 16px 0;">
        <li style="margin-bottom: 4px; color: #000000;">Project: ${escapeHtml(info.project || "")}</li>
        <li style="margin-bottom: 4px; color: #000000;">Meeting Type: ${escapeHtml(info.meeting_type || "")}</li>
        <li style="margin-bottom: 4px; color: #000000;">Date: ${escapeHtml(info.date || "")}</li>
        <li style="margin-top: 14px; margin-bottom: 4px; color: #000000;">Prepared By: ${escapeHtml(info.prepared_by || "App.com.mm")}</li>
      </ul>

      <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 22px 0 16px 0;">

      <!-- 2. Attendees -->
      <div style="font-family: 'Pyidaungsu', 'Myanmar Text', 'Padauk', 'Segoe UI', sans-serif; font-size: 13.5pt; font-weight: 600; color: #4a729a; margin-top: 22px; margin-bottom: 10px;">
        ၂။ တက်ရောက်သူများ (Attendees)
      </div>
      ${renderList(m.attendees)}

      <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 22px 0 16px 0;">

      <!-- 3. Purpose -->
      <div style="font-family: 'Pyidaungsu', 'Myanmar Text', 'Padauk', 'Segoe UI', sans-serif; font-size: 13.5pt; font-weight: 600; color: #4a729a; margin-top: 22px; margin-bottom: 10px;">
        ၃။ ရည်ရွယ်ချက် (Purpose)
      </div>
      ${renderList(m.purpose)}

      <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 22px 0 16px 0;">

      <!-- 4. Discussions -->
      <div style="font-family: 'Pyidaungsu', 'Myanmar Text', 'Padauk', 'Segoe UI', sans-serif; font-size: 13.5pt; font-weight: 600; color: #4a729a; margin-top: 22px; margin-bottom: 10px;">
        ၄။ ဆွေးနွေးချက်များ (Discussion Points)
      </div>
      ${renderList(m.discussion_points)}

      <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 22px 0 16px 0;">

      <!-- 5. Decisions -->
      <div style="font-family: 'Pyidaungsu', 'Myanmar Text', 'Padauk', 'Segoe UI', sans-serif; font-size: 13.5pt; font-weight: 600; color: #4a729a; margin-top: 22px; margin-bottom: 10px;">
        ၅။ ဆုံးဖြတ်ချက်များ (Decisions)
      </div>
      ${renderList(m.decisions)}

      <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 22px 0 16px 0;">

      <!-- 6. Action Items -->
      <div style="font-family: 'Pyidaungsu', 'Myanmar Text', 'Padauk', 'Segoe UI', sans-serif; font-size: 13.5pt; font-weight: 600; color: #4a729a; margin-top: 22px; margin-bottom: 10px;">
        ၆။ လုပ်ဆောင်ရန်တာဝန်များ (Action Items)
      </div>
      ${actionsHtml}

      <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 22px 0 16px 0;">

      <!-- 7. Issues / Risks -->
      <div style="font-family: 'Pyidaungsu', 'Myanmar Text', 'Padauk', 'Segoe UI', sans-serif; font-size: 13.5pt; font-weight: 600; color: #4a729a; margin-top: 22px; margin-bottom: 10px;">
        ၇။ ပြဿနာ / အန္တရာယ်များ (Issues / Risks)
      </div>
      ${renderList(m.issues_risks)}

      <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 22px 0 16px 0;">

      <!-- 8. Pending Clarifications -->
      <div style="font-family: 'Pyidaungsu', 'Myanmar Text', 'Padauk', 'Segoe UI', sans-serif; font-size: 13.5pt; font-weight: 600; color: #4a729a; margin-top: 22px; margin-bottom: 10px;">
        ၈။ အတည်ပြုရန်လိုအပ်ချက်များ (Pending Clarifications)
      </div>
      ${renderList(m.pending_clarifications)}

      <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 22px 0 16px 0;">

      <!-- 9. Next Meeting -->
      <div style="font-family: 'Pyidaungsu', 'Myanmar Text', 'Padauk', 'Segoe UI', sans-serif; font-size: 13.5pt; font-weight: 600; color: #4a729a; margin-top: 22px; margin-bottom: 10px;">
        ၉။ နောက်အစည်းအဝေး (Next Meeting)
      </div>
      <ul style="list-style-type: disc; padding-left: 22px; margin: 6px 0 16px 0;">
        <li style="margin-bottom: 4px; color: #000000;">Agenda: ${escapeHtml(m.next_meeting?.agenda || "မဖော်ပြထားပါ")}</li>
        <li style="margin-bottom: 4px; color: #000000;">Date: ${escapeHtml(m.next_meeting?.date || "မဖော်ပြထားပါ")}</li>
      </ul>

      <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 22px 0 16px 0;">

      <!-- 10. Additional Notes -->
      <div style="font-family: 'Pyidaungsu', 'Myanmar Text', 'Padauk', 'Segoe UI', sans-serif; font-size: 13.5pt; font-weight: 600; color: #4a729a; margin-top: 22px; margin-bottom: 10px;">
        ၁၀။ အခြားမှတ်ချက်များ (Additional Notes)
      </div>
      ${renderList(m.additional_notes)}

      <!-- Bottom Quick Actions inside preview -->
      <div style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 18px; border-top: 1px solid #e2e8f0; margin-top: 20px;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="showEditMode()">
          ✏️ Edit This Minute (ပြင်ဆင်မည်)
        </button>
        <a href="${downloadUrl}" class="btn btn-primary btn-sm" download style="background: #16a34a; border-color: #16a34a;">
          📥 Download PDF Directly
        </a>
      </div>
    `;
  }

  function populateMinuteModal(m) {
    const previewContainer = document.getElementById("minute-preview-container");
    if (previewContainer) {
      previewContainer.innerHTML = renderMinuteDocumentPreview(m);
    }

    const downloadLink = document.getElementById("btn-modal-direct-download");
    if (downloadLink) {
      downloadLink.href = `/api/meeting-minutes/${m.id}/download-pdf`;
    }

    // Populate edit form
    const info = m.meeting_info || {};
    document.getElementById("edit-minute-id").value = m.id || "";
    document.getElementById("edit-min-project").value = info.project || "";
    document.getElementById("edit-min-date").value = info.date || "";
    document.getElementById("edit-min-type").value = info.meeting_type || "";
    document.getElementById("edit-min-prepared").value = info.prepared_by || "App.com.mm";

    document.getElementById("edit-min-attendees").value = (m.attendees || []).join("\n");
    document.getElementById("edit-min-purpose").value = (m.purpose || []).join("\n");
    document.getElementById("edit-min-discussions").value = (m.discussion_points || []).join("\n");
    document.getElementById("edit-min-decisions").value = (m.decisions || []).join("\n");

    let uiItems = [];
    let devItems = [];
    if (m.action_items_grouped && m.action_items_grouped.length > 0) {
      const uiGroup = m.action_items_grouped.find(g => (g.team || "").toLowerCase().includes("ui"));
      const devGroup = m.action_items_grouped.find(g => (g.team || "").toLowerCase().includes("dev"));
      if (uiGroup && uiGroup.items) uiItems = uiGroup.items;
      if (devGroup && devGroup.items) devItems = devGroup.items;
    } else if (m.action_items && m.action_items.length > 0) {
      devItems = m.action_items;
    }

    document.getElementById("edit-min-actions-ui").value = uiItems.join("\n");
    document.getElementById("edit-min-actions-dev").value = devItems.join("\n");
    document.getElementById("edit-min-issues").value = (m.issues_risks || []).join("\n");

    const clarifications = (m.pending_clarifications || []).map(c => {
      if (typeof c === 'string') return c;
      if (c && c.topic) {
        if (c.sub_items && c.sub_items.length > 0) {
          return `${c.topic}: ${c.sub_items.join(", ")}`;
        }
        return c.topic;
      }
      return JSON.stringify(c);
    }).join("\n");
    document.getElementById("edit-min-clarifications").value = clarifications;

    document.getElementById("edit-min-next-agenda").value = m.next_meeting?.agenda || "";
    document.getElementById("edit-min-next-date").value = m.next_meeting?.date || "";
    document.getElementById("edit-min-notes").value = (m.additional_notes || []).join("\n");
  }

  const previewContainer = document.getElementById("minute-preview-container");
  const minuteEditForm = document.getElementById("minute-edit-form");
  const btnShowPreview = document.getElementById("btn-show-preview-mode");
  const btnShowEdit = document.getElementById("btn-show-edit-mode");

  window.showPreviewMode = function() {
    if (previewContainer) previewContainer.classList.remove("hidden");
    if (minuteEditForm) minuteEditForm.classList.add("hidden");
    if (btnShowPreview) {
      btnShowPreview.classList.add("btn-primary");
      btnShowPreview.classList.remove("btn-secondary");
    }
    if (btnShowEdit) {
      btnShowEdit.classList.remove("btn-primary");
      btnShowEdit.classList.add("btn-secondary");
    }
  };

  window.showEditMode = function() {
    if (previewContainer) previewContainer.classList.add("hidden");
    if (minuteEditForm) minuteEditForm.classList.remove("hidden");
    if (btnShowEdit) {
      btnShowEdit.classList.add("btn-primary");
      btnShowEdit.classList.remove("btn-secondary");
    }
    if (btnShowPreview) {
      btnShowPreview.classList.remove("btn-primary");
      btnShowPreview.classList.add("btn-secondary");
    }
  };

  if (btnShowPreview) btnShowPreview.addEventListener("click", window.showPreviewMode);
  if (btnShowEdit) btnShowEdit.addEventListener("click", window.showEditMode);

  window.openMinuteDetailModal = async function(id) {
    let m = minutesCache.find(item => item.id === id);
    if (!m) {
      try {
        const res = await fetch("/api/meeting-minutes");
        minutesCache = await res.json();
        m = minutesCache.find(item => item.id === id);
      } catch (e) {
        console.error(e);
      }
    }
    if (!m) {
      alert("အစည်းအဝေး မှတ်တမ်း မတွေ့ရှိပါ");
      return;
    }

    populateMinuteModal(m);
    showPreviewMode();

    const modal = document.getElementById("minute-edit-modal");
    if (modal) modal.classList.remove("hidden");
  };

  // Close handlers
  const minuteModal = document.getElementById("minute-edit-modal");
  const btnCloseMinuteModal = document.getElementById("btn-close-minute-modal");
  const btnCancelMinuteEdit = document.getElementById("btn-cancel-minute-edit");
  const minuteModalBackdrop = document.getElementById("minute-modal-backdrop");

  const closeMinuteModal = () => {
    if (minuteModal) minuteModal.classList.add("hidden");
  };

  if (btnCloseMinuteModal) btnCloseMinuteModal.addEventListener("click", closeMinuteModal);
  if (btnCancelMinuteEdit) btnCancelMinuteEdit.addEventListener("click", closeMinuteModal);
  if (minuteModalBackdrop) minuteModalBackdrop.addEventListener("click", closeMinuteModal);

  const btnModalDeleteMinute = document.getElementById("btn-modal-delete-minute");
  const btnModalDeleteMinuteBottom = document.getElementById("btn-modal-delete-minute-bottom");
  const handleDeleteFromModal = () => {
    const id = document.getElementById("edit-minute-id")?.value;
    if (id) {
      window.deleteMeetingMinute(id);
    }
  };
  if (btnModalDeleteMinute) btnModalDeleteMinute.addEventListener("click", handleDeleteFromModal);
  if (btnModalDeleteMinuteBottom) btnModalDeleteMinuteBottom.addEventListener("click", handleDeleteFromModal);

  const btnModalCopyText = document.getElementById("btn-modal-copy-text");
  if (btnModalCopyText) {
    btnModalCopyText.addEventListener("click", () => {
      const id = document.getElementById("edit-minute-id")?.value;
      if (id) {
        window.copyMinuteNumberedText(id);
      }
    });
  }

  const btnClearAllMinutes = document.getElementById("btn-clear-all-minutes");
  if (btnClearAllMinutes) btnClearAllMinutes.addEventListener("click", window.clearAllMeetingMinutes);

  // Edit form submit
  if (minuteEditForm) {
    minuteEditForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("edit-minute-id").value;
      const parseLines = (val) => (val || "").split("\n").map(s => s.trim()).filter(Boolean);

      const uiItems = parseLines(document.getElementById("edit-min-actions-ui").value);
      const devItems = parseLines(document.getElementById("edit-min-actions-dev").value);
      const action_items_grouped = [];
      if (uiItems.length > 0) action_items_grouped.push({ team: "UI/UX Team", items: uiItems });
      if (devItems.length > 0) action_items_grouped.push({ team: "Dev Team", items: devItems });

      const updated = {
        id: id,
        meeting_info: {
          project: document.getElementById("edit-min-project").value.trim(),
          date: document.getElementById("edit-min-date").value.trim(),
          meeting_type: document.getElementById("edit-min-type").value.trim(),
          prepared_by: document.getElementById("edit-min-prepared").value.trim() || "App.com.mm"
        },
        attendees: parseLines(document.getElementById("edit-min-attendees").value),
        purpose: parseLines(document.getElementById("edit-min-purpose").value),
        discussion_points: parseLines(document.getElementById("edit-min-discussions").value),
        decisions: parseLines(document.getElementById("edit-min-decisions").value),
        action_items_grouped: action_items_grouped,
        issues_risks: parseLines(document.getElementById("edit-min-issues").value),
        pending_clarifications: parseLines(document.getElementById("edit-min-clarifications").value),
        next_meeting: {
          agenda: document.getElementById("edit-min-next-agenda").value.trim(),
          date: document.getElementById("edit-min-next-date").value.trim()
        },
        additional_notes: parseLines(document.getElementById("edit-min-notes").value)
      };

      const btnSave = document.getElementById("btn-save-minute-changes");
      const originalText = btnSave.innerText;
      btnSave.disabled = true;
      btnSave.innerText = "⏳ Saving & Re-generating PDF...";

      try {
        const res = await fetch(`/api/meeting-minutes/${id}/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        });
        const data = await res.json();
        btnSave.disabled = false;
        btnSave.innerText = originalText;

        if (res.ok) {
          alert("✅ အောင်မြင်စွာ ပြင်ဆင်သိမ်းဆည်းပြီး PDF ကို အသစ်ထုတ်ပေးလိုက်ပါပြီ!");
          await loadMeetingMinutes();
          const fresh = minutesCache.find(x => x.id === id) || updated;
          populateMinuteModal(fresh);
          showPreviewMode();
        } else {
          alert("Update failed: " + (data.detail || "Error"));
        }
      } catch (err) {
        btnSave.disabled = false;
        btnSave.innerText = originalText;
        alert("Update error: " + err.message);
      }
    });
  }

  let transcribeAbortCtrl = null;
  let transcribeProgressInterval = null;

  function updateTranscribeProgress(pct, statusText, activeStep) {
    const pctBadge = document.getElementById("minute-progress-pct");
    const fill = document.getElementById("minute-progress-fill");
    const status = document.getElementById("minute-loading-text");
    if (pctBadge) pctBadge.innerText = `${pct}%`;
    if (fill) fill.style.width = `${pct}%`;
    if (status) status.innerText = statusText;

    ["m-step-1", "m-step-2", "m-step-3", "m-step-4"].forEach((id, idx) => {
      const el = document.getElementById(id);
      if (el) {
        if (idx + 1 === activeStep) el.classList.add("active");
        else el.classList.remove("active");
      }
    });
  }

  function startTranscribeProgress() {
    minuteLoading.classList.remove("hidden");
    minuteLoading.classList.remove("error");
    document.getElementById("minute-loading-title").innerText = "Transcribing & Generating PDF...";
    let currentPct = 12;
    updateTranscribeProgress(12, "ဗီဒီယို/အသံဖိုင် စစ်ဆေးပြီး အသံဖိုင် ခွဲထုတ်နေပါသည်...", 1);

    transcribeProgressInterval = setInterval(() => {
      if (currentPct < 35) {
        currentPct += 6;
        updateTranscribeProgress(currentPct, "အသံဖိုင်ကို Gemini AI သို့ Upload ပေးပို့နေပါသည်...", 2);
      } else if (currentPct < 68) {
        currentPct += 4;
        updateTranscribeProgress(currentPct, "Gemini AI ဖြင့် စကားပြောသံများကို နားထောင်၍ Transcribe လုပ်နေပါသည်...", 3);
      } else if (currentPct < 88) {
        currentPct += 2;
        updateTranscribeProgress(currentPct, "အစည်းအဝေး မှတ်တမ်း အပိုင်း (၁၀) ပိုင်းအတိုင်း ဖွဲ့စည်းနေပါသည်...", 3);
      } else if (currentPct < 96) {
        currentPct += 1;
        updateTranscribeProgress(currentPct, "My Easy Job စံသတ်မှတ်ချက် PDF ဖိုင်သို့ Render ပြုလုပ်နေပါသည်...", 4);
      }
    }, 400);
  }

  function stopTranscribeProgress() {
    if (transcribeProgressInterval) {
      clearInterval(transcribeProgressInterval);
      transcribeProgressInterval = null;
    }
  }

  const btnCancelTranscribe = document.getElementById("btn-cancel-transcribe");
  if (btnCancelTranscribe) {
    btnCancelTranscribe.addEventListener("click", () => {
      if (transcribeAbortCtrl) {
        transcribeAbortCtrl.abort();
        transcribeAbortCtrl = null;
      }
      stopTranscribeProgress();
      minuteLoading.classList.add("error");
      updateTranscribeProgress(0, "⚠️ လုပ်ငန်းစဉ်ကို Cancel ပြုလုပ်လိုက်ပါသည် (Cancelled by user)", 0);
      document.getElementById("minute-loading-title").innerText = "Process Cancelled";
      setTimeout(() => {
        minuteLoading.classList.add("hidden");
        minuteLoading.classList.remove("error");
      }, 3500);
    });
  }

  btnQuickSample.addEventListener("click", async () => {
    transcribeAbortCtrl = new AbortController();
    startTranscribeProgress();
    try {
      const res = await fetch("/api/meeting-minutes/generate-sample-pdf", {
        method: "POST",
        signal: transcribeAbortCtrl.signal
      });
      const data = await res.json();
      stopTranscribeProgress();
      if (data.pdf_url) {
        updateTranscribeProgress(100, "✅ အစည်းအဝေးမှတ်တမ်း PDF အောင်မြင်စွာ ဖန်တီးပြီးပါပြီ!", 4);
        setTimeout(() => minuteLoading.classList.add("hidden"), 1200);
        triggerDirectDownload("/api/meeting-minutes/sample/download-pdf");
        await loadMeetingMinutes();
      }
    } catch (err) {
      stopTranscribeProgress();
      if (err.name === "AbortError") {
        console.log("Sample generate aborted");
      } else {
        minuteLoading.classList.add("error");
        updateTranscribeProgress(0, "Sample PDF generation failed: " + err.message, 0);
      }
    }
  });

  transcribeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const projName = document.getElementById("minute-project").value;
    const meetDate = document.getElementById("minute-date").value;
    const fileInput = document.getElementById("minute-file");
    const notes = document.getElementById("minute-text").value;

    const formData = new FormData();
    formData.append("project_name", projName);
    formData.append("meeting_date", meetDate);
    if (notes) formData.append("transcript_text", notes);
    if (fileInput.files.length > 0) {
      formData.append("file", fileInput.files[0]);
    }

    const currentApiKey = document.getElementById("cfg-gemini-key")?.value?.trim();
    if (currentApiKey) {
      formData.append("gemini_api_key", currentApiKey);
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem("app_suite_config_v1") || "{}");
        if (stored.gemini_api_key) formData.append("gemini_api_key", stored.gemini_api_key);
      } catch (e) {}
    }

    transcribeAbortCtrl = new AbortController();
    startTranscribeProgress();

    try {
      const res = await fetch("/api/meeting-minutes/upload-and-transcribe", {
        method: "POST",
        body: formData,
        signal: transcribeAbortCtrl.signal
      });
      const data = await res.json();
      stopTranscribeProgress();
      if (data.status === "success") {
        updateTranscribeProgress(100, "✅ အစည်းအဝေးမှတ်တမ်း PDF အောင်မြင်စွာ ထုတ်ယူပြီးပါပြီ!", 4);
        setTimeout(() => minuteLoading.classList.add("hidden"), 1500);
        const dlUrl = data.download_url || (data.minute ? `/api/meeting-minutes/${data.minute.id}/download-pdf` : data.pdf_url);
        triggerDirectDownload(dlUrl);
        await loadMeetingMinutes();
      } else {
        minuteLoading.classList.add("error");
        updateTranscribeProgress(0, "Transcribe failed: " + (data.detail || "Error"), 0);
      }
    } catch (err) {
      stopTranscribeProgress();
      if (err.name === "AbortError") {
        console.log("Transcribe aborted by user");
      } else {
        minuteLoading.classList.add("error");
        updateTranscribeProgress(0, "Error: " + err.message, 0);
      }
    }
  });

  // ================= 2. DAILY WORK REPORTS =================
  const dailyReportForm = document.getElementById("daily-report-form");
  const reportPreviewBox = document.getElementById("report-preview-box");
  const workItemsContainer = document.getElementById("work-items-container");
  const btnAddWorkItem = document.getElementById("btn-add-work-item");
  const btnCopyDailyText = document.getElementById("btn-copy-daily-text");

  let workItemCount = 1;

  if (btnAddWorkItem) {
    btnAddWorkItem.addEventListener("click", () => {
      workItemCount++;
      const itemDiv = document.createElement("div");
      itemDiv.className = "work-input-item card";
      itemDiv.style = "background: #f8fafc; padding: 14px; margin-bottom: 12px; position: relative;";
      itemDiv.innerHTML = `
        <button type="button" style="position: absolute; right: 10px; top: 10px; background: none; border: none; font-size: 16px; cursor: pointer;" onclick="this.parentElement.remove()">❌</button>
        <div class="form-group">
          <label>${workItemCount}. Project</label>
          <input type="text" class="work-proj" placeholder="Project name..." required>
        </div>
        <div class="form-group">
          <label>Task</label>
          <input type="text" class="work-task" placeholder="Task description..." required>
        </div>
        <div class="form-row">
          <div class="form-group col">
            <label>Status</label>
            <select class="work-status">
              <option value="Done">Done</option>
              <option value="In Progress" selected>In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>
          <div class="form-group col">
            <label>Meeting Minute Reference</label>
            <input type="text" class="work-ref" value="Shane ( Meeting Minute )" placeholder="Shane ( Meeting Minute )">
          </div>
        </div>
        <div class="form-group">
          <label>Remark</label>
          <input type="text" class="work-remark" placeholder="Remark...">
        </div>
        <div class="form-group">
          <label>Tomorrow Plan</label>
          <input type="text" class="work-plan" placeholder="Tomorrow plan...">
        </div>
      `;
      workItemsContainer.appendChild(itemDiv);
    });
  }

  function getDailyWorkReportPayload() {
    const workCards = document.querySelectorAll(".work-input-item");
    const work_details = [];

    workCards.forEach(card => {
      const proj = card.querySelector(".work-proj")?.value || "";
      const task = card.querySelector(".work-task")?.value || "";
      const status = card.querySelector(".work-status")?.value || "In Progress";
      const remark = card.querySelector(".work-remark")?.value || "";
      const plan = card.querySelector(".work-plan")?.value || "";
      const ref = card.querySelector(".work-ref")?.value || "";

      if (proj || task) {
        work_details.push({
          project: proj,
          task: task,
          status: status,
          remark: remark,
          tomorrow_plan: plan,
          meeting_minute_ref: ref
        });
      }
    });

    return {
      name: document.getElementById("dwr-name").value,
      department: document.getElementById("dwr-dept").value,
      position: document.getElementById("dwr-position").value,
      date: document.getElementById("dwr-date").value,
      report_type: document.getElementById("dwr-type").value,
      work_details: work_details
    };
  }

  let reportAbortCtrl = null;
  let reportProgressInterval = null;

  function updateReportProgress(pct, statusText) {
    const pctBadge = document.getElementById("report-progress-pct");
    const fill = document.getElementById("report-progress-fill");
    const status = document.getElementById("report-loading-text");
    if (pctBadge) pctBadge.innerText = `${pct}%`;
    if (fill) fill.style.width = `${pct}%`;
    if (status) status.innerText = statusText;
  }

  function startReportProgress() {
    const reportLoading = document.getElementById("report-loading");
    if (!reportLoading) return;
    reportLoading.classList.remove("hidden");
    reportLoading.classList.remove("error");
    let currentPct = 20;
    updateReportProgress(20, "အစီရင်ခံစာ အချက်အလက်များ စုစည်းနေပါသည်...");

    reportProgressInterval = setInterval(() => {
      if (currentPct < 75) {
        currentPct += 15;
        updateReportProgress(currentPct, "DAILY WORK REPORT HTML template ဖွဲ့စည်းနေပါသည်...");
      } else if (currentPct < 95) {
        currentPct += 5;
        updateReportProgress(currentPct, "My Easy Job PDF အဖြစ် Print ထုတ်ယူနေပါသည်...");
      }
    }, 300);
  }

  function stopReportProgress() {
    if (reportProgressInterval) {
      clearInterval(reportProgressInterval);
      reportProgressInterval = null;
    }
  }

  const btnCancelReport = document.getElementById("btn-cancel-report");
  if (btnCancelReport) {
    btnCancelReport.addEventListener("click", () => {
      if (reportAbortCtrl) {
        reportAbortCtrl.abort();
        reportAbortCtrl = null;
      }
      stopReportProgress();
      const reportLoading = document.getElementById("report-loading");
      if (reportLoading) {
        reportLoading.classList.add("error");
        updateReportProgress(0, "⚠️ လုပ်ငန်းစဉ်ကို Cancel ပြုလုပ်လိုက်ပါသည် (Cancelled by user)");
        setTimeout(() => {
          reportLoading.classList.add("hidden");
          reportLoading.classList.remove("error");
        }, 3000);
      }
    });
  }

  function formatDailyReportAsNumberedText(p, numStyle = "myanmar") {
    const isMm = (numStyle === "myanmar");
    const toNum = (n) => isMm ? toBurmeseNumerals(n) : String(n);

    const headerBorder = "============================================================";
    const subBorder = "------------------------------------------------------------";

    const lines = [
      headerBorder,
      `📋 DAILY WORK REPORT (နေ့စဉ် အလုပ်လုပ်ငန်း အစီရင်ခံစာ)`,
      headerBorder,
      "",
      `${isMm ? "၁" : "1"}။ အစီရင်ခံသူ အချက်အလက် (Reporter Profile):`,
      `   • အမည် (Name): ${p.name || "-"}`,
      `   • ဌာန (Department): ${p.department || "-"}`,
      `   • ရာထူး (Position): ${p.position || "-"}`,
      `   • ရက်စွဲ (Date): ${p.date || "-"}`,
      `   • အစီရင်ခံစာ အမျိုးအစား: ${p.report_type || "Daily Report"}`,
      "",
      headerBorder,
      `${isMm ? "၂" : "2"}။ လုပ်ငန်းဆောင်ရွက်ချက်များ (Work Details - နံပါတ်စဉ်အလိုက်):`,
      headerBorder,
      ""
    ];

    if (!p.work_details || p.work_details.length === 0) {
      lines.push("   (ဆောင်ရွက်ချက် မရှိသေးပါ / No work items entered)");
    } else {
      p.work_details.forEach((item, idx) => {
        const itemNum = toNum(idx + 1);
        const prefix = isMm ? `(${itemNum})` : `${itemNum}.`;
        lines.push(`${prefix} ပရောဂျက် (Project): ${item.project || "General"}`);
        lines.push(`    • လုပ်ဆောင်ချက် (Task): ${item.task || "-"}`);
        lines.push(`    • အခြေအနေ (Status): [ ${item.status || "In Progress"} ]`);
        if (item.meeting_minute_ref) {
          lines.push(`    • အစည်းအဝေး ကိုးကား (Meeting Ref): ${item.meeting_minute_ref}`);
        }
        if (item.remark) {
          lines.push(`    • မှတ်ချက် (Remark): ${item.remark}`);
        }
        if (item.tomorrow_plan) {
          lines.push(`    • မနက်ဖြန် အစီအစဉ် (Tomorrow Plan): ${item.tomorrow_plan}`);
        }
        lines.push("");
      });
    }

    lines.push(subBorder);
    lines.push(`${isMm ? "၃" : "3"}။ အကျဉ်းချုပ် (Work Summary):`);
    lines.push(`   • စုစုပေါင်း လုပ်ငန်းတာဝန် (Total Tasks): ${toNum((p.work_details || []).length)} ခု`);
    const doneCount = (p.work_details || []).filter(w => w.status === "Done").length;
    const inProgCount = (p.work_details || []).filter(w => w.status === "In Progress").length;
    lines.push(`   • ပြီးစီးပြီး (Done): ${toNum(doneCount)} ခု`);
    lines.push(`   • လုပ်ဆောင်ဆဲ (In Progress): ${toNum(inProgCount)} ခု`);
    lines.push(headerBorder);

    return lines.join("\n");
  }

  function renderActiveNumberedReportText(autoCopy = false) {
    const textOutput = document.getElementById("report-text-output");
    if (!textOutput) return "";
    const payload = getDailyWorkReportPayload();
    const styleRadio = document.querySelector('input[name="report-num-style"]:checked');
    const numStyle = styleRadio ? styleRadio.value : "myanmar";

    const formatted = formatDailyReportAsNumberedText(payload, numStyle);
    textOutput.value = formatted;

    if (autoCopy) {
      navigator.clipboard.writeText(formatted).then(() => {
        showReportCopySuccess();
      }).catch(err => {
        console.warn("Clipboard copy failed", err);
      });
    }

    return formatted;
  }

  function showReportCopySuccess() {
    const statusEl = document.getElementById("report-copy-status");
    if (statusEl) {
      statusEl.style.display = "inline";
      setTimeout(() => {
        statusEl.style.display = "none";
      }, 3000);
    }
  }

  // Radio listener for numbering style
  document.querySelectorAll('input[name="report-num-style"]').forEach(radio => {
    radio.addEventListener("change", () => {
      renderActiveNumberedReportText(false);
    });
  });

  // Daily report submit -> Primary action: Generate Numbered Text & Copy into Review
  if (dailyReportForm) {
    dailyReportForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = renderActiveNumberedReportText(true);
      const previewBox = document.getElementById("report-preview-box");
      if (previewBox) {
        previewBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
      alert("✅ Daily Work Report ကို Text အနေဖြင့် Review တွင် အောင်မြင်စွာ ထုတ်ပေးပြီးပါပြီ!\n(Clipboard သို့လည်း တစ်ခါတည်း ကူးယူပြီးဖြစ်၍ Telegram / Viber သို့ တိုက်ရိုက် Paste ချနိုင်ပါသည်)");
    });
  }

  // Copy Preview Text button (Top)
  const btnCopyPreviewText = document.getElementById("btn-copy-preview-text");
  if (btnCopyPreviewText) {
    btnCopyPreviewText.addEventListener("click", () => {
      const textOutput = document.getElementById("report-text-output");
      if (!textOutput || !textOutput.value) {
        renderActiveNumberedReportText(false);
      }
      const text = textOutput ? textOutput.value : "";
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          showReportCopySuccess();
          alert("✅ Report စာသားကို Clipboard သို့ အောင်မြင်စွာ ကူးယူပြီးပါပြီ!");
        }).catch(err => {
          alert("Copy failed: " + err.message);
        });
      }
    });
  }

  // Copy Preview Text button (Bottom prominent)
  const btnCopyBottomText = document.getElementById("btn-copy-bottom-text");
  if (btnCopyBottomText) {
    btnCopyBottomText.addEventListener("click", () => {
      const textOutput = document.getElementById("report-text-output");
      if (!textOutput || !textOutput.value) {
        renderActiveNumberedReportText(false);
      }
      const text = textOutput ? textOutput.value : "";
      if (text) {
        navigator.clipboard.writeText(text).then(() => {
          showReportCopySuccess();
          alert("✅ Report စာသားကို Clipboard သို့ အောင်မြင်စွာ ကူးယူပြီးပါပြီ!\n(Telegram, Viber စသည်တို့တွင် တိုက်ရိုက် Paste ချနိုင်ပါသည်)");
        }).catch(err => {
          alert("Copy failed: " + err.message);
        });
      }
    });
  }

  // Download .txt file button
  const btnDownloadPreviewTxt = document.getElementById("btn-download-preview-txt");
  if (btnDownloadPreviewTxt) {
    btnDownloadPreviewTxt.addEventListener("click", () => {
      const textOutput = document.getElementById("report-text-output");
      if (!textOutput || !textOutput.value) {
        renderActiveNumberedReportText(false);
      }
      const text = textOutput ? textOutput.value : "";
      if (text) {
        const payload = getDailyWorkReportPayload();
        const safeName = (payload.name || "User").replace(/\s+/g, "_");
        const safeDate = (payload.date || "Report").replace(/[\/\\]/g, "-");
        downloadTextFile(`Daily_Work_Report_${safeName}_${safeDate}.txt`, text);
      }
    });
  }

  // Optional: Generate PDF button
  const btnGenerateDailyPdf = document.getElementById("btn-generate-daily-pdf");
  if (btnGenerateDailyPdf) {
    btnGenerateDailyPdf.addEventListener("click", async () => {
      const payload = getDailyWorkReportPayload();
      reportAbortCtrl = new AbortController();
      startReportProgress();

      try {
        const res = await fetch("/api/reports/daily-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: reportAbortCtrl.signal
        });
        const data = await res.json();
        stopReportProgress();

        if (data.pdf_url) {
          updateReportProgress(100, "✅ DAILY WORK REPORT PDF အောင်မြင်စွာ ထုတ်ယူပြီးပါပြီ!");
          const reportLoading = document.getElementById("report-loading");
          setTimeout(() => {
            if (reportLoading) reportLoading.classList.add("hidden");
          }, 1200);

          const dlUrl = data.download_url || (data.filename ? `/api/reports/download-pdf/${data.filename}` : data.pdf_url);
          triggerDirectDownload(dlUrl);
          alert("✅ Daily Report PDF ဒေါင်းလုဒ်လုပ်နေပါသည်...");
        }
      } catch (err) {
        stopReportProgress();
        if (err.name === "AbortError") {
          console.log("Daily report generate aborted by user");
        } else {
          const reportLoading = document.getElementById("report-loading");
          if (reportLoading) {
            reportLoading.classList.add("error");
            updateReportProgress(0, "Error: " + err.message);
          }
        }
      }
    });
  }

  // ================= 3. WARNINGS & PROJECTS =================
  const projectsTableBody = document.getElementById("projects-table-body");
  const warningBannersContainer = document.getElementById("warning-banners-container");
  const btnOpenAddProj = document.getElementById("btn-open-add-proj");
  const btnDispatchAlerts = document.getElementById("btn-dispatch-alerts");
  const projectModal = document.getElementById("project-modal");
  const btnCloseModal = document.getElementById("btn-close-modal");
  const btnCancelModal = document.getElementById("btn-cancel-modal");
  const projectForm = document.getElementById("project-form");

  async function loadWarningsAndProjects() {
    try {
      const [warnRes, projRes] = await fetchAll([
        fetch("/api/warnings"),
        fetch("/api/projects")
      ]);
      const warnings = await warnRes.json();
      const projects = await projRes.json();
      projectsCache = projects;

      // Update KPI counters
      document.getElementById("kpi-overdue-count").innerText = warnings.overdue_count || 0;
      document.getElementById("kpi-imminent-count").innerText = warnings.imminent_count || 0;
      document.getElementById("kpi-start-count").innerText = warnings.starting_soon_count || 0;

      // Render Banners
      renderWarningBanners(warnings);

      // Render Projects Table
      renderProjectsTable(projects);

      // Populate Report select
      reportProjSelect.innerHTML = projects.map(p => `
        <option value="${p.id}">${p.name} (${p.deadline})</option>
      `).join("");
    } catch (err) {
      console.error("Failed to load warnings/projects", err);
    }
  }

  function fetchAll(promises) {
    return Promise.all(promises);
  }

  function renderWarningBanners(warnings) {
    let html = "";
    if (warnings.overdue_count > 0) {
      html += `
        <div class="banner-card danger">
          <div>
            <strong>🚨 ရက်လွန် ပရောဂျက် သတိပေးချက် (${warnings.overdue_count} ခု Overdue ဖြစ်နေပါသည်)</strong>
            <p style="font-size: 13px; margin-top: 3px;">
              ${warnings.overdue_projects.map(p => `<b>${p.project_name}</b> (${p.deadline})`).join(", ")}
            </p>
          </div>
          <button class="btn btn-sm btn-primary" onclick="dispatchAlertsNow()">သတိပေးချက် ပို့မည်</button>
        </div>
      `;
    }
    if (warnings.imminent_count > 0) {
      html += `
        <div class="banner-card warning">
          <div>
            <strong>⚠️ Deadline နီးကပ်နေသော ပရောဂျက်များ (${warnings.imminent_count} ခု ကျန်ရှိပါသည်)</strong>
            <p style="font-size: 13px; margin-top: 3px;">
              ${warnings.imminent_projects.map(p => `<b>${p.project_name}</b>: ${p.alert_message}`).join(", ")}
            </p>
          </div>
        </div>
      `;
    }
    if (warnings.starting_soon_count > 0) {
      html += `
        <div class="banner-card info">
          <div>
            <strong>ℹ️ မကြာမီ စတင်တော့မည့် ပရောဂျက်များ (${warnings.starting_soon_count} ခု)</strong>
            <p style="font-size: 13px; margin-top: 3px;">
              ${warnings.starting_soon_projects.map(p => `<b>${p.project_name}</b> (Starts: ${p.start_date})`).join(", ")}
            </p>
          </div>
        </div>
      `;
    }
    warningBannersContainer.innerHTML = html;
  }

  function renderProjectsTable(projects) {
    if (!projects || projects.length === 0) {
      projectsTableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; color: #64748b; padding: 36px 16px;">
            <p style="font-size: 14px; margin-bottom: 10px; color: #475569;">📭 သတ်မှတ်ထားသော ပရောဂျက် / Deadline များ မရှိသေးပါ (No Projects or Deadlines)</p>
            <div style="display: flex; gap: 8px; justify-content: center;">
              <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('btn-open-add-proj').click()">➕ ပရောဂျက် အသစ်ထည့်မည်</button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="restoreDefaultProjects()">🔄 Sample ပြန်ယူမည်</button>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    projectsTableBody.innerHTML = projects.map(p => {
      const a = p.analysis || {};
      let badgeClass = "info";
      if (a.warning_level === "danger") badgeClass = "danger";
      else if (a.warning_level === "warning") badgeClass = "warning";
      else if (a.warning_level === "success") badgeClass = "success";

      return `
        <tr>
          <td>
            <strong>${escapeHtml(p.name)}</strong><br>
            <small style="color: #64748b;">${escapeHtml(p.description || "")}</small>
          </td>
          <td>${escapeHtml(p.client || "-")}</td>
          <td>${escapeHtml(p.start_date || "-")}</td>
          <td><strong>${escapeHtml(p.deadline || "-")}</strong></td>
          <td>
            <span class="badge ${badgeClass}">${escapeHtml(a.alert_message || p.status)}</span>
          </td>
          <td>
            <div style="font-size: 12px; margin-bottom: 3px;">${p.progress_percentage || 0}%</div>
            <div style="background: #e2e8f0; height: 6px; border-radius: 999px; width: 80px; overflow: hidden;">
              <div style="background: var(--primary); height: 100%; width: ${p.progress_percentage || 0}%;"></div>
            </div>
          </td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="deleteProject('${p.id}')" title="ပရောဂျက်နှင့် Deadline ဖျက်ရန်">🗑️</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  window.deleteProject = async function(id) {
    if (!confirm("⚠️ ဤပရောဂျက်နှင့် သက်ဆိုင်ရာ Deadline ကို ဖျက်ပစ်ရန် သေချာပါသလား?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("✅ ပရောဂျက်နှင့် Deadline ကို အောင်မြင်စွာ ဖျက်ပြီးပါပြီ!");
        await loadWarningsAndProjects();
      } else {
        alert("Delete failed: " + (data.detail || "Error"));
      }
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  window.clearAllDeadlines = async function() {
    if (!confirm("⚠️ သတိပေးချက်: စာရင်းသွင်းထားသော ပရောဂျက်များနှင့် Deadline အားလုံးကို အပြီးတိုင် ရှင်းလင်း/ဖျက်ပစ်ရန် သေချာပါသလား?\n(ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍ မရပါ)")) return;
    try {
      const res = await fetch("/api/projects/clear-all", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert("✅ " + (data.message || "ပရောဂျက်များနှင့် Deadline အားလုံးကို ရှင်းလင်းပြီးပါပြီ"));
        await loadWarningsAndProjects();
      } else {
        alert("Clear failed: " + (data.detail || "Error"));
      }
    } catch (err) {
      alert("Clear error: " + err.message);
    }
  };

  window.restoreDefaultProjects = async function() {
    if (!confirm("နမူနာ ပရောဂျက်များနှင့် Deadline များကို ပြန်လည် ထည့်သွင်းလိုပါသလား?")) return;
    try {
      const res = await fetch("/api/projects/restore-defaults", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        alert("✅ နမူနာ ပရောဂျက်များ အောင်မြင်စွာ ပြန်လည်ရယူပြီးပါပြီ!");
        await loadWarningsAndProjects();
      } else {
        alert("Restore failed: " + (data.detail || "Error"));
      }
    } catch (err) {
      alert("Restore error: " + err.message);
    }
  };

  window.dispatchAlertsNow = async function() {
    try {
      const res = await fetch("/api/warnings/dispatch", { method: "POST" });
      const data = await res.json();
      alert("Alert dispatch complete!\nTelegram: " + data.dispatch_results.telegram.message);
    } catch (err) {
      alert("Dispatch failed: " + err.message);
    }
  };

  btnDispatchAlerts.addEventListener("click", window.dispatchAlertsNow);

  // Modal open / close
  btnOpenAddProj.addEventListener("click", () => {
    projectForm.reset();
    projectModal.classList.remove("hidden");
  });
  btnCloseModal.addEventListener("click", () => projectModal.classList.add("hidden"));
  btnCancelModal.addEventListener("click", () => projectModal.classList.add("hidden"));

  projectForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const proj = {
      id: document.getElementById("proj-id").value,
      name: document.getElementById("proj-name").value,
      client: document.getElementById("proj-client").value,
      start_date: document.getElementById("proj-start-date").value,
      deadline: document.getElementById("proj-deadline").value,
      status: document.getElementById("proj-status").value,
      progress_percentage: parseInt(document.getElementById("proj-progress").value) || 0,
      description: document.getElementById("proj-desc").value
    };

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proj)
      });
      if (res.ok) {
        projectModal.classList.add("hidden");
        await loadWarningsAndProjects();
      } else {
        const err = await res.json();
        alert("Error: " + err.detail);
      }
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  });

  // ================= 4. SETTINGS & DATA MANAGEMENT =================
  const settingsForm = document.getElementById("settings-form");
  const btnTestTg = document.getElementById("btn-test-tg");
  const btnToggleKey = document.getElementById("btn-toggle-key-visibility");
  const SETTINGS_STORAGE_KEY = "app_suite_config_v1";

  function applyConfigToForm(cfg) {
    if (!cfg) return;
    const elKey = document.getElementById("cfg-gemini-key");
    const elTgTok = document.getElementById("cfg-tg-token");
    const elTgChat = document.getElementById("cfg-tg-chat");
    const elWebhook = document.getElementById("cfg-webhook-url");
    const elSmtpServer = document.getElementById("cfg-smtp-server");
    const elSmtpPort = document.getElementById("cfg-smtp-port");
    const elSmtpUser = document.getElementById("cfg-smtp-user");
    const elSmtpPass = document.getElementById("cfg-smtp-pass");
    const elRecipient = document.getElementById("cfg-recipient-email");

    if (elKey && cfg.gemini_api_key) elKey.value = cfg.gemini_api_key;
    if (elTgTok && cfg.telegram_bot_token) elTgTok.value = cfg.telegram_bot_token;
    if (elTgChat && cfg.telegram_chat_id) elTgChat.value = cfg.telegram_chat_id;
    if (elWebhook && cfg.webhook_url) elWebhook.value = cfg.webhook_url;
    if (elSmtpServer && cfg.smtp_server) elSmtpServer.value = cfg.smtp_server;
    if (elSmtpPort && cfg.smtp_port) elSmtpPort.value = cfg.smtp_port;
    if (elSmtpUser && cfg.smtp_user) elSmtpUser.value = cfg.smtp_user;
    if (elSmtpPass && cfg.smtp_password) elSmtpPass.value = cfg.smtp_password;
    if (elRecipient && cfg.alert_recipient_email) elRecipient.value = cfg.alert_recipient_email;
  }

  async function loadSettings() {
    // 1. Immediately restore from localStorage so inputs are populated without wait
    let localCfg = {};
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        localCfg = JSON.parse(stored);
        applyConfigToForm(localCfg);
      }
    } catch (e) {
      console.warn("Could not load local config cache", e);
    }

    // 2. Fetch from server API
    try {
      const res = await fetch("/api/config");
      const cfg = await res.json();
      const merged = {
        gemini_api_key: cfg.gemini_api_key || localCfg.gemini_api_key || "",
        telegram_bot_token: cfg.telegram_bot_token || localCfg.telegram_bot_token || "",
        telegram_chat_id: cfg.telegram_chat_id || localCfg.telegram_chat_id || "",
        webhook_url: cfg.webhook_url || localCfg.webhook_url || "",
        smtp_server: cfg.smtp_server || localCfg.smtp_server || "",
        smtp_port: cfg.smtp_port || localCfg.smtp_port || 587,
        smtp_user: cfg.smtp_user || localCfg.smtp_user || "",
        smtp_password: cfg.smtp_password || localCfg.smtp_password || "",
        alert_recipient_email: cfg.alert_recipient_email || localCfg.alert_recipient_email || ""
      };

      applyConfigToForm(merged);
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));

      // If server had missing keys but localStorage had them (e.g. server restart), sync silently
      if (localCfg.gemini_api_key && !cfg.gemini_api_key) {
        fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(merged)
        }).catch(e => console.warn("Background config sync failed", e));
      }
    } catch (err) {
      console.error("Config fetch error:", err);
    }
  }

  if (btnToggleKey) {
    btnToggleKey.addEventListener("click", () => {
      const keyInput = document.getElementById("cfg-gemini-key");
      if (keyInput) {
        if (keyInput.type === "password") {
          keyInput.type = "text";
          btnToggleKey.innerText = "🙈 Hide";
        } else {
          keyInput.type = "password";
          btnToggleKey.innerText = "👁️ Show";
        }
      }
    });
  }

  if (settingsForm) {
    settingsForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const payload = {
        gemini_api_key: document.getElementById("cfg-gemini-key")?.value?.trim() || "",
        telegram_bot_token: document.getElementById("cfg-tg-token")?.value?.trim() || "",
        telegram_chat_id: document.getElementById("cfg-tg-chat")?.value?.trim() || "",
        webhook_url: document.getElementById("cfg-webhook-url")?.value?.trim() || "",
        smtp_server: document.getElementById("cfg-smtp-server")?.value?.trim() || "",
        smtp_port: parseInt(document.getElementById("cfg-smtp-port")?.value) || 587,
        smtp_user: document.getElementById("cfg-smtp-user")?.value?.trim() || "",
        smtp_password: document.getElementById("cfg-smtp-pass")?.value?.trim() || "",
        alert_recipient_email: document.getElementById("cfg-recipient-email")?.value?.trim() || ""
      };

      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(payload));
      } catch (e) {
        console.warn("LocalStorage save error", e);
      }

      try {
        const res = await fetch("/api/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        alert("✅ Settings များကို Browser နှင့် Server ပေါ်တွင် အမြဲတမ်း သိမ်းဆည်းလိုက်ပါပြီ!\n(နောက်တစ်ကြိမ် Refresh ပြုလုပ်လည်း ပြန်ထည့်စရာမလိုတော့ပါ)");
      } catch (err) {
        alert("Save failed: " + err.message);
      }
    });
  }

  if (btnTestTg) {
    btnTestTg.addEventListener("click", async () => {
      try {
        const res = await fetch("/api/warnings/test-telegram", { method: "POST" });
        const data = await res.json();
        alert("Telegram Test: " + (data.message || JSON.stringify(data)));
      } catch (err) {
        alert("Test failed: " + err.message);
      }
    });
  }

  // ================= 5. PDF MANAGEMENT & DATA CLEAR =================
  async function loadGeneratedPdfList() {
    const listEl = document.getElementById("pdf-files-list");
    if (!listEl) return;
    try {
      const res = await fetch("/api/pdfs");
      const data = await res.json();
      const pdfs = data.pdfs || [];
      if (pdfs.length === 0) {
        listEl.innerHTML = `<p style="font-size: 12px; color: #94a3b8; text-align: center; padding: 12px 0;">PDF ဖိုင်များ မရှိသေးပါ (No PDF files found)</p>`;
        return;
      }
      listEl.innerHTML = pdfs.map(pdf => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 6px;">
          <div style="min-width: 0; flex: 1; margin-right: 10px;">
            <div style="font-size: 13px; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(pdf.filename)}">
              📄 ${escapeHtml(pdf.filename)}
            </div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;">
              ${pdf.size_kb} KB &nbsp;|&nbsp; ${escapeHtml(pdf.modified || "")}
            </div>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            <a href="${pdf.url}" class="btn btn-secondary btn-sm" download title="Download PDF" style="padding: 3px 8px; font-size: 12px;">📥</a>
            <button type="button" class="btn btn-danger btn-sm" onclick="deletePdfFile('${escapeHtml(pdf.filename)}')" title="Delete this PDF" style="padding: 3px 8px; font-size: 12px;">🗑️</button>
          </div>
        </div>
      `).join("");
    } catch (err) {
      console.error("Failed to load PDF list", err);
      listEl.innerHTML = `<p style="font-size: 12px; color: #ef4444; text-align: center;">PDF စာရင်းရယူ၍ မရပါ</p>`;
    }
  }

  window.deletePdfFile = async function(filename) {
    if (!confirm(`⚠️ PDF ဖိုင် "${filename}" ကို အပြီးတိုင် ဖျက်ပစ်ရန် သေချာပါသလား?`)) return;
    try {
      const res = await fetch(`/api/pdfs/${encodeURIComponent(filename)}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        alert("✅ PDF ဖိုင်ကို အောင်မြင်စွာ ဖျက်ပစ်လိုက်ပါပြီ!");
        await loadGeneratedPdfList();
        await loadMeetingMinutes();
      } else {
        alert("Delete failed: " + (data.detail || "Error"));
      }
    } catch (err) {
      alert("Delete error: " + err.message);
    }
  };

  const btnRefreshPdfs = document.getElementById("btn-refresh-pdfs");
  if (btnRefreshPdfs) btnRefreshPdfs.addEventListener("click", loadGeneratedPdfList);

  const btnClearAllPdfs = document.getElementById("btn-clear-all-pdfs");
  if (btnClearAllPdfs) {
    btnClearAllPdfs.addEventListener("click", async () => {
      if (!confirm("⚠️ ထွက်ရှိထားသော PDF ဖိုင်များအားလုံးကို အပြီးတိုင် ဖျက်ပစ်ရန် သေချာပါသလား?\n(ဤလုပ်ဆောင်ချက်ကို ပြန်ပြင်၍ မရပါ)")) return;
      try {
        const res = await fetch("/api/pdfs/clear-all", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          alert("✅ " + (data.message || "PDF ဖိုင်အားလုံးကို ရှင်းလင်းပြီးပါပြီ"));
          await loadGeneratedPdfList();
          await loadMeetingMinutes();
        } else {
          alert("Clear failed: " + (data.detail || "Error"));
        }
      } catch (err) {
        alert("Clear error: " + err.message);
      }
    });
  }

  const btnClearMinutesSettings = document.getElementById("btn-clear-minutes-settings");
  if (btnClearMinutesSettings) {
    btnClearMinutesSettings.addEventListener("click", window.clearAllMeetingMinutes);
  }

  // Clear Deadlines & Projects handlers
  const btnClearAllDeadlines = document.getElementById("btn-clear-all-deadlines");
  if (btnClearAllDeadlines) btnClearAllDeadlines.addEventListener("click", window.clearAllDeadlines);

  const btnCardClearDeadlines = document.getElementById("btn-card-clear-deadlines");
  if (btnCardClearDeadlines) btnCardClearDeadlines.addEventListener("click", window.clearAllDeadlines);

  const btnClearDeadlinesSettings = document.getElementById("btn-clear-deadlines-settings");
  if (btnClearDeadlinesSettings) btnClearDeadlinesSettings.addEventListener("click", window.clearAllDeadlines);

  const btnRestoreDefaultProjects = document.getElementById("btn-restore-default-projects");
  if (btnRestoreDefaultProjects) btnRestoreDefaultProjects.addEventListener("click", window.restoreDefaultProjects);

  const btnRestoreDeadlinesSettings = document.getElementById("btn-restore-deadlines-settings");
  if (btnRestoreDeadlinesSettings) btnRestoreDeadlinesSettings.addEventListener("click", window.restoreDefaultProjects);

  const btnFullDataClear = document.getElementById("btn-full-data-clear");
  if (btnFullDataClear) {
    btnFullDataClear.addEventListener("click", async () => {
      if (!confirm("⚠️ သတိပေးချက်: အစည်းအဝေးမှတ်တမ်းများ၊ ပရောဂျက် Deadline များ၊ PDF ဖိုင်များ၊ Uploaded ဖိုင်များ အားလုံးကို အပြီးတိုင် ဖျက်ပစ်ပါတော့မည်!\n\nဆက်လက်လုပ်ဆောင်ရန် သေချာပါသလား?")) return;
      try {
        const res = await fetch("/api/data/clear-all", { method: "POST" });
        const data = await res.json();
        if (res.ok) {
          alert("✅ အချက်အလက်နှင့် PDF အားလုံးကို အောင်မြင်စွာ Reset ပြုလုပ်ပြီးပါပြီ!");
          await loadMeetingMinutes();
          await loadWarningsAndProjects();
          await loadGeneratedPdfList();
        } else {
          alert("Clear failed: " + (data.detail || "Error"));
        }
      } catch (err) {
        alert("Clear error: " + err.message);
      }
    });
  }

  // Initial loads
  loadMeetingMinutes();
  loadWarningsAndProjects();
  loadSettings();
  loadGeneratedPdfList();
  renderActiveNumberedReportText(false);
});
