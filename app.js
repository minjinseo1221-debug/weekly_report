const TEAM_MEMBERS = [
  "김동욱",
  "서민진",
  "정유석",
  "장동호",
  "이다연",
  "장래홍",
  "조예은",
  "김형섭"
];

const FIELD_MAP = {
  prev_development: "전주 개발업무",
  prev_routine: "전주 통상업무",
  curr_development: "금주 개발업무",
  curr_routine: "금주 통상업무",
  business_trip: "출장",
  etc: "기타"
};

const $ = (id) => document.getElementById(id);
const config = window.APP_CONFIG || {};
const supabaseClient = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

let adminUnlocked = false;
let currentAdminRows = [];

function getWednesday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = 3 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function setMessage(text, type = "") {
  $("message").textContent = text;
  $("message").className = `message ${type}`;
}

function setAdminMessage(text, type = "") {
  $("adminMessage").textContent = text;
  $("adminMessage").className = `message ${type}`;
}

function setStatus(status) {
  const badge = $("statusBadge");
  badge.className = "badge";
  if (status === "submitted") {
    badge.textContent = "제출 완료";
    badge.classList.add("badge-submitted");
  } else if (status === "draft") {
    badge.textContent = "임시저장";
    badge.classList.add("badge-draft");
  } else {
    badge.textContent = "미작성";
    badge.classList.add("badge-muted");
  }
}

function getFormData(status) {
  return {
    employee_name: $("employeeName").value,
    week_date: $("adminWeek").dataset.currentWeek,
    pin: $("employeePin").value.trim(),
    prev_development: $("prevDevelopment").value.trim(),
    prev_routine: $("prevRoutine").value.trim(),
    curr_development: $("currDevelopment").value.trim(),
    curr_routine: $("currRoutine").value.trim(),
    business_trip: $("businessTrip").value.trim(),
    etc: $("etc").value.trim(),
    status
  };
}

function fillForm(row) {
  $("prevDevelopment").value = row?.prev_development || "";
  $("prevRoutine").value = row?.prev_routine || "";
  $("currDevelopment").value = row?.curr_development || "";
  $("currRoutine").value = row?.curr_routine || "";
  $("businessTrip").value = row?.business_trip || "";
  $("etc").value = row?.etc || "";
  setStatus(row?.status);
}

async function loadMyReport() {
  const employeeName = $("employeeName").value;
  const pin = $("employeePin").value.trim();
  const weekDate = $("adminWeek").dataset.currentWeek;

  if (!pin) {
    setMessage("개인 비밀번호를 입력해 주세요.", "error");
    return;
  }

  const { data, error } = await supabaseClient.rpc("get_weekly_report", {
    p_employee_name: employeeName,
    p_week_date: weekDate,
    p_pin: pin
  });

  if (error) {
    setMessage(error.message, "error");
    return;
  }

  if (!data || data.length === 0) {
    fillForm(null);
    setMessage("저장된 내용이 없습니다.");
    return;
  }

  fillForm(data[0]);
  setMessage("기존 내용을 불러왔습니다.", "success");
}

async function saveReport(status) {
  const payload = getFormData(status);

  if (!payload.pin) {
    setMessage("개인 비밀번호를 입력해 주세요.", "error");
    return;
  }

  if (status === "submitted") {
    const requiredFields = [
      "prev_development",
      "prev_routine",
      "curr_development",
      "curr_routine",
      "business_trip",
      "etc"
    ];
    const missing = requiredFields.filter((key) => !payload[key]);
    if (missing.length) {
      setMessage("최종 제출 전 모든 항목을 입력해 주세요. 해당 사항이 없으면 '없음'으로 입력하세요.", "error");
      return;
    }
  }

  const { error } = await supabaseClient.rpc("save_weekly_report", {
    p_employee_name: payload.employee_name,
    p_week_date: payload.week_date,
    p_pin: payload.pin,
    p_prev_development: payload.prev_development,
    p_prev_routine: payload.prev_routine,
    p_curr_development: payload.curr_development,
    p_curr_routine: payload.curr_routine,
    p_business_trip: payload.business_trip,
    p_etc: payload.etc,
    p_status: payload.status
  });

  if (error) {
    setMessage(error.message, "error");
    return;
  }

  setStatus(status);
  setMessage(status === "submitted" ? "최종 제출되었습니다." : "임시저장되었습니다.", "success");
}

function toggleAdmin(showAdmin) {
  $("reportSection").classList.toggle("hidden", showAdmin);
  $("adminSection").classList.toggle("hidden", !showAdmin);
}

async function loadAdminReports() {
  const weekDate = $("adminWeek").value;
  if (!weekDate) return;

  const { data, error } = await supabaseClient.rpc("get_admin_weekly_reports", {
    p_admin_password: $("adminPassword").value,
    p_week_date: weekDate
  });

  if (error) {
    setAdminMessage(error.message, "error");
    return;
  }

  currentAdminRows = data || [];
  renderAdmin(currentAdminRows);
  setAdminMessage("조회가 완료되었습니다.", "success");
}

function renderAdmin(rows) {
  const submittedCount = rows.filter((r) => r.status === "submitted").length;
  const draftCount = rows.filter((r) => r.status === "draft").length;
  const missingCount = rows.filter((r) => !r.status).length;

  $("summaryCards").innerHTML = `
    <div class="summary-card"><strong>${submittedCount}</strong><span>제출 완료</span></div>
    <div class="summary-card"><strong>${draftCount}</strong><span>임시저장</span></div>
    <div class="summary-card"><strong>${missingCount}</strong><span>미제출</span></div>
  `;

  $("reportTableBody").innerHTML = rows.map((row, index) => {
    let badge = '<span class="badge badge-missing">미제출</span>';
    if (row.status === "submitted") badge = '<span class="badge badge-submitted">제출 완료</span>';
    if (row.status === "draft") badge = '<span class="badge badge-draft">임시저장</span>';

    return `
      <tr>
        <td><strong>${row.employee_name}</strong></td>
        <td>${badge}</td>
        <td>${formatDateTime(row.updated_at)}</td>
        <td>${row.status ? `<button class="detail-btn" data-index="${index}">내용 보기</button>` : "-"}</td>
      </tr>
    `;
  }).join("");

  document.querySelectorAll(".detail-btn").forEach((btn) => {
    btn.addEventListener("click", () => openDetail(currentAdminRows[Number(btn.dataset.index)]));
  });
}

function openDetail(row) {
  $("dialogTitle").textContent = `${row.employee_name} 주간업무`;
  $("dialogContent").innerHTML = Object.entries(FIELD_MAP).map(([key, label]) => `
    <section class="detail-section">
      <h4>${label}</h4>
      <p>${escapeHtml(row[key] || "없음")}</p>
    </section>
  `).join("");
  $("detailDialog").showModal();
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildCombinedText(rows) {
  return rows.map((row) => {
    const body = Object.entries(FIELD_MAP)
      .map(([key, label]) => `[${label}]\n${row[key] || "없음"}`)
      .join("\n\n");
    return `■ ${row.employee_name} (${row.status === "submitted" ? "제출 완료" : row.status === "draft" ? "임시저장" : "미제출"})\n${body}`;
  }).join("\n\n========================================\n\n");
}

async function copyAll() {
  await navigator.clipboard.writeText(buildCombinedText(currentAdminRows));
  setAdminMessage("전체 내용이 클립보드에 복사되었습니다.", "success");
}

function downloadCsv() {
  const headers = ["이름", "상태", "전주 개발업무", "전주 통상업무", "금주 개발업무", "금주 통상업무", "출장", "기타", "수정일시"];
  const rows = currentAdminRows.map((row) => [
    row.employee_name,
    row.status || "미제출",
    row.prev_development || "",
    row.prev_routine || "",
    row.curr_development || "",
    row.curr_routine || "",
    row.business_trip || "",
    row.etc || "",
    row.updated_at || ""
  ]);

  const csv = [headers, ...rows]
    .map((line) => line.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `주간업무_${$("adminWeek").value}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function init() {
  TEAM_MEMBERS.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    $("employeeName").appendChild(option);
  });

  const currentWeek = formatDateLocal(getWednesday());
  $("weekLabel").textContent = `${currentWeek} 수요일 기준`;
  $("adminWeek").value = currentWeek;
  $("adminWeek").dataset.currentWeek = currentWeek;

  $("adminToggleBtn").addEventListener("click", () => toggleAdmin(true));
  $("closeAdminBtn").addEventListener("click", () => toggleAdmin(false));
  $("loadBtn").addEventListener("click", loadMyReport);
  $("draftBtn").addEventListener("click", () => saveReport("draft"));
  $("submitBtn").addEventListener("click", () => saveReport("submitted"));
  $("dialogCloseBtn").addEventListener("click", () => $("detailDialog").close());
  $("refreshBtn").addEventListener("click", loadAdminReports);
  $("copyAllBtn").addEventListener("click", copyAll);
  $("csvBtn").addEventListener("click", downloadCsv);

  $("adminLoginBtn").addEventListener("click", async () => {
    if ($("adminPassword").value !== config.ADMIN_PASSWORD) {
      setAdminMessage("관리자 비밀번호가 올바르지 않습니다.", "error");
      return;
    }
    adminUnlocked = true;
    $("adminLoginBox").classList.add("hidden");
    $("adminDashboard").classList.remove("hidden");
    await loadAdminReports();
  });

  $("adminWeek").addEventListener("change", () => {
    if (adminUnlocked) loadAdminReports();
  });
}

document.addEventListener("DOMContentLoaded", init);
