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

  async function loadMeetingMinutes() {
    try {
      const res = await fetch("/api/meeting-minutes");
      const data = await res.json();
      renderMinutesList(data);
    } catch (err) {
      console.error("Failed to load minutes", err);
    }
  }

  function renderMinutesList(minutes) {
    if (!minutes || minutes.length === 0) {
      minutesList.innerHTML = `<div class="empty-state"><p>မှတ်တမ်းများ မရှိသေးပါ</p></div>`;
      return;
    }
    minutesList.innerHTML = minutes.map(m => {
      const info = m.meeting_info || {};
      const pdfUrl = m.pdf_url || `/pdfs/Meeting_Minute_${(info.project || "meeting").replace(/ /g, "_")}.pdf`;
      return `
        <div class="minute-card">
          <div class="minute-card-header">
            <span class="minute-title">${info.project || "Untitled Project"}</span>
            <span class="badge info">${info.date || ""}</span>
          </div>
          <div class="minute-meta">
            <b>Topic:</b> ${info.meeting_type || "Discussion"}<br>
            <b>Prepared By:</b> ${info.prepared_by || "My Easy Job"}
          </div>
          <div style="margin-top: 10px; display: flex; gap: 8px;">
            <button class="btn btn-primary btn-sm" onclick="exportMinutePdf('${m.id}')">
              📄 Download PDF
            </button>
            <button class="btn btn-secondary btn-sm" onclick="previewMinuteDetails('${m.id}')">
              🔍 View Details
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  window.exportMinutePdf = async function(id) {
    try {
      const res = await fetch(`/api/meeting-minutes/${id}/pdf`, { method: "POST" });
      const data = await res.json();
      if (data.pdf_url) {
        window.open(data.pdf_url, "_blank");
      }
    } catch (err) {
      alert("PDF download failed: " + err.message);
    }
  };

  window.previewMinuteDetails = async function(id) {
    try {
      const res = await fetch("/api/meeting-minutes");
      const list = await res.json();
      const m = list.find(item => item.id === id);
      if (m) {
        alert(`Project: ${m.meeting_info.project}\nAttendees: ${m.attendees.join(", ")}\nPurpose: ${m.purpose.join("; ")}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

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
        window.open(data.pdf_url, "_blank");
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
        if (data.pdf_url) window.open(data.pdf_url, "_blank");
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

  if (dailyReportForm) {
    dailyReportForm.addEventListener("submit", async (e) => {
      e.preventDefault();
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

          reportPreviewBox.innerHTML = `
            <div class="report-result-card" style="padding: 16px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px;">
              <h3 style="color: #166534; margin-bottom: 6px;">🎉 DAILY WORK REPORT PDF အောင်မြင်စွာ ထုတ်ယူပြီးပါပြီ!</h3>
              <p style="font-size: 13.5px; color: #1e293b;"><b>Reporter:</b> ${payload.name} (${payload.position})</p>
              <p style="font-size: 13.5px; color: #1e293b;"><b>Date:</b> ${payload.date} | <b>Total Tasks:</b> ${payload.work_details.length}</p>
              <div style="margin-top: 12px; display: flex; gap: 8px;">
                <a href="${data.pdf_url}" target="_blank" class="btn btn-primary">
                  📥 View & Download Report PDF
                </a>
              </div>
            </div>
          `;
          window.open(data.pdf_url, "_blank");
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

  if (btnCopyDailyText) {
    btnCopyDailyText.addEventListener("click", () => {
      const p = getDailyWorkReportPayload();
      let lines = [
        "DAILY WORK REPORT\n",
        `Name: ${p.name}`,
        `Department: ${p.department}`,
        `Position: ${p.position}`,
        `Date: ${p.date}`,
        `Report Type: ${p.report_type}\n`,
        "Work Details:\n"
      ];

      p.work_details.forEach((item, idx) => {
        lines.push(`${idx + 1}. Project: ${item.project}`);
        lines.push(`Task: ${item.task}`);
        lines.push(`Status: ${item.status}`);
        lines.push(`Remark: ${item.remark}`);
        lines.push(`Tomorrow Plan: ${item.tomorrow_plan}`);
        if (item.meeting_minute_ref) lines.push(item.meeting_minute_ref);
        lines.push("");
      });

      const fullText = lines.join("\n");
      navigator.clipboard.writeText(fullText).then(() => {
        alert("Daily Work Report စာသားကို Clipboard သို့ အောင်မြင်စွာ ကူးယူပြီးပါပြီ!");
      }).catch(() => {
        alert("Clipboard copy failed");
      });
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
    projectsTableBody.innerHTML = projects.map(p => {
      const a = p.analysis || {};
      let badgeClass = "info";
      if (a.warning_level === "danger") badgeClass = "danger";
      else if (a.warning_level === "warning") badgeClass = "warning";
      else if (a.warning_level === "success") badgeClass = "success";

      return `
        <tr>
          <td>
            <strong>${p.name}</strong><br>
            <small style="color: #64748b;">${p.description || ""}</small>
          </td>
          <td>${p.client || "-"}</td>
          <td>${p.start_date}</td>
          <td><strong>${p.deadline}</strong></td>
          <td>
            <span class="badge ${badgeClass}">${a.alert_message || p.status}</span>
          </td>
          <td>
            <div style="font-size: 12px; margin-bottom: 3px;">${p.progress_percentage || 0}%</div>
            <div style="background: #e2e8f0; height: 6px; border-radius: 999px; width: 80px; overflow: hidden;">
              <div style="background: var(--primary); height: 100%; width: ${p.progress_percentage || 0}%;"></div>
            </div>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="deleteProject('${p.id}')">🗑️</button>
          </td>
        </tr>
      `;
    }).join("");
  }

  window.deleteProject = async function(id) {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      await loadWarningsAndProjects();
    } catch (err) {
      alert("Delete failed: " + err.message);
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

  // ================= 4. SETTINGS =================
  const settingsForm = document.getElementById("settings-form");
  const btnTestTg = document.getElementById("btn-test-tg");

  async function loadSettings() {
    try {
      const res = await fetch("/api/config");
      const cfg = await res.json();
      if (cfg.gemini_api_key_set) document.getElementById("cfg-gemini-key").placeholder = "•••••••••••• (Configured)";
      if (cfg.telegram_bot_token_set) document.getElementById("cfg-tg-token").placeholder = "•••••••••••• (Configured)";
      if (cfg.telegram_chat_id) document.getElementById("cfg-tg-chat").value = cfg.telegram_chat_id;
      if (cfg.webhook_url) document.getElementById("cfg-webhook-url").value = cfg.webhook_url;
      if (cfg.smtp_server) document.getElementById("cfg-smtp-server").value = cfg.smtp_server;
      if (cfg.smtp_port) document.getElementById("cfg-smtp-port").value = cfg.smtp_port;
      if (cfg.smtp_user) document.getElementById("cfg-smtp-user").value = cfg.smtp_user;
      if (cfg.alert_recipient_email) document.getElementById("cfg-recipient-email").value = cfg.alert_recipient_email;
    } catch (err) {
      console.error(err);
    }
  }

  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      gemini_api_key: document.getElementById("cfg-gemini-key").value,
      telegram_bot_token: document.getElementById("cfg-tg-token").value,
      telegram_chat_id: document.getElementById("cfg-tg-chat").value,
      webhook_url: document.getElementById("cfg-webhook-url").value,
      smtp_server: document.getElementById("cfg-smtp-server").value,
      smtp_port: parseInt(document.getElementById("cfg-smtp-port").value) || 587,
      smtp_user: document.getElementById("cfg-smtp-user").value,
      smtp_password: document.getElementById("cfg-smtp-pass").value,
      alert_recipient_email: document.getElementById("cfg-recipient-email").value
    };

    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      alert(data.message || "Saved successfully");
    } catch (err) {
      alert("Save failed: " + err.message);
    }
  });

  btnTestTg.addEventListener("click", async () => {
    try {
      const res = await fetch("/api/warnings/test-telegram", { method: "POST" });
      const data = await res.json();
      alert("Telegram Test: " + data.message);
    } catch (err) {
      alert("Test failed: " + err.message);
    }
  });

  // Initial loads
  loadMeetingMinutes();
  loadWarningsAndProjects();
  loadSettings();
});
