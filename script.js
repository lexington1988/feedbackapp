/* PPC Inspection Feedback (CodePen prototype)
   - Local-first (localStorage)
   - Generates matey verbal script + professional report
   - Adds Engineer summaries (trends/top issues/scores)
   - Print-to-PDF via window.print()
*/

const STORAGE_KEY = "ppc_inspection_feedback_v1";
const CLOUDINARY_CLOUD_NAME = "dnz3fuyjx";
const CLOUDINARY_UPLOAD_PRESET = "feedback";
const ENGINEER_DRAFTS_KEY = "ppc_engineer_summary_drafts_v1";
const ANALYTICS_DEFECTS_KEY = "ppc_analytics_defects_v1";
const ANALYTICS_AUDITS_KEY = "ppc_analytics_audits_v1";

const TCW_ERRORS_KEY =
  "ppc_tcw_errors_v1";

const MORGAN_LAMBERT_AUDITS_KEY =
  "ppc_morgan_lambert_audits_v1";

const PERFORMANCE_IMPORT_META_KEY =
  "ppc_performance_import_meta_v1";

const DASHBOARD_DATES_KEY =
  "ppc_dashboard_dates_v1";

const HS_WARNING_NOTICES_KEY =
  "ppc_hs_warning_notices_v1";

const HS_WARNING_META_KEY =
  "ppc_hs_warning_meta_v1";

const HS_AUDIT_REGISTER_KEY =
  "ppc_hs_audit_register_v1";

const HS_AUDIT_REGISTER_META_KEY =
  "ppc_hs_audit_register_meta_v1";

const HS_AUDIT_PENDING_UPDATES_KEY =
  "ppc_hs_audit_pending_updates_v1";

const HS_AUDIT_HISTORY_KEY =
  "ppc_hs_audit_history_v1";

const HS_CALIBRATION_KEY =
  "ppc_hs_calibration_v1";

const HS_CALIBRATION_META_KEY =
  "ppc_hs_calibration_meta_v1";

const HS_CALIBRATION_ALERT_SETTINGS_KEY =
  "ppc_hs_calibration_alert_settings_v1";

const HS_CALIBRATION_POPUP_HISTORY_KEY =
  "ppc_hs_calibration_popup_history_v1";

const HS_CALIBRATION_PENDING_UPDATES_KEY =
  "ppc_hs_calibration_pending_updates_v1";

const el = (id) => document.getElementById(id);
const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);
function closeMobileKeyboard(input = null) {
  setTimeout(() => {
    if (input && typeof input.blur === "function") {
      input.blur();
    }

    if (document.activeElement && typeof document.activeElement.blur === "function") {
      document.activeElement.blur();
    }
  }, 100);
}
const state = {
  current: null,
  editingModal: null,
  db: loadDb(),
  modalPhotoDataUrl: "", // local preview
  modalPhotoUrl: ""      // ✅ Cloudinary URL (saved in the finding)
};

const analyticsState = {
  defects: loadAnalyticsArray(ANALYTICS_DEFECTS_KEY),
  audits: loadAnalyticsArray(ANALYTICS_AUDITS_KEY)
};
function loadDashboardDateState() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          DASHBOARD_DATES_KEY
        ) || "null"
      );

    return parsed &&
      typeof parsed === "object"
      ? parsed
      : {
          currentFrom: "",
          currentTo: "",
          previousFrom: "",
          previousTo: "",
          comparisonEnabled: true
        };
  } catch {
    return {
      currentFrom: "",
      currentTo: "",
      previousFrom: "",
      previousTo: "",
      comparisonEnabled: true
    };
  }
}


const dashboardDateState =
  loadDashboardDateState();

if (
  typeof dashboardDateState
    .comparisonEnabled !==
  "boolean"
) {
  dashboardDateState
    .comparisonEnabled = true;
}


function saveDashboardDateState() {
  localStorage.setItem(
    DASHBOARD_DATES_KEY,
    JSON.stringify(
      dashboardDateState
    )
  );
}
function loadHsCalibrationMeta() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          HS_CALIBRATION_META_KEY
        ) || "null"
      );

    return parsed &&
      typeof parsed === "object"
      ? parsed
      : null;
  } catch {
    return null;
  }
}


function getDefaultHsCalibrationAlertSettings() {
  return {
    enabled: false,
    recipient: "",
    cc: "",
    ccAssignedEngineer: false,

    thresholds: [
      30,
      14,
      7,
      0
    ],

    dailyCheckTime:
      "08:00"
  };
}


function loadLocalHsCalibrationAlertSettings() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          HS_CALIBRATION_ALERT_SETTINGS_KEY
        ) || "null"
      );

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      return getDefaultHsCalibrationAlertSettings();
    }

    return {
      ...getDefaultHsCalibrationAlertSettings(),
      ...parsed,

      /*
        Keep the threshold schedule fixed.
      */
      thresholds: [
        30,
        14,
        7,
        0
      ]
    };
  } catch {
    return getDefaultHsCalibrationAlertSettings();
  }
}


const hsCalibrationAlertSettings =
  loadLocalHsCalibrationAlertSettings();


function saveLocalHsCalibrationAlertSettings() {
  localStorage.setItem(
    HS_CALIBRATION_ALERT_SETTINGS_KEY,
    JSON.stringify(
      hsCalibrationAlertSettings
    )
  );
}

function loadHsWarningMeta() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          HS_WARNING_META_KEY
        ) || "null"
      );

    return parsed &&
      typeof parsed === "object"
      ? parsed
      : {};
  } catch {
    return {};
  }
}


const hsWarningState = {
  records:
    loadAnalyticsArray(
      HS_WARNING_NOTICES_KEY
    ),

  importMeta:
    loadHsWarningMeta()
};


function saveHsWarningState() {
  localStorage.setItem(
    HS_WARNING_NOTICES_KEY,
    JSON.stringify(
      hsWarningState.records
    )
  );

  localStorage.setItem(
    HS_WARNING_META_KEY,
    JSON.stringify(
      hsWarningState.importMeta
    )
  );
}
function loadHsAuditRegisterMeta() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          HS_AUDIT_REGISTER_META_KEY
        ) || "null"
      );

    return parsed &&
      typeof parsed === "object"
      ? parsed
      : null;
  } catch {
    return null;
  }
}


const hsAuditRegisterState = {
  records:
    loadAnalyticsArray(
      HS_AUDIT_REGISTER_KEY
    ),

  importMeta:
    loadHsAuditRegisterMeta()
};
let hsAuditPendingUpdates =
  loadAnalyticsArray(
    HS_AUDIT_PENDING_UPDATES_KEY
  );

let hsAuditHistory =
  loadAnalyticsArray(
    HS_AUDIT_HISTORY_KEY
  );


function saveHsAuditHistoryLocal() {
  localStorage.setItem(
    HS_AUDIT_HISTORY_KEY,
    JSON.stringify(
      hsAuditHistory
    )
  );
}

function saveHsAuditPendingUpdatesLocal() {
  localStorage.setItem(
    HS_AUDIT_PENDING_UPDATES_KEY,
    JSON.stringify(
      hsAuditPendingUpdates
    )
  );
}

function saveHsAuditRegisterState() {
  localStorage.setItem(
    HS_AUDIT_REGISTER_KEY,
    JSON.stringify(
      hsAuditRegisterState.records
    )
  );

  localStorage.setItem(
    HS_AUDIT_REGISTER_META_KEY,
    JSON.stringify(
      hsAuditRegisterState.importMeta
    )
  );
}
const hsCalibrationState = {
  records:
    loadAnalyticsArray(
      HS_CALIBRATION_KEY
    ),

  importMeta:
    loadHsCalibrationMeta()
};
let hsCalibrationPendingUpdates =
  loadAnalyticsArray(
    HS_CALIBRATION_PENDING_UPDATES_KEY
  );


function saveHsCalibrationPendingUpdatesLocal() {
  localStorage.setItem(
    HS_CALIBRATION_PENDING_UPDATES_KEY,
    JSON.stringify(
      hsCalibrationPendingUpdates
    )
  );
}

function saveHsCalibrationState() {
  localStorage.setItem(
    HS_CALIBRATION_KEY,
    JSON.stringify(
      hsCalibrationState.records
    )
  );

  localStorage.setItem(
    HS_CALIBRATION_META_KEY,
    JSON.stringify(
      hsCalibrationState.importMeta
    )
  );
}


const performanceState = {
  tcwErrors:
    loadAnalyticsArray(
      TCW_ERRORS_KEY
    ),

  morganLambertAudits:
    loadAnalyticsArray(
      MORGAN_LAMBERT_AUDITS_KEY
    ),

  importMeta:
    loadPerformanceImportMeta()
};
function loadPerformanceImportMeta() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          PERFORMANCE_IMPORT_META_KEY
        ) || "null"
      );

    return parsed &&
      typeof parsed === "object"
      ? parsed
      : null;
  } catch {
    return null;
  }
}


function savePerformanceState() {
  localStorage.setItem(
    TCW_ERRORS_KEY,
    JSON.stringify(
      performanceState.tcwErrors
    )
  );

  localStorage.setItem(
    MORGAN_LAMBERT_AUDITS_KEY,
    JSON.stringify(
      performanceState
        .morganLambertAudits
    )
  );

  localStorage.setItem(
    PERFORMANCE_IMPORT_META_KEY,
    JSON.stringify(
      performanceState.importMeta
    )
  );
}
function loadAnalyticsArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAnalyticsArchive() {
  localStorage.setItem(ANALYTICS_DEFECTS_KEY, JSON.stringify(analyticsState.defects));
  localStorage.setItem(ANALYTICS_AUDITS_KEY, JSON.stringify(analyticsState.audits));
}

function buildAnalyticsRecordsFromInspection(inspection) {
  if (!inspection || !inspection.id) {
    return {
      auditRecord: null,
      defectRecords: []
    };
  }

  const savedAt = new Date().toISOString();

  const auditRecord = {
    id: inspection.id,
    date: inspection.date || savedAt.slice(0, 10),
    engineer: inspection.engineer || "",
    jobRef: inspection.jobRef || "",
    outcome: inspection.outcome || "",
    updatedAt: savedAt
  };

  const defectRecords = (inspection.findings || []).map(
    (finding, index) => {
      const findingId = finding.id || String(index);
      const sourceKey = `${inspection.id}:${findingId}`;

      return {
        sourceKey,
        auditId: inspection.id,
        findingId,
        date: inspection.date || savedAt.slice(0, 10),
        engineer: inspection.engineer || "",
        jobRef: inspection.jobRef || "",
        outcome: inspection.outcome || "",
        title: finding.title || "Untitled defect",
        category: finding.category || "Other",
        severity: finding.severity || "Minor",
        tag: finding.tag || "",
        why: finding.why || "",
        action: finding.action || "",
        notes: finding.notes || "",
        archivedAt: savedAt,
        updatedAt: savedAt
      };
    }
  );

  return {
    auditRecord,
    defectRecords
  };
}

function archiveInspectionForAnalytics(inspection) {
  const {
    auditRecord,
    defectRecords
  } = buildAnalyticsRecordsFromInspection(inspection);

  if (!auditRecord) return;

  const auditIndex = analyticsState.audits.findIndex(
    item => item.id === auditRecord.id
  );

  if (auditIndex >= 0) {
    analyticsState.audits[auditIndex] = auditRecord;
  } else {
    analyticsState.audits.push(auditRecord);
  }

  /*
    Remove the previous defect records for this audit first.

    This prevents an old defect remaining in analytics after it
    has been removed from an audit and the audit is saved again.
  */
  analyticsState.defects = analyticsState.defects.filter(
    item => item.auditId !== auditRecord.id
  );

  analyticsState.defects.push(...defectRecords);

  saveAnalyticsArchive();

  return {
    auditRecord,
    defectRecords
  };
}

// ================== Defects Library (CSV -> typeahead) ==================
const DEFECTS_STORAGE_KEY = "ppc_defects_library_v1";
const DEFECTS_CSV_URL = "https://lexington1988.github.io/feedbackapp/Defects.csv";
 // <-- GitHub-hosted CSV in same folder

// Each defect can be as simple as: { title: "Flue not supported near elbow" }
// (Optionally later we can support category/tag/why/action columns too.)
let defectsLibrary = [];

// Load from localStorage first, then try to fetch from GitHub CSV
function rebuildAnalyticsFromInspections(inspections) {
  /*
    Preserve audit-only historical workbook records.

    Firebase remains the source of truth for audits created
    inside the PPC app, while imported historical audits are
    kept alongside them.
  */
  const historicalAudits =
    (analyticsState.audits || [])
      .filter(record =>
        record?.sourceType ===
        "historical-workbook"
      );

  analyticsState.audits = [
    ...historicalAudits
  ];

  analyticsState.defects = [];

  (inspections || []).forEach(inspection => {
    const {
      auditRecord,
      defectRecords
    } = buildAnalyticsRecordsFromInspection(inspection);

    if (!auditRecord) return;

    analyticsState.audits.push(auditRecord);
    analyticsState.defects.push(...defectRecords);
  });

  saveAnalyticsArchive();
  refreshAnalyticsFilters();

  if (el("tabAnalytics")) {
    renderAnalytics();
  }
}
async function initDefectsLibrary() {
  // 1) local cache
  try {
    const raw = localStorage.getItem(DEFECTS_STORAGE_KEY);
    if (raw) defectsLibrary = JSON.parse(raw) || [];
  } catch {
    defectsLibrary = [];
  }

  // 2) fetch hosted CSV (non-blocking, refreshes library)
  try {
    const list = await fetchDefectsCsvFromUrl(DEFECTS_CSV_URL);
    if (list.length) {
      defectsLibrary = list;
      localStorage.setItem(DEFECTS_STORAGE_KEY, JSON.stringify(defectsLibrary));
    }
  } catch (err) {
    // Silent fail is ok (offline / first load / wrong filename)
    console.warn("Defects CSV fetch failed:", err);
  }
}

async function fetchDefectsCsvFromUrl(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const text = await res.text();
  return parseDefectsCsv(text);
}

// Very small CSV parser that supports:
// - header row OR single-column no-header
// - quoted values
function parseDefectsCsv(csvText) {
  const rows = csvToRows(csvText);
  if (!rows.length) return [];

  const header = rows[0].map(x => String(x || "").trim());
  const hasHeader = header.some(h => /title|defect|finding/i.test(h));

  // column helper
  const colIndex = (name, fallback) => {
    const i = header.findIndex(h => h.toLowerCase() === name.toLowerCase());
    return i >= 0 ? i : fallback;
  };

  // If no header, assume first 5 columns are:
  // title,category,severity,tag,why,action (action would be col 5)
  const idx = hasHeader
    ? {
        title: colIndex("title", 0),
        category: colIndex("category", 1),
        severity: colIndex("severity", 2),
        tag: colIndex("tag", 3),
        why: colIndex("why", 4),
        action: colIndex("action", 5),
      }
    : { title: 0, category: 1, severity: 2, tag: 3, why: 4, action: 5 };

  const start = hasHeader ? 1 : 0;

  const out = [];
  for (let i = start; i < rows.length; i++) {
    const cols = rows[i] || [];
    const title = String(cols[idx.title] || "").trim();
    if (!title) continue;

    out.push({
      title,
      category: String(cols[idx.category] || "").trim(),
      severity: String(cols[idx.severity] || "").trim(), // CSV has ID/AR/NCS/Advisory
      tag: String(cols[idx.tag] || "").trim(),
      why: String(cols[idx.why] || "").trim(),
      action: String(cols[idx.action] || "").trim(),
    });
  }

  // de-dupe by title (case-insensitive)
  const map = new Map();
  out.forEach(d => {
    const key = d.title.trim().toLowerCase();
    if (!map.has(key)) map.set(key, d);
  });

  return Array.from(map.values());
}


// Robust CSV row splitter (handles quotes/commas)
function csvToRows(text) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  const s = String(text || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const next = s[i + 1];

    if (ch === '"' && inQuotes && next === '"') {
      cur += '"';
      i++;
      continue;
    }

    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(cur);
      cur = "";
      continue;
    }

    if (ch === "\n" && !inQuotes) {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
      continue;
    }

    cur += ch;
  }

  // last cell
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }

  // remove empty trailing rows
  return rows
    .map(r => r.map(c => String(c ?? "")))
    .filter(r => r.some(c => c.trim().length));
}
// ================== Boiler Library (CSV -> typeahead for Appliance) ==================
const BOILERS_STORAGE_KEY = "ppc_boilers_library_v1";
const BOILERS_CSV_URL = "https://raw.githubusercontent.com/lexington1988/feedbackapp/main/service_info_full.csv";


let boilersLibrary = []; // { display, make, model }
let suppressBoilerSuggestionsUntil = 0;
async function initBoilersLibrary() {
  // 1) local cache
  try {
    const raw = localStorage.getItem(BOILERS_STORAGE_KEY);
    if (raw) boilersLibrary = JSON.parse(raw) || [];
  } catch {
    boilersLibrary = [];
  }

  // 2) fetch hosted CSV (refresh library)
  try {
    const list = await fetchBoilersCsvFromUrl(BOILERS_CSV_URL);
    if (list.length) {
      boilersLibrary = list;
      localStorage.setItem(BOILERS_STORAGE_KEY, JSON.stringify(boilersLibrary));
    }
  } catch (err) {
    console.warn("Boilers CSV fetch failed:", err);
  }
}

async function fetchBoilersCsvFromUrl(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const text = await res.text();
  return parseBoilersCsv(text);
}

// Re-uses your csvToRows(text) helper
function parseBoilersCsv(csvText) {
  const rows = csvToRows(csvText);
  if (!rows.length) return [];

  const header = rows[0].map(x => String(x || "").trim());
  const lowerHeader = header.map(h => h.toLowerCase());

  // Try to find common column names
 const idxMake = lowerHeader.findIndex(h => h === "make" || h.includes("manufacturer"));
const idxModel = lowerHeader.findIndex(h => h === "model" || h.includes("appliance") || h.includes("boiler"));
const idxGc = lowerHeader.findIndex(h => h === "gc number" || h === "gc" || h.includes("gc"));
const idxDisplay = lowerHeader.findIndex(h => h === "display" || h.includes("make/model") || h.includes("make model"));


  // If there is no obvious header, assume single-column of boiler names
  const hasHeader = lowerHeader.some(h => h.includes("make") || h.includes("model") || h.includes("boiler") || h.includes("appliance"));

  const start = hasHeader ? 1 : 0;

  const out = [];
  for (let i = start; i < rows.length; i++) {
    const cols = rows[i] || [];

    // 1) Prefer a dedicated display column if present
    let display = idxDisplay >= 0 ? String(cols[idxDisplay] || "").trim() : "";

    // 2) Else build display from make + model if found
    const make = idxMake >= 0 ? String(cols[idxMake] || "").trim() : "";
const model = idxModel >= 0 ? String(cols[idxModel] || "").trim() : "";
const gc = idxGc >= 0 ? String(cols[idxGc] || "").trim() : "";


    if (!display) {
      if (make && model) display = `${make} ${model}`.trim();
      else display = String(cols[0] || "").trim(); // fallback single col
    }

    if (!display) continue;

  out.push({
  display,
  make,
  model,
  gc
});

  }

  // de-dupe by display (case-insensitive)
  const map = new Map();
  out.forEach(b => {
    const key = b.display.trim().toLowerCase();
    if (!map.has(key)) map.set(key, b);
  });

  return Array.from(map.values());
}

// ----------------- Boiler Typeahead UI -----------------
function initBoilerTypeahead() {
  const input = el("applianceInput");
  const box = el("boilerSuggestions");
  if (!input || !box) return;

  const show = () => box.classList.remove("hidden");
  const hide = () => box.classList.add("hidden");

  // Basic inline styling if you don’t already have it
  // (Remove if you already style #boilerSuggestions via CSS)
  box.style.position = "relative"; // harmless; your CSS can override

  const render = (items) => {
    if (!items.length) {
      hide();
      box.innerHTML = "";
      return;
    }

      box.innerHTML = items
      .slice(0, 12)
      .map((b, idx) => {
        const gcLine = (b.gc && String(b.gc).trim())
          ? `GC: ${escapeHtml(b.gc)}`
          : "Tap to use";

        return `
          <div class="suggestion-item" role="option" data-idx="${idx}">
            <strong>${escapeHtml(b.display)}</strong>
            <div class="meta">${gcLine}</div>
          </div>
        `;
      })
      .join("");


    box.querySelectorAll(".suggestion-item").forEach(node => {
      node.addEventListener("click", () => {
        const i = Number(node.getAttribute("data-idx"));
        const chosen = items[i];
        if (!chosen) return;

        input.value = chosen.display;
suppressBoilerSuggestionsUntil = Date.now() + 800;
        // Keep state in sync + update outputs
        if (state.current) state.current.appliance = chosen.display;
        renderOutputs();

       hide();
box.innerHTML = "";
closeMobileKeyboard(input);
      });
    });

    show();
  };

 const getMatches = (typed) => {
  const raw = String(typed || "").trim();
  if (!raw) return [];

  const norm = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[_/\\\-(),.]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  // digits-only version (for GC searching)
  const digitsOnly = (s) => String(s || "").replace(/\D+/g, "");

  const qNorm = norm(raw);
  if (!qNorm) return [];

  const qDigits = digitsOnly(raw);          // e.g. "473"
  const qTokens = qNorm.split(" ").filter(Boolean);

  const scored = [];

  for (const b of boilersLibrary || []) {
    const disp = String(b.display || "").trim();
    if (!disp) continue;

    const make = String(b.make || "").trim();
    const model = String(b.model || "").trim();
    const gcRaw = String(b.gc || "").trim();

    // ✅ Search across display + make + model + gc
    const haystackNorm = norm(`${disp} ${make} ${model} ${gcRaw}`);
    const gcDigits = digitsOnly(gcRaw);

    // --- Numeric search behaviour (GC) ---
    // If the user typed digits (like "473"), match against GC digits too.
    // We allow "contains" so partials work anywhere in the GC number.
    // If you prefer "startsWith" only, change includes -> startsWith.
    let tokenHits = 0;

    if (qDigits.length) {
      if (gcDigits.includes(qDigits)) {
        // Big boost if it matches the GC number
        tokenHits += 3;
      }
    }

    // --- Text token matching (make/model) ---
    for (const tok of qTokens) {
      if (haystackNorm.includes(tok)) tokenHits++;
    }

    if (tokenHits === 0) continue;

    const allTokensMatched = qTokens.length ? (qTokens.every(t => haystackNorm.includes(t))) : false;

    const starts = haystackNorm.startsWith(qNorm) ? 1 : 0;
    const pos = haystackNorm.indexOf(qTokens[0] || qNorm);
    const posScore = pos < 0 ? 9999 : pos;

    const gcStartsBoost =
      (qDigits.length && gcDigits.startsWith(qDigits)) ? 250 : 0;

    const score =
      (allTokensMatched ? 1000 : 0) +
      (tokenHits * 100) +
      (starts * 50) +
      gcStartsBoost -
      Math.min(50, posScore / 2);

    scored.push({ b, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 24).map(x => x.b);
};


  input.addEventListener("input", () => {
    const typed = input.value || "";
    const matches = getMatches(typed);
    render(matches);
  });

  input.addEventListener("blur", () => {
    setTimeout(hide, 150);
  });
input.addEventListener("pointerdown", () => {
  if (Date.now() < suppressBoilerSuggestionsUntil) {
    hide();
    box.innerHTML = "";
  }
});
 input.addEventListener("focus", () => {
  if (Date.now() < suppressBoilerSuggestionsUntil) {
    hide();
    box.innerHTML = "";
    return;
  }

  const typed = input.value || "";
  const matches = getMatches(typed);
  if (matches.length) render(matches);
});
}
// =====================================================================

// ----------------- Typeahead UI -----------------
function initDefectsTypeahead() {
  const input = el("findingTitle");
const box = el("defectSuggestions");
if (!input || !box) return;

// Repeat issue warning
let repeatIndicator = el("repeatIssueIndicator");

if (!repeatIndicator) {
  repeatIndicator = document.createElement("div");
  repeatIndicator.id = "repeatIssueIndicator";
  repeatIndicator.className = "hidden";
  repeatIndicator.style.marginTop = "6px";
  repeatIndicator.style.fontWeight = "bold";
  repeatIndicator.style.color = "#b45309";
  repeatIndicator.style.fontSize = "0.9rem";

  input.insertAdjacentElement("afterend", repeatIndicator);
}

  const show = () => box.classList.remove("hidden");
  const hide = () => box.classList.add("hidden");

  const render = (items, typed) => {
    if (!items.length) {
      hide();
      box.innerHTML = "";
      return;
    }

    box.innerHTML = items
      .slice(0, 12)
      .map((d, idx) => {
        const safeTitle = escapeHtml(d.title);
        const meta = typed ? `Tap to use` : `Suggested`;
        return `
          <div class="suggestion-item" role="option" data-idx="${idx}">
            <strong>${safeTitle}</strong>
            <div class="meta">${meta}</div>
          </div>
        `;
      })
      .join("");

    // tap/click to select
    box.querySelectorAll(".suggestion-item").forEach(node => {
      node.addEventListener("click", () => {
        const i = Number(node.getAttribute("data-idx"));
        const chosen = items[i];
        if (!chosen) return;

        input.value = chosen.title;
updateRepeatIssueIndicator();
        // Populate other fields if present
        if (chosen.category && el("findingCategory")) el("findingCategory").value = chosen.category;

        // Map CSV severity (ID/AR/NCS/Advisory) -> your select values
        if (chosen.severity && el("findingSeverity")) {
          const s = chosen.severity.trim().toUpperCase();
          const mapped =
            s === "ID" ? "Critical" :
            s === "AR" ? "Major" :
            s === "NCS" ? "Minor" :
            s === "ADVISORY" ? "Advisory" :
            "";
          if (mapped) el("findingSeverity").value = mapped;
        }

        // Tags
        if (chosen.tag && el("findingTag")) el("findingTag").value = chosen.tag;

        if (chosen.why && el("findingWhy")) el("findingWhy").value = chosen.why;
        if (chosen.action && el("findingAction")) el("findingAction").value = chosen.action;

        hide();
box.innerHTML = "";
closeMobileKeyboard(input);
      });
    });

    show();
  };

  const getMatches = (typed) => {
    const raw = String(typed || "").trim();
    if (!raw) return [];

    // Normalize: lowercase, remove punctuation, collapse spaces
    const norm = (s) =>
      String(s || "")
        .toLowerCase()
        .replace(/[_/\\\-(),.]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const qNorm = norm(raw);
    if (!qNorm) return [];

    const qTokens = qNorm.split(" ").filter(Boolean);

    const scored = [];

    // ✅ IMPORTANT: search defectsLibrary (NOT boilersLibrary)
    for (const d of defectsLibrary || []) {
      const title = String(d.title || "").trim();
      if (!title) continue;

      const tNorm = norm(title);
      if (!tNorm) continue;

      let tokenHits = 0;
      for (const tok of qTokens) {
        if (tNorm.includes(tok)) tokenHits++;
      }
      if (tokenHits === 0) continue;

      const allTokensMatched = tokenHits === qTokens.length;
      const starts = tNorm.startsWith(qNorm) ? 1 : 0;
      const pos = tNorm.indexOf(qTokens[0]);
      const posScore = pos < 0 ? 9999 : pos;

      const score =
        (allTokensMatched ? 1000 : 0) +
        (tokenHits * 100) +
        (starts * 50) -
        Math.min(50, posScore / 2);

      scored.push({ d, score });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 24).map(x => x.d);
  };

  input.addEventListener("input", () => {
    updateRepeatIssueIndicator();
    // ✅ hide boiler suggestions when typing a defect
    const boilerBox = el("boilerSuggestions");
    if (boilerBox) {
      boilerBox.classList.add("hidden");
      boilerBox.innerHTML = "";
    }

    const typed = input.value || "";
    const matches = getMatches(typed);
    render(matches, typed);
  });

  input.addEventListener("blur", () => {
    setTimeout(hide, 150);
  });

  input.addEventListener("focus", () => {
    const typed = input.value || "";
    const matches = getMatches(typed);
    if (matches.length) render(matches, typed);
  });
}

// ----------------- Optional: manual Import button -----------------
function initDefectsImportButton() {
  const btn = el("importDefectsBtn");
  const fileInput = el("defectsCsvInput");
  if (!btn || !fileInput) return;

  btn.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const list = parseDefectsCsv(text);

      if (!list.length) {
        alert("No defects found in the CSV. Check the column / rows.");
        return;
      }

      defectsLibrary = list;
      localStorage.setItem(DEFECTS_STORAGE_KEY, JSON.stringify(defectsLibrary));
      alert(`Imported ${defectsLibrary.length} defects.`);
    } catch (err) {
      console.error(err);
      alert("Could not import that CSV. Check console for details.");
    } finally {
      fileInput.value = "";
    }
  });
}
// ===================================================================





// ===== Watermark logo (IMPORTANT) =====
// If you're on CodePen, you MUST use a full https URL to the image asset.
// If you're on GitHub Pages and logo.png is in the same folder as index.html,
// you can leave it as "logo.png".
const LOGO_URL = "https://lexington1988.github.io/feedbackapp/logo.png";
 // <-- change to your CodePen asset URL if needed

function resolveLogoUrl() {
  try {
    // If LOGO_URL is already absolute, leave it.
    if (/^https?:\/\//i.test(LOGO_URL)) return LOGO_URL;

    // Otherwise make it absolute relative to the current page URL.
    return new URL(LOGO_URL, window.location.href).href;
  } catch {
    return "";
  }
}
// ===================== Firebase Cloud Sync =====================
// 1) In Firebase Console enable: Authentication -> Email/Password
// 2) Create yourself a user (your email + password)
// 3) Paste your firebaseConfig below (from Project settings)

const firebaseConfig = {
  apiKey: "AIzaSyAeTLlKPffedC6XCP83zan-4ue0LqZR_I0",
  authDomain: "ppcfeedback-5b2a5.firebaseapp.com",
  projectId: "ppcfeedback-5b2a5",
  storageBucket: "ppcfeedback-5b2a5.firebasestorage.app",
  appId: "1:560785286512:web:2f2ee57c7eeb6c23121bb5"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const cloudDb = firebase.firestore();


let cloudUnsub = null;

let hsCloudUnsubs = [];

function cloudSignedIn() {
  return !!auth.currentUser;
}

function getUser() {
  const u = auth.currentUser;
  if (!u) throw new Error("Not logged in");
  return u;
}

function inspectionsCol(uid) {
  return cloudDb
    .collection("users")
    .doc(uid)
    .collection("inspections");
}
function hsWarningNoticesCloudCol(
  uid
) {
  return cloudDb
    .collection("users")
    .doc(uid)
    .collection(
      "hsWarningNotices"
    );
}
function hsCalibrationCloudCol(uid) {
  return cloudDb
    .collection("users")
    .doc(uid)
    .collection(
      "hsCalibration"
    );
}


function hsCalibrationMetaRef(uid) {
  return cloudDb
    .collection("users")
    .doc(uid)
    .collection(
      "hsSettings"
    )
    .doc(
      "calibration"
    );
}
function hsAuditRegisterCloudCol(
  uid
) {
  return cloudDb
    .collection("users")
    .doc(uid)
    .collection(
      "hsAuditRegister"
    );
}
function hsAuditHistoryCloudCol(
  uid
) {
  return cloudDb
    .collection("users")
    .doc(uid)
    .collection(
      "hsAuditHistory"
    );
}

function hsAuditRegisterMetaRef(
  uid
) {
  return cloudDb
    .collection("users")
    .doc(uid)
    .collection(
      "hsSettings"
    )
    .doc(
      "auditRegister"
    );
}
function analyticsAuditsCol(uid) {
  return cloudDb
    .collection("users")
    .doc(uid)
    .collection("analyticsAudits");
}

function analyticsDefectsCol(uid) {
  return cloudDb
    .collection("users")
    .doc(uid)
    .collection("analyticsDefects");
}

function analyticsCloudDocumentId(value) {
  return encodeURIComponent(String(value || ""));
}

function analyticsRecordTime(record) {
  const raw =
    record?.updatedAt ||
    record?.archivedAt ||
    "";

  const timestamp = Date.parse(raw);

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
}

function mergeAnalyticsRecords(
  localRecords,
  cloudRecords,
  keyField
) {
  const merged = new Map();

  (localRecords || []).forEach(record => {
    const key = String(record?.[keyField] || "");
    if (!key) return;

    merged.set(key, record);
  });

  (cloudRecords || []).forEach(record => {
    const key = String(record?.[keyField] || "");
    if (!key) return;

    const existing = merged.get(key);

    if (
      !existing ||
      analyticsRecordTime(record) >=
        analyticsRecordTime(existing)
    ) {
      merged.set(key, record);
    }
  });

  return Array.from(merged.values());
}

async function commitAnalyticsCloudOperations(operations) {
  const maximumOperationsPerBatch = 400;

  for (
    let start = 0;
    start < operations.length;
    start += maximumOperationsPerBatch
  ) {
    const batch = cloudDb.batch();

    operations
      .slice(
        start,
        start + maximumOperationsPerBatch
      )
      .forEach(operation => {
        if (operation.type === "delete") {
          batch.delete(operation.ref);
        } else {
          batch.set(
            operation.ref,
            operation.data,
            { merge: true }
          );
        }
      });

    await batch.commit();
  }
}

async function syncInspectionAnalyticsCloud(inspection) {
  const user = getUser();

  const {
    auditRecord,
    defectRecords
  } = buildAnalyticsRecordsFromInspection(inspection);

  if (!auditRecord) return;

  const auditRef = analyticsAuditsCol(user.uid)
    .doc(
      analyticsCloudDocumentId(
        auditRecord.id
      )
    );

  /*
    Read only the defects belonging to this audit.

    Existing defect documents are removed before the current
    set is written, preventing obsolete findings remaining in
    the permanent archive after an audit is edited.
  */
  const existingDefectsSnapshot =
    await analyticsDefectsCol(user.uid)
      .where(
        "auditId",
        "==",
        auditRecord.id
      )
      .get();

  const operations = [
    {
      type: "set",
      ref: auditRef,
      data: auditRecord
    }
  ];

  existingDefectsSnapshot.docs.forEach(document => {
    operations.push({
      type: "delete",
      ref: document.ref
    });
  });

  defectRecords.forEach(record => {
    const defectRef = analyticsDefectsCol(user.uid)
      .doc(
        analyticsCloudDocumentId(
          record.sourceKey
        )
      );

    operations.push({
      type: "set",
      ref: defectRef,
      data: record
    });
  });

  await commitAnalyticsCloudOperations(operations);
}

async function uploadLocalAnalyticsArchiveToCloud() {
  const user = getUser();
  const operations = [];

  analyticsState.audits.forEach(record => {
    if (!record?.id) return;

    operations.push({
      type: "set",
      ref: analyticsAuditsCol(user.uid)
        .doc(
          analyticsCloudDocumentId(
            record.id
          )
        ),
      data: record
    });
  });

  analyticsState.defects.forEach(record => {
    if (!record?.sourceKey) return;

    operations.push({
      type: "set",
      ref: analyticsDefectsCol(user.uid)
        .doc(
          analyticsCloudDocumentId(
            record.sourceKey
          )
        ),
      data: record
    });
  });

  if (operations.length) {
    await commitAnalyticsCloudOperations(
      operations
    );
  }
}

async function loadAnalyticsArchiveFromCloud() {
  const user = getUser();

  const [
    auditSnapshot,
    defectSnapshot
  ] = await Promise.all([
    analyticsAuditsCol(user.uid).get(),
    analyticsDefectsCol(user.uid).get()
  ]);

  const cloudAudits = auditSnapshot.docs.map(
    document => ({
      id: document.id,
      ...document.data()
    })
  );

  const cloudDefects = defectSnapshot.docs.map(
    document => ({
      ...document.data()
    })
  );

  analyticsState.audits =
    mergeAnalyticsRecords(
      analyticsState.audits,
      cloudAudits,
      "id"
    );

  analyticsState.defects =
    mergeAnalyticsRecords(
      analyticsState.defects,
      cloudDefects,
      "sourceKey"
    );

  saveAnalyticsArchive();

  refreshAnalyticsFilters();

  if (el("tabAnalytics")) {
    renderAnalytics();
  }
}

async function initialiseCloudAnalyticsArchive() {
  const user = getUser();

  const liveAuditsSnapshot =
    await inspectionsCol(user.uid)
      .orderBy("updatedAt", "desc")
      .get();

  const inspections = liveAuditsSnapshot.docs.map(document => ({
    id: document.id,
    ...document.data()
  }));

  state.db.inspections = inspections;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ inspections })
  );

  rebuildAnalyticsFromInspections(inspections);

  renderSavedList();
  refreshEngineerDropdown();
  refreshEngineerDatalist();
}

function startCloudSync() {
  const user = getUser();

  if (cloudUnsub) {
    cloudUnsub();
  }

  cloudUnsub = inspectionsCol(user.uid)
    .orderBy("updatedAt", "desc")
    .onSnapshot(
      snapshot => {
        const inspections = snapshot.docs.map(document => ({
          id: document.id,
          ...document.data()
        }));

        state.db.inspections = inspections;

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ inspections })
        );

        /*
          Rebuild Analytics from the complete current Firebase
          snapshot. Deleted inspections therefore disappear too.
        */
        rebuildAnalyticsFromInspections(inspections);

        renderSavedList();
        refreshEngineerDropdown();
        refreshEngineerDatalist();
      },
      error => {
        console.error(
          "Firebase inspection sync failed:",
          error
        );
      }
    );
}

function startHsCloudSync() {
  if (!cloudSignedIn()) {
    return;
  }

  /*
    Stop any old H&S listeners before
    starting a fresh set.
  */
  hsCloudUnsubs.forEach(
    unsubscribe => {
      try {
        unsubscribe();
      } catch {}
    }
  );

  hsCloudUnsubs = [];

  const user =
    getUser();


  /* ================================
     H&S AUDIT REGISTER
     ================================ */

  hsCloudUnsubs.push(
    hsAuditRegisterCloudCol(
      user.uid
    ).onSnapshot(
      snapshot => {
        hsAuditRegisterState.records =
          snapshot.docs.map(
            document => {
              const data =
                document.data() || {};

              const {
                updatedAt,
                ...record
              } = data;

              return {
                ...record,

                id:
                  record.id ||
                  document.id
              };
            }
          );

        saveHsAuditRegisterState();

        renderHsAuditRegister();
        renderHsAuditOverview();
      },

      error => {
        console.error(
          "H&S Audit Register live sync failed:",
          error
        );
      }
    )
  );


  /* ================================
     H&S AUDIT HISTORY
     ================================ */

  hsCloudUnsubs.push(
    hsAuditHistoryCloudCol(
      user.uid
    ).onSnapshot(
      snapshot => {
        hsAuditHistory =
          snapshot.docs.map(
            document => {
              const data =
                document.data() || {};

              const {
                updatedAt,
                ...audit
              } = data;

              return {
                ...audit,

                id:
                  audit.id ||
                  document.id
              };
            }
          );

        saveHsAuditHistoryLocal();

        renderHsAuditHistory();
        renderHsAuditOverview();
      },

      error => {
        console.error(
          "H&S Audit History live sync failed:",
          error
        );
      }
    )
  );


  /* ================================
     H&S AUDIT PENDING UPDATES
     ================================ */

  hsCloudUnsubs.push(
    hsAuditRegisterMetaRef(
      user.uid
    ).onSnapshot(
      snapshot => {
        if (!snapshot.exists) {
          return;
        }

        const data =
          snapshot.data() || {};

        if (
          Array.isArray(
            data.pendingExcelUpdates
          )
        ) {
          hsAuditPendingUpdates =
            data.pendingExcelUpdates;

          saveHsAuditPendingUpdatesLocal();

          renderHsAuditPendingUpdates();
        }
      },

      error => {
        console.error(
          "H&S Audit settings live sync failed:",
          error
        );
      }
    )
  );


  /* ================================
     CALIBRATION
     ================================ */

  hsCloudUnsubs.push(
    hsCalibrationCloudCol(
      user.uid
    ).onSnapshot(
      snapshot => {
        hsCalibrationState.records =
          snapshot.docs.map(
            document => {
              const data =
                document.data() || {};

              const {
                updatedAt,
                ...record
              } = data;

              return {
                ...record,

                id:
                  record.id ||
                  document.id
              };
            }
          );

        saveHsCalibrationState();

        renderHsCalibration();

        if (
          typeof renderHsCalibrationOverview ===
            "function"
        ) {
          renderHsCalibrationOverview();
        }

        setHsCalibrationCloudStatus(
          `Live synced • ${
            hsCalibrationState.records.length
          } analyser${
            hsCalibrationState.records.length ===
            1
              ? ""
              : "s"
          }.`,
          "good"
        );
      },

      error => {
        console.error(
          "Calibration live sync failed:",
          error
        );
      }
    )
  );


  /* ================================
     CALIBRATION SETTINGS /
     PENDING UPDATES
     ================================ */

  hsCloudUnsubs.push(
    hsCalibrationMetaRef(
      user.uid
    ).onSnapshot(
      snapshot => {
        if (!snapshot.exists) {
          return;
        }

        const data =
          snapshot.data() || {};

        if (
          Array.isArray(
            data.pendingExcelUpdates
          )
        ) {
          hsCalibrationPendingUpdates =
            data.pendingExcelUpdates;

          saveHsCalibrationPendingUpdatesLocal();

          renderHsCalibrationPendingUpdates();
          renderHsCalibration();
        }
      },

      error => {
        console.error(
          "Calibration settings live sync failed:",
          error
        );
      }
    )
  );


  /* ================================
     WARNING NOTICES
     ================================ */

  hsCloudUnsubs.push(
    hsWarningNoticesCloudCol(
      user.uid
    ).onSnapshot(
      snapshot => {
        hsWarningState.records =
          snapshot.docs.map(
            document => {
              const data =
                document.data() || {};

              const {
                updatedAt,
                ...record
              } = data;

              return {
                ...record,

                id:
                  record.id ||
                  document.id
              };
            }
          );

        saveHsWarningState();

        renderHsWarningNotices();

        setHsWarningCloudStatus(
          `Live synced • ${
            hsWarningState.records.length
          } Warning Notice record${
            hsWarningState.records.length ===
            1
              ? ""
              : "s"
          }.`,
          "good"
        );
      },

      error => {
        console.error(
          "Warning Notices live sync failed:",
          error
        );
      }
    )
  );
}
function stopCloudSync() {
  if (cloudUnsub) cloudUnsub();
  cloudUnsub = null;

  hsCloudUnsubs.forEach(
    unsubscribe => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn(
          "H&S listener could not be stopped:",
          error
        );
      }
    }
  );

  hsCloudUnsubs = [];
}

async function upsertInspectionCloud(ins) {
  const u = getUser();
  const now = new Date().toISOString();
  const ref = inspectionsCol(u.uid).doc(ins.id);

  const payload = {
    ...ins,
    updatedAt: now,
    createdAt: ins.createdAt || now
  };

  await ref.set(payload, { merge: true });
}

async function deleteInspectionCloud(id) {
  const u = getUser();
  await inspectionsCol(u.uid).doc(id).delete();
}

// Convert a dataURL to Blob (for Storage upload)
async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return await res.blob();
}

// ---------- Init ----------
window.addEventListener("DOMContentLoaded", init);

function init() {

   // Defects CSV + typeahead
initDefectsLibrary().then(() => {
  initDefectsTypeahead();
});

// Boilers CSV + typeahead
initBoilersLibrary().then(() => {
  initBoilerTypeahead();

  });
      initDefectsImportButton();
   initAnalytics();
initExecutiveDashboard();
initHealthSafety();
initHsAuditRegister();
initHsCalibration();
initHsWarningNotices();
initPerformanceWorkbookImport();
initPerformanceRecordManager();
initPerformanceExplorer();
initHistoricalAuditImport();
   initQuarterlyPowerPointGenerator();

  if (el("rangeSelect")) {
    el("rangeSelect").value = "qCurrent";
  }
  
  const today = new Date();
  el("dateInput").value = today.toISOString().slice(0, 10);

  const dark = localStorage.getItem("ppc_dark_mode") === "true";
  el("darkModeToggle").checked = dark;
  applyDarkMode(dark);

  el("darkModeToggle").addEventListener("change", () => {
    const enabled = el("darkModeToggle").checked;
    localStorage.setItem("ppc_dark_mode", String(enabled));
    applyDarkMode(enabled);
  });

  el("newInspectionBtn").addEventListener("click", newInspection);
  el("saveInspectionBtn").addEventListener("click", saveCurrentInspection);

  el("addPositiveBtn").addEventListener("click", () => openModal("positive"));
  el("addFindingBtn").addEventListener("click", () => openModal("finding"));

  initQuickPositiveTemplates();
  
  el("closeModalBtn").addEventListener("click", closeModal);
  el("cancelModalBtn").addEventListener("click", closeModal);
  el("modalBackdrop").addEventListener("click", closeModal);
  el("saveModalBtn").addEventListener("click", saveModalItem);
  el("deleteItemBtn").addEventListener("click", deleteModalItem);
  // -------- Cloud login / logout ----------
if (el("loginBtn")) {
  el("loginBtn").addEventListener("click", async () => {
    const email = prompt("Email:", "lex@fake.com");

    if (!email) return;
    const password = prompt("Password:");
    if (!password) return;

    try {
      await auth.signInWithEmailAndPassword(email.trim(), password);
      alert("Logged in. Cloud sync is on.");
    } catch (err) {
      console.error(err);
      alert("Login failed. Check email/password in Firebase Auth.");
    }
  });
}
// ✅ Persist engineer summary edits so they affect print/share next time
if (el("engineerOutput")) {
  el("engineerOutput").addEventListener("input", () => {
    saveEngineerDraftFromBox();
  });
}

if (el("logoutBtn")) {
  el("logoutBtn").addEventListener("click", async () => {
    try {
      await auth.signOut();
      alert("Logged out. Using local device storage only.");
    } catch (err) {
      console.error(err);
      alert("Logout failed.");
    }
  });
}

// When auth state changes, start/stop sync and toggle buttons
auth.onAuthStateChanged(async user => {
  if (user) {
    

    if (el("loginBtn")) {
      el("loginBtn").classList.add(
        "hidden"
      );
    }

    if (el("logoutBtn")) {
      el("logoutBtn").classList.remove(
        "hidden"
      );
    }

  try {
  await initialiseCloudAnalyticsArchive();

startCloudSync();
startHsCloudSync();

 /*
  Load the current Calibration register
  from Firebase whenever a user logs in.

  If Firebase is empty, the loader will
  safely upload any existing local data.
*/
if (
  typeof loadHsCalibrationFromCloud ===
    "function"
) {
  await loadHsCalibrationFromCloud();
}

if (
  typeof loadHsCalibrationAlertSettingsFromCloud ===
    "function"
) {
  await loadHsCalibrationAlertSettingsFromCloud();
}
    if (
  typeof loadHsCalibrationPendingUpdatesFromCloud ===
    "function"
) {
  await loadHsCalibrationPendingUpdatesFromCloud();
}
    if (
  typeof loadHsAuditRegisterFromCloud ===
    "function"
) {
  await loadHsAuditRegisterFromCloud();
}
  if (
  typeof loadHsAuditHistoryFromCloud ===
    "function"
) {
  await loadHsAuditHistoryFromCloud();
}
    if (
  typeof loadHsWarningNoticesFromCloud ===
    "function"
) {
  await loadHsWarningNoticesFromCloud();
}
} catch (err) {
  console.error(
    "Analytics cloud sync failed:",
    err
  );

  /*
    Start the live listener anyway, because a later Firebase
    snapshot may still load successfully.
  */
  startCloudSync();

  alert(
    "Logged in, but the Firebase audit data could not be loaded. Check the browser console and Firebase permissions."
  );
}
 } else {
  stopCloudSync();

  if (
    typeof setHsCalibrationCloudStatus ===
    "function"
  ) {
    setHsCalibrationCloudStatus(
      "Local only • Log in to sync calibration data to Firebase.",
      "warning"
    );
  }

    if (el("loginBtn")) {
      el("loginBtn").classList.remove(
        "hidden"
      );
    }

    if (el("logoutBtn")) {
      el("logoutBtn").classList.add(
        "hidden"
      );
    }
  }
});

// Photo input (Finding modal)
async function handleFindingPhotoPicked(file) {
  if (!file) return;

  try {
    // Preview (compressed)
  state.modalPhotoDataUrl = await fileToCompressedDataUrl(file, 800, 0.68);


    setPhotoPreview(state.modalPhotoDataUrl);

    // Upload to Cloudinary (save URL)
    state.modalPhotoUrl = await uploadCompressedDataUrlToCloudinary(state.modalPhotoDataUrl);

  } catch (err) {
    console.error(err);
    alert("Photo upload failed. Try again.");

    state.modalPhotoDataUrl = "";
    state.modalPhotoUrl = "";
    setPhotoPreview("");
  }
}

// Take Photo button -> triggers camera input
if (el("takePhotoBtn") && el("findingPhotoCamera")) {
  el("takePhotoBtn").addEventListener("click", () => {
    el("findingPhotoCamera").click();
  });

  el("findingPhotoCamera").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    handleFindingPhotoPicked(file);
    e.target.value = ""; // allows taking another photo immediately
  });
}

// Choose Photo button -> triggers library input
if (el("choosePhotoBtn") && el("findingPhotoLibrary")) {
  el("choosePhotoBtn").addEventListener("click", () => {
    el("findingPhotoLibrary").click();
  });

  el("findingPhotoLibrary").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    handleFindingPhotoPicked(file);
    e.target.value = "";
  });
}



if (el("removeFindingPhotoBtn")) {
  el("removeFindingPhotoBtn").addEventListener("click", () => {
   state.modalPhotoDataUrl = "";
state.modalPhotoUrl = "";
setPhotoPreview("");

// Clear BOTH file inputs (Option 2)
if (el("findingPhotoCamera")) el("findingPhotoCamera").value = "";
if (el("findingPhotoLibrary")) el("findingPhotoLibrary").value = "";
  });
}


  // Tabs
  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  // Output controls
  el("verbalStyleSelect").addEventListener("change", renderOutputs);
  el("verbalLengthSelect").addEventListener("change", renderOutputs);

  el("copyVerbalBtn").addEventListener("click", () => copyToClipboard(el("verbalOutput").value)
);
  // ✅ Persist verbal edits + use last line as Close-out override
el("verbalOutput").addEventListener("input", () => {
  const text = el("verbalOutput").value;

  // Save the entire edited verbal script for next time
  state.current.verbalOverride = text;

  // Use the last non-empty line as the Close-out line
  state.current.closeOutOverride = lastNonEmptyLine(text);

  // Update report immediately
  renderReportPreview();
});

  el("copyReportBtn").addEventListener("click", () => copyToClipboard(buildReportText()));
el("emailReportBtn").addEventListener("click", async () => {
  try {
    pullFormIntoCurrent();
    const c = state.current;

    const filename = `PPC-Inspection-Report${c.jobRef ? "-" + c.jobRef : ""}${c.engineer ? "-" + c.engineer.replace(/\s+/g, "_") : ""}.pdf`;
   const pdfBlob = await buildPdfFromHtml(buildPrintableReportHTML(), filename);



    const file = new File([pdfBlob], filename, { type: "application/pdf" });

    // If share-with-file is supported (mobile/tablet best case)
    if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
      await navigator.share({
        title: "Inspection Feedback Report",
        text: "Inspection report PDF attached.",
        files: [file]
      });
      return;
    }

    // Fallback: download PDF (desktop / older browsers)
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    alert("PDF downloaded. Attach it to your email.");
  } catch (err) {
    console.error(err);
    alert("Could not create/share the PDF. Check console for details.");
  }
});
// -------- Share HTML (single scrollable sheet) ----------
if (el("shareReportHtmlBtn")) {
  el("shareReportHtmlBtn").addEventListener("click", async () => {
    try {
      pullFormIntoCurrent();
      const c = state.current;

      const filename = `PPC-Inspection-Report${c.jobRef ? "-" + c.jobRef : ""}${c.engineer ? "-" + c.engineer.replace(/\s+/g, "_") : ""}.html`;
      const inner = buildPrintableReportHTML(); // includes watermark + content
      const doc = wrapAsStandaloneHtml(inner, "Inspection Feedback Report");

      await shareOrDownloadHtmlFile(doc, filename);
    } catch (err) {
      console.error(err);
      alert("Could not create/share the HTML report. Check console for details.");
    }
  });
}

if (el("shareEngineerHtmlBtn")) {
  el("shareEngineerHtmlBtn").addEventListener("click", async () => {
    try {
     ensureEngineerSummaryReady(); // uses edits if present; generates only if empty


      const engineer = el("engineerSelect")?.value?.trim() || "Engineer";
      const range = (rangeLabel() || "").replace(/\s+/g, "_");
      const filename = `PPC-Engineer-Summary-${engineer.replace(/\s+/g, "_")}-${range}.html`;

      const inner = buildPrintableEngineerHTML();
      const doc = wrapAsStandaloneHtml(inner, "Engineer Summary Report");

      await shareOrDownloadHtmlFile(doc, filename);
    } catch (err) {
      console.error(err);
      alert("Could not create/share the Engineer HTML report. Check console for details.");
    }
  });
}


el("printReportBtn").addEventListener("click", async () => {
  // Build the print HTML with the latest values
  pullFormIntoCurrent();

  const pa = el("printArea");
  pa.innerHTML = "";
  pa.innerHTML = buildPrintableReportHTML();
  pa.classList.remove("hidden");

  // ✅ wait 1 paint + wait for ALL images (watermark + Cloudinary photos)
  await new Promise(requestAnimationFrame);
  await waitForImages(pa, 4000);

  const restore = () => {
    pa.classList.add("hidden");
    pa.innerHTML = "";
  };
  window.addEventListener("afterprint", restore, { once: true });

  // ✅ print after content is ready
  setTimeout(() => window.print(), 50);
});
  
 // Saved
el("exportAllBtn").addEventListener("click", exportAllJson);
el("emailSelectedBtn").addEventListener("click", async () => {
  await emailSelectedReports();
});

el("clearAllBtn").addEventListener("click", clearAll);


  // Engineers tab
if (el("rangeSelect")) {
  el("rangeSelect").addEventListener("change", () => {
  onRangeChange();
  loadOrGenerateEngineerSummary();
});

if (el("engineerSelect")) {
  el("engineerSelect").addEventListener("change", () => {
    loadOrGenerateEngineerSummary();
  });
}

    el("generateEngineerBtn").addEventListener("click", () => {
  const currentText = el("engineerOutput")?.value?.trim();

  if (currentText) {
    const ok = confirm("Generate a fresh summary? This will replace your current edited notes for this engineer/range.");
    if (!ok) return;
  }

  generateEngineerSummary();
});
    el("copyEngineerBtn").addEventListener("click", () => copyToClipboard(el("engineerOutput").value)
);
   el("printEngineerBtn").addEventListener("click", async () => {
  const send = confirm(
    "Send Engineer PDF?\n\nOK = Send (share/email PDF)\nCancel = Print / Save PDF"
  );


  // =========================
  // OK = SEND PDF
  // =========================
  if (send) {
    try {
      // Ensure summary is up to date
      ensureEngineerSummaryReady();


      const engineer = el("engineerSelect")?.value?.trim() || "Engineer";
      const range = (rangeLabel() || "").replace(/\s+/g, "_");
      const filename = `PPC-Engineer-Summary-${engineer.replace(/\s+/g, "_")}-${range}.pdf`;

    const pdfBlob = await buildEngineerPdfSplit(buildPrintableEngineerHTML(), filename);




      const file = new File([pdfBlob], filename, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({
          title: "Engineer Summary Report",
          text: "Engineer summary PDF attached.",
          files: [file]
        });
        return;
      }

      // Fallback: download
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      alert("PDF downloaded. Attach it to your email.");
      return;
    } catch (err) {
      console.error(err);
      alert("Could not create/share the Engineer PDF. Check console for details.");
      return;
    }
  }

  // =========================
  // Cancel = PRINT / SAVE PDF (existing behaviour)
  // =========================

  document.querySelectorAll("#printArea").forEach((node, i) => {
    if (i > 0) node.remove();
  });
ensureEngineerSummaryReady();

  const pa = el("printArea");
 pa.innerHTML = "";
pa.innerHTML = buildPrintableEngineerHTML();
pa.classList.remove("hidden");

await new Promise(requestAnimationFrame);
await waitForImages(pa, 4000);

const restore = () => {
  pa.classList.add("hidden");
  pa.innerHTML = "";
};
window.addEventListener("afterprint", restore, { once: true });

setTimeout(() => window.print(), 50);
});





  }

  // Start with a new inspection
   newInspection();
  renderSavedList();
  refreshEngineerDropdown();       // ✅ always sync
  renderEngineerPanelPlaceholder();

  // ✅ Engineer typeahead setup (ghost + datalist)
  refreshEngineerDatalist();
  renderEngineerGhost();

  // Ghost updates as you type
  el("engineerInput").addEventListener("input", renderEngineerGhost);
el("engineerInput").addEventListener("change", () => {
  commitEngineerSelection(el("engineerInput").value, true);
});
  // Tab or → accepts ghost suggestion
  el("engineerInput").addEventListener("keydown", (e) => {
    if ((e.key === "Tab" || e.key === "ArrowRight") && acceptEngineerGhost()) {
      e.preventDefault();
    }
  });

  // On blur, snap to existing engineer spelling if it matches one
  el("engineerInput").addEventListener("blur", () => {
    el("engineerInput").value = canonicalFromPool(el("engineerInput").value);
    renderEngineerGhost();
  });
}


// ---------- Dark mode ----------
function applyDarkMode(enabled) {
  document.body.classList.toggle("light", !enabled);
}

// ---------- Data model ----------
function makeNewInspection() {
  return {
    id: uid(),
    createdAt: new Date().toISOString(),
    engineer: "",
    jobRef: "",
    address: "",
    appliance: "",
    date: el("dateInput")?.value || new Date().toISOString().slice(0,10),
    outcome: "Work & Documentation Correct",
    positives: [],
    findings: [],
    verbalOverride: "",
    closeOutOverride: ""
  };
}


function loadDb() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { inspections: [] };
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.inspections)) return { inspections: [] };
    return parsed;
  } catch {
    return { inspections: [] };
  }
}

function saveDb() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.db));
}

// ---------- New / load / save ----------
function newInspection() {
  state.current = makeNewInspection();
  writeFormFromCurrent();
  renderLists();
  renderOutputs();
  refreshEngineerDropdown(); // ✅ so Engineers tab sees current engineer immediately
  resetFindingModalFields();

}

function writeFormFromCurrent() {
  const c = state.current;
  el("engineerInput").value = c.engineer;
  el("jobRefInput").value = c.jobRef;
  el("addressInput").value = c.address;
  el("applianceInput").value = c.appliance;
  el("dateInput").value = c.date;
  el("outcomeSelect").value = c.outcome;
    renderEngineerGhost();


  el("engineerInput").oninput = () => { c.engineer = el("engineerInput").value; renderOutputs(); renderSavedList(); refreshEngineerDropdown(); };
  el("jobRefInput").oninput = () => { c.jobRef = el("jobRefInput").value; renderOutputs(); renderSavedList(); };
  el("addressInput").oninput = () => { c.address = el("addressInput").value; renderOutputs(); };
  el("applianceInput").oninput = () => { c.appliance = el("applianceInput").value; renderOutputs(); };
  el("dateInput").onchange = () => { c.date = el("dateInput").value; renderOutputs(); renderSavedList(); };
  el("outcomeSelect").onchange = () => { c.outcome = el("outcomeSelect").value; renderOutputs(); };
}

function pullFormIntoCurrent() {
  const c = state.current;
  c.engineer = canonicalFromPool(el("engineerInput").value);

  c.jobRef = el("jobRefInput").value.trim();
  c.address = el("addressInput").value.trim();
  c.appliance = el("applianceInput").value.trim();
  c.date = el("dateInput").value;
  c.outcome = el("outcomeSelect").value;
}

function getInspectionDataQualityChecks(
  inspection
) {
  const errors = [];
  const warnings = [];

  const findings = Array.isArray(
    inspection.findings
  )
    ? inspection.findings
    : [];

  const positives = Array.isArray(
    inspection.positives
  )
    ? inspection.positives
    : [];

  /*
    Required inspection details
  */
  if (
    !String(
      inspection.engineer || ""
    ).trim()
  ) {
    errors.push(
      "Engineer name is missing."
    );
  }

  if (
    !String(
      inspection.jobRef || ""
    ).trim()
  ) {
    errors.push(
      "Job reference is missing."
    );
  }

  if (
    !String(
      inspection.date || ""
    ).trim()
  ) {
    errors.push(
      "Inspection date is missing."
    );
  }

  /*
    Stop an inspection being accidentally
    recorded with a future date.
  */
  if (inspection.date) {
    const today = new Date()
      .toISOString()
      .slice(0, 10);

    if (inspection.date > today) {
      errors.push(
        "Inspection date is in the future."
      );
    }
  }

  /*
    A failing audit would normally require
    at least one recorded finding.
  */
  if (
  !isPassingOutcome(
    inspection.outcome
  ) &&
  findings.length === 0
) {
  warnings.push(
    "The outcome is FAIL, but no findings have been added."
  );
}

/*
  AR and ID findings should normally result
  in a failed audit outcome.
*/
const hasArOrIdFinding =
  findings.some(finding => {
    const severity = String(
      finding.severity || ""
    ).trim();

    return (
      severity === "Major" ||
      severity === "Critical"
    );
  });

if (
  hasArOrIdFinding &&
  isPassingOutcome(
    inspection.outcome
  )
) {
  warnings.push(
    "An AR or ID finding has been recorded, but the overall audit outcome is currently PASS."
  );
}

  /*
    Check every individual finding.
  */
  const validSeverities = new Set([
    "Critical",
    "Major",
    "Minor",
    "Advisory"
  ]);

  findings.forEach(
    (finding, index) => {
      const findingNumber =
        index + 1;

      const title = String(
        finding.title || ""
      ).trim();

      const category = String(
        finding.category || ""
      ).trim();

      const severity = String(
        finding.severity || ""
      ).trim();

      const action = String(
        finding.action || ""
      ).trim();

      if (!title) {
        errors.push(
          `Finding ${findingNumber} does not have a title.`
        );
      }

      if (
        !severity ||
        !validSeverities.has(severity)
      ) {
        errors.push(
          `Finding ${findingNumber} has an invalid severity.`
        );
      }

      if (!category) {
        warnings.push(
          `Finding ${findingNumber} does not have a category.`
        );
      }
    }
  );

  /*
    Positive feedback is recommended, but
    it should not prevent a legitimate audit
    from being saved.
  */
  if (positives.length === 0) {
    warnings.push(
      "No positive feedback has been added."
    );
  }

  /*
    Warn when the same job reference already
    exists on a different saved inspection.

    The current inspection is excluded so that
    editing and resaving it does not trigger a
    false duplicate warning.
  */
  const normalizedJobReference =
    String(
      inspection.jobRef || ""
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  if (normalizedJobReference) {
    const duplicateInspection =
      (
        state.db.inspections || []
      ).find(savedInspection => {
        if (
          savedInspection.id ===
          inspection.id
        ) {
          return false;
        }

        const savedJobReference =
          String(
            savedInspection.jobRef || ""
          )
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

        return (
          savedJobReference ===
          normalizedJobReference
        );
      });

    if (duplicateInspection) {
      const duplicateDetails = [
        duplicateInspection.engineer,
        duplicateInspection.date
          ? formatDate(
              duplicateInspection.date
            )
          : ""
      ]
        .filter(Boolean)
        .join(" • ");

      warnings.push(
        duplicateDetails
          ? `Job reference "${inspection.jobRef}" is already used on another saved audit (${duplicateDetails}).`
          : `Job reference "${inspection.jobRef}" is already used on another saved audit.`
      );
    }
  }

  return {
    errors,
    warnings
  };
}

function formatInspectionQualityList(
  items
) {
  return items
    .map(
      (item, index) =>
        `${index + 1}. ${item}`
    )
    .join("\n");
}

async function saveCurrentInspection() {
  pullFormIntoCurrent();

  const c = state.current;

  const qualityChecks =
    getInspectionDataQualityChecks(c);

  /*
    Errors prevent saving.
  */
  if (qualityChecks.errors.length) {
    alert(
      [
        "This inspection cannot be saved yet.",
        "",
        formatInspectionQualityList(
          qualityChecks.errors
        ),
        "",
        "Please correct the items above and try again."
      ].join("\n")
    );

    return;
  }

  /*
    Warnings can be overridden by the user.
  */
  if (qualityChecks.warnings.length) {
    const saveDespiteWarnings =
      confirm(
        [
          "Data quality warnings",
          "",
          formatInspectionQualityList(
            qualityChecks.warnings
          ),
          "",
          "Save this inspection anyway?"
        ].join("\n")
      );

    if (!saveDespiteWarnings) {
      return;
    }
  }

  const idx =
    state.db.inspections.findIndex(
      inspection =>
        inspection.id === c.id
    );

  if (idx >= 0) {
    state.db.inspections[idx] =
      structuredClone(c);
  } else {
    state.db.inspections.unshift(
      structuredClone(c)
    );
  }

  archiveInspectionForAnalytics(
    structuredClone(c)
  );

  saveDb();
  renderSavedList();
  refreshEngineerDropdown();
  refreshEngineerDatalist();

  /*
    Cloud save if logged in.
  */
  if (cloudSignedIn()) {
    try {
      const inspectionCopy =
        structuredClone(c);

      await upsertInspectionCloud(
        inspectionCopy
      );

      await syncInspectionAnalyticsCloud(
        inspectionCopy
      );
    } catch (err) {
      console.error(err);

      alert(
        "The audit was saved locally, but part of the cloud sync failed. Check the browser console and Firebase permissions."
      );

      return;
    }
  }

  alert(
    cloudSignedIn()
      ? "Saved (cloud sync on)."
      : "Saved (local only)."
  );
}


function loadInspectionById(id) {
  const found = state.db.inspections.find(x => x.id === id);
  if (!found) return;

  state.current = structuredClone(found);
  writeFormFromCurrent();
  renderLists();
  renderOutputs();
  refreshEngineerDropdown(); // ✅ keep engineer selection in sync
  setTab("verbal");
}

function deleteInspectionById(id) {
  const ok = confirm("Delete this saved inspection?");
  if (!ok) return;
  state.db.inspections = state.db.inspections.filter(x => x.id !== id);
    saveDb();
  // ✅ Cloud delete if logged in
if (cloudSignedIn()) {
  deleteInspectionCloud(id).catch((err) => {
    console.error(err);
    alert("Deleted locally, but cloud delete failed.");
  });
}

  renderSavedList();
  refreshEngineerDropdown();
  refreshEngineerDatalist(); // ✅ update suggestions list


  if (state.current?.id === id) newInspection();
}

// ---------- Lists rendering ----------
function renderLists() {
  renderPositives();
  renderFindings();
}
function initQuickPositiveTemplates() {
  const positivesList = el("positivesList");
  if (!positivesList) return;

  if (document.getElementById("quickPositiveTemplates")) return;

  const wrap = document.createElement("div");
  wrap.id = "quickPositiveTemplates";
  wrap.style.display = "flex";
  wrap.style.flexWrap = "wrap";
  wrap.style.gap = "8px";
  wrap.style.margin = "10px 0 12px";

  const templates = [
    "Clean and tidy work",
    "No additional defects found",
    "Good attention to detail",
    "Appliance well serviced",
    "Tenant happy with work",
    "LGSR completed accurately"
  ];

  templates.forEach(text => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn ghost small";
    btn.textContent = text;

    btn.addEventListener("click", () => {
      if (!state.current) return;

      state.current.positives.push({
        id: uid(),
        text
      });

      renderLists();
      renderOutputs();
    });

    wrap.appendChild(btn);
  });

  positivesList.parentNode.insertBefore(wrap, positivesList);
}
function updateNoPositivesWarning() {
  const positivesList = el("positivesList");
  if (!positivesList) return;

  let warning = el("noPositivesWarning");

  if (!warning) {
    warning = document.createElement("div");
    warning.id = "noPositivesWarning";
    warning.style.margin = "8px 0 10px";
    warning.style.padding = "10px 12px";
    warning.style.borderRadius = "12px";
    warning.style.background = "rgba(245, 158, 11, 0.12)";
    warning.style.color = "#92400e";
    warning.style.fontWeight = "bold";
    warning.style.fontSize = "0.9rem";
    warning.textContent = "⚠️ No positives added — add at least one where possible.";

    positivesList.parentNode.insertBefore(warning, positivesList);
  }

  const hasPositives = (state.current?.positives || []).length > 0;
  warning.classList.toggle("hidden", hasPositives);
}
function renderPositives() {
  const list = el("positivesList");
  list.innerHTML = "";
  const positives = state.current.positives || [];
updateNoPositivesWarning();
  
  el("positivesEmpty").classList.toggle("hidden", positives.length > 0);

  positives.forEach(p => {
    const row = document.createElement("div");
    row.className = "item";

    row.innerHTML = `
      <div class="left">
        <div class="title">${escapeHtml(p.text)}</div>
        <div class="meta">Positive</div>
      </div>
      <div class="badges">
        <button class="btn ghost small" type="button" data-edit="${p.id}">Edit</button>
      </div>
    `;

    row.querySelector("[data-edit]").addEventListener("click", () => openModal("positive", p.id));
    list.appendChild(row);
  });
}

function renderFindings() {
  const list = el("findingsList");
  list.innerHTML = "";
  const findings = state.current.findings || [];

  el("findingsEmpty").classList.toggle("hidden", findings.length > 0);

  const sorted = sortFindingsBySeverity(findings);

  sorted.forEach(f => {
    const row = document.createElement("div");
    row.className = "item";

    const sevClass = "sev-" + (f.severity || "").toLowerCase();

    row.innerHTML = `
      <div class="left">
        <div class="title">${escapeHtml(f.title || "(No title)")}</div>
      <div class="meta">${escapeHtml(f.category)} • ${escapeHtml(severityLabel(f.severity))} • Tag: ${escapeHtml(f.tag || "OTHER")}</div>


        <div class="badges">
          <span class="badge ${sevClass}">${escapeHtml(severityLabel(f.severity))}</span>

          <span class="badge">${escapeHtml(f.category)}</span>
          <span class="badge">Tag: ${escapeHtml(f.tag || "OTHER")}</span>
        </div>
      </div>
      <div class="badges">
        <button class="btn ghost small" type="button" data-edit="${f.id}">Edit</button>
      </div>
    `;

    row.querySelector("[data-edit]").addEventListener("click", () => openModal("finding", f.id));
    list.appendChild(row);
  });
}

// ---------- Saved list ----------
function renderSavedList() {
  const container = el("savedList");
  container.innerHTML = "";

  const allItems = state.db.inspections || [];

  let filterWrap = document.getElementById("savedEngineerFilterWrap");

  if (!filterWrap) {
    filterWrap = document.createElement("div");
    filterWrap.id = "savedEngineerFilterWrap";
    filterWrap.style.margin = "0 0 14px 0";
    filterWrap.style.display = "flex";
    filterWrap.style.flexDirection = "column";
    filterWrap.style.gap = "6px";

    filterWrap.innerHTML = `
      <label for="savedEngineerFilter" style="font-weight:bold; color:#5b2396;">
        Filter by engineer
      </label>
      <select id="savedEngineerFilter" style="
        width:100%;
        padding:12px;
        border-radius:14px;
        border:1px solid #ddd;
        font-weight:bold;
        background:white;
      ">
        <option value="">All Engineers</option>
      </select>
    `;

    container.parentNode.insertBefore(filterWrap, container);
  }

  const filterSelect = document.getElementById("savedEngineerFilter");
  const previousValue = filterSelect ? filterSelect.value : "";

  const engineers = Array.from(
    new Map(
      allItems
        .map(i => (i.engineer || "").trim())
        .filter(Boolean)
        .map(name => [normalizeEngineer(name), name])
    ).values()
  ).sort((a, b) => a.localeCompare(b));

  if (filterSelect) {
    filterSelect.innerHTML = `<option value="">All Engineers</option>`;

    engineers.forEach(name => {
      const opt = document.createElement("option");
      opt.value = normalizeEngineer(name);
      opt.textContent = name;
      filterSelect.appendChild(opt);
    });

    filterSelect.value = previousValue;

    filterSelect.onchange = () => {
      renderSavedList();
    };
  }

  const selectedEngineer = filterSelect ? filterSelect.value : "";

  const items = selectedEngineer
    ? allItems.filter(ins => normalizeEngineer(ins.engineer || "") === selectedEngineer)
    : allItems;

  el("savedEmpty").classList.toggle("hidden", items.length > 0);

  if (!items.length) {
    refreshEngineerDropdown();
    refreshEngineerDatalist();
    updateSelectedCount();
    return;
  }

  const grouped = new Map();

  items.forEach(ins => {
    const engineer = ins.engineer || "Unnamed engineer";
    const key = normalizeEngineer(engineer) || "unnamed";
    if (!grouped.has(key)) grouped.set(key, { name: engineer, audits: [] });
    grouped.get(key).audits.push(ins);
  });

  Array.from(grouped.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(group => {
      group.audits.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

      const section = document.createElement("div");
      section.className = "saved-engineer-section";
      section.style.marginBottom = "14px";

      section.innerHTML = `
        <details ${selectedEngineer ? "open" : ""}>
          <summary style="
            cursor:pointer;
            font-weight:bold;
            color:#5b2396;
            background:rgba(106,13,173,0.08);
            padding:12px;
            border-radius:14px;
            margin-bottom:10px;
          ">
            ${escapeHtml(group.name)} — ${group.audits.length} audit${group.audits.length === 1 ? "" : "s"}
          </summary>
          <div class="saved-engineer-cards"></div>
        </details>
      `;

      const cardsWrap = section.querySelector(".saved-engineer-cards");

      group.audits.forEach(ins => {
        const card = document.createElement("div");
        card.className = "saved-card";

        const title = `${ins.jobRef || "No job ref"}`;
        const meta = `${formatDate(ins.date)} • ${ins.outcome || "Outcome"} • ${ins.findings?.length || 0} findings`;

        card.innerHTML = `
          <div>
            <h4>${escapeHtml(title)}</h4>
            <p>${escapeHtml(meta)}</p>
          </div>

          <div class="badges">
            <label class="select-toggle" title="Select for email">
              <input class="saved-select" type="checkbox" data-select="${ins.id}" />
              <span class="select-icon" aria-hidden="true">✉️</span>
            </label>

            <button class="btn ghost small" type="button" data-load="${ins.id}">Load</button>
            <button class="btn danger small" type="button" data-del="${ins.id}">Delete</button>
          </div>
        `;

        card.querySelector("[data-load]").addEventListener("click", () => loadInspectionById(ins.id));
        card.querySelector("[data-del]").addEventListener("click", () => deleteInspectionById(ins.id));

        const cb = card.querySelector(".saved-select");
        if (cb) cb.addEventListener("change", updateSelectedCount);

        cardsWrap.appendChild(card);
      });

      container.appendChild(section);
    });

  refreshEngineerDropdown();
  refreshEngineerDatalist();
  updateSelectedCount();
}
function resetFindingModalFields() {
  if (el("findingCategory")) el("findingCategory").value = "Flue";
  if (el("findingSeverity")) el("findingSeverity").value = "Major";
  if (el("findingTag")) el("findingTag").value = "OTHER";
  if (el("findingStatus")) el("findingStatus").value = "Open";

  if (el("findingTitle")) el("findingTitle").value = "";
  if (el("findingDue")) el("findingDue").value = "48 hours";
  if (el("findingWhy")) el("findingWhy").value = "";
  if (el("findingAction")) el("findingAction").value = "";
  if (el("findingNotes")) el("findingNotes").value = "";

  // Photo state reset
  state.modalPhotoDataUrl = "";
  if (el("findingPhoto")) el("findingPhoto").value = "";
  setPhotoPreview("");
}
if (el("repeatIssueIndicator")) {
  el("repeatIssueIndicator").textContent = "";
  el("repeatIssueIndicator").classList.add("hidden");
}


// ---------- Modal logic ----------
function openModal(type, id = null) {
  state.editingModal = { type, id };

  el("modalBackdrop").classList.remove("hidden");
  el("modal").classList.remove("hidden");

  el("modalPositiveFields").classList.toggle("hidden", type !== "positive");
  el("modalFindingFields").classList.toggle("hidden", type !== "finding");
  el("deleteItemBtn").classList.toggle("hidden", !id);

  if (type === "positive") {
    el("modalTitle").innerText = id ? "Edit positive" : "Add positive";
    const existing = id ? state.current.positives.find(x => x.id === id) : null;
    el("positiveTextInput").value = existing?.text || "";
    el("positiveTextInput").focus();
 } else {
  el("modalTitle").innerText = id ? "Edit finding" : "Add finding";
  const existing = id ? state.current.findings.find(x => x.id === id) : null;

  if (!existing) {
    // ✅ New finding = hard reset every field
    resetFindingModalFields();
  } else {
    // ✅ Editing an existing finding
    if (el("findingCategory")) el("findingCategory").value = existing.category || "Flue";
    if (el("findingSeverity")) el("findingSeverity").value = existing.severity || "Major";
    if (el("findingTag")) el("findingTag").value = existing.tag || "OTHER";
    if (el("findingStatus")) el("findingStatus").value = existing.status || "Open";

    if (el("findingTitle")) el("findingTitle").value = existing.title || "";
    if (el("findingDue")) el("findingDue").value = existing.due || "48 hours";
    if (el("findingWhy")) el("findingWhy").value = existing.why || "";
    if (el("findingAction")) el("findingAction").value = existing.action || "";
    if (el("findingNotes")) el("findingNotes").value = existing.notes || "";

  // Photo (prefer cloud URL, fall back to local dataUrl if you ever have one)
state.modalPhotoDataUrl = existing.photoDataUrl || "";
state.modalPhotoUrl = existing.photoUrl || "";

if (el("findingPhoto")) el("findingPhoto").value = "";

// Preview: show cloud URL if present, otherwise dataUrl
setPhotoPreview(state.modalPhotoUrl || state.modalPhotoDataUrl);

  }

  if (el("findingTitle")) el("findingTitle").focus();
}

}

function closeModal() {
  el("modalBackdrop").classList.add("hidden");
  el("modal").classList.add("hidden");

  state.modalPhotoDataUrl = "";
 state.modalPhotoUrl = "";
  if (el("findingPhoto")) el("findingPhoto").value = "";
  setPhotoPreview("");

  state.editingModal = null;
}


async function saveModalItem() {
  const meta = state.editingModal;
  if (!meta) return;

  if (meta.type === "positive") {
    const text = el("positiveTextInput").value.trim();
    if (!text) { alert("Add a positive note."); return; }

    if (meta.id) {
      const p = state.current.positives.find(x => x.id === meta.id);
      if (p) p.text = text;
    } else {
      state.current.positives.push({ id: uid(), text });
    }

  } else {
   const titleEl = el("findingTitle");
const title = (titleEl ? titleEl.value : "").trim();
if (!title) { alert("Add a finding title (what you saw)."); return; }

// ✅ Make sure we have a stable finding id
const findingId = meta.id || uid();

// ✅ If user clicked Save before Cloudinary finished, wait and upload now
if (state.modalPhotoDataUrl && !state.modalPhotoUrl) {
  try {
    state.modalPhotoUrl = await uploadCompressedDataUrlToCloudinary(state.modalPhotoDataUrl);
  } catch (err) {
    console.error(err);
    alert("Photo upload failed. The finding will save, but without the cloud photo link.");
    state.modalPhotoUrl = "";
  }
}



  const obj = {
  id: findingId,

  category: el("findingCategory").value,
  severity: el("findingSeverity").value,
  tag: el("findingTag") ? el("findingTag").value : "OTHER",
  status: el("findingStatus") ? el("findingStatus").value : "Open",
    title: title,
due: el("findingDue") ? el("findingDue").value : "48 hours",

  why: el("findingWhy").value.trim(),
  action: el("findingAction").value.trim(),
  notes: el("findingNotes").value.trim(),
 photoDataUrl: "", // keep empty to avoid huge storage
photoUrl: state.modalPhotoUrl || ""



};


    if (meta.id) {
      const idx = state.current.findings.findIndex(x => x.id === meta.id);
      if (idx >= 0) state.current.findings[idx] = obj;
    } else {
      state.current.findings.push(obj);
    }
  }

  closeModal();
  renderLists();
  renderOutputs();
}

function deleteModalItem() {
  const meta = state.editingModal;
  if (!meta || !meta.id) return;

  const ok = confirm("Delete this item?");
  if (!ok) return;

  if (meta.type === "positive") {
    state.current.positives = state.current.positives.filter(x => x.id !== meta.id);
  } else {
    state.current.findings = state.current.findings.filter(x => x.id !== meta.id);
  }

  closeModal();
  renderLists();
  renderOutputs();
}

// ---------- Outputs ----------
function renderOutputs() {
  // If the user has edited the verbal box, keep their edits
  const generated = buildVerbalScript();
  const hasOverride = (state.current?.verbalOverride || "").trim().length > 0;

  el("verbalOutput").value = hasOverride ? state.current.verbalOverride : generated;

  renderReportPreview();
}

function closeOutLineForStyle(style, hasFindings) {
  const s = (style || "matey").toLowerCase();

  // Match the Verbal logic when there are NO findings
  if (!hasFindings) {
    if (s === "matey") return "Nothing for me to pull you up on — keep doing what you’re doing.";
    return "No findings recorded.";
  }

  // Match the Verbal "close" lines when there ARE findings
  if (s === "neutral") return "Please address the items above and confirm once completed.";
  if (s === "direct") return "Sort these items by the due date and confirm completion.";
  return "Get those sorted and give me a shout — I’m happy to re-check / review it with you.";
}
function buildCloseOutFromInspection(c, style) {
  const s = String(style || "matey").toLowerCase();
  const positives = c?.positives || [];
  const findings = sortFindingsBySeverity(c?.findings || []);
  const hasFindings = findings.length > 0;

  if (!hasFindings) {
    if (s === "matey") return "Nothing for me to pull you up on — keep doing what you’re doing.";
    return "No findings recorded.";
  }

  const blob = positives
    .map(p => String((p && p.text) || "").toLowerCase())
    .join(" | ");

  const hasPaperwork =
    /\blgsr\b|\bbenchmark\b|\bpaperwork\b|\bcertificate\b|\brecord\b|\bdetail\b|\baccurate\b|\baccuracy\b/.test(blob);

  const hasCleanWork =
    /\bclean\b|\btidy\b|\bspotless\b|\bneat\b|\bwell\s*serviced\b|\bserviced\b|\bto\s*spec\b|\bspecification\b|\btrap\b|\binjector\b/.test(blob);

  const hasTenantPraise =
    /\btenant\b|\bcustomer\b|\bclient\b|\bhomeowner\b|\bcompliment\b|\bcomplimentary\b|\bhappy\b|\bpleased\b|\bsatisfied\b/.test(blob);

  const hasThoroughness =
    /\bawkward\b|\bnot\s*many\b|\bpicked\s*up\b|\battention\b|\bdetail\b|\bthorough\b|\bexcellent\b|\bvery\s*good\b/.test(blob);

  const focus = [];
  const seen = new Set();

  for (const f of findings) {
    const t = String(f?.title || "").trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    focus.push(t);
    if (focus.length >= 2) break;
  }

  const parts = [];

  const p1 = [];
  if (s === "matey") p1.push("Overall, good work.");
  else if (s === "direct") p1.push("Overall: good standard, with a few items to correct.");
  else p1.push("Overall, a good standard of work with a few improvements required.");

  if (hasCleanWork) p1.push("The work itself is coming across clean, tidy, and to spec.");
  if (hasPaperwork) p1.push("Your LGSR/paperwork is being completed accurately with a good level of detail.");
  if (hasTenantPraise) p1.push("Tenant/customer feedback is positive — people are happy with the work and how it’s been left.");
  if (hasThoroughness) p1.push("You’re also picking up on the awkward details that others can miss, which is exactly what we want.");

  parts.push(p1.join(" "));

  const p2 = [];
  if (focus.length) {
    if (s === "direct") p2.push(`Focus on: ${focus.join(" • ")}.`);
    else p2.push(`Main bits to tighten up: ${focus.join(" • ")}.`);
  } else {
    if (s === "direct") p2.push("Focus on the items listed above.");
    else p2.push("Main bits to tighten up are the items listed above.");
  }

  p2.push(`If those are treated as “every job checks”, you’ll fly through audits.`);

  parts.push(p2.join(" "));

  return parts.join("\n\n");
}

function buildVerbalScript() {
  pullFormIntoCurrent();
  const c = state.current;

  const style = el("verbalStyleSelect").value;
  const length = el("verbalLengthSelect").value;

  const positives = c.positives || [];
  const findings = sortFindingsBySeverity(c.findings || []);
  const hasActions = findings.length > 0;

  const opener = (() => {
    if (!hasActions) return "Overall, it’s a tidy job — nice one.";
    if (c.outcome === "Requires revisit") return "Overall, mate, it needs a bit of attention before we can call it done.";
    return "Overall, it’s a decent job — just a couple of bits to tighten up so it’s spot on.";
  })();

  const toneBits = {
    matey: {
      bridge: "The main things to focus on are:",
      goodLead: "What you’ve done well:",
      betterIf: "Good, but it would be better if",
      close: "Get those sorted and give me a shout — I’m happy to re-check / review it with you."
    },
    neutral: {
      bridge: "Key points to address:",
      goodLead: "Positives observed:",
      betterIf: "Improvement needed:",
      close: "Please address the items above and confirm once completed."
    },
    direct: {
      bridge: "These need sorting:",
      goodLead: "Good points:",
      betterIf: "This needs correcting:",
      close: "Sort these items by the due date and confirm completion."
    }
  }[style];

  const lines = [];
  lines.push(opener);

  if (length === "full") {
    lines.push("");
    lines.push(toneBits.bridge);
    lines.push(`- Outcome: ${c.outcome}`);
    if (c.engineer) lines.push(`- Engineer: ${c.engineer}`);
    if (c.jobRef) lines.push(`- Job ref: ${c.jobRef}`);
  }

  if (positives.length) {
    lines.push("");
    lines.push(toneBits.goodLead);
    positives.slice(0, length === "quick" ? 2 : 6).forEach(p => lines.push(`- ${p.text}`));
  }

  if (findings.length) {
    lines.push("");
    lines.push(style === "matey" ? "Now, just a few improvements:" : "Findings:");

    findings.slice(0, length === "quick" ? 3 : 12).forEach((f, idx) => {
      if (style === "matey") lines.push(`${idx + 1}) ${toneBits.betterIf}: ${f.title}.`);
      else lines.push(`${idx + 1}) ${f.title} (${f.category}, ${f.severity}).`);


      if (length === "full") {
        if (f.why) lines.push(`   • Why it matters: ${f.why}`);
        if (f.action) lines.push(`   • Action: ${f.action}`);
      } else {
        if (f.action) lines.push(`   • Action: ${f.action}`);
      }
    });

    lines.push("");
      lines.push("");
    // Close-out (match the report close-out message)
    lines.push(buildCloseOutFromInspection(c, style));

  } else {
    lines.push("");
    lines.push(style === "matey"
      ? "Nothing for me to pull you up on — keep doing what you’re doing."
      : "No findings recorded.");
  }

  return lines.join("\n");
}

function renderReportPreview() {
  pullFormIntoCurrent();
  const c = state.current;

  el("reportMeta").innerHTML = `
    <div><strong>Date:</strong> ${escapeHtml(formatDate(c.date))}</div>
    <div><strong>Engineer:</strong> ${escapeHtml(c.engineer || "—")}</div>
    <div><strong>Job ref:</strong> ${escapeHtml(c.jobRef || "—")}</div>
    <div><strong>Site:</strong> ${escapeHtml(c.address || "—")}</div>
    <div><strong>Appliance:</strong> ${escapeHtml(c.appliance || "—")}</div>
    <div><strong>Outcome:</strong> ${escapeHtml(c.outcome || "—")}</div>
  `;

  const positives = c.positives || [];
  const findings = sortFindingsBySeverity(c.findings || []);

  const parts = [];
 



 if (positives.length) {
  parts.push(`<div class="rp-section-title">What was done well</div>`);
  parts.push(`<ul class="rp-list">${positives.map(p => `<li>${escapeHtml(p.text)}</li>`).join("")}</ul>`);
}


  parts.push(`<div class="rp-section-title">Findings & required actions</div>`);
  if (!findings.length) {
    parts.push(`<div class="rp-small">No findings recorded.</div>`);
 } else {
  findings.forEach(f => {
    parts.push(`
      <div class="rp-block">
        <div><strong>${escapeHtml(f.title)}</strong></div>
    <div class="rp-small">
  ${escapeHtml(f.category)} • <strong>${escapeHtml(severityLabel(f.severity))}</strong> • Tag: ${escapeHtml(f.tag || "OTHER")}
</div>



        ${f.why ? `<div class="rp-small"><strong>Why it matters:</strong> ${escapeHtml(f.why)}</div>` : ""}
        ${f.action ? `<div class="rp-small"><strong>Action:</strong> ${escapeHtml(f.action)}</div>` : ""}
        ${f.notes ? `<div class="rp-small"><strong>Notes:</strong> ${escapeHtml(f.notes)}</div>` : ""}
        ${photoHtml(f, "#e2e2e2")}

      </div>
    `);
  });
}


const style = el("verbalStyleSelect")?.value || "matey";
const hasFindings = findings.length > 0;

parts.push(`<div class="rp-section-title">Close-out</div>`);
parts.push(`<div class="rp-small">${escapeHtml(getCloseOutForCurrent(style, hasFindings, c))}</div>`);

  el("reportBody").innerHTML = parts.join("");
}

function buildReportText() {
  pullFormIntoCurrent();
  const c = state.current;

  const positives = c.positives || [];
  const findings = sortFindingsBySeverity(c.findings || []);

  const lines = [];
  lines.push("INSPECTION FEEDBACK REPORT");
  lines.push("—");
  lines.push(`Date: ${formatDate(c.date)}`);
  lines.push(`Engineer: ${c.engineer || "—"}`);
  lines.push(`Job ref: ${c.jobRef || "—"}`);
  lines.push(`Site: ${c.address || "—"}`);
  lines.push(`Appliance: ${c.appliance || "—"}`);
  lines.push(`Outcome: ${c.outcome || "—"}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push(summaryLine(c));
  lines.push("");

  lines.push("WHAT WAS DONE WELL");
  if (!positives.length) lines.push("- (No positives recorded)");
  else positives.forEach(p => lines.push(`- ${p.text}`));
  lines.push("");

  lines.push("FINDINGS & REQUIRED ACTIONS");
  if (!findings.length) {
    lines.push("- (No findings recorded)");
  } else {
    findings.forEach((f, i) => {
      lines.push(`${i + 1}. ${f.title}`);
    lines.push(`   Category: ${f.category} | Severity: ${severityLabel(f.severity)} | Tag: ${f.tag || "OTHER"}`);


      if (f.why) lines.push(`   Why it matters: ${f.why}`);
      if (f.action) lines.push(`   Action: ${f.action}`);
      if (f.notes) lines.push(`   Notes: ${f.notes}`);
      lines.push("");
    });
  }

  lines.push("CLOSE-OUT");
  lines.push("Please confirm once actions are complete. If a revisit is required, arrange a suitable time for reinspection.");

  return lines.join("\n");
}
async function buildPdfFromHtml(html, filename) {
  // Build printArea content
  const pa = el("printArea");
  pa.innerHTML = html;
  pa.classList.remove("hidden");

  // Switch into PDF export layout
  document.body.classList.add("pdf-export");

  // Wait for watermark image (and any other images) to load
  const imgs = Array.from(pa.querySelectorAll("img"));
  await Promise.all(imgs.map(img => new Promise((resolve) => {
    if (img.complete) return resolve();
    img.addEventListener("load", resolve, { once: true });
    img.addEventListener("error", resolve, { once: true });
    setTimeout(resolve, 1500);
  })));

  // jsPDF (UMD)
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

  // Render the printArea into PDF (auto pages)
  await doc.html(pa, {
    x: 24,
    y: 24,
    html2canvas: { scale: 2, useCORS: true },
    autoPaging: "text"
  });

  // Cleanup
  document.body.classList.remove("pdf-export");
  pa.classList.add("hidden");
  pa.innerHTML = "";

  // Return as Blob
  return doc.output("blob");
}

function getWatermarkHTML() {
  const logoUrl = resolveLogoUrl();
  if (!logoUrl) return "";

  return `
    <div class="print-watermark" aria-hidden="true">
      <img src="${logoUrl}" alt="" crossorigin="anonymous" referrerpolicy="no-referrer" />
    </div>
  `;
}





function buildPrintableReportHTML() {
  // Always use the same proven report builder (with watermark + photos)
  pullFormIntoCurrent();
  return buildPrintableReportHTMLFromInspection(structuredClone(state.current));
}

function buildPrintableReportHTMLFromInspection(ins) {
  const c = ins;

  const positives = c.positives || [];
  const findings = sortFindingsBySeverity(c.findings || []);
  const esc = escapeHtml;

  const metaHtml = `
    <div><strong>Date:</strong> ${esc(formatDate(c.date))}</div>
    <div><strong>Engineer:</strong> ${esc(c.engineer || "—")}</div>
    <div><strong>Job ref:</strong> ${esc(c.jobRef || "—")}</div>
    <div><strong>Site:</strong> ${esc(c.address || "—")}</div>
    <div><strong>Appliance:</strong> ${esc(c.appliance || "—")}</div>
    <div><strong>Outcome:</strong> ${esc(c.outcome || "—")}</div>
  `;

  const positivesHtml = positives.length
  ? `<div class="box">
       <h3>What was done well</h3>
       <ul>${positives.map(p => `<li>${esc(p.text)}</li>`).join("")}</ul>
     </div>`
  : ``;


  const findingsHtml = findings.length
    ? findings.map(f => `
        <div class="rp-block">
          <div><strong>${esc(f.title)}</strong></div>
       <div class="rp-small">
  ${esc(f.category)} • <strong>${esc(severityLabel(f.severity))}</strong> • Tag: ${esc(f.tag || "OTHER")}
</div>



          ${f.why ? `<div class="rp-small"><strong>Why it matters:</strong> ${esc(f.why)}</div>` : ""}
          ${f.action ? `<div class="rp-small"><strong>Action:</strong> ${esc(f.action)}</div>` : ""}
          ${f.notes ? `<div class="rp-small"><strong>Notes:</strong> ${esc(f.notes)}</div>` : ""}
          ${photoHtml(f, "#e2e2e2")}
        </div>
      `).join("")
    : `<div class="muted">No findings recorded.</div>`;

  return `
    ${getWatermarkHTML()}
    <div class="print-content">
      <h1>Inspection Feedback Report</h1>

      <div class="muted">
        ${metaHtml}
      </div>

      <div class="box">
        <h3>Summary</h3>
        <div>${esc(summaryLine(c, { hideZeroPositives: true }))}</div>

      </div>

      ${positivesHtml}


      <div class="box findings-box">
  <h3>Findings & required actions</h3>
  ${findingsHtml}
</div>


   <div class="box">
  <h3>Close-out</h3>
  <div>${esc((c.closeOutOverride || "").trim() || buildCloseOutFromInspection(c, el("verbalStyleSelect")?.value || "matey"))}</div>

</div>
    </div>
  `;
}
// =========================================================
// ENGINEER VISUAL ANALYTICS
// =========================================================

function isFullPassAudit(audit) {
  return String(audit?.outcome || "").trim() ===
    "Work & Documentation Correct";
}
function normalizeAnalyticsDefectTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_/\\\-(),.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getAllAuditsForEngineer(engineerName) {
  const target = normalizeEngineer(engineerName);

  return (state.db.inspections || [])
    .filter(a => normalizeEngineer(a.engineer || "") === target)
    .slice()
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
}

function getPreviousPeriodAudits(engineerName) {
  const all = getAllAuditsForEngineer(engineerName);
  const range = el("rangeSelect")?.value || "qCurrent";
  const today = new Date();

  if (range === "last5") {
    return all.slice(-10, -5);
  }

  if (range === "last6") {
    return all.slice(-12, -6);
  }

  if (
    range === "qCurrent" ||
    range === "q1" ||
    range === "q2" ||
    range === "q3" ||
    range === "q4"
  ) {
    const currentYear = today.getFullYear();

    const selectedQuarter =
      range === "qCurrent"
        ? getCurrentQuarter(today)
        : range === "q1"
          ? 1
          : range === "q2"
            ? 2
            : range === "q3"
              ? 3
              : 4;

    let previousQuarter = selectedQuarter - 1;
    let previousYear = currentYear;

    if (previousQuarter === 0) {
      previousQuarter = 4;
      previousYear--;
    }

    const { start, end } = getQuarterRange(
      previousYear,
      previousQuarter
    );

    return all.filter(a => {
      const date = parseDateSafe(a.date);
      return date && date >= start && date <= end;
    });
  }

  if (range === "custom") {
    const selectedFrom = parseDateSafe(el("rangeFrom")?.value);
    const selectedTo = parseDateSafe(el("rangeTo")?.value);

    if (!selectedFrom || !selectedTo) {
      return [];
    }

    const currentStart = new Date(selectedFrom);
    currentStart.setHours(0, 0, 0, 0);

    const currentEnd = new Date(selectedTo);
    currentEnd.setHours(23, 59, 59, 999);

    const durationMilliseconds =
      currentEnd.getTime() - currentStart.getTime() + 1;

    const previousEnd = new Date(currentStart.getTime() - 1);

    const previousStart = new Date(
      previousEnd.getTime() - durationMilliseconds + 1
    );

    return all.filter(a => {
      const date = parseDateSafe(a.date);
      return date && date >= previousStart && date <= previousEnd;
    });
  }

  return [];
}

function getPreviousPeriodLabel() {
  const range = el("rangeSelect")?.value || "qCurrent";
  const today = new Date();

  if (range === "last5") {
    return "Previous 5 audits";
  }

  if (range === "last6") {
    return "Previous 6 audits";
  }

  if (
    range === "qCurrent" ||
    range === "q1" ||
    range === "q2" ||
    range === "q3" ||
    range === "q4"
  ) {
    const selectedQuarter =
      range === "qCurrent"
        ? getCurrentQuarter(today)
        : range === "q1"
          ? 1
          : range === "q2"
            ? 2
            : range === "q3"
              ? 3
              : 4;

    const previousQuarter =
      selectedQuarter === 1 ? 4 : selectedQuarter - 1;

    const previousYear =
      selectedQuarter === 1
        ? today.getFullYear() - 1
        : today.getFullYear();

    return `${quarterLabel(previousQuarter)} ${previousYear}`;
  }

  if (range === "custom") {
    return "Previous equivalent period";
  }

  return "Previous period";
}

function getEngineerMonthlyTrend(audits) {
  const months = new Map();

  (Array.isArray(audits) ? audits : []).forEach(audit => {
    const date = parseDateSafe(audit.date);
    if (!date) return;

    const key =
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!months.has(key)) {
      months.set(key, {
        key,
        label: date.toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric"
        }),
        audits: 0,
        passes: 0,
        defects: 0
      });
    }

    const month = months.get(key);

    month.audits++;
    month.defects += Array.isArray(audit.findings)
      ? audit.findings.length
      : 0;

    if (isFullPassAudit(audit)) {
      month.passes++;
    }
  });

  return Array.from(months.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(month => ({
      ...month,
      passRate: month.audits
        ? Math.round((month.passes / month.audits) * 100)
        : 0
    }));
}

function analyticsDifference(currentValue, previousValue, suffix = "") {
  const current = Number(currentValue) || 0;
  const previous = Number(previousValue) || 0;
  const difference = current - previous;

  if (Math.abs(difference) < 0.005) {
    return `No change`;
  }

  const rounded = Number.isInteger(difference)
    ? difference
    : Number(difference.toFixed(2));

  return difference > 0
    ? `▲ +${rounded}${suffix}`
    : `▼ ${rounded}${suffix}`;
}

function analyticsChangeClass(
  currentValue,
  previousValue,
  lowerIsBetter = false
) {
  const current = Number(currentValue) || 0;
  const previous = Number(previousValue) || 0;

  if (Math.abs(current - previous) < 0.005) {
    return "";
  }

  const improved = lowerIsBetter
    ? current < previous
    : current > previous;

  return improved ? "analytics-change-good" : "analytics-change-bad";
}
function getEngineerAnalytics(audits) {
  const safeAudits = Array.isArray(audits) ? audits : [];

  const analytics = {
    totalAudits: safeAudits.length,
    passedAudits: 0,
    failedAudits: 0,
    passRate: 0,
    totalDefects: 0,
    defectsPerAudit: 0,

    repeatedDefectTitles: 0,
    repeatOccurrences: 0,
    repeatRate: 0,

    severities: {
      ID: 0,
      AR: 0,
      NCS: 0,
      Advisory: 0
    },

    defectTitles: {}
  };

  safeAudits.forEach(audit => {
    if (isFullPassAudit(audit)) {
      analytics.passedAudits++;
    } else {
      analytics.failedAudits++;
    }

    const findings = Array.isArray(audit.findings)
      ? audit.findings
      : [];

    analytics.totalDefects += findings.length;

    findings.forEach(finding => {
      const severity =
        String(finding.severity || "").trim();

      if (severity === "Critical" || severity === "ID") {
        analytics.severities.ID++;
      } else if (
        severity === "Major" ||
        severity === "AR"
      ) {
        analytics.severities.AR++;
      } else if (
        severity === "Minor" ||
        severity === "NCS"
      ) {
        analytics.severities.NCS++;
      } else if (
        severity.toLowerCase() === "advisory"
      ) {
        analytics.severities.Advisory++;
      }

      const rawTitle = String(
        finding.title ||
        finding.tag ||
        "Unspecified defect"
      ).trim();

      const title = rawTitle || "Unspecified defect";

      const key =
        normalizeAnalyticsDefectTitle(title) ||
        "unspecified defect";

      if (!analytics.defectTitles[key]) {
        analytics.defectTitles[key] = {
          title,
          count: 0,
          auditIds: new Set()
        };
      }

      analytics.defectTitles[key].count++;

      if (audit.id) {
        analytics.defectTitles[key].auditIds.add(audit.id);
      }
    });
  });

  analytics.passRate = analytics.totalAudits
    ? Math.round(
        (analytics.passedAudits / analytics.totalAudits) * 100
      )
    : 0;

  analytics.defectsPerAudit = analytics.totalAudits
    ? analytics.totalDefects / analytics.totalAudits
    : 0;

  const defectEntries =
    Object.values(analytics.defectTitles);

  const repeatedEntries = defectEntries.filter(
    item => item.count > 1
  );

  analytics.repeatedDefectTitles =
    repeatedEntries.length;

  analytics.repeatOccurrences =
    repeatedEntries.reduce(
      (sum, item) => sum + (item.count - 1),
      0
    );

  analytics.repeatRate = analytics.totalDefects
    ? Math.round(
        (
          analytics.repeatOccurrences /
          analytics.totalDefects
        ) * 100
      )
    : 0;

  analytics.topDefects = defectEntries
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.title.localeCompare(b.title);
    })
    .slice(0, 5)
    .map(item => ({
      title: item.title,
      count: item.count,
      auditCount: item.auditIds.size
    }));

  analytics.monthlyTrend =
    getEngineerMonthlyTrend(safeAudits);

  return analytics;
}

function engineerAnalyticsBarRow(label, value, maximum) {
  const safeValue = Number(value) || 0;
  const safeMaximum = Math.max(Number(maximum) || 0, 1);

  const percentage = safeValue > 0
    ? Math.max(4, Math.round((safeValue / safeMaximum) * 100))
    : 0;

  return `
    <div class="engineer-chart-row">
      <div class="engineer-chart-label">
        <span class="engineer-chart-name">${escapeHtml(label)}</span>
        <span class="engineer-chart-value">${safeValue}</span>
      </div>

      <div class="engineer-chart-track">
        <div
          class="engineer-chart-fill"
          style="width:${percentage}%"
        ></div>
      </div>
    </div>
  `;
}

function buildEngineerAnalyticsHTML(audits) {
  const stats = getEngineerAnalytics(audits);

  if (!stats.totalAudits) {
    return `
      <div class="engineer-analytics-empty">
        No audit analytics are available for this engineer in the selected range.
      </div>
    `;
  }

  const engineer =
    el("engineerSelect")?.value?.trim() || "";

  const previousAudits =
    getPreviousPeriodAudits(engineer);

  const previousStats =
    getEngineerAnalytics(previousAudits);

  const previousLabel =
    getPreviousPeriodLabel();

  const passWidth = stats.passRate;
  const failWidth = 100 - stats.passRate;

  const severityEntries = [
    ["ID", stats.severities.ID],
    ["AR", stats.severities.AR],
    ["NCS", stats.severities.NCS],
    ["Advisory", stats.severities.Advisory]
  ];

  const maximumSeverity = Math.max(
    1,
    ...severityEntries.map(item => item[1])
  );

  const severityRows = severityEntries
    .map(([label, count]) =>
      engineerAnalyticsBarRow(
        label,
        count,
        maximumSeverity
      )
    )
    .join("");

  const maximumDefect = Math.max(
    1,
    ...stats.topDefects.map(item => item.count)
  );

  const topDefectRows = stats.topDefects.length
    ? stats.topDefects
        .map(item =>
          engineerAnalyticsBarRow(
            item.title,
            item.count,
            maximumDefect
          )
        )
        .join("")
    : `<div class="rp-small">No defects were recorded.</div>`;

  const repeatDefectRows = stats.topDefects
    .filter(item => item.count > 1)
    .map(item => `
      <div class="engineer-chart-row">
        <div class="engineer-chart-label">
          <span class="engineer-chart-name">
            ${escapeHtml(item.title)}
          </span>

          <span class="engineer-chart-value">
            ${item.count} occurrences
          </span>
        </div>

        <div class="rp-small">
          Repeat occurrences: ${item.count - 1}
        </div>
      </div>
    `)
    .join("");

  const maximumMonthlyDefects = Math.max(
    1,
    ...stats.monthlyTrend.map(month => month.defects)
  );

  const monthlyTrendRows = stats.monthlyTrend.length
    ? stats.monthlyTrend.map(month => {
        const defectWidth = month.defects > 0
          ? Math.max(
              4,
              Math.round(
                (
                  month.defects /
                  maximumMonthlyDefects
                ) * 100
              )
            )
          : 0;

        return `
          <div class="engineer-month-row">
            <div class="engineer-month-heading">
              <strong>${escapeHtml(month.label)}</strong>

              <span>
                ${month.audits} audit${month.audits === 1 ? "" : "s"}
                • ${month.defects} defect${month.defects === 1 ? "" : "s"}
                • ${month.passRate}% PASS
              </span>
            </div>

            <div class="engineer-chart-track">
              <div
                class="engineer-chart-fill"
                style="width:${defectWidth}%"
              ></div>
            </div>
          </div>
        `;
      }).join("")
    : `
      <div class="rp-small">
        No dated audits are available for the monthly trend.
      </div>
    `;

  const comparisonHtml = previousStats.totalAudits
    ? `
      <div class="engineer-comparison-heading">
        <span>Selected period</span>
        <span>${escapeHtml(previousLabel)}</span>
        <span>Change</span>
      </div>

      <div class="engineer-comparison-row">
        <strong>Audits</strong>

        <span>
          ${stats.totalAudits} vs ${previousStats.totalAudits}
        </span>

        <span>
          ${analyticsDifference(
            stats.totalAudits,
            previousStats.totalAudits
          )}
        </span>
      </div>

      <div class="engineer-comparison-row">
        <strong>PASS rate</strong>

        <span>
          ${stats.passRate}% vs ${previousStats.passRate}%
        </span>

        <span class="${analyticsChangeClass(
          stats.passRate,
          previousStats.passRate
        )}">
          ${analyticsDifference(
            stats.passRate,
            previousStats.passRate,
            " pts"
          )}
        </span>
      </div>

      <div class="engineer-comparison-row">
        <strong>Total defects</strong>

        <span>
          ${stats.totalDefects} vs ${previousStats.totalDefects}
        </span>

        <span class="${analyticsChangeClass(
          stats.totalDefects,
          previousStats.totalDefects,
          true
        )}">
          ${analyticsDifference(
            stats.totalDefects,
            previousStats.totalDefects
          )}
        </span>
      </div>

      <div class="engineer-comparison-row">
        <strong>Defects per audit</strong>

        <span>
          ${stats.defectsPerAudit.toFixed(2)}
          vs
          ${previousStats.defectsPerAudit.toFixed(2)}
        </span>

        <span class="${analyticsChangeClass(
          stats.defectsPerAudit,
          previousStats.defectsPerAudit,
          true
        )}">
          ${analyticsDifference(
            stats.defectsPerAudit,
            previousStats.defectsPerAudit
          )}
        </span>
      </div>

      <div class="engineer-comparison-row">
        <strong>Repeat rate</strong>

        <span>
          ${stats.repeatRate}%
          vs
          ${previousStats.repeatRate}%
        </span>

        <span class="${analyticsChangeClass(
          stats.repeatRate,
          previousStats.repeatRate,
          true
        )}">
          ${analyticsDifference(
            stats.repeatRate,
            previousStats.repeatRate,
            " pts"
          )}
        </span>
      </div>
    `
    : `
      <div class="rp-small">
        No audits were found for ${escapeHtml(previousLabel.toLowerCase())}.
      </div>
    `;

  return `
    <div class="engineer-analytics-report">
      <h2 class="engineer-analytics-heading">
        Engineer Analytics
      </h2>

      <div class="engineer-kpi-grid">
        <div class="engineer-kpi-card">
          <span class="engineer-kpi-value">
            ${stats.totalAudits}
          </span>

          <span class="engineer-kpi-label">
            Audits
          </span>
        </div>

        <div class="engineer-kpi-card">
          <span class="engineer-kpi-value">
            ${stats.passRate}%
          </span>

          <span class="engineer-kpi-label">
            Full pass rate
          </span>
        </div>

        <div class="engineer-kpi-card">
          <span class="engineer-kpi-value">
            ${stats.totalDefects}
          </span>

          <span class="engineer-kpi-label">
            Total defects
          </span>
        </div>

        <div class="engineer-kpi-card">
          <span class="engineer-kpi-value">
            ${stats.defectsPerAudit.toFixed(2)}
          </span>

          <span class="engineer-kpi-label">
            Defects per audit
          </span>
        </div>

        <div class="engineer-kpi-card">
          <span class="engineer-kpi-value">
            ${stats.repeatOccurrences}
          </span>

          <span class="engineer-kpi-label">
            Repeat occurrences
          </span>
        </div>

        <div class="engineer-kpi-card">
          <span class="engineer-kpi-value">
            ${stats.repeatRate}%
          </span>

          <span class="engineer-kpi-label">
            Repeat defect rate
          </span>
        </div>
      </div>

      <div class="engineer-chart-grid">
        <div class="engineer-chart-card">
          <h3>PASS / FAIL audits</h3>

          <div class="engineer-pass-fail-bar">
            ${
              passWidth > 0
                ? `
                  <div
                    class="engineer-pass-section"
                    style="width:${passWidth}%"
                    title="${stats.passedAudits} full passes"
                  >
                    ${passWidth >= 18 ? `${passWidth}% PASS` : ""}
                  </div>
                `
                : ""
            }

            ${
              failWidth > 0
                ? `
                  <div
                    class="engineer-fail-section"
                    style="width:${failWidth}%"
                    title="${stats.failedAudits} failed audits"
                  >
                    ${failWidth >= 18 ? `${failWidth}% FAIL` : ""}
                  </div>
                `
                : ""
            }
          </div>

          <div class="engineer-chart-legend">
            <span>PASS: ${stats.passedAudits}</span>
            <span>FAIL: ${stats.failedAudits}</span>
          </div>
        </div>

        <div class="engineer-chart-card">
          <h3>Defects by severity</h3>
          ${severityRows}
        </div>

        <div
          class="engineer-chart-card"
          style="grid-column:1 / -1;"
        >
          <h3>Most common defects</h3>
          ${topDefectRows}
        </div>

        <div
          class="engineer-chart-card"
          style="grid-column:1 / -1;"
        >
          <h3>Repeat defect analysis</h3>

          <div class="engineer-repeat-summary">
            <div>
              <strong>${stats.repeatedDefectTitles}</strong>
              <span>Repeated defect types</span>
            </div>

            <div>
              <strong>${stats.repeatOccurrences}</strong>
              <span>Repeat occurrences</span>
            </div>

            <div>
              <strong>${stats.repeatRate}%</strong>
              <span>Repeat rate</span>
            </div>
          </div>

          ${
            repeatDefectRows ||
            `
              <div class="rp-small">
                No repeated defect titles were found in this period.
              </div>
            `
          }
        </div>

        <div
          class="engineer-chart-card"
          style="grid-column:1 / -1;"
        >
          <h3>Monthly trend</h3>

          <div class="rp-small engineer-chart-note">
            Bar length represents the number of defects recorded.
          </div>

          ${monthlyTrendRows}
        </div>

        <div
          class="engineer-chart-card"
          style="grid-column:1 / -1;"
        >
          <h3>
            Comparison with previous period
          </h3>

          <div class="rp-small engineer-chart-note">
            Compared with ${escapeHtml(previousLabel)}.
          </div>

          ${comparisonHtml}
        </div>
      </div>
    </div>
  `;
}

function renderEngineerAnalytics() {
  const panel = el("engineerAnalyticsPanel");
  if (!panel) return;

  const engineer = el("engineerSelect")?.value?.trim();

  if (!engineer) {
    panel.innerHTML = `
      <div class="engineer-analytics-empty">
        Choose an engineer to view their analytics.
      </div>
    `;
    return;
  }

  const audits = filterAuditsForEngineer(engineer);
  panel.innerHTML = buildEngineerAnalyticsHTML(audits);
}
function buildPrintableEngineerHTML() {
  refreshEngineerDropdown();

  const engineer = el("engineerSelect")?.value?.trim() || "—";
  const audits = filterAuditsForEngineer(engineer);

  const range = rangeLabel();
  const summaryText = el("engineerOutput")?.value?.trim() || "No summary generated.";
  const esc = escapeHtml;

  const totalFindings = audits.reduce((sum, a) => sum + ((a.findings || []).length), 0);
  const totalPositives = audits.reduce((sum, a) => sum + ((a.positives || []).length), 0);

  const auditsHtml = audits.length
    ? audits
        .slice()
        .sort((a,b) => (b.date || "").localeCompare(a.date || ""))
        .map(a => {
          const findings = sortFindingsBySeverity(a.findings || []);
          const positives = a.positives || [];
          const photosCount = findings.filter(f => !!(f.photoUrl || f.photoDataUrl)).length;

          const positivesHtml = positives.length
            ? `
              <div class="rp-section-title">Positives</div>
              <ul>
                ${positives.map(p => `<li>${esc(p.text || "")}</li>`).join("")}
              </ul>
            `
            : `<div class="rp-small">No positives recorded.</div>`;

          const findingsHtml = findings.length
            ? findings.map(f => `
              <div class="rp-block" style="break-inside:avoid; page-break-inside:avoid;">
                <div><strong>${esc(f.title || "(No title)")}</strong></div>
                <div class="rp-small">
                  ${esc(f.category || "—")} • <strong>${esc(severityLabel(f.severity || "—"))}</strong> • Tag: ${esc(f.tag || "OTHER")}
                </div>
                ${f.why ? `<div class="rp-small"><strong>Why it matters:</strong> ${esc(f.why)}</div>` : ""}
                ${f.action ? `<div class="rp-small"><strong>Action:</strong> ${esc(f.action)}</div>` : ""}
                ${f.notes ? `<div class="rp-small"><strong>Notes:</strong> ${esc(f.notes)}</div>` : ""}
                ${photoHtml(f, "#e2e2e2")}
              </div>
            `).join("")
            : `<div class="rp-small">No findings on this audit.</div>`;

          return `
            <div class="box audit-box" style="break-inside:avoid; page-break-inside:avoid;">
              <h3>${esc(formatDate(a.date))} — ${esc(a.jobRef || "No job ref")}</h3>

              <div class="muted">
                <div><strong>Outcome:</strong> ${esc(a.outcome || "—")}</div>
                <div><strong>Site:</strong> ${esc(a.address || "—")}</div>
                <div><strong>Appliance:</strong> ${esc(a.appliance || "—")}</div>
                <div><strong>Findings:</strong> ${findings.length} • <strong>Positives:</strong> ${positives.length} • <strong>Photos:</strong> ${photosCount}</div>
              </div>

              ${positivesHtml}

              <div class="rp-section-title">Findings</div>
              ${findingsHtml}
            </div>
          `;
        })
        .join("")
    : `<div class="box"><div class="rp-small">No audits found for this engineer in the selected range.</div></div>`;

  return `
    ${getWatermarkHTML()}

    <div class="print-content">

      <div id="engTop">
        <h1>Engineer Summary Report</h1>

        <div class="box">
          <h3>Overview</h3>
          <div class="muted">
            <div><strong>Engineer:</strong> ${esc(engineer)}</div>
            <div><strong>Range:</strong> ${esc(range)}</div>
            <div><strong>Generated:</strong> ${esc(formatDate(new Date().toISOString().slice(0,10)))}</div>
          </div>
        </div>

        <div class="box" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; text-align:center;">
          <div>
            <h3>${audits.length}</h3>
            <div class="rp-small">Audits</div>
          </div>
          <div>
            <h3>${totalFindings}</h3>
            <div class="rp-small">Findings</div>
          </div>
          <div>
            <h3>${totalPositives}</h3>
            <div class="rp-small">Positives</div>
          </div>
        </div>

                ${buildEngineerAnalyticsHTML(audits)}

        <div class="box">
          <h3>Feedback Summary</h3>
          <div style="white-space:pre-wrap; font-family:system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; font-size:13px; line-height:1.55;">
            ${esc(summaryText)}
          </div>
        </div>
      </div>

      <div id="engAudits" class="page-break-before">
        <h2>Audits Included</h2>
        ${auditsHtml}
      </div>

    </div>
  `;
}



// ---------- Engineers tab ----------
function refreshEngineerDropdown() {
  const sel = el("engineerSelect");
  if (!sel) return;

  const previous = sel.value;
  const preferred = normalizeEngineer(state.current?.engineer || "");

  // Build a map of normalizedName -> displayName (first seen)
  const map = new Map();
  (state.db.inspections || []).forEach(i => {
    const raw = (i.engineer || "").trim();
    const norm = normalizeEngineer(raw);
    if (!norm) return;
    if (!map.has(norm)) map.set(norm, raw);
  });

  // Also include current (even if not saved yet), so it appears instantly
  if (preferred) {
    const rawCurrent = (state.current.engineer || "").trim();
    if (rawCurrent) {
      const normCurrent = normalizeEngineer(rawCurrent);
      if (!map.has(normCurrent)) map.set(normCurrent, rawCurrent);
    }
  }

  const entries = Array.from(map.entries())
    .sort((a,b) => a[1].localeCompare(b[1]));

  sel.innerHTML = "";

  if (!entries.length) {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "No engineers yet (save audits first)";
    sel.appendChild(opt);
    return;
  }

  entries.forEach(([norm, display]) => {
    const opt = document.createElement("option");
    opt.value = display;       // keep display as value for readability
    opt.dataset.norm = norm;
    opt.textContent = display;
    sel.appendChild(opt);
  });

  // Auto-select: current engineer if possible, otherwise keep previous selection
  if (preferred) {
    const match = Array.from(sel.options).find(o => (o.dataset.norm || "") === preferred);
    if (match) sel.value = match.value;
  } else if (previous) {
    sel.value = previous;
    loadEngineerDraftIntoBox();
  }
}

function renderEngineerPanelPlaceholder() {
  const out = el("engineerOutput");
  if (!out) return;

  if (!(state.db.inspections || []).length) {
    out.innerText =
`No saved audits yet.

1) Create an audit
2) Add findings + Issue Tags
3) Save
4) Come back here to generate an engineer summary`;
    return;
  }

  out.innerText =
`Pick an engineer and click "Generate Summary".

Tip: For proper trends, try to consistently use Issue Tag (e.g. PAPERWORK_BENCHMARK, FLUE_SUPPORT).`;
}

function onRangeChange() {
  const range = el("rangeSelect").value;
  const showCustom = range === "custom";
  el("fromWrap").style.display = showCustom ? "" : "none";
  el("toWrap").style.display = showCustom ? "" : "none";

  if (showCustom) {
    const today = new Date().toISOString().slice(0, 10);
    if (!el("rangeTo").value) el("rangeTo").value = today;
    // load draft for this engineer+range if it exists
loadEngineerDraftIntoBox();
  }
}
function loadOrGenerateEngineerSummary() {
  // Preserve any manually edited engineer summary.
  if (!loadEngineerDraftIntoBox()) {
    generateEngineerSummary();
  }

  // Update the visual analytics shown beneath the summary.
  renderEngineerAnalytics();
}
function generateEngineerSummary() {
  refreshEngineerDropdown();

  const engineerSelect = el("engineerSelect");
  if (!engineerSelect) return;

  const engineer = engineerSelect.value?.trim();

  if (!engineer) {
    alert("No engineer selected.");
    return;
  }

  // 🔥 IMPORTANT: ONLY use dropdown value — ignore current inspection
  const audits = filterAuditsForEngineer(engineer);

  if (!audits.length) {
    el("engineerOutput").value = "No audits found for this engineer in the selected range.";
    return;
  }

  const summary = buildEngineerSummary(engineer, audits);

  el("engineerOutput").value = summary.text;

saveEngineerDraftFromBox();
renderEngineerAnalytics();
}

function filterAuditsForEngineer(engineerName) {
  const target = normalizeEngineer(engineerName);

  const all = (state.db.inspections || [])
    .filter(a => normalizeEngineer(a.engineer || "") === target)
    .sort((a,b) => (a.date || "").localeCompare(b.date || ""));

   const range = el("rangeSelect").value;
  const today = new Date();

  if (range === "last5") return all.slice(-5);
  if (range === "last6") return all.slice(-6);

  // Quarter filtering (uses current year)
  if (range === "qCurrent" || range === "q1" || range === "q2" || range === "q3" || range === "q4") {
    const year = today.getFullYear();
    const q =
      range === "qCurrent" ? getCurrentQuarter(today) :
      range === "q1" ? 1 :
      range === "q2" ? 2 :
      range === "q3" ? 3 : 4;

    const { start, end } = getQuarterRange(year, q);

    return all.filter(a => {
      const d = parseDateSafe(a.date);
      return d && d >= start && d <= end;
    });
  }

  if (range === "custom") {
    const from = parseDateSafe(el("rangeFrom").value);
    const to = parseDateSafe(el("rangeTo").value);
    if (!from || !to) return all;

    const toEnd = new Date(to);
    toEnd.setHours(23,59,59,999);

    return all.filter(a => {
      const d = parseDateSafe(a.date);
      return d && d >= from && d <= toEnd;
    });
  }

  return all;

}

function buildEngineerSummary(engineer, audits) {
  const outcomes = {
  "Work & Documentation Correct": 0,
  "Work FAIL - Documentation PASS": 0,
  "Work PASS - Documentation FAIL": 0,
  "Work FAIL - Documentation FAIL": 0
};

  const severityCounts = { Critical: 0, Major: 0, Minor: 0, Advisory: 0 };
  const categoryCounts = {};
  const tagCounts = {};
   const paperworkTagCounts = {}; // legacy bucket (we'll keep it)
  const documentationDefectCounts = {}; // ✅ counts defect titles for Documentation


// ✅ Defects (picked from Defects CSV library)
const defectCounts = {};

// Normalise titles to match even if spacing/punctuation differs slightly
const normDefectTitle = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[_/\\\-(),.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Build a Set of all defect titles from Defects.csv (so we only count those)
const defectsCsvTitleSet = new Set(
  (defectsLibrary || [])
    .map(d => normDefectTitle(d.title))
    .filter(Boolean)
);

    const trend = [];

  // ✅ Positives (keep original wording, count duplicates)
  const positiveMap = new Map(); // key(normalised) -> { text, count }


  // ✅ count repeated positives cleanly (case/spacing insensitive)
  const positiveCounts = {};

  let totalFindings = 0;
  let totalPositives = 0;

  let scoreSum = 0; // ✅ add this


  audits.forEach(a => {
    scoreSum += scoreAudit(a); // ✅ add this

    outcomes[a.outcome] = (outcomes[a.outcome] || 0) + 1;

        const positives = a.positives || [];
    const findings = a.findings || [];

    totalPositives += positives.length;
    totalFindings += findings.length;

    // ✅ Count positives (case/spacing insensitive, but store original text)
    positives.forEach(p => {
      const raw = String(p?.text || "").trim();
      if (!raw) return;

      const key = raw
        .toLowerCase()
        .replace(/[_/\\\-(),.]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      const prev = positiveMap.get(key);
      if (prev) prev.count += 1;
      else positiveMap.set(key, { text: raw, count: 1 });
    });


    // ✅ count positives by text (no optional chaining)
    positives.forEach(p => {
      const raw = String((p && p.text) || "").trim();
      if (!raw) return;

      const key = raw.toLowerCase().replace(/\s+/g, " ");
      positiveCounts[key] = (positiveCounts[key] || 0) + 1;
    });


    trend.push({
      date: a.date,
      jobRef: a.jobRef || "",
      findings: findings.length,
    });

    findings.forEach(f => {
      const sev = f.severity || "Minor";
      if (severityCounts[sev] !== undefined) severityCounts[sev]++;

      const cat = f.category || "Other";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

    const tag = (f.tag || "OTHER").toUpperCase();
tagCounts[tag] = (tagCounts[tag] || 0) + 1;

            // ✅ Documentation bucket (replaces old paperwork/benchmark logic)
      const isDocumentation =
        tag === "DOCUMENTATION" ||
        String(cat || "").trim().toLowerCase() === "documentation";

      if (isDocumentation) {
        // Count individual defect titles (what you actually want to show)
        const titleKey = String(f.title || "").trim();
        if (titleKey) {
          documentationDefectCounts[titleKey] = (documentationDefectCounts[titleKey] || 0) + 1;
        }
      }



// ✅ Count defects that match a Defects.csv title
const tNorm = normDefectTitle(f.title);
if (tNorm && defectsCsvTitleSet.has(tNorm)) {
  // Store using the original title wording from the audit
  const key = String(f.title || "").trim();
  defectCounts[key] = (defectCounts[key] || 0) + 1;
}

    });
  });

  const auditCount = audits.length;
  const avgScore = auditCount ? Math.round(scoreSum / auditCount) : 0;

  const topTags = topN(tagCounts, 5);
    const topDocumentationDefects = topN(documentationDefectCounts, 5);

  const topCats = topN(categoryCounts, 5);
const topDefects = topN(defectCounts, 5);

  const trendLines = trend
    .slice()
    .sort((a,b) => (a.date || "").localeCompare(b.date || ""))
    .map(t => `- ${formatDate(t.date)} • ${t.findings} finding(s)${t.jobRef ? ` • ${t.jobRef}` : ""}`);


  const coaching = buildCoachingParagraph(engineer, topTags, topCats);

  const lines = [];
  lines.push(`ENGINEER SUMMARY REPORT`);
  lines.push(`Engineer: ${engineer}`);
  lines.push(`Audits included: ${auditCount}`);
  lines.push(`Range: ${rangeLabel()}`);
  lines.push("—");

function padRight(str, len) {
  str = String(str);
  return str.length >= len ? str : str + " ".repeat(len - str.length);
}

lines.push("OUTCOME SUMMARY");

const totalAudits =
  (outcomes["Work & Documentation Correct"] || 0) +
  (outcomes["Work FAIL - Documentation PASS"] || 0) +
  (outcomes["Work PASS - Documentation FAIL"] || 0) +
  (outcomes["Work FAIL - Documentation FAIL"] || 0);

const passAudits =
  outcomes["Work & Documentation Correct"] || 0;

const failAudits =
  Math.max(0, totalAudits - passAudits);

const passRate =
  totalAudits > 0
    ? Math.round((passAudits / totalAudits) * 100)
    : 0;

lines.push(`PASS - ${passAudits}/${totalAudits}`);
lines.push(`FAIL - ${failAudits}/${totalAudits}`);
lines.push(`Pass rate - ${passRate}%`);

lines.push(`Totals: ${totalFindings} Defects Found • ${totalPositives} positives`);
lines.push(`Severity: ID ${severityCounts.Critical} • AR ${severityCounts.Major} • NCS ${severityCounts.Minor} • Advisory ${severityCounts.Advisory}`);

lines.push("");
// ✅ Improved positives summary
lines.push("KEY STRENGTHS");

const positiveEntries = Array.from(positiveMap.values())
  .sort((a, b) => b.count - a.count);

if (!positiveEntries.length) {
  lines.push("- No positives recorded in this range.");
  lines.push("");
} else {
  const blob = positiveEntries
    .map(p => String(p.text || "").toLowerCase())
    .join(" | ");

  const strengths = [];

  if (/\blgsr\b|\bbenchmark\b|\bpaperwork\b|\bcertificate\b|\brecord\b|\baccurate\b|\baccuracy\b|\bdetail\b/.test(blob)) {
    strengths.push("LGSR / paperwork completed accurately with good detail");
  }

  if (/\bclean\b|\btidy\b|\bspotless\b|\bneat\b|\bwell\s*serviced\b|\bserviced\b|\bto\s*spec\b|\bspecification\b/.test(blob)) {
    strengths.push("Clean, tidy workmanship carried out to specification");
  }

  if (/\btenant\b|\bcustomer\b|\bclient\b|\bhappy\b|\bcompliment\b|\bcomplimentary\b|\bpleased\b|\bsatisfied\b/.test(blob)) {
    strengths.push("Positive customer / tenant feedback");
  }

  if (/\bawkward\b|\bpicked\s*up\b|\battention\b|\bthorough\b|\bnot\s*many\s*others\b|\badditional\s*defects\b/.test(blob)) {
    strengths.push("Good attention to detail and identifying less obvious defects");
  }

  if (!strengths.length) {
    strengths.push("Consistent positive feedback across audits");
  }

  strengths.slice(0, 4).forEach(s => {
    lines.push(`- ${s}`);
  });

  lines.push("");

  lines.push("REAL EXAMPLES NOTED");

  positiveEntries.slice(0, 5).forEach(p => {
    const countText = p.count > 1 ? ` (x${p.count})` : "";
    lines.push(`- ${p.text}${countText}`);
  });

  lines.push("");
}

// Paragraph 2: improvements / coaching (kept detailed, not too brief)
lines.push(buildCoachSpeak(engineer, avgScore, topTags, topCats, topDefects, severityCounts));
lines.push("");





// ✅ Positives section (top 5 repeated)
const topPositives = topN(positiveCounts, 5);


lines.push("TOP 5 RECURRING ISSUES (by Issue Tag)");
if (!topTags.length) lines.push("- No tagged issues found (start using Issue Tag).");
else topTags.forEach(([k,v], i) => lines.push(`${i+1}. ${k} (x${v})`));
lines.push("");


lines.push("MOST COMMON DEFECTS NOT RECORDED");
if (!defectsCsvTitleSet.size) {
  lines.push("- Defects library not loaded yet (check Defects.csv path/name).");
} else if (!topDefects.length) {
  lines.push("- No Additional Defects Found.");
} else {
  topDefects.forEach(([k, v], i) => lines.push(`${i + 1}. ${k} (x${v})`));
}
lines.push("");


   lines.push("COMMON DOCUMENTATION DEFECTS");
  if (!topDocumentationDefects.length) lines.push("- No documentation defects found.");
  else topDocumentationDefects.forEach(([title, n], i) => lines.push(`${i + 1}. ${title} (x${n})`));
  lines.push("");


  lines.push("TREND (Findings + Score by audit)");
  if (!trendLines.length) lines.push("- No audits.");
  else lines.push(...trendLines);
  lines.push("");

  lines.push("NOTES");


  return { text: lines.join("\n"), audits };
}

function buildCoachSpeak(engineer, avgScore, topTags, topCats, topDefects, severityCounts) {
  const topCat = topCats[0]?.[0] || "";

  const majors = severityCounts.Major || 0;
  const criticals = severityCounts.Critical || 0;

  // ✅ Prefer common DEFECT TITLES (up to 3). Fallback to tags if none.
  const defect1 = topDefects?.[0]?.[0] || "";
  const defect2 = topDefects?.[1]?.[0] || "";
  const defect3 = topDefects?.[2]?.[0] || "";

  const tag1 = topTags?.[0]?.[0] || "";
  const tag2 = topTags?.[1]?.[0] || "";
  const tag3 = topTags?.[2]?.[0] || "";

  const defectFocus = [defect1, defect2, defect3].filter(Boolean).join(", ");
  const tagFocus = [tag1, tag2, tag3].filter(Boolean).join(" + ");

  const bits = [];

  // Straight in (no "Alright <name>")
  if (topCat) bits.push(`Most findings are landing under ${topCat}.`);

  if (criticals > 0) {
    bits.push(`There were ${criticals} ID item(s) in this period — those are the ones we need to eliminate completely.`);
  }
  if (majors > 0) {
    bits.push(`You’ve had ${majors} AR item(s) — the main win is reducing those down over the next set of audits.`);
  }

  if (defectFocus) {
  bits.push(`The repeat themes I’m seeing are ${defectFocus}. If those are treated as “every job checks”, you’ll fly through audits.`);
} else if (tagFocus) {
  bits.push(`The repeat themes I’m seeing are ${tagFocus}. If those are treated as “every job checks”, you’ll fly through audits.`);
} else {
  bits.push(`Nothing is standing out as a repeat theme — keep the consistency going.`);
}


  return bits.join(" ");
}


function buildPositiveFeedbackParagraph(engineer, positiveCounts) {
  const name = engineer || "Engineer";

  // Sort by frequency and keep top inputs (we're summarising, not listing)
  const items = Object.entries(positiveCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([k]) => String(k || "").trim())
    .filter(Boolean);

  if (!items.length) {
    return `No positives recorded in this range — if you want, start adding one quick “what went well” line on each audit so you get credit for the good stuff too.`;
  }

  // Helper: case-insensitive "contains any"
  const hasAny = (text, words) => {
    const t = text.toLowerCase();
    return words.some(w => t.includes(w));
  };

  // Theme detection tuned to YOUR real examples
  const themeHits = {
    lgsr: 0,
    thorough: 0,
    workmanship: 0,
    customer: 0,
    overall: 0
  };

  items.forEach(t => {
    const lower = t.toLowerCase();

    if (hasAny(lower, ["lgsr", "record", "paperwork", "detail", "accurate", "accuracy", "perfect"])) themeHits.lgsr++;
    if (hasAny(lower, ["additional defects", "awkward defects", "picked up", "would have picked up", "few additional", "not many others"])) themeHits.thorough++;
    if (hasAny(lower, ["spotless", "tidy", "clean", "well serviced", "serviced", "to specification", "to spec"])) themeHits.workmanship++;
    if (hasAny(lower, ["tenant", "customer", "happy", "complimentary"])) themeHits.customer++;
    if (hasAny(lower, ["perfect", "no issues", "no issues at all", "great work"])) themeHits.overall++;
  });

  // Pick top 2 themes (best signal)
  const ordered = Object.entries(themeHits)
    .filter(([,n]) => n > 0)
    .sort((a,b) => b[1] - a[1])
    .map(([k]) => k);

  const primary = ordered[0] || "overall";
  const secondary = ordered[1] || null;

  const themePhrase = (key) => {
    if (key === "lgsr") return "your LGSR paperwork being accurate, detailed, and well recorded";
    if (key === "thorough") return "your thoroughness — picking up the awkward defects that others often miss";
    if (key === "workmanship") return "the standard of the work itself — clean, tidy, and to spec";
    if (key === "customer") return "how you leave the customer feeling — confident and happy with the work";
    return "your overall standard being consistently solid";
  };

  // Pull 2 short “example” phrases to make it feel real, without listing everything
  const niceExamples = items
    .map(s => s.replace(/\s+/g, " ").trim())
    .filter(s => s.length <= 90) // avoid mega lines
    .slice(0, 2)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));

  const exampleBit =
    niceExamples.length === 0 ? "" :
    niceExamples.length === 1 ? ` Example: “${niceExamples[0]}.”` :
    ` Examples: “${niceExamples[0]}” and “${niceExamples[1]}.”`;

  // Build the paragraph
  const p1 = `Alright ${name} — the positives coming through in this range are mainly around ${themePhrase(primary)}${secondary ? `, and also ${themePhrase(secondary)}` : ""}.`;
  const p2 = `Keep that as your baseline on every job — it’s exactly what makes audits straightforward.${exampleBit}`;

  return `${p1} ${p2}`;
}


function buildCoachingParagraph(engineer, topTags, topCats) {
  const topTag = topTags[0]?.[0] || null;
  const secondTag = topTags[1]?.[0] || null;
  const topCat = topCats[0]?.[0] || null;

  if (!topTag && !topCat) {
    return `Summary for ${engineer}: Start using Issue Tags consistently and this section will automatically highlight trends and coaching points.`;
  }

  const focus = [topTag, secondTag].filter(Boolean).join(" + ");
  const catLine = topCat ? `Most findings fall under: ${topCat}. ` : "";

  return `Summary for ${engineer}: ${catLine}Overall it’s good work — the biggest improvement would be being consistent on ${focus || "the recurring items"} so the job is not just good, but spot on every time.`;
}

function rangeLabel() {
  const r = el("rangeSelect")?.value || "qCurrent";

  if (r === "last5") return "Last 5 audits";
  if (r === "last6") return "Last 6 audits";

  if (r === "qCurrent") return quarterLabel(getCurrentQuarter());
  if (r === "q1") return "Quarter 1 (Jan–Mar)";
  if (r === "q2") return "Quarter 2 (Apr–Jun)";
  if (r === "q3") return "Quarter 3 (Jul–Sep)";
  if (r === "q4") return "Quarter 4 (Oct–Dec)";

  if (r === "custom") return "Custom range";
  return r;
}

function quarterLabel(q) {
  if (q === 1) return "Quarter 1 (Jan–Mar)";
  if (q === 2) return "Quarter 2 (Apr–Jun)";
  if (q === 3) return "Quarter 3 (Jul–Sep)";
  return "Quarter 4 (Oct–Dec)";
}

function getCurrentQuarter(date = new Date()) {
  const m = date.getMonth(); // 0-11
  return Math.floor(m / 3) + 1; // 1-4
}

function getQuarterRange(year, q) {
  // q: 1-4
  const startMonth = (q - 1) * 3;         // 0,3,6,9
  const start = new Date(year, startMonth, 1, 0, 0, 0, 0);
  const end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999); // last day of quarter
  return { start, end };
}

function loadEngineerDrafts() {
  try {
    return JSON.parse(localStorage.getItem(ENGINEER_DRAFTS_KEY) || "{}") || {};
  } catch {
    return {};
  }
}

function saveEngineerDrafts(drafts) {
  localStorage.setItem(ENGINEER_DRAFTS_KEY, JSON.stringify(drafts || {}));
}

function engineerDraftKey() {
  const engineer = (el("engineerSelect")?.value || "").trim();
  const range = (el("rangeSelect")?.value || "last5").trim();

  // include custom dates in key so drafts don’t collide
  const from = (el("rangeFrom")?.value || "").trim();
  const to = (el("rangeTo")?.value || "").trim();

  return `${normalizeEngineer(engineer)}__${range}__${from}__${to}`;
}

function loadEngineerDraftIntoBox() {
  const out = el("engineerOutput");
  if (!out) return;

  const drafts = loadEngineerDrafts();
  const key = engineerDraftKey();
  const saved = (drafts[key] || "").trim();

  if (saved) {
    out.value = saved;
    return true;
  }
  return false;
}

function saveEngineerDraftFromBox() {
  const out = el("engineerOutput");
  if (!out) return;

  const drafts = loadEngineerDrafts();
  drafts[engineerDraftKey()] = out.value || "";
  saveEngineerDrafts(drafts);
}

// Used before printing/sharing: don’t overwrite edits
function ensureEngineerSummaryReady() {
  const out = el("engineerOutput");
  if (!out) return;

  // If we already have text (draft or edited), keep it
  if ((out.value || "").trim()) return;

  // Otherwise try load saved draft, else generate once
  if (loadEngineerDraftIntoBox()) return;

  generateEngineerSummary(); // generates and fills out.value
  saveEngineerDraftFromBox(); // store generated as initial draft
}

function scoreAudit(audit) {
  const penalties = { Critical: 30, Major: 10, Minor: 3, Advisory: 1 };
  let score = 100;
  (audit.findings || []).forEach(f => {
    const sev = f.severity || "Minor";
    score -= (penalties[sev] ?? 3);
  });
  return Math.max(0, Math.min(100, Math.round(score)));
}

function topN(countObj, n) {
  return Object.entries(countObj).sort((a,b) => b[1] - a[1]).slice(0, n);
}

function normalizeEngineer(name) {
  return String(name || "").trim().replace(/\s+/g, " ").toLowerCase();
}
// ---------------- Engineer typeahead (ghost + datalist) ----------------

// OPTIONAL: Pre-populated engineers (add your names here)
const PRESET_ENGINEERS = [
  "Benn Pellington",
  "Bhupinder Singh",
  "Bryan West",
  "Charlie Abraham",
  "Ed Johnson",
  "Gary Hall",
  "Graham Black",
  "John Turlington",
  "Joshua Porter",
  "Pete Topliss",
  "Paul Teece",
  "Renjie Chen",
  "Sam Ogejo",
  "Scott Griffiths",
  "Sohail Mahmood",
];
function normalizeFindingTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[_/\\\-(),.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countRepeatFindingForEngineer(title, engineerName) {
  const targetTitle = normalizeFindingTitle(title);
  const targetEngineer = normalizeEngineer(engineerName);

  if (!targetTitle || !targetEngineer) return 0;

  let count = 0;

  (state.db.inspections || []).forEach(audit => {
    if (normalizeEngineer(audit.engineer || "") !== targetEngineer) return;

    (audit.findings || []).forEach(f => {
      if (normalizeFindingTitle(f.title || "") === targetTitle) {
        count++;
      }
    });
  });

  return count;
}

function updateRepeatIssueIndicator() {
  const input = el("findingTitle");
  const indicator = el("repeatIssueIndicator");
  if (!input || !indicator) return;

  const title = input.value.trim();
  const engineer = state.current?.engineer || el("engineerInput")?.value || "";

  const count = countRepeatFindingForEngineer(title, engineer);

  if (!title || count === 0) {
    indicator.textContent = "";
    indicator.classList.add("hidden");
    return;
  }

  indicator.textContent = `⚠️ Seen ${count} time${count === 1 ? "" : "s"} before for this engineer`;
  indicator.classList.remove("hidden");
}

// Build list from presets + saved audits (deduped)
function getEngineerPool() {
  const map = new Map(); // norm -> display name

  const add = (name) => {
    const raw = String(name || "").trim();
    if (!raw) return;
    const norm = normalizeEngineer(raw);
    if (!map.has(norm)) map.set(norm, raw);
  };

  PRESET_ENGINEERS.forEach(add);
  (state.db.inspections || []).forEach(i => add(i.engineer));

  return Array.from(map.values()).sort((a,b) => a.localeCompare(b));
}

// Fill the <datalist id="engineerSuggestions">
function refreshEngineerDatalist() {
  const dl = document.getElementById("engineerSuggestions");
  if (!dl) return;

  const pool = getEngineerPool();
  dl.innerHTML = pool.map(n => `<option value="${escapeHtml(n)}"></option>`).join("");
}

// Find a "starts with" suggestion for ghost text
function findGhostSuggestion(typed) {
  const t = String(typed || "");
  if (!t.trim()) return null;

  const pool = getEngineerPool();
  const lower = t.toLowerCase();

  for (const name of pool) {
    if (name.toLowerCase().startsWith(lower) && name.length > t.length) {
      return name;
    }
  }
  return null;
}
function commitEngineerSelection(name, blurAfter = false) {
  const input = el("engineerInput");
  if (!input) return;

  const exactMatch = getEngineerPool().find(p => normalizeEngineer(p) === normalizeEngineer(name));
  if (!exactMatch) return;

  input.value = exactMatch;

  if (state.current) {
    state.current.engineer = exactMatch;
    renderOutputs();
    renderSavedList();
    refreshEngineerDropdown();
  }

  const ghost = el("engineerGhost");
  if (ghost) ghost.innerHTML = "";

  // This closes the native suggestion dropdown on iPad/mobile
 if (blurAfter) {
  closeMobileKeyboard(input);
}
}
// Draw the ghost text behind the input
function renderEngineerGhost() {
  const input = el("engineerInput");
  const ghost = el("engineerGhost");
  if (!input || !ghost) return;

  const typed = input.value || "";
  const pool = getEngineerPool();

  const exactMatch = pool.find(p => normalizeEngineer(p) === normalizeEngineer(typed));

  if (exactMatch) {
    commitEngineerSelection(exactMatch, false);
    return;
  }

  const suggestion = findGhostSuggestion(typed);

  if (!suggestion) {
    ghost.innerHTML = "";
    return;
  }

  ghost.innerHTML =
    `<span class="typed">${escapeHtml(typed)}</span>` +
    `${escapeHtml(suggestion.slice(typed.length))}`;
}
function acceptEngineerGhost() {
  const input = el("engineerInput");
  if (!input) return false;

  const suggestion = findGhostSuggestion(input.value || "");
  if (!suggestion) return false;

  commitEngineerSelection(suggestion, true);
  return true;
}
function canonicalFromPool(name) {
  const raw = String(name || "").trim();
  if (!raw) return "";

  const norm = normalizeEngineer(raw);
  const pool = getEngineerPool();

  for (const p of pool) {
    if (normalizeEngineer(p) === norm) return p;
  }
  return raw;
}
function buildReportTextFromInspection(ins) {
  const c = ins;

  const positives = c.positives || [];
  const findings = sortFindingsBySeverity(c.findings || []);

  const lines = [];
  lines.push("INSPECTION FEEDBACK REPORT");
  lines.push("—");
  lines.push(`Date: ${formatDate(c.date)}`);
  lines.push(`Engineer: ${c.engineer || "—"}`);
  lines.push(`Job ref: ${c.jobRef || "—"}`);
  lines.push(`Site: ${c.address || "—"}`);
  lines.push(`Appliance: ${c.appliance || "—"}`);
  lines.push(`Outcome: ${c.outcome || "—"}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push(summaryLine(c));
  lines.push("");

  lines.push("WHAT WAS DONE WELL");
  if (!positives.length) lines.push("- (No positives recorded)");
  else positives.forEach(p => lines.push(`- ${p.text}`));
  lines.push("");

  lines.push("FINDINGS & REQUIRED ACTIONS");
  if (!findings.length) {
    lines.push("- (No findings recorded)");
  } else {
    findings.forEach((f, i) => {
      lines.push(`${i + 1}. ${f.title}`);
     lines.push(`   Category: ${f.category} | Severity: ${severityLabel(f.severity)} | Tag: ${f.tag || "OTHER"}`);

      if (f.why) lines.push(`   Why it matters: ${f.why}`);
      if (f.action) lines.push(`   Action: ${f.action}`);
      if (f.notes) lines.push(`   Notes: ${f.notes}`);
      lines.push("");
    });
  }

  lines.push("CLOSE-OUT");
  lines.push("Please confirm once actions are complete. If a revisit is required, arrange a suitable time for reinspection.");

  return lines.join("\n");
}

async function emailSelectedReports() {
  const selectedIds = Array.from(document.querySelectorAll(".saved-select:checked"))
    .map(cb => cb.getAttribute("data-select"))
    .filter(Boolean);

  if (!selectedIds.length) {
    alert("Select at least one saved audit first.");
    return;
  }

  const selectedAudits = selectedIds
    .map(id => state.db.inspections.find(x => x.id === id))
    .filter(Boolean);

  if (!selectedAudits.length) {
    alert("Couldn’t find the selected audits.");
    return;
  }

  try {
    const files = [];

    // Build PDFs one-by-one (reliable on mobile)
    for (const a of selectedAudits) {
   const engineerName = (a.engineer || "Engineer").trim();
const jobRef = (a.jobRef || "No Job Ref").trim();
const datePretty = formatDate(a.date).replaceAll("/", "-"); // dd-mm-yyyy

// Remove characters that break filenames
const clean = (s) => s
  .replace(/[<>:"/\\|?*\x00-\x1F]/g, "") // illegal filename chars
  .replace(/\s+/g, " ")
  .trim();

const filename = `${clean(engineerName)} - ${clean(jobRef)} - ${datePretty}.pdf`;


      const html = buildPrintableReportHTMLFromInspection(a);
   const pdfBlob = await buildPdfFromHtml(html, filename);



      files.push(new File([pdfBlob], filename, { type: "application/pdf" }));
    }

    // Share sheet (best: pick Mail and it attaches PDFs)
    if (navigator.canShare && navigator.canShare({ files }) && navigator.share) {
      await navigator.share({
        title: `Inspection Reports (${files.length})`,
        text: "Inspection report PDFs attached.",
        files
      });
      return;
    }

    // Fallback: download all PDFs (desktop / older browsers)
    for (const file of files) {
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);

      // small delay so multiple downloads work reliably
      await new Promise(r => setTimeout(r, 250));
    }

    alert("PDFs downloaded. Attach them to your email.");
  } catch (err) {
    console.error(err);
    alert("Could not create/share the PDFs. Check console for details.");
  }
}




// ================= Defects & audit analytics =================
function updateAnalyticsComparisonControls() {
  const custom =
    el("analyticsCompareMode")?.value ===
    "custom";

  el("analyticsCompareFromWrap")
    ?.classList.toggle(
      "hidden",
      !custom
    );

  el("analyticsCompareToWrap")
    ?.classList.toggle(
      "hidden",
      !custom
    );
}


function initAnalytics() {
  if (!el("tabAnalytics")) return;

  // One-time/backfill migration for audits saved before Analytics existed.
  (state.db.inspections || []).forEach(archiveInspectionForAnalytics);

  const today = new Date();

  const todayValue =
    formatAnalyticsInputDate(
      today
    );

  el("analyticsFrom").value =
    todayValue;

  el("analyticsTo").value =
    todayValue;

  [
  "analyticsFrom",
  "analyticsTo",
  "analyticsEngineer",
  "analyticsCategory",
  "analyticsSeverity",
  "analyticsSearch",
  "analyticsCompareFrom",
  "analyticsCompareTo"
].forEach(id => {
  el(id)?.addEventListener(
    id === "analyticsSearch"
      ? "input"
      : "change",
    renderAnalytics
  );
});

el("analyticsCompareMode")?.addEventListener(
  "change",
  () => {
    updateAnalyticsComparisonControls();
    renderAnalytics();
  }
);

updateAnalyticsComparisonControls();

  el("analyticsThisMonthBtn")?.addEventListener("click", () => {
    const d = new Date();
    el("analyticsFrom").value = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10);
    el("analyticsTo").value = d.toISOString().slice(0,10);
    renderAnalytics();
  });

  el("analyticsThisQuarterBtn")?.addEventListener("click", () => {
    const d = new Date();
    const month = Math.floor(d.getMonth() / 3) * 3;
    el("analyticsFrom").value = new Date(d.getFullYear(), month, 1).toISOString().slice(0,10);
    el("analyticsTo").value = d.toISOString().slice(0,10);
    renderAnalytics();
  });

  el("analyticsAllTimeBtn")?.addEventListener("click", () => {
    el("analyticsFrom").value = "";
    el("analyticsTo").value = "";
    renderAnalytics();
  });

   /* Open Engineer Performance Overview by clicking its card */
const engineerPerformanceCard = el(
  "engineerPerformanceSection"
);

if (engineerPerformanceCard) {
  engineerPerformanceCard.classList.add(
    "analytics-presentation-clickable"
  );

  engineerPerformanceCard.setAttribute(
    "role",
    "button"
  );

  engineerPerformanceCard.setAttribute(
    "tabindex",
    "0"
  );

  engineerPerformanceCard.setAttribute(
    "aria-label",
    "Open Engineer Performance Overview presentation view"
  );

  engineerPerformanceCard.addEventListener(
    "click",
    toggleEngineerPresentationView
  );

  engineerPerformanceCard.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();
        toggleEngineerPresentationView();
      }
    }
  );
}

 el("managementReportBtn")?.addEventListener(
  "click",
  event => {
    event.stopPropagation();

    closeManagementReportMenu();
    openManagementReport();
  }
);

el("managementReportMenuBtn")?.addEventListener(
  "click",
  event => {
    event.stopPropagation();
    toggleManagementReportMenu();
  }
);

el("managementReportMenu")
  ?.querySelectorAll(
    "[data-report-period]"
  )
  .forEach(button => {
    button.addEventListener(
      "click",
      event => {
        event.stopPropagation();

        const period =
          button.dataset.reportPeriod;

        runManagementReportPreset(
          period
        );
      }
    );
  });

document.addEventListener(
  "click",
  event => {
    const launcher = el(
      "managementReportLauncher"
    );

    if (
      launcher &&
      !launcher.contains(event.target)
    ) {
      closeManagementReportMenu();
    }
  }
);

el("exportAnalyticsCsvBtn")?.addEventListener(
  "click",
  exportAnalyticsCsv
);
 el("printAnalyticsBtn")?.addEventListener("click", () => {
  document.body.classList.add("analytics-print");
  window.print();
  setTimeout(() => document.body.classList.remove("analytics-print"), 500);
});

/* Open only the Most common defects card in its custom presentation view */
const topDefectsCard = el("topDefectsChart")?.closest(".analytics-card");

if (topDefectsCard) {
  topDefectsCard.classList.add("top-defects-clickable");
  topDefectsCard.setAttribute("role", "button");
  topDefectsCard.setAttribute("tabindex", "0");
  topDefectsCard.setAttribute(
    "aria-label",
    "Open Most common defects presentation view"
  );

  topDefectsCard.addEventListener(
    "click",
    openTopDefectsPresentation
  );

  topDefectsCard.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openTopDefectsPresentation();
    }
  });
}

/* Other analytics cards that open in presentation view */
const analyticsPresentationCards = [
  {
    chartId: "passFailChart",
    title: "Audit PASS / FAIL rate"
  },
  {
    chartId: "categoryChart",
    title: "Defects by category"
  },
  {
    chartId: "severityChart",
    title: "Defects by severity"
  },
  {
    chartId: "monthlyAuditChart",
    title: "Monthly audit trend"
  }
];

analyticsPresentationCards.forEach(({ chartId, title }) => {
  const chart = el(chartId);
  const card = chart?.closest(".analytics-card");

  if (!card) return;

  card.classList.add("analytics-presentation-clickable");
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute(
    "aria-label",
    `Open ${title} presentation view`
  );

  card.addEventListener("click", () => {
    openAnalyticsCardPresentation(chartId, title);
  });

  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openAnalyticsCardPresentation(chartId, title);
    }
  });
});

refreshAnalyticsFilters();

  refreshAnalyticsFilters();
}

function refreshAnalyticsFilters() {
  const engineer =
    el("analyticsEngineer");

  const category =
    el("analyticsCategory");

  if (
    !engineer ||
    !category
  ) {
    return;
  }

  const keepEngineer =
    engineer.value;

  const keepCategory =
    category.value;

  /*
    Engineer filter must come from ALL audits,
    not just defect records.

    This ensures engineers with PASS audits and
    zero defects can still be selected.
  */
  const engineers = [
    ...new Set(
      (analyticsState.audits || [])
        .map(record =>
          String(
            record.engineer || ""
          ).trim()
        )
        .filter(Boolean)
    )
  ].sort(
    (a, b) =>
      a.localeCompare(b)
  );

  /*
    Categories still come from defects because
    category is a defect-level field.
  */
  const categories = [
    ...new Set(
      (analyticsState.defects || [])
        .map(record =>
          record.category ||
          "Other"
        )
    )
  ].sort(
    (a, b) =>
      a.localeCompare(b)
  );

  engineer.innerHTML =
    `<option value="">All engineers</option>` +
    engineers
      .map(name => `
        <option value="${escapeHtml(name)}">
          ${escapeHtml(name)}
        </option>
      `)
      .join("");

  category.innerHTML =
    `<option value="">All categories</option>` +
    categories
      .map(name => `
        <option value="${escapeHtml(name)}">
          ${escapeHtml(name)}
        </option>
      `)
      .join("");

  if (
    engineers.includes(
      keepEngineer
    )
  ) {
    engineer.value =
      keepEngineer;
  } else {
    engineer.value = "";
  }

  if (
    categories.includes(
      keepCategory
    )
  ) {
    category.value =
      keepCategory;
  } else {
    category.value = "";
  }
}

function analyticsDateInRange(date, from, to) {
  if (!date) return false;
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
}

function getAnalyticsSelection() {
  const from = el("analyticsFrom")?.value || "";
  const to = el("analyticsTo")?.value || "";
  const engineer = el("analyticsEngineer")?.value || "";
  const category = el("analyticsCategory")?.value || "";
  const severity = el("analyticsSeverity")?.value || "";
  const search = (el("analyticsSearch")?.value || "").trim().toLowerCase();

  const defects = analyticsState.defects.filter(d => {
    if (!analyticsDateInRange(d.date, from, to)) return false;
    if (engineer && d.engineer !== engineer) return false;
    if (category && (d.category || "Other") !== category) return false;
    if (severity && d.severity !== severity) return false;
    if (search) {
      const haystack = `${d.title} ${d.tag} ${d.notes} ${d.why} ${d.action}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    return true;
  });

  const audits = analyticsState.audits.filter(a => {
    if (!analyticsDateInRange(a.date, from, to)) return false;
    if (engineer && a.engineer !== engineer) return false;
    return true;
  });

  return { defects, audits };
}

function isPassingOutcome(outcome) {
  return String(outcome || "") === "Work & Documentation Correct";
}

function countBy(items, keyFn) {
  const out = {};
  items.forEach(item => {
    const key = String(keyFn(item) || "Other").trim() || "Other";
    out[key] = (out[key] || 0) + 1;
  });
  return out;
}

function sortedCounts(counts, limit = 10) {
  return Object.entries(counts).sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}
function getEngineerPerformanceData(audits) {
  const engineers = new Map();

  (Array.isArray(audits) ? audits : []).forEach(audit => {
    const rawName = String(audit.engineer || "").trim();
    if (!rawName) return;

    const key = normalizeEngineer(rawName);

    if (!engineers.has(key)) {
      engineers.set(key, {
        engineer: rawName,
        total: 0,
        pass: 0,
        fail: 0,
        passRate: 0
      });
    }

    const record = engineers.get(key);

    record.total++;

    if (isPassingOutcome(audit.outcome)) {
      record.pass++;
    } else {
      record.fail++;
    }
  });

  return Array.from(engineers.values())
    .map(record => ({
      ...record,
      passRate: record.total
        ? Math.round((record.pass / record.total) * 100)
        : 0
    }))
    .sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }

      return a.engineer.localeCompare(b.engineer);
    });
}

function getAnalyticsPeriodLabel() {
  const from = el("analyticsFrom")?.value || "";
  const to = el("analyticsTo")?.value || "";

  if (!from && !to) {
    return "All historical audits";
  }

  if (from && to) {
    return `${formatDate(from)} to ${formatDate(to)}`;
  }

  if (from) {
    return `From ${formatDate(from)}`;
  }

  return `Up to ${formatDate(to)}`;
}

function splitEngineerChartLabel(name) {
  const words = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) {
    return ["Unnamed"];
  }

  if (words.length === 1) {
    return [words[0]];
  }

  if (words.length === 2) {
    return words;
  }

  const midpoint = Math.ceil(words.length / 2);

  return [
    words.slice(0, midpoint).join(" "),
    words.slice(midpoint).join(" ")
  ];
}

function renderEngineerPerformanceChart(audits) {
  const container = el("engineerPerformanceChart");
  const period = el("engineerPerformancePeriod");
  const summary = el("engineerPerformanceSummary");

  if (!container) return;

  const data = getEngineerPerformanceData(audits);

  if (period) {
    period.textContent = getAnalyticsPeriodLabel();
  }

  if (!data.length) {
    container.innerHTML = `
      <div class="analytics-empty">
        No engineer audit data matches the selected period.
      </div>
    `;

    if (summary) {
      summary.innerHTML = "";
    }

    return;
  }

  const chartWidth = Math.max(
    1120,
    data.length * 122
  );

  const chartHeight = 520;
  const margin = {
    top: 42,
    right: 30,
    bottom: 118,
    left: 58
  };

  const plotWidth =
    chartWidth - margin.left - margin.right;

  const plotHeight =
    chartHeight - margin.top - margin.bottom;

  const maximumValue = Math.max(
    1,
    ...data.map(item => item.total)
  );

  const tickStep =
    maximumValue <= 10
      ? 1
      : maximumValue <= 25
        ? 5
        : maximumValue <= 50
          ? 10
          : Math.ceil(maximumValue / 5);

  const axisMaximum =
    Math.ceil(maximumValue / tickStep) * tickStep;

  const tickValues = [];

  for (
    let value = 0;
    value <= axisMaximum;
    value += tickStep
  ) {
    tickValues.push(value);
  }

  const groupWidth = plotWidth / data.length;
  const availableBarWidth = Math.min(
    24,
    Math.max(12, groupWidth * 0.2)
  );

  const barGap = Math.max(
    4,
    Math.min(9, groupWidth * 0.055)
  );

  const completeGroupWidth =
    availableBarWidth * 3 + barGap * 2;

  const scaleY = value =>
    margin.top +
    plotHeight -
    (value / axisMaximum) * plotHeight;

  const gridLines = tickValues
    .map(value => {
      const y = scaleY(value);

      return `
        <line
          x1="${margin.left}"
          y1="${y}"
          x2="${chartWidth - margin.right}"
          y2="${y}"
          stroke="#d1d5db"
stroke-width="1"
class="engineer-chart-gridline"
        ></line>

        <text
          x="${margin.left - 12}"
          y="${y + 5}"
          text-anchor="end"
          fill="#4b5563"
font-size="12"
class="engineer-chart-axis-label"
        >
          ${value}
        </text>
      `;
    })
    .join("");

  const groups = data
    .map((item, index) => {
      const centreX =
        margin.left +
        index * groupWidth +
        groupWidth / 2;

      const groupStart =
        centreX - completeGroupWidth / 2;

      const values = [
  {
    value: item.total,
    className: "engineer-chart-total",
    fill: "#2563eb",
    label: "Total audits"
  },
  {
    value: item.pass,
    className: "engineer-chart-pass",
    fill: "#16a34a",
    label: "PASS"
  },
  {
    value: item.fail,
    className: "engineer-chart-fail",
    fill: "#dc2626",
    label: "FAIL"
  }
];

      const bars = values
        .map((bar, barIndex) => {
          const x =
            groupStart +
            barIndex * (availableBarWidth + barGap);

          const y = scaleY(bar.value);
          const height =
            margin.top + plotHeight - y;

          const valueLabelY = Math.max(
            margin.top + 14,
            y - 8
          );

         const drilldownResult =
  barIndex === 0
    ? "all"
    : barIndex === 1
      ? "pass"
      : "fail";

return `
  <g
    class="engineer-chart-drilldown"
    data-engineer="${escapeHtml(
      item.engineer
    )}"
    data-result="${drilldownResult}"
    role="button"
    tabindex="0"
    aria-label="View ${escapeHtml(
      bar.label
    )} for ${escapeHtml(
      item.engineer
    )}"
  >
    <title>
      ${escapeHtml(item.engineer)} —
      ${bar.label}: ${bar.value}.
      Click to view the matching audits.
    </title>

    <rect
      x="${x}"
      y="${y}"
      width="${availableBarWidth}"
      height="${height}"
      rx="3"
      fill="${bar.fill}"
      class="${bar.className}"
    ></rect>

    <text
      x="${x + availableBarWidth / 2}"
      y="${valueLabelY}"
      text-anchor="middle"
      fill="#111827"
      font-size="13"
      font-weight="800"
      class="engineer-chart-value-label"
    >
      ${bar.value}
    </text>
  </g>
`;
        })
        .join("");

      const nameLines =
        splitEngineerChartLabel(item.engineer);

      const nameText = nameLines
        .map((line, lineIndex) => `
          <tspan
            x="${centreX}"
            dy="${lineIndex === 0 ? 0 : 16}"
          >
            ${escapeHtml(line)}
          </tspan>
        `)
        .join("");

      return `
        ${bars}

        <text
  x="${centreX}"
  y="${chartHeight - margin.bottom + 28}"
  text-anchor="middle"
  fill="#111827"
  font-size="12"
  font-weight="700"
  class="
    engineer-chart-engineer-label
    engineer-chart-name-drilldown
  "
  data-engineer="${escapeHtml(
    item.engineer
  )}"
  data-result="all"
  role="button"
  tabindex="0"
  aria-label="View all audits for ${escapeHtml(
    item.engineer
  )}"
>
  <title>
    Click to view all audits for
    ${escapeHtml(item.engineer)}
  </title>

  ${nameText}
</text>

        <text
          x="${centreX}"
          y="${chartHeight - 28}"
          text-anchor="middle"
          fill="#4b5563"
font-size="11"
font-weight="700"
class="engineer-chart-rate-label"
        >
          ${item.passRate}% PASS
        </text>
      `;
    })
    .join("");

 container.innerHTML = `
  <svg
    class="engineer-performance-svg"
    viewBox="0 0 ${chartWidth} ${chartHeight}"
    width="100%"
    height="auto"
    role="img"
    aria-label="Total audits, passes and failures by engineer"
    preserveAspectRatio="xMidYMid meet"
    data-engineer-count="${data.length}"
    style="
      display:block;
      width:100%;
      max-width:100%;
      min-width:0;
      height:auto;
      margin:0;
      background:#ffffff;
    "
  >
     <rect
  x="0"
  y="0"
  width="${chartWidth}"
  height="${chartHeight}"
  fill="#ffffff"
  class="engineer-chart-background"
></rect>

      ${gridLines}

      <line
        x1="${margin.left}"
        y1="${margin.top + plotHeight}"
        x2="${chartWidth - margin.right}"
        y2="${margin.top + plotHeight}"
        stroke="#6b7280"
stroke-width="1.2"
class="engineer-chart-axis"
      ></line>

      <line
        x1="${margin.left}"
        y1="${margin.top}"
        x2="${margin.left}"
        y2="${margin.top + plotHeight}"
        stroke="#6b7280"
stroke-width="1.2"
class="engineer-chart-axis"
      ></line>

      ${groups}

      <text
        x="18"
        y="${margin.top + plotHeight / 2}"
        text-anchor="middle"
        fill="#374151"
font-size="13"
font-weight="700"
class="engineer-chart-y-title"
        transform="rotate(-90 18 ${margin.top + plotHeight / 2})"
      >
        Number of audits
      </text>
    </svg>
    `;

  container
    .querySelectorAll(
      ".engineer-chart-drilldown, .engineer-chart-name-drilldown"
    )
    .forEach(target => {
      const openDrilldown = event => {
        /*
          Prevent the click from reaching the full
          Engineer Performance presentation card.
        */
        event.stopPropagation();

        const engineerName =
          target.getAttribute(
            "data-engineer"
          ) || "";

        const result =
          target.getAttribute(
            "data-result"
          ) || "all";

        openEngineerAuditDrilldown(
          engineerName,
          result
        );
      };

      target.addEventListener(
        "click",
        openDrilldown
      );

      target.addEventListener(
        "keydown",
        event => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            openDrilldown(event);
          }
        }
      );
    });

  const totalAudits =
    data.reduce((sum, item) => sum + item.total, 0);

  const totalPasses =
    data.reduce((sum, item) => sum + item.pass, 0);

  const totalFailures =
    data.reduce((sum, item) => sum + item.fail, 0);

  const overallPassRate = totalAudits
    ? Math.round((totalPasses / totalAudits) * 100)
    : 0;

  const busiestEngineer = data[0];

  if (summary) {
    summary.innerHTML = `
      <div>
        <strong>${data.length}</strong>
        <span>Engineers</span>
      </div>

      <div>
        <strong>${totalAudits}</strong>
        <span>Total audits</span>
      </div>

      <div>
        <strong>${overallPassRate}%</strong>
        <span>Overall PASS rate</span>
      </div>

      <div>
        <strong>${totalFailures}</strong>
        <span>Total FAIL audits</span>
      </div>

      <div>
        <strong>${escapeHtml(busiestEngineer.engineer)}</strong>
        <span>Most audits: ${busiestEngineer.total}</span>
      </div>
    `;
  }
}

function openEngineerAuditDrilldown(
  engineerName,
  result = "all"
) {
  const normalizedEngineer =
    normalizeEngineer(engineerName);

  const selection =
    getAnalyticsSelection();

  const selectedAudits =
    selection.audits
      .filter(audit => {
        if (
          normalizeEngineer(
            audit.engineer
          ) !== normalizedEngineer
        ) {
          return false;
        }

        if (result === "pass") {
          return isPassingOutcome(
            audit.outcome
          );
        }

        if (result === "fail") {
          return !isPassingOutcome(
            audit.outcome
          );
        }

        return true;
      })
      .sort((a, b) =>
        String(b.date || "")
          .localeCompare(
            String(a.date || "")
          )
      );

  /*
    Defects remain restricted to the same
    analytics filters currently selected.
  */
  const selectedDefects =
    selection.defects.filter(defect =>
      normalizeEngineer(
        defect.engineer
      ) === normalizedEngineer
    );

  const selectedAuditIds = new Set(
    selectedAudits.map(audit =>
      String(audit.id || "")
    )
  );

  const matchingDefects =
    selectedDefects.filter(defect =>
      selectedAuditIds.has(
        String(defect.auditId || "")
      )
    );

  const passCount =
    selectedAudits.filter(audit =>
      isPassingOutcome(audit.outcome)
    ).length;

  const failCount =
    selectedAudits.length -
    passCount;

  const passRate =
    selectedAudits.length
      ? Math.round(
          (
            passCount /
            selectedAudits.length
          ) * 100
        )
      : 0;

  const defectsPerAudit =
    selectedAudits.length
      ? (
          matchingDefects.length /
          selectedAudits.length
        )
      : 0;

  const severityCounts = {
    ID: 0,
    AR: 0,
    NCS: 0,
    Advisory: 0
  };

  matchingDefects.forEach(defect => {
    const severity =
      getAnalyticsSeverityLabel(
        defect.severity
      );

    if (
      Object.prototype.hasOwnProperty.call(
        severityCounts,
        severity
      )
    ) {
      severityCounts[severity]++;
    }
  });

  const topDefects = sortedCounts(
    countBy(
      matchingDefects,
      defect =>
        defect.title ||
        "Untitled defect"
    ),
    8
  );

  const resultLabel =
    result === "pass"
      ? "PASS audits"
      : result === "fail"
        ? "FAIL audits"
        : "All audits";

  const fullInspectionMap = new Map(
    (
      state.db.inspections || []
    ).map(inspection => [
      String(inspection.id || ""),
      inspection
    ])
  );

  const maximumTopDefectCount =
    Math.max(
      1,
      ...topDefects.map(
        ([, count]) => count
      )
    );

  const topDefectsHtml =
    topDefects.length
      ? topDefects
          .map(([title, count]) => {
            const width =
              Math.max(
                4,
                (
                  count /
                  maximumTopDefectCount
                ) * 100
              );

            return `
              <div class="top-defect-row">
                <div class="top-defect-heading">
                  <span>
                    ${escapeHtml(title)}
                  </span>

                  <strong>${count}</strong>
                </div>

                <div class="top-defect-track">
                  <div
                    class="top-defect-fill"
                    style="width:${width}%"
                  ></div>
                </div>
              </div>
            `;
          })
          .join("")
      : `
          <div class="empty-message">
            No defects match this selection.
          </div>
        `;

  const auditRecordsHtml =
    selectedAudits.length
      ? selectedAudits
          .map((audit, index) => {
            const fullInspection =
              fullInspectionMap.get(
                String(audit.id || "")
              );

            const auditDefects =
              matchingDefects.filter(
                defect =>
                  String(
                    defect.auditId || ""
                  ) ===
                  String(
                    audit.id || ""
                  )
              );

            const findings =
              Array.isArray(
                fullInspection?.findings
              )
                ? fullInspection.findings
                : [];

            /*
              Prefer the complete saved finding
              records where available. Fall back
              to the analytics archive if the
              original saved audit is unavailable.
            */
            const displayFindings =
              findings.length
                ? findings
                : auditDefects;

            const findingRows =
              displayFindings.length
                ? displayFindings
                    .map(finding => `
                      <div class="finding-record">
                        <div class="finding-heading">
                          <strong>
                            ${escapeHtml(
                              finding.title ||
                              "Untitled defect"
                            )}
                          </strong>

                          <span>
                            ${escapeHtml(
                              getAnalyticsSeverityLabel(
                                finding.severity
                              )
                            )}
                          </span>
                        </div>

                        <div class="finding-meta">
                          ${escapeHtml(
                            finding.category ||
                            "Other"
                          )}

                          ${
                            finding.tag
                              ? `
                                  &nbsp;•&nbsp;
                                  ${escapeHtml(
                                    finding.tag
                                  )}
                                `
                              : ""
                          }
                        </div>

                        ${
                          finding.why
                            ? `
                                <p>
                                  <b>
                                    Why it matters:
                                  </b>

                                  ${escapeHtml(
                                    finding.why
                                  )}
                                </p>
                              `
                            : ""
                        }

                        ${
                          finding.action
                            ? `
                                <p>
                                  <b>
                                    Required action:
                                  </b>

                                  ${escapeHtml(
                                    finding.action
                                  )}
                                </p>
                              `
                            : ""
                        }

                        ${
                          finding.notes
                            ? `
                                <p>
                                  <b>Notes:</b>

                                  ${escapeHtml(
                                    finding.notes
                                  )}
                                </p>
                              `
                            : ""
                        }
                      </div>
                    `)
                    .join("")
                : `
                    <div class="empty-findings">
                      No findings recorded.
                    </div>
                  `;

            const auditPassed =
              isPassingOutcome(
                audit.outcome
              );

            return `
              <article class="audit-record">
                <header class="audit-header">
                  <div>
                    <div class="audit-number">
                      Audit ${index + 1}
                    </div>

                    <h2>
                      ${escapeHtml(
                        audit.jobRef ||
                        "No job reference"
                      )}
                    </h2>
                  </div>

                  <span
                    class="
                      outcome-badge
                      ${
                        auditPassed
                          ? "outcome-pass"
                          : "outcome-fail"
                      }
                    "
                  >
                    ${
                      auditPassed
                        ? "PASS"
                        : "FAIL"
                    }
                  </span>
                </header>

                <div class="audit-details">
                  <div>
                    <span>Date</span>

                    <strong>
                      ${escapeHtml(
                        formatDate(
                          audit.date
                        )
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Job reference</span>

                    <strong>
                      ${escapeHtml(
                        audit.jobRef || "—"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Outcome</span>

                    <strong>
                      ${escapeHtml(
                        audit.outcome || "—"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Site</span>

                    <strong>
                      ${escapeHtml(
                        fullInspection
                          ?.address || "—"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>
                      Appliance / boiler
                    </span>

                    <strong>
                      ${escapeHtml(
                        fullInspection
                          ?.appliance || "—"
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Findings</span>

                    <strong>
                      ${displayFindings.length}
                    </strong>
                  </div>
                </div>

                <section class="findings-section">
                  <h3>
                    Findings and actions
                  </h3>

                  ${findingRows}
                </section>
              </article>
            `;
          })
          .join("")
      : `
          <div class="no-audits">
            No ${escapeHtml(
              resultLabel.toLowerCase()
            )} match the current analytics filters.
          </div>
        `;

  const drilldownWindow =
    window.open(
      "",
      `PPCEngineerAuditDrilldown_${result}`,
      "width=1350,height=950,resizable=yes,scrollbars=yes"
    );

  if (!drilldownWindow) {
    alert(
      "The engineer details window was blocked. Please allow pop-ups for this app and try again."
    );

    return;
  }

  drilldownWindow.document.open();

  drilldownWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <title>
          ${escapeHtml(engineerName)} —
          ${escapeHtml(resultLabel)}
        </title>

        <style>
          * {
            box-sizing: border-box;
          }

                   body {
            margin: 0;
            padding: 30px;
            background: #f4f1f7;
            color: #1b1028;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
            overflow-x: hidden;
          }

          .toolbar {
            width: min(1250px, 100%);
            margin: 0 auto 14px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          .toolbar button {
            padding: 10px 16px;
            border: 1px solid #d8d1df;
            border-radius: 10px;
            background: #ffffff;
            color: #1b1028;
            font-weight: 700;
            cursor: pointer;
          }

          .page {
            width: min(1250px, 100%);
            margin: 0 auto;
          }

          .page-heading {
            padding: 28px;
            border: 1px solid #ddd7e4;
            border-radius: 20px;
            background: #ffffff;
          }

          .page-heading h1 {
            margin: 0 0 7px;
            font-size: 30px;
          }

          .page-subtitle {
            color: #675d70;
            font-size: 14px;
            line-height: 1.6;
          }

          .kpi-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 12px;
            margin-top: 16px;
          }

          .kpi-card {
            padding: 17px 12px;
            border: 1px solid #ddd7e4;
            border-radius: 15px;
            background: #faf8fc;
            text-align: center;
          }

          .kpi-card strong {
            display: block;
            font-size: 25px;
          }

          .kpi-card span {
            display: block;
            margin-top: 5px;
            color: #675d70;
            font-size: 12px;
          }

          .severity-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 10px;
            margin-top: 12px;
          }

          .severity-card {
            padding: 13px;
            border: 1px solid #d8c9f5;
            border-radius: 13px;
            background: #f7f2ff;
            text-align: center;
          }

          .severity-card strong {
            display: block;
            color: #5b21b6;
            font-size: 21px;
          }

          .severity-card span {
            display: block;
            margin-top: 4px;
            color: #675d70;
            font-size: 11px;
          }

          .report-section {
            margin-top: 18px;
            padding: 22px;
            border: 1px solid #ddd7e4;
            border-radius: 18px;
            background: #ffffff;
          }

          .report-section > h2 {
            margin: 0 0 15px;
            font-size: 20px;
          }

          .top-defects {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .top-defect-heading {
            display: grid;
            grid-template-columns:
              minmax(0, 1fr)
              45px;
            gap: 10px;
            margin-bottom: 5px;
            font-size: 13px;
          }

          .top-defect-heading span {
            overflow-wrap: anywhere;
          }

          .top-defect-heading strong {
            text-align: right;
          }

          .top-defect-track {
            height: 13px;
            overflow: hidden;
            border-radius: 999px;
            background: #ebe7ee;
          }

          .top-defect-fill {
            height: 100%;
            border-radius: 999px;
            background:
              linear-gradient(
                90deg,
                #7c3aed,
                #a855f7
              );
          }

          .audit-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .audit-record {
            padding: 22px;
            border: 1px solid #ddd7e4;
            border-radius: 17px;
            background: #ffffff;
            break-inside: avoid;
          }

          .audit-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 16px;
          }

          .audit-number {
            margin-bottom: 4px;
            color: #675d70;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: .05em;
          }

          .audit-header h2 {
            margin: 0;
            font-size: 20px;
          }

          .outcome-badge {
            flex: 0 0 auto;
            padding: 7px 13px;
            border-radius: 999px;
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
          }

          .outcome-pass {
            background: #15803d;
          }

          .outcome-fail {
            background: #b91c1c;
          }

          .audit-details {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .audit-details > div {
            min-width: 0;
            padding: 11px;
            border-radius: 11px;
            background: #f7f5f9;
          }

          .audit-details span {
            display: block;
            margin-bottom: 4px;
            color: #675d70;
            font-size: 11px;
          }

          .audit-details strong {
            display: block;
            overflow-wrap: anywhere;
            font-size: 13px;
            line-height: 1.4;
          }

          .findings-section {
            margin-top: 17px;
            padding-top: 15px;
            border-top: 1px solid #ebe6ef;
          }

          .findings-section h3 {
            margin: 0 0 10px;
            font-size: 15px;
          }

          .finding-record {
            padding: 11px 0;
            border-bottom: 1px solid #eeeaf1;
          }

          .finding-record:last-child {
            border-bottom: 0;
          }

          .finding-heading {
            display: flex;
            justify-content: space-between;
            gap: 14px;
          }

          .finding-heading span {
            flex: 0 0 auto;
            color: #7c3aed;
            font-size: 12px;
            font-weight: 800;
          }

          .finding-meta {
            margin-top: 4px;
            color: #675d70;
            font-size: 11px;
          }

          .finding-record p {
            margin: 6px 0 0;
            color: #4e4655;
            font-size: 12px;
            line-height: 1.5;
          }

          .empty-message,
          .empty-findings,
          .no-audits {
            color: #675d70;
          }

          .no-audits {
            padding: 45px 20px;
            border: 1px solid #ddd7e4;
            border-radius: 17px;
            background: #ffffff;
            text-align: center;
          }

          @media (max-width: 760px) {
            body {
              padding: 14px;
            }

            .kpi-grid,
            .severity-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

            .audit-details {
              grid-template-columns: 1fr;
            }

            .audit-header,
            .finding-heading {
              flex-direction: column;
            }
          }

          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }

            body {
              padding: 0;
              background: #ffffff;
            }

            .toolbar {
              display: none;
            }

            .page {
              width: 100%;
              max-width: none;
            }

            .page-heading,
            .report-section,
            .audit-record {
              break-inside: avoid;
            }
          }
        </style>
      </head>

      <body>
        <div class="toolbar">
          <button
            type="button"
            onclick="window.print()"
          >
            Print / Save PDF
          </button>

          <button
            type="button"
            onclick="window.close()"
          >
            Close
          </button>
        </div>

        <main class="page">
          <header class="page-heading">
            <h1>
              ${escapeHtml(engineerName)}
            </h1>

            <div class="page-subtitle">
              ${escapeHtml(resultLabel)}
              &nbsp;•&nbsp;
              ${escapeHtml(
                getAnalyticsPeriodLabel()
              )}
            </div>

            <div class="kpi-grid">
              <div class="kpi-card">
                <strong>
                  ${selectedAudits.length}
                </strong>

                <span>
                  Audits shown
                </span>
              </div>

              <div class="kpi-card">
                <strong>
                  ${passCount}
                </strong>

                <span>PASS</span>
              </div>

              <div class="kpi-card">
                <strong>
                  ${failCount}
                </strong>

                <span>FAIL</span>
              </div>

              <div class="kpi-card">
                <strong>
                  ${passRate}%
                </strong>

                <span>PASS rate</span>
              </div>

              <div class="kpi-card">
                <strong>
                  ${matchingDefects.length}
                </strong>

                <span>
                  Total defects
                </span>
              </div>

              <div class="kpi-card">
                <strong>
                  ${defectsPerAudit.toFixed(
                    2
                  )}
                </strong>

                <span>
                  Defects per audit
                </span>
              </div>
            </div>

            <div class="severity-grid">
              <div class="severity-card">
                <strong>
                  ${severityCounts.ID}
                </strong>

                <span>ID</span>
              </div>

              <div class="severity-card">
                <strong>
                  ${severityCounts.AR}
                </strong>

                <span>AR</span>
              </div>

              <div class="severity-card">
                <strong>
                  ${severityCounts.NCS}
                </strong>

                <span>NCS</span>
              </div>

              <div class="severity-card">
                <strong>
                  ${severityCounts.Advisory}
                </strong>

                <span>Advisory</span>
              </div>
            </div>
          </header>

          <section class="report-section">
            <h2>
              Most common defects
            </h2>

            <div class="top-defects">
              ${topDefectsHtml}
            </div>
          </section>

          <section class="report-section">
            <h2>
              Audit history
            </h2>

            <div class="audit-list">
              ${auditRecordsHtml}
            </div>
          </section>
        </main>
      </body>
    </html>
  `);

  drilldownWindow.document.close();
  drilldownWindow.focus();
}

function toggleEngineerPresentationView() {
  const section = el("engineerPerformanceSection");
  const chart = el("engineerPerformanceChart");
  const period = el("engineerPerformancePeriod");
  const summary = el("engineerPerformanceSummary");

  if (!section || !chart) return;

  const presentationWindow = window.open(
    "",
    "PPCEngineerPerformancePresentation",
    "width=1600,height=950,resizable=yes,scrollbars=yes"
  );

  if (!presentationWindow) {
    alert(
      "The presentation page was blocked by the browser. Allow pop-ups for this app and press Presentation View again."
    );
    return;
  }

  const chartHtml = chart.innerHTML;
  const periodText =
    period?.textContent?.trim() || "Selected reporting period";
  const summaryHtml = summary?.innerHTML || "";

  presentationWindow.document.open();

  presentationWindow.document.write(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1"
  />

  <title>Engineer Performance Overview</title>

  <style>
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      min-height: 100%;
      background: #ffffff;
      color: #111827;
      font-family:
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        Arial,
        sans-serif;
    }

    body {
      padding: 24px;
    }

    .presentation-page {
      width: 100%;
      max-width: 1800px;
      margin: 0 auto;
    }

    .presentation-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      margin-bottom: 12px;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.2;
    }

    .period {
      margin-top: 6px;
      color: #4b5563;
      font-size: 15px;
      font-weight: 600;
    }

    .close-button {
      flex: 0 0 auto;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      padding: 9px 13px;
      background: #ffffff;
      color: #111827;
      cursor: pointer;
      font: inherit;
      font-weight: 700;
    }

    .legend {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 28px;
      margin: 16px 0;
      font-size: 14px;
      font-weight: 700;
    }

    .legend span {
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .swatch {
      width: 16px;
      height: 16px;
      border-radius: 3px;
    }

    .total {
      background: #2563eb;
    }

    .pass {
      background: #16a34a;
    }

    .fail {
      background: #dc2626;
    }

    .chart-frame {
      width: 100%;
      padding: 10px;
      overflow: hidden;
      border: 1px solid #d1d5db;
      border-radius: 14px;
      background: #ffffff;
    }

    .chart-frame svg {
      display: block !important;
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      background: #ffffff !important;
    }

    .summary {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));
      gap: 12px;
      margin-top: 16px;
    }

    .summary > div {
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #f9fafb;
      text-align: center;
    }

    .summary strong {
      display: block;
      color: #111827;
      font-size: 20px;
    }

    .summary span {
      display: block;
      margin-top: 4px;
      color: #4b5563;
      font-size: 12px;
    }

    @media (max-width: 800px) {
      body {
        padding: 12px;
      }

      .presentation-header {
        flex-direction: column;
      }

      .summary {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media print {
      body {
        padding: 0;
      }

      .close-button {
        display: none;
      }

      .presentation-page {
        max-width: none;
      }

      .chart-frame {
        border: 0;
      }
    }
  </style>
</head>

<body>
  <main class="presentation-page">
    <header class="presentation-header">
      <div>
        <h1>Engineer Performance Overview</h1>
        <div class="period">${escapeHtml(periodText)}</div>
      </div>

      <button
        class="close-button"
        type="button"
        onclick="window.close()"
      >
        Close Presentation
      </button>
    </header>

    <div class="legend">
      <span>
        <i class="swatch total"></i>
        Total audits
      </span>

      <span>
        <i class="swatch pass"></i>
        PASS
      </span>

      <span>
        <i class="swatch fail"></i>
        FAIL
      </span>
    </div>

    <section class="chart-frame">
      ${chartHtml}
    </section>

    <section class="summary">
      ${summaryHtml}
    </section>
  </main>
</body>
</html>`);

  presentationWindow.document.close();
  presentationWindow.focus();
}
function openAnalyticsCardPresentation(chartId, title) {
  const chart = el(chartId);
  const card = chart?.closest(".analytics-card");

  if (!chart || !card) {
    alert("This analytics chart could not be opened.");
    return;
  }

  const clonedCard = card.cloneNode(true);

  clonedCard.classList.remove(
    "analytics-presentation-clickable",
    "top-defects-clickable"
  );

  clonedCard.removeAttribute("role");
  clonedCard.removeAttribute("tabindex");
  clonedCard.removeAttribute("aria-label");

  const engineer =
    el("analyticsEngineer")?.value ||
    "All engineers";

  const category =
    el("analyticsCategory")?.value ||
    "All categories";

  const severity =
    el("analyticsSeverity")?.selectedOptions?.[0]?.textContent ||
    "All severities";

  const fromDate =
    el("analyticsFrom")?.value ||
    "All time";

  const toDate =
    el("analyticsTo")?.value ||
    "Present";

  const presentationWindow = window.open(
    "",
    `analyticsPresentation_${chartId}`,
    "width=1200,height=850,resizable=yes,scrollbars=yes"
  );

  if (!presentationWindow) {
    alert(
      "The presentation window was blocked. Please allow pop-ups for this app and try again."
    );
    return;
  }

  presentationWindow.document.open();

  presentationWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <title>${escapeHtml(title)}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 30px;
            background: #f5f3f7;
            color: #1b1028;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .presentation-toolbar {
            width: min(1150px, 100%);
            margin: 0 auto 14px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          .presentation-toolbar button {
            padding: 10px 16px;
            border: 1px solid #d8d1df;
            border-radius: 10px;
            background: #ffffff;
            color: #1b1028;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }

          .presentation-page {
            width: min(1150px, 100%);
            margin: 0 auto;
            padding: 34px;
            border: 1px solid #ddd7e4;
            border-radius: 22px;
            background: #ffffff;
            box-shadow:
              0 18px 45px rgba(35, 20, 50, 0.12);
          }

          .presentation-heading {
            margin-bottom: 26px;
          }

          .presentation-heading h1 {
            margin: 0 0 10px;
            font-size: 30px;
            line-height: 1.2;
          }

          .presentation-filters {
            color: #675d70;
            font-size: 14px;
            line-height: 1.6;
          }

          .analytics-card {
            min-width: 0;
            padding: 0;
            border: 0;
            background: transparent;
          }

          .analytics-card-head {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            gap: 16px;
            margin-bottom: 22px;
          }

          .analytics-card-head h3 {
            margin: 0;
            font-size: 25px;
          }

          .analytics-card-head .muted {
            color: #675d70;
            font-size: 15px;
          }

          .analytics-chart {
            min-height: 420px;
            overflow: visible;
          }

          .analytics-bars {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }

          .analytics-bar-row {
            display: grid;
            grid-template-columns:
              minmax(260px, 1.4fr)
              minmax(300px, 3fr)
              70px;
            gap: 18px;
            align-items: center;
            font-size: 18px;
          }

          .analytics-bar-label {
            overflow: visible;
            text-overflow: clip;
            white-space: normal;
            overflow-wrap: anywhere;
            line-height: 1.35;
          }

          .analytics-bar-track {
            height: 25px;
            overflow: hidden;
            border-radius: 999px;
            background: #e9e6ec;
          }

          .analytics-bar-fill {
            height: 100%;
            min-width: 3px;
            border-radius: 999px;
            background:
              linear-gradient(
                90deg,
                #7c3aed,
                #a855f7
              );
          }

          .analytics-bar-row strong {
            font-size: 20px;
          }

          .analytics-donut-wrap {
            min-height: 420px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 55px;
            flex-wrap: wrap;
          }

          .analytics-donut {
            width: 260px;
            height: 260px;
            border-radius: 50%;
            position: relative;
          }

          .analytics-donut::after {
            content: "";
            position: absolute;
            inset: 45px;
            border-radius: 50%;
            background: #ffffff;
          }

          .analytics-legend {
            display: flex;
            flex-direction: column;
            gap: 18px;
            font-size: 20px;
          }

          .analytics-legend-row {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .analytics-swatch {
            width: 18px;
            height: 18px;
            border-radius: 4px;
          }

          .analytics-svg {
            display: block;
            width: 100%;
            height: auto;
            min-height: 420px;
          }

          .analytics-empty {
            min-height: 350px;
            display: grid;
            place-items: center;
            color: #675d70;
            font-size: 18px;
          }

          @media (max-width: 750px) {
            body {
              padding: 14px;
            }

            .presentation-page {
              padding: 22px;
            }

            .analytics-bar-row {
              grid-template-columns:
                minmax(140px, 1.4fr)
                minmax(150px, 2fr)
                45px;
              gap: 10px;
              font-size: 14px;
            }

            .analytics-card-head {
              align-items: flex-start;
              flex-direction: column;
            }
          }

          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }

            .presentation-toolbar {
              display: none;
            }

            .presentation-page {
              width: 100%;
              max-width: none;
              padding: 18px;
              border: 0;
              border-radius: 0;
              box-shadow: none;
            }

            .analytics-card {
              break-inside: avoid;
            }
          }
        </style>
      </head>

      <body>
        <div class="presentation-toolbar">
          <button
            type="button"
            onclick="window.print()"
          >
            Print / Save PDF
          </button>

          <button
            type="button"
            onclick="window.close()"
          >
            Close
          </button>
        </div>

        <main class="presentation-page">
          <header class="presentation-heading">
            <h1>${escapeHtml(title)}</h1>

            <div class="presentation-filters">
              Engineer: ${escapeHtml(engineer)}
              &nbsp;•&nbsp;
              Category: ${escapeHtml(category)}
              &nbsp;•&nbsp;
              Severity: ${escapeHtml(severity)}
              <br>
              Period: ${escapeHtml(fromDate)}
              to
              ${escapeHtml(toDate)}
            </div>
          </header>

          ${clonedCard.outerHTML}
        </main>
      </body>
    </html>
  `);

  presentationWindow.document.close();
  presentationWindow.focus();
}

function openTopDefectsPresentation() {
  const { defects } = getAnalyticsSelection();

  const titleCounts = countBy(
    defects,
    defect => defect.title || "Untitled defect"
  );

  const entries = sortedCounts(titleCounts, 10);

  const uniqueDefectCount =
    Object.keys(titleCounts).length;

  const maximumCount = Math.max(
    1,
    ...entries.map(([, count]) => count)
  );

  const engineer =
    el("analyticsEngineer")?.value ||
    "All engineers";

  const fromDate =
    el("analyticsFrom")?.value ||
    "All time";

  const toDate =
    el("analyticsTo")?.value ||
    "Present";

  const rowsHtml = entries.length
    ? entries
        .map(([label, count]) => {
          const width = Math.max(
            3,
            (count / maximumCount) * 100
          );

          return `
            <div class="defect-row">
              <div class="defect-heading">
                <div class="defect-name">
                  ${escapeHtml(label)}
                </div>

                <div class="defect-count">
                  ${count}
                </div>
              </div>

              <div class="defect-track">
                <div
                  class="defect-fill"
                  style="width:${width}%"
                ></div>
              </div>
            </div>
          `;
        })
        .join("")
    : `
        <div class="empty-message">
          No defects match the current analytics filters.
        </div>
      `;

  const presentationWindow = window.open(
    "",
    "topDefectsPresentation",
    "width=1100,height=800,resizable=yes,scrollbars=yes"
  );

  if (!presentationWindow) {
    alert(
      "The presentation window was blocked. Please allow pop-ups for this app and try again."
    );
    return;
  }

  presentationWindow.document.open();

  presentationWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <title>Most common defects</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 30px;
            background: #f5f3f7;
            color: #1b1028;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .toolbar {
            width: min(1100px, 100%);
            margin: 0 auto 14px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          .toolbar button {
            padding: 10px 16px;
            border: 1px solid #d8d1df;
            border-radius: 10px;
            background: #ffffff;
            color: #1b1028;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }

          .presentation-card {
            width: min(1100px, 100%);
            margin: 0 auto;
            padding: 32px;
            border: 1px solid #ddd7e4;
            border-radius: 22px;
            background: #ffffff;
            box-shadow:
              0 18px 45px rgba(35, 20, 50, 0.12);
          }

          .presentation-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 30px;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 30px;
            line-height: 1.2;
          }

          .filters {
            color: #675d70;
            font-size: 15px;
            line-height: 1.5;
          }

          .unique-count {
            color: #675d70;
            font-size: 16px;
            white-space: nowrap;
          }

          .defects-list {
            display: flex;
            flex-direction: column;
            gap: 22px;
          }

          .defect-row {
            break-inside: avoid;
          }

          .defect-heading {
            display: grid;
            grid-template-columns:
              minmax(0, 1fr)
              55px;
            align-items: end;
            gap: 20px;
            margin-bottom: 8px;
          }

          .defect-name {
            font-size: 18px;
            font-weight: 600;
            line-height: 1.4;
            white-space: normal;
            overflow-wrap: anywhere;
          }

          .defect-count {
            text-align: right;
            font-size: 20px;
            font-weight: 800;
          }

          .defect-track {
            width: 100%;
            height: 24px;
            overflow: hidden;
            border-radius: 999px;
            background: #e9e6ec;
          }

          .defect-fill {
            height: 100%;
            min-width: 3px;
            border-radius: 999px;
            background:
              linear-gradient(
                90deg,
                #7c3aed,
                #a855f7
              );
          }

          .empty-message {
            padding: 50px 20px;
            color: #675d70;
            text-align: center;
            font-size: 18px;
          }

          @media (max-width: 650px) {
            body {
              padding: 14px;
            }

            .presentation-card {
              padding: 22px;
            }

            .presentation-header {
              flex-direction: column;
              gap: 6px;
            }

            .unique-count {
              white-space: normal;
            }

            .defect-name {
              font-size: 16px;
            }
          }

          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }

            .toolbar {
              display: none;
            }

            .presentation-card {
              width: 100%;
              max-width: none;
              padding: 20px;
              border: 0;
              border-radius: 0;
              box-shadow: none;
            }
          }
        </style>
      </head>

      <body>
        <div class="toolbar">
          <button
            type="button"
            onclick="window.print()"
          >
            Print / Save PDF
          </button>

          <button
            type="button"
            onclick="window.close()"
          >
            Close
          </button>
        </div>

        <main class="presentation-card">
          <header class="presentation-header">
            <div>
              <h1>Most common defects</h1>

              <div class="filters">
                ${escapeHtml(engineer)}
                &nbsp;•&nbsp;
                ${escapeHtml(fromDate)}
                to
                ${escapeHtml(toDate)}
              </div>
            </div>

            <div class="unique-count">
              ${uniqueDefectCount} unique defects
            </div>
          </header>

          <section class="defects-list">
            ${rowsHtml}
          </section>
        </main>
      </body>
    </html>
  `);

  presentationWindow.document.close();
  presentationWindow.focus();
}

function parseAnalyticsDate(
  value
) {
  const match = String(value || "")
    .match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (!match) return null;

  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3])
  );
}

function getAnalyticsComparisonPeriods() {
  const currentFrom =
    el("analyticsFrom")?.value || "";

  const currentTo =
    el("analyticsTo")?.value || "";

 const mode =
  el("analyticsCompareMode")
    ?.value ||
  "previous-equivalent";

/*
  No comparison means the page should use
  only the currently selected date range.
*/
if (mode === "none") {
  return {
    currentFrom,
    currentTo,
    previousFrom: "",
    previousTo: "",
    periodLength: 0,
    comparisonEnabled: false
  };
}

const fromDate =
    parseAnalyticsDate(
      currentFrom
    );

  const toDate =
    parseAnalyticsDate(
      currentTo
    );

  if (
    !fromDate ||
    !toDate ||
    fromDate > toDate
  ) {
    return null;
  }

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  const periodLength =
    Math.round(
      (
        toDate.getTime() -
        fromDate.getTime()
      ) /
      millisecondsPerDay
    ) + 1;

  let previousFrom = "";
  let previousTo = "";

  /*
    CUSTOM COMPARISON
  */
  if (mode === "custom") {
    previousFrom =
      el("analyticsCompareFrom")
        ?.value || "";

    previousTo =
      el("analyticsCompareTo")
        ?.value || "";

    const customFromDate =
      parseAnalyticsDate(
        previousFrom
      );

    const customToDate =
      parseAnalyticsDate(
        previousTo
      );

    if (
      !customFromDate ||
      !customToDate ||
      customFromDate >
        customToDate
    ) {
      return null;
    }
  }

  /*
    PREVIOUS QUARTER
  */
  else if (
    mode === "previous-quarter"
  ) {
    const quarter =
      getQuarterDatesBefore(
        currentFrom
      );

    if (!quarter) {
      return null;
    }

    previousFrom =
      quarter.from;

    previousTo =
      quarter.to;
  }

  /*
    PREVIOUS YEAR
  */
  else if (
    mode === "previous-year"
  ) {
    const previousFromDate =
      new Date(fromDate);

    const previousToDate =
      new Date(toDate);

    previousFromDate.setFullYear(
      previousFromDate.getFullYear() -
      1
    );

    previousToDate.setFullYear(
      previousToDate.getFullYear() -
      1
    );

    previousFrom =
      formatAnalyticsInputDate(
        previousFromDate
      );

    previousTo =
      formatAnalyticsInputDate(
        previousToDate
      );
  }

  /*
    PREVIOUS EQUIVALENT PERIOD
  */
  else {
    const previousToDate =
      new Date(fromDate);

    previousToDate.setDate(
      previousToDate.getDate() - 1
    );

    const previousFromDate =
      new Date(
        previousToDate
      );

    previousFromDate.setDate(
      previousFromDate.getDate() -
      periodLength +
      1
    );

    previousFrom =
      formatAnalyticsInputDate(
        previousFromDate
      );

    previousTo =
      formatAnalyticsInputDate(
        previousToDate
      );
  }

  return {
  currentFrom,
  currentTo,
  previousFrom,
  previousTo,
  periodLength,
  comparisonEnabled: true
};
}

function getAnalyticsSelectionForRange(
  from,
  to
) {
  const engineer =
    el("analyticsEngineer")?.value || "";

  const category =
    el("analyticsCategory")?.value || "";

  const severity =
    el("analyticsSeverity")?.value || "";

  const search =
    (
      el("analyticsSearch")?.value ||
      ""
    )
      .trim()
      .toLowerCase();

  const defects =
    analyticsState.defects.filter(
      defect => {
        if (
          !analyticsDateInRange(
            defect.date,
            from,
            to
          )
        ) {
          return false;
        }

        if (
          engineer &&
          defect.engineer !== engineer
        ) {
          return false;
        }

        if (
          category &&
          (
            defect.category ||
            "Other"
          ) !== category
        ) {
          return false;
        }

        if (
          severity &&
          defect.severity !== severity
        ) {
          return false;
        }

        if (search) {
          const haystack = `
            ${defect.title || ""}
            ${defect.tag || ""}
            ${defect.notes || ""}
            ${defect.why || ""}
            ${defect.action || ""}
          `.toLowerCase();

          if (
            !haystack.includes(search)
          ) {
            return false;
          }
        }

        return true;
      }
    );

  /*
    This matches the existing Analytics
    behaviour: audit totals are filtered by
    date and engineer, while defect-specific
    filters apply to defect records.
  */
  const audits =
    analyticsState.audits.filter(
      audit => {
        if (
          !analyticsDateInRange(
            audit.date,
            from,
            to
          )
        ) {
          return false;
        }

        if (
          engineer &&
          audit.engineer !== engineer
        ) {
          return false;
        }

        return true;
      }
    );

  return {
    defects,
    audits
  };
}

function getAnalyticsTrendMetrics(
  selection
) {
  const audits =
    selection.audits || [];

  const defects =
    selection.defects || [];

  const passCount =
    audits.filter(audit =>
      isPassingOutcome(
        audit.outcome
      )
    ).length;

  const passRate =
    audits.length
      ? Math.round(
          (
            passCount /
            audits.length
          ) * 100
        )
      : 0;

  const defectsPerAudit =
    audits.length
      ? defects.length /
        audits.length
      : 0;

  const severityCounts = {
    ID: 0,
    AR: 0,
    NCS: 0,
    Advisory: 0
  };

  defects.forEach(defect => {
    const severity =
      getAnalyticsSeverityLabel(
        defect.severity
      );

    if (
      Object.prototype.hasOwnProperty.call(
        severityCounts,
        severity
      )
    ) {
      severityCounts[severity]++;
    }
  });

  return {
    audits,
    defects,
    passCount,
    failCount:
      audits.length - passCount,
    passRate,
    defectsPerAudit,
    severityCounts,

    titleCounts: countBy(
      defects,
      defect =>
        defect.title ||
        "Untitled defect"
    ),

    categoryCounts: countBy(
      defects,
      defect =>
        defect.category ||
        "Other"
    )
  };
}

function buildAnalyticsTrendAlerts(
  current,
  previous
) {
  const alerts = [];

  const addAlert = alert => {
    alerts.push({
      priority: 99,
      tone: "info",
      recordType: "defects",
      filterType: "all",
      filterValue: "",
      ...alert
    });
  };

  /*
    ID increase: highest priority.
  */
  if (
    current.severityCounts.ID >
    previous.severityCounts.ID
  ) {
    addAlert({
      priority: 1,
      tone: "danger",
      title: "ID findings increased",

      message:
        `${current.severityCounts.ID} this period compared with ` +
        `${previous.severityCounts.ID} previously.`,

      recordType: "defects",
      filterType: "severity",
      filterValue: "ID"
    });
  }

  /*
    PASS-rate deterioration or improvement.

    Require audit data in both periods so a
    zero-record period does not create a
    misleading percentage comparison.
  */
  if (
    current.audits.length &&
    previous.audits.length
  ) {
    const passRateChange =
      current.passRate -
      previous.passRate;

    if (passRateChange <= -5) {
      addAlert({
        priority: 2,
        tone: "danger",
        title: "PASS rate decreased",

        message:
          `${current.passRate}% this period compared with ` +
          `${previous.passRate}% previously — a fall of ` +
          `${Math.abs(passRateChange)} percentage points.`,

        recordType: "audits",
        filterType: "all",
        filterValue: ""
      });
    }

    if (passRateChange >= 5) {
      addAlert({
        priority: 20,
        tone: "success",
        title: "PASS rate improved",

        message:
          `${current.passRate}% this period compared with ` +
          `${previous.passRate}% previously — an improvement of ` +
          `${passRateChange} percentage points.`,

        recordType: "audits",
        filterType: "all",
        filterValue: ""
      });
    }
  }

  /*
    AR changes.
  */
  if (
    current.severityCounts.AR >
    previous.severityCounts.AR
  ) {
    addAlert({
      priority: 3,
      tone: "warning",
      title: "AR findings increased",

      message:
        `${current.severityCounts.AR} this period compared with ` +
        `${previous.severityCounts.AR} previously.`,

      recordType: "defects",
      filterType: "severity",
      filterValue: "AR"
    });
  }

  /*
    Defects per audit: alert at 20% movement.

    Avoid dividing by zero and require at
    least one audit in both periods.
  */
  if (
    current.audits.length &&
    previous.audits.length
  ) {
    const previousAverage =
      previous.defectsPerAudit;

    const currentAverage =
      current.defectsPerAudit;

    if (previousAverage > 0) {
      const percentageChange =
        (
          (
            currentAverage -
            previousAverage
          ) /
          previousAverage
        ) * 100;

      if (percentageChange >= 20) {
        addAlert({
          priority: 4,
          tone: "danger",
          title:
            "Defects per audit increased",

          message:
            `${currentAverage.toFixed(2)} this period compared with ` +
            `${previousAverage.toFixed(2)} previously — an increase of ` +
            `${Math.round(percentageChange)}%.`,

          recordType: "defects",
          filterType: "all",
          filterValue: ""
        });
      }

      if (percentageChange <= -20) {
        addAlert({
          priority: 21,
          tone: "success",
          title:
            "Defects per audit improved",

          message:
            `${currentAverage.toFixed(2)} this period compared with ` +
            `${previousAverage.toFixed(2)} previously — a reduction of ` +
            `${Math.abs(
              Math.round(
                percentageChange
              )
            )}%.`,

          recordType: "defects",
          filterType: "all",
          filterValue: ""
        });
      }
    } else if (currentAverage > 0) {
      addAlert({
        priority: 4,
        tone: "danger",
        title:
          "Defects per audit increased",

        message:
          `${currentAverage.toFixed(2)} this period compared with ` +
          `0.00 previously.`,

        recordType: "defects",
        filterType: "all",
        filterValue: ""
      });
    }
  }

  /*
    Increasing individual defect titles.

    Current count must be at least three.
  */
  Object.entries(
    current.titleCounts
  ).forEach(([title, count]) => {
    const previousCount =
      previous.titleCounts[title] || 0;

    if (
      count >= 3 &&
      count > previousCount
    ) {
      addAlert({
        priority: 5,
        tone: "warning",
        title:
          "Repeat defect increasing",

        message:
          `"${title}" occurred ${count} times, compared with ` +
          `${previousCount} previously.`,

        recordType: "defects",
        filterType: "title",
        filterValue: title
      });
    }
  });

  /*
    Category increase: at least three current
    findings and at least a 50% increase.
  */
  Object.entries(
    current.categoryCounts
  ).forEach(([category, count]) => {
    const previousCount =
      previous.categoryCounts[
        category
      ] || 0;

    const increasedEnough =
      previousCount === 0
        ? count >= 3
        : (
            (
              count -
              previousCount
            ) /
            previousCount
          ) >= 0.5;

    if (
      count >= 3 &&
      count > previousCount &&
      increasedEnough
    ) {
      addAlert({
        priority: 6,
        tone: "warning",
        title:
          `${category} findings increased`,

        message:
          `${count} this period compared with ` +
          `${previousCount} previously.`,

        recordType: "defects",
        filterType: "category",
        filterValue: category
      });
    }
  });

  /*
    Positive higher-risk changes only appear
    when a previous problem has reduced.
  */
  if (
    previous.severityCounts.ID > 0 &&
    current.severityCounts.ID === 0
  ) {
    addAlert({
      priority: 22,
      tone: "success",
      title:
        "ID performance improved",

      message:
        `No ID findings this period, down from ` +
        `${previous.severityCounts.ID} previously.`,

      recordType: "defects",
      filterType: "severity",
      filterValue: "ID"
    });
  }

  if (
    previous.severityCounts.AR > 0 &&
    current.severityCounts.AR === 0
  ) {
    addAlert({
      priority: 23,
      tone: "success",
      title:
        "AR performance improved",

      message:
        `No AR findings this period, down from ` +
        `${previous.severityCounts.AR} previously.`,

      recordType: "defects",
      filterType: "severity",
      filterValue: "AR"
    });
  }

  return alerts
    .sort((a, b) => {
      if (
        a.priority !== b.priority
      ) {
        return (
          a.priority -
          b.priority
        );
      }

      return a.title.localeCompare(
        b.title
      );
    })
    .slice(0, 6);
}

function renderAnalyticsTrendAlerts() {
  const container = el(
    "analyticsAlerts"
  );

  const periodElement = el(
    "analyticsAlertsPeriod"
  );

  const countElement = el(
    "analyticsAlertsCount"
  );

  if (!container) return;

  const periods =
  getAnalyticsComparisonPeriods();

const alertsCard =
  el("analyticsAlertsCard");

if (
  periods &&
  periods.comparisonEnabled === false
) {
  alertsCard?.classList.add(
    "hidden"
  );

  return;
}

alertsCard?.classList.remove(
  "hidden"
);

if (!periods) {
    container.innerHTML = `
      <div class="analytics-alerts-message">
        Select both a From and To date to compare this period with the preceding equivalent period.
      </div>
    `;

    if (periodElement) {
      periodElement.textContent = "";
    }

    if (countElement) {
      countElement.textContent = "";
      countElement.classList.add(
        "hidden"
      );
    }

    return;
  }

  const currentSelection =
    getAnalyticsSelectionForRange(
      periods.currentFrom,
      periods.currentTo
    );

  const previousSelection =
    getAnalyticsSelectionForRange(
      periods.previousFrom,
      periods.previousTo
    );

  const currentMetrics =
    getAnalyticsTrendMetrics(
      currentSelection
    );

  const previousMetrics =
    getAnalyticsTrendMetrics(
      previousSelection
    );

  const alerts =
    buildAnalyticsTrendAlerts(
      currentMetrics,
      previousMetrics
    );

  if (periodElement) {
    periodElement.textContent =
      `${formatDate(
        periods.currentFrom
      )}–${formatDate(
        periods.currentTo
      )} compared with ${formatDate(
        periods.previousFrom
      )}–${formatDate(
        periods.previousTo
      )}`;
  }

  if (!alerts.length) {
    container.innerHTML = `
      <div class="analytics-alerts-clear">
        <span class="analytics-alert-icon">
          ✓
        </span>

        <div>
          <strong>
            No significant changes identified
          </strong>

          <p>
            No alert thresholds were reached for this reporting period.
          </p>
        </div>
      </div>
    `;

    if (countElement) {
      countElement.textContent = "";
      countElement.classList.add(
        "hidden"
      );
    }

    return;
  }

  if (countElement) {
    countElement.textContent =
      `${alerts.length} alert${
        alerts.length === 1
          ? ""
          : "s"
      }`;

    countElement.classList.remove(
      "hidden"
    );
  }

  container.innerHTML = `
  <div class="analytics-alert-list">
    ${alerts
      .map((alert, index) => {
        const toneLabel =
          alert.tone === "danger"
            ? "High priority"
            : alert.tone === "warning"
              ? "Watch"
              : alert.tone === "success"
                ? "Improved"
                : "Info";

        return `
          <button
            type="button"
            class="
              analytics-alert-row
              analytics-alert-${alert.tone}
            "
            data-alert-index="${index}"
          >
            <span
              class="analytics-alert-status"
              aria-hidden="true"
            ></span>

            <span class="analytics-alert-copy">
              <span class="analytics-alert-topline">
                <span
                  class="
                    analytics-alert-tone-pill
                    analytics-alert-tone-pill-${alert.tone}
                  "
                >
                  ${toneLabel}
                </span>

                <strong>
                  ${escapeHtml(
                    alert.title
                  )}
                </strong>
              </span>

              <span class="analytics-alert-message">
                ${escapeHtml(
                  alert.message
                )}
              </span>
            </span>

            <span
              class="analytics-alert-open"
              aria-hidden="true"
            >
              View details →
            </span>
          </button>
        `;
      })
      .join("")}
  </div>
`;

  container
    .querySelectorAll(
      "[data-alert-index]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        event => {
          event.stopPropagation();

          const alert =
            alerts[
              Number(
                button.dataset
                  .alertIndex
              )
            ];

          if (!alert) return;

          openAnalyticsTrendAlertDrilldown(
            alert,
            currentSelection,
            periods
          );
        }
      );
    });
}

function openAnalyticsTrendAlertDrilldown(
  alert,
  currentSelection,
  periods
) {
  let matchingAudits = [
    ...currentSelection.audits
  ];

  let matchingDefects = [
    ...currentSelection.defects
  ];

  if (
    alert.recordType === "defects"
  ) {
    if (
      alert.filterType ===
      "severity"
    ) {
      matchingDefects =
        matchingDefects.filter(
          defect =>
            getAnalyticsSeverityLabel(
              defect.severity
            ) === alert.filterValue
        );
    }

    if (
      alert.filterType === "title"
    ) {
      matchingDefects =
        matchingDefects.filter(
          defect =>
            String(
              defect.title || ""
            )
              .trim()
              .toLowerCase() ===
            String(
              alert.filterValue || ""
            )
              .trim()
              .toLowerCase()
        );
    }

    if (
      alert.filterType ===
      "category"
    ) {
      matchingDefects =
        matchingDefects.filter(
          defect =>
            String(
              defect.category ||
              "Other"
            ) ===
            String(
              alert.filterValue
            )
        );
    }

    const auditIds = new Set(
      matchingDefects.map(
        defect =>
          String(
            defect.auditId || ""
          )
      )
    );

    matchingAudits =
      matchingAudits.filter(
        audit =>
          auditIds.has(
            String(audit.id || "")
          )
      );
  }

  matchingAudits.sort((a, b) =>
    String(b.date || "")
      .localeCompare(
        String(a.date || "")
      )
  );

  matchingDefects.sort((a, b) =>
    String(b.date || "")
      .localeCompare(
        String(a.date || "")
      )
  );

  const auditRows =
    matchingAudits.length
      ? matchingAudits
          .map(audit => `
            <tr>
              <td>
                ${escapeHtml(
                  formatDate(
                    audit.date
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  audit.engineer || "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  audit.jobRef || "—"
                )}
              </td>

              <td>
                <span
                  class="
                    result-badge
                    ${
                      isPassingOutcome(
                        audit.outcome
                      )
                        ? "result-pass"
                        : "result-fail"
                    }
                  "
                >
                  ${
                    isPassingOutcome(
                      audit.outcome
                    )
                      ? "PASS"
                      : "FAIL"
                  }
                </span>
              </td>

              <td>
                ${escapeHtml(
                  audit.outcome || "—"
                )}
              </td>
            </tr>
          `)
          .join("")
      : `
          <tr>
            <td colspan="5">
              No matching audits.
            </td>
          </tr>
        `;

  const defectRows =
    matchingDefects.length
      ? matchingDefects
          .map(defect => `
            <tr>
              <td>
                ${escapeHtml(
                  formatDate(
                    defect.date
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  defect.engineer || "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  defect.jobRef || "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  defect.title || "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  defect.category ||
                  "Other"
                )}
              </td>

              <td>
                ${escapeHtml(
                  getAnalyticsSeverityLabel(
                    defect.severity
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  defect.action || "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  defect.notes || "—"
                )}
              </td>
            </tr>
          `)
          .join("")
      : `
          <tr>
            <td colspan="8">
              No matching defects.
            </td>
          </tr>
        `;

  const detailWindow =
    window.open(
      "",
      "PPCTrendAlertDetails",
      "width=1400,height=950,resizable=yes,scrollbars=yes"
    );

  if (!detailWindow) {
    alert(
      "The alert details window was blocked. Please allow pop-ups for this app and try again."
    );

    return;
  }

  detailWindow.document.open();

  detailWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <title>
          ${escapeHtml(alert.title)}
        </title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 30px;
            background: #f4f1f7;
            color: #1b1028;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .toolbar {
            width: min(1300px, 100%);
            margin: 0 auto 14px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          .toolbar button {
            padding: 10px 16px;
            border: 1px solid #d8d1df;
            border-radius: 10px;
            background: #ffffff;
            color: #1b1028;
            font-weight: 700;
            cursor: pointer;
          }

          .page {
            width: min(1300px, 100%);
            margin: 0 auto;
          }

          .heading,
          .section {
            padding: 24px;
            border: 1px solid #ddd7e4;
            border-radius: 18px;
            background: #ffffff;
          }

          .heading h1 {
            margin: 0 0 8px;
            font-size: 28px;
          }

          .heading-message {
            font-size: 16px;
            line-height: 1.5;
          }

          .heading-period {
            margin-top: 9px;
            color: #675d70;
            font-size: 13px;
          }

          .summary-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-top: 16px;
          }

          .summary-card {
            padding: 15px;
            border: 1px solid #ddd7e4;
            border-radius: 13px;
            background: #faf8fc;
            text-align: center;
          }

          .summary-card strong {
            display: block;
            font-size: 24px;
          }

          .summary-card span {
            display: block;
            margin-top: 4px;
            color: #675d70;
            font-size: 12px;
          }

          .section {
            margin-top: 16px;
          }

          .section h2 {
            margin: 0 0 14px;
            font-size: 19px;
          }

          .table-wrap {
            overflow-x: auto;
            border: 1px solid #ddd7e4;
            border-radius: 13px;
          }

          table {
            width: 100%;
            min-width: 780px;
            border-collapse: collapse;
            font-size: 12px;
          }

          th,
          td {
            padding: 10px;
            border-bottom:
              1px solid #ebe6ef;
            text-align: left;
            vertical-align: top;
          }

          th {
            background: #f0e9ff;
          }

          tr:last-child td {
            border-bottom: 0;
          }

          .result-badge {
            display: inline-block;
            padding: 5px 9px;
            border-radius: 999px;
            color: #ffffff;
            font-size: 11px;
            font-weight: 800;
          }

          .result-pass {
            background: #15803d;
          }

          .result-fail {
            background: #b91c1c;
          }

          @media (max-width: 700px) {
            body {
              padding: 14px;
            }

            .summary-grid {
              grid-template-columns: 1fr;
            }
          }

          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }

            .toolbar {
              display: none;
            }

            .page {
              width: 100%;
              max-width: none;
            }

            .heading,
            .section {
              break-inside: avoid;
            }
          }
        </style>
      </head>

      <body>
        <div class="toolbar">
          <button
            type="button"
            onclick="window.print()"
          >
            Print / Save PDF
          </button>

          <button
            type="button"
            onclick="window.close()"
          >
            Close
          </button>
        </div>

        <main class="page">
          <header class="heading">
            <h1>
              ${escapeHtml(alert.title)}
            </h1>

            <div class="heading-message">
              ${escapeHtml(alert.message)}
            </div>

            <div class="heading-period">
              Current period:
              ${escapeHtml(
                formatDate(
                  periods.currentFrom
                )
              )}
              to
              ${escapeHtml(
                formatDate(
                  periods.currentTo
                )
              )}
            </div>

            <div class="summary-grid">
              <div class="summary-card">
                <strong>
                  ${matchingAudits.length}
                </strong>

                <span>
                  Matching audits
                </span>
              </div>

              <div class="summary-card">
                <strong>
                  ${matchingDefects.length}
                </strong>

                <span>
                  Matching defects
                </span>
              </div>
            </div>
          </header>

          <section class="section">
            <h2>Audits</h2>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Engineer</th>
                    <th>Job reference</th>
                    <th>Result</th>
                    <th>Outcome</th>
                  </tr>
                </thead>

                <tbody>
                  ${auditRows}
                </tbody>
              </table>
            </div>
          </section>

          ${
            alert.recordType ===
            "defects"
              ? `
                  <section class="section">
                    <h2>Defects</h2>

                    <div class="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Engineer</th>
                            <th>Job reference</th>
                            <th>Defect</th>
                            <th>Category</th>
                            <th>Severity</th>
                            <th>Required action</th>
                            <th>Notes</th>
                          </tr>
                        </thead>

                        <tbody>
                          ${defectRows}
                        </tbody>
                      </table>
                    </div>
                  </section>
                `
              : ""
          }
        </main>
      </body>
    </html>
  `);

  detailWindow.document.close();
  detailWindow.focus();
}

function renderAnalytics() {
  if (!el("tabAnalytics")) return;
  refreshAnalyticsFilters();
  const { defects, audits } = getAnalyticsSelection();
  const pass = audits.filter(a => isPassingOutcome(a.outcome)).length;
  const fail = audits.length - pass;
  const passRate = audits.length ? Math.round(pass / audits.length * 100) : 0;
  const avgDefects = audits.length ? (defects.length / audits.length).toFixed(1) : "0.0";

 el("analyticsKpis").innerHTML = [
  ["Audits", audits.length],
  ["Defects", defects.length],
  ["Pass rate", `${passRate}%`],
  ["Defects / audit", avgDefects]
].map(([label,value]) => `<div class="analytics-kpi"><div class="label">${label}</div><div class="value">${value}</div></div>`).join("");

renderAnalyticsTrendAlerts();

const titleCounts = countBy(defects, d => d.title);
  renderHorizontalBars(
  el("topDefectsChart"),
  sortedCounts(titleCounts, 10),
  "title"
);
  el("topDefectsCaption").textContent = defects.length ? `${Object.keys(titleCounts).length} unique defects` : "";

  renderPassFailChart(pass, fail);
  el("passFailCaption").textContent = audits.length ? `${pass}/${audits.length} passed` : "";

   renderHorizontalBars(
  el("categoryChart"),
  sortedCounts(
    countBy(
      defects,
      d => d.category || "Other"
    ),
    8
  ),
  "category"
);

renderHorizontalBars(
  el("severityChart"),
  sortedCounts(
    countBy(
      defects,
      d => getAnalyticsSeverityLabel(d.severity)
    ),
    8
  ),
  "severity"
);

   renderMonthlyAuditChart(audits);
  renderEngineerPerformanceChart(audits);

  renderAnalyticsExternalPerformanceMetrics(
    getAnalyticsComparisonPeriods()
  );

  renderAnalyticsTable(defects);
}

function getAnalyticsSeverityLabel(value) {
  const severity = String(value || "Other").trim();

  if (
    severity === "Critical" ||
    severity === "Immediate" ||
    severity === "ID"
  ) {
    return "ID";
  }

  if (
    severity === "Major" ||
    severity === "AR"
  ) {
    return "AR";
  }

  if (
    severity === "Minor" ||
    severity === "NCS"
  ) {
    return "NCS";
  }

  if (severity === "Advisory") {
    return "Advisory";
  }

  return severity;
}

function renderHorizontalBars(
  container,
  entries,
  drilldownType = ""
) {
  if (!container) return;

  if (!entries.length) {
    container.innerHTML = `
      <div class="analytics-empty">
        No data for these filters.
      </div>
    `;
    return;
  }

  const maximum = Math.max(
    ...entries.map(item => item[1]),
    1
  );

  container.innerHTML = `
    <div class="analytics-bars">
      ${entries
        .map(([label, value]) => {
          const clickableClass = drilldownType
            ? " analytics-drilldown-row"
            : "";

          const accessibility = drilldownType
            ? `
                role="button"
                tabindex="0"
                aria-label="View ${escapeHtml(label)} defect details"
              `
            : "";

          return `
            <div
              class="analytics-bar-row${clickableClass}"
              title="${escapeHtml(label)}: ${value}"
              data-drilldown-label="${escapeHtml(label)}"
              ${accessibility}
            >
              <div class="analytics-bar-label">
                ${escapeHtml(label)}
              </div>

              <div class="analytics-bar-track">
                <div
                  class="analytics-bar-fill"
                  style="width:${
                    Math.max(
                      2,
                      (value / maximum) * 100
                    )
                  }%"
                ></div>
              </div>

              <strong>${value}</strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  if (!drilldownType) return;

  container
    .querySelectorAll(".analytics-drilldown-row")
    .forEach(row => {
      const openRow = event => {
        /*
          Prevent the click from reaching the analytics card.

          Without this, clicking a bar would also open the card's
          presentation view.
        */
        event.stopPropagation();

        const label =
          row.dataset.drilldownLabel || "";

        openDefectDrilldown(
          drilldownType,
          label
        );
      };

      row.addEventListener("click", openRow);

      row.addEventListener("keydown", event => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          openRow(event);
        }
      });
    });
}

function openDefectDrilldown(type, selectedLabel) {
  const { defects } = getAnalyticsSelection();

  const normalizedSelectedLabel =
    String(selectedLabel || "")
      .trim()
      .toLowerCase();

  const matchingDefects = defects
    .filter(defect => {
      if (type === "title") {
        return String(
          defect.title || "Untitled defect"
        )
          .trim()
          .toLowerCase() === normalizedSelectedLabel;
      }

      if (type === "category") {
        return String(
          defect.category || "Other"
        )
          .trim()
          .toLowerCase() === normalizedSelectedLabel;
      }

      if (type === "severity") {
        return getAnalyticsSeverityLabel(
          defect.severity
        )
          .trim()
          .toLowerCase() === normalizedSelectedLabel;
      }

      return false;
    })
    .sort((a, b) =>
      String(b.date || "").localeCompare(
        String(a.date || "")
      )
    );

  const drilldownTitles = {
    title: "Defect details",
    category: "Defects by category",
    severity: "Defects by severity"
  };

  const pageTitle =
    drilldownTitles[type] ||
    "Defect details";

  const engineer =
    el("analyticsEngineer")?.value ||
    "All engineers";

  const fromDate =
    el("analyticsFrom")?.value ||
    "All time";

  const toDate =
    el("analyticsTo")?.value ||
    "Present";

  const resultWord =
    matchingDefects.length === 1
      ? "record"
      : "records";

  const recordsHtml = matchingDefects.length
    ? matchingDefects
        .map((defect, index) => {
          const severity =
            getAnalyticsSeverityLabel(
              defect.severity
            );

          return `
            <article class="defect-record">
              <header class="defect-record-header">
                <div>
                  <div class="record-number">
                    Record ${index + 1}
                  </div>

                  <h2>
                    ${escapeHtml(
                      defect.title ||
                      "Untitled defect"
                    )}
                  </h2>
                </div>

                <span class="severity-badge">
                  ${escapeHtml(severity)}
                </span>
              </header>

              <div class="record-grid">
                <div>
                  <span>Date</span>
                  <strong>
                    ${escapeHtml(
                      formatDate(defect.date)
                    )}
                  </strong>
                </div>

                <div>
                  <span>Engineer</span>
                  <strong>
                    ${escapeHtml(
                      defect.engineer || "—"
                    )}
                  </strong>
                </div>

                <div>
                  <span>Job reference</span>
                  <strong>
                    ${escapeHtml(
                      defect.jobRef || "—"
                    )}
                  </strong>
                </div>

                <div>
                  <span>Outcome</span>
                  <strong>
                    ${escapeHtml(
                      defect.outcome || "—"
                    )}
                  </strong>
                </div>

                <div>
                  <span>Category</span>
                  <strong>
                    ${escapeHtml(
                      defect.category || "Other"
                    )}
                  </strong>
                </div>

                <div>
                  <span>Issue tag</span>
                  <strong>
                    ${escapeHtml(
                      defect.tag || "—"
                    )}
                  </strong>
                </div>
              </div>

              ${
                defect.why
                  ? `
                      <section class="record-section">
                        <h3>Why it matters</h3>
                        <p>
                          ${escapeHtml(defect.why)}
                        </p>
                      </section>
                    `
                  : ""
              }

              ${
                defect.action
                  ? `
                      <section class="record-section">
                        <h3>Required action</h3>
                        <p>
                          ${escapeHtml(defect.action)}
                        </p>
                      </section>
                    `
                  : ""
              }

              ${
                defect.notes
                  ? `
                      <section class="record-section">
                        <h3>Notes</h3>
                        <p>
                          ${escapeHtml(defect.notes)}
                        </p>
                      </section>
                    `
                  : ""
              }
            </article>
          `;
        })
        .join("")
    : `
        <div class="empty-results">
          No matching defects were found.
        </div>
      `;

  const drilldownWindow = window.open(
    "",
    "PPCDefectDrilldown",
    "width=1200,height=900,resizable=yes,scrollbars=yes"
  );

  if (!drilldownWindow) {
    alert(
      "The defect details window was blocked. Please allow pop-ups for this app and try again."
    );
    return;
  }

  drilldownWindow.document.open();

  drilldownWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <title>
          ${escapeHtml(pageTitle)}:
          ${escapeHtml(selectedLabel)}
        </title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 30px;
            background: #f5f3f7;
            color: #1b1028;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .toolbar {
            width: min(1150px, 100%);
            margin: 0 auto 14px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          .toolbar button {
            padding: 10px 16px;
            border: 1px solid #d8d1df;
            border-radius: 10px;
            background: #ffffff;
            color: #1b1028;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }

          .page {
            width: min(1150px, 100%);
            margin: 0 auto;
          }

          .page-heading {
            margin-bottom: 18px;
            padding: 28px;
            border: 1px solid #ddd7e4;
            border-radius: 20px;
            background: #ffffff;
          }

          .page-heading h1 {
            margin: 0 0 8px;
            font-size: 30px;
            line-height: 1.25;
          }

          .selected-value {
            color: #7c3aed;
          }

          .page-summary {
            color: #675d70;
            font-size: 15px;
            line-height: 1.6;
          }

          .records {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .defect-record {
            padding: 24px;
            border: 1px solid #ddd7e4;
            border-radius: 18px;
            background: #ffffff;
            break-inside: avoid;
          }

          .defect-record-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 20px;
          }

          .record-number {
            margin-bottom: 5px;
            color: #675d70;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.06em;
          }

          .defect-record h2 {
            margin: 0;
            font-size: 21px;
            line-height: 1.35;
          }

          .severity-badge {
            flex: 0 0 auto;
            padding: 7px 12px;
            border: 1px solid #c9b4f4;
            border-radius: 999px;
            background: #f3edff;
            color: #5b21b6;
            font-size: 13px;
            font-weight: 800;
          }

          .record-grid {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 12px;
          }

          .record-grid > div {
            min-width: 0;
            padding: 12px;
            border-radius: 12px;
            background: #f7f5f9;
          }

          .record-grid span {
            display: block;
            margin-bottom: 5px;
            color: #675d70;
            font-size: 12px;
          }

          .record-grid strong {
            display: block;
            overflow-wrap: anywhere;
            font-size: 14px;
            line-height: 1.4;
          }

          .record-section {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #ebe6ef;
          }

          .record-section h3 {
            margin: 0 0 6px;
            font-size: 14px;
          }

          .record-section p {
            margin: 0;
            font-size: 14px;
            line-height: 1.55;
            white-space: pre-wrap;
          }

          .empty-results {
            padding: 50px 20px;
            border: 1px solid #ddd7e4;
            border-radius: 18px;
            background: #ffffff;
            color: #675d70;
            text-align: center;
            font-size: 17px;
          }

          @media (max-width: 750px) {
            body {
              padding: 14px;
            }

            .page-heading,
            .defect-record {
              padding: 19px;
            }

            .record-grid {
              grid-template-columns: 1fr;
            }

            .defect-record-header {
              flex-direction: column;
            }
          }

          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }

            .toolbar {
              display: none;
            }

            .page {
              width: 100%;
              max-width: none;
            }

            .page-heading {
              border: 0;
              padding: 0 0 18px;
            }

            .defect-record {
              box-shadow: none;
            }
          }
        </style>
      </head>

      <body>
        <div class="toolbar">
          <button
            type="button"
            onclick="window.print()"
          >
            Print / Save PDF
          </button>

          <button
            type="button"
            onclick="window.close()"
          >
            Close
          </button>
        </div>

        <main class="page">
          <header class="page-heading">
            <h1>
              ${escapeHtml(pageTitle)}:
              <span class="selected-value">
                ${escapeHtml(selectedLabel)}
              </span>
            </h1>

            <div class="page-summary">
              ${matchingDefects.length}
              ${resultWord}
              &nbsp;•&nbsp;
              ${escapeHtml(engineer)}
              &nbsp;•&nbsp;
              ${escapeHtml(fromDate)}
              to
              ${escapeHtml(toDate)}
            </div>
          </header>

          <section class="records">
            ${recordsHtml}
          </section>
        </main>
      </body>
    </html>
  `);

  drilldownWindow.document.close();
  drilldownWindow.focus();
}

function renderPassFailChart(pass, fail) {
  const container = el("passFailChart");

  if (!container) return;

  const total = pass + fail;

  if (!total) {
    container.innerHTML = `
      <div class="analytics-empty">
        No audits for these filters.
      </div>
    `;

    return;
  }

  const passPct = (pass / total) * 100;

  container.innerHTML = `
    <div class="analytics-donut-wrap">
      <div
        class="analytics-donut"
        style="
          background:
            conic-gradient(
              #22c55e 0 ${passPct}%,
              #ef4444 ${passPct}% 100%
            );
        "
      ></div>

      <div class="analytics-legend">
        <div
          class="analytics-legend-row analytics-pass-fail-drilldown"
          data-audit-result="pass"
          role="button"
          tabindex="0"
          aria-label="View passing audits"
        >
          <span
            class="analytics-swatch"
            style="background:#22c55e"
          ></span>

          PASS

          <strong>
            ${pass}
            (${Math.round(passPct)}%)
          </strong>
        </div>

        <div
          class="analytics-legend-row analytics-pass-fail-drilldown"
          data-audit-result="fail"
          role="button"
          tabindex="0"
          aria-label="View failed audits"
        >
          <span
            class="analytics-swatch"
            style="background:#ef4444"
          ></span>

          FAIL

          <strong>
            ${fail}
            (${Math.round(100 - passPct)}%)
          </strong>
        </div>
      </div>
    </div>
  `;

  container
    .querySelectorAll(
      ".analytics-pass-fail-drilldown"
    )
    .forEach(row => {
      const openResult = event => {
        /*
          Stop the click reaching the full analytics card.

          This ensures the audit drill-down opens instead of the
          general PASS / FAIL presentation view.
        */
        event.stopPropagation();

        openPassFailDrilldown(
          row.dataset.auditResult
        );
      };

      row.addEventListener(
        "click",
        openResult
      );

      row.addEventListener(
        "keydown",
        event => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            openResult(event);
          }
        }
      );
    });
}

function openPassFailDrilldown(result) {
  const { audits } = getAnalyticsSelection();

  const showPass = result === "pass";

  const matchingAudits = audits
    .filter(audit => {
      const passed =
        isPassingOutcome(audit.outcome);

      return showPass
        ? passed
        : !passed;
    })
    .sort((a, b) =>
      String(b.date || "").localeCompare(
        String(a.date || "")
      )
    );

  const resultLabel = showPass
    ? "PASS"
    : "FAIL";

  const engineer =
    el("analyticsEngineer")?.value ||
    "All engineers";

  const fromDate =
    el("analyticsFrom")?.value ||
    "All time";

  const toDate =
    el("analyticsTo")?.value ||
    "Present";

  const getFullInspection = audit => {
    return (
      state.db.inspections || []
    ).find(inspection =>
      String(inspection.id || "") ===
      String(audit.id || "")
    );
  };

  const auditsHtml = matchingAudits.length
    ? matchingAudits
        .map((audit, index) => {
          const fullInspection =
            getFullInspection(audit);

          const findings =
            fullInspection?.findings || [];

          const positives =
            fullInspection?.positives || [];

          const site =
            fullInspection?.address || "—";

          const appliance =
            fullInspection?.appliance || "—";

          const severityCounts = {
            ID: 0,
            AR: 0,
            NCS: 0,
            Advisory: 0
          };

          findings.forEach(finding => {
            const label =
              getAnalyticsSeverityLabel(
                finding.severity
              );

            if (
              Object.prototype.hasOwnProperty.call(
                severityCounts,
                label
              )
            ) {
              severityCounts[label]++;
            }
          });

          const findingsHtml = findings.length
            ? findings
                .map(finding => `
                  <div class="finding-row">
                    <div class="finding-heading">
                      <strong>
                        ${escapeHtml(
                          finding.title ||
                          "Untitled defect"
                        )}
                      </strong>

                      <span>
                        ${escapeHtml(
                          getAnalyticsSeverityLabel(
                            finding.severity
                          )
                        )}
                      </span>
                    </div>

                    ${
                      finding.action
                        ? `
                            <p>
                              <b>Action:</b>
                              ${escapeHtml(
                                finding.action
                              )}
                            </p>
                          `
                        : ""
                    }
                  </div>
                `)
                .join("")
            : `
                <div class="no-findings">
                  No defects were recorded.
                </div>
              `;

          return `
            <article class="audit-record">
              <header class="audit-header">
                <div>
                  <div class="audit-number">
                    Audit ${index + 1}
                  </div>

                  <h2>
                    ${escapeHtml(
                      audit.jobRef ||
                      "No job reference"
                    )}
                  </h2>
                </div>

                <span
                  class="
                    result-badge
                    ${showPass
                      ? "result-pass"
                      : "result-fail"}
                  "
                >
                  ${resultLabel}
                </span>
              </header>

              <div class="audit-grid">
                <div>
                  <span>Date</span>

                  <strong>
                    ${escapeHtml(
                      formatDate(audit.date)
                    )}
                  </strong>
                </div>

                <div>
                  <span>Engineer</span>

                  <strong>
                    ${escapeHtml(
                      audit.engineer || "—"
                    )}
                  </strong>
                </div>

                <div>
                  <span>Job reference</span>

                  <strong>
                    ${escapeHtml(
                      audit.jobRef || "—"
                    )}
                  </strong>
                </div>

                <div>
                  <span>Outcome</span>

                  <strong>
                    ${escapeHtml(
                      audit.outcome || "—"
                    )}
                  </strong>
                </div>

                <div>
                  <span>Site</span>

                  <strong>
                    ${escapeHtml(site)}
                  </strong>
                </div>

                <div>
                  <span>Appliance</span>

                  <strong>
                    ${escapeHtml(appliance)}
                  </strong>
                </div>
              </div>

              <div class="audit-totals">
                <span>
                  <strong>${findings.length}</strong>
                  defects
                </span>

                <span>
                  <strong>${positives.length}</strong>
                  positives
                </span>

                <span>
                  ID:
                  <strong>
                    ${severityCounts.ID}
                  </strong>
                </span>

                <span>
                  AR:
                  <strong>
                    ${severityCounts.AR}
                  </strong>
                </span>

                <span>
                  NCS:
                  <strong>
                    ${severityCounts.NCS}
                  </strong>
                </span>

                <span>
                  Advisory:
                  <strong>
                    ${severityCounts.Advisory}
                  </strong>
                </span>
              </div>

              ${
                findings.length
                  ? `
                      <section class="findings-section">
                        <h3>Defects recorded</h3>
                        ${findingsHtml}
                      </section>
                    `
                  : ""
              }
            </article>
          `;
        })
        .join("")
    : `
        <div class="empty-results">
          No ${resultLabel} audits match the current filters.
        </div>
      `;

  const resultWord =
    matchingAudits.length === 1
      ? "audit"
      : "audits";

  const drilldownWindow = window.open(
    "",
    `PPCAuditDrilldown_${resultLabel}`,
    "width=1200,height=900,resizable=yes,scrollbars=yes"
  );

  if (!drilldownWindow) {
    alert(
      "The audit details window was blocked. Please allow pop-ups for this app and try again."
    );

    return;
  }

  drilldownWindow.document.open();

  drilldownWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <title>${resultLabel} audits</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 30px;
            background: #f5f3f7;
            color: #1b1028;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .toolbar {
            width: min(1150px, 100%);
            margin: 0 auto 14px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          .toolbar button {
            padding: 10px 16px;
            border: 1px solid #d8d1df;
            border-radius: 10px;
            background: #ffffff;
            color: #1b1028;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }

          .page {
            width: min(1150px, 100%);
            margin: 0 auto;
          }

          .page-heading {
            margin-bottom: 18px;
            padding: 28px;
            border: 1px solid #ddd7e4;
            border-radius: 20px;
            background: #ffffff;
          }

          .page-heading h1 {
            margin: 0 0 8px;
            font-size: 30px;
          }

          .page-summary {
            color: #675d70;
            font-size: 15px;
            line-height: 1.6;
          }

          .audits {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .audit-record {
            padding: 24px;
            border: 1px solid #ddd7e4;
            border-radius: 18px;
            background: #ffffff;
            break-inside: avoid;
          }

          .audit-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 20px;
            margin-bottom: 18px;
          }

          .audit-number {
            margin-bottom: 5px;
            color: #675d70;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .06em;
          }

          .audit-header h2 {
            margin: 0;
            font-size: 21px;
            line-height: 1.35;
          }

          .result-badge {
            flex: 0 0 auto;
            padding: 7px 13px;
            border-radius: 999px;
            color: #ffffff;
            font-size: 13px;
            font-weight: 800;
          }

          .result-pass {
            background: #16a34a;
          }

          .result-fail {
            background: #dc2626;
          }

          .audit-grid {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
            gap: 12px;
          }

          .audit-grid > div {
            min-width: 0;
            padding: 12px;
            border-radius: 12px;
            background: #f7f5f9;
          }

          .audit-grid span {
            display: block;
            margin-bottom: 5px;
            color: #675d70;
            font-size: 12px;
          }

          .audit-grid strong {
            display: block;
            overflow-wrap: anywhere;
            font-size: 14px;
            line-height: 1.4;
          }

          .audit-totals {
            display: flex;
            flex-wrap: wrap;
            gap: 9px;
            margin-top: 16px;
          }

          .audit-totals span {
            padding: 7px 10px;
            border: 1px solid #ddd7e4;
            border-radius: 999px;
            background: #faf8fc;
            font-size: 12px;
          }

          .findings-section {
            margin-top: 18px;
            padding-top: 16px;
            border-top: 1px solid #ebe6ef;
          }

          .findings-section h3 {
            margin: 0 0 12px;
            font-size: 15px;
          }

          .finding-row {
            padding: 11px 0;
            border-bottom: 1px solid #eeeaf1;
          }

          .finding-row:last-child {
            border-bottom: 0;
          }

          .finding-heading {
            display: flex;
            justify-content: space-between;
            gap: 16px;
          }

          .finding-heading strong {
            line-height: 1.4;
          }

          .finding-heading span {
            flex: 0 0 auto;
            color: #7c3aed;
            font-size: 12px;
            font-weight: 800;
          }

          .finding-row p {
            margin: 6px 0 0;
            color: #4e4655;
            font-size: 13px;
            line-height: 1.5;
          }

          .empty-results,
          .no-findings {
            color: #675d70;
          }

          .empty-results {
            padding: 50px 20px;
            border: 1px solid #ddd7e4;
            border-radius: 18px;
            background: #ffffff;
            text-align: center;
            font-size: 17px;
          }

          @media (max-width: 750px) {
            body {
              padding: 14px;
            }

            .audit-grid {
              grid-template-columns: 1fr;
            }

            .audit-header,
            .finding-heading {
              flex-direction: column;
            }
          }

          @media print {
            body {
              padding: 0;
              background: #ffffff;
            }

            .toolbar {
              display: none;
            }

            .page {
              width: 100%;
              max-width: none;
            }

            .page-heading {
              padding: 0 0 18px;
              border: 0;
            }
          }
        </style>
      </head>

      <body>
        <div class="toolbar">
          <button
            type="button"
            onclick="window.print()"
          >
            Print / Save PDF
          </button>

          <button
            type="button"
            onclick="window.close()"
          >
            Close
          </button>
        </div>

        <main class="page">
          <header class="page-heading">
            <h1>${resultLabel} audits</h1>

            <div class="page-summary">
              ${matchingAudits.length}
              ${resultWord}
              &nbsp;•&nbsp;
              ${escapeHtml(engineer)}
              &nbsp;•&nbsp;
              ${escapeHtml(fromDate)}
              to
              ${escapeHtml(toDate)}
            </div>
          </header>

          <section class="audits">
            ${auditsHtml}
          </section>
        </main>
      </body>
    </html>
  `);

  drilldownWindow.document.close();
  drilldownWindow.focus();
}

function renderMonthlyAuditChart(audits) {
  const container = el("monthlyAuditChart");
  if (!container) return;
  const months = {};
  audits.forEach(a => {
    const month = String(a.date || "").slice(0,7);
    if (!month) return;
    months[month] ||= { pass:0, fail:0 };
    months[month][isPassingOutcome(a.outcome) ? "pass" : "fail"]++;
  });
  const entries = Object.entries(months).sort((a,b) => a[0].localeCompare(b[0])).slice(-12);
  if (!entries.length) {
    container.innerHTML = `<div class="analytics-empty">No audits for these filters.</div>`;
    return;
  }
  const width = 760, height = 220, pad = 35;
  const max = Math.max(1, ...entries.map(([,v]) => v.pass + v.fail));
  const groupW = (width - pad*2) / entries.length;
  const bars = entries.map(([month,v],i) => {
    const x = pad + i*groupW + groupW*.18;
    const barW = groupW*.64;
    const passH = v.pass/max*(height-pad*2);
    const failH = v.fail/max*(height-pad*2);
    const base = height-pad;
    return `<rect x="${x}" y="${base-passH}" width="${barW}" height="${passH}" rx="3" fill="#22c55e"/>
      <rect x="${x}" y="${base-passH-failH}" width="${barW}" height="${failH}" rx="3" fill="#ef4444"/>
      <text x="${x+barW/2}" y="${height-10}" text-anchor="middle" fill="currentColor" font-size="10">${month.slice(5)}/${month.slice(2,4)}</text>`;
  }).join("");
  container.innerHTML = `<svg class="analytics-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Monthly pass and fail audit totals">
    <line x1="${pad}" y1="${height-pad}" x2="${width-pad}" y2="${height-pad}" stroke="currentColor" opacity=".25"/>
    ${bars}
  </svg>`;
}

function renderAnalyticsTable(defects) {
  const tbody = el("analyticsTableBody");
  if (!tbody) return;
  const rows = defects.slice().sort((a,b) => String(b.date).localeCompare(String(a.date))).slice(0,250);
  tbody.innerHTML = rows.length ? rows.map(d => `<tr>
    <td>${escapeHtml(formatDate(d.date))}</td>
    <td>${escapeHtml(d.engineer || "—")}</td>
    <td>${escapeHtml(d.title || "—")}</td>
    <td>${escapeHtml(d.category || "Other")}</td>
    <td>${escapeHtml(d.severity || "—")}</td>
    <td>${escapeHtml(d.tag || "—")}</td>
  </tr>`).join("") : `<tr><td colspan="6" class="muted">No defects match these filters.</td></tr>`;
}

function formatAnalyticsInputDate(
  date
) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function closeManagementReportMenu() {
  const menu = el(
    "managementReportMenu"
  );

  const menuButton = el(
    "managementReportMenuBtn"
  );

  if (!menu) return;

  menu.classList.add("hidden");

  menuButton?.setAttribute(
    "aria-expanded",
    "false"
  );
}

function toggleManagementReportMenu() {
  const menu = el(
    "managementReportMenu"
  );

  const menuButton = el(
    "managementReportMenuBtn"
  );

  if (!menu) return;

  const willOpen =
    menu.classList.contains(
      "hidden"
    );

  menu.classList.toggle(
    "hidden",
    !willOpen
  );

  menuButton?.setAttribute(
    "aria-expanded",
    String(willOpen)
  );

  if (willOpen) {
    menu
      .querySelector("button")
      ?.focus();
  }
}

function getManagementReportPresetDates(
  period
) {
  const today = new Date();

  /*
    Use local calendar dates rather than UTC
    so the selected date cannot shift around
    midnight or during daylight-saving changes.
  */
  const currentYear =
    today.getFullYear();

  const currentMonth =
    today.getMonth();

  if (period === "current-month") {
    return {
      from: new Date(
        currentYear,
        currentMonth,
        1
      ),

      to: today
    };
  }

  if (period === "previous-month") {
    return {
      from: new Date(
        currentYear,
        currentMonth - 1,
        1
      ),

      to: new Date(
        currentYear,
        currentMonth,
        0
      )
    };
  }

  const currentQuarterStartMonth =
    Math.floor(
      currentMonth / 3
    ) * 3;

  if (period === "current-quarter") {
    return {
      from: new Date(
        currentYear,
        currentQuarterStartMonth,
        1
      ),

      to: today
    };
  }

  if (
    period ===
    "previous-quarter"
  ) {
    return {
      from: new Date(
        currentYear,
        currentQuarterStartMonth - 3,
        1
      ),

      to: new Date(
        currentYear,
        currentQuarterStartMonth,
        0
      )
    };
  }

  if (period === "last-30-days") {
    const from = new Date(today);

    /*
      Today counts as day 30, so move back
      29 days to create a 30-day inclusive
      reporting period.
    */
    from.setDate(
      from.getDate() - 29
    );

    return {
      from,
      to: today
    };
  }

  if (
    period ===
    "last-12-months"
  ) {
    /*
      Include the current month plus the
      previous eleven complete calendar
      months, ending today.
    */
    return {
      from: new Date(
        currentYear,
        currentMonth - 11,
        1
      ),

      to: today
    };
  }

  return null;
}

function runManagementReportPreset(
  period
) {
  closeManagementReportMenu();

  /*
    Current selection leaves all dates and
    filters exactly as they already are.
  */
  if (
    period === "current-selection"
  ) {
    openManagementReport();
    return;
  }

  const dates =
    getManagementReportPresetDates(
      period
    );

  if (!dates) {
    alert(
      "The selected reporting period could not be calculated."
    );

    return;
  }

  const fromInput = el(
    "analyticsFrom"
  );

  const toInput = el(
    "analyticsTo"
  );

  if (!fromInput || !toInput) {
    alert(
      "The analytics date fields could not be found."
    );

    return;
  }

  fromInput.value =
    formatAnalyticsInputDate(
      dates.from
    );

  toInput.value =
    formatAnalyticsInputDate(
      dates.to
    );

  /*
    Refresh the charts first so the visible
    Analytics page and generated report use
    the same reporting period.
  */
  renderAnalytics();

  openManagementReport();
}

function openManagementReport(
  options = {}
) {
  const useDashboardDates =
    options.dateSource ===
    "dashboard";

  const dashboardPeriods =
    useDashboardDates
      ? getExecutiveDashboardPeriods()
      : null;

  const fromDate =
    dashboardPeriods
      ?.currentFrom ||
    el("analyticsFrom")
      ?.value ||
    "";

  const toDate =
    dashboardPeriods
      ?.currentTo ||
    el("analyticsTo")
      ?.value ||
    "";

  const currentSelection =
    getAnalyticsSelectionForRange(
      fromDate,
      toDate
    );

  const defects =
    currentSelection.defects || [];

  const audits =
    currentSelection.audits || [];

  if (!audits.length && !defects.length) {
    alert(
      "There is no analytics data for the selected filters."
    );

    return;
  }

  const passingAudits = audits.filter(
    audit => isPassingOutcome(audit.outcome)
  );

  const failingAudits = audits.filter(
    audit => !isPassingOutcome(audit.outcome)
  );

  const passCount = passingAudits.length;
  const failCount = failingAudits.length;

  const passRate = audits.length
    ? Math.round(
        (passCount / audits.length) * 100
      )
    : 0;

  const defectsPerAudit = audits.length
  ? defects.length / audits.length
  : 0;

/*
  Calculate the immediately preceding
  equivalent reporting period.
*/
const comparisonPeriods =
  dashboardPeriods ||
  getAnalyticsComparisonPeriods();

let previousAudits = [];
let previousDefects = [];

if (comparisonPeriods) {
  const previousSelection =
    getAnalyticsSelectionForRange(
      comparisonPeriods.previousFrom,
      comparisonPeriods.previousTo
    );

  previousAudits =
    previousSelection.audits;

  previousDefects =
    previousSelection.defects;
}

const previousPassCount =
  previousAudits.filter(audit =>
    isPassingOutcome(
      audit.outcome
    )
  ).length;

const previousPassRate =
  previousAudits.length
    ? Math.round(
        (
          previousPassCount /
          previousAudits.length
        ) * 100
      )
    : null;

const previousDefectsPerAudit =
  previousAudits.length
    ? (
        previousDefects.length /
        previousAudits.length
      )
    : null;

function buildManagementKpiComparison(
  currentValue,
  previousValue,
  options = {}
) {
  const {
    decimals = 0,
    suffix = "",
    percentagePoints = false,
    lowerIsBetter = false,
    neutralChange = false
  } = options;

  if (
    previousValue === null ||
    previousValue === undefined
  ) {
    return `
      <span class="kpi-previous">
        Previous: No audit data
      </span>

      <span class="kpi-change kpi-change-neutral">
        No comparison available
      </span>
    `;
  }

  const current =
    Number(currentValue) || 0;

  const previous =
    Number(previousValue) || 0;

  const difference =
    current - previous;

  const previousText =
    `${previous.toFixed(decimals)}${suffix}`;

  if (
    Math.abs(difference) <
    Math.pow(10, -decimals) / 2
  ) {
    return `
      <span class="kpi-previous">
        Previous: ${escapeHtml(
          previousText
        )}
      </span>

      <span class="kpi-change kpi-change-neutral">
        No change
      </span>
    `;
  }

  let toneClass =
    "kpi-change-info";

  if (!neutralChange) {
    const improved =
      lowerIsBetter
        ? difference < 0
        : difference > 0;

    toneClass = improved
      ? "kpi-change-good"
      : "kpi-change-bad";
  }

  const differenceText =
    `${Math.abs(difference).toFixed(
      decimals
    )}${
      percentagePoints
        ? " points"
        : suffix
    }`;

  return `
    <span class="kpi-previous">
      Previous: ${escapeHtml(
        previousText
      )}
    </span>

    <span
      class="
        kpi-change
        ${toneClass}
      "
    >
      ${difference > 0 ? "↑" : "↓"}
      ${escapeHtml(
        differenceText
      )}
    </span>
  `;
}

const auditComparisonHtml =
  buildManagementKpiComparison(
    audits.length,
    previousAudits.length,
    {
      neutralChange: true
    }
  );

const defectComparisonHtml =
  buildManagementKpiComparison(
    defects.length,
    previousDefects.length,
    {
      lowerIsBetter: true
    }
  );

const passRateComparisonHtml =
  buildManagementKpiComparison(
    passRate,
    previousPassRate,
    {
      suffix: "%",
      percentagePoints: true
    }
  );

const defectsPerAuditComparisonHtml =
  buildManagementKpiComparison(
    defectsPerAudit,
    previousDefectsPerAudit,
    {
      decimals: 2,
      lowerIsBetter: true
    }
  );

const severityCounts = {
    ID: 0,
    AR: 0,
    NCS: 0,
    Advisory: 0
  };

  defects.forEach(defect => {
    const severity =
      getAnalyticsSeverityLabel(
        defect.severity
      );

    if (
      Object.prototype.hasOwnProperty.call(
        severityCounts,
        severity
      )
    ) {
      severityCounts[severity]++;
    }
  });

  const titleCounts = countBy(
    defects,
    defect =>
      defect.title || "Untitled defect"
  );

  const topDefects = sortedCounts(
    titleCounts,
    10
  );

  const categoryCounts = sortedCounts(
    countBy(
      defects,
      defect => defect.category || "Other"
    ),
    10
  );

    const engineerData =
    getEngineerPerformanceData(audits);

  const selectedEngineerValue =
    el("analyticsEngineer")?.value ||
    "";

  const selectedEngineer =
    selectedEngineerValue ||
    "All engineers";

  const selectedCategory =
    el("analyticsCategory")?.value ||
    "All categories";

  const selectedSeverity =
    el("analyticsSeverity")
      ?.selectedOptions?.[0]
      ?.textContent ||
    "All severities";

    const currentTcwRecords =
    performanceRecordsInRange(
      performanceState.tcwErrors,
      fromDate,
      toDate,
      selectedEngineerValue
    );

  const previousTcwRecords =
    comparisonPeriods
      ? performanceRecordsInRange(
          performanceState.tcwErrors,
          comparisonPeriods.previousFrom,
          comparisonPeriods.previousTo,
          selectedEngineerValue
        )
      : [];

  const currentMorganRecords =
    performanceRecordsInRange(
      performanceState
        .morganLambertAudits,
      fromDate,
      toDate,
      selectedEngineerValue
    );

  const previousMorganRecords =
    comparisonPeriods
      ? performanceRecordsInRange(
          performanceState
            .morganLambertAudits,
          comparisonPeriods.previousFrom,
          comparisonPeriods.previousTo,
          selectedEngineerValue
        )
      : [];

  const currentMorganMetrics =
    getMorganMetrics(
      currentMorganRecords
    );

  const previousMorganMetrics =
    getMorganMetrics(
      previousMorganRecords
    );

  const tcwChange =
    currentTcwRecords.length -
    previousTcwRecords.length;

  const tcwComparisonHtml =
    buildManagementKpiComparison(
      currentTcwRecords.length,
      previousTcwRecords.length,
      {
        lowerIsBetter: true
      }
    );

  const morganAuditComparisonHtml =
    buildManagementKpiComparison(
      currentMorganMetrics.total,
      previousMorganMetrics.total,
      {
        neutralChange: true
      }
    );

  const morganPassRateComparisonHtml =
    buildManagementKpiComparison(
      currentMorganMetrics.passRate,
      previousMorganMetrics.passRate,
      {
        suffix: "%",
        percentagePoints: true
      }
    );

  const morganScoreComparisonHtml =
    buildManagementKpiComparison(
      currentMorganMetrics.averageScore,
      previousMorganMetrics.averageScore,
      {
        decimals: 1,
        suffix: "%",
        percentagePoints: true
      }
    );


  const tcwEngineerMap =
    new Map();

  currentTcwRecords.forEach(
    record => {
      const engineer =
        String(
          record.engineer ||
          "Not recorded"
        ).trim() ||
        "Not recorded";

      tcwEngineerMap.set(
        engineer,
        (
          tcwEngineerMap.get(
            engineer
          ) || 0
        ) + 1
      );
    }
  );

  const tcwEngineerData =
    Array.from(
      tcwEngineerMap.entries()
    ).sort(
      (a, b) =>
        b[1] - a[1] ||
        a[0].localeCompare(b[0])
    );

  const maximumTcwEngineerCount =
    Math.max(
      1,
      ...tcwEngineerData.map(
        item => item[1]
      )
    );

  const tcwEngineerHtml =
    tcwEngineerData.length
      ? tcwEngineerData
          .map(
            ([engineer, count]) => `
              <div class="report-bar-row">
                <div class="report-bar-heading">
                  <span class="report-bar-label">
                    ${escapeHtml(engineer)}
                  </span>

                  <strong>${count}</strong>
                </div>

                <div class="report-bar-track">
                  <div
                    class="report-bar-fill"
                    style="width:${
                      Math.max(
                        3,
                        count /
                        maximumTcwEngineerCount *
                        100
                      )
                    }%"
                  ></div>
                </div>
              </div>
            `
          )
          .join("")
      : `
          <div class="report-empty">
            No TCW engineer data was recorded.
          </div>
        `;

  const morganEngineerMap =
    new Map();

  currentMorganRecords.forEach(
    record => {
      const engineer =
        String(
          record.engineer ||
          "Not recorded"
        ).trim() ||
        "Not recorded";

      if (
        !morganEngineerMap.has(
          engineer
        )
      ) {
        morganEngineerMap.set(
          engineer,
          {
            engineer,
            audits: 0,
            passes: 0,
            fails: 0,
            scoreTotal: 0,
            scoredAudits: 0
          }
        );
      }

      const item =
        morganEngineerMap.get(
          engineer
        );

      item.audits++;

      if (
        String(
          record.outcome || ""
        ).toUpperCase() === "PASS"
      ) {
        item.passes++;
      } else {
        item.fails++;
      }

      const score =
        Number(record.score);

      if (
        Number.isFinite(score)
      ) {
        item.scoreTotal += score;
        item.scoredAudits++;
      }
    }
  );

  const morganEngineerData =
    Array.from(
      morganEngineerMap.values()
    )
      .map(item => ({
        ...item,

        passRate:
          item.audits
            ? Math.round(
                item.passes /
                item.audits *
                100
              )
            : 0,

        averageScore:
          item.scoredAudits
            ? item.scoreTotal /
              item.scoredAudits
            : 0
      }))
      .sort(
        (a, b) =>
          b.audits - a.audits ||
          b.averageScore -
            a.averageScore ||
          a.engineer.localeCompare(
            b.engineer
          )
      );

  const morganEngineerRowsHtml =
    morganEngineerData.length
      ? morganEngineerData
          .map(item => `
            <tr>
              <td>
                ${escapeHtml(
                  item.engineer
                )}
              </td>

              <td>${item.audits}</td>

              <td>
                ${item.averageScore.toFixed(
                  1
                )}%
              </td>

              <td class="report-pass-text">
                ${item.passes}
              </td>

              <td class="report-fail-text">
                ${item.fails}
              </td>

              <td>${item.passRate}%</td>
            </tr>
          `)
          .join("")
      : `
          <tr>
            <td colspan="6">
              No Morgan &amp; Lambert engineer data is available.
            </td>
          </tr>
        `;

    const periodLabel =
    fromDate && toDate
      ? `${formatDate(
          fromDate
        )} to ${formatDate(
          toDate
        )}`
      : getAnalyticsPeriodLabel();

  const generatedDate = new Date()
    .toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      }
    );

  const maximumDefectCount = Math.max(
    1,
    ...topDefects.map(
      ([, count]) => count
    )
  );

  const maximumCategoryCount = Math.max(
    1,
    ...categoryCounts.map(
      ([, count]) => count
    )
  );

  const topDefectsHtml = topDefects.length
    ? topDefects
        .map(([title, count], index) => {
          const width = Math.max(
            3,
            (count / maximumDefectCount) * 100
          );

          return `
            <div class="report-bar-row">
              <div class="report-bar-heading">
                <span class="report-position">
                  ${index + 1}
                </span>

                <span class="report-bar-label">
                  ${escapeHtml(title)}
                </span>

                <strong>${count}</strong>
              </div>

              <div class="report-bar-track">
                <div
                  class="report-bar-fill"
                  style="width:${width}%"
                ></div>
              </div>
            </div>
          `;
        })
        .join("")
    : `
        <div class="report-empty">
          No defects were recorded.
        </div>
      `;

  const categoriesHtml =
    categoryCounts.length
      ? categoryCounts
          .map(([category, count]) => {
            const width = Math.max(
              3,
              (
                count /
                maximumCategoryCount
              ) * 100
            );

            return `
              <div class="report-bar-row">
                <div class="report-bar-heading">
                  <span class="report-bar-label">
                    ${escapeHtml(category)}
                  </span>

                  <strong>${count}</strong>
                </div>

                <div class="report-bar-track">
                  <div
                    class="report-bar-fill"
                    style="width:${width}%"
                  ></div>
                </div>
              </div>
            `;
          })
          .join("")
      : `
          <div class="report-empty">
            No category data is available.
          </div>
        `;

  const engineerRowsHtml =
    engineerData.length
      ? engineerData
          .map(engineer => {
            const engineerDefects =
              defects.filter(defect =>
                normalizeEngineer(
                  defect.engineer
                ) ===
                normalizeEngineer(
                  engineer.engineer
                )
              );

            const engineerDefectsPerAudit =
              engineer.total
                ? (
                    engineerDefects.length /
                    engineer.total
                  ).toFixed(2)
                : "0.00";

            return `
              <tr>
                <td>
                  ${escapeHtml(
                    engineer.engineer
                  )}
                </td>

                <td>${engineer.total}</td>

                <td>${engineer.pass}</td>

                <td>${engineer.fail}</td>

                <td>${engineer.passRate}%</td>

                <td>
                  ${engineerDefects.length}
                </td>

                <td>
                  ${engineerDefectsPerAudit}
                </td>
              </tr>
            `;
          })
          .join("")
      : `
          <tr>
            <td colspan="7">
              No engineer performance data is available.
            </td>
          </tr>
        `;

  const repeatedDefects =
    Object.entries(titleCounts)
      .filter(([, count]) => count > 1)
      .sort((a, b) =>
        b[1] - a[1] ||
        a[0].localeCompare(b[0])
      );

  const repeatOccurrences =
    repeatedDefects.reduce(
      (total, [, count]) =>
        total + (count - 1),
      0
    );

  const highestDefect =
    topDefects[0] || null;

  const highestCategory =
    categoryCounts[0] || null;

const strongestEngineer =
  engineerData.length
    ? engineerData
        .map(engineer => {
          const engineerDefectCount =
            defects.filter(defect =>
              normalizeEngineer(
                defect.engineer
              ) ===
              normalizeEngineer(
                engineer.engineer
              )
            ).length;

          const defectsPerAudit =
            engineer.total
              ? (
                  engineerDefectCount /
                  engineer.total
                )
              : 0;

          return {
            ...engineer,
            engineerDefectCount,
            defectsPerAudit
          };
        })
        .sort((a, b) => {
          /*
            1. Highest PASS rate
          */
          if (
            b.passRate !== a.passRate
          ) {
            return (
              b.passRate -
              a.passRate
            );
          }

          /*
            2. Highest number of audits
          */
          if (b.total !== a.total) {
            return b.total - a.total;
          }

          /*
            3. Lowest defects per audit
          */
          if (
            a.defectsPerAudit !==
            b.defectsPerAudit
          ) {
            return (
              a.defectsPerAudit -
              b.defectsPerAudit
            );
          }

          /*
            4. Lowest total defects
          */
          if (
            a.engineerDefectCount !==
            b.engineerDefectCount
          ) {
            return (
              a.engineerDefectCount -
              b.engineerDefectCount
            );
          }

          /*
            Final technical tie-break only
          */
          return a.engineer.localeCompare(
            b.engineer
          );
        })[0]
    : null;

  const managementPoints = [];

  managementPoints.push(
    `${audits.length} audit${
      audits.length === 1 ? "" : "s"
    } were included, with a PASS rate of ${passRate}%.`
  );

  managementPoints.push(
    `${defects.length} defect${
      defects.length === 1 ? "" : "s"
    } were recorded, averaging ${defectsPerAudit.toFixed(
      2
    )} defects per audit.`
  );

  if (highestDefect) {
    managementPoints.push(
      `The most common defect was "${highestDefect[0]}", recorded ${highestDefect[1]} time${
        highestDefect[1] === 1 ? "" : "s"
      }.`
    );
  }

  if (highestCategory) {
    managementPoints.push(
      `The category with the highest number of defects was "${highestCategory[0]}" with ${highestCategory[1]} record${
        highestCategory[1] === 1 ? "" : "s"
      }.`
    );
  }

  if (repeatOccurrences > 0) {
    managementPoints.push(
      `${repeatedDefects.length} defect type${
        repeatedDefects.length === 1
          ? ""
          : "s"
      } occurred more than once, creating ${repeatOccurrences} repeat occurrence${
        repeatOccurrences === 1
          ? ""
          : "s"
      }.`
    );
  } else {
    managementPoints.push(
      "No repeated defect titles were identified in the selected period."
    );
  }

 if (strongestEngineer) {
  managementPoints.push(
    `${strongestEngineer.engineer} was the strongest-performing engineer, recording a ${strongestEngineer.passRate}% PASS rate across ${strongestEngineer.total} audit${
      strongestEngineer.total === 1
        ? ""
        : "s"
    }, with ${strongestEngineer.defectsPerAudit.toFixed(
      2
    )} defects per audit.`
  );
}

    managementPoints.push(
    `TCW recorded ${currentTcwRecords.length} error${
      currentTcwRecords.length === 1
        ? ""
        : "s"
    } in the current period, compared with ${previousTcwRecords.length} in the comparison period.`
  );



  managementPoints.push(
    `Morgan & Lambert completed ${currentMorganMetrics.total} audit${
      currentMorganMetrics.total === 1
        ? ""
        : "s"
    }, achieving a ${currentMorganMetrics.passRate}% PASS rate and an average score of ${currentMorganMetrics.averageScore.toFixed(
      1
    )}%.`
  );

  if (morganEngineerData.length) {
    const strongestMorganEngineer =
      [...morganEngineerData].sort(
        (a, b) =>
          b.passRate - a.passRate ||
          b.averageScore -
            a.averageScore ||
          b.audits - a.audits
      )[0];

    managementPoints.push(
      `${strongestMorganEngineer.engineer} recorded the strongest Morgan & Lambert performance, with a ${strongestMorganEngineer.passRate}% PASS rate and an average score of ${strongestMorganEngineer.averageScore.toFixed(
        1
      )}% across ${strongestMorganEngineer.audits} audit${
        strongestMorganEngineer.audits === 1
          ? ""
          : "s"
      }.`
    );
  }

  const managementSummaryHtml =
    managementPoints
      .map(point => `
        <li>${escapeHtml(point)}</li>
      `)
      .join("");

  const reportWindow = window.open(
    "",
    "PPCManagementReport",
    "width=1400,height=950,resizable=yes,scrollbars=yes"
  );

  if (!reportWindow) {
    alert(
      "The management report window was blocked. Please allow pop-ups for this app and try again."
    );

    return;
  }

  reportWindow.document.open();

  reportWindow.document.write(`
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <title>
          PPC Management Report
        </title>

        <style>
          * {
            box-sizing: border-box;
          }

                    body {
            margin: 0;
            padding: 30px;
            background: #f4f1f7;
            color: #1b1028;
            font-family:
              Arial,
              Helvetica,
              sans-serif;
          }

          .toolbar {
            width: min(1250px, 100%);
            margin: 0 auto 14px;
            display: flex;
            justify-content: flex-end;
            gap: 10px;
          }

          .toolbar button {
            padding: 10px 16px;
            border: 1px solid #d8d1df;
            border-radius: 10px;
            background: #ffffff;
            color: #1b1028;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }

                    .report-page {
            width: min(1250px, 125%);
            margin: 0 auto;
            padding: 34px;
            border: 1px solid #ddd7e4;
            border-radius: 22px;
            background: #ffffff;
            box-shadow:
              0 18px 45px
              rgba(35, 20, 50, 0.12);

            transform: scale(0.8);
            transform-origin: top center;
          }

          .report-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 25px;
          }

          .report-header h1 {
            margin: 0 0 8px;
            font-size: 32px;
          }

          .report-period {
            color: #675d70;
            font-size: 15px;
            line-height: 1.6;
          }

          .report-generated {
            color: #675d70;
            font-size: 13px;
            white-space: nowrap;
          }

          .report-section {
            margin-top: 24px;
            break-inside: avoid;
          }

          .report-section h2 {
            margin: 0 0 14px;
            font-size: 21px;
          }

          .report-section-note {
            margin: -7px 0 14px;
            color: #675d70;
            font-size: 13px;
          }

          .kpi-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 12px;
          }

          .kpi-card {
            padding: 17px 12px;
            border: 1px solid #ddd7e4;
            border-radius: 15px;
            background: #faf8fc;
            text-align: center;
          }

          .kpi-value {
            display: block;
            font-size: 27px;
            font-weight: 800;
          }

          .kpi-label {
  display: block;
  margin-bottom: 5px;
  color: #675d70;
  font-size: 12px;
}

.kpi-comparison {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 7px;
}

.kpi-previous {
  display: block;
  color: #675d70;
  font-size: 10px;
  font-weight: 600;
}

.kpi-change {
  display: block;
  font-size: 11px;
  font-weight: 800;
}

.kpi-change-good {
  color: #15803d;
}

.kpi-change-bad {
  color: #b91c1c;
}

.kpi-change-info {
  color: #6d28d9;
}

.kpi-change-neutral {
  color: #675d70;
}

          .pass-fail-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-top: 12px;
          }

          .pass-card,
          .fail-card {
            padding: 18px;
            border-radius: 15px;
            color: #ffffff;
          }

          .pass-card {
            background: #15803d;
          }

          .fail-card {
            background: #b91c1c;
          }

          .pass-card strong,
          .fail-card strong {
            display: block;
            font-size: 26px;
          }

          .pass-card span,
          .fail-card span {
            display: block;
            margin-top: 4px;
            font-size: 13px;
          }

          .severity-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 12px;
          }

          .severity-card {
            padding: 17px;
            border: 1px solid #d8c9f5;
            border-radius: 15px;
            background: #f7f2ff;
            text-align: center;
          }

          .severity-card strong {
            display: block;
            color: #5b21b6;
            font-size: 25px;
          }

          .severity-card span {
            display: block;
            margin-top: 5px;
            color: #675d70;
            font-size: 12px;
          }

          .two-column-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 18px;
          }

          .report-panel {
            min-width: 0;
            padding: 18px;
            border: 1px solid #ddd7e4;
            border-radius: 16px;
          }

          .report-panel h2 {
            margin: 0 0 15px;
            font-size: 19px;
          }

          .report-bars {
            display: flex;
            flex-direction: column;
            gap: 13px;
          }

          .report-bar-row {
            break-inside: avoid;
          }

          .report-bar-heading {
            display: grid;
            grid-template-columns:
              minmax(0, 1fr)
              45px;
            gap: 10px;
            align-items: end;
            margin-bottom: 6px;
          }

          .report-bar-heading:has(
            .report-position
          ) {
            grid-template-columns:
              24px
              minmax(0, 1fr)
              45px;
          }

          .report-position {
            color: #7c3aed;
            font-size: 12px;
            font-weight: 800;
          }

          .report-bar-label {
            overflow-wrap: anywhere;
            font-size: 13px;
            line-height: 1.35;
          }

          .report-bar-heading strong {
            text-align: right;
          }

          .report-bar-track {
            width: 100%;
            height: 14px;
            overflow: hidden;
            border-radius: 999px;
            background: #ebe7ee;
          }

          .report-bar-fill {
            height: 100%;
            min-width: 3px;
            border-radius: 999px;
            background:
              linear-gradient(
                90deg,
                #7c3aed,
                #a855f7
              );
          }

          .report-table-wrap {
            overflow-x: auto;
            border: 1px solid #ddd7e4;
            border-radius: 15px;
          }

          .report-table {
            width: 100%;
            min-width: 760px;
            border-collapse: collapse;
            font-size: 13px;
          }

          .report-table th,
          .report-table td {
            padding: 11px 12px;
            border-bottom:
              1px solid #ebe6ef;
            text-align: left;
          }

          .report-table th {
            background: #f0e9ff;
            font-weight: 800;
          }

          .report-table tr:last-child td {
            border-bottom: 0;
          }

                    .external-performance-grid {
            display: grid;
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 18px;
          }

          .external-performance-panel {
            min-width: 0;
            padding: 18px;
            border: 1px solid #ddd7e4;
            border-radius: 16px;
            background: #ffffff;
          }

          .external-performance-panel h3 {
            margin: 0 0 5px;
            font-size: 19px;
          }

          .external-performance-note {
            margin: 0 0 15px;
            color: #675d70;
            font-size: 12px;
          }

          .external-kpi-grid {
            display: grid;
            grid-template-columns:
              repeat(4, minmax(0, 1fr));
            gap: 9px;
            margin-bottom: 18px;
          }

          .external-kpi-grid-five {
            grid-template-columns:
              repeat(5, minmax(0, 1fr));
          }

          .external-kpi-card {
            min-width: 0;
            padding: 12px 7px;
            border: 1px solid #ddd7e4;
            border-radius: 13px;
            background: #faf8fc;
            text-align: center;
          }

          .external-kpi-card span {
            display: block;
            color: #675d70;
            font-size: 10px;
          }

          .external-kpi-card strong {
            display: block;
            margin-top: 5px;
            font-size: 21px;
          }

          .external-kpi-card .kpi-comparison {
            margin-top: 5px;
          }

          .external-subheading {
            margin: 17px 0 12px;
            font-size: 15px;
          }

          .report-pass-text {
            color: #15803d;
            font-weight: 800;
          }

          .report-fail-text {
            color: #b91c1c;
            font-weight: 800;
          }

          .management-summary {
            padding: 20px;
            border: 1px solid #d8c9f5;
            border-radius: 16px;
            background: #f8f4ff;
          }

          .management-summary h2 {
            margin: 0 0 12px;
          }

          .management-summary ul {
            margin: 0;
            padding-left: 21px;
          }

          .management-summary li {
            margin-bottom: 9px;
            line-height: 1.55;
          }

          .management-summary li:last-child {
            margin-bottom: 0;
          }

          .report-empty {
            padding: 30px 15px;
            color: #675d70;
            text-align: center;
          }

          @media (max-width: 800px) {
            body {
              padding: 14px;
            }

            .report-page {
              padding: 20px;
            }

            .report-header {
              flex-direction: column;
            }

            .kpi-grid,
            .severity-grid {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }

                        .two-column-grid,
            .external-performance-grid {
              grid-template-columns: 1fr;
            }

            .external-kpi-grid,
            .external-kpi-grid-five {
              grid-template-columns:
                repeat(2, minmax(0, 1fr));
            }
          }

   @media print {
  @page {
    size: A4 portrait;
    margin: 3mm;
  }

  html,
  body {
    width: 100%;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  /*
    A lighter scale reduction keeps the report
    close to the popup appearance while still
    fitting comfortably on one A4 page.
  */
  body {
    zoom: 0.84;
  }

  .toolbar {
    display: none !important;
  }

  .report-page {
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 12px;
    border: 0;
    border-radius: 0;
    box-shadow: none;
    transform: none;
transform-origin: initial;
  }

  /*
    Preserve the desktop report structure.
    Chrome's print viewport can otherwise
    activate the narrow-screen layout.
  */
  .report-header {
    flex-direction: row;
    align-items: flex-start;
    margin-bottom: 10px;
  }

  .report-header h1 {
    margin: 0 0 6px;
    font-size: 28px;
  }

  .report-period {
    font-size: 13px;
    line-height: 1.45;
  }

  .report-generated {
    font-size: 11px;
  }

  .report-section {
    margin-top: 11px;
    break-inside: auto;
    page-break-inside: auto;
  }

  .report-section h2 {
    margin: 0 0 10px;
    font-size: 18px;
  }

  .report-section-note {
    margin: -5px 0 10px;
    font-size: 11px;
  }

  .kpi-grid {
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .kpi-card {
    padding: 9px 10px;
    border-radius: 13px;
    break-inside: avoid;
  }

  .kpi-value {
    font-size: 23px;
  }

  .kpi-label {
    margin-top: 4px;
    font-size: 10px;
  }

  .pass-fail-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 10px;
    margin-top: 10px;
  }

  .pass-card,
.fail-card {
  padding: 9px 12px;
  border-radius: 13px;
}

  .pass-card strong,
  .fail-card strong {
    font-size: 23px;
  }

  .pass-card span,
  .fail-card span {
    margin-top: 3px;
    font-size: 10px;
  }

  .severity-grid {
    grid-template-columns:
      repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .severity-card {
    padding: 9px;
    border-radius: 13px;
    break-inside: avoid;
  }

  .severity-card strong {
    font-size: 21px;
  }

  .severity-card span {
    margin-top: 4px;
    font-size: 10px;
  }

  .two-column-grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .report-panel {
    padding: 10px;
    border-radius: 14px;
    break-inside: auto;
    page-break-inside: auto;
  }

  .report-panel h2 {
    margin: 0 0 11px;
    font-size: 16px;
  }

  .report-bars {
    gap: 5px;
  }

  .report-bar-heading {
    margin-bottom: 4px;
    font-size: 10px;
  }

  .report-bar-heading:has(
    .report-position
  ) {
    grid-template-columns:
      21px
      minmax(0, 1fr)
      34px;
  }

  .report-position {
    font-size: 10px;
  }

  .report-bar-label {
    font-size: 10px;
    line-height: 1.3;
  }

  .report-bar-track {
    height: 7px;
  }

  .report-table-wrap {
    overflow: visible;
    border-radius: 12px;
  }

  .report-table {
    width: 100%;
    min-width: 0;
    font-size: 9px;
  }

  .report-table th,
.report-table td {
  padding: 3px 6px;
  line-height: 1.15;
}

  .management-summary {
  padding: 9px 12px;
  border-radius: 14px;
  break-inside: avoid;
}

  .management-summary h2 {
    margin-bottom: 8px;
    font-size: 16px;
  }

  .management-summary ul {
    padding-left: 19px;
  }

  .management-summary li {
  margin-bottom: 2px;
  font-size: 9.5px;
  line-height: 1.25;
}

  .management-summary li:last-child {
    margin-bottom: 0;
  }
}
        </style>
      </head>

      <body>
        <div class="toolbar">
  <button
    type="button"
    onclick="window.print()"
  >
    Print / Save PDF
  </button>

  <button
    type="button"
    onclick="saveManagementReportHtml()"
  >
    Save / Share HTML
  </button>

  <button
    type="button"
    onclick="window.close()"
  >
    Close
  </button>
</div>

        <main class="report-page">
          <header class="report-header">
            <div>
              <h1>
                PPC Management Report
              </h1>

              <div class="report-period">
                Period:
                ${escapeHtml(periodLabel)}
                <br>

                Engineer:
                ${escapeHtml(
                  selectedEngineer
                )}

                &nbsp;•&nbsp;

                Category:
                ${escapeHtml(
                  selectedCategory
                )}

                &nbsp;•&nbsp;

                Severity:
                ${escapeHtml(
                  selectedSeverity
                )}
              </div>
            </div>

            <div class="report-generated">
              Generated:
              ${escapeHtml(generatedDate)}
            </div>
          </header>

          <section class="report-section">
            <h2>Performance overview</h2>

            <div class="kpi-grid">
  <div class="kpi-card">
    <span class="kpi-label">
      Audits
    </span>

    <span class="kpi-value">
      ${audits.length}
    </span>

    <div class="kpi-comparison">
      ${auditComparisonHtml}
    </div>
  </div>

  <div class="kpi-card">
    <span class="kpi-label">
      Defects
    </span>

    <span class="kpi-value">
      ${defects.length}
    </span>

    <div class="kpi-comparison">
      ${defectComparisonHtml}
    </div>
  </div>

  <div class="kpi-card">
    <span class="kpi-label">
      PASS rate
    </span>

    <span class="kpi-value">
      ${passRate}%
    </span>

    <div class="kpi-comparison">
      ${passRateComparisonHtml}
    </div>
  </div>

  <div class="kpi-card">
    <span class="kpi-label">
      Defects per audit
    </span>

    <span class="kpi-value">
      ${defectsPerAudit.toFixed(2)}
    </span>

    <div class="kpi-comparison">
      ${defectsPerAuditComparisonHtml}
    </div>
  </div>
</div>

            <div class="pass-fail-grid">
              <div class="pass-card">
                <strong>${passCount}</strong>

                <span>
                  PASS audits
                </span>
              </div>

              <div class="fail-card">
                <strong>${failCount}</strong>

                <span>
                  FAIL audits
                </span>
              </div>
            </div>
          </section>

          <section class="report-section">
            <h2>Defects by severity</h2>

            <div class="severity-grid">
              <div class="severity-card">
                <strong>
                  ${severityCounts.ID}
                </strong>

                <span>ID</span>
              </div>

              <div class="severity-card">
                <strong>
                  ${severityCounts.AR}
                </strong>

                <span>AR</span>
              </div>

              <div class="severity-card">
                <strong>
                  ${severityCounts.NCS}
                </strong>

                <span>NCS</span>
              </div>

              <div class="severity-card">
                <strong>
                  ${severityCounts.Advisory}
                </strong>

                <span>Advisory</span>
              </div>
            </div>
          </section>

          <section class="report-section">
            <div class="two-column-grid">
              <div class="report-panel">
                <h2>Most common defects</h2>

                <div class="report-bars">
                  ${topDefectsHtml}
                </div>
              </div>

              <div class="report-panel">
                <h2>Defects by category</h2>

                <div class="report-bars">
                  ${categoriesHtml}
                </div>
              </div>
            </div>
          </section>

          <section class="report-section">
            <h2>Engineer performance</h2>

            <div class="report-section-note">
              Engineer totals use the selected
              analytics date range.
            </div>

            <div class="report-table-wrap">
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Engineer</th>
                    <th>Audits</th>
                    <th>PASS</th>
                    <th>FAIL</th>
                    <th>PASS rate</th>
                    <th>Defects</th>
                    <th>Defects / audit</th>
                  </tr>
                </thead>

                <tbody>
                  ${engineerRowsHtml}
                </tbody>
              </table>
            </div>
          </section>

                    <section class="report-section">
            <h2>External performance metrics</h2>

            <div class="report-section-note">
              TCW and Morgan &amp; Lambert results use
              the selected date range and engineer filter.
            </div>

            <div class="external-performance-grid">
              <div class="external-performance-panel">
                <h3>TCW Errors</h3>

                <p class="external-performance-note">
                  Current period compared with the
                  selected comparison period
                </p>

                <div class="external-kpi-grid">
                  <div class="external-kpi-card">
                    <span>Current</span>

                    <strong>
                      ${currentTcwRecords.length}
                    </strong>

                    <div class="kpi-comparison">
                      ${tcwComparisonHtml}
                    </div>
                  </div>

                  <div class="external-kpi-card">
                    <span>Comparison</span>

                    <strong>
                      ${previousTcwRecords.length}
                    </strong>
                  </div>

                  <div class="external-kpi-card">
                    <span>Change</span>

                    <strong>
                      ${tcwChange > 0 ? "+" : ""}${tcwChange}
                    </strong>
                  </div>

                  <div class="external-kpi-card">
                    <span>Engineers affected</span>

                    <strong>
                      ${tcwEngineerData.length}
                    </strong>
                  </div>
                </div>

                                <h4 class="external-subheading">
                  TCW errors by engineer
                </h4>

                <div class="report-bars">
                  ${tcwEngineerHtml}
                </div>
              </div>

              <div class="external-performance-panel">
                <h3>Morgan &amp; Lambert</h3>

                <p class="external-performance-note">
                  Audit performance for the current period
                </p>

                <div
                  class="
                    external-kpi-grid
                    external-kpi-grid-five
                  "
                >
                  <div class="external-kpi-card">
                    <span>Audits</span>

                    <strong>
                      ${currentMorganMetrics.total}
                    </strong>

                    <div class="kpi-comparison">
                      ${morganAuditComparisonHtml}
                    </div>
                  </div>

                  <div class="external-kpi-card">
                    <span>PASS</span>

                    <strong class="report-pass-text">
                      ${currentMorganMetrics.passes}
                    </strong>
                  </div>

                  <div class="external-kpi-card">
                    <span>FAIL</span>

                    <strong class="report-fail-text">
                      ${currentMorganMetrics.fails}
                    </strong>
                  </div>

                  <div class="external-kpi-card">
                    <span>PASS rate</span>

                    <strong>
                      ${currentMorganMetrics.passRate}%
                    </strong>

                    <div class="kpi-comparison">
                      ${morganPassRateComparisonHtml}
                    </div>
                  </div>

                  <div class="external-kpi-card">
                    <span>Average score</span>

                    <strong>
                      ${currentMorganMetrics.averageScore.toFixed(
                        1
                      )}%
                    </strong>

                    <div class="kpi-comparison">
                      ${morganScoreComparisonHtml}
                    </div>
                  </div>
                </div>

                <h4 class="external-subheading">
                  Morgan &amp; Lambert performance by engineer
                </h4>

                <div class="report-table-wrap">
                  <table class="report-table">
                    <thead>
                      <tr>
                        <th>Engineer</th>
                        <th>Audits</th>
                        <th>Average</th>
                        <th>PASS</th>
                        <th>FAIL</th>
                        <th>PASS rate</th>
                      </tr>
                    </thead>

                    <tbody>
                      ${morganEngineerRowsHtml}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          <section class="report-section">
            <div class="management-summary">
              <h2>Management summary</h2>

              <ul>
                ${managementSummaryHtml}
              </ul>
            </div>
          </section>
                </main>

        <script>
          async function saveManagementReportHtml() {
            try {
              const documentClone =
                document.documentElement
                  .cloneNode(true);

              /*
                Remove the popup toolbar so the
                saved report contains only the
                finished management report.
              */
              documentClone
                .querySelector(".toolbar")
                ?.remove();

              /*
                Remove this export script from
                the standalone saved document.
              */
              documentClone
                .querySelectorAll("script")
                .forEach(script =>
                  script.remove()
                );

              const fullHtml =
                "<!doctype html>\\n" +
                documentClone.outerHTML;

              const safeFromDate =
                "${escapeHtml(
                  fromDate || "start"
                )}";

              const safeToDate =
                "${escapeHtml(
                  toDate || "end"
                )}";

              const filename =
                "PPC-Management-Report-" +
                safeFromDate +
                "-to-" +
                safeToDate +
                ".html";

              const blob = new Blob(
                [fullHtml],
                {
                  type:
                    "text/html;charset=utf-8"
                }
              );

              const file = new File(
                [blob],
                filename,
                {
                  type: "text/html"
                }
              );

              /*
                On supported phones and tablets,
                open the normal sharing menu.
              */
              if (
                navigator.share &&
                navigator.canShare &&
                navigator.canShare({
                  files: [file]
                })
              ) {
                await navigator.share({
                  title:
                    "PPC Management Report",

                  text:
                    "PPC Management Report attached.",

                  files: [file]
                });

                return;
              }

              /*
                Desktop and unsupported-browser
                fallback: download the HTML file.
              */
              const url =
                URL.createObjectURL(blob);

              const link =
                document.createElement("a");

              link.href = url;
              link.download = filename;

              document.body.appendChild(
                link
              );

              link.click();
              link.remove();

              setTimeout(
                () => {
                  URL.revokeObjectURL(
                    url
                  );
                },
                1000
              );
            } catch (error) {
              console.error(error);

              alert(
                "The HTML report could not be saved or shared."
              );
            }
          }
        <\/script>
      </body>
    </html>
  `);

  reportWindow.document.close();
  reportWindow.focus();
}

function exportAnalyticsCsv() {
  const { defects } = getAnalyticsSelection();
  const headers = ["Date","Engineer","Job reference","Outcome","Defect","Category","Severity","Tag","Why it matters","Action","Notes"];
  const escCsv = value => `"${String(value ?? "").replace(/"/g,'""')}"`;
  const rows = defects.map(d => [d.date,d.engineer,d.jobRef,d.outcome,d.title,d.category,d.severity,d.tag,d.why,d.action,d.notes].map(escCsv).join(","));
  const blob = new Blob([[headers.map(escCsv).join(","), ...rows].join("\n")], { type:"text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `PPC-defects-analytics-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------- Helpers ----------
function normalizeWorkbookText(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function workbookDateToIso(value) {
  if (
    value instanceof Date &&
    !Number.isNaN(value.getTime())
  ) {
    return formatAnalyticsInputDate(
      value
    );
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    const parsed =
      window.XLSX?.SSF
        ?.parse_date_code(value);

    if (
      parsed &&
      parsed.y &&
      parsed.m &&
      parsed.d
    ) {
      return [
        parsed.y,
        String(parsed.m)
          .padStart(2, "0"),
        String(parsed.d)
          .padStart(2, "0")
      ].join("-");
    }
  }

  const text =
    String(value ?? "").trim();

  if (!text) return "";

  const isoMatch =
    text.match(
      /^(\d{4})-(\d{1,2})-(\d{1,2})/
    );

  if (isoMatch) {
    return [
      isoMatch[1],
      String(isoMatch[2])
        .padStart(2, "0"),
      String(isoMatch[3])
        .padStart(2, "0")
    ].join("-");
  }

  const ukMatch =
    text.match(
      /^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/
    );

  if (ukMatch) {
    let year =
      Number(ukMatch[3]);

    if (year < 100) {
      year += 2000;
    }

    return [
      year,
      String(ukMatch[2])
        .padStart(2, "0"),
      String(ukMatch[1])
        .padStart(2, "0")
    ].join("-");
  }

  const parsedDate =
    new Date(text);

  return Number.isNaN(
    parsedDate.getTime()
  )
    ? ""
    : formatAnalyticsInputDate(
        parsedDate
      );
}


function findWorkbookSheet(
  workbook,
  requestedName
) {
  const requested =
    normalizeWorkbookText(
      requestedName
    );

  const exact =
    workbook.SheetNames.find(
      name =>
        normalizeWorkbookText(name) ===
        requested
    );

  if (exact) {
    return workbook.Sheets[exact];
  }

  const partial =
    workbook.SheetNames.find(
      name => {
        const normalized =
          normalizeWorkbookText(name);

        return (
          normalized.includes(
            requested
          ) ||
          requested.includes(
            normalized
          )
        );
      }
    );

  return partial
    ? workbook.Sheets[partial]
    : null;
}


function workbookRows(sheet) {
  if (!sheet) return [];

  return window.XLSX.utils
    .sheet_to_json(
      sheet,
      {
        header: 1,
        raw: true,
        defval: null
      }
    );
}


function findWorkbookHeader(
  rows,
  requiredHeaderGroups
) {
  for (
    let rowIndex = 0;
    rowIndex <
      Math.min(rows.length, 60);
    rowIndex++
  ) {
    const normalizedRow =
      (rows[rowIndex] || [])
        .map(
          normalizeWorkbookText
        );

    const indexes = {};

    const allFound =
      Object.entries(
        requiredHeaderGroups
      ).every(
        ([key, alternatives]) => {
          const index =
            normalizedRow.findIndex(
              value =>
                alternatives.some(
                  alternative =>
                    value ===
                      alternative ||
                    value.includes(
                      alternative
                    )
                )
            );

          indexes[key] = index;

          return index >= 0;
        }
      );

    if (allFound) {
      return {
        rowIndex,
        indexes
      };
    }
  }

  return null;
}

function historicalAuditWorkbookYear(
  fileName
) {
  const name =
    String(fileName || "")
      .replace(/\.[^.]+$/, "")
      .trim();

  const matches =
    name.match(
      /(?:^|\D)(20\d{2}|\d{2})(?=\D|$)/g
    ) || [];

  if (!matches.length) {
    return null;
  }

  const raw =
    String(
      matches[
        matches.length - 1
      ]
    )
      .replace(/\D/g, "");

  if (raw.length === 4) {
    return Number(raw);
  }

  if (raw.length === 2) {
    return 2000 + Number(raw);
  }

  return null;
}


function historicalAuditDateToIso(
  value,
  fallbackYear
) {
  /*
    A genuine Excel date should already contain
    the correct year.
  */
  if (
    value instanceof Date &&
    !Number.isNaN(
      value.getTime()
    )
  ) {
    return formatAnalyticsInputDate(
      value
    );
  }

  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    const parsed =
      window.XLSX?.SSF
        ?.parse_date_code(value);

    if (
      parsed &&
      parsed.m &&
      parsed.d
    ) {
      const year =
        parsed.y >= 2000
          ? parsed.y
          : fallbackYear;

      if (!year) {
        return "";
      }

      return [
        year,
        String(parsed.m)
          .padStart(2, "0"),
        String(parsed.d)
          .padStart(2, "0")
      ].join("-");
    }
  }

  const text =
    String(value || "")
      .trim();

  if (!text) {
    return "";
  }

  /*
    First allow a normal full date parser.
  */
  const normalDate =
    workbookDateToIso(text);

  if (
    normalDate &&
    /^\d{4}-\d{2}-\d{2}$/.test(
      normalDate
    )
  ) {
    return normalDate;
  }

  if (!fallbackYear) {
    return "";
  }

  const monthNames = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12
  };

  /*
    Handles:
    03-Aug
    3 Aug
    03-August
  */
  const namedMatch =
    text.toLowerCase().match(
      /^(\d{1,2})[\s\-/.]+([a-z]+)$/
    );

  if (namedMatch) {
    const day =
      Number(namedMatch[1]);

    const month =
      monthNames[
        namedMatch[2]
      ];

    if (
      day >= 1 &&
      day <= 31 &&
      month
    ) {
      return [
        fallbackYear,
        String(month)
          .padStart(2, "0"),
        String(day)
          .padStart(2, "0")
      ].join("-");
    }
  }

  /*
    Also handles:
    03/08
    03-08
  */
  const numericMatch =
    text.match(
      /^(\d{1,2})[\/.-](\d{1,2})$/
    );

  if (numericMatch) {
    const day =
      Number(numericMatch[1]);

    const month =
      Number(numericMatch[2]);

    if (
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12
    ) {
      return [
        fallbackYear,
        String(month)
          .padStart(2, "0"),
        String(day)
          .padStart(2, "0")
      ].join("-");
    }
  }

  return "";
}


function historicalAuditYes(
  value
) {
  const normalized =
    normalizeWorkbookText(value);

  return (
    normalized === "yes" ||
    normalized === "y" ||
    normalized === "pass" ||
    normalized === "correct" ||
    normalized === "true" ||
    normalized === "1"
  );
}


function historicalEngineerKey(
  value
) {
  const parts =
    String(value || "")
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim()
      .split(" ")
      .filter(Boolean);

  if (!parts.length) {
    return "";
  }

  if (parts.length === 1) {
    return parts[0];
  }

  return (
    parts[0].charAt(0) +
    parts[parts.length - 1]
  );
}


function canonicalHistoricalEngineer(
  value
) {
  const raw =
    String(value || "")
      .trim();

  if (!raw) {
    return "";
  }

  const targetKey =
    historicalEngineerKey(raw);

  const candidates = [
    ...(typeof PRESET_ENGINEERS !==
    "undefined"
      ? PRESET_ENGINEERS
      : []),

    ...(analyticsState.audits || [])
      .map(record =>
        record.engineer
      )
      .filter(Boolean),

    ...(state.db.inspections || [])
      .map(record =>
        record.engineer
      )
      .filter(Boolean)
  ];

  const match =
    candidates.find(name =>
      historicalEngineerKey(
        name
      ) === targetKey
    );

  return match || raw;
}


function findHistoricalAuditSheet(
  workbook
) {
  for (
    const sheetName of
    workbook.SheetNames || []
  ) {
    const sheet =
      workbook.Sheets[
        sheetName
      ];

    if (!sheet) continue;

    const rows =
      workbookRows(sheet);

    const header =
      findWorkbookHeader(
        rows,
        {
          address: [
            "address",
            "property address"
          ],

          date: [
            "date completed",
            "completed date",
            "date"
          ],

          engineer: [
            "engineer",
            "engineer name"
          ],

          workCorrect: [
            "work correct",
            "works correct",
            "work satisfactory"
          ],

          documentCorrect: [
            "document correct",
            "documentation correct",
            "documents correct",
            "paperwork correct"
          ]
        }
      );

    if (header) {
      return {
        sheet,
        sheetName,
        rows,
        header
      };
    }
  }

  return null;
}


function importHistoricalAuditRecords(
  workbook,
  sourceFile
) {
  const located =
    findHistoricalAuditSheet(
      workbook
    );

  if (!located) {
    throw new Error(
      `Address, Date Completed, Engineer, Work Correct and Document Correct headings could not be found in ${sourceFile.fileName}.`
    );
  }

  const {
    rows,
    header
  } = located;

  const fallbackYear =
    historicalAuditWorkbookYear(
      sourceFile.fileName
    );

  const imported = [];

  for (
    let rowIndex =
      header.rowIndex + 1;

    rowIndex < rows.length;

    rowIndex++
  ) {
    const row =
      rows[rowIndex] || [];

    const rawDate =
      row[
        header.indexes.date
      ];

    const date =
      historicalAuditDateToIso(
        rawDate,
        fallbackYear
      );

    const rawEngineer =
      String(
        row[
          header.indexes.engineer
        ] ?? ""
      ).trim();

    const engineer =
      canonicalHistoricalEngineer(
        rawEngineer
      );

    const address =
      String(
        row[
          header.indexes.address
        ] ?? ""
      ).trim();

    const workValue =
      row[
        header.indexes.workCorrect
      ];

    const documentValue =
      row[
        header.indexes
          .documentCorrect
      ];

    /*
      Ignore completely blank rows.
    */
    if (
      !date &&
      !rawEngineer &&
      !address &&
      !String(
        workValue ?? ""
      ).trim() &&
      !String(
        documentValue ?? ""
      ).trim()
    ) {
      continue;
    }

    if (!date) {
      console.warn(
        `Historical audit row ${
          rowIndex + 1
        } in ${
          sourceFile.fileName
        } was skipped because its date could not be read.`
      );

      continue;
    }

    if (!engineer) {
      console.warn(
        `Historical audit row ${
          rowIndex + 1
        } in ${
          sourceFile.fileName
        } was skipped because no engineer was recorded.`
      );

      continue;
    }

    const workCorrect =
      historicalAuditYes(
        workValue
      );

    const documentCorrect =
      historicalAuditYes(
        documentValue
      );

    const passed =
      workCorrect &&
      documentCorrect;

    imported.push({
      id:
        `historical-${sourceFile.fileKey}-${date}-${rowIndex}`,

      date,

      engineer,

      jobRef: "",

      address,

      outcome:
        passed
          ? "Work & Documentation Correct"
          : "Finding(s) Identified",

      workCorrect,
      documentCorrect,

      dataCoverage:
        "audit-only",

      sourceType:
        "historical-workbook",

      sourceFile:
        sourceFile.fileName,

      sourceFileKey:
        sourceFile.fileKey,

      updatedAt:
        new Date()
          .toISOString()
    });
  }

  return imported;
}


async function importHistoricalAuditWorkbooks(
  files
) {
  if (!window.XLSX) {
    throw new Error(
      "The Excel import library has not loaded."
    );
  }

  const selectedFiles =
    Array.from(files || []);

  if (!selectedFiles.length) {
    throw new Error(
      "No historical audit workbooks were selected."
    );
  }

  let storedAudits = [
    ...(analyticsState.audits || [])
  ];

  let rowsRead = 0;

  const processed = [];
  const skipped = [];

  for (
    const file of
    selectedFiles
  ) {
    try {
      const fileKey =
        performanceWorkbookFileKey(
          file
        );

      const sourceFile = {
        fileName:
          file.name,

        fileKey
      };

      const arrayBuffer =
        await file.arrayBuffer();

      const workbook =
        window.XLSX.read(
          arrayBuffer,
          {
            type: "array",
            cellDates: true
          }
        );

      const imported =
        importHistoricalAuditRecords(
          workbook,
          sourceFile
        );

      /*
        Replace previous rows from this same
        monthly workbook before adding the
        newly imported version.
      */
      const sourceName =
        normalizePerformanceSourceName(
          file.name
        );

      storedAudits =
        storedAudits.filter(
          record => {
            if (
              record?.sourceType !==
              "historical-workbook"
            ) {
              return true;
            }

            const sameKey =
              record.sourceFileKey ===
              fileKey;

            const sameName =
              normalizePerformanceSourceName(
                record.sourceFile
              ) === sourceName;

            return !(
              sameKey ||
              sameName
            );
          }
        );

      storedAudits.push(
        ...imported
      );

      rowsRead +=
        imported.length;

      processed.push(
        `${file.name}: ${imported.length} audit${
          imported.length === 1
            ? ""
            : "s"
        }`
      );
    } catch (error) {
      console.error(
        `Historical audit import failed for ${file.name}:`,
        error
      );

      skipped.push(
        `${file.name}: ${
          error?.message ||
          "Could not import"
        }`
      );
    }
  }

  if (!processed.length) {
    throw new Error(
      skipped.join("\n") ||
      "No historical audits could be imported."
    );
  }

  analyticsState.audits =
    storedAudits;

  saveAnalyticsArchive();

  refreshAnalyticsFilters();

  renderAnalytics();

  renderExecutiveDashboard();

  return {
    workbookCount:
      processed.length,

    rowsRead,

    historicalTotal:
      analyticsState.audits
        .filter(record =>
          record?.sourceType ===
          "historical-workbook"
        )
        .length,

    processed,
    skipped
  };
}
function importTcwRecords(
  workbook,
  sourceFile
) {
  const sheet =
    findWorkbookSheet(
      workbook,
      "TCW Fails"
    );

  if (!sheet) {
    return [];
  }

  const rows =
    workbookRows(sheet);

  const header =
    findWorkbookHeader(
      rows,
      {
        date: [
          "date",
          "audit date",
          "error date"
        ],

        engineer: [
          "engineer",
          "engineer name",
          "operative",
          "operative name"
        ],

        address: [
          "address",
          "property address",
          "site address",
          "property"
        ],

        reason: [
          "reason",
          "error",
          "error reason",
          "failure reason",
          "tcw error",
          "description"
        ]
      }
    );

  if (!header) {
    throw new Error(
      `Date, Engineer, Address and Reason headings could not all be found on the "TCW Fails" sheet in ${sourceFile.fileName}.`
    );
  }

  const imported = [];

  const occurrencesByRecord =
    new Map();

  for (
    let rowIndex =
      header.rowIndex + 1;
    rowIndex < rows.length;
    rowIndex++
  ) {
    const row =
      rows[rowIndex] || [];

    const date =
      workbookDateToIso(
        row[
          header.indexes.date
        ]
      );

    const engineer =
      String(
        row[
          header.indexes.engineer
        ] ?? ""
      ).trim();

    const address =
      String(
        row[
          header.indexes.address
        ] ?? ""
      ).trim();

    const reason =
      String(
        row[
          header.indexes.reason
        ] ?? ""
      ).trim();

    if (!date) continue;

    const occurrenceKey = [
      date,
      normalizeEngineer(
        engineer
      ),
      normalizeWorkbookText(
        address
      ),
      normalizeWorkbookText(
        reason
      )
    ].join("|");

    const occurrence =
      (
        occurrencesByRecord.get(
          occurrenceKey
        ) || 0
      ) + 1;

    occurrencesByRecord.set(
      occurrenceKey,
      occurrence
    );

    imported.push({
      id:
        `tcw-${sourceFile.fileKey}-${date}-${rowIndex}`,

      date,
      engineer,
      address,
      reason,

      sourceFile:
        sourceFile.fileName,

      sourceFileKey:
        sourceFile.fileKey
    });
  }

  return imported;
}



function normalizeMorganOutcome(value) {
  const normalized =
    normalizeWorkbookText(value);

  if (
    normalized === "pass" ||
    normalized.startsWith("pass ")
  ) {
    return "PASS";
  }

  if (
    normalized === "fail" ||
    normalized.startsWith("fail ")
  ) {
    return "FAIL";
  }

  return "";
}


function normalizeMorganScore(value) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value <= 1.000001
      ? value * 100
      : value;
  }

  const text =
    String(value ?? "")
      .replace(/%/g, "")
      .trim();

  if (!text) return null;

  const number =
    Number(text);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number <= 1.000001
    ? number * 100
    : number;
}


function importMorganLambertRecords(
  workbook,
  sourceFile
) {
  const sheet =
    findWorkbookSheet(
      workbook,
      "Morgan & Lambert"
    );

  if (!sheet) {
    return [];
  }

  const rows =
    workbookRows(sheet);

  const header =
    findWorkbookHeader(
      rows,
            {
        date: [
          "date",
          "audit date"
        ],

                engineer: [
          "engineer",
          "engineer name",
          "engineers name",
          "engineer/operative",
          "gas engineer",
          "operative",
          "operative name",
          "name",
          "full name",
          "auditee",
          "auditee name"
        ],

        score: [
          "score",
          "average score",
          "audit score"
        ],

        outcome: [
          "pass fail",
          "pass or fail",
          "outcome",
          "result"
        ]
      }
    );

    if (!header) {
    throw new Error(
      `Date, Engineer, Score and PASS/FAIL headings could not all be found on the "Morgan & Lambert" sheet in ${sourceFile.fileName}.`
    );
  }

  const imported = [];

  for (
    let rowIndex =
      header.rowIndex + 1;
    rowIndex < rows.length;
    rowIndex++
  ) {
    const row =
      rows[rowIndex] || [];

    const date =
      workbookDateToIso(
        row[
          header.indexes.date
        ]
      );

        const engineer =
      String(
        row[
          header.indexes.engineer
        ] ?? ""
      ).trim();

    const outcome =
      normalizeMorganOutcome(
        row[
          header.indexes.outcome
        ]
      );

    const score =
      normalizeMorganScore(
        row[
          header.indexes.score
        ]
      );

       if (
      !date ||
      !outcome
    ) {
      continue;
    }

    if (!engineer) {
      console.warn(
        `Morgan & Lambert row ${rowIndex + 1} in ${sourceFile.fileName} has no engineer name.`
      );
    }

    imported.push({
      id:
        `morgan-${sourceFile.fileKey}-${rowIndex}`,

            date,
      engineer,
      outcome,

      score:
        Number.isFinite(score)
          ? score
          : null,

      sourceFile:
        sourceFile.fileName,

      sourceFileKey:
        sourceFile.fileKey
    });
  }

  return imported;
}


function performanceWorkbookFileKey(
  file
) {
  return String(file.name || "")
    .toLowerCase()
    .replace(
      /\.[^.]+$/,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function normalizePerformanceSourceName(
  value
) {
  return String(value || "")
    .toLowerCase()
    .replace(
      /\.[^.]+$/,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}


function replacePerformanceSourceRecords(
  existingRecords,
  importedRecords,
  replacedSourceKeys,
  replacedSourceNames
) {
  const keys =
    new Set(
      replacedSourceKeys || []
    );

  const names =
    new Set(
      replacedSourceNames || []
    );

  const retainedRecords =
    (existingRecords || [])
      .filter(record => {
        const sourceKey =
          String(
            record.sourceFileKey ||
            ""
          );

        const sourceName =
          normalizePerformanceSourceName(
            record.sourceFile
          );

        if (
          sourceKey &&
          keys.has(sourceKey)
        ) {
          return false;
        }

        if (
          sourceName &&
          names.has(sourceName)
        ) {
          return false;
        }

        return true;
      });

  return mergePerformanceRecords(
    retainedRecords,
    importedRecords
  );
}
function mergePerformanceRecords(
  existingRecords,
  importedRecords
) {
  const records =
    new Map();

  (existingRecords || [])
    .forEach(record => {
      if (!record?.id) return;

      records.set(
        record.id,
        record
      );
    });

  (importedRecords || [])
    .forEach(record => {
      if (!record?.id) return;

      records.set(
        record.id,
        record
      );
    });

  return Array.from(
    records.values()
  ).sort(
    (a, b) =>
      String(a.date || "")
        .localeCompare(
          String(b.date || "")
        )
  );
}


function hasLegacyPerformanceRecords() {
  return [
    ...(performanceState
      .tcwErrors || []),

    ...(performanceState
      .morganLambertAudits || [])
  ].some(
    record =>
      !record.sourceFileKey
  );
}


async function importPerformanceWorkbooks(
  files
) {
  if (!window.XLSX) {
    throw new Error(
      "The Excel import library has not loaded."
    );
  }

  const selectedFiles =
    Array.from(files || []);

  if (!selectedFiles.length) {
    throw new Error(
      "No workbook files were selected."
    );
  }

  if (
    hasLegacyPerformanceRecords()
  ) {
    const replaceLegacy =
      window.confirm(
        "Older imported performance data was found.\n\n" +
        "Select OK to replace that older data and build a clean historical archive from the files selected now.\n\n" +
        "Select Cancel to keep the older data and merge these files into it."
      );

    if (replaceLegacy) {
      performanceState.tcwErrors =
        [];

      performanceState
        .morganLambertAudits =
          [];
    }
  }

    const importedTcw = [];
  const importedMorgan = [];

    const replacedTcwSourceKeys =
    new Set();

  const replacedMorganSourceKeys =
    new Set();

  const replacedTcwSourceNames =
    new Set();

  const replacedMorganSourceNames =
    new Set();

  const importedFileNames = [];

  const skippedFileNames = [];

  for (const file of selectedFiles) {
    const buffer =
      await file.arrayBuffer();

    const workbook =
      window.XLSX.read(
        buffer,
        {
          type: "array",
          cellDates: true
        }
      );

    const hasTcwSheet =
      !!findWorkbookSheet(
        workbook,
        "TCW Fails"
      );

    const hasMorganSheet =
      !!findWorkbookSheet(
        workbook,
        "Morgan & Lambert"
      );

    if (
      !hasTcwSheet &&
      !hasMorganSheet
    ) {
      skippedFileNames.push(
        file.name
      );

      continue;
    }

    const sourceFile = {
      fileName:
        file.name,

      fileKey:
        performanceWorkbookFileKey(
          file
        )
    };

          if (hasTcwSheet) {
      replacedTcwSourceKeys.add(
        sourceFile.fileKey
      );

      replacedTcwSourceNames.add(
        normalizePerformanceSourceName(
          sourceFile.fileName
        )
      );

      importedTcw.push(
        ...importTcwRecords(
          workbook,
          sourceFile
        )
      );
    }

    if (hasMorganSheet) {
      replacedMorganSourceKeys.add(
        sourceFile.fileKey
      );

      replacedMorganSourceNames.add(
        normalizePerformanceSourceName(
          sourceFile.fileName
        )
      );

      importedMorgan.push(
        ...importMorganLambertRecords(
          workbook,
          sourceFile
        )
      );
    }

    importedFileNames.push(
      file.name
    );
  }

  if (
    !importedFileNames.length
  ) {
    throw new Error(
      'None of the selected files contained a "TCW Fails" or "Morgan & Lambert" sheet.'
    );
  }

  const tcwBefore =
    performanceState
      .tcwErrors.length;

  const morganBefore =
    performanceState
      .morganLambertAudits
      .length;

     performanceState.tcwErrors =
    replacePerformanceSourceRecords(
      performanceState.tcwErrors,
      importedTcw,
      replacedTcwSourceKeys,
      replacedTcwSourceNames
    );

  performanceState
    .morganLambertAudits =
      replacePerformanceSourceRecords(
        performanceState
          .morganLambertAudits,

        importedMorgan,
        replacedMorganSourceKeys,
        replacedMorganSourceNames
      );

  const tcwAdded =
    performanceState
      .tcwErrors.length -
    tcwBefore;

  const morganAdded =
    performanceState
      .morganLambertAudits
      .length -
    morganBefore;

  performanceState.importMeta = {
    fileName:
      importedFileNames.length === 1
        ? importedFileNames[0]
        : `${importedFileNames.length} workbooks`,

    fileNames:
      importedFileNames,

    importedAt:
      new Date().toISOString(),

    tcwCount:
      performanceState
        .tcwErrors.length,

    morganCount:
      performanceState
        .morganLambertAudits
        .length,

    importedTcwCount:
      importedTcw.length,

    importedMorganCount:
      importedMorgan.length,

    tcwAdded,
    morganAdded
  };

  savePerformanceState();

  renderExecutiveDashboard();

  return {
    processedFiles:
      importedFileNames.length,

    skippedFiles:
      skippedFileNames,

    importedTcwCount:
      importedTcw.length,

    importedMorganCount:
      importedMorgan.length,

    tcwAdded,
    morganAdded,

    tcwCount:
      performanceState
        .tcwErrors.length,

    morganCount:
      performanceState
        .morganLambertAudits
        .length
  };
}
function closeDashboardActionsMenu() {
  const menu =
    document.querySelector(
      ".dashboard-actions-menu"
    );

  if (menu) {
    menu.open = false;
  }
}
function clearHistoricalAuditHistory() {
  const historicalAudits =
    (analyticsState.audits || [])
      .filter(record =>
        record?.sourceType ===
        "historical-workbook"
      );

  if (!historicalAudits.length) {
    alert(
      "There are no imported historical PPC audits to remove."
    );

    return;
  }

  const confirmed =
    confirm(
      `Remove ${historicalAudits.length} imported historical PPC audit${
        historicalAudits.length === 1
          ? ""
          : "s"
      }?\n\n` +
      "Audits created normally inside the PPC app will NOT be removed."
    );

  if (!confirmed) {
    return;
  }

  analyticsState.audits =
    (analyticsState.audits || [])
      .filter(record =>
        record?.sourceType !==
        "historical-workbook"
      );

  saveAnalyticsArchive();

  refreshAnalyticsFilters();

  renderAnalytics();

  renderExecutiveDashboard();

  closeDashboardActionsMenu();

  alert(
    `${historicalAudits.length} imported historical PPC audit${
      historicalAudits.length === 1
        ? ""
        : "s"
    } removed.\n\n` +
    "Audits created normally in the app have been kept."
  );
}
function initHistoricalAuditImport() {
  const button =
    el(
      "importHistoricalAuditsBtn"
    );

  const input =
    el(
      "historicalAuditWorkbookInput"
    );

  if (
    !button ||
    !input ||
    button.dataset.initialised ===
      "true"
  ) {
    return;
  }

   button.dataset.initialised =
    "true";

  button.addEventListener(
    "click",
    () => {
      input.click();
    }
  );

  el("clearHistoricalAuditsBtn")
    ?.addEventListener(
      "click",
      clearHistoricalAuditHistory
    );

  input.addEventListener(
    "change",
    async event => {
      const files =
        Array.from(
          event.target.files ||
          []
        );

      if (!files.length) {
        return;
      }

      const originalHtml =
        button.innerHTML;

      try {
        button.disabled = true;

        button.innerHTML = `
          <span class="dashboard-dropdown-icon">
            ◷
          </span>

          <span>
            <strong>
              Importing ${files.length} historical workbook${
                files.length === 1
                  ? ""
                  : "s"
              }…
            </strong>

            <small>
              Building the historical audit archive
            </small>
          </span>
        `;

        closeDashboardActionsMenu();

        const result =
          await importHistoricalAuditWorkbooks(
            files
          );

        let message =
          `${result.workbookCount} historical workbook${
            result.workbookCount === 1
              ? ""
              : "s"
          } processed.\n\n` +
          `Historical audit rows read: ${result.rowsRead}\n` +
          `Stored historical audit history: ${result.historicalTotal}`;

        if (
          result.skipped.length
        ) {
          message +=
            `\n\nFiles needing attention:\n` +
            result.skipped.join(
              "\n"
            );
        }

        alert(message);
      } catch (error) {
        console.error(error);

        alert(
          `Historical audits could not be imported: ${
            error?.message ||
            "Unknown error"
          }`
        );
      } finally {
        button.disabled = false;

        button.innerHTML =
          originalHtml;

        input.value = "";
      }
    }
  );
}
const performanceRecordManagerState = {
  type: "tcw",
  selectedIds: new Set()
};


function ensurePerformanceRecordIds(
  type
) {
  const records =
    type === "morgan"
      ? performanceState
          .morganLambertAudits
      : performanceState
          .tcwErrors;

  let changed = false;

  records.forEach(
    (record, index) => {
      if (record.id) return;

      const prefix =
        type === "morgan"
          ? "morgan-manager"
          : "tcw-manager";

      record.id =
        `${prefix}-` +
        `${Date.now()}-` +
        `${index}-` +
        `${Math.random()
          .toString(16)
          .slice(2)}`;

      changed = true;
    }
  );

  if (changed) {
    savePerformanceState();
  }
}


function getPerformanceManagerRecords() {
  return performanceRecordManagerState
    .type === "morgan"
      ? performanceState
          .morganLambertAudits || []
      : performanceState
          .tcwErrors || [];
}


function getFilteredPerformanceManagerRecords() {
  const records =
    getPerformanceManagerRecords();

  const workbook =
    el(
      "performanceRecordWorkbookFilter"
    )?.value || "";

  const engineer =
    el(
      "performanceRecordEngineerFilter"
    )?.value || "";

  const search =
    (
      el(
        "performanceRecordSearch"
      )?.value || ""
    )
      .trim()
      .toLowerCase();

  return records
    .filter(record => {
      if (
        workbook &&
        String(
          record.sourceFile || ""
        ) !== workbook
      ) {
        return false;
      }

      if (
        engineer &&
        String(
          record.engineer || ""
        ) !== engineer
      ) {
        return false;
      }

      if (search) {
        const haystack =
          performanceRecordManagerState
            .type === "morgan"
            ? `
                ${record.date || ""}
                ${record.engineer || ""}
                ${record.outcome || ""}
                ${record.score ?? ""}
                ${record.sourceFile || ""}
              `
            : `
                ${record.date || ""}
                ${record.engineer || ""}
                ${record.address || ""}
                ${record.reason || ""}
                ${record.sourceFile || ""}
              `;

        if (
          !haystack
            .toLowerCase()
            .includes(search)
        ) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) =>
      String(b.date || "")
        .localeCompare(
          String(a.date || "")
        )
    );
}


function populatePerformanceManagerFilters() {
  const records =
    getPerformanceManagerRecords();

  const workbookSelect =
    el(
      "performanceRecordWorkbookFilter"
    );

  const engineerSelect =
    el(
      "performanceRecordEngineerFilter"
    );

  if (
    !workbookSelect ||
    !engineerSelect
  ) {
    return;
  }

  const currentWorkbook =
    workbookSelect.value;

  const currentEngineer =
    engineerSelect.value;

  const workbooks = [
    ...new Set(
      records
        .map(record =>
          String(
            record.sourceFile || ""
          ).trim()
        )
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b)
  );

  const engineers = [
    ...new Set(
      records
        .map(record =>
          String(
            record.engineer || ""
          ).trim()
        )
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b)
  );

  workbookSelect.innerHTML =
    `
      <option value="">
        All workbooks
      </option>
    ` +
    workbooks
      .map(name => `
        <option
          value="${escapeHtml(name)}"
        >
          ${escapeHtml(name)}
        </option>
      `)
      .join("");

  engineerSelect.innerHTML =
    `
      <option value="">
        All engineers
      </option>
    ` +
    engineers
      .map(name => `
        <option
          value="${escapeHtml(name)}"
        >
          ${escapeHtml(name)}
        </option>
      `)
      .join("");

  if (
    workbooks.includes(
      currentWorkbook
    )
  ) {
    workbookSelect.value =
      currentWorkbook;
  }

  if (
    engineers.includes(
      currentEngineer
    )
  ) {
    engineerSelect.value =
      currentEngineer;
  }
}


function updatePerformanceRecordSelectionUi() {
  const selectedCount =
    performanceRecordManagerState
      .selectedIds.size;

  const countElement =
    el(
      "performanceRecordSelectedCount"
    );

  const deleteButton =
    el(
      "performanceRecordDeleteBtn"
    );

  if (countElement) {
    countElement.textContent =
      `${selectedCount} selected`;
  }

  if (deleteButton) {
    deleteButton.disabled =
      selectedCount === 0;
  }
}


function renderPerformanceRecordManager() {
  const type =
    performanceRecordManagerState.type;

  const allRecords =
    getPerformanceManagerRecords();

  const filteredRecords =
    getFilteredPerformanceManagerRecords();

  const title =
    el(
      "performanceRecordManagerTitle"
    );

  const typeLabel =
    el(
      "performanceRecordManagerType"
    );

  const subtitle =
    el(
      "performanceRecordManagerSubtitle"
    );

  const status =
    el(
      "performanceRecordStatus"
    );

  const tableHead =
    el(
      "performanceRecordTableHead"
    );

  const tableBody =
    el(
      "performanceRecordTableBody"
    );

  if (
    !tableHead ||
    !tableBody
  ) {
    return;
  }

  if (type === "morgan") {
    if (title) {
      title.textContent =
        "Manage Morgan & Lambert Audits";
    }

    if (typeLabel) {
      typeLabel.textContent =
        "Morgan & Lambert";
    }

    if (subtitle) {
      subtitle.textContent =
        "Select individual imported audit records to remove.";
    }

    tableHead.innerHTML = `
      <tr>
        <th class="performance-record-check-col">
          Select
        </th>

        <th>Date</th>
        <th>Engineer</th>
        <th>Outcome</th>
        <th>Score</th>
        <th>Source workbook</th>
      </tr>
    `;
  } else {
    if (title) {
      title.textContent =
        "Manage TCW Errors";
    }

    if (typeLabel) {
      typeLabel.textContent =
        "TCW Errors";
    }

    if (subtitle) {
      subtitle.textContent =
        "Select individual imported TCW error records to remove.";
    }

    tableHead.innerHTML = `
      <tr>
        <th class="performance-record-check-col">
          Select
        </th>

        <th>Date</th>
        <th>Engineer</th>
        <th>Address</th>
        <th>Reason</th>
        <th>Source workbook</th>
      </tr>
    `;
  }

  if (status) {
    status.textContent =
      `${filteredRecords.length} of ` +
      `${allRecords.length} record${
        allRecords.length === 1
          ? ""
          : "s"
      } shown`;
  }

  if (!filteredRecords.length) {
    tableBody.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="performance-record-empty"
        >
          No records match the current filters.
        </td>
      </tr>
    `;

    updatePerformanceRecordSelectionUi();
    return;
  }

  tableBody.innerHTML =
    filteredRecords
      .map(record => {
        const checked =
          performanceRecordManagerState
            .selectedIds
            .has(
              String(record.id)
            );

        if (type === "morgan") {
          const numericScore =
            Number(record.score);

          const score =
            Number.isFinite(
              numericScore
            )
              ? `${numericScore.toFixed(
                  1
                )}%`
              : "—";

          return `
            <tr>
              <td
                class="performance-record-check-col"
              >
                <input
                  type="checkbox"
                  class="performance-record-checkbox"
                  data-performance-record-id="${escapeHtml(
                    String(record.id)
                  )}"
                  ${
                    checked
                      ? "checked"
                      : ""
                  }
                  aria-label="Select Morgan and Lambert audit"
                />
              </td>

              <td>
                ${escapeHtml(
                  formatDate(
                    record.date
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  record.engineer || "—"
                )}
              </td>

              <td>
                <span
                  class="
                    performance-record-outcome
                    ${
                      record.outcome ===
                      "PASS"
                        ? "performance-record-pass"
                        : "performance-record-fail"
                    }
                  "
                >
                  ${escapeHtml(
                    record.outcome || "—"
                  )}
                </span>
              </td>

              <td>
                ${escapeHtml(score)}
              </td>

              <td>
                ${escapeHtml(
                  record.sourceFile ||
                  "Unknown"
                )}
              </td>
            </tr>
          `;
        }

        return `
          <tr>
            <td
              class="performance-record-check-col"
            >
              <input
                type="checkbox"
                class="performance-record-checkbox"
                data-performance-record-id="${escapeHtml(
                  String(record.id)
                )}"
                ${
                  checked
                    ? "checked"
                    : ""
                }
                aria-label="Select TCW error"
              />
            </td>

            <td>
              ${escapeHtml(
                formatDate(
                  record.date
                )
              )}
            </td>

            <td>
              ${escapeHtml(
                record.engineer || "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                record.address || "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                record.reason || "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                record.sourceFile ||
                "Unknown"
              )}
            </td>
          </tr>
        `;
      })
      .join("");

  tableBody
    .querySelectorAll(
      ".performance-record-checkbox"
    )
    .forEach(checkbox => {
      checkbox.addEventListener(
        "change",
        () => {
          const id =
            checkbox.dataset
              .performanceRecordId;

          if (!id) return;

          if (checkbox.checked) {
            performanceRecordManagerState
              .selectedIds
              .add(id);
          } else {
            performanceRecordManagerState
              .selectedIds
              .delete(id);
          }

          updatePerformanceRecordSelectionUi();
        }
      );
    });

  updatePerformanceRecordSelectionUi();
}


function openPerformanceRecordManager(
  type
) {
  performanceRecordManagerState.type =
    type === "morgan"
      ? "morgan"
      : "tcw";

  performanceRecordManagerState
    .selectedIds
    .clear();

  ensurePerformanceRecordIds(
    performanceRecordManagerState.type
  );

  const workbookFilter =
    el(
      "performanceRecordWorkbookFilter"
    );

  const engineerFilter =
    el(
      "performanceRecordEngineerFilter"
    );

  const search =
    el(
      "performanceRecordSearch"
    );

  if (workbookFilter) {
    workbookFilter.value = "";
  }

  if (engineerFilter) {
    engineerFilter.value = "";
  }

  if (search) {
    search.value = "";
  }

  populatePerformanceManagerFilters();
  renderPerformanceRecordManager();

  closeDashboardActionsMenu();

  el(
    "performanceRecordManagerModal"
  )?.classList.remove(
    "hidden"
  );
}


function closePerformanceRecordManager() {
  el(
    "performanceRecordManagerModal"
  )?.classList.add(
    "hidden"
  );

  performanceRecordManagerState
    .selectedIds
    .clear();
}


function selectVisiblePerformanceRecords() {
  const records =
    getFilteredPerformanceManagerRecords();

  records.forEach(record => {
    performanceRecordManagerState
      .selectedIds
      .add(
        String(record.id)
      );
  });

  renderPerformanceRecordManager();
}


function clearPerformanceRecordSelection() {
  performanceRecordManagerState
    .selectedIds
    .clear();

  renderPerformanceRecordManager();
}


function deleteSelectedPerformanceRecords() {
  const selectedIds =
    performanceRecordManagerState
      .selectedIds;

  if (!selectedIds.size) {
    return;
  }

  const type =
    performanceRecordManagerState.type;

  const label =
    type === "morgan"
      ? "Morgan & Lambert audit"
      : "TCW error";

  const confirmed =
    window.confirm(
      `Delete ${selectedIds.size} selected ${label}${
        selectedIds.size === 1
          ? ""
          : "s"
      }?\n\n` +
      "Only the selected records will be removed. Other imported records will be kept."
    );

  if (!confirmed) return;

  if (type === "morgan") {
    performanceState
      .morganLambertAudits =
        (
          performanceState
            .morganLambertAudits ||
          []
        ).filter(
          record =>
            !selectedIds.has(
              String(record.id)
            )
        );
  } else {
    performanceState.tcwErrors =
      (
        performanceState
          .tcwErrors || []
      ).filter(
        record =>
          !selectedIds.has(
            String(record.id)
          )
      );
  }

  /*
    Keep the import-status counts accurate
    after individual records are removed.
  */
  if (performanceState.importMeta) {
    performanceState
      .importMeta
      .tcwCount =
        performanceState
          .tcwErrors.length;

    performanceState
      .importMeta
      .morganCount =
        performanceState
          .morganLambertAudits
          .length;
  }

  const deletedCount =
    selectedIds.size;

  selectedIds.clear();

  savePerformanceState();

  renderExecutiveDashboard();
  renderAnalytics();

  populatePerformanceManagerFilters();
  renderPerformanceRecordManager();

  alert(
    `${deletedCount} selected ${label}${
      deletedCount === 1
        ? ""
        : "s"
    } removed.`
  );
}


function initPerformanceRecordManager() {
  el("manageTcwErrorsBtn")
    ?.addEventListener(
      "click",
      () =>
        openPerformanceRecordManager(
          "tcw"
        )
    );

  el("manageMorganAuditsBtn")
    ?.addEventListener(
      "click",
      () =>
        openPerformanceRecordManager(
          "morgan"
        )
    );

  el(
    "performanceRecordManagerCloseBtn"
  )?.addEventListener(
    "click",
    closePerformanceRecordManager
  );

  el(
    "performanceRecordWorkbookFilter"
  )?.addEventListener(
    "change",
    renderPerformanceRecordManager
  );

  el(
    "performanceRecordEngineerFilter"
  )?.addEventListener(
    "change",
    renderPerformanceRecordManager
  );

  el(
    "performanceRecordSearch"
  )?.addEventListener(
    "input",
    renderPerformanceRecordManager
  );

  el(
    "performanceRecordSelectVisibleBtn"
  )?.addEventListener(
    "click",
    selectVisiblePerformanceRecords
  );

  el(
    "performanceRecordClearSelectionBtn"
  )?.addEventListener(
    "click",
    clearPerformanceRecordSelection
  );

  el(
    "performanceRecordDeleteBtn"
  )?.addEventListener(
    "click",
    deleteSelectedPerformanceRecords
  );

  el(
    "performanceRecordManagerModal"
  )?.addEventListener(
    "click",
    event => {
      if (
        event.target ===
        el(
          "performanceRecordManagerModal"
        )
      ) {
        closePerformanceRecordManager();
      }
    }
  );

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Escape" &&
        !el(
          "performanceRecordManagerModal"
        )?.classList.contains(
          "hidden"
        )
      ) {
        closePerformanceRecordManager();
      }
    }
  );
}


const performanceExplorerState = {
  type: "tcw",
  from: "",
  to: "",
  engineer: "",
  workbook: "",
  search: ""
};


function getPerformanceExplorerRecords() {
  return performanceExplorerState.type ===
    "morgan"
      ? performanceState
          .morganLambertAudits || []
      : performanceState
          .tcwErrors || [];
}


function getPerformanceExplorerFilteredRecords() {
  const {
    from,
    to,
    engineer,
    workbook,
    search,
    type
  } = performanceExplorerState;

  const searchText =
    String(search || "")
      .trim()
      .toLowerCase();

  return getPerformanceExplorerRecords()
    .filter(record => {
      if (
        from &&
        String(record.date || "") < from
      ) {
        return false;
      }

      if (
        to &&
        String(record.date || "") > to
      ) {
        return false;
      }

      if (
        engineer &&
        record.engineer !== engineer
      ) {
        return false;
      }

      if (
        workbook &&
        record.sourceFile !== workbook
      ) {
        return false;
      }

      if (searchText) {
        const haystack =
          type === "morgan"
            ? `
                ${record.date || ""}
                ${record.engineer || ""}
                ${record.outcome || ""}
                ${record.score ?? ""}
                ${record.sourceFile || ""}
              `
            : `
                ${record.date || ""}
                ${record.engineer || ""}
                ${record.address || ""}
                ${record.reason || ""}
                ${record.sourceFile || ""}
              `;

        if (
          !haystack
            .toLowerCase()
            .includes(searchText)
        ) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) =>
      String(b.date || "")
        .localeCompare(
          String(a.date || "")
        )
    );
}


function getPerformanceExplorerInitialDates(
  source
) {
  if (source === "dashboard") {
    const periods =
      getExecutiveDashboardPeriods();

    return {
      from:
        periods?.currentFrom || "",
      to:
        periods?.currentTo || ""
    };
  }

  return {
    from:
      el("analyticsFrom")?.value || "",
    to:
      el("analyticsTo")?.value || ""
  };
}


function populatePerformanceExplorerFilters() {
  const records =
    getPerformanceExplorerRecords();

  const engineers = [
    ...new Set(
      records
        .map(record =>
          String(
            record.engineer || ""
          ).trim()
        )
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b)
  );

  const workbooks = [
    ...new Set(
      records
        .map(record =>
          String(
            record.sourceFile || ""
          ).trim()
        )
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b)
  );

  const engineerSelect =
    el(
      "performanceExplorerEngineer"
    );

  const workbookSelect =
    el(
      "performanceExplorerWorkbook"
    );

  if (engineerSelect) {
    engineerSelect.innerHTML =
      `
        <option value="">
          All engineers
        </option>
      ` +
      engineers
        .map(name => `
          <option value="${escapeHtml(
            name
          )}">
            ${escapeHtml(name)}
          </option>
        `)
        .join("");
  }

  if (workbookSelect) {
    workbookSelect.innerHTML =
      `
        <option value="">
          All workbooks
        </option>
      ` +
      workbooks
        .map(name => `
          <option value="${escapeHtml(
            name
          )}">
            ${escapeHtml(name)}
          </option>
        `)
        .join("");
  }
}


function buildPerformanceExplorerBarRows(
  entries,
  valueLabel = ""
) {
  if (!entries.length) {
    return `
      <div class="performance-explorer-empty">
        No matching data.
      </div>
    `;
  }

  const maximum =
    Math.max(
      1,
      ...entries.map(
        entry => entry.value
      )
    );

  return entries
    .map(entry => `
      <div class="performance-explorer-bar-row">
        <div class="performance-explorer-bar-label">
          ${escapeHtml(entry.label)}
        </div>

        <div class="performance-explorer-bar-track">
          <div
            class="performance-explorer-bar-fill"
            style="
              width:${
                Math.max(
                  2,
                  entry.value /
                  maximum *
                  100
                )
              }%
            "
          ></div>
        </div>

        <strong>
          ${escapeHtml(
            `${entry.value}${valueLabel}`
          )}
        </strong>
      </div>
    `)
    .join("");
}


function renderTcwPerformanceExplorer(
  records
) {
  const overview =
    el(
      "performanceExplorerOverview"
    );

  const chartLeft =
    el(
      "performanceExplorerChartLeft"
    );

  const chartRight =
    el(
      "performanceExplorerChartRight"
    );

  const table =
    el(
      "performanceExplorerTable"
    );

  const engineerCounts =
    new Map();

  const reasonCounts =
    new Map();

  records.forEach(record => {
    const engineer =
      String(
        record.engineer ||
        "Not recorded"
      ).trim() ||
      "Not recorded";

    const reason =
      String(
        record.reason ||
        "Not recorded"
      ).trim() ||
      "Not recorded";

    engineerCounts.set(
      engineer,
      (
        engineerCounts.get(
          engineer
        ) || 0
      ) + 1
    );

    reasonCounts.set(
      reason,
      (
        reasonCounts.get(
          reason
        ) || 0
      ) + 1
    );
  });

  const engineerEntries =
    Array.from(
      engineerCounts.entries()
    )
      .map(([label, value]) => ({
        label,
        value
      }))
      .sort(
        (a, b) =>
          b.value - a.value
      );

  const reasonEntries =
    Array.from(
      reasonCounts.entries()
    )
      .map(([label, value]) => ({
        label,
        value
      }))
      .sort(
        (a, b) =>
          b.value - a.value
      );

  const workbookCount =
    new Set(
      records
        .map(record =>
          record.sourceFile
        )
        .filter(Boolean)
    ).size;

  if (overview) {
    overview.innerHTML = `
      <div class="performance-explorer-kpi">
        <span>TCW errors</span>
        <strong>${records.length}</strong>
      </div>

      <div class="performance-explorer-kpi">
        <span>Engineers</span>
        <strong>
          ${engineerCounts.size}
        </strong>
      </div>

      <div class="performance-explorer-kpi">
        <span>Unique reasons</span>
        <strong>
          ${reasonCounts.size}
        </strong>
      </div>

      <div class="performance-explorer-kpi">
        <span>Source workbooks</span>
        <strong>${workbookCount}</strong>
      </div>
    `;
  }

  if (chartLeft) {
    chartLeft.innerHTML = `
      <div class="performance-explorer-chart-head">
        <h4>Most common reasons</h4>
        <span>
          Top TCW error causes
        </span>
      </div>

      <div class="performance-explorer-bars">
        ${buildPerformanceExplorerBarRows(
          reasonEntries.slice(0, 10)
        )}
      </div>
    `;
  }

  if (chartRight) {
    chartRight.innerHTML = `
      <div class="performance-explorer-chart-head">
        <h4>Errors by engineer</h4>
        <span>
          TCW volume by engineer
        </span>
      </div>

      <div class="performance-explorer-bars">
        ${buildPerformanceExplorerBarRows(
          engineerEntries.slice(0, 10)
        )}
      </div>
    `;
  }

  if (table) {
    table.innerHTML = `
      <thead>
        <tr>
          <th>Date</th>
          <th>Engineer</th>
          <th>Address</th>
          <th>Reason</th>
          <th>Source workbook</th>
        </tr>
      </thead>

      <tbody>
        ${
          records.length
            ? records
                .map(record => `
                  <tr>
                    <td>
                      ${escapeHtml(
                        formatDate(
                          record.date
                        )
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        record.engineer ||
                        "—"
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        record.address ||
                        "—"
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        record.reason ||
                        "—"
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        record.sourceFile ||
                        "—"
                      )}
                    </td>
                  </tr>
                `)
                .join("")
            : `
                <tr>
                  <td
                    colspan="5"
                    class="performance-explorer-empty"
                  >
                    No records match the selected filters.
                  </td>
                </tr>
              `
        }
      </tbody>
    `;
  }
}


function renderMorganPerformanceExplorer(
  records
) {
  const overview =
    el(
      "performanceExplorerOverview"
    );

  const chartLeft =
    el(
      "performanceExplorerChartLeft"
    );

  const chartRight =
    el(
      "performanceExplorerChartRight"
    );

  const table =
    el(
      "performanceExplorerTable"
    );

  const metrics =
    getMorganMetrics(records);

  const engineerMap =
    new Map();

  records.forEach(record => {
    const engineer =
      String(
        record.engineer ||
        "Not recorded"
      ).trim() ||
      "Not recorded";

    if (!engineerMap.has(engineer)) {
      engineerMap.set(
        engineer,
        {
          engineer,
          audits: 0,
          passes: 0,
          scoreTotal: 0,
          scored: 0
        }
      );
    }

    const item =
      engineerMap.get(engineer);

    item.audits++;

    if (
      String(
        record.outcome || ""
      ).toUpperCase() === "PASS"
    ) {
      item.passes++;
    }

    const score =
      Number(record.score);

    if (Number.isFinite(score)) {
      item.scoreTotal += score;
      item.scored++;
    }
  });

  const engineerRows =
    Array.from(
      engineerMap.values()
    )
      .map(item => ({
        ...item,

        passRate:
          item.audits
            ? Math.round(
                item.passes /
                item.audits *
                100
              )
            : 0,

        averageScore:
          item.scored
            ? item.scoreTotal /
              item.scored
            : 0
      }))
      .sort(
        (a, b) =>
          b.audits - a.audits ||
          b.averageScore -
            a.averageScore
      );

  if (overview) {
    overview.innerHTML = `
      <div class="performance-explorer-kpi">
        <span>Audits</span>
        <strong>${metrics.total}</strong>
      </div>

      <div class="performance-explorer-kpi">
        <span>PASS</span>
        <strong>${metrics.passes}</strong>
      </div>

      <div class="performance-explorer-kpi">
        <span>FAIL</span>
        <strong>${metrics.fails}</strong>
      </div>

      <div class="performance-explorer-kpi">
        <span>PASS rate</span>
        <strong>
          ${metrics.passRate}%
        </strong>
      </div>

      <div class="performance-explorer-kpi">
        <span>Average score</span>
        <strong>
          ${metrics.averageScore.toFixed(
            1
          )}%
        </strong>
      </div>
    `;
  }

  if (chartLeft) {
    chartLeft.innerHTML = `
      <div class="performance-explorer-chart-head">
        <h4>Audit volume by engineer</h4>
        <span>
          Number of Morgan & Lambert audits
        </span>
      </div>

      <div class="performance-explorer-bars">
        ${buildPerformanceExplorerBarRows(
          engineerRows
            .slice(0, 10)
            .map(item => ({
              label:
                item.engineer,
              value:
                item.audits
            }))
        )}
      </div>
    `;
  }

  if (chartRight) {
    chartRight.innerHTML = `
      <div class="performance-explorer-chart-head">
        <h4>PASS rate by engineer</h4>
        <span>
          Based on filtered records
        </span>
      </div>

      <div class="performance-explorer-bars">
        ${buildPerformanceExplorerBarRows(
          engineerRows
            .slice(0, 10)
            .map(item => ({
              label:
                item.engineer,
              value:
                item.passRate
            })),
          "%"
        )}
      </div>
    `;
  }

  if (table) {
    table.innerHTML = `
      <thead>
        <tr>
          <th>Date</th>
          <th>Engineer</th>
          <th>Result</th>
          <th>Score</th>
          <th>Source workbook</th>
        </tr>
      </thead>

      <tbody>
        ${
          records.length
            ? records
                .map(record => `
                  <tr>
                    <td>
                      ${escapeHtml(
                        formatDate(
                          record.date
                        )
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        record.engineer ||
                        "—"
                      )}
                    </td>

                    <td>
                      <span
                        class="
                          performance-record-outcome
                          ${
                            record.outcome ===
                            "PASS"
                              ? "performance-record-pass"
                              : "performance-record-fail"
                          }
                        "
                      >
                        ${escapeHtml(
                          record.outcome ||
                          "—"
                        )}
                      </span>
                    </td>

                    <td>
                      ${
                        Number.isFinite(
                          Number(
                            record.score
                          )
                        )
                          ? `${Number(
                              record.score
                            ).toFixed(1)}%`
                          : "—"
                      }
                    </td>

                    <td>
                      ${escapeHtml(
                        record.sourceFile ||
                        "—"
                      )}
                    </td>
                  </tr>
                `)
                .join("")
            : `
                <tr>
                  <td
                    colspan="5"
                    class="performance-explorer-empty"
                  >
                    No records match the selected filters.
                  </td>
                </tr>
              `
        }
      </tbody>
    `;
  }
}


function renderPerformanceExplorer() {
  const records =
    getPerformanceExplorerFilteredRecords();

  const count =
    el(
      "performanceExplorerCount"
    );

  if (count) {
    count.textContent =
      `${records.length} record${
        records.length === 1
          ? ""
          : "s"
      }`;
  }

  if (
    performanceExplorerState.type ===
    "morgan"
  ) {
    renderMorganPerformanceExplorer(
      records
    );
  } else {
    renderTcwPerformanceExplorer(
      records
    );
  }
}


function syncPerformanceExplorerState() {
  performanceExplorerState.from =
    el("performanceExplorerFrom")
      ?.value || "";

  performanceExplorerState.to =
    el("performanceExplorerTo")
      ?.value || "";

  performanceExplorerState.engineer =
    el("performanceExplorerEngineer")
      ?.value || "";

  performanceExplorerState.workbook =
    el("performanceExplorerWorkbook")
      ?.value || "";

  performanceExplorerState.search =
    el("performanceExplorerSearch")
      ?.value || "";

  renderPerformanceExplorer();
}


function closePerformanceExplorer() {
  el("performanceExplorerBackdrop")
    ?.remove();
}


function openPerformanceExplorer(
  type,
  source
) {
  closePerformanceExplorer();

  performanceExplorerState.type =
    type === "morgan"
      ? "morgan"
      : "tcw";

  const initialDates =
    getPerformanceExplorerInitialDates(
      source
    );

  performanceExplorerState.from =
    initialDates.from;

  performanceExplorerState.to =
    initialDates.to;

  performanceExplorerState.engineer =
    "";

  performanceExplorerState.workbook =
    "";

  performanceExplorerState.search =
    "";

  const isMorgan =
    performanceExplorerState.type ===
    "morgan";

  const backdrop =
    document.createElement("div");

  backdrop.id =
    "performanceExplorerBackdrop";

  backdrop.className =
    "performance-explorer-backdrop";

  backdrop.innerHTML = `
    <section
      class="performance-explorer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="performanceExplorerTitle"
    >
      <header class="performance-explorer-head">
        <div>
          <div class="performance-explorer-eyebrow">
            External Performance Metrics
          </div>

          <h2 id="performanceExplorerTitle">
            ${
              isMorgan
                ? "Morgan & Lambert Explorer"
                : "TCW Error Explorer"
            }
          </h2>

          <span class="muted">
            Inspect, filter and analyse the complete imported dataset.
          </span>
        </div>

        <div class="performance-explorer-head-actions">
          <span
            id="performanceExplorerCount"
            class="performance-explorer-count"
          ></span>

          <button
            id="performanceExplorerCloseBtn"
            class="btn ghost"
            type="button"
          >
            Close
          </button>
        </div>
      </header>

      <div class="performance-explorer-filters">
        <label class="field">
          <span>From</span>

          <input
            id="performanceExplorerFrom"
            type="date"
            value="${escapeHtml(
              performanceExplorerState.from
            )}"
          />
        </label>

        <label class="field">
          <span>To</span>

          <input
            id="performanceExplorerTo"
            type="date"
            value="${escapeHtml(
              performanceExplorerState.to
            )}"
          />
        </label>

        <label class="field">
          <span>Engineer</span>

          <select
            id="performanceExplorerEngineer"
          >
            <option value="">
              All engineers
            </option>
          </select>
        </label>

        <label class="field">
          <span>Source workbook</span>

          <select
            id="performanceExplorerWorkbook"
          >
            <option value="">
              All workbooks
            </option>
          </select>
        </label>

        <label
          class="
            field
            performance-explorer-search
          "
        >
          <span>Search</span>

          <input
            id="performanceExplorerSearch"
            type="search"
            placeholder="${
              isMorgan
                ? "Search engineer, result or score"
                : "Search engineer, address or reason"
            }"
          />
        </label>

        <button
          id="performanceExplorerClearFiltersBtn"
          class="btn ghost"
          type="button"
        >
          Clear filters
        </button>
      </div>

      <div
        id="performanceExplorerOverview"
        class="performance-explorer-overview"
      ></div>

      <div class="performance-explorer-chart-grid">
        <section
          id="performanceExplorerChartLeft"
          class="performance-explorer-chart"
        ></section>

        <section
          id="performanceExplorerChartRight"
          class="performance-explorer-chart"
        ></section>
      </div>

      <section class="performance-explorer-records">
        <div class="performance-explorer-records-head">
          <div>
            <h3>Matching records</h3>

            <span class="muted">
              Complete row-level data for the selected filters
            </span>
          </div>
        </div>

        <div class="performance-explorer-table-wrap">
          <table
            id="performanceExplorerTable"
            class="performance-explorer-table"
          ></table>
        </div>
      </section>
    </section>
  `;

  document.body.appendChild(
    backdrop
  );

  populatePerformanceExplorerFilters();

  el("performanceExplorerEngineer").value =
    "";

  el("performanceExplorerWorkbook").value =
    "";

  [
    "performanceExplorerFrom",
    "performanceExplorerTo",
    "performanceExplorerEngineer",
    "performanceExplorerWorkbook"
  ].forEach(id => {
    el(id)?.addEventListener(
      "change",
      syncPerformanceExplorerState
    );
  });

  el("performanceExplorerSearch")
    ?.addEventListener(
      "input",
      syncPerformanceExplorerState
    );

  el(
    "performanceExplorerClearFiltersBtn"
  )?.addEventListener(
    "click",
    () => {
      performanceExplorerState.from =
        "";

      performanceExplorerState.to =
        "";

      performanceExplorerState.engineer =
        "";

      performanceExplorerState.workbook =
        "";

      performanceExplorerState.search =
        "";

      el("performanceExplorerFrom").value =
        "";

      el("performanceExplorerTo").value =
        "";

      el(
        "performanceExplorerEngineer"
      ).value = "";

      el(
        "performanceExplorerWorkbook"
      ).value = "";

      el(
        "performanceExplorerSearch"
      ).value = "";

      renderPerformanceExplorer();
    }
  );

  el("performanceExplorerCloseBtn")
    ?.addEventListener(
      "click",
      closePerformanceExplorer
    );

  backdrop.addEventListener(
    "click",
    event => {
      if (event.target === backdrop) {
        closePerformanceExplorer();
      }
    }
  );

  document.addEventListener(
    "keydown",
    function closeExplorerOnEscape(
      event
    ) {
      if (
        event.key !== "Escape" ||
        !el(
          "performanceExplorerBackdrop"
        )
      ) {
        return;
      }

      closePerformanceExplorer();

      document.removeEventListener(
        "keydown",
        closeExplorerOnEscape
      );
    }
  );

  renderPerformanceExplorer();
}


function makePerformanceCardExplorable(
  container,
  type,
  source,
  label
) {
  if (!container) return;

  const card =
    container.closest(
      source === "dashboard"
        ? ".dashboard-panel"
        : ".analytics-card"
    );

  if (
    !card ||
    card.dataset
      .performanceExplorerReady ===
      "true"
  ) {
    return;
  }

  card.dataset.performanceExplorerReady =
    "true";

  card.classList.add(
    "performance-explorer-clickable"
  );

  card.setAttribute(
    "role",
    "button"
  );

  card.setAttribute(
    "tabindex",
    "0"
  );

  card.setAttribute(
    "aria-label",
    `Open ${label}`
  );

  const open = event => {
    /*
      Existing period bars remain clickable
      and retain their current drill-down.
    */
    if (
      event?.target?.closest?.(
        "button, input, select, a, [data-performance-period]"
      )
    ) {
      return;
    }

    openPerformanceExplorer(
      type,
      source
    );
  };

  card.addEventListener(
    "click",
    open
  );

  card.addEventListener(
    "keydown",
    event => {
      if (
        event.key !== "Enter" &&
        event.key !== " "
      ) {
        return;
      }

      event.preventDefault();

      openPerformanceExplorer(
        type,
        source
      );
    }
  );
}


function initPerformanceExplorer() {
  makePerformanceCardExplorable(
    el("dashboardTcwMetrics"),
    "tcw",
    "dashboard",
    "TCW Error Explorer"
  );

  makePerformanceCardExplorable(
    el("dashboardMorganMetrics"),
    "morgan",
    "dashboard",
    "Morgan & Lambert Explorer"
  );

  makePerformanceCardExplorable(
    el("analyticsTcwMetrics"),
    "tcw",
    "analytics",
    "TCW Error Explorer"
  );

  makePerformanceCardExplorable(
    el("analyticsMorganMetrics"),
    "morgan",
    "analytics",
    "Morgan & Lambert Explorer"
  );
}


function initPerformanceWorkbookImport() {
  const button =
    el(
      "importPerformanceWorkbookBtn"
    );

  const input =
    el(
      "performanceWorkbookInput"
    );

  if (
    !button ||
    !input ||
    button.dataset.initialised ===
      "true"
  ) {
    return;
  }

  button.dataset.initialised =
    "true";

  button.addEventListener(
    "click",
    () => input.click()
  );

   input.addEventListener(
    "change",
    async event => {
      const files =
        Array.from(
          event.target.files || []
        );

      if (!files.length) return;

           const originalHtml =
        button.innerHTML;

      try {
        button.disabled = true;

        button.innerHTML = `
          <span class="dashboard-dropdown-icon">
            ⇧
          </span>

          <span>
            <strong>
              Importing ${files.length} workbook${
                files.length === 1
                  ? ""
                  : "s"
              }…
            </strong>

            <small>
              Please wait while the files are processed
            </small>
          </span>
        `;

        const result =
          await importPerformanceWorkbooks(
            files
          );

        const messageParts = [
          `${result.processedFiles} workbook${
            result.processedFiles === 1
              ? ""
              : "s"
          } processed.`,

          "",

          `TCW rows read: ${result.importedTcwCount}`,
          `New TCW rows added: ${result.tcwAdded}`,
          `Stored TCW history: ${result.tcwCount}`,

          "",

          `Morgan & Lambert rows read: ${result.importedMorganCount}`,
          `New Morgan & Lambert rows added: ${result.morganAdded}`,
          `Stored Morgan & Lambert history: ${result.morganCount}`
        ];

        if (
          result.skippedFiles.length
        ) {
          messageParts.push(
            "",
            `Skipped unsupported files: ${result.skippedFiles.length}`
          );
        }

        alert(
          messageParts.join("\n")
        );
      } catch (error) {
        console.error(
          "Performance workbook import failed",
          error
        );

        alert(
          `The workbook could not be imported:\n\n${error?.message || error}`
        );
      } finally {
        button.disabled = false;

              button.innerHTML =
        originalHtml;

        input.value = "";
      }
    }
  );
}

function performanceEngineerKey(
  value
) {
  const text =
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(
        /[^a-z0-9]+/g,
        " "
      )
      .replace(
        /\s+/g,
        " "
      )
      .trim();

  if (!text) {
    return "";
  }

  const parts =
    text.split(" ")
      .filter(Boolean);

  if (!parts.length) {
    return "";
  }

  /*
    Examples:

    Graham Black
    -> gblack

    G.Black
    -> gblack

    John Turlington
    -> jturlington

    J.Turlington
    -> jturlington
  */

  if (parts.length === 1) {
    const single =
      parts[0];

    /*
      Handles values which originally looked
      like G.Black but have become "g black"
      after punctuation cleanup.
    */
    return single;
  }

  const first =
    parts[0];

  const surname =
    parts[parts.length - 1];

  return (
    first.charAt(0) +
    surname
  );
}
function performanceRecordsInRange(
  records,
  from,
  to,
  selectedEngineer = ""
) {
  const engineerKey =
    performanceEngineerKey(
      selectedEngineer
    );

  return (records || []).filter(
    record => {
      if (
        !analyticsDateInRange(
          record.date,
          from,
          to
        )
      ) {
        return false;
      }

      if (!engineerKey) {
        return true;
      }

      const recordEngineerKey =
        performanceEngineerKey(
          record.engineer
        );

      return (
        recordEngineerKey ===
        engineerKey
      );
    }
  );
}


function getMorganMetrics(records) {
  const total =
    records.length;

  const passes =
    records.filter(
      record =>
        record.outcome === "PASS"
    ).length;

  const fails =
    records.filter(
      record =>
        record.outcome === "FAIL"
    ).length;

  const scored =
    records.filter(
      record =>
        Number.isFinite(
          Number(record.score)
        )
    );

  const averageScore =
    scored.length
      ? scored.reduce(
          (totalScore, record) =>
            totalScore +
            Number(record.score),
          0
        ) / scored.length
      : 0;

  return {
    total,
    passes,
    fails,

    passRate:
      total
        ? Math.round(
            passes /
            total *
            100
          )
        : 0,

    averageScore
  };
}

function closePerformanceDrilldown() {
  el(
    "performanceDrilldownBackdrop"
  )?.remove();
}


function openPerformanceDrilldown(
  type,
  records,
  title,
  periodLabel
) {
  closePerformanceDrilldown();

  const sortedRecords =
    [...(records || [])].sort(
      (a, b) =>
        String(b.date || "")
          .localeCompare(
            String(a.date || "")
          )
    );

  const backdrop =
    document.createElement("div");

  backdrop.id =
    "performanceDrilldownBackdrop";

  backdrop.className =
    "performance-drilldown-backdrop";

  const isMorgan =
    type === "morgan";

  const rows =
    sortedRecords.length
      ? sortedRecords
          .map(record => `
            <tr>
              <td>
                ${escapeHtml(
                  formatDate(
                    record.date
                  )
                )}
              </td>

                            <td>
                ${escapeHtml(
                  record.engineer ||
                  "Not recorded"
                )}
              </td>

              ${
                !isMorgan
                  ? `
                    <td>
                      ${escapeHtml(
                        record.address ||
                        "Not recorded"
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        record.reason ||
                        "Not recorded"
                      )}
                    </td>
                  `
                  : ""
              }

              ${
                isMorgan
                  ? `
                    <td
                      class="${
                        record.outcome ===
                        "PASS"
                          ? "performance-outcome-pass"
                          : "performance-outcome-fail"
                      }"
                    >
                      ${escapeHtml(
                        record.outcome ||
                        "—"
                      )}
                    </td>

                    <td>
                      ${
                        Number.isFinite(
                          Number(
                            record.score
                          )
                        )
                          ? `${Number(
                              record.score
                            ).toFixed(1)}%`
                          : "—"
                      }
                    </td>
                  `
                  : ""
              }

              <td>
                ${escapeHtml(
                  record.sourceFile ||
                  "Imported workbook"
                )}
              </td>
            </tr>
          `)
          .join("")
      : `
          <tr>
            <td
              colspan="${isMorgan ? 5 : 5}"
              class="dashboard-empty"
            >
              No matching records.
            </td>
          </tr>
        `;

  backdrop.innerHTML = `
    <section
      class="performance-drilldown"
      role="dialog"
      aria-modal="true"
      aria-labelledby="performanceDrilldownTitle"
    >
      <div class="performance-drilldown-head">
        <div>
          <h3 id="performanceDrilldownTitle">
            ${escapeHtml(title)}
          </h3>

          <span class="muted">
            ${escapeHtml(periodLabel)}
            •
            ${sortedRecords.length}
            record${
              sortedRecords.length === 1
                ? ""
                : "s"
            }
          </span>
        </div>

                      <div class="performance-drilldown-actions">
          ${
            !isMorgan
              ? `
                <button
                  id="showTcwReasonChartBtn"
                  class="btn small"
                  type="button"
                >
                  Most Common Reasons
                </button>

                <button
                  id="showTcwEngineerChartBtn"
                  class="btn small"
                  type="button"
                >
                  Fails by Engineer
                </button>
              `
              : `
                <button
                  id="showMorganEngineerChartBtn"
                  class="btn small"
                  type="button"
                >
                  Engineer Performance
                </button>
              `
          }

          <button
            id="closePerformanceDrilldownBtn"
            class="btn ghost small"
            type="button"
          >
            Close
          </button>
        </div>
      </div>

            <div
        id="performanceDrilldownBody"
        class="performance-drilldown-body"
      >
        <table class="performance-drilldown-table">
          <thead>
            <tr>
                            <th>Date</th>
              <th>Engineer</th>

              ${
                !isMorgan
                  ? `
                    <th>Address</th>
                    <th>Reason</th>
                  `
                  : ""
              }

              ${
                isMorgan
                  ? `
                    <th>Result</th>
                    <th>Score</th>
                  `
                  : ""
              }

              <th>Source workbook</th>
            </tr>
          </thead>

          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    </section>
  `;

    document.body.appendChild(
    backdrop
  );

  const drilldownBody =
    el("performanceDrilldownBody");

  const originalTableHtml =
    drilldownBody
      ?.innerHTML || "";

   el(
    "showTcwReasonChartBtn"
  )?.addEventListener(
    "click",
    () => {
      const reasonButton =
        el(
          "showTcwReasonChartBtn"
        );

      const engineerButton =
        el(
          "showTcwEngineerChartBtn"
        );

      const body =
        el(
          "performanceDrilldownBody"
        );

      if (
        !reasonButton ||
        !body
      ) {
        return;
      }

      if (
        reasonButton.dataset.view ===
        "chart"
      ) {
        body.innerHTML =
          originalTableHtml;

        reasonButton.textContent =
          "Most Common Reasons";

        reasonButton.dataset.view =
          "records";

        if (engineerButton) {
          engineerButton.textContent =
            "Fails by Engineer";

          engineerButton.dataset.view =
            "records";
        }

        return;
      }

      renderTcwReasonChart(
        sortedRecords
      );
    }
  );


  el(
    "showTcwEngineerChartBtn"
  )?.addEventListener(
    "click",
    () => {
      const engineerButton =
        el(
          "showTcwEngineerChartBtn"
        );

      const reasonButton =
        el(
          "showTcwReasonChartBtn"
        );

      const body =
        el(
          "performanceDrilldownBody"
        );

      if (
        !engineerButton ||
        !body
      ) {
        return;
      }

      if (
        engineerButton.dataset.view ===
        "chart"
      ) {
        body.innerHTML =
          originalTableHtml;

        engineerButton.textContent =
          "Fails by Engineer";

        engineerButton.dataset.view =
          "records";

        if (reasonButton) {
          reasonButton.textContent =
            "Most Common Reasons";

          reasonButton.dataset.view =
            "records";
        }

        return;
      }

           renderTcwEngineerChart(
        sortedRecords
      );
    }
  );


  el(
    "showMorganEngineerChartBtn"
  )?.addEventListener(
    "click",
    () => {
      const button =
        el(
          "showMorganEngineerChartBtn"
        );

      const body =
        el(
          "performanceDrilldownBody"
        );

      if (
        !button ||
        !body
      ) {
        return;
      }

      if (
        button.dataset.view ===
        "chart"
      ) {
        body.innerHTML =
          originalTableHtml;

        button.textContent =
          "Engineer Performance";

        button.dataset.view =
          "records";

        return;
      }

      renderMorganEngineerChart(
        sortedRecords
      );
    }
  );


  el(
    "closePerformanceDrilldownBtn"
  )?.addEventListener(
    "click",
    closePerformanceDrilldown
  );

  backdrop.addEventListener(
    "click",
    event => {
      if (event.target === backdrop) {
        closePerformanceDrilldown();
      }
    }
  );

  document.addEventListener(
    "keydown",
    function closeOnEscape(event) {
      if (event.key !== "Escape") {
        return;
      }

      closePerformanceDrilldown();

      document.removeEventListener(
        "keydown",
        closeOnEscape
      );
    }
  );
}
function renderMorganEngineerChart(
  records
) {
  const body =
    el("performanceDrilldownBody");

  const button =
    el(
      "showMorganEngineerChartBtn"
    );

  if (
    !body ||
    !button
  ) {
    return;
  }

  const engineerMap =
    new Map();

  (records || []).forEach(record => {
    const engineer =
      String(
        record.engineer ||
        "Not recorded"
      ).trim() ||
      "Not recorded";

    if (
      !engineerMap.has(engineer)
    ) {
      engineerMap.set(
        engineer,
        {
          engineer,
          audits: 0,
          passes: 0,
          fails: 0,
          scoreTotal: 0,
          scoredAudits: 0
        }
      );
    }

    const item =
      engineerMap.get(engineer);

    item.audits++;

    if (
      String(
        record.outcome || ""
      ).toUpperCase() === "PASS"
    ) {
      item.passes++;
    } else {
      item.fails++;
    }

    const score =
      Number(record.score);

    if (
      Number.isFinite(score)
    ) {
      item.scoreTotal += score;
      item.scoredAudits++;
    }
  });

  const engineers =
    Array.from(
      engineerMap.values()
    )
      .map(item => ({
        ...item,

        passRate:
          item.audits
            ? Math.round(
                item.passes /
                item.audits *
                100
              )
            : 0,

        averageScore:
          item.scoredAudits
            ? item.scoreTotal /
              item.scoredAudits
            : 0
      }))
      .sort(
        (a, b) =>
          b.audits - a.audits ||
          b.averageScore -
            a.averageScore ||
          a.engineer.localeCompare(
            b.engineer
          )
      );

  if (!engineers.length) {
    body.innerHTML = `
      <div class="dashboard-empty">
        No Morgan & Lambert audits were found.
      </div>
    `;

    return;
  }

  const maximumAudits =
    Math.max(
      ...engineers.map(
        item => item.audits
      ),
      1
    );

  body.innerHTML = `
    <div class="morgan-engineer-chart">
      <div class="tcw-reason-chart-summary">
        <strong>
          Morgan & Lambert performance by engineer
        </strong>

        <span class="muted">
          ${records.length} audit${
            records.length === 1
              ? ""
              : "s"
          }
          •
          ${engineers.length} engineer${
            engineers.length === 1
              ? ""
              : "s"
          }
        </span>
      </div>

      <div class="morgan-engineer-chart-head">
        <span>Engineer</span>
        <span>Audit volume</span>
        <span>Audits</span>
        <span>Average</span>
        <span>PASS</span>
        <span>FAIL</span>
        <span>PASS rate</span>
      </div>

      <div class="morgan-engineer-chart-rows">
        ${engineers
          .map(item => `
            <div class="morgan-engineer-chart-row">
              <strong class="morgan-engineer-name">
                ${escapeHtml(
                  item.engineer
                )}
              </strong>

              <div class="tcw-reason-track">
                <div
                  class="tcw-reason-fill"
                  style="
                    width:${
                      Math.max(
                        3,
                        item.audits /
                        maximumAudits *
                        100
                      )
                    }%;
                  "
                ></div>
              </div>

              <strong>
                ${item.audits}
              </strong>

              <strong>
                ${item.averageScore.toFixed(
                  1
                )}%
              </strong>

              <strong class="performance-outcome-pass">
                ${item.passes}
              </strong>

              <strong class="performance-outcome-fail">
                ${item.fails}
              </strong>

              <strong>
                ${item.passRate}%
              </strong>
            </div>
          `)
          .join("")}
      </div>
    </div>
  `;

  button.textContent =
    "Show Records";

  button.dataset.view =
    "chart";
}
function renderTcwEngineerChart(
  records
) {
  const body =
    el("performanceDrilldownBody");

  const engineerButton =
    el("showTcwEngineerChartBtn");

  const reasonButton =
    el("showTcwReasonChartBtn");

  if (
    !body ||
    !engineerButton
  ) {
    return;
  }

  const engineerCounts =
    new Map();

  (records || []).forEach(record => {
    const engineer =
      String(
        record.engineer ||
        "Not recorded"
      ).trim() ||
      "Not recorded";

    engineerCounts.set(
      engineer,
      (
        engineerCounts.get(
          engineer
        ) || 0
      ) + 1
    );
  });

  const entries =
    Array.from(
      engineerCounts.entries()
    ).sort(
      (a, b) =>
        b[1] - a[1] ||
        a[0].localeCompare(b[0])
    );

  if (!entries.length) {
    body.innerHTML = `
      <div class="dashboard-empty">
        No TCW engineer records were found.
      </div>
    `;

    return;
  }

  const maximum =
    Math.max(
      ...entries.map(
        item => item[1]
      ),
      1
    );

  body.innerHTML = `
    <div class="tcw-reason-chart">
      <div class="tcw-reason-chart-summary">
        <strong>
          TCW fails by engineer
        </strong>

        <span class="muted">
          ${records.length} TCW error${
            records.length === 1
              ? ""
              : "s"
          }
          •
          ${entries.length} engineer${
            entries.length === 1
              ? ""
              : "s"
          }
        </span>
      </div>

      <div class="tcw-reason-bars">
        ${entries
          .map(
            ([engineer, count]) => `
              <div class="tcw-reason-row">
                <div class="tcw-reason-label">
                  ${escapeHtml(engineer)}
                </div>

                <div class="tcw-reason-track">
                  <div
                    class="tcw-reason-fill"
                    style="
                      width:${
                        Math.max(
                          3,
                          count /
                          maximum *
                          100
                        )
                      }%;
                    "
                  ></div>
                </div>

                <strong>${count}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  engineerButton.textContent =
    "Show Records";

  engineerButton.dataset.view =
    "chart";

  if (reasonButton) {
    reasonButton.textContent =
      "Most Common Reasons";

    reasonButton.dataset.view =
      "records";
  }
}
function renderTcwReasonChart(
  records
) {
  const body =
    el("performanceDrilldownBody");

    const button =
    el("showTcwReasonChartBtn");

  const engineerButton =
    el("showTcwEngineerChartBtn");

  if (!body || !button) {
    return;
  }

  const reasonCounts =
    new Map();

  (records || []).forEach(record => {
    const reason =
      String(
        record.reason ||
        "Not recorded"
      ).trim() ||
      "Not recorded";

    reasonCounts.set(
      reason,
      (
        reasonCounts.get(reason) ||
        0
      ) + 1
    );
  });

  const entries =
    Array.from(
      reasonCounts.entries()
    ).sort(
      (a, b) =>
        b[1] - a[1] ||
        a[0].localeCompare(b[0])
    );

  if (!entries.length) {
    body.innerHTML = `
      <div class="dashboard-empty">
        No TCW reasons were found.
      </div>
    `;

    return;
  }

  const maximum =
    Math.max(
      ...entries.map(
        item => item[1]
      ),
      1
    );

  body.innerHTML = `
    <div class="tcw-reason-chart">
      <div class="tcw-reason-chart-summary">
        <strong>
          Most common TCW error reasons
        </strong>

        <span class="muted">
          ${records.length} record${
            records.length === 1
              ? ""
              : "s"
          }
          •
          ${entries.length} unique reason${
            entries.length === 1
              ? ""
              : "s"
          }
        </span>
      </div>

      <div class="tcw-reason-bars">
        ${entries
          .map(
            ([reason, count]) => `
              <div class="tcw-reason-row">
                <div class="tcw-reason-label">
                  ${escapeHtml(reason)}
                </div>

                <div class="tcw-reason-track">
                  <div
                    class="tcw-reason-fill"
                    style="
                      width:${
                        Math.max(
                          3,
                          count /
                          maximum *
                          100
                        )
                      }%;
                    "
                  ></div>
                </div>

                <strong>${count}</strong>
              </div>
            `
          )
          .join("")}
      </div>
    </div>
  `;

  button.textContent =
    "Show Records";

  button.dataset.view =
    "chart";
}
function addPerformanceDrilldownHandlers(
  container,
  type,
  currentRecords,
  previousRecords,
  periods
) {
  if (!container) return;

  container
    .querySelectorAll(
      "[data-performance-period]"
    )
    .forEach(item => {
      const open = () => {
        const period =
          item.dataset
            .performancePeriod;

        const records =
          period === "previous"
            ? previousRecords
            : currentRecords;

        const label =
          period === "previous"
            ? `${formatDate(
                periods.previousFrom
              )}–${formatDate(
                periods.previousTo
              )}`
            : `${formatDate(
                periods.currentFrom
              )}–${formatDate(
                periods.currentTo
              )}`;

        openPerformanceDrilldown(
          type,
          records,
          type === "tcw"
            ? "TCW Error Records"
            : "Morgan & Lambert Audits",
          label
        );
      };

      item.addEventListener(
        "click",
        open
      );

      item.addEventListener(
        "keydown",
        event => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            event.preventDefault();
            open();
          }
        }
      );
    });
}
function renderExternalMetricCard(
  label,
  value,
  detail = ""
) {
  return `
    <div class="dashboard-external-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      ${
        detail
          ? `<small>${escapeHtml(detail)}</small>`
          : ""
      }
    </div>
  `;
}

function formatPerformanceDateShort(
  value
) {
  const formatted =
    formatDate(value);

  return String(formatted)
    .replace(
      /^(\d{2}\/\d{2}\/)\d{2}(\d{2})$/,
      "$1$2"
    );
}


function formatPerformancePeriodLabel(
  from,
  to,
  shortYear = false
) {
  const formatter =
    shortYear
      ? formatPerformanceDateShort
      : formatDate;

  return `${formatter(from)}–${formatter(to)}`;
}
function renderPerformancePanels(
  periods,
  options
) {
  const {
    tcwMetricsId,
    tcwChartId,
    morganMetricsId,
    morganComparisonId,
    showStatus = false
  } = options;

  const tcwContainer =
    el(tcwMetricsId);

  const tcwChart =
    el(tcwChartId);

  const morganContainer =
    el(morganMetricsId);

  const morganComparison =
    el(morganComparisonId);

  if (
    !tcwContainer ||
    !tcwChart ||
    !morganContainer ||
    !morganComparison
  ) {
    return;
  }

  const status =
    el(
      "performanceWorkbookStatus"
    );

  if (
    showStatus &&
    status
  ) {
    if (
      performanceState.importMeta
    ) {
      const imported =
        new Date(
          performanceState
            .importMeta
            .importedAt
        );

      status.textContent =
        `${performanceState.importMeta.fileName} • ` +
        `${performanceState.importMeta.tcwCount} TCW errors • ` +
        `${performanceState.importMeta.morganCount} Morgan & Lambert audits • ` +
        `imported ${imported.toLocaleString("en-GB")}`;

      status.classList.remove(
        "dashboard-import-error"
      );
    } else {
      status.textContent =
        "No workbook imported";
    }
  }

  if (!periods) {
    const message = `
      <div class="dashboard-empty">
        Choose a valid Analytics date range.
      </div>
    `;

    tcwContainer.innerHTML =
      message;

    tcwChart.innerHTML = "";

    morganContainer.innerHTML =
      message;

    morganComparison.innerHTML =
      "";

    return;
  }

    const selectedEngineer =
  el("analyticsEngineer")
    ?.value || "";

const comparisonEnabled =
  periods.comparisonEnabled !== false;

const currentPeriodLabel =
    formatPerformancePeriodLabel(
      periods.currentFrom,
      periods.currentTo
    );

  const previousPeriodLabel =
  comparisonEnabled
    ? formatPerformancePeriodLabel(
        periods.previousFrom,
        periods.previousTo
      )
    : "";

const currentPeriodShortLabel =
    formatPerformancePeriodLabel(
      periods.currentFrom,
      periods.currentTo,
      true
    );

  const previousPeriodShortLabel =
  comparisonEnabled
    ? formatPerformancePeriodLabel(
        periods.previousFrom,
        periods.previousTo,
        true
      )
    : "";

  const currentTcw =
    performanceRecordsInRange(
      performanceState.tcwErrors,
      periods.currentFrom,
      periods.currentTo,
      selectedEngineer
    );

  const previousTcw =
  comparisonEnabled
    ? performanceRecordsInRange(
        performanceState.tcwErrors,
        periods.previousFrom,
        periods.previousTo,
        selectedEngineer
      )
    : [];

  const tcwChange =
    currentTcw.length -
    previousTcw.length;

  const tcwPercentChange =
    previousTcw.length
      ? Math.round(
          tcwChange /
          previousTcw.length *
          100
        )
      : null;

  if (!comparisonEnabled) {
  tcwContainer.innerHTML =
    renderExternalMetricCard(
      "Selected period",
      currentTcw.length
    );
} else {
  tcwContainer.innerHTML =
    renderExternalMetricCard(
      "Both date ranges",
      currentTcw.length +
        previousTcw.length
    ) +
    renderExternalMetricCard(
      previousPeriodShortLabel,
      previousTcw.length
    ) +
    renderExternalMetricCard(
      currentPeriodShortLabel,
      currentTcw.length
    ) +
    renderExternalMetricCard(
      "Difference",
      `${tcwChange >= 0 ? "+" : ""}${tcwChange}`,

      tcwPercentChange === null
        ? "No comparison baseline"
        : `${tcwPercentChange >= 0 ? "+" : ""}${tcwPercentChange}%`
    );
}

  const largestTcw =
    Math.max(
      1,
      currentTcw.length,
      previousTcw.length
    );

  const tcwChartItems =
  comparisonEnabled
    ? [
        {
          key: "previous",
          label:
            previousPeriodShortLabel,

          fullLabel:
            previousPeriodLabel,

          value:
            previousTcw.length
        },
        {
          key: "current",
          label:
            currentPeriodShortLabel,

          fullLabel:
            currentPeriodLabel,

          value:
            currentTcw.length
        }
      ]
    : [
        {
          key: "current",
          label:
            currentPeriodShortLabel,

          fullLabel:
            currentPeriodLabel,

          value:
            currentTcw.length
        }
      ];

tcwChart.innerHTML =
  tcwChartItems.map(item => `
    <button
      type="button"
      class="dashboard-mini-column"
      data-performance-period="${item.key}"
            aria-label="View TCW records for ${item.fullLabel}"
    >
      <strong>${item.value}</strong>

      <span class="dashboard-mini-bar-wrap">
        <span
          class="dashboard-mini-bar"
          style="
            height:${
              Math.max(
                3,
                item.value /
                largestTcw *
                100
              )
            }%;
          "
        ></span>
      </span>

      <span>${item.label}</span>
    </button>
  `).join("");

  const currentMorganRecords =
    performanceRecordsInRange(
      performanceState
        .morganLambertAudits,

      periods.currentFrom,
      periods.currentTo,
      selectedEngineer
    );

  const previousMorganRecords =
  comparisonEnabled
    ? performanceRecordsInRange(
        performanceState
          .morganLambertAudits,

        periods.previousFrom,
        periods.previousTo,
        selectedEngineer
      )
    : [];

  const currentMorgan =
    getMorganMetrics(
      currentMorganRecords
    );

  const previousMorgan =
    getMorganMetrics(
      previousMorganRecords
    );

  morganContainer.innerHTML =
    renderExternalMetricCard(
      "Audits",
      currentMorgan.total
    ) +
    renderExternalMetricCard(
      "PASS",
      currentMorgan.passes
    ) +
    renderExternalMetricCard(
      "FAIL",
      currentMorgan.fails
    ) +
    renderExternalMetricCard(
      "PASS rate",
      `${currentMorgan.passRate}%`
    ) +
    renderExternalMetricCard(
      "Average score",
      `${currentMorgan.averageScore.toFixed(1)}%`
    );

 if (!comparisonEnabled) {
  morganComparison.innerHTML = `
    <div class="dashboard-morgan-summary">
      <div
        class="dashboard-morgan-period"
        role="button"
        tabindex="0"
        data-performance-period="current"
        aria-label="View Morgan and Lambert audits for ${escapeHtml(
          currentPeriodLabel
        )}"
      >
        <strong>
          ${escapeHtml(
            currentPeriodLabel
          )}
        </strong>

        <span>
          ${currentMorgan.total} audits •
          ${currentMorgan.passRate}% PASS •
          ${currentMorgan.averageScore.toFixed(1)}% average
        </span>
      </div>
    </div>
  `;
} else {
  morganComparison.innerHTML = `
    <div class="dashboard-morgan-summary">
      <div
        class="dashboard-morgan-period"
        role="button"
        tabindex="0"
        data-performance-period="current"
        aria-label="View Morgan and Lambert audits for ${escapeHtml(
          currentPeriodLabel
        )}"
      >
        <strong>
          ${escapeHtml(
            currentPeriodLabel
          )}
        </strong>

        <span>
          ${currentMorgan.total} audits •
          ${currentMorgan.passRate}% PASS •
          ${currentMorgan.averageScore.toFixed(1)}% average
        </span>
      </div>

      <div
        class="dashboard-morgan-period"
        role="button"
        tabindex="0"
        data-performance-period="previous"
        aria-label="View Morgan and Lambert audits for ${escapeHtml(
          previousPeriodLabel
        )}"
      >
        <strong>
          ${escapeHtml(
            previousPeriodLabel
          )}
        </strong>

        <span>
          ${previousMorgan.total} audits •
          ${previousMorgan.passRate}% PASS •
          ${previousMorgan.averageScore.toFixed(1)}% average
        </span>
      </div>
    </div>
  `;
}

  addPerformanceDrilldownHandlers(
    tcwChart,
    "tcw",
    currentTcw,
    previousTcw,
    periods
  );

  addPerformanceDrilldownHandlers(
    morganComparison,
    "morgan",
    currentMorganRecords,
    previousMorganRecords,
    periods
  );
}


function renderExternalPerformanceMetrics(
  periods
) {
  renderPerformancePanels(
    periods,
    {
      tcwMetricsId:
        "dashboardTcwMetrics",

      tcwChartId:
        "dashboardTcwChart",

      morganMetricsId:
        "dashboardMorganMetrics",

      morganComparisonId:
        "dashboardMorganComparison",

      showStatus: true
    }
  );
}


function renderAnalyticsExternalPerformanceMetrics(
  periods
) {
  renderPerformancePanels(
    periods,
    {
      tcwMetricsId:
        "analyticsTcwMetrics",

      tcwChartId:
        "analyticsTcwChart",

      morganMetricsId:
        "analyticsMorganMetrics",

      morganComparisonId:
        "analyticsMorganComparison"
    }
  );
}

function openDashboardDateModal() {
  const periods =
    getExecutiveDashboardPeriods();

  if (!periods) {
    alert(
      "A valid dashboard date range could not be found."
    );

    return;
  }

  el("dashboardCurrentFrom").value =
    periods.currentFrom;

  el("dashboardCurrentTo").value =
    periods.currentTo;

  el("dashboardPreviousFrom").value =
    periods.previousFrom;

  el("dashboardPreviousTo").value =
  periods.previousTo;

const comparisonCheckbox =
  el("dashboardComparisonEnabled");

if (comparisonCheckbox) {
  comparisonCheckbox.checked =
    dashboardDateState
      .comparisonEnabled !== false;
}

updateDashboardComparisonFields();

el("dashboardDateError")
    ?.classList.add("hidden");

  el("dashboardDateModal")
    ?.classList.remove("hidden");
}


function updateDashboardComparisonFields() {
  const enabled =
    el("dashboardComparisonEnabled")
      ?.checked !== false;

  el("dashboardComparisonFields")
    ?.classList.toggle(
      "hidden",
      !enabled
    );
}

function closeDashboardDateModal() {
  el("dashboardDateModal")
    ?.classList.add("hidden");

  el("dashboardDateError")
    ?.classList.add("hidden");
}


function showDashboardDateError(
  message
) {
  const error =
    el("dashboardDateError");

  if (!error) return;

  error.textContent =
    message;

  error.classList.remove(
    "hidden"
  );
}


function applyDashboardCustomDates() {
  const currentFrom =
    el("dashboardCurrentFrom")
      ?.value || "";

  const currentTo =
    el("dashboardCurrentTo")
      ?.value || "";

  const previousFrom =
    el("dashboardPreviousFrom")
      ?.value || "";

  const previousTo =
  el("dashboardPreviousTo")
    ?.value || "";

const comparisonEnabled =
  el("dashboardComparisonEnabled")
    ?.checked !== false;

if (
  !currentFrom ||
  !currentTo
) {
  showDashboardDateError(
    "Complete both current-period date fields."
  );

  return;
}

if (
  comparisonEnabled &&
  (
    !previousFrom ||
    !previousTo
  )
) {
  showDashboardDateError(
    "Complete both comparison-period date fields."
  );

  return;
}

  if (
    currentFrom > currentTo
  ) {
    showDashboardDateError(
      "The current-period From date must be before its To date."
    );

    return;
  }

  if (
  comparisonEnabled &&
  previousFrom > previousTo
) {
    showDashboardDateError(
      "The comparison-period From date must be before its To date."
    );

    return;
  }

  dashboardDateState.currentFrom =
    currentFrom;

  dashboardDateState.currentTo =
    currentTo;

  dashboardDateState.previousFrom =
    previousFrom;

  dashboardDateState.previousTo =
  previousTo;

dashboardDateState
  .comparisonEnabled =
    comparisonEnabled;

saveDashboardDateState();

  document
    .querySelectorAll(
      "[data-dashboard-period]"
    )
    .forEach(button =>
      button.classList.remove(
        "dashboard-period-active"
      )
    );

  closeDashboardDateModal();

  renderExecutiveDashboard();
}
function initExecutiveDashboard() {
  document
    .querySelectorAll(
      "[data-dashboard-period]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          applyExecutiveDashboardPeriod(
            button.dataset
              .dashboardPeriod
          );
        }
      );
    });

    el("dashboardManagementReportBtn")
    ?.addEventListener(
      "click",
      () => {
        openManagementReport({
          dateSource:
            "dashboard"
        });
      }
    );

  el("dashboardPeriodLabel")
    ?.addEventListener(
      "click",
      openDashboardDateModal
    );

  el("dashboardDateCloseBtn")
    ?.addEventListener(
      "click",
      closeDashboardDateModal
    );

  el("dashboardDateCancelBtn")
    ?.addEventListener(
      "click",
      closeDashboardDateModal
    );

  el("dashboardComparisonEnabled")
  ?.addEventListener(
    "change",
    updateDashboardComparisonFields
  );

el("dashboardDateApplyBtn")
  ?.addEventListener(
    "click",
    applyDashboardCustomDates
  );

  el("dashboardDateModal")
    ?.addEventListener(
      "click",
      event => {
        if (
          event.target ===
          el("dashboardDateModal")
        ) {
          closeDashboardDateModal();
        }
      }
    );

  el("dashboardViewAllAlertsBtn")
    ?.addEventListener(
      "click",
      () => {
        setTab("analytics");

        setTimeout(() => {
          el("analyticsAlertsCard")
            ?.scrollIntoView({
              behavior: "smooth",
              block: "start"
            });
        }, 50);
      }
    );
}

function getExecutiveDashboardPeriods() {
  const hasDashboardDates =
    dashboardDateState.currentFrom &&
    dashboardDateState.currentTo &&
    dashboardDateState.previousFrom &&
    dashboardDateState.previousTo;

  if (hasDashboardDates) {
    return {
  currentFrom:
    dashboardDateState.currentFrom,

  currentTo:
    dashboardDateState.currentTo,

  previousFrom:
    dashboardDateState.previousFrom,

  previousTo:
    dashboardDateState.previousTo,

  comparisonEnabled:
    dashboardDateState
      .comparisonEnabled !== false
};
  }

  /*
    Use the Analytics dates once as the initial
    dashboard values. After that, Dashboard dates
    are stored and managed independently.
  */
  const analyticsPeriods =
    getAnalyticsComparisonPeriods();

  if (!analyticsPeriods) {
    return null;
  }

  dashboardDateState.currentFrom =
    analyticsPeriods.currentFrom;

  dashboardDateState.currentTo =
    analyticsPeriods.currentTo;

  dashboardDateState.previousFrom =
    analyticsPeriods.previousFrom;

  dashboardDateState.previousTo =
    analyticsPeriods.previousTo;

  saveDashboardDateState();

  return {
    ...dashboardDateState
  };
}


function getPreviousEquivalentDashboardPeriod(
  currentFrom,
  currentTo
) {
  const fromDate =
    parseAnalyticsDate(
      currentFrom
    );

  const toDate =
    parseAnalyticsDate(
      currentTo
    );

  if (
    !fromDate ||
    !toDate ||
    fromDate > toDate
  ) {
    return null;
  }

  const millisecondsPerDay =
    24 * 60 * 60 * 1000;

  const durationDays =
    Math.round(
      (
        toDate.getTime() -
        fromDate.getTime()
      ) /
      millisecondsPerDay
    ) + 1;

  const previousTo =
    new Date(fromDate);

  previousTo.setDate(
    previousTo.getDate() - 1
  );

  const previousFrom =
    new Date(previousTo);

  previousFrom.setDate(
    previousFrom.getDate() -
    durationDays +
    1
  );

  return {
    previousFrom:
      formatAnalyticsInputDate(
        previousFrom
      ),

    previousTo:
      formatAnalyticsInputDate(
        previousTo
      )
  };
}


function applyExecutiveDashboardPeriod(
  period
) {
  const dates =
    getManagementReportPresetDates(
      period
    );

  if (!dates) return;

  const currentFrom =
    formatAnalyticsInputDate(
      dates.from
    );

  const currentTo =
    formatAnalyticsInputDate(
      dates.to
    );

  const previous =
    getPreviousEquivalentDashboardPeriod(
      currentFrom,
      currentTo
    );

  if (!previous) return;

  dashboardDateState.currentFrom =
    currentFrom;

  dashboardDateState.currentTo =
    currentTo;

  dashboardDateState.previousFrom =
    previous.previousFrom;

  dashboardDateState.previousTo =
    previous.previousTo;

  saveDashboardDateState();

  document
    .querySelectorAll(
      "[data-dashboard-period]"
    )
    .forEach(button => {
      button.classList.toggle(
        "dashboard-period-active",
        button.dataset
          .dashboardPeriod === period
      );
    });

  renderExecutiveDashboard();
}

function getExecutiveDashboardMetrics(
  selection
) {
  const audits =
    selection.audits || [];

  const defects =
    selection.defects || [];

  const passes =
    audits.filter(audit =>
      isPassingOutcome(
        audit.outcome
      )
    ).length;

  const passRate =
    audits.length
      ? Math.round(
          passes /
          audits.length *
          100
        )
      : 0;

  const defectsPerAudit =
    audits.length
      ? defects.length /
        audits.length
      : 0;

  const severityCounts = {
    ID: 0,
    AR: 0,
    NCS: 0,
    Advisory: 0
  };

  defects.forEach(defect => {
    const severity =
      getAnalyticsSeverityLabel(
        defect.severity
      );

    if (
      Object.prototype.hasOwnProperty.call(
        severityCounts,
        severity
      )
    ) {
      severityCounts[severity]++;
    }
  });

  const titleCounts = countBy(
    defects,
    defect =>
      defect.title ||
      "Untitled defect"
  );

  const repeatOccurrences =
    Object.values(titleCounts)
      .reduce(
        (total, count) =>
          total +
          Math.max(0, count - 1),
        0
      );

  return {
    audits,
    defects,
    passes,
    failures:
      audits.length - passes,
    passRate,
    defectsPerAudit,
    severityCounts,
    titleCounts,
    repeatOccurrences
  };
}

function getDashboardChange(
  currentValue,
  previousValue,
  options = {}
) {
  const {
    suffix = "",
    decimals = 0,
    lowerIsBetter = false,
    percentagePoints = false
  } = options;

  const current =
    Number(currentValue) || 0;

  const previous =
    Number(previousValue) || 0;

  const difference =
    current - previous;

  if (
    Math.abs(difference) <
    Math.pow(10, -decimals) / 2
  ) {
    return {
      className:
        "dashboard-change-neutral",
      text: "No change"
    };
  }

  const improved =
    lowerIsBetter
      ? difference < 0
      : difference > 0;

  const formattedDifference =
    Math.abs(difference).toFixed(
      decimals
    );

  return {
    className: improved
      ? "dashboard-change-good"
      : "dashboard-change-bad",

    text:
      `${difference > 0 ? "↑" : "↓"} ` +
      `${formattedDifference}` +
      `${percentagePoints
        ? " points"
        : suffix}`
  };
}

function getDashboardEngineerRankings(
  audits,
  defects
) {
  const engineerData =
    getEngineerPerformanceData(
      audits
    );

  const enriched =
    engineerData.map(engineer => {
      const engineerDefects =
        defects.filter(defect =>
          normalizeEngineer(
            defect.engineer
          ) ===
          normalizeEngineer(
            engineer.engineer
          )
        );

      return {
        ...engineer,

        totalDefects:
          engineerDefects.length,

        defectsPerAudit:
          engineer.total
            ? engineerDefects.length /
              engineer.total
            : 0
      };
    });

  const strongest =
    enriched
      .slice()
      .sort((a, b) => {
        if (
          b.passRate !==
          a.passRate
        ) {
          return (
            b.passRate -
            a.passRate
          );
        }

        if (b.total !== a.total) {
          return b.total - a.total;
        }

        if (
          a.defectsPerAudit !==
          b.defectsPerAudit
        ) {
          return (
            a.defectsPerAudit -
            b.defectsPerAudit
          );
        }

        return a.engineer.localeCompare(
          b.engineer
        );
      })[0] || null;

  /*
    Review ranking prioritises the lowest
    PASS rate, then the highest defects per
    audit and then the largest audit sample.
  */
  const review =
    enriched
      .filter(engineer =>
        !strongest ||
        normalizeEngineer(
          engineer.engineer
        ) !==
        normalizeEngineer(
          strongest.engineer
        )
      )
      .sort((a, b) => {
        if (
          a.passRate !==
          b.passRate
        ) {
          return (
            a.passRate -
            b.passRate
          );
        }

        if (
          b.defectsPerAudit !==
          a.defectsPerAudit
        ) {
          return (
            b.defectsPerAudit -
            a.defectsPerAudit
          );
        }

        return b.total - a.total;
      })[0] || null;

  return {
    strongest,
    review
  };
}

function renderExecutiveDashboard() {
  const dashboard =
    el("tabDashboard");

  if (!dashboard) return;

    const periods =
    getExecutiveDashboardPeriods();

  const periodLabel =
    el("dashboardPeriodLabel");

  if (!periods) {
    if (periodLabel) {
      periodLabel.textContent =
                "Select the Executive Dashboard date ranges.";
    }

        [
      "dashboardKpis",
      "dashboardRiskKpis",
      "dashboardTopIssues",
      "dashboardAlerts",
      "dashboardEngineerSnapshot",
      "dashboardMonthlyTrend"
    ].forEach(id => {
      const container = el(id);

      if (container) {
        container.innerHTML = `
          <div class="dashboard-empty">
                        A valid dashboard date range is required.
          </div>
        `;
      }
    });
    renderExternalPerformanceMetrics(
      null
    );
    return;
  }

  const comparisonEnabled =
  periods.comparisonEnabled !== false;

const currentSelection =
  getAnalyticsSelectionForRange(
    periods.currentFrom,
    periods.currentTo
  );

const previousSelection =
  comparisonEnabled
    ? getAnalyticsSelectionForRange(
        periods.previousFrom,
        periods.previousTo
      )
    : {
        audits: [],
        defects: []
      };

  const current =
    getExecutiveDashboardMetrics(
      currentSelection
    );

  const previous =
    getExecutiveDashboardMetrics(
      previousSelection
    );

  if (periodLabel) {
   periodLabel.textContent =
  comparisonEnabled
    ? `${formatDate(
        periods.currentFrom
      )}–${formatDate(
        periods.currentTo
      )} compared with ${formatDate(
        periods.previousFrom
      )}–${formatDate(
        periods.previousTo
      )}`
    : `${formatDate(
        periods.currentFrom
      )}–${formatDate(
        periods.currentTo
      )}`;
  }

  const auditChange =
    getDashboardChange(
      current.audits.length,
      previous.audits.length
    );

  const passRateChange =
    getDashboardChange(
      current.passRate,
      previous.passRate,
      {
        percentagePoints: true
      }
    );

  const defectChange =
    getDashboardChange(
      current.defects.length,
      previous.defects.length,
      {
        lowerIsBetter: true
      }
    );

  const averageChange =
    getDashboardChange(
      current.defectsPerAudit,
      previous.defectsPerAudit,
      {
        decimals: 2,
        lowerIsBetter: true
      }
    );

  const kpis = [
    {
      label: "Audits",
      value: current.audits.length,
      change: auditChange
    },
    {
      label: "PASS rate",
      value: `${current.passRate}%`,
      change: passRateChange
    },
    {
      label: "Defects",
      value: current.defects.length,
      change: defectChange
    },
    {
      label: "Defects / audit",
      value:
        current.defectsPerAudit
          .toFixed(2),
      change: averageChange
    }
  ];

  el("dashboardKpis").innerHTML =
    kpis
      .map(item => `
        <div class="dashboard-kpi-card">
          <span class="dashboard-kpi-label">
            ${escapeHtml(item.label)}
          </span>

          <strong>
            ${escapeHtml(item.value)}
          </strong>

         ${
  comparisonEnabled
    ? `
        <span
          class="
            dashboard-kpi-change
            ${item.change.className}
          "
        >
          ${escapeHtml(
            item.change.text
          )}

          <small>
            vs comparison period
          </small>
        </span>
      `
    : ""
}
        </div>
      `)
      .join("");

  const riskItems = [
    {
      label: "ID findings",
      value:
        current.severityCounts.ID,
      tone:
        current.severityCounts.ID
          ? "danger"
          : "good"
    },
    {
      label: "AR findings",
      value:
        current.severityCounts.AR,
      tone:
        current.severityCounts.AR
          ? "warning"
          : "good"
    },
    {
      label: "Repeat occurrences",
      value:
        current.repeatOccurrences,
      tone:
        current.repeatOccurrences
          ? "warning"
          : "good"
    },
    {
      label: "FAIL audits",
      value: current.failures,
      tone:
        current.failures
          ? "danger"
          : "good"
    }
  ];

  el("dashboardRiskKpis").innerHTML =
    riskItems
      .map(item => `
        <div
          class="
            dashboard-risk-card
            dashboard-risk-${item.tone}
          "
        >
          <strong>${item.value}</strong>
          <span>${escapeHtml(item.label)}</span>
        </div>
      `)
      .join("");

  const topIssues = sortedCounts(
    current.titleCounts,
    3
  );

  const topIssuesContainer =
    el("dashboardTopIssues");

  if (topIssues.length) {
    topIssuesContainer.innerHTML =
      topIssues
        .map(
          ([title, count], index) => `
            <button
              type="button"
              class="dashboard-issue-row"
              data-dashboard-issue="${escapeHtml(
                title
              )}"
            >
              <span class="dashboard-rank">
                ${index + 1}
              </span>

              <span class="dashboard-issue-name">
                ${escapeHtml(title)}
              </span>

              <strong>${count}</strong>

              <span class="dashboard-row-arrow">
                →
              </span>
            </button>
          `
        )
        .join("");

    topIssuesContainer
      .querySelectorAll(
        "[data-dashboard-issue]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            openDefectDrilldown(
              "title",
              button.dataset
                .dashboardIssue
            );
          }
        );
      });
  } else {
    topIssuesContainer.innerHTML = `
      <div class="dashboard-empty">
        No defects were recorded in this period.
      </div>
    `;
  }

  const alerts =
  comparisonEnabled
    ? buildAnalyticsTrendAlerts(
        getAnalyticsTrendMetrics(
          currentSelection
        ),
        getAnalyticsTrendMetrics(
          previousSelection
        )
      ).slice(0, 3)
    : [];

const alertsContainer =
  el("dashboardAlerts");

const alertsPanel =
  alertsContainer?.closest(
    ".dashboard-panel"
  );

if (!comparisonEnabled) {
  alertsPanel?.classList.add(
    "hidden"
  );
} else {
  alertsPanel?.classList.remove(
    "hidden"
  );
}

  if (alerts.length) {
    alertsContainer.innerHTML =
      alerts
        .map(
          (alert, index) => `
            <button
              type="button"
              class="
                dashboard-alert-row
                dashboard-alert-${alert.tone}
              "
              data-dashboard-alert="${index}"
            >
              <span class="dashboard-alert-dot"></span>

              <span>
                <strong>
                  ${escapeHtml(
                    alert.title
                  )}
                </strong>

                <small>
                  ${escapeHtml(
                    alert.message
                  )}
                </small>
              </span>

              <span class="dashboard-row-arrow">
                →
              </span>
            </button>
          `
        )
        .join("");

    alertsContainer
      .querySelectorAll(
        "[data-dashboard-alert]"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            const alert =
              alerts[
                Number(
                  button.dataset
                    .dashboardAlert
                )
              ];

            if (!alert) return;

            openAnalyticsTrendAlertDrilldown(
              alert,
              currentSelection,
              periods
            );
          }
        );
      });
  } else {
    alertsContainer.innerHTML = `
      <div class="dashboard-good-message">
        <strong>
          No significant changes identified
        </strong>

        <span>
          No alert thresholds were reached.
        </span>
      </div>
    `;
  }

  const rankings =
    getDashboardEngineerRankings(
      current.audits,
      current.defects
    );

  const buildEngineerCard = (
    engineer,
    type
  ) => {
    if (!engineer) {
      return `
        <div class="dashboard-engineer-card">
          <span class="dashboard-engineer-type">
            ${type}
          </span>

          <strong>
            Not enough data
          </strong>
        </div>
      `;
    }

    return `
      <button
        type="button"
        class="dashboard-engineer-card"
        data-dashboard-engineer="${escapeHtml(
          engineer.engineer
        )}"
      >
        <span class="dashboard-engineer-type">
          ${type}
        </span>

        <strong>
          ${escapeHtml(
            engineer.engineer
          )}
        </strong>

        <span>
          ${engineer.passRate}% PASS
          &nbsp;•&nbsp;
          ${engineer.total} audit${
            engineer.total === 1
              ? ""
              : "s"
          }
          &nbsp;•&nbsp;
          ${engineer.defectsPerAudit
            .toFixed(2)}
          defects / audit
        </span>
      </button>
    `;
  };

  el(
    "dashboardEngineerSnapshot"
  ).innerHTML =
    buildEngineerCard(
      rankings.strongest,
      "Strongest performance"
    ) +
    buildEngineerCard(
      rankings.review,
      "Results to review"
    );

  el("dashboardEngineerSnapshot")
    .querySelectorAll(
      "[data-dashboard-engineer]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          openEngineerAuditDrilldown(
            button.dataset
              .dashboardEngineer,
            "all"
          );
        }
      );
    });

     renderExecutiveDashboardMonthlyTrend(
    current.audits,
    periods.currentTo
  );

 renderExternalPerformanceMetrics(
  periods
);
}

function renderExecutiveDashboardMonthlyTrend(
  selectedAudits,
  dashboardTo
) {
  const container =
    el("dashboardMonthlyTrend");

  if (!container) return;

    const toDate =
    parseAnalyticsDate(
      dashboardTo
    ) ||
    new Date();

  const months = [];

  for (let offset = 5; offset >= 0; offset--) {
    const date = new Date(
      toDate.getFullYear(),
      toDate.getMonth() - offset,
      1
    );

    const key =
      `${date.getFullYear()}-` +
      `${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

    months.push({
      key,
      label:
        date.toLocaleDateString(
          "en-GB",
          {
            month: "short",
            year: "2-digit"
          }
        ),
      total: 0,
      pass: 0
    });
  }

  const monthMap = new Map(
    months.map(month => [
      month.key,
      month
    ])
  );

  selectedAudits.forEach(audit => {
    const month =
      monthMap.get(
        String(
          audit.date || ""
        ).slice(0, 7)
      );

    if (!month) return;

    month.total++;

    if (
      isPassingOutcome(
        audit.outcome
      )
    ) {
      month.pass++;
    }
  });

  const maximumAudits =
    Math.max(
      1,
      ...months.map(
        month => month.total
      )
    );

  container.innerHTML = `
    <div class="dashboard-month-list">
      ${months
        .map(month => {
          const passRate =
            month.total
              ? Math.round(
                  month.pass /
                  month.total *
                  100
                )
              : 0;

          const width =
            month.total /
            maximumAudits *
            100;

          return `
            <div class="dashboard-month-row">
              <span>
                ${escapeHtml(
                  month.label
                )}
              </span>

              <div class="dashboard-month-track">
                <div
                  class="dashboard-month-fill"
                  style="width:${width}%"
                ></div>
              </div>

              <strong>
                ${month.total}
              </strong>

              <small>
                ${passRate}% PASS
              </small>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function setHealthSafetyTab(
  name
) {
  const validTabs = [
    "overview",
    "audits",
    "calibration",
    "warnings",
    "actions"
  ];

  const selected =
    validTabs.includes(name)
      ? name
      : "overview";

  document
    .querySelectorAll(
      ".hs-subtab"
    )
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.hsTab ===
          selected
      );
    });

  const panelMap = {
    overview:
      "hsPanelOverview",

    audits:
      "hsPanelAudits",

    calibration:
      "hsPanelCalibration",

    warnings:
      "hsPanelWarnings",

    actions:
      "hsPanelActions"
  };

   Object.entries(
    panelMap
  ).forEach(
    ([key, id]) => {
      el(id)?.classList.toggle(
        "active",
        key === selected
      );
    }
  );

  if (
    selected === "overview" ||
    selected === "calibration"
  ) {
    renderHsCalibration();
  }
  if (
  selected === "audits" &&
  typeof renderHsAuditRegister ===
    "function"
) {
  renderHsAuditRegister();
}
  if (
  name === "warnings" &&
  typeof renderHsWarningNotices ===
    "function"
) {
  renderHsWarningNotices();
}if (
  name === "warnings" &&
  typeof renderHsWarningNotices ===
    "function"
) {
  renderHsWarningNotices();
}
}

async function saveHsCalibrationPendingUpdatesToCloud() {
  saveHsCalibrationPendingUpdatesLocal();


  if (!cloudSignedIn()) {
    return {
      saved: false,
      reason: "not-signed-in"
    };
  }


  try {
    const user =
      getUser();


    await hsCalibrationMetaRef(
      user.uid
    ).set(
      {
        pendingExcelUpdates:
          hsCalibrationPendingUpdates,

        pendingExcelUpdatesUpdatedAt:
          firebase
            .firestore
            .FieldValue
            .serverTimestamp()
      },
      {
        merge: true
      }
    );


    return {
      saved: true
    };
  } catch (error) {
    console.error(
      "Calibration pending updates could not be synced:",
      error
    );


    return {
      saved: false,
      reason: "error",
      error
    };
  }
}


async function loadHsCalibrationPendingUpdatesFromCloud() {
  if (!cloudSignedIn()) {
    return false;
  }


  try {
    const user =
      getUser();


    const snapshot =
      await hsCalibrationMetaRef(
        user.uid
      ).get();


    if (!snapshot.exists) {
      return false;
    }


    const data =
      snapshot.data() || {};


    if (
      !Array.isArray(
        data.pendingExcelUpdates
      )
    ) {
      return false;
    }


    hsCalibrationPendingUpdates =
      data.pendingExcelUpdates;


    saveHsCalibrationPendingUpdatesLocal();


    renderHsCalibrationPendingUpdates();


    renderHsCalibration();


    return true;
  } catch (error) {
    console.error(
      "Calibration pending updates could not be loaded:",
      error
    );


    return false;
  }
}
async function loadHsCalibrationAlertSettingsFromCloud() {
  if (!cloudSignedIn()) {
    return false;
  }

  try {
    const user =
      getUser();

    const snapshot =
      await hsCalibrationMetaRef(
        user.uid
      ).get();

    if (!snapshot.exists) {
      return false;
    }

    const data =
      snapshot.data() || {};

    const cloudSettings =
      data.alertSettings;

    if (
      !cloudSettings ||
      typeof cloudSettings !==
        "object"
    ) {
      return false;
    }

    hsCalibrationAlertSettings.enabled =
      cloudSettings.enabled === true;

    hsCalibrationAlertSettings.recipient =
      String(
        cloudSettings.recipient ||
        ""
      );

    hsCalibrationAlertSettings.cc =
      String(
        cloudSettings.cc ||
        ""
      );

    hsCalibrationAlertSettings
      .ccAssignedEngineer =
        cloudSettings
          .ccAssignedEngineer ===
        true;

    hsCalibrationAlertSettings
      .dailyCheckTime =
        String(
          cloudSettings
            .dailyCheckTime ||
          "08:00"
        );

    /*
      These remain fixed regardless of
      what may be stored in Firestore.
    */
    hsCalibrationAlertSettings.thresholds =
      [
        30,
        14,
        7,
        0
      ];

    saveLocalHsCalibrationAlertSettings();

    return true;
  } catch (error) {
    console.error(
      "Calibration alert settings could not be loaded:",
      error
    );

    return false;
  }
}


async function saveHsCalibrationAlertSettingsToCloud() {
  saveLocalHsCalibrationAlertSettings();

  if (!cloudSignedIn()) {
    return {
      saved: false,
      reason: "not-signed-in"
    };
  }

  try {
    const user =
      getUser();

    await hsCalibrationMetaRef(
      user.uid
    ).set(
      {
        alertThresholds: [
          30,
          14,
          7,
          0
        ],

        alertSettings: {
          enabled:
            hsCalibrationAlertSettings
              .enabled,

          recipient:
            hsCalibrationAlertSettings
              .recipient,

          cc:
            hsCalibrationAlertSettings
              .cc,

          ccAssignedEngineer:
            hsCalibrationAlertSettings
              .ccAssignedEngineer,

          dailyCheckTime:
            hsCalibrationAlertSettings
              .dailyCheckTime,

          thresholds: [
            30,
            14,
            7,
            0
          ],

          updatedAt:
            firebase
              .firestore
              .FieldValue
              .serverTimestamp()
        }
      },
      {
        merge: true
      }
    );

    return {
      saved: true
    };
  } catch (error) {
    console.error(
      "Calibration alert settings could not be saved:",
      error
    );

    return {
      saved: false,
      reason: "error",
      error
    };
  }
}
function setHsCalibrationCloudStatus(
  message,
  state = ""
) {
  const element =
    el(
      "hsCalibrationCloudStatus"
    );

  if (!element) return;

  element.textContent =
    message;

  element.classList.remove(
    "hs-cloud-good",
    "hs-cloud-warning",
    "hs-cloud-error"
  );

  if (state === "good") {
    element.classList.add(
      "hs-cloud-good"
    );
  }

  if (state === "warning") {
    element.classList.add(
      "hs-cloud-warning"
    );
  }

  if (state === "error") {
    element.classList.add(
      "hs-cloud-error"
    );
  }
}

async function loadHsCalibrationFromCloud() {
  if (!cloudSignedIn()) {
    return false;
  }

  try {
    const user = getUser();

    setHsCalibrationCloudStatus(
      "Loading calibration register from Firebase…"
    );

    const [
      calibrationSnapshot,
      metaSnapshot
    ] = await Promise.all([
      hsCalibrationCloudCol(
        user.uid
      ).get(),

      hsCalibrationMetaRef(
        user.uid
      ).get()
    ]);

    /*
      If Firebase already contains a
      calibration register, Firebase is the
      source for this device.
    */
    if (!calibrationSnapshot.empty) {
      hsCalibrationState.records =
        calibrationSnapshot.docs.map(
          document => {
            const data =
              document.data() || {};

            /*
              Do not keep Firestore's
              server timestamp in localStorage.
            */
            const {
              updatedAt,
              ...record
            } = data;

            return {
              ...record,

              id:
                record.id ||
                document.id
            };
          }
        );
    } else if (
      hsCalibrationState.records
        ?.length
    ) {
      /*
        Firebase is empty but this device
        already has calibration data.

        Upload the local register instead
        of deleting it.
      */
      const result =
        await syncHsCalibrationToCloud();

      return !!result?.synced;
    }

    /*
      Restore the workbook information
      stored in the calibration settings
      document.
    */
    if (metaSnapshot.exists) {
      const data =
        metaSnapshot.data() || {};

      hsCalibrationState.importMeta = {
        fileName:
          data.sourceFile ||
          hsCalibrationState
            .importMeta
            ?.fileName ||
          "",

        sheetName:
          data.sourceSheet ||
          hsCalibrationState
            .importMeta
            ?.sheetName ||
          "",

        importedAt:
          data.importedAt ||
          hsCalibrationState
            .importMeta
            ?.importedAt ||
          null,

        recordCount:
          Number.isFinite(
            Number(data.recordCount)
          )
            ? Number(
                data.recordCount
              )
            : hsCalibrationState
                .records
                .length
      };
    }

    saveHsCalibrationState();

    renderHsCalibration();

    setHsCalibrationCloudStatus(
      `Cloud loaded • ${
        hsCalibrationState.records.length
      } analyser${
        hsCalibrationState.records.length ===
        1
          ? ""
          : "s"
      }.`,
      "good"
    );

    return true;
  } catch (error) {
    console.error(
      "Calibration register could not be loaded from Firebase:",
      error
    );

    setHsCalibrationCloudStatus(
      "Firebase load failed • Local calibration data is still safe.",
      "error"
    );

    return false;
  }
}
async function syncHsCalibrationToCloud() {
  if (!cloudSignedIn()) {
    setHsCalibrationCloudStatus(
      "Local only • Log in to sync calibration data to Firebase.",
      "warning"
    );

    return {
      synced: false,
      reason: "not-signed-in"
    };
  }

  const user =
    getUser();

  const records =
    hsCalibrationState.records ||
    [];

  setHsCalibrationCloudStatus(
    "Syncing calibration register to Firebase…"
  );

  try {
    const collection =
      hsCalibrationCloudCol(
        user.uid
      );

    /*
      Calibration is a CURRENT register,
      not a historical archive.

      Therefore Firestore should mirror
      exactly what is currently stored
      in the app.
    */
    const existingSnapshot =
      await collection.get();

    const existingIds =
      new Set(
        existingSnapshot.docs.map(
          doc => doc.id
        )
      );

    const currentIds =
      new Set(
        records.map(record =>
          String(
            record.id ||
            record.analyserCode
          )
        )
      );

    const operations = [];

    /*
      Remove cloud records which are no
      longer present in the latest workbook.
    */
    existingSnapshot.docs.forEach(
      doc => {
        if (
          !currentIds.has(
            doc.id
          )
        ) {
          operations.push({
            type: "delete",
            ref: doc.ref
          });
        }
      }
    );

    /*
      Add/update every current analyser.
    */
    records.forEach(record => {
      const documentId =
        String(
          record.id ||
          `hs-calibration-${normalizePerformanceSourceName(
            record.analyserCode
          )}`
        );

      const ref =
        collection.doc(
          documentId
        );

      operations.push({
        type: "set",
        ref,
        data: {
          id:
            documentId,

          analyserCode:
            record.analyserCode ||
            "",

          engineer:
            record.engineer ||
            "",

          model:
            record.model ||
            "",

          email:
            record.email ||
            "",

          dueDate:
            record.dueDate ||
            "",

          sourceFile:
            record.sourceFile ||
            "",

          sourceSheet:
            record.sourceSheet ||
            "",

          updatedAt:
            firebase
              .firestore
              .FieldValue
              .serverTimestamp()
        }
      });
    });

    /*
      Firestore batches allow hundreds of
      operations, but split into smaller
      groups so this stays safe even if
      the register grows substantially.
    */
    const batchSize = 400;

    for (
      let index = 0;
      index < operations.length;
      index += batchSize
    ) {
      const group =
        operations.slice(
          index,
          index + batchSize
        );

      const batch =
        cloudDb.batch();

      group.forEach(operation => {
        if (
          operation.type ===
          "delete"
        ) {
          batch.delete(
            operation.ref
          );
        } else {
          batch.set(
            operation.ref,
            operation.data,
            {
              merge: true
            }
          );
        }
      });

      await batch.commit();
    }

    /*
      Store information about the latest
      calibration register separately.
    */
    await hsCalibrationMetaRef(
      user.uid
    ).set(
      {
        recordCount:
          records.length,

        sourceFile:
          hsCalibrationState
            .importMeta
            ?.fileName ||
          "",

        sourceSheet:
          hsCalibrationState
            .importMeta
            ?.sheetName ||
          "",

        importedAt:
          hsCalibrationState
            .importMeta
            ?.importedAt ||
          null,

        syncedAt:
          firebase
            .firestore
            .FieldValue
            .serverTimestamp(),

        alertThresholds: [
          30,
          14,
          7,
          0
        ]
      },
      {
        merge: true
      }
    );

    setHsCalibrationCloudStatus(
      `Cloud synced • ${records.length} analyser${
        records.length === 1
          ? ""
          : "s"
      } stored in Firebase.`,
      "good"
    );

    return {
      synced: true,
      count:
        records.length
    };
  } catch (error) {
    console.error(
      "Calibration Firebase sync failed:",
      error
    );

    setHsCalibrationCloudStatus(
      "Firebase sync failed • Local calibration data is still safe.",
      "error"
    );

    return {
      synced: false,
      reason: "error",
      error
    };
  }
}


function loadHsCalibrationPopupHistory() {
  try {
    const parsed =
      JSON.parse(
        localStorage.getItem(
          HS_CALIBRATION_POPUP_HISTORY_KEY
        ) || "{}"
      );

    return parsed &&
      typeof parsed === "object"
      ? parsed
      : {};
  } catch {
    return {};
  }
}


function saveHsCalibrationPopupHistory(
  history
) {
  localStorage.setItem(
    HS_CALIBRATION_POPUP_HISTORY_KEY,
    JSON.stringify(
      history || {}
    )
  );
}


function getHsCalibrationPopupStage(
  days
) {
  if (
    days === null ||
    !Number.isFinite(days)
  ) {
    return null;
  }

  if (days < 0) {
    return {
      key: "expired",
      label: "Calibration expired",
      priority: 4
    };
  }

  if (days <= 7) {
    return {
      key: "7",
      label: "Due within 7 days",
      priority: 3
    };
  }

  if (days <= 14) {
    return {
      key: "14",
      label: "Due within 14 days",
      priority: 2
    };
  }

  if (days <= 30) {
    return {
      key: "30",
      label: "Due within 30 days",
      priority: 1
    };
  }

  return null;
}


function hsCalibrationPopupAlertKey(
  record,
  stage
) {
  return [
    record.analyserCode || record.id || "unknown",
    record.dueDate || "unknown-date",
    stage.key
  ].join("|");
}


function getPendingHsCalibrationPopupAlerts() {
  const history =
    loadHsCalibrationPopupHistory();

  return (
    hsCalibrationState.records ||
    []
  )
    .map(record => {
      const days =
        hsCalibrationDaysLeft(
          record.dueDate
        );

      const stage =
        getHsCalibrationPopupStage(
          days
        );

      if (!stage) {
        return null;
      }

      const alertKey =
        hsCalibrationPopupAlertKey(
          record,
          stage
        );

      if (history[alertKey]) {
        return null;
      }

      return {
        record,
        days,
        stage,
        alertKey
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (
        b.stage.priority !==
        a.stage.priority
      ) {
        return (
          b.stage.priority -
          a.stage.priority
        );
      }

      return a.days - b.days;
    });
}


function closeHsCalibrationStartupAlert() {
  el(
    "hsCalibrationStartupAlertBackdrop"
  )?.remove();
}


function acknowledgeHsCalibrationStartupAlerts(
  alerts
) {
  const history =
    loadHsCalibrationPopupHistory();

  const acknowledgedAt =
    new Date().toISOString();

  (alerts || []).forEach(
    alertItem => {
      history[
        alertItem.alertKey
      ] = {
        acknowledgedAt,

        analyserCode:
          alertItem.record
            .analyserCode ||
          "",

        dueDate:
          alertItem.record
            .dueDate ||
          "",

        stage:
          alertItem.stage.key
      };
    }
  );

  saveHsCalibrationPopupHistory(
    history
  );

  closeHsCalibrationStartupAlert();
}

async function shareHsCalibrationAlertEmail(
  alerts
) {
  if (!alerts?.length) {
    return;
  }

  const settings =
    typeof hsCalibrationAlertSettings !==
      "undefined"
      ? hsCalibrationAlertSettings
      : {
          recipient: "",
          cc: "",
          ccAssignedEngineer: false
        };


  /*
    PRIMARY RECIPIENT
  */
  const recipient =
    String(
      settings.recipient || ""
    ).trim();


  /*
    SAVED CC RECIPIENTS
  */
  const ccRecipients =
    String(
      settings.cc || ""
    )
      .split(",")
      .map(value =>
        value.trim()
      )
      .filter(Boolean);


  /*
    If enabled in Alert Settings,
    automatically add the assigned
    engineer email address for each
    analyser shown in this warning.
  */
  if (
    settings.ccAssignedEngineer
  ) {
    alerts.forEach(
      item => {
        const engineerEmail =
          String(
            item.record?.email ||
            ""
          ).trim();

        if (
          engineerEmail &&
          isValidHsAlertEmail(
            engineerEmail
          )
        ) {
          ccRecipients.push(
            engineerEmail
          );
        }
      }
    );
  }


  /*
    Remove duplicate CC addresses.

    Also avoid putting the primary
    recipient into CC as well.
  */
  const uniqueCcRecipients =
    Array.from(
      new Set(
        ccRecipients
          .map(email =>
            email.toLowerCase()
          )
          .filter(email =>
            email !==
            recipient.toLowerCase()
          )
      )
    );


  const expiredCount =
    alerts.filter(
      item =>
        item.stage.key ===
        "expired"
    ).length;


  /*
    EMAIL SUBJECT
  */
  let subject = "";

  if (expiredCount) {
    subject =
      "H&S Alert - Analyser Calibration Attention Required";
  } else if (
    alerts.length === 1
  ) {
    const alertItem =
      alerts[0];

    const analyser =
      alertItem.record
        ?.analyserCode ||
      "Analyser";

    if (
      alertItem.stage.key ===
      "30"
    ) {
      subject =
        `H&S Alert - ${analyser} Calibration Due Within 30 Days`;
    } else if (
      alertItem.stage.key ===
      "14"
    ) {
      subject =
        `H&S Alert - ${analyser} Calibration Due Within 14 Days`;
    } else if (
      alertItem.stage.key ===
      "7"
    ) {
      subject =
        `H&S Alert - ${analyser} Calibration Due Within 7 Days`;
    } else {
      subject =
        `H&S Alert - ${analyser} Calibration Reminder`;
    }
  } else {
    subject =
      `H&S Alert - ${alerts.length} Analyser Calibration Reminders`;
  }


  /*
    EMAIL BODY
  */
  const lines = [
    "Analyser Calibration Reminder",
    "",
    "The following analyser calibration item(s) require attention:",
    ""
  ];


  alerts.forEach(
    (item, index) => {
      const record =
        item.record;

      const days =
        item.days;

      let timing = "";

      if (days < 0) {
        const overdueDays =
          Math.abs(days);

        timing =
          `${overdueDays} day${
            overdueDays === 1
              ? ""
              : "s"
          } overdue`;
      } else if (
        days === 0
      ) {
        timing =
          "Calibration due today";
      } else {
        timing =
          `${days} day${
            days === 1
              ? ""
              : "s"
          } remaining`;
      }


      lines.push(
        `${index + 1}. ${record.analyserCode || "Unknown analyser"}`,
        `Model: ${record.model || "Not recorded"}`,
        `Assigned engineer: ${record.engineer || "Not assigned"}`,
        `Calibration due: ${formatDate(
          record.dueDate
        )}`,
        `Status: ${timing}`,
        ""
      );
    }
  );


  lines.push(
    "Please arrange calibration as required.",
    "",
    "Regards,"
  );


  const body =
    lines.join("\n");


  /*
    Build a genuine email draft.

    Unlike navigator.share(), mailto:
    populates the actual Outlook
    To / CC / Subject / Body fields.
  */
  const parameters = [];


  if (
    uniqueCcRecipients.length
  ) {
    parameters.push(
      `cc=${encodeURIComponent(
        uniqueCcRecipients.join(
          ","
        )
      )}`
    );
  }


  parameters.push(
    `subject=${encodeURIComponent(
      subject
    )}`
  );


  parameters.push(
    `body=${encodeURIComponent(
      body
    )}`
  );


  /*
  Open a proper Outlook compose window.

  This works much more reliably from
  inside CodePen than mailto:, because
  CodePen runs the app inside an iframe.
*/
const outlookParams = [];


if (recipient) {
  outlookParams.push(
    `to=${encodeURIComponent(
      recipient
    )}`
  );
}


if (
  uniqueCcRecipients.length
) {
  outlookParams.push(
    `cc=${encodeURIComponent(
      uniqueCcRecipients.join(",")
    )}`
  );
}


outlookParams.push(
  `subject=${encodeURIComponent(
    subject
  )}`
);


outlookParams.push(
  `body=${encodeURIComponent(
    body
  )}`
);


const outlookUrl =
  "https://outlook.office.com/mail/deeplink/compose?" +
  outlookParams.join("&");


/*
  Open Outlook in a new browser tab/window.
*/
const emailWindow =
  window.open(
    outlookUrl,
    "_blank"
  );


if (!emailWindow) {
  alert(
    "The Outlook email window was blocked by the browser. Please allow pop-ups for this app and try again."
  );
}
}
function openHsCalibrationStartupAlert(
  alerts
) {
  closeHsCalibrationStartupAlert();

  if (!alerts?.length) {
    return;
  }

  const expiredCount =
    alerts.filter(
      item =>
        item.stage.key ===
        "expired"
    ).length;

  const urgentCount =
    alerts.filter(
      item =>
        item.stage.key ===
        "7"
    ).length;

  const backdrop =
    document.createElement(
      "div"
    );

  backdrop.id =
    "hsCalibrationStartupAlertBackdrop";

  backdrop.className =
    "hs-startup-alert-backdrop";

  const alertRows =
    alerts
      .map(item => {
        const {
          record,
          days,
          stage
        } = item;

        let timingText = "";

        if (days < 0) {
          const overdueDays =
            Math.abs(days);

          timingText =
            `${overdueDays} day${
              overdueDays === 1
                ? ""
                : "s"
            } overdue`;
        } else if (days === 0) {
          timingText =
            "Calibration due today";
        } else {
          timingText =
            `${days} day${
              days === 1
                ? ""
                : "s"
            } remaining`;
        }

        const tone =
          stage.key ===
            "expired" ||
          stage.key === "7"
            ? "danger"
            : stage.key === "14"
              ? "warning"
              : "notice";

        return `
          <div
            class="
              hs-startup-alert-item
              hs-startup-alert-${tone}
            "
          >
            <div
              class="hs-startup-alert-marker"
            >
              ${
                stage.key ===
                  "expired"
                  ? "!"
                  : stage.key
              }
            </div>

            <div
              class="hs-startup-alert-content"
            >
              <div
                class="hs-startup-alert-item-head"
              >
                <strong>
                  ${escapeHtml(
                    record.analyserCode ||
                    "Unknown analyser"
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    stage.label
                  )}
                </span>
              </div>

              <div
                class="hs-startup-alert-details"
              >
                <span>
                  <strong>Model:</strong>
                  ${escapeHtml(
                    record.model ||
                    "Not recorded"
                  )}
                </span>

                <span>
                  <strong>Engineer:</strong>
                  ${escapeHtml(
                    record.engineer ||
                    "Not assigned"
                  )}
                </span>

                <span>
                  <strong>Due:</strong>
                  ${escapeHtml(
                    formatDate(
                      record.dueDate
                    )
                  )}
                </span>

                <span>
                  <strong>Status:</strong>
                  ${escapeHtml(
                    timingText
                  )}
                </span>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

  backdrop.innerHTML = `
    <section
      class="hs-startup-alert"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="hsStartupAlertTitle"
    >
      <div
        class="hs-startup-alert-head"
      >
        <div>
          <div class="hs-eyebrow">
            Health & Safety
          </div>

          <h2
            id="hsStartupAlertTitle"
          >
            Analyser calibration attention required
          </h2>

          <p>
            ${
              alerts.length === 1
                ? "1 analyser has reached a calibration reminder point."
                : `${alerts.length} analysers have reached calibration reminder points.`
            }
          </p>
        </div>

        <div
          class="hs-startup-alert-summary"
        >
          ${
            expiredCount
              ? `
                  <span
                    class="hs-startup-summary-danger"
                  >
                    ${expiredCount}
                    expired
                  </span>
                `
              : ""
          }

          ${
            urgentCount
              ? `
                  <span
                    class="hs-startup-summary-warning"
                  >
                    ${urgentCount}
                    due ≤7 days
                  </span>
                `
              : ""
          }
        </div>
      </div>

      <div
        class="hs-startup-alert-body"
      >
        ${alertRows}
      </div>

      <div
        class="hs-startup-alert-note"
      >
        These reminders are shown once for each
        30-day, 14-day, 7-day and expired stage.
        A new calibration due date starts a new
        reminder cycle automatically.
      </div>

  <div
  class="hs-startup-alert-actions"
>
  <button
    id="hsStartupViewCalibrationBtn"
    class="btn ghost"
    type="button"
  >
    View Calibration Register
  </button>

  <button
    id="hsStartupEmailRecipientsBtn"
    class="btn ghost"
    type="button"
  >
    Email Recipients
  </button>

  <button
    id="hsStartupRemindLaterBtn"
    class="btn ghost"
    type="button"
  >
    Remind Me Next Time
  </button>

  <button
    id="hsStartupAcknowledgeBtn"
    class="btn"
    type="button"
  >
          Acknowledge ${
            alerts.length === 1
              ? "Reminder"
              : "Reminders"
          }
        </button>
      </div>
    </section>
  `;

  document.body.appendChild(
    backdrop
  );

  el(
    "hsStartupViewCalibrationBtn"
  )?.addEventListener(
    "click",
    () => {
      acknowledgeHsCalibrationStartupAlerts(
        alerts
      );

      setTab(
        "healthSafety"
      );

      setHealthSafetyTab(
        "calibration"
      );
    }
  );
el(
  "hsStartupEmailRecipientsBtn"
)?.addEventListener(
  "click",
  async () => {
    await shareHsCalibrationAlertEmail(
      alerts
    );
  }
);
  el(
  "hsStartupRemindLaterBtn"
)?.addEventListener(
  "click",
  () => {
    /*
      Close only.

      Do NOT acknowledge these alerts,
      so they will appear again the
      next time the app opens.
    */
    closeHsCalibrationStartupAlert();
  }
);
  el(
    "hsStartupAcknowledgeBtn"
  )?.addEventListener(
    "click",
    () => {
      acknowledgeHsCalibrationStartupAlerts(
        alerts
      );
    }
  );
}


function checkHsCalibrationStartupAlerts() {
  const records =
    hsCalibrationState.records ||
    [];

  if (!records.length) {
    return;
  }

  const pendingAlerts =
    getPendingHsCalibrationPopupAlerts();

  if (!pendingAlerts.length) {
    return;
  }

  openHsCalibrationStartupAlert(
    pendingAlerts
  );
}


function getHsTodayDate() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
}


function hsCalibrationDaysLeft(
  dueDate
) {
  const due =
    parseAnalyticsDate(
      dueDate
    );

  if (!due) return null;

  const today =
    getHsTodayDate();

  return Math.round(
    (
      due.getTime() -
      today.getTime()
    ) /
    (
      24 *
      60 *
      60 *
      1000
    )
  );
}


function getHsCalibrationStatus(
  dueDate
) {
  const days =
    hsCalibrationDaysLeft(
      dueDate
    );

  if (days === null) {
    return {
      key: "unknown",
      label: "Date not available",
      tone: "neutral"
    };
  }

  if (days < 0) {
    return {
      key: "expired",
      label: "Expired",
      tone: "danger"
    };
  }

  if (days === 0) {
    return {
      key: "30",
      label: "Due today",
      tone: "danger"
    };
  }

  if (days <= 30) {
    return {
      key: "30",
      label: "Due within 30 days",
      tone: "danger"
    };
  }

  if (days <= 90) {
    return {
      key: "90",
      label: "Due within 90 days",
      tone: "warning"
    };
  }

  return {
    key: "current",
    label: "Current",
    tone: "success"
  };
}


function locateHsCalibrationSheet(
  workbook
) {
  if (!workbook) return null;

  const requiredHeaders = {
    analyserCode: [
      "analyser code",
      "analyzer code",
      "analyser",
      "analyzer",
      "serial number"
    ],

    engineer: [
      "assigned engineer",
      "engineer",
      "assigned to"
    ],

    dueDate: [
      "calibration due date",
      "calibration due",
      "calibration date",
      "due date"
    ]
  };

  /*
    Search every worksheet by its headings.

    This means the calibration sheet does not
    need to have a particular tab name.
  */
  for (
    const sheetName of
    workbook.SheetNames || []
  ) {
    const sheet =
      workbook.Sheets[
        sheetName
      ];

    const rows =
      workbookRows(sheet);

    const header =
      findWorkbookHeader(
        rows,
        requiredHeaders
      );

    if (!header) continue;

    return {
      sheetName,
      sheet,
      rows,
      header
    };
  }

  return null;
}

function getHsAuditDueMonth(
  lastAuditDate
) {
  if (!lastAuditDate) {
    return null;
  }


  const parts =
    String(lastAuditDate)
      .split("-")
      .map(Number);


  if (
    parts.length !== 3 ||
    !parts[0] ||
    !parts[1]
  ) {
    return null;
  }


  /*
    Use the first day of the last-audit month,
    then move forward exactly three months.

    Example:
    15 June 2026 -> September 2026
  */
  const dueMonth =
    new Date(
      Date.UTC(
        parts[0],
        parts[1] - 1 + 3,
        1
      )
    );


  return {
    year:
      dueMonth.getUTCFullYear(),

    month:
      dueMonth.getUTCMonth() + 1,

    key:
      `${dueMonth.getUTCFullYear()}-${String(
        dueMonth.getUTCMonth() + 1
      ).padStart(2, "0")}`,

    label:
      dueMonth.toLocaleDateString(
        "en-GB",
        {
          month: "long",
          year: "numeric",
          timeZone: "UTC"
        }
      )
  };
}


function getHsAuditScheduleStatus(
  lastAuditDate
) {
  const due =
    getHsAuditDueMonth(
      lastAuditDate
    );


  if (!due) {
    return {
      key: "overdue",
      label: "No audit date",
      tone: "danger",
      sort: 0
    };
  }


  const now =
    new Date();


  const currentKey =
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;


  if (
    currentKey >
    due.key
  ) {
    return {
      key: "overdue",
      label: "Overdue",
      tone: "danger",
      sort: 0
    };
  }


  if (
    currentKey ===
    due.key
  ) {
    return {
      key: "due",
      label: "Due this month",
      tone: "warning",
      sort: 1
    };
  }


  return {
    key: "current",
    label: "Current",
    tone: "good",
    sort: 2
  };
}
function locateHsAuditRegisterSheet(
  workbook
) {
  const sheetNames =
    workbook?.SheetNames ||
    [];


  for (
    const sheetName of
    sheetNames
  ) {
    const sheet =
      workbook.Sheets[
        sheetName
      ];


    if (!sheet) {
      continue;
    }


    const rows =
      workbookRows(
        sheet
      );


    const header =
      findWorkbookHeader(
        rows,
        {
          engineer: [
            "assigned engineer",
            "engineer",
            "engineer name"
          ],

          lastInspection: [
            "last inspection date",
            "last inspection",
            "last audit date",
            "last audit"
          ],

          vehicle: [
            "vehicle reg",
            "vehicle registration",
            "vehicle"
          ]
        }
      );


    if (header) {
      return {
        sheetName,
        rows,
        header
      };
    }
  }


  return null;
}
function importHsAuditRegisterRecords(
  workbook,
  sourceFileName
) {
  const located =
    locateHsAuditRegisterSheet(
      workbook
    );


  if (!located) {
    throw new Error(
      "An H&S engineer register could not be found.\n\n" +
      "The app looked for Assigned Engineer, Last Inspection Date and Vehicle Reg headings."
    );
  }


  const {
    rows,
    header,
    sheetName
  } = located;


  const headerRow =
    rows[
      header.rowIndex
    ] || [];


  const clockIndex =
    findOptionalHsCalibrationColumn(
      headerRow,
      [
        "clock number",
        "clock no",
        "clock"
      ]
    );


  const gasSafeIndex =
    findOptionalHsCalibrationColumn(
      headerRow,
      [
        "gas safe numbers",
        "gas safe number",
        "gas safe no"
      ]
    );


  const telescopicsIndex =
    findOptionalHsCalibrationColumn(
      headerRow,
      [
        "telescopics",
        "telescopic"
      ]
    );


  const stepsIndex =
    findOptionalHsCalibrationColumn(
      headerRow,
      [
        "steps",
        "step"
      ]
    );


  const hopUpIndex =
    findOptionalHsCalibrationColumn(
      headerRow,
      [
        "hop up",
        "hopup"
      ]
    );


  const firstAidIndex =
    findOptionalHsCalibrationColumn(
      headerRow,
      [
        "first aid kit",
        "first aid"
      ]
    );


  const extinguisherIndex =
    findOptionalHsCalibrationColumn(
      headerRow,
      [
        "fire extinguisher",
        "extinguisher"
      ]
    );


  const notesIndex =
    findOptionalHsCalibrationColumn(
      headerRow,
      [
        "notes",
        "note",
        "comments"
      ]
    );


  const imported = [];


  for (
    let rowIndex =
      header.rowIndex + 1;

    rowIndex <
    rows.length;

    rowIndex++
  ) {
    const row =
      rows[rowIndex] || [];


    const engineer =
      String(
        row[
          header.indexes
            .engineer
        ] ?? ""
      ).trim();


    const vehicleReg =
      String(
        row[
          header.indexes
            .vehicle
        ] ?? ""
      ).trim();


    const lastInspectionDate =
      workbookDateToIso(
        row[
          header.indexes
            .lastInspection
        ]
      );


    /*
      Ignore completely blank rows.
    */
    if (
      !engineer &&
      !vehicleReg &&
      !lastInspectionDate
    ) {
      continue;
    }


    /*
      Engineer name identifies the register row.
    */
    if (!engineer) {
      continue;
    }


    const readOptionalText =
      index =>
        index >= 0
          ? String(
              row[index] ??
              ""
            ).trim()
          : "";


    imported.push({
      id:
        `hs-audit-engineer-` +
        `${normalizePerformanceSourceName(
          engineer
        ) || rowIndex}`,

      engineer,

      clockNumber:
        readOptionalText(
          clockIndex
        ),

      gasSafeNumber:
        readOptionalText(
          gasSafeIndex
        ),

      vehicleReg,

      lastInspectionDate,

      telescopics:
        readOptionalText(
          telescopicsIndex
        ),

      steps:
        readOptionalText(
          stepsIndex
        ),

      hopUp:
        readOptionalText(
          hopUpIndex
        ),

      firstAidKit:
        readOptionalText(
          firstAidIndex
        ),

      fireExtinguisher:
        readOptionalText(
          extinguisherIndex
        ),

      notes:
        readOptionalText(
          notesIndex
        ),

      sourceFile:
        sourceFileName,

      sourceSheet:
        sheetName
    });
  }


  return {
    records:
      imported,

    sheetName
  };
}

function applyPendingHsAuditRegisterUpdates(
  records
) {
  const result =
    (records || []).map(
      record => ({
        ...record
      })
    );


  hsAuditPendingUpdates
    .slice()
    .sort(
      (a, b) =>
        String(
          a.changedAt || ""
        ).localeCompare(
          String(
            b.changedAt || ""
          )
        )
    )
    .forEach(
      update => {
        const record =
          result.find(
            item =>
              item.engineer ===
              update.engineer
          );


        if (!record) {
          return;
        }


        if (
          Object.prototype
            .hasOwnProperty.call(
              record,
              update.field
            )
        ) {
          record[
            update.field
          ] =
            update.newValue;
        }
      }
    );


  return result;
}
async function importHsAuditRegisterWorkbook(
  file
) {
  if (!window.XLSX) {
    throw new Error(
      "The Excel import library has not loaded."
    );
  }


  if (!file) {
    throw new Error(
      "No workbook was selected."
    );
  }


  const buffer =
    await file.arrayBuffer();


  const workbook =
    window.XLSX.read(
      buffer,
      {
        type: "array",
        cellDates: true
      }
    );


  const result =
    importHsAuditRegisterRecords(
      workbook,
      file.name
    );


  if (
    !result.records.length
  ) {
    throw new Error(
      "The H&S register sheet was found, but no engineer records could be imported."
    );
  }


  /*
    This is a current engineer/equipment
    register, so the latest spreadsheet
    replaces the previous imported register.
  */
 hsAuditRegisterState.records =
  applyPendingHsAuditRegisterUpdates(
    result.records
  );


  hsAuditRegisterState.importMeta = {
    fileName:
      file.name,

    sheetName:
      result.sheetName,

    importedAt:
      new Date()
        .toISOString(),

    recordCount:
      result.records.length
  };


  saveHsAuditRegisterState();


renderHsAuditRegister();


if (cloudSignedIn()) {
  await syncHsAuditRegisterToCloud();
}


return result.records.length;
}

function updateHsAuditPendingBadge() {
  const badge =
    el(
      "hsAuditPendingCount"
    );


  if (!badge) {
    return;
  }


  const count =
    hsAuditPendingUpdates.length;


  badge.textContent =
    String(count);


  badge.classList.toggle(
    "hidden",
    count === 0
  );
}


function formatHsAuditPendingField(
  field
) {
  const labels = {
  lastInspectionDate:
    "Last Inspection Date",

  clockNumber:
    "Clock Number",

  gasSafeNumber:
    "Gas Safe Number",

    vehicleReg:
      "Vehicle Reg",

    telescopics:
      "Telescopics",

    steps:
      "Steps",

    hopUp:
      "Hop Up",

    firstAidKit:
      "First Aid Kit",

    fireExtinguisher:
      "Fire Extinguisher",

    notes:
      "Notes"
  };


  return (
    labels[field] ||
    field
  );
}


function renderHsAuditPendingUpdates() {
  updateHsAuditPendingBadge();


  const body =
    el(
      "hsAuditPendingTableBody"
    );


  const empty =
    el(
      "hsAuditPendingEmpty"
    );


  const wrap =
    el(
      "hsAuditPendingTableWrap"
    );


  const markAll =
    el(
      "hsAuditMarkAllCompleteBtn"
    );


  const pending =
    hsAuditPendingUpdates
      .slice()
      .sort(
        (a, b) =>
          String(
            b.changedAt || ""
          ).localeCompare(
            String(
              a.changedAt || ""
            )
          )
      );


  empty?.classList.toggle(
    "hidden",
    pending.length > 0
  );


  wrap?.classList.toggle(
    "hidden",
    pending.length === 0
  );


  if (markAll) {
    markAll.disabled =
      pending.length === 0;
  }


  if (!body) {
    return;
  }


  body.innerHTML =
    pending
      .map(
        update => {
          const changed =
            update.changedAt
              ? new Date(
                  update.changedAt
                ).toLocaleString(
                  "en-GB"
                )
              : "—";


          return `
            <tr>

              <td>
                ${escapeHtml(
                  changed
                )}
              </td>

              <td>
                <strong>
                  ${escapeHtml(
                    update.engineer ||
                    "—"
                  )}
                </strong>
              </td>

              <td>
                ${escapeHtml(
                  formatHsAuditPendingField(
                    update.field
                  )
                )}
              </td>

              <td>
               ${escapeHtml(
  update.field ===
    "lastInspectionDate"
      ? (
          update.oldValue
            ? formatDate(
                update.oldValue
              )
            : "—"
        )
      : String(
          update.oldValue ||
          "—"
        )
)}
              </td>

              <td>
                <strong>
                 ${escapeHtml(
  update.field ===
    "lastInspectionDate"
      ? (
          update.newValue
            ? formatDate(
                update.newValue
              )
            : "—"
        )
      : String(
          update.newValue ||
          "—"
        )
)}
                </strong>
              </td>

              <td>
                <button
                  type="button"
                  class="btn ghost small"
                  data-hs-audit-update-complete="${escapeHtml(
                    update.id
                  )}"
                >
                  Updated in Excel
                </button>
              </td>

            </tr>
          `;
        }
      )
      .join("");


  body
    .querySelectorAll(
      "[data-hs-audit-update-complete]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          async () => {
            hsAuditPendingUpdates =
              hsAuditPendingUpdates
                .filter(
                  update =>
                    update.id !==
                    button.dataset
                      .hsAuditUpdateComplete
                );


           await saveHsAuditPendingUpdatesToCloud();

renderHsAuditPendingUpdates();
          }
        );
      }
    );
}

function openHsAuditRecordModal(
  recordId
) {
  const record =
    (
      hsAuditRegisterState.records ||
      []
    ).find(
      item =>
        item.id ===
        recordId
    );


  if (!record) {
    return;
  }


  el(
    "hsAuditRecordEngineerId"
  ).value =
    record.id;


  el(
    "hsAuditRecordEngineer"
  ).value =
    record.engineer ||
    "";


  const today =
    new Date();


  const todayIso =
    `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;


  el(
    "hsAuditRecordDate"
  ).value =
    todayIso;


  el(
    "hsAuditRecordResult"
  ).value =
    "";


  el(
    "hsAuditRecordReason"
  ).value =
    "";


  el(
    "hsAuditRecordNotes"
  ).value =
    "";


  el(
    "hsAuditRecordFollowUp"
  ).checked =
    false;


  const status =
    el(
      "hsAuditRecordSaveStatus"
    );


  if (status) {
    status.textContent =
      "";

    status.className =
      "hs-alert-save-status";
  }


  el(
    "hsAuditRecordModal"
  )?.classList.remove(
    "hidden"
  );
}


function closeHsAuditRecordModal() {
  el(
    "hsAuditRecordModal"
  )?.classList.add(
    "hidden"
  );
}


async function saveHsAuditRecord() {
  const recordId =
    el(
      "hsAuditRecordEngineerId"
    )?.value;


  const engineerRecord =
    (
      hsAuditRegisterState.records ||
      []
    ).find(
      item =>
        item.id ===
        recordId
    );


  if (!engineerRecord) {
    return;
  }


  const auditDate =
    String(
      el(
        "hsAuditRecordDate"
      )?.value || ""
    ).trim();


  const result =
    String(
      el(
        "hsAuditRecordResult"
      )?.value || ""
    ).trim();


  const reason =
    String(
      el(
        "hsAuditRecordReason"
      )?.value || ""
    ).trim();


  const notes =
    String(
      el(
        "hsAuditRecordNotes"
      )?.value || ""
    ).trim();


  const followUpRequired =
    el(
      "hsAuditRecordFollowUp"
    )?.checked === true;


  const status =
    el(
      "hsAuditRecordSaveStatus"
    );


  if (!auditDate) {
    if (status) {
      status.textContent =
        "Choose the audit date.";
    }

    return;
  }


  if (
    result !== "PASS" &&
    result !== "FAIL"
  ) {
    if (status) {
      status.textContent =
        "Choose PASS or FAIL.";
    }

    return;
  }


  if (
    result === "FAIL" &&
    !reason
  ) {
    if (status) {
      status.textContent =
        "A reason or finding is required for a failed audit.";
    }

    return;
  }


  const oldLastInspectionDate =
    engineerRecord
      .lastInspectionDate ||
    "";


  /*
    Build the permanent audit record.
  */
  const audit = {
    id:
      `hs-audit-${uid()}`,

    engineerId:
      engineerRecord.id,

    engineer:
      engineerRecord.engineer ||
      "",

    auditDate,

    result,

    reason,

    notes,

    followUpRequired:
      followUpRequired ||
      result === "FAIL",

    resolved:
      result === "PASS",

    resolvedAt:
      result === "PASS"
        ? auditDate
        : "",

    vehicleReg:
      engineerRecord.vehicleReg ||
      "",

    telescopics:
      engineerRecord.telescopics ||
      "",

    steps:
      engineerRecord.steps ||
      "",

    hopUp:
      engineerRecord.hopUp ||
      "",

    firstAidKit:
      engineerRecord.firstAidKit ||
      "",

    fireExtinguisher:
      engineerRecord.fireExtinguisher ||
      "",

    createdAt:
      new Date()
        .toISOString()
  };


  hsAuditHistory.push(
    audit
  );


  /*
    Update the live engineer register.

    PASS or FAIL both count as an audit
    having taken place.
  */
  engineerRecord
    .lastInspectionDate =
      auditDate;


  /*
    Add Last Inspection Date to the
    Pending Excel Updates list.

    If this engineer already has a
    pending Last Inspection Date change,
    retain the original spreadsheet value
    and only update the newest value.
  */
  if (
    oldLastInspectionDate !==
    auditDate
  ) {
    const existingPending =
      hsAuditPendingUpdates
        .find(
          update =>
            update.engineer ===
              engineerRecord.engineer &&
            update.field ===
              "lastInspectionDate"
        );


    if (existingPending) {
      existingPending.newValue =
        auditDate;

      existingPending.changedAt =
        new Date()
          .toISOString();
    } else {
      hsAuditPendingUpdates
        .push({
          id:
            `hs-audit-change-${uid()}`,

          engineer:
            engineerRecord.engineer,

          field:
            "lastInspectionDate",

          oldValue:
            oldLastInspectionDate,

          newValue:
            auditDate,

          changedAt:
            new Date()
              .toISOString(),

          sourceFile:
            engineerRecord
              .sourceFile ||
            ""
        });
    }
  }


  saveHsAuditHistoryLocal();

saveHsAuditRegisterState();

saveHsAuditPendingUpdatesLocal();


renderHsAuditRegister();

renderHsAuditPendingUpdates();

renderHsAuditHistory();

renderHsAuditOverview();


  if (status) {
    status.textContent =
      "Saving audit…";
  }


  if (cloudSignedIn()) {
    const [
      auditResult,
      registerResult,
      pendingResult
    ] =
      await Promise.all([
        saveHsAuditRecordToCloud(
          audit
        ),

        syncHsAuditRegisterToCloud(),

        saveHsAuditPendingUpdatesToCloud()
      ]);


    if (
      auditResult.saved &&
      registerResult.synced &&
      pendingResult.saved
    ) {
      if (status) {
        status.textContent =
          `${result} audit saved to Firebase.`;
      }
    } else {
      if (status) {
        status.textContent =
          "Audit saved locally, but Firebase sync needs attention.";
      }
    }
  } else if (status) {
    status.textContent =
      `${result} audit saved locally.`;
  }


  setTimeout(
    closeHsAuditRecordModal,
    1000
  );
}
function openHsAuditEditor(
  recordId
) {
  const record =
    (
      hsAuditRegisterState.records ||
      []
    ).find(
      item =>
        item.id ===
        recordId
    );


  if (!record) {
    return;
  }


  el(
    "hsAuditEditRecordId"
  ).value =
    record.id;


  el(
    "hsAuditEditEngineer"
  ).value =
    record.engineer || "";


  el(
    "hsAuditEditClock"
  ).value =
    record.clockNumber || "";


  el(
    "hsAuditEditGasSafe"
  ).value =
    record.gasSafeNumber || "";


  el(
    "hsAuditEditVehicle"
  ).value =
    record.vehicleReg || "";


  el(
    "hsAuditEditTelescopics"
  ).value =
    record.telescopics || "";


  el(
    "hsAuditEditSteps"
  ).value =
    record.steps || "";


  el(
    "hsAuditEditHopUp"
  ).value =
    record.hopUp || "";


  el(
    "hsAuditEditFirstAid"
  ).value =
    record.firstAidKit || "";


  el(
    "hsAuditEditExtinguisher"
  ).value =
    record.fireExtinguisher || "";


  el(
    "hsAuditEditNotes"
  ).value =
    record.notes || "";


  const status =
    el(
      "hsAuditEditStatus"
    );


  if (status) {
    status.textContent = "";
    status.className =
      "hs-alert-save-status";
  }


  el(
    "hsAuditEditModal"
  )?.classList.remove(
    "hidden"
  );
}


function closeHsAuditEditor() {
  el(
    "hsAuditEditModal"
  )?.classList.add(
    "hidden"
  );
}


async function saveHsAuditEditor() {
  const recordId =
    el(
      "hsAuditEditRecordId"
    )?.value;


  const record =
    (
      hsAuditRegisterState.records ||
      []
    ).find(
      item =>
        item.id ===
        recordId
    );


  if (!record) {
    return;
  }


  const values = {
    clockNumber:
      String(
        el(
          "hsAuditEditClock"
        )?.value || ""
      ).trim(),

    gasSafeNumber:
      String(
        el(
          "hsAuditEditGasSafe"
        )?.value || ""
      ).trim(),

    vehicleReg:
      String(
        el(
          "hsAuditEditVehicle"
        )?.value || ""
      ).trim(),

    telescopics:
      String(
        el(
          "hsAuditEditTelescopics"
        )?.value || ""
      ).trim(),

    steps:
      String(
        el(
          "hsAuditEditSteps"
        )?.value || ""
      ).trim(),

    hopUp:
      String(
        el(
          "hsAuditEditHopUp"
        )?.value || ""
      ).trim(),

    firstAidKit:
      String(
        el(
          "hsAuditEditFirstAid"
        )?.value || ""
      ).trim(),

    fireExtinguisher:
      String(
        el(
          "hsAuditEditExtinguisher"
        )?.value || ""
      ).trim(),

    notes:
      String(
        el(
          "hsAuditEditNotes"
        )?.value || ""
      ).trim()
  };


  const changedAt =
    new Date()
      .toISOString();


  let changesMade =
    0;


  Object.entries(
    values
  ).forEach(
    ([field, newValue]) => {
      const oldValue =
        String(
          record[field] ||
          ""
        );


      if (
        oldValue ===
        newValue
      ) {
        return;
      }


      changesMade++;


      const existing =
        hsAuditPendingUpdates
          .find(
            update =>
              update.engineer ===
                record.engineer &&
              update.field ===
                field
          );


      if (existing) {
        existing.newValue =
          newValue;

        existing.changedAt =
          changedAt;
      } else {
        hsAuditPendingUpdates
          .push({
            id:
              `hs-audit-change-${uid()}`,

            engineer:
              record.engineer,

            field,

            oldValue,

            newValue,

            changedAt,

            sourceFile:
              record.sourceFile ||
              ""
          });
      }


      record[field] =
        newValue;
    }
  );


  const status =
    el(
      "hsAuditEditStatus"
    );


  if (!changesMade) {
    if (status) {
      status.textContent =
        "No changes were made.";
    }

    return;
  }


 saveHsAuditRegisterState();

saveHsAuditPendingUpdatesLocal();


renderHsAuditRegister();

renderHsAuditPendingUpdates();


if (status) {
  status.textContent =
    "Saving changes…";
}


const [
  registerResult,
  pendingResult
] =
  await Promise.all([
    syncHsAuditRegisterToCloud(),
    saveHsAuditPendingUpdatesToCloud()
  ]);


if (
  registerResult.synced &&
  pendingResult.saved
) {
  if (status) {
    status.textContent =
      `${changesMade} change${
        changesMade === 1
          ? ""
          : "s"
      } saved to Firebase and added to Pending Excel Updates.`;
  }
} else {
  if (status) {
    status.textContent =
      `${changesMade} change${
        changesMade === 1
          ? ""
          : "s"
      } saved locally. Firebase sync needs attention.`;
  }
}


setTimeout(
  closeHsAuditEditor,
  1000
);
}


function openHsAuditPendingUpdates() {
  renderHsAuditPendingUpdates();


  el(
    "hsAuditPendingModal"
  )?.classList.remove(
    "hidden"
  );
}


function closeHsAuditPendingUpdates() {
  el(
    "hsAuditPendingModal"
  )?.classList.add(
    "hidden"
  );
}


async function markAllHsAuditUpdatesComplete() {
  if (
    !hsAuditPendingUpdates.length
  ) {
    return;
  }


  const confirmed =
    confirm(
      `Mark all ${hsAuditPendingUpdates.length} pending H&S register update${
        hsAuditPendingUpdates.length === 1
          ? ""
          : "s"
      } as transferred to Excel?`
    );


  if (!confirmed) {
    return;
  }


  hsAuditPendingUpdates =
    [];


  await saveHsAuditPendingUpdatesToCloud();


renderHsAuditPendingUpdates();
}

async function saveHsAuditRecordToCloud(
  audit
) {
  if (!cloudSignedIn()) {
    return {
      saved: false,
      reason: "not-signed-in"
    };
  }


  try {
    const user =
      getUser();


    await hsAuditHistoryCloudCol(
      user.uid
    )
      .doc(
        String(
          audit.id
        )
      )
      .set(
        {
          ...audit,

          updatedAt:
            firebase
              .firestore
              .FieldValue
              .serverTimestamp()
        },
        {
          merge: true
        }
      );


    return {
      saved: true
    };
  } catch (error) {
    console.error(
      "H&S audit record Firebase save failed:",
      error
    );


    return {
      saved: false,
      reason: "error",
      error
    };
  }
}
async function syncHsAuditRegisterToCloud() {
  if (!cloudSignedIn()) {
    const status =
      el(
        "hsAuditCloudStatus"
      );

    if (status) {
      status.textContent =
        "Local only • Log in to sync H&S register data.";
    }


    return {
      synced: false,
      reason: "not-signed-in"
    };
  }


  const user =
    getUser();


  const records =
    hsAuditRegisterState.records ||
    [];


  const status =
    el(
      "hsAuditCloudStatus"
    );


  if (status) {
    status.textContent =
      "Syncing H&S register to Firebase…";
  }


  try {
    const collection =
      hsAuditRegisterCloudCol(
        user.uid
      );


    const existingSnapshot =
      await collection.get();


    const currentIds =
      new Set(
        records.map(
          record =>
            String(
              record.id
            )
        )
      );


    const operations =
      [];


    /*
      Remove cloud engineer rows which
      no longer exist in the current
      register.
    */
    existingSnapshot.docs.forEach(
      document => {
        if (
          !currentIds.has(
            document.id
          )
        ) {
          operations.push({
            type: "delete",
            ref:
              document.ref
          });
        }
      }
    );


    /*
      Add/update the current register.
    */
    records.forEach(
      record => {
        if (!record.id) {
          return;
        }


        const ref =
          collection.doc(
            String(
              record.id
            )
          );


        operations.push({
          type: "set",

          ref,

          data: {
            ...record,

            updatedAt:
              firebase
                .firestore
                .FieldValue
                .serverTimestamp()
          }
        });
      }
    );


    const batchSize =
      400;


    for (
      let index = 0;
      index < operations.length;
      index += batchSize
    ) {
      const batch =
        cloudDb.batch();


      operations
        .slice(
          index,
          index + batchSize
        )
        .forEach(
          operation => {
            if (
              operation.type ===
              "delete"
            ) {
              batch.delete(
                operation.ref
              );
            } else {
              batch.set(
                operation.ref,
                operation.data,
                {
                  merge: true
                }
              );
            }
          }
        );


      await batch.commit();
    }


    await hsAuditRegisterMetaRef(
      user.uid
    ).set(
      {
        importMeta:
          hsAuditRegisterState
            .importMeta || null,

        registerUpdatedAt:
          firebase
            .firestore
            .FieldValue
            .serverTimestamp()
      },
      {
        merge: true
      }
    );


    if (status) {
      status.textContent =
        `Cloud synced • ${records.length} engineer${
          records.length === 1
            ? ""
            : "s"
        } stored in Firebase.`;
    }


    return {
      synced: true
    };
  } catch (error) {
    console.error(
      "H&S register Firebase sync failed:",
      error
    );


    if (status) {
      status.textContent =
        "H&S register cloud sync failed.";
    }


    return {
      synced: false,
      reason: "error",
      error
    };
  }
}

async function saveHsAuditPendingUpdatesToCloud() {
  /*
    Always save locally first.
  */
  saveHsAuditPendingUpdatesLocal();


  if (!cloudSignedIn()) {
    return {
      saved: false,
      reason: "not-signed-in"
    };
  }


  try {
    const user =
      getUser();


    await hsAuditRegisterMetaRef(
      user.uid
    ).set(
      {
        pendingExcelUpdates:
          hsAuditPendingUpdates,

        pendingExcelUpdatesUpdatedAt:
          firebase
            .firestore
            .FieldValue
            .serverTimestamp()
      },
      {
        merge: true
      }
    );


    return {
      saved: true
    };
  } catch (error) {
    console.error(
      "H&S pending Excel updates Firebase sync failed:",
      error
    );


    return {
      saved: false,
      reason: "error",
      error
    };
  }
}

async function loadHsAuditHistoryFromCloud() {
  if (!cloudSignedIn()) {
    return false;
  }

  try {
    const user =
      getUser();

    const snapshot =
      await hsAuditHistoryCloudCol(
        user.uid
      ).get();

    /*
      When logged in, Firebase is the
      authoritative Audit History.

      This is important because deletions
      made on another device must also
      disappear from this device.
    */
    hsAuditHistory =
      snapshot.docs.map(
        document => {
          const data =
            document.data() ||
            {};

          const {
            updatedAt,
            ...audit
          } = data;

          return {
            ...audit,

            id:
              audit.id ||
              document.id
          };
        }
      );

    saveHsAuditHistoryLocal();

    renderHsAuditHistory();
    renderHsAuditOverview();

    return true;

  } catch (error) {
    console.error(
      "H&S audit history could not be loaded from Firebase:",
      error
    );

    return false;
  }
}
async function loadHsAuditRegisterFromCloud() {
  if (!cloudSignedIn()) {
    return false;
  }


  try {
    const user =
      getUser();


    const [
      registerSnapshot,
      metaSnapshot
    ] =
      await Promise.all([
        hsAuditRegisterCloudCol(
          user.uid
        ).get(),

        hsAuditRegisterMetaRef(
          user.uid
        ).get()
      ]);


    /*
      If Firebase already contains the
      register, use it as the current
      working register on this device.
    */
    if (
      !registerSnapshot.empty
    ) {
      hsAuditRegisterState.records =
        registerSnapshot.docs.map(
          document => {
            const data =
              document.data() ||
              {};


            /*
              Do not retain Firestore's
              server timestamp inside our
              local register.
            */
            const {
              updatedAt,
              ...record
            } = data;


            return {
              ...record,

              id:
                record.id ||
                document.id
            };
          }
        );


      saveHsAuditRegisterState();
    } else if (
      hsAuditRegisterState.records
        ?.length
    ) {
      /*
        Cloud is empty but this device has
        a register. Upload it rather than
        throwing the local register away.
      */
      await syncHsAuditRegisterToCloud();
    }


    if (
      metaSnapshot.exists
    ) {
      const data =
        metaSnapshot.data() ||
        {};


      if (
        data.importMeta &&
        typeof data.importMeta ===
          "object"
      ) {
        hsAuditRegisterState.importMeta =
          data.importMeta;
      }


      if (
        Array.isArray(
          data.pendingExcelUpdates
        )
      ) {
        hsAuditPendingUpdates =
          data.pendingExcelUpdates;


        saveHsAuditPendingUpdatesLocal();
      }
    }


    saveHsAuditRegisterState();


    renderHsAuditRegister();

    renderHsAuditPendingUpdates();


    const status =
      el(
        "hsAuditCloudStatus"
      );


    if (status) {
      status.textContent =
        `Cloud loaded • ${
          hsAuditRegisterState.records
            .length
        } engineer${
          hsAuditRegisterState.records
            .length === 1
            ? ""
            : "s"
        }.`;
    }


    return true;
  } catch (error) {
    console.error(
      "H&S register could not be loaded from Firebase:",
      error
    );


    const status =
      el(
        "hsAuditCloudStatus"
      );


    if (status) {
      status.textContent =
        "H&S register cloud load failed.";
    }


    return false;
  }
}
function getFilteredHsAuditRegisterRecords() {
  const statusFilter =
    el(
      "hsAuditStatusFilter"
    )?.value || "";


  const search =
    String(
      el(
        "hsAuditSearch"
      )?.value || ""
    )
      .trim()
      .toLowerCase();


  return (
    hsAuditRegisterState.records ||
    []
  )
    .filter(
      record => {
        const status =
          getHsAuditScheduleStatus(
            record.lastInspectionDate
          );


        if (
          statusFilter &&
          status.key !==
            statusFilter
        ) {
          return false;
        }


        if (search) {
          const haystack =
            `
              ${record.engineer || ""}
              ${record.clockNumber || ""}
              ${record.gasSafeNumber || ""}
              ${record.vehicleReg || ""}
              ${record.telescopics || ""}
              ${record.steps || ""}
              ${record.hopUp || ""}
              ${record.firstAidKit || ""}
              ${record.fireExtinguisher || ""}
              ${record.notes || ""}
            `
              .toLowerCase();


          if (
            !haystack.includes(
              search
            )
          ) {
            return false;
          }
        }


        return true;
      }
    )
    .sort(
      (a, b) => {
        const statusA =
          getHsAuditScheduleStatus(
            a.lastInspectionDate
          );

        const statusB =
          getHsAuditScheduleStatus(
            b.lastInspectionDate
          );


        if (
          statusA.sort !==
          statusB.sort
        ) {
          return (
            statusA.sort -
            statusB.sort
          );
        }


        const dueA =
          getHsAuditDueMonth(
            a.lastInspectionDate
          )?.key || "";

        const dueB =
          getHsAuditDueMonth(
            b.lastInspectionDate
          )?.key || "";


        return (
          dueA.localeCompare(
            dueB
          ) ||
          String(
            a.engineer || ""
          ).localeCompare(
            String(
              b.engineer || ""
            )
          )
        );
      }
    );
}


function getHsAuditRegisterCounts() {
  const counts = {
    total: 0,
    current: 0,
    due: 0,
    overdue: 0
  };


  (
    hsAuditRegisterState.records ||
    []
  ).forEach(
    record => {
      counts.total++;


      const status =
        getHsAuditScheduleStatus(
          record.lastInspectionDate
        );


      if (
        Object.prototype
          .hasOwnProperty.call(
            counts,
            status.key
          )
      ) {
        counts[
          status.key
        ]++;
      }
    }
  );


  return counts;
}

function populateHsAuditHistoryEngineerFilter() {
  const select =
    el(
      "hsAuditHistoryEngineer"
    );


  if (!select) {
    return;
  }


  const current =
    select.value;


  const engineers = [
    ...new Set(
      (
        hsAuditHistory ||
        []
      )
        .map(
          audit =>
            String(
              audit.engineer ||
              ""
            ).trim()
        )
        .filter(Boolean)
    )
  ].sort(
    (a, b) =>
      a.localeCompare(b)
  );


  select.innerHTML =
    `
      <option value="">
        All engineers
      </option>
    ` +
    engineers
      .map(
        engineer => `
          <option
            value="${escapeHtml(
              engineer
            )}"
          >
            ${escapeHtml(
              engineer
            )}
          </option>
        `
      )
      .join("");


  if (
    engineers.includes(
      current
    )
  ) {
    select.value =
      current;
  }
}


function getFilteredHsAuditHistory() {
  const from =
    el(
      "hsAuditHistoryFrom"
    )?.value || "";


  const to =
    el(
      "hsAuditHistoryTo"
    )?.value || "";


  const engineer =
    el(
      "hsAuditHistoryEngineer"
    )?.value || "";


  const result =
    el(
      "hsAuditHistoryResult"
    )?.value || "";


  const resolution =
    el(
      "hsAuditHistoryResolution"
    )?.value || "";


  return (
    hsAuditHistory ||
    []
  )
    .filter(
      audit => {
        const date =
          String(
            audit.auditDate ||
            ""
          );


        if (
          from &&
          date < from
        ) {
          return false;
        }


        if (
          to &&
          date > to
        ) {
          return false;
        }


        if (
          engineer &&
          audit.engineer !==
            engineer
        ) {
          return false;
        }


        if (
          result &&
          audit.result !==
            result
        ) {
          return false;
        }


        if (
          resolution ===
            "open" &&
          !(
            audit.result ===
              "FAIL" &&
            audit.resolved !==
              true
          )
        ) {
          return false;
        }


        if (
          resolution ===
            "resolved" &&
          !(
            audit.result ===
              "FAIL" &&
            audit.resolved ===
              true
          )
        ) {
          return false;
        }


        return true;
      }
    )
    .sort(
      (a, b) =>
        String(
          b.auditDate ||
          ""
        ).localeCompare(
          String(
            a.auditDate ||
            ""
          )
        )
    );
}


function getOpenHsAuditFailures() {
  return (
    hsAuditHistory ||
    []
  )
    .filter(
      audit =>
        audit.result ===
          "FAIL" &&
        audit.resolved !==
          true
    )
    .sort(
      (a, b) =>
        String(
          b.auditDate ||
          ""
        ).localeCompare(
          String(
            a.auditDate ||
            ""
          )
        )
    );
}


function renderHsAuditOverview() {
  const totalAudits =
    (
      hsAuditHistory ||
      []
    ).length;


  const openFailures =
    getOpenHsAuditFailures();


  const auditCount =
    el(
      "hsOverviewAuditCount"
    );


  if (auditCount) {
    auditCount.textContent =
      String(
        totalAudits
      );
  }


  const highRisk =
    el(
      "hsOverviewHighRisk"
    );


  if (highRisk) {
    highRisk.textContent =
      String(
        openFailures.length
      );
  }


  /*
    The shared Needs Attention renderer
    lives inside the Calibration overview
    function, so refresh it whenever audit
    history changes.
  */
  if (
    typeof renderHsCalibrationOverview ===
      "function"
  ) {
    renderHsCalibrationOverview();
  }
}


async function resolveHsAuditRecord(
  auditId
) {
  const audit =
    (
      hsAuditHistory ||
      []
    ).find(
      item =>
        item.id ===
        auditId
    );


  if (
    !audit ||
    audit.result !==
      "FAIL" ||
    audit.resolved ===
      true
  ) {
    return;
  }


  const resolutionNote =
    prompt(
      "Resolution note (optional):",
      ""
    );


  if (
    resolutionNote ===
    null
  ) {
    return;
  }


  const confirmed =
    confirm(
      `Mark the failed H&S audit for ${audit.engineer || "this engineer"} as resolved?`
    );


  if (!confirmed) {
    return;
  }


  const now =
    new Date();


  const resolvedDate =
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;


  audit.resolved =
    true;


  audit.resolvedAt =
    resolvedDate;


  audit.resolutionNote =
    String(
      resolutionNote ||
      ""
    ).trim();


  audit.resolutionUpdatedAt =
    new Date()
      .toISOString();


  saveHsAuditHistoryLocal();


  renderHsAuditHistory();

  renderHsAuditOverview();


  if (cloudSignedIn()) {
    const result =
      await saveHsAuditRecordToCloud(
        audit
      );


    if (!result.saved) {
      alert(
        "The audit was resolved locally, but Firebase sync failed."
      );
    }
  }
}

async function deleteHsAuditRecord(
  auditId
) {
  const audit =
    (
      hsAuditHistory ||
      []
    ).find(
      item =>
        item.id === auditId
    );

  if (!audit) {
    alert(
      "That audit record could not be found."
    );

    return;
  }

  const confirmed =
    confirm(
      `Delete this audit permanently?\n\n` +
      `Engineer: ${audit.engineer || "Unknown"}\n` +
      `Date: ${audit.auditDate || "Unknown"}\n` +
      `Result: ${audit.result || "Unknown"}\n\n` +
      `If this audit changed the engineer's Last Inspection Date, ` +
      `the previous spreadsheet date will also be restored.`
    );

  if (!confirmed) {
    return;
  }


  /*
    Find the pending Last Inspection Date
    update created by this audit.
  */
  const pendingUpdate =
    (
      hsAuditPendingUpdates ||
      []
    ).find(
      update =>
        update.engineer ===
          audit.engineer &&
        update.field ===
          "lastInspectionDate" &&
        update.newValue ===
          audit.auditDate
    );


  /*
    If we found the matching update,
    restore the engineer's original
    spreadsheet Last Inspection Date.
  */
  if (pendingUpdate) {
    const engineerRecord =
      (
        hsAuditRegisterState.records ||
        []
      ).find(
        record =>
          record.engineer ===
            audit.engineer
      );

    if (engineerRecord) {
      engineerRecord.lastInspectionDate =
        pendingUpdate.oldValue || "";
    }


    /*
      Remove the now-unneeded pending
      spreadsheet update.
    */
    hsAuditPendingUpdates =
      (
        hsAuditPendingUpdates ||
        []
      ).filter(
        update =>
          update.id !==
            pendingUpdate.id
      );
  }


  /*
    Remove the permanent history record
    locally.
  */
  hsAuditHistory =
    (
      hsAuditHistory ||
      []
    ).filter(
      item =>
        item.id !== auditId
    );


  saveHsAuditHistoryLocal();
  saveHsAuditRegisterState();
  saveHsAuditPendingUpdatesLocal();


  /*
    Remove the same record from Firebase
    and sync the restored register.
  */
  if (cloudSignedIn()) {
    try {
      const user =
        getUser();

      await hsAuditHistoryCloudCol(
        user.uid
      )
        .doc(
          String(auditId)
        )
        .delete();

      await Promise.all([
        syncHsAuditRegisterToCloud(),
        saveHsAuditPendingUpdatesToCloud()
      ]);

    } catch (error) {
      console.error(
        "H&S audit deletion Firebase sync failed:",
        error
      );

      alert(
        "The audit was deleted locally, but Firebase sync needs attention."
      );
    }
  }


  renderHsAuditRegister();
  renderHsAuditPendingUpdates();
  renderHsAuditHistory();
  renderHsAuditOverview();

  alert(
    "Audit deleted. The engineer's previous Last Inspection Date has been restored where possible."
  );
}
function renderHsAuditHistory() {
  populateHsAuditHistoryEngineerFilter();


  const records =
    getFilteredHsAuditHistory();


  const count =
    el(
      "hsAuditHistoryCount"
    );


  if (count) {
    count.textContent =
      `${records.length} of ${
        (
          hsAuditHistory ||
          []
        ).length
      } audit${
        (
          hsAuditHistory ||
          []
        ).length === 1
          ? ""
          : "s"
      } shown`;
  }


  const body =
    el(
      "hsAuditHistoryTableBody"
    );


  if (!body) {
    return;
  }


  if (!records.length) {
    body.innerHTML = `
      <tr>
        <td
          colspan="9"
          class="hs-calibration-empty"
        >
          ${
            (
              hsAuditHistory ||
              []
            ).length
              ? "No audits match the selected filters."
              : "No H&S audits recorded yet."
          }
        </td>
      </tr>
    `;


    renderHsAuditOverview();

    return;
  }


  body.innerHTML =
    records
      .map(
        audit => {
          const isFailure =
            audit.result ===
            "FAIL";


          const isOpen =
            isFailure &&
            audit.resolved !==
              true;


          const statusLabel =
            !isFailure
              ? "Complete"
              : isOpen
                ? "Open"
                : "Resolved";


          const statusClass =
            isOpen
              ? "hs-audit-history-open"
              : "hs-audit-history-closed";


          return `
            <tr>

              <td>
                ${escapeHtml(
                  audit.auditDate
                    ? formatDate(
                        audit.auditDate
                      )
                    : "—"
                )}
              </td>


              <td>
                <strong>
                  ${escapeHtml(
                    audit.engineer ||
                    "—"
                  )}
                </strong>
              </td>


              <td>
                <span
                  class="
                    hs-audit-history-result
                    ${
                      audit.result ===
                        "PASS"
                        ? "hs-audit-history-pass"
                        : "hs-audit-history-fail"
                    }
                  "
                >
                  ${escapeHtml(
                    audit.result ||
                    "—"
                  )}
                </span>
              </td>


              <td>
                <div class="hs-audit-history-text">
                  ${escapeHtml(
                    audit.reason ||
                    "—"
                  )}
                </div>
              </td>


              <td>
                <div class="hs-audit-history-text">
                  ${escapeHtml(
                    audit.notes ||
                    "—"
                  )}
                </div>
              </td>


              <td>
                ${
                  audit.followUpRequired
                    ? "Required"
                    : "No"
                }
              </td>


              <td>
                <span
                  class="
                    hs-audit-history-status
                    ${statusClass}
                  "
                >
                  ${statusLabel}
                </span>
              </td>


              <td>
                ${
                  audit.resolvedAt
                    ? `
                        ${escapeHtml(
                          formatDate(
                            audit.resolvedAt
                          )
                        )}

                        ${
                          audit.resolutionNote
                            ? `
                                <div
                                  class="hs-audit-history-resolution-note"
                                >
                                  ${escapeHtml(
                                    audit.resolutionNote
                                  )}
                                </div>
                              `
                            : ""
                        }
                      `
                    : "—"
                }
              </td>


              <td>
  ${
    isOpen
      ? `
          <button
            type="button"
            class="btn small"
            data-hs-audit-resolve="${escapeHtml(
              audit.id
            )}"
          >
            Resolve
          </button>
        `
      : ""
  }

  <button
    type="button"
    class="btn danger small"
    data-hs-audit-delete="${escapeHtml(
      audit.id
    )}"
  >
    Delete
  </button>
</td>

            </tr>
          `;
        }
      )
      .join("");


  body
    .querySelectorAll(
      "[data-hs-audit-resolve]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            resolveHsAuditRecord(
              button.dataset
                .hsAuditResolve
            );
          }
        );
      }
    );
body
  .querySelectorAll(
    "[data-hs-audit-delete]"
  )
  .forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          deleteHsAuditRecord(
            button.dataset
              .hsAuditDelete
          );
        }
      );
    }
  );

  renderHsAuditOverview();
}
function renderHsAuditRegister() {
  const records =
    hsAuditRegisterState.records ||
    [];


  const filtered =
    getFilteredHsAuditRegisterRecords();


  const counts =
    getHsAuditRegisterCounts();


  const kpis =
    el(
      "hsAuditKpis"
    );


  if (kpis) {
    kpis.innerHTML = `
      <button
        type="button"
        class="hs-calibration-kpi"
        data-hs-audit-status=""
      >
        <span>Engineers</span>
        <strong>${counts.total}</strong>
      </button>

      <button
        type="button"
        class="
          hs-calibration-kpi
          hs-calibration-kpi-good
        "
        data-hs-audit-status="current"
      >
        <span>Current</span>
        <strong>${counts.current}</strong>
      </button>

      <button
        type="button"
        class="
          hs-calibration-kpi
          hs-calibration-kpi-warning
        "
        data-hs-audit-status="due"
      >
        <span>Due this month</span>
        <strong>${counts.due}</strong>
      </button>

      <button
        type="button"
        class="
          hs-calibration-kpi
          hs-calibration-kpi-danger
        "
        data-hs-audit-status="overdue"
      >
        <span>Overdue</span>
        <strong>${counts.overdue}</strong>
      </button>
    `;


    kpis
      .querySelectorAll(
        "[data-hs-audit-status]"
      )
      .forEach(
        button => {
          button.addEventListener(
            "click",
            () => {
              const select =
                el(
                  "hsAuditStatusFilter"
                );


              if (!select) {
                return;
              }


              select.value =
                button.dataset
                  .hsAuditStatus ||
                "";


              renderHsAuditRegister();
            }
          );
        }
      );
  }


  const countElement =
    el(
      "hsAuditRecordCount"
    );


  if (countElement) {
    countElement.textContent =
      `${filtered.length} of ` +
      `${records.length} engineer${
        records.length === 1
          ? ""
          : "s"
      } shown`;
  }


  const importStatus =
    el(
      "hsAuditImportStatus"
    );


  if (importStatus) {
    const meta =
      hsAuditRegisterState
        .importMeta;


    if (!meta) {
      importStatus.textContent =
        "No H&S audit workbook imported.";
    } else {
      const imported =
        new Date(
          meta.importedAt
        );


      importStatus.textContent =
        `Last refreshed: ${
          Number.isNaN(
            imported.getTime()
          )
            ? "Unknown"
            : imported
                .toLocaleString(
                  "en-GB"
                )
        } • ` +
        `${meta.recordCount} engineers • ` +
        `${meta.fileName} • ` +
        `Sheet: ${meta.sheetName}`;
    }
  }


  const body =
    el(
      "hsAuditTableBody"
    );


  if (!body) {
    return;
  }


  if (!filtered.length) {
    body.innerHTML = `
      <tr>
        <td
          colspan="14"
          class="hs-calibration-empty"
        >
          ${
            records.length
              ? "No engineers match the selected filters."
              : "Import your H&S register workbook to build the register."
          }
        </td>
      </tr>
    `;

    return;
  }


  body.innerHTML =
    filtered
      .map(
        record => {
          const due =
            getHsAuditDueMonth(
              record.lastInspectionDate
            );


          const status =
            getHsAuditScheduleStatus(
              record.lastInspectionDate
            );


          return `
            <tr>

              <td>
                <strong>
                  ${escapeHtml(
                    record.engineer ||
                    "—"
                  )}
                </strong>
              </td>

              <td>
                ${escapeHtml(
                  record.clockNumber ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  record.gasSafeNumber ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  record.vehicleReg ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  record.lastInspectionDate
                    ? formatDate(
                        record.lastInspectionDate
                      )
                    : "—"
                )}
              </td>

              <td>
                <strong>
                  ${escapeHtml(
                    due?.label ||
                    "—"
                  )}
                </strong>
              </td>

              <td>
                <span
                  class="
                    hs-calibration-status
                    hs-calibration-status-${status.tone}
                  "
                >
                  ${escapeHtml(
                    status.label
                  )}
                </span>
              </td>

              <td>
                ${escapeHtml(
                  record.telescopics ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  record.steps ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  record.hopUp ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  record.firstAidKit ||
                  "—"
                )}
              </td>

              <td>
                ${escapeHtml(
                  record.fireExtinguisher ||
                  "—"
                )}
              </td>

                           <td>
                ${escapeHtml(
                  record.notes ||
                  "—"
                )}
              </td>

              <td>
  <div class="hs-audit-row-actions">

    <button
      type="button"
      class="btn small"
      data-hs-record-audit="${escapeHtml(
        record.id
      )}"
    >
      Record Audit
    </button>

    <button
      type="button"
      class="btn ghost small"
      data-hs-audit-edit="${escapeHtml(
        record.id
      )}"
    >
      Edit
    </button>

  </div>
</td>

            </tr>
          `;
        }
           )
      .join("");

body
  .querySelectorAll(
    "[data-hs-record-audit]"
  )
  .forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          openHsAuditRecordModal(
            button.dataset
              .hsRecordAudit
          );
        }
      );
    }
  );
  body
    .querySelectorAll(
      "[data-hs-audit-edit]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            openHsAuditEditor(
              button.dataset
                .hsAuditEdit
            );
          }
        );
      }
    );
}
function findOptionalHsCalibrationColumn(
  headerRow,
  alternatives
) {
  const normalized =
    (headerRow || [])
      .map(
        normalizeWorkbookText
      );

  return normalized.findIndex(
    value =>
      alternatives.some(
        alternative =>
          value === alternative ||
          value.includes(
            alternative
          )
      )
  );
}


function importHsCalibrationRecords(
  workbook,
  sourceFileName
) {
  const located =
    locateHsCalibrationSheet(
      workbook
    );

  if (!located) {
    throw new Error(
      "A calibration worksheet could not be found.\n\n" +
      "The app looked for Analyser Code, Assigned Engineer and Calibration Due Date headings."
    );
  }

  const {
    rows,
    header,
    sheetName
  } = located;

  const headerRow =
    rows[
      header.rowIndex
    ] || [];

  const modelIndex =
    findOptionalHsCalibrationColumn(
      headerRow,
      [
        "model",
        "analyser model",
        "analyzer model",
        "make model"
      ]
    );

  const emailIndex =
    findOptionalHsCalibrationColumn(
      headerRow,
      [
        "email",
        "email address"
      ]
    );

  const imported = [];

  for (
    let rowIndex =
      header.rowIndex + 1;

    rowIndex < rows.length;

    rowIndex++
  ) {
    const row =
      rows[rowIndex] || [];

    const analyserCode =
      String(
        row[
          header.indexes
            .analyserCode
        ] ?? ""
      ).trim();

    const engineer =
      String(
        row[
          header.indexes
            .engineer
        ] ?? ""
      ).trim();

    const dueDate =
      workbookDateToIso(
        row[
          header.indexes
            .dueDate
        ]
      );

    const model =
      modelIndex >= 0
        ? String(
            row[
              modelIndex
            ] ?? ""
          ).trim()
        : "";

    const email =
      emailIndex >= 0
        ? String(
            row[
              emailIndex
            ] ?? ""
          ).trim()
        : "";

    /*
      Ignore completely blank rows.
    */
    if (
      !analyserCode &&
      !engineer &&
      !dueDate &&
      !model
    ) {
      continue;
    }

    /*
      A usable calibration record needs an
      analyser code and due date.
    */
    if (
      !analyserCode ||
      !dueDate
    ) {
      console.warn(
        `Calibration row ${
          rowIndex + 1
        } on "${sheetName}" was skipped because the analyser code or calibration due date was missing.`
      );

      continue;
    }

    imported.push({
      id:
        `hs-calibration-` +
        `${normalizePerformanceSourceName(
          analyserCode
        ) || rowIndex}`,

      analyserCode,
      engineer,
      model,
      dueDate,
      email,

      sourceFile:
        sourceFileName,

      sourceSheet:
        sheetName
    });
  }

  return {
    records: imported,
    sheetName
  };
}

function applyPendingHsCalibrationUpdates(
  records
) {
  const result =
    (records || []).map(
      record => ({
        ...record
      })
    );


  hsCalibrationPendingUpdates
    .slice()
    .sort(
      (a, b) =>
        String(
          a.changedAt || ""
        ).localeCompare(
          String(
            b.changedAt || ""
          )
        )
    )
    .forEach(
      update => {
        const record =
          result.find(
            item =>
              item.analyserCode ===
              update.analyserCode
          );


        if (!record) {
          return;
        }


        if (
          update.field ===
          "engineer"
        ) {
          record.engineer =
            update.newValue;
        }


        if (
          update.field ===
          "dueDate"
        ) {
          record.dueDate =
            update.newValue;
        }
      }
    );


  return result;
}
async function importHsCalibrationWorkbook(
  file
) {
  if (!window.XLSX) {
    throw new Error(
      "The Excel import library has not loaded."
    );
  }

  if (!file) {
    throw new Error(
      "No workbook was selected."
    );
  }

  const buffer =
    await file.arrayBuffer();

  const workbook =
    window.XLSX.read(
      buffer,
      {
        type: "array",
        cellDates: true
      }
    );

  const result =
    importHsCalibrationRecords(
      workbook,
      file.name
    );

  if (!result.records.length) {
    throw new Error(
      "The calibration worksheet was found, but no valid analyser records could be imported."
    );
  }

  /*
    Calibration is a current register rather
    than a historical archive.

    Every successful upload replaces the
    previous register completely.
  */
  hsCalibrationState.records =
  applyPendingHsCalibrationUpdates(
    result.records
  );

  hsCalibrationState.importMeta = {
    fileName:
      file.name,

    sheetName:
      result.sheetName,

    importedAt:
      new Date()
        .toISOString(),

    recordCount:
      result.records.length
  };

  saveHsCalibrationState();

  renderHsCalibration();

  return result.records.length;
}


function getFilteredHsCalibrationRecords() {
  const engineer =
    el("hsCalibrationEngineer")
      ?.value || "";

  const status =
    el("hsCalibrationStatus")
      ?.value || "";

  const model =
    el("hsCalibrationModel")
      ?.value || "";

  const search =
    (
      el(
        "hsCalibrationSearch"
      )?.value || ""
    )
      .trim()
      .toLowerCase();

  return (
    hsCalibrationState.records ||
    []
  )
    .filter(record => {
      const currentStatus =
        getHsCalibrationStatus(
          record.dueDate
        );

      if (
        engineer &&
        record.engineer !== engineer
      ) {
        return false;
      }

      if (
        status &&
        currentStatus.key !== status
      ) {
        return false;
      }

      if (
        model &&
        record.model !== model
      ) {
        return false;
      }

      if (search) {
        const haystack = `
          ${record.analyserCode || ""}
          ${record.engineer || ""}
          ${record.model || ""}
          ${record.email || ""}
          ${record.sourceFile || ""}
        `.toLowerCase();

        if (
          !haystack.includes(search)
        ) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) =>
      String(
        a.dueDate || ""
      ).localeCompare(
        String(
          b.dueDate || ""
        )
      )
    );
}


function populateHsCalibrationFilters() {
  const records =
    hsCalibrationState.records ||
    [];

  const engineerSelect =
    el("hsCalibrationEngineer");

  const modelSelect =
    el("hsCalibrationModel");

  if (
    !engineerSelect ||
    !modelSelect
  ) {
    return;
  }

  const currentEngineer =
    engineerSelect.value;

  const currentModel =
    modelSelect.value;

  const engineers = [
    ...new Set(
      records
        .map(record =>
          record.engineer
        )
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b)
  );

  const models = [
    ...new Set(
      records
        .map(record =>
          record.model
        )
        .filter(Boolean)
    )
  ].sort((a, b) =>
    a.localeCompare(b)
  );

  engineerSelect.innerHTML =
    `
      <option value="">
        All engineers
      </option>
    ` +
    engineers
      .map(engineer => `
        <option
          value="${escapeHtml(
            engineer
          )}"
        >
          ${escapeHtml(
            engineer
          )}
        </option>
      `)
      .join("");

  modelSelect.innerHTML =
    `
      <option value="">
        All models
      </option>
    ` +
    models
      .map(model => `
        <option
          value="${escapeHtml(
            model
          )}"
        >
          ${escapeHtml(model)}
        </option>
      `)
      .join("");

  if (
    engineers.includes(
      currentEngineer
    )
  ) {
    engineerSelect.value =
      currentEngineer;
  }

  if (
    models.includes(
      currentModel
    )
  ) {
    modelSelect.value =
      currentModel;
  }
}


function getHsCalibrationCounts() {
  const records =
    hsCalibrationState.records ||
    [];

  const counts = {
    total:
      records.length,

    expired: 0,
    due30: 0,
    due90: 0,
    current: 0,
    unknown: 0
  };

  records.forEach(record => {
    const status =
      getHsCalibrationStatus(
        record.dueDate
      );

    if (
      status.key === "expired"
    ) {
      counts.expired++;
    } else if (
      status.key === "30"
    ) {
      counts.due30++;
    } else if (
      status.key === "90"
    ) {
      counts.due90++;
    } else if (
      status.key === "current"
    ) {
      counts.current++;
    } else {
      counts.unknown++;
    }
  });

  return counts;
}


function renderHsCalibrationOverview() {
  const counts =
    getHsCalibrationCounts();

  /*
    Populate the Calibration KPI on the
    main H&S Overview.

    This card specifically says
    "Due within 30 days", so expired units
    are not included in this number.
  */
  const overviewDue =
    el(
      "hsOverviewCalibrationDue"
    );

  if (overviewDue) {
    overviewDue.textContent =
      counts.due30;
  }

 const attentionList =
  el(
    "hsAttentionList"
  );


if (!attentionList) {
  return;
}


/*
  CALIBRATION ITEMS
*/
const urgentCalibration =
  (
    hsCalibrationState.records ||
    []
  )
    .map(
      record => ({
        type:
          "calibration",

        record,

        days:
          hsCalibrationDaysLeft(
            record.dueDate
          )
      })
    )
    .filter(
      item =>
        item.days !== null &&
        item.days <= 30
    );


/*
  UNRESOLVED FAILED H&S AUDITS
*/
const openAuditFailures =
  typeof getOpenHsAuditFailures ===
    "function"
    ? getOpenHsAuditFailures()
        .map(
          audit => ({
            type:
              "audit",

            audit
          })
        )
    : [];


const attentionItems = [
  ...openAuditFailures,
  ...urgentCalibration
]
  .slice(
    0,
    8
  );


if (
  !attentionItems.length
) {
  attentionList.innerHTML = `
    <div class="hs-good-state">

      <span class="hs-good-icon">
        ✓
      </span>

      <div>
        <strong>
          Nothing requiring attention
        </strong>

        <span>
          No unresolved failed H&S audits or urgent calibration items.
        </span>
      </div>

    </div>
  `;


  return;
}


attentionList.innerHTML =
  attentionItems
    .map(
      item => {

        /*
          FAILED H&S AUDIT
        */
        if (
          item.type ===
          "audit"
        ) {
          const audit =
            item.audit;


          return `
            <button
              type="button"
              class="
                hs-attention-item
                hs-attention-danger
              "
              data-hs-attention-audit="${escapeHtml(
                audit.id
              )}"
            >

              <span
                class="hs-attention-dot"
              ></span>

              <span>

                <strong>
                  ${escapeHtml(
                    audit.engineer ||
                    "Engineer"
                  )}
                  • Failed H&amp;S audit
                </strong>

                <small>
                  ${escapeHtml(
                    audit.reason ||
                    "No failure reason recorded"
                  )}
                </small>

                <small>
                  ${escapeHtml(
                    audit.auditDate
                      ? formatDate(
                          audit.auditDate
                        )
                      : "Unknown date"
                  )}
                  • Follow-up required
                </small>

              </span>

              <span class="hs-arrow">
                →
              </span>

            </button>
          `;
        }


        /*
          CALIBRATION
        */
        const record =
          item.record;


        const days =
          item.days;


        const status =
          getHsCalibrationStatus(
            record.dueDate
          );


        const timing =
          days < 0
            ? `${Math.abs(
                days
              )} day${
                Math.abs(
                  days
                ) === 1
                  ? ""
                  : "s"
              } overdue`
            : days === 0
              ? "Due today"
              : `Due in ${days} day${
                  days === 1
                    ? ""
                    : "s"
                }`;


        return `
          <button
            type="button"
            class="
              hs-attention-item
              hs-attention-${status.tone}
            "
            data-hs-calibration-code="${escapeHtml(
              record.analyserCode
            )}"
          >

            <span
              class="hs-attention-dot"
            ></span>

            <span>

              <strong>
                ${escapeHtml(
                  record.analyserCode
                )}
              </strong>

              <small>
                ${escapeHtml(
                  record.model ||
                  "Analyser"
                )}
                •
                ${escapeHtml(
                  record.engineer ||
                  "No engineer assigned"
                )}
              </small>

              <small>
                ${escapeHtml(
                  timing
                )}
                •
                ${escapeHtml(
                  formatDate(
                    record.dueDate
                  )
                )}
              </small>

            </span>

            <span class="hs-arrow">
              →
            </span>

          </button>
        `;
      }
    )
    .join("");


attentionList
  .querySelectorAll(
    "[data-hs-calibration-code]"
  )
  .forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          setHealthSafetyTab(
            "calibration"
          );


          const search =
            el(
              "hsCalibrationSearch"
            );


          if (search) {
            search.value =
              button.dataset
                .hsCalibrationCode ||
              "";


            renderHsCalibration();
          }
        }
      );
    }
  );


attentionList
  .querySelectorAll(
    "[data-hs-attention-audit]"
  )
  .forEach(
    button => {
      button.addEventListener(
        "click",
        () => {
          setHealthSafetyTab(
            "audits"
          );


          const resolution =
            el(
              "hsAuditHistoryResolution"
            );


          if (resolution) {
            resolution.value =
              "open";
          }


          renderHsAuditHistory();


          el(
            "hsAuditHistoryTableBody"
          )?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "start"
          });
        }
      );
    }
  );
}

function updateHsCalibrationPendingBadge() {
  const badge =
    el(
      "hsCalibrationPendingCount"
    );


  if (!badge) {
    return;
  }


  const count =
    hsCalibrationPendingUpdates
      .length;


  badge.textContent =
    String(count);


  badge.classList.toggle(
    "hidden",
    count === 0
  );
}


function formatHsCalibrationPendingField(
  field
) {
  if (
    field === "engineer"
  ) {
    return "Assigned engineer";
  }


  if (
    field === "dueDate"
  ) {
    return "Calibration due";
  }


  return field;
}


function formatHsCalibrationPendingValue(
  field,
  value
) {
  if (
    field === "dueDate"
  ) {
    return value
      ? formatDate(value)
      : "—";
  }


  return String(
    value || "—"
  );
}


function renderHsCalibrationPendingUpdates() {
  updateHsCalibrationPendingBadge();


  const body =
    el(
      "hsCalibrationPendingTableBody"
    );


  const empty =
    el(
      "hsCalibrationPendingEmpty"
    );


  const wrap =
    el(
      "hsCalibrationPendingTableWrap"
    );


  const markAllButton =
    el(
      "hsCalibrationMarkAllCompleteBtn"
    );


  const pending =
    hsCalibrationPendingUpdates
      .slice()
      .sort(
        (a, b) =>
          String(
            b.changedAt || ""
          ).localeCompare(
            String(
              a.changedAt || ""
            )
          )
      );


  if (empty) {
    empty.classList.toggle(
      "hidden",
      pending.length > 0
    );
  }


  if (wrap) {
    wrap.classList.toggle(
      "hidden",
      pending.length === 0
    );
  }


  if (markAllButton) {
    markAllButton.disabled =
      pending.length === 0;
  }


  if (!body) {
    return;
  }


  body.innerHTML =
    pending
      .map(
        update => {
          const changed =
            update.changedAt
              ? new Date(
                  update.changedAt
                ).toLocaleString(
                  "en-GB"
                )
              : "—";


          return `
            <tr>
              <td>
                ${escapeHtml(
                  changed
                )}
              </td>

              <td>
                <strong>
                  ${escapeHtml(
                    update.analyserCode ||
                    "—"
                  )}
                </strong>
              </td>

              <td>
                ${escapeHtml(
                  formatHsCalibrationPendingField(
                    update.field
                  )
                )}
              </td>

              <td>
                ${escapeHtml(
                  formatHsCalibrationPendingValue(
                    update.field,
                    update.oldValue
                  )
                )}
              </td>

              <td>
                <strong>
                  ${escapeHtml(
                    formatHsCalibrationPendingValue(
                      update.field,
                      update.newValue
                    )
                  )}
                </strong>
              </td>

              <td>
                <button
                  type="button"
                  class="btn ghost small"
                  data-calibration-update-complete="${escapeHtml(
                    update.id
                  )}"
                >
                  Updated in Excel
                </button>
              </td>
            </tr>
          `;
        }
      )
      .join("");


  body
    .querySelectorAll(
      "[data-calibration-update-complete]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          async () => {
            const id =
              button.dataset
                .calibrationUpdateComplete;


            hsCalibrationPendingUpdates =
              hsCalibrationPendingUpdates
                .filter(
                  update =>
                    update.id !== id
                );


            await saveHsCalibrationPendingUpdatesToCloud();


            renderHsCalibrationPendingUpdates();
          }
        );
      }
    );
}


function openHsCalibrationEdit(
  recordId
) {
  const record =
    (
      hsCalibrationState.records ||
      []
    ).find(
      item =>
        item.id ===
        recordId
    );


  if (!record) {
    return;
  }


  el(
    "hsCalibrationEditRecordId"
  ).value =
    record.id;


  el(
    "hsCalibrationEditCode"
  ).value =
    record.analyserCode ||
    "";


  el(
    "hsCalibrationEditModel"
  ).value =
    record.model ||
    "";


  el(
    "hsCalibrationEditEngineer"
  ).value =
    record.engineer ||
    "";


  el(
    "hsCalibrationEditDueDate"
  ).value =
    record.dueDate ||
    "";


  const status =
    el(
      "hsCalibrationEditStatus"
    );


  if (status) {
    status.textContent = "";
    status.className =
      "hs-alert-save-status";
  }


  el(
    "hsCalibrationEditModal"
  )?.classList.remove(
    "hidden"
  );
}


function closeHsCalibrationEdit() {
  el(
    "hsCalibrationEditModal"
  )?.classList.add(
    "hidden"
  );
}


async function saveHsCalibrationEdit() {
  const recordId =
    el(
      "hsCalibrationEditRecordId"
    )?.value;


  const record =
    (
      hsCalibrationState.records ||
      []
    ).find(
      item =>
        item.id ===
        recordId
    );


  if (!record) {
    return;
  }


  const newEngineer =
    String(
      el(
        "hsCalibrationEditEngineer"
      )?.value || ""
    ).trim();


  const newDueDate =
    String(
      el(
        "hsCalibrationEditDueDate"
      )?.value || ""
    ).trim();


  const status =
    el(
      "hsCalibrationEditStatus"
    );


  if (!newDueDate) {
    if (status) {
      status.textContent =
        "Calibration due date is required.";

      status.className =
        "hs-alert-save-status hs-alert-save-error";
    }

    return;
  }


  const changes =
    [];


  if (
    newEngineer !==
    String(
      record.engineer || ""
    )
  ) {
    changes.push({
      field: "engineer",
      oldValue:
        record.engineer || "",
      newValue:
        newEngineer
    });
  }


  if (
    newDueDate !==
    String(
      record.dueDate || ""
    )
  ) {
    changes.push({
      field: "dueDate",
      oldValue:
        record.dueDate || "",
      newValue:
        newDueDate
    });
  }


  if (!changes.length) {
    if (status) {
      status.textContent =
        "No changes were made.";

      status.className =
        "hs-alert-save-status hs-alert-save-warning";
    }

    return;
  }


  const changedAt =
    new Date()
      .toISOString();


  changes.forEach(
    change => {
      /*
        If the same analyser/field already
        has a pending update, retain the
        original Excel value but update
        the newest value.

        Example:
        Excel = Smith
        App change = Jones
        App change again = Porter

        Pending update remains:
        Smith -> Porter
      */
      const existing =
        hsCalibrationPendingUpdates
          .find(
            update =>
              update.analyserCode ===
                record.analyserCode &&
              update.field ===
                change.field
          );


      if (existing) {
        existing.newValue =
          change.newValue;

        existing.changedAt =
          changedAt;

        existing.sourceFile =
          record.sourceFile ||
          "";
      } else {
        hsCalibrationPendingUpdates
          .push({
            id:
              `hs-cal-change-${uid()}`,

            analyserCode:
              record.analyserCode,

            field:
              change.field,

            oldValue:
              change.oldValue,

            newValue:
              change.newValue,

            changedAt,

            sourceFile:
              record.sourceFile ||
              ""
          });
      }
    }
  );


  record.engineer =
    newEngineer;


  record.dueDate =
    newDueDate;


  saveHsCalibrationState();

  saveHsCalibrationPendingUpdatesLocal();


  renderHsCalibration();

  renderHsCalibrationPendingUpdates();


  if (status) {
    status.textContent =
      "Saving changes…";

    status.className =
      "hs-alert-save-status";
  }


  const [
    registerResult,
    pendingResult
  ] =
    await Promise.all([
      syncHsCalibrationToCloud(),
      saveHsCalibrationPendingUpdatesToCloud()
    ]);


  if (
    registerResult.synced &&
    pendingResult.saved
  ) {
    if (status) {
      status.textContent =
        "Changes saved to Firebase and added to Pending Excel Updates.";

      status.className =
        "hs-alert-save-status hs-alert-save-good";
    }


    setTimeout(
      closeHsCalibrationEdit,
      900
    );
  } else if (status) {
    status.textContent =
      "Changes saved locally. Firebase sync needs attention.";

    status.className =
      "hs-alert-save-status hs-alert-save-warning";
  }
}


function openHsCalibrationPendingUpdates() {
  renderHsCalibrationPendingUpdates();


  el(
    "hsCalibrationPendingModal"
  )?.classList.remove(
    "hidden"
  );
}


function closeHsCalibrationPendingUpdates() {
  el(
    "hsCalibrationPendingModal"
  )?.classList.add(
    "hidden"
  );
}


async function markAllHsCalibrationUpdatesComplete() {
  if (
    !hsCalibrationPendingUpdates
      .length
  ) {
    return;
  }


  const confirmed =
    confirm(
      `Mark all ${hsCalibrationPendingUpdates.length} pending calibration update${
        hsCalibrationPendingUpdates.length === 1
          ? ""
          : "s"
      } as transferred to Excel?`
    );


  if (!confirmed) {
    return;
  }


  hsCalibrationPendingUpdates =
    [];


  await saveHsCalibrationPendingUpdatesToCloud();


  renderHsCalibrationPendingUpdates();
}
function renderHsCalibration() {
  populateHsCalibrationFilters();

  const records =
    hsCalibrationState.records ||
    [];

  const filtered =
    getFilteredHsCalibrationRecords();

  const counts =
    getHsCalibrationCounts();

  const kpis =
    el("hsCalibrationKpis");

  if (kpis) {
    kpis.innerHTML = `
      <button
        type="button"
        class="hs-calibration-kpi"
        data-calibration-status=""
      >
        <span>Analysers</span>
        <strong>${counts.total}</strong>
      </button>

      <button
        type="button"
        class="
          hs-calibration-kpi
          hs-calibration-kpi-danger
        "
        data-calibration-status="expired"
      >
        <span>Expired</span>
        <strong>${counts.expired}</strong>
      </button>

      <button
        type="button"
        class="
          hs-calibration-kpi
          hs-calibration-kpi-danger
        "
        data-calibration-status="30"
      >
        <span>Due within 30 days</span>
        <strong>${counts.due30}</strong>
      </button>

      <button
        type="button"
        class="
          hs-calibration-kpi
          hs-calibration-kpi-warning
        "
        data-calibration-status="90"
      >
        <span>Due within 90 days</span>
        <strong>${counts.due90}</strong>
      </button>

      <button
        type="button"
        class="
          hs-calibration-kpi
          hs-calibration-kpi-good
        "
        data-calibration-status="current"
      >
        <span>Current</span>
        <strong>${counts.current}</strong>
      </button>
    `;

    kpis
      .querySelectorAll(
        "[data-calibration-status]"
      )
      .forEach(card => {
        card.addEventListener(
          "click",
          () => {
            const select =
              el(
                "hsCalibrationStatus"
              );

            if (!select) return;

            select.value =
              card.dataset
                .calibrationStatus ||
              "";

            renderHsCalibration();
          }
        );
      });
  }

  const countElement =
    el(
      "hsCalibrationRecordCount"
    );

  if (countElement) {
    countElement.textContent =
      `${filtered.length} of ` +
      `${records.length} analyser${
        records.length === 1
          ? ""
          : "s"
      } shown`;
  }

  const statusElement =
    el(
      "hsCalibrationImportStatus"
    );

  if (statusElement) {
    const meta =
      hsCalibrationState.importMeta;

    if (!meta) {
      statusElement.textContent =
        "No calibration workbook imported.";
    } else {
      const importedDate =
        new Date(
          meta.importedAt
        );

      statusElement.textContent =
        `Last refreshed: ${
          Number.isNaN(
            importedDate.getTime()
          )
            ? "Unknown"
            : importedDate
                .toLocaleString(
                  "en-GB"
                )
        } • ` +
        `${meta.recordCount} analysers • ` +
        `${meta.fileName} • ` +
        `Sheet: ${meta.sheetName}`;
    }
  }

  const tableBody =
    el(
      "hsCalibrationTableBody"
    );

  if (tableBody) {
    if (!filtered.length) {
      tableBody.innerHTML = `
        <tr>
          <td
            colspan="8"
            class="hs-calibration-empty"
          >
            ${
              records.length
                ? "No analysers match the selected filters."
                : "Import your calibration workbook to build the register."
            }
          </td>
        </tr>
      `;
    } else {
      tableBody.innerHTML =
        filtered
          .map(record => {
            const days =
              hsCalibrationDaysLeft(
                record.dueDate
              );

            const status =
              getHsCalibrationStatus(
                record.dueDate
              );

            return `
              <tr>
                <td>
                  <strong>
                    ${escapeHtml(
                      record.analyserCode
                    )}
                  </strong>
                </td>

                <td>
                  ${escapeHtml(
                    record.engineer ||
                    "—"
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    record.model ||
                    "—"
                  )}
                </td>

                <td>
                  ${escapeHtml(
                    formatDate(
                      record.dueDate
                    )
                  )}
                </td>

                <td>
                  ${
                    days === null
                      ? "—"
                      : days
                  }
                </td>

                <td>
                  <span
                    class="
                      hs-calibration-status
                      hs-calibration-status-${status.tone}
                    "
                  >
                    ${escapeHtml(
                      status.label
                    )}
                  </span>
                </td>

                               <td>
                  ${
                    record.email
                      ? `
                          <a
                            href="mailto:${escapeHtml(
                              record.email
                            )}"
                            class="hs-calibration-email"
                          >
                            ${escapeHtml(
                              record.email
                            )}
                          </a>
                        `
                      : "—"
                  }
                </td>

                <td>
                  <button
                    type="button"
                    class="btn ghost small hs-calibration-edit-btn"
                    data-calibration-edit="${escapeHtml(
                      record.id
                    )}"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            `;
                })
          .join("");


      tableBody
        .querySelectorAll(
          "[data-calibration-edit]"
        )
        .forEach(
          button => {
            button.addEventListener(
              "click",
              () => {
                openHsCalibrationEdit(
                  button.dataset
                    .calibrationEdit
                );
              }
            );
          }
        );
    }
  }

  renderHsCalibrationOverview();
}


function clearHsCalibrationFilters() {
  if (
    el("hsCalibrationEngineer")
  ) {
    el(
      "hsCalibrationEngineer"
    ).value = "";
  }

  if (
    el("hsCalibrationStatus")
  ) {
    el(
      "hsCalibrationStatus"
    ).value = "";
  }

  if (
    el("hsCalibrationModel")
  ) {
    el(
      "hsCalibrationModel"
    ).value = "";
  }

  if (
    el("hsCalibrationSearch")
  ) {
    el(
      "hsCalibrationSearch"
    ).value = "";
  }

  renderHsCalibration();
}


function populateHsCalibrationAlertForm() {
  const enabled =
    el(
      "hsCalibrationAlertsEnabled"
    );

  const recipient =
    el(
      "hsCalibrationAlertRecipient"
    );

  const cc =
    el(
      "hsCalibrationAlertCc"
    );

  const ccEngineer =
    el(
      "hsCalibrationCcEngineer"
    );

  const time =
    el(
      "hsCalibrationAlertTime"
    );

  if (enabled) {
    enabled.checked =
      hsCalibrationAlertSettings
        .enabled;
  }

  if (recipient) {
    recipient.value =
      hsCalibrationAlertSettings
        .recipient;
  }

  if (cc) {
    cc.value =
      hsCalibrationAlertSettings
        .cc;
  }

  if (ccEngineer) {
    ccEngineer.checked =
      hsCalibrationAlertSettings
        .ccAssignedEngineer;
  }

  if (time) {
    time.value =
      hsCalibrationAlertSettings
        .dailyCheckTime ||
      "08:00";
  }

  const status =
    el(
      "hsCalibrationAlertSaveStatus"
    );

  if (status) {
    status.textContent = "";
  }
}


function openHsCalibrationAlertSettings() {
  populateHsCalibrationAlertForm();

  el(
    "hsCalibrationAlertModal"
  )?.classList.remove(
    "hidden"
  );
}


function closeHsCalibrationAlertSettings() {
  el(
    "hsCalibrationAlertModal"
  )?.classList.add(
    "hidden"
  );
}


function isValidHsAlertEmail(
  value
) {
  const email =
    String(value || "").trim();

  if (!email) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);
}


function validateHsCcEmails(
  value
) {
  const addresses =
    String(value || "")
      .split(",")
      .map(item =>
        item.trim()
      )
      .filter(Boolean);

  return addresses.every(
    isValidHsAlertEmail
  );
}


async function saveHsCalibrationAlertSettingsFromForm() {
  const enabled =
    el(
      "hsCalibrationAlertsEnabled"
    )?.checked === true;

  const recipient =
    String(
      el(
        "hsCalibrationAlertRecipient"
      )?.value || ""
    ).trim();

  const cc =
    String(
      el(
        "hsCalibrationAlertCc"
      )?.value || ""
    ).trim();

  const ccAssignedEngineer =
    el(
      "hsCalibrationCcEngineer"
    )?.checked === true;

  const dailyCheckTime =
    el(
      "hsCalibrationAlertTime"
    )?.value ||
    "08:00";

  const status =
    el(
      "hsCalibrationAlertSaveStatus"
    );

  if (
    enabled &&
    !isValidHsAlertEmail(
      recipient
    )
  ) {
    if (status) {
      status.textContent =
        "Enter a valid primary recipient email address before enabling alerts.";

      status.className =
        "hs-alert-save-status hs-alert-save-error";
    }

    return;
  }

  if (
    cc &&
    !validateHsCcEmails(cc)
  ) {
    if (status) {
      status.textContent =
        "One or more CC email addresses are not valid. Separate multiple addresses with commas.";

      status.className =
        "hs-alert-save-status hs-alert-save-error";
    }

    return;
  }

  hsCalibrationAlertSettings.enabled =
    enabled;

  hsCalibrationAlertSettings.recipient =
    recipient;

  hsCalibrationAlertSettings.cc =
    cc;

  hsCalibrationAlertSettings
    .ccAssignedEngineer =
      ccAssignedEngineer;

  hsCalibrationAlertSettings
    .dailyCheckTime =
      dailyCheckTime;

  hsCalibrationAlertSettings.thresholds =
    [
      30,
      14,
      7,
      0
    ];

  if (status) {
    status.textContent =
      "Saving alert settings…";

    status.className =
      "hs-alert-save-status";
  }

  const result =
    await saveHsCalibrationAlertSettingsToCloud();

  if (result.saved) {
    if (status) {
      status.textContent =
        enabled
          ? "Alert settings saved to Firebase. Automatic alerts are configured, but the scheduled sender still needs to be activated."
          : "Alert settings saved. Automatic calibration emails are currently disabled.";

      status.className =
        "hs-alert-save-status hs-alert-save-good";
    }

    setTimeout(
      closeHsCalibrationAlertSettings,
      1100
    );

    return;
  }

  if (
    result.reason ===
    "not-signed-in"
  ) {
    if (status) {
      status.textContent =
        "Settings saved locally. Log in to sync them to Firebase.";

      status.className =
        "hs-alert-save-status hs-alert-save-warning";
    }

    return;
  }

  if (status) {
    status.textContent =
      "Settings were saved locally, but Firebase could not be updated.";

    status.className =
      "hs-alert-save-status hs-alert-save-error";
  }
}


function initHsCalibrationAlertSettings() {
  el(
    "hsCalibrationAlertSettingsBtn"
  )?.addEventListener(
    "click",
    openHsCalibrationAlertSettings
  );

  el(
    "hsCalibrationAlertCloseBtn"
  )?.addEventListener(
    "click",
    closeHsCalibrationAlertSettings
  );

  el(
    "hsCalibrationAlertCancelBtn"
  )?.addEventListener(
    "click",
    closeHsCalibrationAlertSettings
  );

  el(
    "hsCalibrationAlertSaveBtn"
  )?.addEventListener(
    "click",
    saveHsCalibrationAlertSettingsFromForm
  );

  el(
    "hsCalibrationAlertModal"
  )?.addEventListener(
    "click",
    event => {
      if (
        event.target ===
        el(
          "hsCalibrationAlertModal"
        )
      ) {
        closeHsCalibrationAlertSettings();
      }
    }
  );

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Escape" &&
        !el(
          "hsCalibrationAlertModal"
        )?.classList.contains(
          "hidden"
        )
      ) {
        closeHsCalibrationAlertSettings();
      }
    }
  );
}


function initHsCalibration() {
  initHsCalibrationAlertSettings();


  el(
    "hsCalibrationPendingBtn"
  )?.addEventListener(
    "click",
    openHsCalibrationPendingUpdates
  );


  el(
    "hsCalibrationEditCloseBtn"
  )?.addEventListener(
    "click",
    closeHsCalibrationEdit
  );


  el(
    "hsCalibrationEditCancelBtn"
  )?.addEventListener(
    "click",
    closeHsCalibrationEdit
  );


  el(
    "hsCalibrationEditSaveBtn"
  )?.addEventListener(
    "click",
    saveHsCalibrationEdit
  );


  el(
    "hsCalibrationPendingCloseBtn"
  )?.addEventListener(
    "click",
    closeHsCalibrationPendingUpdates
  );


  el(
    "hsCalibrationPendingCloseFooterBtn"
  )?.addEventListener(
    "click",
    closeHsCalibrationPendingUpdates
  );


  el(
    "hsCalibrationMarkAllCompleteBtn"
  )?.addEventListener(
    "click",
    markAllHsCalibrationUpdatesComplete
  );


  renderHsCalibrationPendingUpdates();

setTimeout(
  checkHsCalibrationStartupAlerts,
  700
);

const importButton =
    el(
      "hsCalibrationImportBtn"
    );

  const input =
    el(
      "hsCalibrationWorkbookInput"
    );

  importButton?.addEventListener(
    "click",
    () => input?.click()
  );

  input?.addEventListener(
    "change",
    async event => {
      const file =
        event.target.files?.[0];

      if (!file) return;

      const originalText =
        importButton?.textContent ||
        "Import Calibration Workbook";

      try {
        if (importButton) {
          importButton.disabled = true;

          importButton.textContent =
            "Importing…";
        }

        const existingCount =
          hsCalibrationState
            .records.length;

        if (existingCount) {
          const confirmed =
            window.confirm(
              `The app currently holds ${existingCount} analyser record${
                existingCount === 1
                  ? ""
                  : "s"
              }.\n\n` +
              "Importing this workbook will replace the current calibration register with the latest spreadsheet data.\n\nContinue?"
            );

          if (!confirmed) {
            return;
          }
        }

        const importedCount =
  await importHsCalibrationWorkbook(
    file
  );

const cloudResult =
  await syncHsCalibrationToCloud();

setTimeout(
  checkHsCalibrationStartupAlerts,
  300
);

alert(
          `${importedCount} analyser record${
            importedCount === 1
              ? ""
              : "s"
          } imported successfully.\n\n` +
          "Days left and calibration status have been recalculated by the app.\n\n" +
(
  cloudResult.synced
    ? "Firebase cloud register updated successfully."
    : cloudResult.reason ===
        "not-signed-in"
      ? "Calibration data is saved locally. Log in to sync it to Firebase."
      : "Calibration data was imported locally, but Firebase sync needs attention."
)
        );
      } catch (error) {
        console.error(
          "Calibration import failed",
          error
        );

        alert(
          `The calibration register could not be imported:\n\n${
            error?.message ||
            error
          }`
        );
      } finally {
        if (importButton) {
          importButton.disabled = false;

          importButton.textContent =
            originalText;
        }

        event.target.value = "";
      }
    }
  );

  [
    "hsCalibrationEngineer",
    "hsCalibrationStatus",
    "hsCalibrationModel"
  ].forEach(id => {
    el(id)?.addEventListener(
      "change",
      renderHsCalibration
    );
  });

  el("hsCalibrationSearch")
    ?.addEventListener(
      "input",
      renderHsCalibration
    );

  el(
    "hsCalibrationClearFiltersBtn"
  )?.addEventListener(
    "click",
    clearHsCalibrationFilters
  );

  renderHsCalibration();
}

// =========================================================
// H&S WARNING NOTICE COMPLIANCE
// =========================================================
const hsWarningManagerState = {
  selectedIds:
    new Set(),

  source: "",

  engineer: "",

  result: "",

  search: ""
};
const hsWarningFilters = {
  period: "all",
  dateFrom: "",
  dateTo: "",
  engineer: "",
  result: "",
  source: "",
  search: ""
};


function normalizeHsWarningResult(
  value
) {
  const text =
    String(value || "")
      .trim()
      .toUpperCase();

  if (
    text.includes("FAIL") ||
    text === "NO" ||
    text === "INCORRECT"
  ) {
    return "FAIL";
  }

  if (
    text.includes("PASS") ||
    text === "YES" ||
    text === "CORRECT"
  ) {
    return "PASS";
  }

  return "";
}


function hsWarningSourceKey(
  filename
) {
  return String(
    filename || ""
  )
    .trim()
    .toLowerCase();
}


function findOptionalHsWarningColumn(
  headerRow,
  alternatives
) {
  const normalized =
    (headerRow || []).map(
      value =>
        normalizeWorkbookText(
          value
        )
    );

  for (
    const alternative of
    alternatives
  ) {
    const target =
      normalizeWorkbookText(
        alternative
      );

    const index =
      normalized.findIndex(
        value =>
          value === target ||
          value.includes(target)
      );

    if (index >= 0) {
      return index;
    }
  }

  return -1;
}


function locateHsWarningSheet(
  workbook
) {
  for (
    const sheetName of
    workbook.SheetNames || []
  ) {
    const sheet =
      workbook.Sheets[
        sheetName
      ];

    const rows =
      workbookRows(
        sheet
      );

    const header =
      findWorkbookHeader(
        rows,
        {
          address: [
            "address",
            "property address"
          ],

          engineer: [
            "engineer",
            "engineer name"
          ],

          result: [
            "compliant pass/fail",
            "compliant pass fail",
            "pass/fail",
            "pass fail",
            "compliant",
            "result"
          ]
        }
      );

    if (header) {
      return {
        sheetName,
        rows,
        header
      };
    }
  }

  return null;
}


function importHsWarningRecordsFromWorkbook(
  workbook,
  sourceFileName
) {
  const located =
    locateHsWarningSheet(
      workbook
    );

  if (!located) {
    throw new Error(
      "Could not find a Warning Notice sheet containing Address, Engineer and PASS/FAIL columns."
    );
  }


  const {
    sheetName,
    rows,
    header
  } = located;


  const headerRow =
    rows[
      header.rowIndex
    ] || [];


  const dateColumn =
    findOptionalHsWarningColumn(
      headerRow,
      [
        "date",
        "inspection date",
        "checked date"
      ]
    );


 const addressColumn =
  header.indexes.address;


const engineerColumn =
  header.indexes.engineer;


const resultColumn =
  header.indexes.result;


  const reasonColumn =
    findOptionalHsWarningColumn(
      headerRow,
      [
        "reason",
        "comments",
        "comment",
        "failure reason",
        "details"
      ]
    );


  const sourceFileKey =
    hsWarningSourceKey(
      sourceFileName
    );


  const imported = [];


  for (
    let rowIndex =
      header.rowIndex + 1;

    rowIndex <
      rows.length;

    rowIndex++
  ) {
    const row =
      rows[rowIndex] || [];


    const date =
      dateColumn >= 0
        ? workbookDateToIso(
            row[
              dateColumn
            ]
          )
        : "";


    const address =
      String(
        row[
          addressColumn
        ] || ""
      ).trim();


    const engineer =
      String(
        row[
          engineerColumn
        ] || ""
      ).trim();


    const result =
      normalizeHsWarningResult(
        row[
          resultColumn
        ]
      );


    const reason =
      reasonColumn >= 0
        ? String(
            row[
              reasonColumn
            ] || ""
          ).trim()
        : "";


    /*
      Ignore blank / summary-table rows.
    */
    if (
      !address ||
      !engineer ||
      !result
    ) {
      continue;
    }


    const recordId =
      [
        "hs-warning",
        sourceFileKey,
        date || "no-date",
        normalizePerformanceSourceName(
          engineer
        ),
        normalizePerformanceSourceName(
          address
        ),
        rowIndex
      ].join("-");


    imported.push({
      id:
        recordId,

      date,

      address,

      engineer,

      result,

      reason,

      sourceFile:
        sourceFileName,

      sourceFileKey,

      sourceSheet:
        sheetName,

      sourceRow:
        rowIndex + 1
    });
  }


  if (!imported.length) {
    throw new Error(
      "The Warning Notice sheet was found, but no valid compliance records could be imported."
    );
  }


  return {
    records:
      imported,

    sheetName
  };
}


async function importHsWarningWorkbook(
  file
) {
  const buffer =
    await file.arrayBuffer();


  const workbook =
    window.XLSX.read(
      buffer,
      {
        type: "array",
        cellDates: true
      }
    );


  const result =
    importHsWarningRecordsFromWorkbook(
      workbook,
      file.name
    );


  const sourceFileKey =
    hsWarningSourceKey(
      file.name
    );


  /*
    Warning Notices are historical.

    Re-importing the SAME workbook
    replaces records belonging to that
    workbook only.

    Other previously imported workbooks
    remain untouched.
  */
  const retained =
    (
      hsWarningState.records ||
      []
    ).filter(
      record =>
        record.sourceFileKey !==
        sourceFileKey
    );


  hsWarningState.records =
    [
      ...retained,
      ...result.records
    ];


  hsWarningState.importMeta = {
    ...(hsWarningState.importMeta ||
      {}),

    lastFileName:
      file.name,

    lastSheetName:
      result.sheetName,

    lastImportedAt:
      new Date()
        .toISOString(),

    lastImportCount:
      result.records.length,

    totalCount:
      hsWarningState.records
        .length
  };


  saveHsWarningState();


  renderHsWarningNotices();


  return {
    count:
      result.records.length,

    sheetName:
      result.sheetName
  };
}


function setHsWarningCloudStatus(
  message,
  state = ""
) {
  const element =
    el(
      "hsWarningCloudStatus"
    );

  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.classList.remove(
    "hs-cloud-good",
    "hs-cloud-warning",
    "hs-cloud-error"
  );


  if (state === "good") {
    element.classList.add(
      "hs-cloud-good"
    );
  }


  if (state === "warning") {
    element.classList.add(
      "hs-cloud-warning"
    );
  }


  if (state === "error") {
    element.classList.add(
      "hs-cloud-error"
    );
  }
}

async function loadHsWarningNoticesFromCloud() {
  if (!cloudSignedIn()) {
    return false;
  }

  try {
    const user = getUser();

    setHsWarningCloudStatus(
      "Loading Warning Notice data from Firebase…"
    );

    const snapshot =
      await hsWarningNoticesCloudCol(
        user.uid
      ).get();

    /*
      If Firebase contains Warning Notice
      records, use them on this device.
    */
    if (!snapshot.empty) {
      hsWarningState.records =
        snapshot.docs.map(
          document => {
            const data =
              document.data() || {};

            /*
              Remove Firestore's server
              timestamp before saving locally.
            */
            const {
              updatedAt,
              ...record
            } = data;

            return {
              ...record,

              id:
                record.id ||
                document.id
            };
          }
        );

      saveHsWarningState();

      renderHsWarningNotices();

      setHsWarningCloudStatus(
        `Cloud loaded • ${
          hsWarningState.records.length
        } Warning Notice record${
          hsWarningState.records.length ===
          1
            ? ""
            : "s"
        }.`,
        "good"
      );

      return true;
    }

    /*
      Firebase is empty but this device has
      local Warning Notice records.

      Upload those local records instead.
    */
    if (
      hsWarningState.records
        ?.length
    ) {
      const result =
        await syncHsWarningNoticesToCloud();

      return !!result?.synced;
    }

    saveHsWarningState();

    renderHsWarningNotices();

    setHsWarningCloudStatus(
      "Cloud connected • No Warning Notice records stored.",
      "good"
    );

    return true;
  } catch (error) {
    console.error(
      "Warning Notices could not be loaded from Firebase:",
      error
    );

    setHsWarningCloudStatus(
      "Firebase load failed • Local Warning Notice data is still safe.",
      "error"
    );

    return false;
  }
}
async function syncHsWarningNoticesToCloud() {
  if (!cloudSignedIn()) {
    setHsWarningCloudStatus(
      "Local only • Log in to sync Warning Notice data to Firebase.",
      "warning"
    );

    return {
      synced: false,
      reason:
        "not-signed-in"
    };
  }


  try {
    const user =
      getUser();


    const collection =
      hsWarningNoticesCloudCol(
        user.uid
      );


    /*
      Cloud mirrors the entire historical
      Warning Notice register currently
      stored by this app.
    */
    const existingSnapshot =
      await collection.get();


    const currentIds =
      new Set(
        (
          hsWarningState.records ||
          []
        )
          .map(
            record =>
              String(
                record.id || ""
              )
          )
          .filter(Boolean)
      );


    const operations = [];


    existingSnapshot.docs.forEach(
      document => {
        if (
          !currentIds.has(
            document.id
          )
        ) {
          operations.push({
            type: "delete",
            ref:
              document.ref
          });
        }
      }
    );


    (
      hsWarningState.records ||
      []
    ).forEach(
      record => {
        if (!record.id) {
          return;
        }


        operations.push({
          type: "set",

          ref:
            collection.doc(
              record.id
            ),

          data: {
            ...record,

            updatedAt:
              firebase
                .firestore
                .FieldValue
                .serverTimestamp()
          }
        });
      }
    );


    const batchSize = 400;


    for (
      let index = 0;
      index <
        operations.length;
      index += batchSize
    ) {
      const group =
        operations.slice(
          index,
          index +
            batchSize
        );


      const batch =
        cloudDb.batch();


      group.forEach(
        operation => {
          if (
            operation.type ===
            "delete"
          ) {
            batch.delete(
              operation.ref
            );
          } else {
            batch.set(
              operation.ref,
              operation.data,
              {
                merge: true
              }
            );
          }
        }
      );


      await batch.commit();
    }


    setHsWarningCloudStatus(
      `Cloud synced • ${
        hsWarningState.records
          .length
      } Warning Notice record${
        hsWarningState.records
          .length === 1
          ? ""
          : "s"
      } stored in Firebase.`,
      "good"
    );


    return {
      synced: true
    };
  } catch (error) {
    console.error(
      "Warning Notice Firebase sync failed:",
      error
    );


    setHsWarningCloudStatus(
      "Firebase sync failed • Local Warning Notice data is still safe.",
      "error"
    );


    return {
      synced: false,
      reason: "error",
      error
    };
  }
}


function getHsWarningPeriodRange() {
  const period =
    hsWarningFilters.period;


  if (
    period === "all"
  ) {
    return {
      from: "",
      to: ""
    };
  }


  if (
    period === "custom"
  ) {
    return {
      from:
        hsWarningFilters
          .dateFrom,

      to:
        hsWarningFilters
          .dateTo
    };
  }


  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  let from;
  let to;


  if (
    period ===
    "this-month"
  ) {
    from =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

    to =
      new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
      );
  }


  if (
    period ===
    "last-month"
  ) {
    from =
      new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      );

    to =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        0
      );
  }


  if (
    period ===
    "this-quarter"
  ) {
    const quarterMonth =
      Math.floor(
        today.getMonth() /
          3
      ) * 3;


    from =
      new Date(
        today.getFullYear(),
        quarterMonth,
        1
      );


    to =
      new Date(
        today.getFullYear(),
        quarterMonth + 3,
        0
      );
  }


  const toIso =
    date => {
      if (!date) {
        return "";
      }

      return [
        date.getFullYear(),
        String(
          date.getMonth() +
            1
        ).padStart(
          2,
          "0"
        ),
        String(
          date.getDate()
        ).padStart(
          2,
          "0"
        )
      ].join("-");
    };


  return {
    from:
      toIso(from),

    to:
      toIso(to)
  };
}


function getFilteredHsWarningRecords() {
  const {
    from,
    to
  } =
    getHsWarningPeriodRange();


  const search =
    hsWarningFilters.search
      .trim()
      .toLowerCase();


  return (
    hsWarningState.records ||
    []
  )
    .filter(
      record => {
        if (
          from &&
          (
            !record.date ||
            record.date < from
          )
        ) {
          return false;
        }


        if (
          to &&
          (
            !record.date ||
            record.date > to
          )
        ) {
          return false;
        }


        if (
          hsWarningFilters
            .engineer &&
          record.engineer !==
            hsWarningFilters
              .engineer
        ) {
          return false;
        }


        if (
          hsWarningFilters
            .result &&
          record.result !==
            hsWarningFilters
              .result
        ) {
          return false;
        }


        if (
          hsWarningFilters
            .source &&
          record.sourceFileKey !==
            hsWarningFilters
              .source
        ) {
          return false;
        }


        if (search) {
          const haystack =
            [
              record.address,
              record.engineer,
              record.reason,
              record.result,
              record.sourceFile
            ]
              .join(" ")
              .toLowerCase();


          if (
            !haystack.includes(
              search
            )
          ) {
            return false;
          }
        }


        return true;
      }
    )
    .sort(
      (a, b) =>
        String(
          b.date || ""
        ).localeCompare(
          String(
            a.date || ""
          )
        )
    );
}


function getHsWarningSummary(
  records
) {
  const total =
    records.length;


  const correct =
    records.filter(
      record =>
        record.result ===
        "PASS"
    ).length;


  const incorrect =
    records.filter(
      record =>
        record.result ===
        "FAIL"
    ).length;


  const engineers =
    new Set(
      records
        .map(
          record =>
            record.engineer
        )
        .filter(Boolean)
    ).size;


  const compliance =
    total
      ? Math.round(
          correct /
            total *
            100
        )
      : 0;


  return {
    total,
    correct,
    incorrect,
    engineers,
    compliance
  };
}


function buildHsWarningEngineerSummary(
  records
) {
  const map =
    new Map();


  records.forEach(
    record => {
      const engineer =
        record.engineer ||
        "Not recorded";


      if (
        !map.has(
          engineer
        )
      ) {
        map.set(
          engineer,
          {
            engineer,
            total: 0,
            correct: 0,
            incorrect: 0
          }
        );
      }


      const row =
        map.get(
          engineer
        );


      row.total += 1;


      if (
        record.result ===
        "PASS"
      ) {
        row.correct += 1;
      }


      if (
        record.result ===
        "FAIL"
      ) {
        row.incorrect += 1;
      }
    }
  );


  return Array.from(
    map.values()
  )
    .map(
      row => ({
        ...row,

        compliance:
          row.total
            ? Math.round(
                row.correct /
                  row.total *
                  100
              )
            : 0
      })
    )
    .sort(
      (a, b) =>
        a.engineer.localeCompare(
          b.engineer
        )
    );
}


function populateHsWarningFilters() {
  const records =
    hsWarningState.records ||
    [];


  const engineers =
    Array.from(
      new Set(
        records
          .map(
            record =>
              record.engineer
          )
          .filter(Boolean)
      )
    ).sort(
      (a, b) =>
        a.localeCompare(b)
    );


  const engineerSelect =
    el(
      "hsWarningEngineer"
    );


  if (engineerSelect) {
    const current =
      hsWarningFilters
        .engineer;


    engineerSelect.innerHTML =
      `
        <option value="">
          All engineers
        </option>
      ` +
      engineers
        .map(
          engineer =>
            `
              <option value="${escapeHtml(
                engineer
              )}">
                ${escapeHtml(
                  engineer
                )}
              </option>
            `
        )
        .join("");


    engineerSelect.value =
      current;
  }


  const sources =
    Array.from(
      new Map(
        records
          .filter(
            record =>
              record
                .sourceFileKey
          )
          .map(
            record => [
              record
                .sourceFileKey,

              record
                .sourceFile
            ]
          )
      ).entries()
    )
      .sort(
        (a, b) =>
          String(
            a[1]
          ).localeCompare(
            String(
              b[1]
            )
          )
      );


  const sourceSelect =
    el(
      "hsWarningSource"
    );


  if (sourceSelect) {
    const current =
      hsWarningFilters
        .source;


    sourceSelect.innerHTML =
      `
        <option value="">
          All workbooks
        </option>
      ` +
      sources
        .map(
          ([key, name]) =>
            `
              <option value="${escapeHtml(
                key
              )}">
                ${escapeHtml(
                  name
                )}
              </option>
            `
        )
        .join("");


    sourceSelect.value =
      current;
  }
}


function renderHsWarningKpis(
  records
) {
  const container =
    el(
      "hsWarningKpis"
    );


  if (!container) {
    return;
  }


  const summary =
    getHsWarningSummary(
      records
    );


  container.innerHTML = `
    <button
      class="hs-warning-kpi"
      type="button"
      data-warning-result=""
    >
      <span>Notices checked</span>
      <strong>${summary.total}</strong>
    </button>

    <button
      class="hs-warning-kpi hs-warning-kpi-good"
      type="button"
      data-warning-result="PASS"
    >
      <span>Compliant</span>
      <strong>${summary.correct}</strong>
    </button>

    <button
      class="hs-warning-kpi hs-warning-kpi-bad"
      type="button"
      data-warning-result="FAIL"
    >
      <span>Non-compliant</span>
      <strong>${summary.incorrect}</strong>
    </button>

    <div
      class="hs-warning-kpi"
    >
      <span>Compliance</span>
      <strong>${summary.compliance}%</strong>
    </div>

    <div
      class="hs-warning-kpi"
    >
      <span>Engineers reviewed</span>
      <strong>${summary.engineers}</strong>
    </div>
  `;


  container
    .querySelectorAll(
      "[data-warning-result]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            hsWarningFilters.result =
              button.dataset
                .warningResult ||
              "";


            const select =
              el(
                "hsWarningResult"
              );


            if (select) {
              select.value =
                hsWarningFilters
                  .result;
            }


            renderHsWarningNotices();
          }
        );
      }
    );
}

function renderHsWarningEngineerChart(
  records
) {
  const container =
    el(
      "hsWarningEngineerChart"
    );

  if (!container) {
    return;
  }

  const engineers =
    buildHsWarningEngineerSummary(
      records
    ).sort(
      (a, b) => {
        if (
          b.compliance !==
          a.compliance
        ) {
          return (
            b.compliance -
            a.compliance
          );
        }

        if (
          b.total !==
          a.total
        ) {
          return (
            b.total -
            a.total
          );
        }

        if (
          a.incorrect !==
          b.incorrect
        ) {
          return (
            a.incorrect -
            b.incorrect
          );
        }

        return a.engineer.localeCompare(
          b.engineer
        );
      }
    );

  if (!engineers.length) {
    container.innerHTML = `
      <div class="hs-warning-chart-empty">
        No engineers match the current filters.
      </div>
    `;
    return;
  }

  container.innerHTML =
    engineers
      .map(
        row => {
          const passPercent =
            row.total
              ? (
                  row.correct /
                  row.total *
                  100
                )
              : 0;

          const failPercent =
            row.total
              ? (
                  row.incorrect /
                  row.total *
                  100
                )
              : 0;

          return `
            <button
              class="hs-warning-chart-row"
              type="button"
              data-warning-chart-engineer="${escapeHtml(
                row.engineer
              )}"
              title="Filter to ${escapeHtml(
                row.engineer
              )}"
            >
              <div class="hs-warning-chart-row-top">
                <div class="hs-warning-chart-row-left">
                  <div class="hs-warning-chart-engineer">
                    ${escapeHtml(
                      row.engineer
                    )}
                  </div>

                  <div class="hs-warning-chart-meta">
                    ${row.total} notice${
                      row.total === 1
                        ? ""
                        : "s"
                    } • ${row.correct} PASS • ${row.incorrect} FAIL
                  </div>
                </div>

                <div class="hs-warning-chart-row-right">
                  <div class="hs-warning-chart-rate ${
                    row.compliance ===
                    100
                      ? "good"
                      : row.compliance >=
                          80
                        ? "mid"
                        : "bad"
                  }">
                    ${row.compliance}%
                  </div>
                </div>
              </div>

              <div class="hs-warning-chart-bar">
                <span
                  class="hs-warning-chart-bar-pass"
                  style="width:${passPercent}%;"
                ></span>
                <span
                  class="hs-warning-chart-bar-fail"
                  style="width:${failPercent}%;"
                ></span>
              </div>
            </button>
          `;
        }
      )
      .join("");

  container
    .querySelectorAll(
      "[data-warning-chart-engineer]"
    )
    .forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            hsWarningFilters.engineer =
              button.dataset
                .warningChartEngineer || "";

            const select =
              el(
                "hsWarningEngineer"
              );

            if (select) {
              select.value =
                hsWarningFilters.engineer;
            }

            renderHsWarningNotices();
          }
        );
      }
    );
}
function renderHsWarningEngineerTable(
  records
) {
  const body =
    el(
      "hsWarningEngineerTableBody"
    );


  if (!body) {
    return;
  }


  const engineers =
    buildHsWarningEngineerSummary(
      records
    );


  if (!engineers.length) {
    body.innerHTML = `
      <tr>
        <td
          colspan="5"
          class="hs-warning-empty"
        >
          No engineers match the current filters.
        </td>
      </tr>
    `;

    return;
  }


  body.innerHTML =
    engineers
      .map(
        row => `
          <tr
            class="hs-warning-engineer-row"
            data-warning-engineer="${escapeHtml(
              row.engineer
            )}"
            title="Filter to ${escapeHtml(
              row.engineer
            )}"
          >
            <td>
              <strong>
                ${escapeHtml(
                  row.engineer
                )}
              </strong>
            </td>

            <td>
              ${row.total}
            </td>

            <td>
              ${row.correct}
            </td>

            <td>
              ${row.incorrect}
            </td>

            <td>
              <span class="${
                row.compliance ===
                  100
                  ? "hs-warning-rate-good"
                  : row.compliance <
                      80
                    ? "hs-warning-rate-bad"
                    : "hs-warning-rate-mid"
              }">
                ${row.compliance}%
              </span>
            </td>
          </tr>
        `
      )
      .join("");


  body
    .querySelectorAll(
      "[data-warning-engineer]"
    )
    .forEach(
      row => {
        row.addEventListener(
          "click",
          () => {
            hsWarningFilters.engineer =
              row.dataset
                .warningEngineer ||
              "";


            const select =
              el(
                "hsWarningEngineer"
              );


            if (select) {
              select.value =
                hsWarningFilters
                  .engineer;
            }


            renderHsWarningNotices();
          }
        );
      }
    );
}


function renderHsWarningRegister(
  records
) {
  const body =
    el(
      "hsWarningTableBody"
    );


  const count =
    el(
      "hsWarningRecordCount"
    );


  if (count) {
    count.textContent =
      `${records.length} record${
        records.length === 1
          ? ""
          : "s"
      }`;
  }


  if (!body) {
    return;
  }


  if (!records.length) {
    body.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="hs-warning-empty"
        >
          No Warning Notice records match the current filters.
        </td>
      </tr>
    `;

    return;
  }


  body.innerHTML =
    records
      .map(
        record => `
          <tr>
            <td>
              ${
                record.date
                  ? escapeHtml(
                      formatDate(
                        record.date
                      )
                    )
                  : "—"
              }
            </td>

            <td>
              ${escapeHtml(
                record.address ||
                "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                record.engineer ||
                "—"
              )}
            </td>

            <td>
              <span
                class="
                  hs-warning-result
                  ${
                    record.result ===
                      "PASS"
                      ? "hs-warning-pass"
                      : "hs-warning-fail"
                  }
                "
              >
                ${record.result}
              </span>
            </td>

            <td
              class="hs-warning-reason"
            >
              ${
                record.reason
                  ? escapeHtml(
                      record.reason
                    )
                  : "—"
              }
            </td>

            <td
              class="hs-warning-source"
              title="${escapeHtml(
                record.sourceFile ||
                ""
              )}"
            >
              ${escapeHtml(
                record.sourceFile ||
                "—"
              )}
            </td>
          </tr>
        `
      )
      .join("");
}


function renderHsWarningImportStatus() {
  const element =
    el(
      "hsWarningImportStatus"
    );


  if (!element) {
    return;
  }


  const meta =
    hsWarningState.importMeta ||
    {};


  if (
    !meta.lastFileName
  ) {
    element.textContent =
      hsWarningState.records
        .length
        ? `${hsWarningState.records.length} historical Warning Notice records available.`
        : "No warning notice workbook imported.";

    return;
  }


  const importedDate =
    meta.lastImportedAt
      ? new Date(
          meta.lastImportedAt
        ).toLocaleString(
          "en-GB"
        )
      : "";


  element.textContent =
    `Last import: ${
      meta.lastFileName
    } • ${
      meta.lastImportCount || 0
    } records • Sheet: ${
      meta.lastSheetName || "Unknown"
    }${
      importedDate
        ? ` • ${importedDate}`
        : ""
    }`;
}


function updateHsWarningDateControlState() {
  const custom =
    hsWarningFilters.period ===
      "custom";


  const from =
    el(
      "hsWarningDateFrom"
    );


  const to =
    el(
      "hsWarningDateTo"
    );


  if (from) {
    from.disabled =
      !custom;
  }


  if (to) {
    to.disabled =
      !custom;
  }
}


function renderHsWarningNotices() {
  populateHsWarningFilters();

  updateHsWarningDateControlState();

  const records =
    getFilteredHsWarningRecords();


  renderHsWarningKpis(
    records
  );


  renderHsWarningEngineerChart(
  records
);

renderHsWarningEngineerTable(
  records
);


  renderHsWarningRegister(
    records
  );


  renderHsWarningImportStatus();


  /*
    Update H&S Overview Warning KPI.

    For now this represents the number
    of FAIL records in the entire stored
    Warning Notice register.
  */
  const overview =
    el(
      "hsOverviewWarningCount"
    );


  if (overview) {
    overview.textContent =
      (
        hsWarningState.records ||
        []
      ).filter(
        record =>
          record.result ===
          "FAIL"
      ).length;
  }
}


function clearHsWarningFilters() {
  hsWarningFilters.period =
    "all";

  hsWarningFilters.dateFrom =
    "";

  hsWarningFilters.dateTo =
    "";

  hsWarningFilters.engineer =
    "";

  hsWarningFilters.result =
    "";

  hsWarningFilters.source =
    "";

  hsWarningFilters.search =
    "";


  if (
    el("hsWarningPeriod")
  ) {
    el(
      "hsWarningPeriod"
    ).value =
      "all";
  }


  if (
    el("hsWarningDateFrom")
  ) {
    el(
      "hsWarningDateFrom"
    ).value =
      "";
  }


  if (
    el("hsWarningDateTo")
  ) {
    el(
      "hsWarningDateTo"
    ).value =
      "";
  }


  if (
    el("hsWarningEngineer")
  ) {
    el(
      "hsWarningEngineer"
    ).value =
      "";
  }


  if (
    el("hsWarningResult")
  ) {
    el(
      "hsWarningResult"
    ).value =
      "";
  }


  if (
    el("hsWarningSource")
  ) {
    el(
      "hsWarningSource"
    ).value =
      "";
  }


  if (
    el("hsWarningSearch")
  ) {
    el(
      "hsWarningSearch"
    ).value =
      "";
  }


  renderHsWarningNotices();
}

function getHsWarningManagerRecords() {
  const search =
    hsWarningManagerState
      .search
      .trim()
      .toLowerCase();

  return (
    hsWarningState.records ||
    []
  )
    .filter(
      record => {

        if (
          hsWarningManagerState.source &&
          record.sourceFileKey !==
            hsWarningManagerState.source
        ) {
          return false;
        }


        if (
          hsWarningManagerState.engineer &&
          record.engineer !==
            hsWarningManagerState.engineer
        ) {
          return false;
        }


        if (
          hsWarningManagerState.result &&
          record.result !==
            hsWarningManagerState.result
        ) {
          return false;
        }


        if (search) {
          const haystack =
            [
              record.date,
              record.address,
              record.engineer,
              record.result,
              record.reason,
              record.sourceFile
            ]
              .join(" ")
              .toLowerCase();

          if (
            !haystack.includes(
              search
            )
          ) {
            return false;
          }
        }


        return true;
      }
    )
    .sort(
      (a, b) =>
        String(
          b.date || ""
        ).localeCompare(
          String(
            a.date || ""
          )
        )
    );
}


function populateHsWarningManagerFilters() {
  const records =
    hsWarningState.records ||
    [];


  const engineers =
    Array.from(
      new Set(
        records
          .map(
            record =>
              record.engineer
          )
          .filter(Boolean)
      )
    ).sort(
      (a, b) =>
        a.localeCompare(b)
    );


  const engineerSelect =
    el(
      "hsWarningManagerEngineer"
    );


  if (engineerSelect) {
    engineerSelect.innerHTML =
      `
        <option value="">
          All engineers
        </option>
      ` +
      engineers
        .map(
          engineer => `
            <option
              value="${escapeHtml(
                engineer
              )}"
            >
              ${escapeHtml(
                engineer
              )}
            </option>
          `
        )
        .join("");


    engineerSelect.value =
      hsWarningManagerState
        .engineer;
  }


  const sources =
    Array.from(
      new Map(
        records
          .filter(
            record =>
              record.sourceFileKey
          )
          .map(
            record => [
              record.sourceFileKey,
              record.sourceFile
            ]
          )
      ).entries()
    ).sort(
      (a, b) =>
        String(
          a[1]
        ).localeCompare(
          String(
            b[1]
          )
        )
    );


  const sourceSelect =
    el(
      "hsWarningManagerSource"
    );


  if (sourceSelect) {
    sourceSelect.innerHTML =
      `
        <option value="">
          All workbooks
        </option>
      ` +
      sources
        .map(
          ([key, name]) => `
            <option
              value="${escapeHtml(
                key
              )}"
            >
              ${escapeHtml(
                name
              )}
            </option>
          `
        )
        .join("");


    sourceSelect.value =
      hsWarningManagerState
        .source;
  }
}


function updateHsWarningManagerSelectionUi() {
  const selectedCount =
    hsWarningManagerState
      .selectedIds
      .size;


  const countElement =
    el(
      "hsWarningManagerSelectedCount"
    );


  const deleteButton =
    el(
      "hsWarningManagerDeleteBtn"
    );


  if (countElement) {
    countElement.textContent =
      `${selectedCount} selected`;
  }


  if (deleteButton) {
    deleteButton.disabled =
      selectedCount === 0;
  }
}


function renderHsWarningManager() {
  populateHsWarningManagerFilters();


  const records =
    getHsWarningManagerRecords();


  const body =
    el(
      "hsWarningManagerTableBody"
    );


  const status =
    el(
      "hsWarningManagerStatus"
    );


  if (status) {
    status.textContent =
      `${records.length} matching record${
        records.length === 1
          ? ""
          : "s"
      }`;
  }


  if (!body) {
    return;
  }


  if (!records.length) {
    body.innerHTML = `
      <tr>
        <td colspan="7">
          No Warning Notice records match the current filters.
        </td>
      </tr>
    `;

    updateHsWarningManagerSelectionUi();

    return;
  }


  body.innerHTML =
    records
      .map(
        record => `
          <tr>
            <td>
              <input
                type="checkbox"
                class="hs-warning-manager-checkbox"
                data-warning-id="${escapeHtml(
                  record.id
                )}"
                ${
                  hsWarningManagerState
                    .selectedIds
                    .has(
                      record.id
                    )
                    ? "checked"
                    : ""
                }
              />
            </td>

            <td>
              ${
                record.date
                  ? escapeHtml(
                      formatDate(
                        record.date
                      )
                    )
                  : "—"
              }
            </td>

            <td>
              ${escapeHtml(
                record.address ||
                "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                record.engineer ||
                "—"
              )}
            </td>

            <td>
              <span
                class="
                  hs-warning-result
                  ${
                    record.result ===
                      "PASS"
                      ? "hs-warning-pass"
                      : "hs-warning-fail"
                  }
                "
              >
                ${escapeHtml(
                  record.result ||
                  "—"
                )}
              </span>
            </td>

            <td>
              ${escapeHtml(
                record.reason ||
                "—"
              )}
            </td>

            <td>
              ${escapeHtml(
                record.sourceFile ||
                "—"
              )}
            </td>
          </tr>
        `
      )
      .join("");


  body
    .querySelectorAll(
      ".hs-warning-manager-checkbox"
    )
    .forEach(
      checkbox => {
        checkbox.addEventListener(
          "change",
          () => {
            const id =
              checkbox.dataset
                .warningId;


            if (!id) {
              return;
            }


            if (
              checkbox.checked
            ) {
              hsWarningManagerState
                .selectedIds
                .add(id);
            } else {
              hsWarningManagerState
                .selectedIds
                .delete(id);
            }


            updateHsWarningManagerSelectionUi();
          }
        );
      }
    );


  updateHsWarningManagerSelectionUi();
}


function openHsWarningManager() {
  hsWarningManagerState
    .selectedIds
    .clear();


  hsWarningManagerState.source =
    "";

  hsWarningManagerState.engineer =
    "";

  hsWarningManagerState.result =
    "";

  hsWarningManagerState.search =
    "";


  const source =
    el(
      "hsWarningManagerSource"
    );

  const engineer =
    el(
      "hsWarningManagerEngineer"
    );

  const result =
    el(
      "hsWarningManagerResult"
    );

  const search =
    el(
      "hsWarningManagerSearch"
    );


  if (source) {
    source.value = "";
  }

  if (engineer) {
    engineer.value = "";
  }

  if (result) {
    result.value = "";
  }

  if (search) {
    search.value = "";
  }


  el(
    "hsWarningManagerModal"
  )?.classList.remove(
    "hidden"
  );


  renderHsWarningManager();
}


function closeHsWarningManager() {
  el(
    "hsWarningManagerModal"
  )?.classList.add(
    "hidden"
  );
}


async function deleteSelectedHsWarningRecords() {
  const selectedIds =
    hsWarningManagerState
      .selectedIds;


  if (!selectedIds.size) {
    return;
  }


  const count =
    selectedIds.size;


  const confirmed =
    confirm(
      `Delete ${count} selected Warning Notice record${
        count === 1
          ? ""
          : "s"
      }?\n\nThis cannot be undone.`
    );


  if (!confirmed) {
    return;
  }


  hsWarningState.records =
    (
      hsWarningState.records ||
      []
    ).filter(
      record =>
        !selectedIds.has(
          record.id
        )
    );


  hsWarningState.importMeta = {
    ...(hsWarningState.importMeta ||
      {}),

    totalCount:
      hsWarningState.records
        .length
  };


  saveHsWarningState();


  selectedIds.clear();


  /*
    Refresh the main Warning Notices
    page immediately.

    This updates KPIs, chart, engineer
    table and register.
  */
  renderHsWarningNotices();


  renderHsWarningManager();


  const status =
    el(
      "hsWarningManagerStatus"
    );


  if (
    cloudSignedIn()
  ) {
    const cloudResult =
      await syncHsWarningNoticesToCloud();


    if (status) {
      status.textContent =
        cloudResult.synced
          ? `${count} record${
              count === 1
                ? ""
                : "s"
            } deleted • Firebase updated.`
          : `${count} record${
              count === 1
                ? ""
                : "s"
            } deleted locally • Firebase sync needs attention.`;
    }
  } else if (status) {
    status.textContent =
      `${count} record${
        count === 1
          ? ""
          : "s"
      } deleted locally.`;
  }
}


function initHsWarningManager() {
  el(
    "hsWarningManageBtn"
  )?.addEventListener(
    "click",
    openHsWarningManager
  );


  el(
    "hsWarningManagerCloseBtn"
  )?.addEventListener(
    "click",
    closeHsWarningManager
  );


  el(
    "hsWarningManagerSource"
  )?.addEventListener(
    "change",
    event => {
      hsWarningManagerState.source =
        event.target.value;

      renderHsWarningManager();
    }
  );


  el(
    "hsWarningManagerEngineer"
  )?.addEventListener(
    "change",
    event => {
      hsWarningManagerState.engineer =
        event.target.value;

      renderHsWarningManager();
    }
  );


  el(
    "hsWarningManagerResult"
  )?.addEventListener(
    "change",
    event => {
      hsWarningManagerState.result =
        event.target.value;

      renderHsWarningManager();
    }
  );


  el(
    "hsWarningManagerSearch"
  )?.addEventListener(
    "input",
    event => {
      hsWarningManagerState.search =
        event.target.value;

      renderHsWarningManager();
    }
  );


  el(
    "hsWarningManagerSelectVisibleBtn"
  )?.addEventListener(
    "click",
    () => {
      getHsWarningManagerRecords()
        .forEach(
          record => {
            hsWarningManagerState
              .selectedIds
              .add(
                record.id
              );
          }
        );


      renderHsWarningManager();
    }
  );


  el(
    "hsWarningManagerClearSelectionBtn"
  )?.addEventListener(
    "click",
    () => {
      hsWarningManagerState
        .selectedIds
        .clear();


      renderHsWarningManager();
    }
  );


  el(
    "hsWarningManagerDeleteBtn"
  )?.addEventListener(
    "click",
    deleteSelectedHsWarningRecords
  );


  el(
    "hsWarningManagerModal"
  )?.addEventListener(
    "click",
    event => {
      if (
        event.target ===
        el(
          "hsWarningManagerModal"
        )
      ) {
        closeHsWarningManager();
      }
    }
  );


  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Escape" &&
        !el(
          "hsWarningManagerModal"
        )?.classList.contains(
          "hidden"
        )
      ) {
        closeHsWarningManager();
      }
    }
  );
}

// =========================================================
// H&S WARNING NOTICE POWERPOINT SLIDE
// =========================================================

function getHsWarningSlidePeriodLabel(
  records
) {
  const range =
    getHsWarningPeriodRange();


  if (
    range.from ||
    range.to
  ) {
    return formatPptPeriodLabel(
      range.from,
      range.to
    );
  }


  const dates =
    (records || [])
      .map(
        record =>
          record.date
      )
      .filter(Boolean)
      .sort();


  if (!dates.length) {
    return "All imported records";
  }


  return formatPptPeriodLabel(
    dates[0],
    dates[
      dates.length - 1
    ]
  );
}


function getHsWarningFailureTheme(
  reason
) {
  const text =
    String(
      reason || ""
    )
      .trim()
      .toLowerCase();


  if (!text) {
    return "Reason not recorded";
  }


  /*
    Property / tenant information
  */
  if (
    text.includes(
      "tenant name"
    ) ||
    text.includes(
      "full address"
    ) ||
    text.includes(
      "address not"
    ) ||
    text.includes(
      "property details"
    )
  ) {
    return "Missing property / tenant details";
  }


  /*
    Boiler / appliance information
  */
  if (
    text.includes(
      "boiler info"
    ) ||
    text.includes(
      "boiler information"
    ) ||
    text.includes(
      "appliance info"
    ) ||
    text.includes(
      "appliance details"
    ) ||
    text.includes(
      "gs number"
    ) ||
    text.includes(
      "serial number"
    )
  ) {
    return "Missing boiler / appliance information";
  }


  /*
    Warning notice itself missing,
    unreadable, no photograph etc.
  */
  if (
    text.includes(
      "warning sticker"
    ) ||
    text.includes(
      "warning notice"
    ) ||
    text.includes(
      "readable notice"
    ) ||
    text.includes(
      "readable"
    ) ||
    text.includes(
      "picture"
    ) ||
    text.includes(
      "photo"
    ) ||
    text.includes(
      "pic of"
    )
  ) {
    return "Warning notice evidence incomplete";
  }


  /*
    Date not recorded
  */
  if (
    text.includes(
      "no date"
    ) ||
    text.includes(
      "date missing"
    ) ||
    text.includes(
      "missing date"
    )
  ) {
    return "Date not recorded";
  }


  /*
    How the appliance/job was left,
    remedial action, parts etc.
  */
  if (
    text.includes(
      "how boiler was left"
    ) ||
    text.includes(
      "how boiler left"
    ) ||
    text.includes(
      "how situation was left"
    ) ||
    text.includes(
      "what is being done"
    ) ||
    text.includes(
      "what is being done"
    ) ||
    text.includes(
      "parts ordered"
    ) ||
    text.includes(
      "part req"
    ) ||
    text.includes(
      "remedial"
    ) ||
    text.includes(
      "isolation"
    )
  ) {
    return "Outcome / remedial action not recorded";
  }


  return "Other documentation issue";
}


function getHsWarningTopFailureReasons(
  records,
  limit = 5
) {
  const themeMap =
    new Map();


  (records || [])
    .filter(
      record =>
        record.result ===
        "FAIL"
    )
    .forEach(
      record => {
        /*
          A single reason can contain
          several separate documentation
          problems.

          Detect every applicable theme
          rather than forcing it into only
          one category.
        */
        const text =
          String(
            record.reason || ""
          )
            .trim()
            .toLowerCase();


        const themes =
          new Set();


        if (!text) {
          themes.add(
            "Reason not recorded"
          );
        }


        if (
          text.includes(
            "tenant name"
          ) ||
          text.includes(
            "full address"
          ) ||
          text.includes(
            "address not"
          ) ||
          text.includes(
            "property details"
          )
        ) {
          themes.add(
            "Missing property / tenant details"
          );
        }


        if (
          text.includes(
            "boiler info"
          ) ||
          text.includes(
            "boiler information"
          ) ||
          text.includes(
            "appliance info"
          ) ||
          text.includes(
            "appliance details"
          ) ||
          text.includes(
            "gs number"
          ) ||
          text.includes(
            "serial number"
          )
        ) {
          themes.add(
            "Missing boiler / appliance information"
          );
        }


        if (
          text.includes(
            "warning sticker"
          ) ||
          text.includes(
            "warning notice"
          ) ||
          text.includes(
            "readable notice"
          ) ||
          text.includes(
            "picture"
          ) ||
          text.includes(
            "photo"
          ) ||
          text.includes(
            "pic of"
          )
        ) {
          themes.add(
            "Warning notice evidence incomplete"
          );
        }


        if (
          text.includes(
            "no date"
          ) ||
          text.includes(
            "date missing"
          ) ||
          text.includes(
            "missing date"
          )
        ) {
          themes.add(
            "Date not recorded"
          );
        }


        if (
          text.includes(
            "how boiler was left"
          ) ||
          text.includes(
            "how boiler left"
          ) ||
          text.includes(
            "how situation was left"
          ) ||
          text.includes(
            "what is being done"
          ) ||
          text.includes(
            "parts ordered"
          ) ||
          text.includes(
            "part req"
          ) ||
          text.includes(
            "remedial"
          ) ||
          text.includes(
            "isolation"
          )
        ) {
          themes.add(
            "Outcome / remedial action not recorded"
          );
        }


        if (!themes.size) {
          themes.add(
            getHsWarningFailureTheme(
              record.reason
            )
          );
        }


        themes.forEach(
          theme => {
            themeMap.set(
              theme,
              (
                themeMap.get(
                  theme
                ) || 0
              ) + 1
            );
          }
        );
      }
    );


  return Array.from(
    themeMap.entries()
  )
    .map(
      ([reason, count]) => ({
        reason,
        count
      })
    )
    .sort(
      (a, b) =>
        b.count -
        a.count
    )
    .slice(
      0,
      limit
    );
}


function pptHsWarningNoticesSlide(
  pptx,
  records
) {
  const slide =
    pptx.addSlide();


  pptBackground(
    pptx,
    slide
  );


  const periodLabel =
    getHsWarningSlidePeriodLabel(
      records
    );


  pptTitle(
    slide,
    "Warning Notice Compliance",
    periodLabel
  );


  const summary =
    getHsWarningSummary(
      records
    );


  /*
    KPI CARDS
  */
  pptMetric(
    pptx,
    slide,
    0.35,
    0.92,
    3.0,
    "Notices checked",
    summary.total,
    periodLabel,
    "",
    true
  );


  pptMetric(
  pptx,
  slide,
  3.55,
  0.92,
  3.0,
  "Compliant",
  summary.correct,
  `${summary.correct} notice${
    summary.correct === 1
      ? ""
      : "s"
  } passed`,
  "",
  true
);


  pptMetric(
    pptx,
    slide,
    6.75,
    0.92,
    3.0,
    "Non-compliant",
    summary.incorrect,
    summary.total
      ? `${Math.round(
          summary.incorrect /
          summary.total *
          100
        )}% of checks`
      : "No checks",
    "",
    summary.incorrect === 0
  );


  pptMetric(
    pptx,
    slide,
    9.95,
    0.92,
    3.0,
    "Compliance rate",
    `${summary.compliance}%`,
    `${summary.engineers} engineer${
      summary.engineers === 1
        ? ""
        : "s"
    } reviewed`,
    "",
    summary.compliance >= 90
  );


  /*
    LEFT CARD:
    ENGINEER COMPLIANCE
  */
  pptCard(
    pptx,
    slide,
    0.35,
    2.52,
    8.15,
    4.35
  );


  slide.addText(
    "Engineer compliance",
    {
      x: 0.65,
      y: 2.72,
      w: 4.5,
      h: 0.28,

      fontFace:
        PPT_THEME.font,

      fontSize: 15,
      bold: true,

      color:
        PPT_THEME.navy,

      margin: 0
    }
  );


  slide.addText(
    "PASS / FAIL split by engineer",
    {
      x: 0.65,
      y: 3.02,
      w: 4.5,
      h: 0.18,

      fontFace:
        PPT_THEME.font,

      fontSize: 9.5,

      color:
        PPT_THEME.muted,

      margin: 0
    }
  );


  const engineers =
    buildHsWarningEngineerSummary(
      records
    )
      .sort(
        (a, b) => {
          if (
            a.compliance !==
            b.compliance
          ) {
            return (
              a.compliance -
              b.compliance
            );
          }

          return (
            b.total -
            a.total
          );
        }
      )
      .slice(
        0,
        10
      );


  if (!engineers.length) {
    slide.addText(
      "No engineer data available for the selected filters.",
      {
        x: 0.65,
        y: 3.55,
        w: 7.4,
        h: 0.4,

        fontFace:
          PPT_THEME.font,

        fontSize: 11,

        color:
          PPT_THEME.muted,

        margin: 0
      }
    );
  } else {
    const startY =
      3.38;

    const rowHeight =
      Math.min(
        0.34,
        2.95 /
          engineers.length
      );


    engineers.forEach(
      (
        row,
        index
      ) => {
        const y =
          startY +
          index *
          rowHeight;


        const passShare =
          row.total
            ? row.correct /
              row.total
            : 0;


        const failShare =
          row.total
            ? row.incorrect /
              row.total
            : 0;


        slide.addText(
          row.engineer,
          {
            x: 0.65,
            y,
            w: 1.35,
            h:
              rowHeight *
              0.7,

            fontFace:
              PPT_THEME.font,

            fontSize: 8.7,
            bold: true,

            color:
              PPT_THEME.navy,

            margin: 0,

            valign:
              "mid",

            fit:
              "shrink"
          }
        );


        /*
          Grey background bar.
        */
        slide.addShape(
          pptx.ShapeType.rect,
          {
            x: 2.05,
            y:
              y + 0.035,

            w: 4.75,
            h:
              Math.max(
                0.10,
                rowHeight *
                  0.46
              ),

            line: {
              transparency: 100
            },

            fill: {
              color:
                PPT_THEME.grid
            }
          }
        );


        if (
          passShare > 0
        ) {
          slide.addShape(
            pptx.ShapeType.rect,
            {
              x: 2.05,
              y:
                y + 0.035,

              w:
                4.75 *
                passShare,

              h:
                Math.max(
                  0.10,
                  rowHeight *
                    0.46
                ),

              line: {
                transparency: 100
              },

              fill: {
                color:
                  PPT_THEME.green
              }
            }
          );
        }


        if (
          failShare > 0
        ) {
          slide.addShape(
            pptx.ShapeType.rect,
            {
              x:
                2.05 +
                4.75 *
                  passShare,

              y:
                y + 0.035,

              w:
                4.75 *
                failShare,

              h:
                Math.max(
                  0.10,
                  rowHeight *
                    0.46
                ),

              line: {
                transparency: 100
              },

              fill: {
                color:
                  PPT_THEME.red
              }
            }
          );
        }


        slide.addText(
          `${row.compliance}%`,
          {
            x: 6.95,
            y:
              y - 0.015,
            w: 0.65,
            h:
              rowHeight *
              0.8,

            fontFace:
              PPT_THEME.font,

            fontSize: 9,
            bold: true,

            color:
              row.compliance >=
              90
                ? PPT_THEME.greenDark
                : row.compliance >=
                    80
                  ? PPT_THEME.amber
                  : PPT_THEME.red,

            align: "right",

            margin: 0,

            valign:
              "mid"
          }
        );


        slide.addText(
          `${row.total}`,
          {
            x: 7.65,
            y:
              y - 0.015,
            w: 0.4,
            h:
              rowHeight *
              0.8,

            fontFace:
              PPT_THEME.font,

            fontSize: 8,

            color:
              PPT_THEME.muted,

            align: "right",

            margin: 0,

            valign:
              "mid"
          }
        );
      }
    );


    slide.addText(
      "Green = compliant     Red = non-compliant     Figure right = notices checked",
      {
        x: 0.65,
        y: 6.48,
        w: 7.35,
        h: 0.16,

        fontFace:
          PPT_THEME.font,

        fontSize: 7.8,

        color:
          PPT_THEME.muted,

        margin: 0,

        fit:
          "shrink"
      }
    );
  }


  /*
    RIGHT CARD:
    FAILURE REASONS
  */
  pptCard(
    pptx,
    slide,
    8.72,
    2.52,
    4.26,
    4.35
  );


  slide.addText(
    "Non-compliance themes",
    {
      x: 9.02,
      y: 2.72,
      w: 3.55,
      h: 0.28,

      fontFace:
        PPT_THEME.font,

      fontSize: 15,
      bold: true,

      color:
        PPT_THEME.navy,

      margin: 0
    }
  );


  slide.addText(
    "Most common recorded reasons",
    {
      x: 9.02,
      y: 3.02,
      w: 3.55,
      h: 0.18,

      fontFace:
        PPT_THEME.font,

      fontSize: 9.5,

      color:
        PPT_THEME.muted,

      margin: 0
    }
  );


  const reasons =
  getHsWarningTopFailureReasons(
    records,
    5
  );


const primaryTheme =
  reasons[0] || null;


let managementInsight =
  "";


if (!summary.total) {
  managementInsight =
    "No Warning Notice compliance checks were recorded for the selected period.";
} else if (
  summary.incorrect === 0
) {
  managementInsight =
    `All ${summary.total} Warning Notices reviewed were compliant during the selected period.`;
} else if (
  primaryTheme
) {
  managementInsight =
    `${summary.incorrect} of ${summary.total} notices were non-compliant (${100 - summary.compliance}%), with ${primaryTheme.reason.toLowerCase()} the most frequently identified documentation issue.`;
} else {
  managementInsight =
    `${summary.incorrect} of ${summary.total} notices were non-compliant during the selected period.`;
}


  if (!reasons.length) {
    slide.addText(
      summary.incorrect
        ? "No failure reasons were recorded for the selected records."
        : "No non-compliant notices in the selected records.",
      {
        x: 9.02,
        y: 3.55,
        w: 3.5,
        h: 0.6,

        fontFace:
          PPT_THEME.font,

        fontSize: 11,

        color:
          PPT_THEME.muted,

        margin: 0
      }
    );
  } else {
    const maximum =
      Math.max(
        ...reasons.map(
          item =>
            item.count
        ),
        1
      );


    reasons.forEach(
      (
        item,
        index
      ) => {
        const y =
          3.42 +
          index *
            0.63;


        slide.addText(
          item.reason,
          {
            x: 9.02,
            y,
            w: 2.75,
            h: 0.25,

            fontFace:
              PPT_THEME.font,

            fontSize: 8.8,
            bold: true,

            color:
              PPT_THEME.navy,

            margin: 0,

            fit:
              "shrink"
          }
        );


        slide.addText(
          String(
            item.count
          ),
          {
            x: 12.03,
            y,
            w: 0.38,
            h: 0.22,

            fontFace:
              PPT_THEME.font,

            fontSize: 9,
            bold: true,

            color:
              PPT_THEME.red,

            align: "right",

            margin: 0
          }
        );


        slide.addShape(
          pptx.ShapeType.rect,
          {
            x: 9.02,
            y:
              y + 0.30,

            w: 3.35,
            h: 0.09,

            line: {
              transparency: 100
            },

            fill: {
              color:
                PPT_THEME.grid
            }
          }
        );


        slide.addShape(
          pptx.ShapeType.rect,
          {
            x: 9.02,
            y:
              y + 0.30,

            w:
              3.35 *
              (
                item.count /
                maximum
              ),

            h: 0.09,

            line: {
              transparency: 100
            },

            fill: {
              color:
                PPT_THEME.red
            }
          }
        );
      }
    );
  }

/*
  MANAGEMENT INSIGHT
*/
slide.addShape(
  pptx.ShapeType.roundRect,
  {
    x: 0.55,
    y: 6.88,
    w: 12.23,
    h: 0.38,

    rectRadius: 0.05,

    line: {
      color:
        PPT_THEME.purpleLight,
      transparency: 100
    },

    fill: {
      color:
        PPT_THEME.purpleLight
    }
  }
);


slide.addText(
  [
    {
      text:
        "Management insight: ",

      options: {
        bold: true,
        color:
          PPT_THEME.purple
      }
    },

    {
      text:
        managementInsight,

      options: {
        bold: false,
        color:
          PPT_THEME.navy
      }
    }
  ],
  {
    x: 0.72,
    y: 6.97,
    w: 11.88,
    h: 0.16,

    fontFace:
      PPT_THEME.font,

    fontSize: 9.4,

    margin: 0,

    fit:
      "shrink"
  }
);
  /*
    FOOTER
  */
  const filterParts =
    [];


  if (
    hsWarningFilters.engineer
  ) {
    filterParts.push(
      `Engineer: ${hsWarningFilters.engineer}`
    );
  }


  if (
    hsWarningFilters.result
  ) {
    filterParts.push(
      `Result: ${hsWarningFilters.result}`
    );
  }


  if (
    hsWarningFilters.source
  ) {
    const sourceRecord =
      (
        hsWarningState.records ||
        []
      ).find(
        record =>
          record.sourceFileKey ===
          hsWarningFilters.source
      );


    if (
      sourceRecord
        ?.sourceFile
    ) {
      filterParts.push(
        `Source: ${sourceRecord.sourceFile}`
      );
    }
  }


  if (
    hsWarningFilters.search
      .trim()
  ) {
    filterParts.push(
      `Search: ${hsWarningFilters.search.trim()}`
    );
  }


  slide.addText(
    filterParts.length
      ? `Filters applied • ${filterParts.join(" • ")}`
      : "All Warning Notice records within the selected period",
    {
      x: 0.5,
      y: 7.31,
      w: 12.3,
      h: 0.10,

      fontFace:
        PPT_THEME.font,

      fontSize: 7.8,

      color:
        PPT_THEME.muted,

      align:
        "center",

      margin: 0,

      fit:
        "shrink"
    }
  );
}


async function generateHsWarningSlide() {
  const button =
    el(
      "hsWarningGenerateSlideBtn"
    );


  const originalText =
    button?.textContent ||
    "Generate Slide";


  try {
    if (
      !window.PptxGenJS
    ) {
      throw new Error(
        "PptxGenJS has not loaded."
      );
    }


    const records =
      getFilteredHsWarningRecords();


    if (!records.length) {
      alert(
        "There are no Warning Notice records matching the current filters."
      );

      return;
    }


    if (button) {
      button.disabled =
        true;

      button.textContent =
        "Generating…";
    }


    const pptx =
      new window.PptxGenJS();


    pptx.layout =
      "LAYOUT_WIDE";


    pptx.author =
      "Property Care Auditing";


    pptx.subject =
      "Health & Safety Warning Notice Compliance";


    pptx.title =
      "Warning Notice Compliance";


    pptx.company =
      "Property Care";


    pptx.lang =
      "en-GB";


    pptx.theme = {
      headFontFace:
        PPT_THEME.font,

      bodyFontFace:
        PPT_THEME.font,

      lang: "en-GB"
    };


    pptHsWarningNoticesSlide(
      pptx,
      records
    );


    const safePeriod =
      getHsWarningSlidePeriodLabel(
        records
      )
        .replace(
          /[^a-z0-9]+/gi,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        );


    await pptx.writeFile({
      fileName:
        `H-S-Warning-Notice-Compliance-${safePeriod || "Report"}.pptx`
    });
  } catch (error) {
    console.error(
      "Warning Notice slide generation failed:",
      error
    );


    alert(
      `The Warning Notice slide could not be generated: ${
        error?.message ||
        error
      }`
    );
  } finally {
    if (button) {
      button.disabled =
        false;

      button.textContent =
        originalText;
    }
  }
}


function initHsWarningSlideGenerator() {
  const button =
    el(
      "hsWarningGenerateSlideBtn"
    );


  if (
    !button ||
    button.dataset
      .pptInitialised ===
      "true"
  ) {
    return;
  }


  button.dataset
    .pptInitialised =
      "true";


  button.addEventListener(
    "click",
    generateHsWarningSlide
  );
}
function initHsWarningNotices() {
  initHsWarningManager();
  initHsWarningSlideGenerator();

  const importButton =
    el(
      "hsWarningImportBtn"
    );


  const input =
    el(
      "hsWarningWorkbookInput"
    );


  importButton
    ?.addEventListener(
      "click",
      () => {
        input?.click();
      }
    );


  input
    ?.addEventListener(
      "change",
      async event => {
        const file =
          event.target
            .files?.[0];


        event.target.value =
          "";


        if (!file) {
          return;
        }


        try {
          importButton.disabled =
            true;


          importButton.textContent =
            "Importing…";


          const result =
            await importHsWarningWorkbook(
              file
            );


          const cloudResult =
            await syncHsWarningNoticesToCloud();


          alert(
            `Warning Notice workbook imported successfully.\n\n` +
            `${result.count} compliance records imported from "${result.sheetName}".\n\n` +
            (
              cloudResult.synced
                ? "Firebase cloud register updated successfully."
                : cloudResult.reason ===
                    "not-signed-in"
                  ? "Data is saved locally. Log in to sync it to Firebase."
                  : "Data was imported locally, but Firebase sync needs attention."
            )
          );
        } catch (error) {
          console.error(
            "Warning Notice import failed:",
            error
          );


          alert(
            error?.message ||
            "The Warning Notice workbook could not be imported."
          );
        } finally {
          importButton.disabled =
            false;


          importButton.textContent =
            "Import Warning Notices Workbook";
        }
      }
    );


  el(
    "hsWarningPeriod"
  )?.addEventListener(
    "change",
    event => {
      hsWarningFilters.period =
        event.target.value;

      renderHsWarningNotices();
    }
  );


  el(
    "hsWarningDateFrom"
  )?.addEventListener(
    "change",
    event => {
      hsWarningFilters.dateFrom =
        event.target.value;

      renderHsWarningNotices();
    }
  );


  el(
    "hsWarningDateTo"
  )?.addEventListener(
    "change",
    event => {
      hsWarningFilters.dateTo =
        event.target.value;

      renderHsWarningNotices();
    }
  );


  el(
    "hsWarningEngineer"
  )?.addEventListener(
    "change",
    event => {
      hsWarningFilters.engineer =
        event.target.value;

      renderHsWarningNotices();
    }
  );


  el(
    "hsWarningResult"
  )?.addEventListener(
    "change",
    event => {
      hsWarningFilters.result =
        event.target.value;

      renderHsWarningNotices();
    }
  );


  el(
    "hsWarningSource"
  )?.addEventListener(
    "change",
    event => {
      hsWarningFilters.source =
        event.target.value;

      renderHsWarningNotices();
    }
  );


  el(
    "hsWarningSearch"
  )?.addEventListener(
    "input",
    event => {
      hsWarningFilters.search =
        event.target.value;

      renderHsWarningNotices();
    }
  );


  el(
    "hsWarningClearFiltersBtn"
  )?.addEventListener(
    "click",
    clearHsWarningFilters
  );


  renderHsWarningNotices();


  if (!cloudSignedIn()) {
    setHsWarningCloudStatus(
      "Local only • Log in to sync Warning Notice data to Firebase.",
      "warning"
    );
  }
}

function initHsAuditRegister() {
    el(
    "hsAuditPendingBtn"
  )?.addEventListener(
    "click",
    openHsAuditPendingUpdates
  );


  el(
    "hsAuditEditCloseBtn"
  )?.addEventListener(
    "click",
    closeHsAuditEditor
  );

el(
  "hsAuditRecordCloseBtn"
)?.addEventListener(
  "click",
  closeHsAuditRecordModal
);


el(
  "hsAuditRecordCancelBtn"
)?.addEventListener(
  "click",
  closeHsAuditRecordModal
);


el(
  "hsAuditRecordSaveBtn"
)?.addEventListener(
  "click",
  saveHsAuditRecord
);
  el(
    "hsAuditEditCancelBtn"
  )?.addEventListener(
    "click",
    closeHsAuditEditor
  );
el(
  "hsAuditRecordResult"
)?.addEventListener(
  "change",
  event => {
    const followUp =
      el(
        "hsAuditRecordFollowUp"
      );


    if (!followUp) {
      return;
    }


    if (
      event.target.value ===
      "FAIL"
    ) {
      followUp.checked =
        true;
    }


    if (
      event.target.value ===
      "PASS"
    ) {
      followUp.checked =
        false;
    }
  }
);

  el(
    "hsAuditEditSaveBtn"
  )?.addEventListener(
    "click",
    saveHsAuditEditor
  );


  el(
    "hsAuditPendingCloseBtn"
  )?.addEventListener(
    "click",
    closeHsAuditPendingUpdates
  );


  el(
    "hsAuditPendingCloseFooterBtn"
  )?.addEventListener(
    "click",
    closeHsAuditPendingUpdates
  );


  el(
    "hsAuditMarkAllCompleteBtn"
  )?.addEventListener(
    "click",
    markAllHsAuditUpdatesComplete
  );


  renderHsAuditPendingUpdates();
  el(
  "hsAuditHistoryFrom"
)?.addEventListener(
  "change",
  renderHsAuditHistory
);


el(
  "hsAuditHistoryTo"
)?.addEventListener(
  "change",
  renderHsAuditHistory
);


el(
  "hsAuditHistoryEngineer"
)?.addEventListener(
  "change",
  renderHsAuditHistory
);


el(
  "hsAuditHistoryResult"
)?.addEventListener(
  "change",
  renderHsAuditHistory
);


el(
  "hsAuditHistoryResolution"
)?.addEventListener(
  "change",
  renderHsAuditHistory
);


el(
  "hsAuditHistoryClearBtn"
)?.addEventListener(
  "click",
  () => {
    if (
      el(
        "hsAuditHistoryFrom"
      )
    ) {
      el(
        "hsAuditHistoryFrom"
      ).value = "";
    }


    if (
      el(
        "hsAuditHistoryTo"
      )
    ) {
      el(
        "hsAuditHistoryTo"
      ).value = "";
    }


    if (
      el(
        "hsAuditHistoryEngineer"
      )
    ) {
      el(
        "hsAuditHistoryEngineer"
      ).value = "";
    }


    if (
      el(
        "hsAuditHistoryResult"
      )
    ) {
      el(
        "hsAuditHistoryResult"
      ).value = "";
    }


    if (
      el(
        "hsAuditHistoryResolution"
      )
    ) {
      el(
        "hsAuditHistoryResolution"
      ).value = "";
    }


    renderHsAuditHistory();
  }
);


renderHsAuditHistory();

renderHsAuditOverview();
  const importButton =
    el(
      "hsAuditImportBtn"
    );


  const input =
    el(
      "hsAuditWorkbookInput"
    );


  importButton
    ?.addEventListener(
      "click",
      () =>
        input?.click()
    );


  input?.addEventListener(
    "change",
    async event => {
      const file =
        event.target.files
          ?.[0];


      if (!file) {
        return;
      }


      const status =
        el(
          "hsAuditImportStatus"
        );


      try {
        if (status) {
          status.textContent =
            "Importing H&S register…";
        }


        const count =
          await importHsAuditRegisterWorkbook(
            file
          );


        if (status) {
          status.textContent =
            `Imported ${count} engineer${
              count === 1
                ? ""
                : "s"
            }.`;
        }
      } catch (error) {
        console.error(
          "H&S register import failed:",
          error
        );


        if (status) {
          status.textContent =
            "H&S register import failed.";
        }


        alert(
          error.message ||
          "The H&S register could not be imported."
        );
      } finally {
        event.target.value =
          "";
      }
    }
  );


  el(
    "hsAuditStatusFilter"
  )?.addEventListener(
    "change",
    renderHsAuditRegister
  );


  el(
    "hsAuditSearch"
  )?.addEventListener(
    "input",
    renderHsAuditRegister
  );


  el(
    "hsAuditClearFiltersBtn"
  )?.addEventListener(
    "click",
    () => {
      if (
        el(
          "hsAuditStatusFilter"
        )
      ) {
        el(
          "hsAuditStatusFilter"
        ).value = "";
      }


      if (
        el(
          "hsAuditSearch"
        )
      ) {
        el(
          "hsAuditSearch"
        ).value = "";
      }


      renderHsAuditRegister();
    }
  );


  renderHsAuditRegister();
}
function initHealthSafety() {
  document
    .querySelectorAll(
      ".hs-subtab"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          setHealthSafetyTab(
            button.dataset.hsTab
          );
        }
      );
    });

  document
    .querySelectorAll(
      "[data-hs-open]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          setHealthSafetyTab(
            button.dataset.hsOpen
          );
        }
      );
    });

  setHealthSafetyTab(
    "overview"
  );
}


function setTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));

  el("tabVerbal").classList.toggle("active", name === "verbal");
  el("tabReport").classList.toggle("active", name === "report");
  el("tabSaved").classList.toggle(
  "active",
  name === "saved"
);

if (el("tabEngineers")) {
  el("tabEngineers").classList.toggle(
    "active",
    name === "engineers"
  );
}

if (el("tabDashboard")) {
  el("tabDashboard").classList.toggle(
    "active",
    name === "dashboard"
  );
}

if (el("tabAnalytics")) {
  el("tabAnalytics").classList.toggle(
    "active",
    name === "analytics"
  );
}

if (el("tabHealthSafety")) {
  el("tabHealthSafety").classList.toggle(
    "active",
    name === "healthSafety"
  );
}

if (name === "report") {
  renderReportPreview();
}

if (name === "saved") {
  renderSavedList();
}

if (name === "dashboard") {
  renderExecutiveDashboard();
}

if (name === "analytics") {
  renderAnalytics();
}

if (name === "healthSafety") {
  setHealthSafetyTab(
    "overview"
  );
}
  if (name === "engineers") {
  refreshEngineerDropdown(); 
  // ✅ Load saved draft for current engineer/range (do NOT overwrite by regenerating)
  loadEngineerDraftIntoBox();
}

}
function lastNonEmptyLine(text) {
  const lines = String(text || "").split("\n").map(l => l.trim()).filter(Boolean);
  return lines.length ? lines[lines.length - 1] : "";
}

function getCloseOutForCurrent(style, hasFindings, inspection = null) {
  // If user has edited close-out, always use it
  const custom = (state.current?.closeOutOverride || "").trim();
  if (custom) return custom;

  const c = inspection || state.current;

  // ✅ New smart close-out (positives + improvements)
  if (c) return buildCloseOutFromInspection(c, style);

  // Fallback (should rarely happen)
  return closeOutLineForStyle(style, hasFindings);
}


function severityLabel(sev) {
  const s = String(sev || "").toLowerCase();
  if (s === "critical") return "ID";
  if (s === "major") return "AR";
  if (s === "minor") return "NCS";
  if (s === "advisory") return "Advisory";
  return sev || "—";
}

function sortFindingsBySeverity(findings) {
  const order = { Critical: 0, Major: 1, Minor: 2, Advisory: 3 };
  return [...findings].sort((a,b) => (order[a.severity] ?? 99) - (order[b.severity] ?? 99));
}

function summaryLine(c, opts = {}) {
  const { hideZeroPositives = false } = opts;

  const findings = c.findings || [];
  const counts = { Critical: 0, Major: 0, Minor: 0, Advisory: 0 };
  findings.forEach(f => { if (counts[f.severity] !== undefined) counts[f.severity]++; });

  const posCount = (c.positives || []).length;

  const bits = [];

  // ✅ Only show positives if > 0 (when the option is enabled)
  if (!(hideZeroPositives && posCount === 0)) {
    bits.push(`${posCount} positive${posCount === 1 ? "" : "s"}`);
  }

  bits.push(`${findings.length} finding${findings.length === 1 ? "" : "s"}`);

  const sevBits = Object.keys(counts)
    .filter(k => counts[k] > 0)
    .map(k => `${counts[k]} ${k}`);

  if (sevBits.length) bits.push(`(${sevBits.join(", ")})`);

  return bits.join(" • ");
}


function formatDate(yyyyMmDd) {
  if (!yyyyMmDd) return "—";
  const [y,m,d] = yyyyMmDd.split("-").map(Number);
  if (!y || !m || !d) return yyyyMmDd;
  return `${String(d).padStart(2,"0")}/${String(m).padStart(2,"0")}/${y}`;
}

function parseDateSafe(yyyyMmDd) {
  if (!yyyyMmDd) return null;
  const d = new Date(yyyyMmDd + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}
function updateSelectedCount() {
  const countEl = el("selectedCount");
  if (!countEl) return;

  const n = document.querySelectorAll(".saved-select:checked").length;

  countEl.textContent = `${n} Selected`;
  countEl.classList.toggle("hidden", n === 0);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert("Copied.");
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    alert("Copied.");
  }
}

function exportAllJson() {
  const data = JSON.stringify(state.db, null, 2);
  downloadTextFile("ppc-inspections-export.json", data);
}
// ======================= HTML EXPORT (single long sheet) =======================
const EXPORT_CSS = `
  :root { color-scheme: light; }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 24px;
    background: #fff;
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    color: #111;
  }

  .print-content {
    max-width: 900px;
    margin: 0 auto;
  }

  h1 {
    font-size: 22px;
    margin: 0 0 12px;
  }

  h2 {
    font-size: 19px;
    margin: 20px 0 12px;
  }

  h3 {
    margin: 0 0 8px;
  }

  .muted {
    color: #444;
    font-size: 13px;
    line-height: 1.4;
  }

  .box {
    border: 1px solid #d7d7d7;
    border-radius: 14px;
    padding: 12px;
    margin: 12px 0;
  }

  .rp-section-title {
    font-weight: 700;
    margin: 14px 0 6px;
  }

  .rp-small {
    font-size: 13px;
    line-height: 1.4;
    color: #222;
  }

  .rp-block {
    border: 1px solid #d7d7d7;
    border-radius: 14px;
    padding: 12px;
    margin: 10px 0;
  }

  ul {
    margin: 8px 0 0 18px;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  /* Engineer visual analytics */
  .engineer-analytics-report {
    margin: 20px 0;
  }

  .engineer-analytics-heading {
    margin: 0 0 14px;
    font-size: 22px;
  }

  .engineer-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 16px;
  }

  .engineer-kpi-card {
    border: 1px solid #d8d8d8;
    border-radius: 14px;
    padding: 14px 10px;
    text-align: center;
    background: #fafafa;
  }

  .engineer-kpi-value {
    display: block;
    font-size: 22px;
    line-height: 1.1;
    font-weight: 800;
  }

  .engineer-kpi-label {
    display: block;
    margin-top: 6px;
    color: #555;
    font-size: 11px;
  }

  .engineer-chart-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .engineer-chart-card {
    border: 1px solid #d8d8d8;
    border-radius: 14px;
    padding: 14px;
    background: #fff;
    break-inside: avoid;
    page-break-inside: avoid;
  }

  .engineer-chart-card h3 {
    margin: 0 0 12px;
    font-size: 15px;
  }

  .engineer-chart-row {
    margin-bottom: 11px;
  }

  .engineer-chart-row:last-child {
    margin-bottom: 0;
  }

  .engineer-chart-label {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 5px;
    font-size: 12px;
  }

  .engineer-chart-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .engineer-chart-value {
    flex: 0 0 auto;
    font-weight: 700;
  }

  .engineer-chart-track {
    width: 100%;
    height: 12px;
    overflow: hidden;
    border: 1px solid #d8d8d8;
    border-radius: 999px;
    background: #eee;
  }

  .engineer-chart-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      #a855f7,
      #7c3aed
    );
  }

  .engineer-pass-fail-bar {
    display: flex;
    width: 100%;
    height: 28px;
    overflow: hidden;
    border: 1px solid #d8d8d8;
    border-radius: 999px;
    background: #eee;
  }

  .engineer-pass-section,
  .engineer-fail-section {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    overflow: hidden;
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    white-space: nowrap;
  }

  .engineer-pass-section {
    background: #15803d;
  }

  .engineer-fail-section {
    background: #b91c1c;
  }

  .engineer-chart-legend {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-top: 8px;
    color: #555;
    font-size: 11px;
  }

  @media (max-width: 700px) {
    body {
      padding: 14px;
    }

    .engineer-kpi-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .engineer-chart-grid {
      grid-template-columns: 1fr;
    }

    .engineer-chart-card[style*="grid-column"] {
      grid-column: auto !important;
    }
  }
  /* Repeat, monthly and comparison analytics */

  .engineer-repeat-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-bottom: 14px;
  }

  .engineer-repeat-summary > div {
    border: 1px solid #d8d8d8;
    border-radius: 12px;
    padding: 10px;
    text-align: center;
    background: #fafafa;
  }

  .engineer-repeat-summary strong {
    display: block;
    font-size: 18px;
  }

  .engineer-repeat-summary span {
    display: block;
    margin-top: 4px;
    color: #555;
    font-size: 11px;
  }

  .engineer-chart-note {
    margin-bottom: 12px;
  }

  .engineer-month-row {
    margin-bottom: 14px;
  }

  .engineer-month-row:last-child {
    margin-bottom: 0;
  }

  .engineer-month-heading {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
    font-size: 12px;
  }

  .engineer-month-heading span {
    color: #555;
    text-align: right;
  }

  .engineer-comparison-heading,
  .engineer-comparison-row {
    display: grid;
    grid-template-columns: 1fr 1.25fr 0.75fr;
    gap: 10px;
    align-items: center;
  }

  .engineer-comparison-heading {
    margin-top: 12px;
    padding: 0 10px 7px;
    border-bottom: 1px solid #d8d8d8;
    color: #555;
    font-size: 11px;
  }

  .engineer-comparison-row {
    padding: 10px;
    border-bottom: 1px solid #d8d8d8;
    font-size: 12px;
  }

  .engineer-comparison-row:last-child {
    border-bottom: 0;
  }

  .analytics-change-good {
    color: #15803d;
    font-weight: 750;
  }

  .analytics-change-bad {
    color: #b91c1c;
    font-weight: 750;
  }

  @media (max-width: 700px) {
    .engineer-repeat-summary {
      grid-template-columns: 1fr;
    }

    .engineer-month-heading {
      flex-direction: column;
      gap: 3px;
    }

    .engineer-month-heading span {
      text-align: left;
    }

    .engineer-comparison-heading {
      display: none;
    }

    .engineer-comparison-row {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
  /* Watermark */
  .print-watermark {
    position: fixed;
    top: 14px;
    right: 14px;
    opacity: 0.18;
    pointer-events: none;
    z-index: 10;
  }

  .print-watermark img {
    max-width: 220px;
    height: auto;
  }
`;

function wrapAsStandaloneHtml(innerHtml, title = "PPC Report") {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>${EXPORT_CSS}</style>
</head>
<body>
${innerHtml}
</body>
</html>`;
}

async function shareOrDownloadHtmlFile(fullHtmlDoc, filename) {
  const blob = new Blob([fullHtmlDoc], { type: "text/html;charset=utf-8" });
  const file = new File([blob], filename, { type: "text/html" });

  // Share sheet first (mobile best)
  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    await navigator.share({
      title: filename,
      text: "HTML report attached.",
      files: [file]
    });
    return;
  }

  // Fallback: download
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
// ============================================================================//

function clearAll() {
  const ok = confirm("Clear ALL saved inspections? This cannot be undone.");
  if (!ok) return;
  state.db = { inspections: [] };
  saveDb();
  renderSavedList();
  refreshEngineerDropdown();
  newInspection();
  renderEngineerPanelPlaceholder();
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
async function uploadCompressedDataUrlToCloudinary(dataUrl) {
  const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const fd = new FormData();
  fd.append("file", dataUrl); // ✅ Cloudinary accepts data URLs
  fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(url, { method: "POST", body: fd });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Cloudinary upload failed: ${msg}`);
  }

  const data = await res.json();
console.log("Cloudinary response:", data);
return data.secure_url || "";

}

// --- Photo helpers (compress to keep localStorage happy) ---
async function fileToCompressedDataUrl(file, maxW = 1200, quality = 0.75) {
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const scale = Math.min(1, maxW / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  // JPEG is smaller than PNG for photos
  return canvas.toDataURL("image/jpeg", quality);
}

function setPhotoPreview(dataUrl) {
  const wrap = el("findingPhotoPreview");
  const img = el("findingPhotoImg");
  if (!wrap || !img) return;

  if (!dataUrl) {
    img.src = "";
    wrap.classList.add("hidden");
    return;
  }

  img.src = dataUrl;
  wrap.classList.remove("hidden");
}
function photoHtml(f, borderColor) {
  const src = (f && (f.photoUrl || f.photoDataUrl)) ? (f.photoUrl || f.photoDataUrl) : "";
  if (!src) return "";

  return `
    <div style="margin-top:8px;">
      <img
        src="${src}"
        crossorigin="anonymous"
        referrerpolicy="no-referrer"
        style="
          display:block;
          width:100%;
          max-width:420px;
          height:auto;
          max-height:280px;
          object-fit:contain;
          border-radius:12px;
          border:1px solid ${borderColor};
        "
      />
    </div>
  `;
}


async function waitForImages(root, timeoutMs = 3000) {
  const imgs = Array.from(root.querySelectorAll("img"));
  if (!imgs.length) return;

  await Promise.race([
    Promise.all(imgs.map(img => new Promise(resolve => {
      if (img.complete) return resolve();
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", resolve, { once: true });
    }))),
    new Promise(resolve => setTimeout(resolve, timeoutMs))
  ]);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
// ✅ PDF that matches the PRINT PREVIEW (renders printArea, screenshots it, slices into pages)
// ✅ PDF that matches the PRINT PREVIEW (renders printArea, screenshots it, slices into real pages)
// Works in iOS Mail / share previews (no negative Y drawing)
async function buildPdfFromPrintPreview(html, filename = "report.pdf") {
  const pa = el("printArea");

  // Save current state so we can restore cleanly
  const prevHidden = pa.classList.contains("hidden");
  const prevHtml = pa.innerHTML;
  const prevStyle = pa.style.cssText;

  // 1) Render the print HTML into printArea
  pa.innerHTML = html;
  pa.classList.remove("hidden");

  // Force it to be measurable/visible for html2canvas on all browsers
  pa.style.cssText = prevStyle + `
    display:block !important;
    position:fixed !important;
    left:0 !important;
    top:0 !important;
    z-index:999999 !important;
    width:794px !important;      /* ~A4 content width at 96dpi */
    max-width:none !important;
    background:#ffffff !important;
    opacity:1 !important;
    pointer-events:none !important;
  `;

  document.body.classList.add("pdf-export");

  // 2) Wait for layout + images
  await new Promise(requestAnimationFrame);
  await waitForImages(pa, 8000);
  await new Promise(r => setTimeout(r, 150));

  // 3) Screenshot the rendered print area
  const canvas = await html2canvas(pa, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: "#ffffff",
    scrollX: 0,
    scrollY: 0,
    windowWidth: pa.scrollWidth,
    windowHeight: pa.scrollHeight
  });

  // 4) Slice into A4 pages (NO negative Y)
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // If we fit the screenshot width to the PDF page width,
  // how many source pixels tall correspond to one PDF page?
  const pageHeightPx = Math.floor(canvas.width * (pageH / pageW));

  let y = 0;
  let pageIndex = 0;

  while (y < canvas.height) {
    const sliceH = Math.min(pageHeightPx, canvas.height - y);

    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = canvas.width;
    pageCanvas.height = sliceH;

    const ctx = pageCanvas.getContext("2d");
    ctx.drawImage(
      canvas,
      0, y, canvas.width, sliceH,   // source rect
      0, 0, canvas.width, sliceH    // destination rect
    );

    const imgData = pageCanvas.toDataURL("image/jpeg", 0.92);

    if (pageIndex > 0) pdf.addPage();

    // Render at top-left, scaled to page width
    const renderH = (sliceH * pageW) / canvas.width;
    pdf.addImage(imgData, "JPEG", 0, 0, pageW, renderH);

    y += sliceH;
    pageIndex++;
  }

  // 5) Cleanup / restore
  document.body.classList.remove("pdf-export");
  pa.style.cssText = prevStyle;
  pa.innerHTML = prevHtml;
  if (prevHidden) pa.classList.add("hidden");

  return pdf.output("blob");
}


// 🧩 Build a PDF blob from given HTML string
async function buildPdfFromHtml(html, filename = "report.pdf") {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "pt", "a4");

  // Create a temporary container to render the HTML
  const container = document.createElement("div");
  container.style.width = "800px";
  container.innerHTML = html;
  document.body.appendChild(container);

  await doc.html(container, {
    callback: function (pdf) {
      document.body.removeChild(container);
    },
    margin: [20, 20, 20, 20],
    autoPaging: "text",
    x: 0,
    y: 0,
    width: 570,
    windowWidth: 760
  });

  return doc.output("blob");
}
// ✅ Engineer PDF: force "Audits" to start on a new PDF page (matches print preview)
async function buildEngineerPdfSplit(html, filename = "engineer.pdf") {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "pt", "a4");

  // Render into temporary container
  const container = document.createElement("div");
  container.style.width = "800px";
  container.innerHTML = html;
  document.body.appendChild(container);

  const top = container.querySelector("#engTop");
  const audits = container.querySelector("#engAudits");

  if (!top || !audits) {
    // fallback to normal if wrappers not found
    document.body.removeChild(container);
    return await buildPdfFromHtml(html, filename);
  }

  // Helper to render a node into the existing doc
  const renderNode = (node, addPageFirst) => new Promise((resolve) => {
    if (addPageFirst) doc.addPage();

    doc.html(node, {
      callback: () => resolve(),
      margin: [20, 20, 20, 20],
      autoPaging: "text",
      x: 0,
      y: 0,
      width: 570,
      windowWidth: 800,
      html2canvas: { scale: 2, useCORS: true }
    });
  });

  // Page 1: Top section
  await renderNode(top, false);

  // Page 2+: Audits section (forced new page)
  await renderNode(audits, true);

   document.body.removeChild(container);
  return doc.output("blob");
}


// ================= QUARTERLY POWERPOINT EXPORT =================

const PPT_THEME = {
  navy: "050B35",
  purple: "7C3AED",
  purpleLight: "F2ECFF",
  blue: "2563EB",
  green: "20C463",
  greenDark: "08A94F",
  red: "F33D43",
  amber: "EAB308",
  grey: "DADAE0",
  border: "D8D9E2",
  grid: "E8E9EF",
  muted: "526184",
  white: "FFFFFF",
  background: "F7F7FB",
  font: "Aptos"
};


function pptPercent(value, total) {
  return total
    ? Math.round((value / total) * 100)
    : 0;
}


function pptAuditPassed(audit) {
  return isPassingOutcome(
    audit?.outcome
  );
}


function pptQuarterName(value) {
  const date =
    value instanceof Date
      ? value
      : parseDateSafe(value);

  if (!date) {
    return "Selected period";
  }

  return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
}


function pptCategory(defect) {
  const category = String(
    defect?.category || ""
  ).toLowerCase();

  const title = String(
    defect?.title || ""
  ).toLowerCase();

  const severity =
    getAnalyticsSeverityLabel(
      defect?.severity
    );

  if (
    /document|paperwork|certificate|lgsr|record/.test(
      `${category} ${title}`
    )
  ) {
    return "Documentation Errors";
  }

  if (severity === "ID") {
    return "Immediately Dangerous";
  }

  if (severity === "AR") {
    return "At Risk";
  }

  if (severity === "NCS") {
    return "Not to Current Standards";
  }

  if (
    severity === "Advisory" ||
    /observation|advisory/.test(category)
  ) {
    return "Observations";
  }

  return "Observations";
}


function pptCount(items, getKey) {
  const map = new Map();

  (items || []).forEach(item => {
    const key =
      String(
        getKey(item) || "Other"
      ).trim() || "Other";

    map.set(
      key,
      (map.get(key) || 0) + 1
    );
  });

  return map;
}


function pptSorted(
  map,
  limit = Infinity
) {
  return [...map.entries()]
    .sort(
      (a, b) =>
        b[1] - a[1] ||
        a[0].localeCompare(b[0])
    )
    .slice(0, limit);
}


function formatPptDate(date) {
  if (!(date instanceof Date)) {
    return "";
  }

  return [
    date.getFullYear(),
    String(
      date.getMonth() + 1
    ).padStart(2, "0"),
    String(
      date.getDate()
    ).padStart(2, "0")
  ].join("-");
}


function formatPptDisplayDate(value) {
  const date =
    parseAnalyticsDate(value);

  if (!date) {
    return "";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}


function formatPptPeriodLabel(
  from,
  to
) {
  const fromDate =
    parseAnalyticsDate(from);

  const toDate =
    parseAnalyticsDate(to);

  if (!fromDate || !toDate) {
    return "Selected period";
  }

  const sameQuarter =
    fromDate.getFullYear() ===
      toDate.getFullYear() &&
    Math.floor(
      fromDate.getMonth() / 3
    ) ===
      Math.floor(
        toDate.getMonth() / 3
      );

  const quarterStartMonth =
    Math.floor(
      fromDate.getMonth() / 3
    ) * 3;

  const expectedQuarterStart =
    new Date(
      fromDate.getFullYear(),
      quarterStartMonth,
      1
    );

  const expectedQuarterEnd =
    new Date(
      fromDate.getFullYear(),
      quarterStartMonth + 3,
      0
    );

  const isFullQuarter =
    sameQuarter &&
    fromDate.getTime() ===
      expectedQuarterStart.getTime() &&
    toDate.getTime() ===
      expectedQuarterEnd.getTime();

  if (isFullQuarter) {
    return `Q${
      Math.floor(
        fromDate.getMonth() / 3
      ) + 1
    } ${fromDate.getFullYear()}`;
  }

  return (
    `${formatPptDisplayDate(from)} – ` +
    `${formatPptDisplayDate(to)}`
  );
}


function getQuarterDatesBefore(
  currentFrom
) {
  const selected =
    parseAnalyticsDate(
      currentFrom
    );

  if (!selected) {
    return null;
  }

  const currentQuarterStart =
    Math.floor(
      selected.getMonth() / 3
    ) * 3;

  const previousFrom =
    new Date(
      selected.getFullYear(),
      currentQuarterStart - 3,
      1
    );

  const previousTo =
    new Date(
      selected.getFullYear(),
      currentQuarterStart,
      0
    );

  return {
    from:
      formatPptDate(
        previousFrom
      ),

    to:
      formatPptDate(
        previousTo
      )
  };
}


function getQuarterlyPptComparisonRange() {
  const currentFrom =
    el("analyticsFrom")?.value || "";

  const currentTo =
    el("analyticsTo")?.value || "";

  const mode =
    el("analyticsCompareMode")?.value ||
    "previous-equivalent";

  if (
    !currentFrom ||
    !currentTo
  ) {
    return null;
  }

  if (mode === "custom") {
    const from =
      el("analyticsCompareFrom")
        ?.value || "";

    const to =
      el("analyticsCompareTo")
        ?.value || "";

    if (!from || !to) {
      throw new Error(
        "Choose both custom comparison dates."
      );
    }

    return {
      from,
      to
    };
  }

  if (
    mode ===
    "previous-quarter"
  ) {
    return getQuarterDatesBefore(
      currentFrom
    );
  }

  if (
    mode ===
    "previous-year"
  ) {
    const fromDate =
      parseAnalyticsDate(
        currentFrom
      );

    const toDate =
      parseAnalyticsDate(
        currentTo
      );

    if (!fromDate || !toDate) {
      return null;
    }

    fromDate.setFullYear(
      fromDate.getFullYear() - 1
    );

    toDate.setFullYear(
      toDate.getFullYear() - 1
    );

    return {
      from:
        formatPptDate(
          fromDate
        ),

      to:
        formatPptDate(
          toDate
        )
    };
  }

  const equivalent =
    getAnalyticsComparisonPeriods();

  if (!equivalent) {
    return null;
  }

  return {
    from:
      equivalent.previousFrom,

    to:
      equivalent.previousTo
  };
}


function buildQuarterlyPptData() {
  const periods =
    getExecutiveDashboardPeriods();

  if (!periods) {
    throw new Error(
      "Choose valid Executive Dashboard date ranges before generating the PowerPoint."
    );
  }

  const currentSelection =
    getAnalyticsSelectionForRange(
      periods.currentFrom,
      periods.currentTo
    );

  const currentAudits =
    currentSelection.audits || [];

  const currentDefects =
    currentSelection.defects || [];

  const previousSelection =
    getAnalyticsSelectionForRange(
      periods.previousFrom,
      periods.previousTo
    );

  const previousAudits =
    previousSelection.audits || [];

  const previousDefects =
    previousSelection.defects || [];

  const previousLabel =
    formatPptPeriodLabel(
      periods.previousFrom,
      periods.previousTo
    );

const summarise = (
  audits,
  defects
) => {
  const passes =
    audits.filter(
      audit =>
        pptAuditPassed(audit)
    ).length;

  const fails =
    Math.max(
      0,
      audits.length - passes
    );

  return {
    audits: audits.length,
    defects: defects.length,
    passes,
    fails,

    passRate:
      pptPercent(
        passes,
        audits.length
      ),

    failRate:
      pptPercent(
        fails,
        audits.length
      ),

    defectsPerAudit:
      audits.length
        ? defects.length /
          audits.length
        : 0
  };
};

  const current =
    summarise(
      currentAudits,
      currentDefects
    );

  const previous =
    summarise(
      previousAudits,
      previousDefects
    );

  const engineerNames = [
    ...new Set(
      currentAudits.map(
        audit =>
          String(
            audit.engineer ||
            "Unassigned"
          ).trim() ||
          "Unassigned"
      )
    )
  ].sort(
    (a, b) =>
      a.localeCompare(b)
  );

  const engineers =
    engineerNames.map(
      engineer => {
        const audits =
          currentAudits.filter(
            audit =>
              (
                String(
                  audit.engineer ||
                  "Unassigned"
                ).trim() ||
                "Unassigned"
              ) === engineer
          );

       const passes =
  audits.filter(
    audit =>
      pptAuditPassed(audit)
  ).length;

        return {
          name: engineer,
          total: audits.length,
          pass: passes,
          fail:
            audits.length -
            passes
        };
      }
    );

  const categories = [
    "Immediately Dangerous",
    "At Risk",
    "Not to Current Standards",
    "Observations",
    "Documentation Errors"
  ];

  const currentCategoryCounts =
    pptCount(
      currentDefects,
      pptCategory
    );

  const previousCategoryCounts =
    pptCount(
      previousDefects,
      pptCategory
    );

  return {
    current,
    previous,
    engineers,

       currentLabel:
      formatPptPeriodLabel(
        periods.currentFrom,
        periods.currentTo
      ),

    previousLabel,

    commonDefects:
      pptSorted(
        pptCount(
          currentDefects,
          defect =>
            defect.title ||
            "Untitled defect"
        ),
        8
      ),

    categories:
      categories.map(
        category => ({
          category,

          current:
            currentCategoryCounts.get(
              category
            ) || 0,

          previous:
            previousCategoryCounts.get(
              category
            ) || 0,

          common:
            pptSorted(
              pptCount(
                currentDefects.filter(
                  defect =>
                    pptCategory(
                      defect
                    ) === category
                ),

                defect =>
                  defect.title ||
                  "Untitled defect"
              ),
              3
            )
        })
      )
  };
}


function pptBackground(
  pptx,
  slide
) {
  slide.background = {
    color: PPT_THEME.background
  };

  slide.addShape(
    pptx.ShapeType.rect,
    {
      x: 0,
      y: 0,
      w: 13.333,
      h: 7.5,

      line: {
        color:
          PPT_THEME.background,
        transparency: 100
      },

      fill: {
        color:
          PPT_THEME.background
      }
    }
  );
}


function pptTitle(
  slide,
  title,
  subtitle
) {
  slide.addText(
    title,
    {
      x: 0.4,
      y: 0.18,
      w: 9.5,
      h: 0.38,

      fontFace:
        PPT_THEME.font,

      fontSize: 24,
      bold: true,

      color:
        PPT_THEME.navy,

      margin: 0
    }
  );

  slide.addText(
    subtitle || "",
    {
      x: 0.4,
      y: 0.62,
      w: 9.5,
      h: 0.22,

      fontFace:
        PPT_THEME.font,

      fontSize: 11,

      color:
        PPT_THEME.muted,

      margin: 0
    }
  );
}


function pptCard(
  pptx,
  slide,
  x,
  y,
  w,
  h,
  fill = PPT_THEME.white
) {
  slide.addShape(
    pptx.ShapeType.roundRect,
    {
      x,
      y,
      w,
      h,

      rectRadius: 0.08,

      line: {
        color:
          PPT_THEME.border,

        width: 0.8
      },

      fill: {
        color: fill
      },

      shadow: {
        type: "outer",
        color: "B7BAC8",
        opacity: 0.12,
        blur: 1,
        angle: 45,
        distance: 1
      }
    }
  );
}


function pptMetric(
  pptx,
  slide,
  x,
  y,
  w,
  label,
  value,
  detail,
  change,
  good
) {
  pptCard(
    pptx,
    slide,
    x,
    y,
    w,
    1.38
  );

    slide.addText(
    String(
      label ?? ""
    ),
    {
      x: x + 0.15,
      y: y + 0.13,
      w: w - 0.3,
      h: 0.2,

      fontFace:
        PPT_THEME.font,

      fontSize: 10.5,
      bold: true,

      color:
        PPT_THEME.navy,

      align: "center",
      margin: 0
    }
  );

  slide.addText(
    String(value),
    {
      x: x + 0.15,
      y: y + 0.39,
      w: w - 0.3,
      h: 0.44,

      fontFace:
        PPT_THEME.font,

      fontSize: 28,
      bold: true,

      color:
        PPT_THEME.navy,

      align: "center",
      margin: 0,
      fit: "shrink"
    }
  );

    if (
    change !== null &&
    change !== undefined &&
    change !== ""
  ) {
    slide.addText(
      String(change),
      {
        x: x + 0.12,
        y: y + 0.85,
        w: w - 0.24,
        h: 0.18,

        fontFace:
          PPT_THEME.font,

        fontSize: 9.5,
        bold: true,

        color:
          good
            ? PPT_THEME.green
            : PPT_THEME.red,

        align: "center",
        margin: 0
      }
    );
  }

    slide.addText(
    String(
      detail ?? ""
    ),
    {
      x: x + 0.12,
      y: y + 1.10,
      w: w - 0.24,
      h: 0.17,

      fontFace:
        PPT_THEME.font,

      fontSize: 9,

      color:
        PPT_THEME.muted,

      align: "center",
      margin: 0
    }
  );
}


function pptPassFailDonut(
  pptx,
  slide,
  x,
  y,
  passes,
  fails,
  previousPassRate
) {
  const total =
    passes + fails;

  const passRate =
    pptPercent(
      passes,
      total
    );

  slide.addChart(
    pptx.ChartType.doughnut,
    [
      {
        name:
          "Audit outcome",

        labels: [
          "PASS",
          "FAIL"
        ],

        values: [
          passes,
          fails
        ]
      }
    ],
    {
      x,
      y,
      w: 3.05,
      h: 3.05,

      holeSize: 62,

      showLegend: false,
      showTitle: false,
      showValue: false,
      showPercent: false,

      chartColors: [
        PPT_THEME.green,
        PPT_THEME.red
      ],

      border: {
        color:
          PPT_THEME.white,

        pt: 0
      }
    }
  );

  slide.addText(
    `${passRate}%`,
    {
      x: x + 0.74,
      y: y + 1.08,
      w: 1.56,
      h: 0.48,

      fontFace:
        PPT_THEME.font,

      fontSize: 27,
      bold: true,

      color:
        PPT_THEME.navy,

      align: "center",
      margin: 0
    }
  );

  slide.addText(
    `${passes}/${total}`,
    {
      x: x + 3.5,
      y: y + 0.54,
      w: 2.5,
      h: 0.5,

      fontFace:
        PPT_THEME.font,

      fontSize: 28,
      bold: true,

      color:
        PPT_THEME.navy,

      margin: 0
    }
  );

  slide.addText(
    "passed",
    {
      x: x + 3.5,
      y: y + 1.03,
      w: 2,
      h: 0.25,

      fontFace:
        PPT_THEME.font,

      fontSize: 13,

      color:
        PPT_THEME.muted,

      margin: 0
    }
  );

  slide.addShape(
    pptx.ShapeType.roundRect,
    {
      x: x + 3.5,
      y: y + 1.55,
      w: 0.18,
      h: 0.18,

      rectRadius: 0.03,

      line: {
        color:
          PPT_THEME.green,

        transparency: 100
      },

      fill: {
        color:
          PPT_THEME.green
      }
    }
  );

  slide.addText(
    `PASS   ${passes} (${passRate}%)`,
    {
      x: x + 3.82,
      y: y + 1.49,
      w: 2.8,
      h: 0.3,

      fontFace:
        PPT_THEME.font,

      fontSize: 12.5,
      bold: true,

      color:
        PPT_THEME.navy,

      margin: 0
    }
  );

  slide.addShape(
    pptx.ShapeType.roundRect,
    {
      x: x + 3.5,
      y: y + 2.03,
      w: 0.18,
      h: 0.18,

      rectRadius: 0.03,

      line: {
        color:
          PPT_THEME.red,

        transparency: 100
      },

      fill: {
        color:
          PPT_THEME.red
      }
    }
  );

  slide.addText(
    `FAIL   ${fails} (${100 - passRate}%)`,
    {
      x: x + 3.82,
      y: y + 1.97,
      w: 2.8,
      h: 0.3,

      fontFace:
        PPT_THEME.font,

      fontSize: 12.5,
      bold: true,

      color:
        PPT_THEME.navy,

      margin: 0
    }
  );

  if (
    Number.isFinite(
      previousPassRate
    )
  ) {
    const difference =
      passRate -
      previousPassRate;

    const movementText =
      difference === 0
        ? "— No change vs previous period"
        : `${difference > 0 ? "↑" : "↓"} ${Math.abs(difference)}% vs previous period`;

    slide.addText(
      movementText,
      {
        x: x + 3.5,
        y: y + 2.5,
        w: 3.25,
        h: 0.28,

        fontFace:
          PPT_THEME.font,

        fontSize: 11,
        bold: true,

        color:
          difference > 0
            ? PPT_THEME.greenDark
            : difference < 0
              ? PPT_THEME.red
              : PPT_THEME.muted,

        margin: 0
      }
    );
  }
}


function pptEngineerChart(
  pptx,
  slide,
  engineers
) {
  if (!engineers.length) {
    slide.addText(
      "No engineer audit data is available for this period.",
      {
        x: 1,
        y: 3.2,
        w: 11.3,
        h: 0.35,

        fontFace:
          PPT_THEME.font,

        fontSize: 18,

        color:
          PPT_THEME.muted,

        align: "center"
      }
    );

    return;
  }

  slide.addChart(
    pptx.ChartType.bar,
    [
      {
        name: "Total audits",

        labels:
          engineers.map(
            item => item.name
          ),

        values:
          engineers.map(
            item => item.total
          )
      },

      {
        name: "PASS",

        labels:
          engineers.map(
            item => item.name
          ),

        values:
          engineers.map(
            item => item.pass
          )
      },

      {
        name: "FAIL",

        labels:
          engineers.map(
            item => item.name
          ),

        values:
          engineers.map(
            item => item.fail
          )
      }
    ],
    {
      x: 0.55,
      y: 1.02,
      w: 12.2,
      h: 5.95,

      catAxisLabelFontFace:
        PPT_THEME.font,

      catAxisLabelFontSize:
        engineers.length > 16
          ? 8
          : 10,

      valAxisLabelFontFace:
        PPT_THEME.font,

      valAxisLabelFontSize: 9,
      valAxisMinVal: 0,

      valGridLine: {
        color:
          PPT_THEME.grid,

        pt: 1
      },

      showLegend: true,
      legendPos: "b",

      legendFontFace:
        PPT_THEME.font,

      legendFontSize: 11,

      showTitle: false,
      showValue: true,
      showCatName: false,
      showSerName: false,

      dataLabelPosition:
        "outEnd",

      dataLabelColor:
        PPT_THEME.navy,

      dataLabelFormatCode:
        "0",

      chartColors: [
        PPT_THEME.blue,
        PPT_THEME.green,
        PPT_THEME.red
      ],

      showBorder: false,
      gapWidthPct: 45
    }
  );
}


function pptDefectBars(
  pptx,
  slide,
  x,
  y,
  w,
  h,
  title,
  values,
  totalDefects
) {
  const categoryOrder = [
    "Immediately Dangerous",
    "At Risk",
    "Not to Current Standards",
    "Observations",
    "Documentation Errors"
  ];

  const categoryLabels = {
    "Immediately Dangerous":
      "Immediately Dangerous",

    "At Risk":
      "At Risk",

    "Not to Current Standards":
      "Not to Current Standards",

    "Observations":
      "Observations",

    "Documentation Errors":
      "Documentation Errors"
  };

  const valueMap = new Map(
    values.map(item => [
      item.category,
      Number(item.value) || 0
    ])
  );

  const labels =
    categoryOrder.map(
      category =>
        categoryLabels[category]
    );

  const chartValues =
    categoryOrder.map(
      category =>
        valueMap.get(category) || 0
    );

  slide.addText(
    title,
    {
      x: x + 0.18,
      y: y + 0.12,
      w: w - 0.36,
      h: 0.24,

      fontFace:
        PPT_THEME.font,

      fontSize: 14,
      bold: true,

      color:
        PPT_THEME.navy,

      margin: 0
    }
  );

  slide.addChart(
    pptx.ChartType.bar,
    [
      {
        name: "Defects",
        labels,
        values: chartValues
      }
    ],
    {
      x: x + 0.18,
      y: y + 0.48,
      w: w - 0.36,
      h: h - 1.18,

      catAxisLabelFontFace:
        PPT_THEME.font,

      catAxisLabelFontSize: 8,

      catAxisLabelRotate: 0,

      valAxisLabelFontFace:
        PPT_THEME.font,

      valAxisLabelFontSize: 8,
      valAxisMinVal: 0,

      valGridLine: {
        color:
          PPT_THEME.grid,

        pt: 1
      },

      showLegend: false,
      showTitle: false,

      showValue: true,
      showCatName: false,
      showSerName: false,

      dataLabelPosition:
        "outEnd",

      dataLabelColor:
        PPT_THEME.navy,

      dataLabelFormatCode:
        "0",

      chartColors: [
        "F33D43",
        "E5BE01",
        "67A315",
        "686868",
        "A9A9A9"
      ],

      varyColors: true,

      showBorder: false,
      gapWidthPct: 55
    }
  );

  const legendItems = [
    {
      label:
        "Immediately Dangerous",
      colour:
        "F33D43"
    },
    {
      label:
        "At Risk",
      colour:
        "E5BE01"
    },
    {
      label:
        "Not to Current Standards",
      colour:
        "67A315"
    },
    {
      label:
        "Observations",
      colour:
        "686868"
    },
    {
      label:
        "Documentation Errors",
      colour:
        "A9A9A9"
    }
  ];

  const legendY =
    y + h - 0.62;

  const itemWidth =
    (w - 0.4) /
    legendItems.length;

  legendItems.forEach(
    (item, index) => {
      const itemX =
        x +
        0.2 +
        index * itemWidth;

      slide.addShape(
        pptx.ShapeType.rect,
        {
          x: itemX,
          y: legendY,
          w: 0.08,
          h: 0.08,

          line: {
            color:
              item.colour,

            transparency: 100
          },

          fill: {
            color:
              item.colour
          }
        }
      );

      slide.addText(
        item.label,
        {
          x: itemX + 0.11,
          y: legendY - 0.01,
          w: itemWidth - 0.12,
          h: 0.12,

          fontFace:
            PPT_THEME.font,

          fontSize: 6.8,

          color:
            PPT_THEME.muted,

          margin: 0,
          fit: "shrink"
        }
      );
    }
  );

  slide.addText(
    `Total defects: ${totalDefects}`,
    {
      x: x + 0.15,
      y: y + h - 0.28,
      w: w - 0.3,
      h: 0.16,

      fontFace:
        PPT_THEME.font,

      fontSize: 9.5,
      bold: true,

      color:
        PPT_THEME.navy,

      align: "center",
      margin: 0
    }
  );
}

function pptCategoryChangeSummary(data) {
  const shortLabel = category => {
    if (category === "Immediately Dangerous") {
      return "ID";
    }

    if (category === "At Risk") {
      return "AR";
    }

    if (
      category ===
      "Not to Current Standards"
    ) {
      return "NCS";
    }

    if (category === "Observations") {
      return "Observations";
    }

    if (
      category ===
      "Documentation Errors"
    ) {
      return "Documentation Errors";
    }

    return category;
  };

  return data.categories
    .map(
      item =>
        `${shortLabel(item.category)} ${item.previous}→${item.current}`
    )
    .join(", ");
}


function pptTopDefectsPanel(
  pptx,
  slide,
  x,
  y,
  w,
  h,
  defectEntries,
  categories
) {
  pptCard(
    pptx,
    slide,
    x,
    y,
    w,
    h
  );

  slide.addText(
    "Most common defects this quarter",
    {
      x: x + 0.18,
      y: y + 0.12,
      w: w - 0.36,
      h: 0.22,

      fontFace:
        PPT_THEME.font,

      fontSize: 13.5,
      bold: true,

      color:
        PPT_THEME.navy,

      margin: 0
    }
  );

  const entries =
    defectEntries.slice(0, 9);

  const leftEntries =
    entries.slice(0, 5);

  const rightEntries =
    entries.slice(5, 9);

  const maxCount =
    Math.max(
      1,
      ...entries.map(
        item => item[1]
      )
    );

  const contentTop =
    y + 0.43;

  const rowGap = 0.275;

  const columnWidth =
    (w - 0.72) / 2;

  function drawColumn(
    items,
    columnX,
    startNumber
  ) {
    items.forEach(
      ([title, count], index) => {
        const rowY =
          contentTop +
          index * rowGap;

        slide.addShape(
          pptx.ShapeType.ellipse,
          {
            x: columnX,
            y: rowY + 0.015,
            w: 0.15,
            h: 0.15,

            line: {
              color:
                PPT_THEME.navy,

              transparency: 100
            },

            fill: {
              color:
                PPT_THEME.navy
            }
          }
        );

        slide.addText(
          String(
            startNumber + index
          ),
          {
            x: columnX,
            y: rowY + 0.04,
            w: 0.15,
            h: 0.07,

            fontFace:
              PPT_THEME.font,

            fontSize: 6.5,
            bold: true,

            color:
              PPT_THEME.white,

            align: "center",
            margin: 0
          }
        );

        slide.addText(
          title,
          {
            x: columnX + 0.21,
            y: rowY,
            w: columnWidth * 0.49,
            h: 0.19,

            fontFace:
              PPT_THEME.font,

            fontSize: 8.5,

            color:
              PPT_THEME.navy,

            margin: 0,
            fit: "shrink"
          }
        );

        const trackX =
          columnX +
          columnWidth * 0.53;

        const trackWidth =
          columnWidth * 0.35;

        slide.addShape(
          pptx.ShapeType.line,
          {
            x: trackX,
            y: rowY + 0.09,
            w: trackWidth,
            h: 0,

            line: {
              color:
                PPT_THEME.grid,

              width: 2
            }
          }
        );

        slide.addShape(
          pptx.ShapeType.line,
          {
            x: trackX,
            y: rowY + 0.09,

            w:
              trackWidth *
              (
                count /
                maxCount
              ),

            h: 0,

            line: {
              color:
                PPT_THEME.navy,

              width: 2.4
            }
          }
        );

        slide.addText(
          String(count),
          {
            x:
              columnX +
              columnWidth -
              0.3,

            y: rowY,
            w: 0.26,
            h: 0.15,

            fontFace:
              PPT_THEME.font,

            fontSize: 8.5,
            bold: true,

            color:
              PPT_THEME.navy,

            align: "right",
            margin: 0
          }
        );
      }
    );
  }

  drawColumn(
    leftEntries,
    x + 0.2,
    1
  );

  if (rightEntries.length) {
    const dividerX =
      x + w / 2;

    slide.addShape(
      pptx.ShapeType.line,
      {
        x: dividerX,
        y: y + 0.42,
        w: 0,
        h: 1.28,

        line: {
          color:
            PPT_THEME.border,

          width: 0.8
        }
      }
    );

    drawColumn(
      rightEntries,
      dividerX + 0.2,
      6
    );
  }
}



function pptCategoryCardMeta(category) {
  if (category === "At Risk") {
    return {
      title: "At Risk (AR)",
      colour: "E5BE01",
      icon: "!",
      iconFilled: false,
      iconFont: PPT_THEME.font,
      iconSize: 16
    };
  }

  if (
    category ===
    "Not to Current Standards"
  ) {
    return {
      title:
        "Not to Current Standards (NCS)",
      colour: "67A315",
      icon: "✓",
      iconFilled: false,
      iconFont: PPT_THEME.font,
      iconSize: 16
    };
  }

  if (category === "Observations") {
    return {
      title: "Observations",
      colour: "686868",
      icon: "👁",
      iconFilled: true,
      iconFont: "Segoe UI Symbol",
      iconSize: 15
    };
  }

  if (
    category ===
    "Documentation Errors"
  ) {
    return {
      title: "Document Errors",
      colour: "A9A9A9",
      icon: "📄",
      iconFilled: true,
      iconFont: "Segoe UI Symbol",
      iconSize: 14
    };
  }

  return {
    title: category,
    colour: PPT_THEME.purple,
    icon: "•",
    iconFilled: false,
    iconFont: PPT_THEME.font,
    iconSize: 14
  };
}


function pptCategoryBreakdownCard(
  pptx,
  slide,
  x,
  y,
  w,
  h,
  categoryItem
) {
  const meta =
    pptCategoryCardMeta(
      categoryItem.category
    );

  const topDefects =
    (categoryItem.common || []).slice(
      0,
      3
    );

  const maxCount = Math.max(
    1,
    ...topDefects.map(
      entry => entry[1]
    )
  );

  pptCard(
    pptx,
    slide,
    x,
    y,
    w,
    h
  );

  slide.addShape(
    pptx.ShapeType.rect,
    {
      x: x + 0.12,
      y: y + 0.2,
      w: 0.04,
      h: 0.46,

      line: {
        color: meta.colour,
        transparency: 100
      },

      fill: {
        color: meta.colour
      }
    }
  );

 const iconX = x + 0.28;
const iconY = y + 0.24;
const iconSize = 0.32;

slide.addShape(
  pptx.ShapeType.ellipse,
  {
    x: iconX,
    y: iconY,
    w: iconSize,
    h: iconSize,

    line: {
      color: meta.colour,
      width: 1.4
    },

    fill: meta.iconFilled
      ? {
          color: meta.colour
        }
      : {
          color: PPT_THEME.white,
          transparency: 100
        }
  }
);

slide.addText(
  meta.icon,
  {
    x: iconX,
    y: iconY,
    w: iconSize,
    h: iconSize,

    fontFace:
      meta.iconFont ||
      PPT_THEME.font,

    fontSize:
      meta.iconSize || 15,

    bold: true,

    color: meta.iconFilled
      ? PPT_THEME.white
      : meta.colour,

    align: "center",
    valign: "mid",
    margin: 0,
    fit: "shrink"
  }
);

  slide.addText(
    meta.title,
    {
      x: x + 0.72,
      y: y + 0.2,
      w: w - 0.86,
      h: 0.42,

      fontFace: PPT_THEME.font,
      fontSize: 11.5,
      bold: true,

      color: PPT_THEME.navy,

      margin: 0,
      fit: "shrink"
    }
  );

  slide.addText(
    String(categoryItem.current || 0),
    {
      x: x + 0.18,
      y: y + 0.9,
      w: w - 0.36,
      h: 0.52,

      fontFace: PPT_THEME.font,
      fontSize: 34,
      bold: true,

      color: PPT_THEME.navy,

      align: "center",
      margin: 0
    }
  );

  slide.addText(
    "defects",
    {
      x: x + 0.18,
      y: y + 1.48,
      w: w - 0.36,
      h: 0.2,

      fontFace: PPT_THEME.font,
      fontSize: 12,

      color: PPT_THEME.muted,

      align: "center",
      margin: 0
    }
  );

  slide.addShape(
    pptx.ShapeType.line,
    {
      x: x + 0.16,
      y: y + 2.02,
      w: w - 0.32,
      h: 0,

      line: {
        color: PPT_THEME.border,
        width: 0.9
      }
    }
  );

  slide.addText(
    "Most common defects",
    {
      x: x + 0.18,
      y: y + 2.24,
      w: w - 0.36,
      h: 0.18,

      fontFace: PPT_THEME.font,
      fontSize: 11,
      bold: true,

      color: PPT_THEME.navy,

      margin: 0
    }
  );

  if (!topDefects.length) {
    slide.addText(
      "No defects recorded",
      {
        x: x + 0.18,
        y: y + 2.45,
        w: w - 0.36,
        h: 0.2,

        fontFace: PPT_THEME.font,
        fontSize: 10,

        color: PPT_THEME.muted,

        margin: 0
      }
    );

    return;
  }

  topDefects.forEach(
    ([title, count], index) => {
      const rowY =
  y + 2.72 + index * 1.02;

      slide.addShape(
        pptx.ShapeType.ellipse,
        {
          x: x + 0.18,
          y: rowY,
          w: 0.18,
          h: 0.18,

          line: {
            color: meta.colour,
            transparency: 100
          },

          fill: {
            color: meta.colour
          }
        }
      );

      slide.addText(
        String(index + 1),
        {
          x: x + 0.18,
          y: rowY + 0.048,
          w: 0.18,
          h: 0.07,

          fontFace: PPT_THEME.font,
          fontSize: 7.5,
          bold: true,

          color: PPT_THEME.white,

          align: "center",
          margin: 0
        }
      );

      slide.addText(
        title,
        {
          x: x + 0.44,
          y: rowY - 0.01,
         w: w - 0.74,
          h: 0.34,

          fontFace: PPT_THEME.font,
          fontSize: 9.2,

          color: PPT_THEME.navy,

          margin: 0,
          fit: "shrink"
        }
      );

      const trackX =
        x + 0.46;

      const trackY =
        rowY + 0.42;

      const trackW =
  w - 0.88;

      slide.addShape(
        pptx.ShapeType.line,
        {
          x: trackX,
          y: trackY,
          w: trackW,
          h: 0,

          line: {
            color: PPT_THEME.grid,
            width: 3
          }
        }
      );

      slide.addShape(
        pptx.ShapeType.line,
        {
          x: trackX,
          y: trackY,
          w:
            trackW *
            (count / maxCount),
          h: 0,

          line: {
            color: meta.colour,
            width: 3.2
          }
        }
      );

      slide.addText(
        String(count),
        {
          x: x + w - 0.24,
          y: rowY + 0.33,
          w: 0.18,
          h: 0.1,

          fontFace: PPT_THEME.font,
          fontSize: 10,
          bold: true,

          color: PPT_THEME.navy,

          align: "right",
          margin: 0
        }
      );

      if (index < topDefects.length - 1) {
        slide.addShape(
          pptx.ShapeType.line,
          {
            x: x + 0.16,
            y: rowY + 0.68,
            w: w - 0.32,
            h: 0,

            line: {
              color: PPT_THEME.border,
              width: 0.6,
              dash: "dot"
            }
          }
        );
      }
    }
  );
}


function getPerformanceRecordsForPpt(records, from, to) {
  return (records || []).filter(record =>
    analyticsDateInRange(
      record.date,
      from,
      to
    )
  );
}


function getMorganPptMetrics(records) {
  const total = records.length;

  const passes = records.filter(
    record => record.outcome === "PASS"
  ).length;

  const fails = records.filter(
    record => record.outcome === "FAIL"
  ).length;

  const scored = records.filter(record =>
    Number.isFinite(Number(record.score))
  );

  const averageScore = scored.length
    ? scored.reduce(
        (sum, record) =>
          sum + Number(record.score),
        0
      ) / scored.length
    : 0;

  return {
    total,
    passes,
    fails,
    passRate: total
      ? Math.round((passes / total) * 100)
      : 0,
    averageScore
  };
}

function countTcwReasonsForPpt(
  records,
  limit = 10
) {
  const counts = new Map();

  (records || []).forEach(record => {
    const reason =
      String(
        record.reason ||
        "Not recorded"
      ).trim() ||
      "Not recorded";

    counts.set(
      reason,
      (counts.get(reason) || 0) + 1
    );
  });

  const entries =
    Array.from(counts.entries())
      .sort(
        (a, b) =>
          b[1] - a[1] ||
          a[0].localeCompare(b[0])
      );

  return {
    totalUnique: entries.length,
    top: entries.slice(0, limit)
  };
}
function buildExternalPerformancePptData() {
  const periods =
    getExecutiveDashboardPeriods();

  if (!periods) {
    throw new Error(
      "Choose valid Executive Dashboard date ranges before generating the PowerPoint."
    );
  }

  const currentFrom =
    periods.currentFrom;

  const currentTo =
    periods.currentTo;

  const previousFrom =
    periods.previousFrom;

  const previousTo =
    periods.previousTo;

  const tcwRecords =
    performanceState?.tcwErrors || [];

  const morganRecords =
    performanceState?.morganLambertAudits || [];

  const currentTcw =
    getPerformanceRecordsForPpt(
      tcwRecords,
      currentFrom,
      currentTo
    );

  const previousTcw =
    getPerformanceRecordsForPpt(
      tcwRecords,
      previousFrom,
      previousTo
    );

  const currentMorganRecords =
    getPerformanceRecordsForPpt(
      morganRecords,
      currentFrom,
      currentTo
    );

  const previousMorganRecords =
    getPerformanceRecordsForPpt(
      morganRecords,
      previousFrom,
      previousTo
    );

    return {
    currentLabel:
      formatPptPeriodLabel(
        currentFrom,
        currentTo
      ),

    previousLabel:
      formatPptPeriodLabel(
        previousFrom,
        previousTo
      ),

    currentShortLabel:
      formatPerformancePeriodLabel(
        currentFrom,
        currentTo,
        true
      ),

    previousShortLabel:
      formatPerformancePeriodLabel(
        previousFrom,
        previousTo,
        true
      ),

    tcw: {
      current: currentTcw.length,
      previous: previousTcw.length,
      total:
        currentTcw.length +
        previousTcw.length,

      reasons:
        countTcwReasonsForPpt(
          currentTcw,
          10
        )
    },

    morgan: {
      current:
        getMorganPptMetrics(
          currentMorganRecords
        ),

      previous:
        getMorganPptMetrics(
          previousMorganRecords
        )
    }
  };
}


function pptTcwSlide(
  pptx,
  externalData
) {
  const slide =
    pptx.addSlide();

  pptBackground(
    pptx,
    slide
  );

  pptTitle(
    slide,
    "TCW Errors",
    `${externalData.currentLabel} vs ${externalData.previousLabel}`
  );

  const current =
    externalData.tcw.current;

  const previous =
    externalData.tcw.previous;

  const total =
    externalData.tcw.total;

  const change =
    current - previous;

  const percentChange =
    previous
      ? Math.round(
          (change / previous) * 100
        )
      : null;

  const previousShare =
    total
      ? Math.round(
          (previous / total) * 100
        )
      : 0;

  const currentShare =
    total
      ? Math.round(
          (current / total) * 100
        )
      : 0;

  pptMetric(
    pptx,
    slide,
    0.35,
    0.92,
    3.0,
    "Total TCW errors",
    total,
        "Across both date ranges",
   
    true
  );

  pptMetric(
    pptx,
    slide,
    3.55,
    0.92,
    3.0,
        externalData.previousShortLabel,
    previous,
    `${previousShare}% of total`,
    "",
    true
  );

  pptMetric(
    pptx,
    slide,
    6.75,
    0.92,
    3.0,
        externalData.currentShortLabel,
    current,
    `${currentShare}% of total`,
    "",
    true
  );

  pptMetric(
    pptx,
    slide,
    9.95,
    0.92,
    3.0,
        "Difference between dates",
    `${change >= 0 ? "+" : ""}${change}`,
    percentChange === null
      ? "No comparison baseline"
      : `${Math.abs(percentChange)}% ${
          change >= 0
            ? "increase"
            : "decrease"
        }`,
    percentChange === null
      ? ""
      : `${change >= 0 ? "↑" : "↓"} ${Math.abs(percentChange)}%`,
    change <= 0
  );

  pptCard(
    pptx,
    slide,
    0.35,
    2.55,
    12.63,
    3.05
  );

  slide.addText(
        `TCW Errors: ${externalData.previousShortLabel} vs ${externalData.currentShortLabel}`,
    {
      x: 0.75,
      y: 2.83,
      w: 11.8,
      h: 0.28,
      fontFace: PPT_THEME.font,
      fontSize: 16,
      bold: true,
      color: PPT_THEME.navy,
      align: "center",
      margin: 0
    }
  );

  slide.addText(
    "Number of errors",
    {
      x: 0.75,
      y: 3.13,
      w: 11.8,
      h: 0.2,
      fontFace: PPT_THEME.font,
      fontSize: 10.5,
      color: PPT_THEME.muted,
      align: "center",
      margin: 0
    }
  );

  slide.addChart(
    pptx.ChartType.bar,
    [
      {
        name: "TCW errors",
                labels: [
          externalData.previousShortLabel,
          externalData.currentShortLabel
        ],
        values: [
          previous,
          current
        ]
      }
    ],
    {
      x: 1.15,
      y: 3.35,
      w: 11.05,
      h: 1.85,

      catAxisLabelFontFace: PPT_THEME.font,
      catAxisLabelFontSize: 10,

      valAxisLabelFontFace: PPT_THEME.font,
      valAxisLabelFontSize: 9,
      valAxisMinVal: 0,

      valGridLine: {
        color: PPT_THEME.grid,
        pt: 1,
        dash: "dash"
      },

      showLegend: false,
      showTitle: false,
      showValue: true,

      dataLabelPosition: "outEnd",
      dataLabelColor: PPT_THEME.navy,
      dataLabelFormatCode: "0",

      chartColors: [
        PPT_THEME.purple
      ],

      showBorder: false,
      gapWidthPct: 45
    }
  );

  pptCard(
    pptx,
    slide,
    0.35,
    5.85,
    12.63,
    0.72
  );

  slide.addShape(
    pptx.ShapeType.ellipse,
    {
      x: 0.85,
      y: 6.02,
      w: 0.36,
      h: 0.36,

      line: {
        color: PPT_THEME.purple,
        width: 1.2
      },

      fill: {
        color: PPT_THEME.white,
        transparency: 100
      }
    }
  );

  slide.addText(
    "↗",
    {
      x: 0.85,
      y: 6.05,
      w: 0.36,
      h: 0.24,
      fontFace: PPT_THEME.font,
      fontSize: 17,
      bold: true,
      color: PPT_THEME.purple,
      align: "center",
      valign: "mid",
      margin: 0
    }
  );

  slide.addShape(
    pptx.ShapeType.line,
    {
      x: 1.55,
      y: 5.98,
      w: 0,
      h: 0.46,
      line: {
        color: PPT_THEME.purple,
        width: 2
      }
    }
  );

  slide.addText(
        percentChange === null
      ? `TCW errors were ${current} between ${externalData.currentLabel}, with no comparison baseline available.`
      : `TCW errors ${
          change >= 0
            ? "increased"
            : "decreased"
        } from ${previous} during ${externalData.previousLabel} to ${current} during ${externalData.currentLabel} — a difference of ${Math.abs(change)} errors (${Math.abs(percentChange)}%).`,
    {
      x: 1.9,
      y: 6.08,
      w: 10.5,
      h: 0.22,
      fontFace: PPT_THEME.font,
      fontSize: 12.5,
      bold: true,
      color: PPT_THEME.navy,
      margin: 0,
      fit: "shrink"
    }
  );
}

function pptTcwReasonsSlide(
  pptx,
  externalData
) {
  const slide =
    pptx.addSlide();

  pptBackground(
    pptx,
    slide
  );

  pptTitle(
    slide,
    "Most Common TCW Error Reasons",
    `${externalData.currentLabel} breakdown`
  );

  const reasons =
    externalData.tcw.reasons?.top || [];

  const uniqueReasons =
    externalData.tcw.reasons
      ?.totalUnique || 0;

  pptMetric(
    pptx,
    slide,
    0.35,
    0.92,
    3.0,
    "Current TCW errors",
    externalData.tcw.current,
        externalData.currentShortLabel,
    "",
    true
  );

  pptMetric(
    pptx,
    slide,
    3.55,
    0.92,
    3.0,
    "Unique reasons",
    uniqueReasons,
        externalData.currentShortLabel,
    "",
    true
  );

  pptMetric(
    pptx,
    slide,
    6.75,
    0.92,
    3.0,
    "Most common",
    reasons[0]?.[0] || "None",
    reasons[0]
      ? `${reasons[0][1]} record${
          reasons[0][1] === 1 ? "" : "s"
        }`
      : "No reasons recorded",
    "",
    true
  );

  pptMetric(
    pptx,
    slide,
    9.95,
    0.92,
    3.0,
        externalData.previousShortLabel,
    externalData.tcw.previous,
    "TCW errors",
    "",
    true
  );

  pptCard(
    pptx,
    slide,
    0.35,
    2.35,
    12.63,
    4.55
  );

  slide.addText(
    "Most common reasons this period",
    {
      x: 0.75,
      y: 2.65,
      w: 11.8,
      h: 0.3,
      fontFace: PPT_THEME.font,
      fontSize: 17,
      bold: true,
      color: PPT_THEME.navy,
      margin: 0
    }
  );

  if (!reasons.length) {
    slide.addText(
      "No TCW error reasons were recorded for the selected period.",
      {
        x: 0.75,
        y: 4.15,
        w: 11.8,
        h: 0.35,
        fontFace: PPT_THEME.font,
        fontSize: 15,
        color: PPT_THEME.muted,
        align: "center",
        margin: 0
      }
    );

    return;
  }

  const maxCount =
    Math.max(
      ...reasons.map(item => item[1]),
      1
    );

  reasons.forEach(
    ([reason, count], index) => {
      const y =
        3.2 + index * 0.34;

      slide.addShape(
        pptx.ShapeType.ellipse,
        {
          x: 0.75,
          y: y + 0.015,
          w: 0.22,
          h: 0.22,
          line: {
            color: PPT_THEME.navy,
            transparency: 100
          },
          fill: {
            color: PPT_THEME.navy
          }
        }
      );

      slide.addText(
        String(index + 1),
        {
          x: 0.75,
          y: y + 0.055,
          w: 0.22,
          h: 0.1,
          fontFace: PPT_THEME.font,
          fontSize: 6.5,
          bold: true,
          color: PPT_THEME.white,
          align: "center",
          valign: "mid",
          margin: 0
        }
      );

      slide.addText(
        reason,
        {
          x: 1.08,
          y,
          w: 4.8,
          h: 0.22,
          fontFace: PPT_THEME.font,
          fontSize: 9.5,
          color: PPT_THEME.navy,
          margin: 0,
          fit: "shrink"
        }
      );

      slide.addShape(
        pptx.ShapeType.roundRect,
        {
          x: 6.15,
          y: y + 0.06,
          w: 5.3,
          h: 0.08,
          rectRadius: 0.03,
          line: {
            color: PPT_THEME.grid,
            transparency: 100
          },
          fill: {
            color: PPT_THEME.grid
          }
        }
      );

      slide.addShape(
        pptx.ShapeType.roundRect,
        {
          x: 6.15,
          y: y + 0.06,
          w: Math.max(
            0.12,
            5.3 * count / maxCount
          ),
          h: 0.08,
          rectRadius: 0.03,
          line: {
            color: PPT_THEME.navy,
            transparency: 100
          },
          fill: {
            color: PPT_THEME.navy
          }
        }
      );

      slide.addText(
        String(count),
        {
          x: 11.65,
          y: y - 0.015,
          w: 0.45,
          h: 0.18,
          fontFace: PPT_THEME.font,
          fontSize: 9.5,
          bold: true,
          color: PPT_THEME.navy,
          align: "right",
          margin: 0
        }
      );
    }
  );
}
function pptMorganLambertSlide(
  pptx,
  externalData
) {
  const slide =
    pptx.addSlide();

  pptBackground(
    pptx,
    slide
  );

  pptTitle(
    slide,
    "Morgan & Lambert Audit Performance",
    `${externalData.currentLabel} vs ${externalData.previousLabel}`
  );

  const current =
    externalData.morgan.current;

  const previous =
    externalData.morgan.previous;

  const passRateChange =
    current.passRate -
    previous.passRate;

  const scoreChange =
    current.averageScore -
    previous.averageScore;

  pptMetric(
    pptx,
    slide,
    0.35,
    0.92,
    2.4,
        "Total audits",
    current.total,
    externalData.currentShortLabel,
    "",
    true
  );

  pptMetric(
    pptx,
    slide,
    2.95,
    0.92,
    2.4,
    "PASS",
    current.passes,
    `${current.passRate}% pass rate`,
    "",
    true
  );

  pptMetric(
    pptx,
    slide,
    5.55,
    0.92,
    2.4,
    "FAIL",
    current.fails,
    `${100 - current.passRate}% fail rate`,
    "",
    current.fails === 0
  );

  pptMetric(
    pptx,
    slide,
    8.15,
    0.92,
    2.4,
    "PASS rate",
    `${current.passRate}%`,
        `vs ${externalData.previousShortLabel}`,
    previous.total
      ? `${passRateChange >= 0 ? "↑" : "↓"} ${Math.abs(passRateChange)}%`
      : "",
    passRateChange >= 0
  );

  pptMetric(
    pptx,
    slide,
    10.75,
    0.92,
    2.25,
    "Average score",
    `${current.averageScore.toFixed(1)}%`,
        `vs ${externalData.previousShortLabel}`,
    previous.total
      ? `${scoreChange >= 0 ? "↑" : "↓"} ${Math.abs(scoreChange).toFixed(1)}%`
      : "",
    scoreChange >= 0
  );

   pptCard(
    pptx,
    slide,
    0.35,
    2.55,
    6.85,
    3.55
  );

  slide.addText(
    "PASS / FAIL Rate",
    {
      x: 0.75,
      y: 2.88,
      w: 5.2,
      h: 0.28,
      fontFace: PPT_THEME.font,
      fontSize: 16,
      bold: true,
      color: PPT_THEME.navy,
      margin: 0
    }
  );

  if (current.total) {
       pptPassFailDonut(
      pptx,
      slide,
      0.58,
      3.02,
      current.passes,
      current.fails,
      previous.total
        ? previous.passRate
        : NaN
    );
  } else {
    slide.addText(
      "No Morgan & Lambert audits in the selected period.",
      {
        x: 0.8,
        y: 4,
        w: 5,
        h: 0.4,
        fontFace: PPT_THEME.font,
        fontSize: 14,
        color: PPT_THEME.muted,
        align: "center",
        margin: 0
      }
    );
  }

   pptCard(
    pptx,
    slide,
    7.05,
    2.55,
    5.93,
    3.55
  );

    slide.addText(
        `${externalData.previousShortLabel} vs ${externalData.currentShortLabel}`,
    {
      x: 7.35,
      y: 2.88,
      w: 5.0,
      h: 0.28,
      fontFace: PPT_THEME.font,
      fontSize: 16,
      bold: true,
      color: PPT_THEME.navy,
      align: "center",
      margin: 0
    }
  );

  slide.addChart(
    pptx.ChartType.bar,
    [
      {
        name: "Audits",
                labels: [
          externalData.previousShortLabel,
          externalData.currentShortLabel
        ],
        values: [
          previous.total,
          current.total
        ]
      },
      {
        name: "PASS",
                labels: [
          externalData.previousShortLabel,
          externalData.currentShortLabel
        ],
        values: [
          previous.passes,
          current.passes
        ]
      },
      {
        name: "FAIL",
                labels: [
          externalData.previousShortLabel,
          externalData.currentShortLabel
        ],
        values: [
          previous.fails,
          current.fails
        ]
      }
    ],
    {
            x: 7.32,
      y: 3.33,
      w: 5.15,
      h: 2.05,

      catAxisLabelFontFace: PPT_THEME.font,
      catAxisLabelFontSize: 9,

      valAxisLabelFontFace: PPT_THEME.font,
      valAxisLabelFontSize: 8,
      valAxisMinVal: 0,

      valGridLine: {
        color: PPT_THEME.grid,
        pt: 1
      },

      showLegend: true,
      legendPos: "b",
      legendFontFace: PPT_THEME.font,
      legendFontSize: 8,

      showTitle: false,
      showValue: true,

      dataLabelPosition: "outEnd",
      dataLabelColor: PPT_THEME.navy,
      dataLabelFormatCode: "0",

      chartColors: [
        PPT_THEME.blue,
        PPT_THEME.green,
        PPT_THEME.red
      ],

      showBorder: false,
      gapWidthPct: 50
    }
  );

    pptCard(
    pptx,
    slide,
    0.35,
    6.82,
    12.63,
    0.48
  );

   slide.addText(
        `Morgan & Lambert completed ${current.total} audits during ${externalData.currentLabel}, with ${current.passes} PASS, ${current.fails} FAIL and an average score of ${current.averageScore.toFixed(1)}%.`,
    {
      x: 0.75,
      y: 6.96,
      w: 11.9,
      h: 0.16,
      fontFace: PPT_THEME.font,
      fontSize: 11.5,
      bold: true,
      color: PPT_THEME.navy,
      align: "center",
      margin: 0,
      fit: "shrink"
    }
  );
}


async function generateQuarterlyPowerPoint() {
  const button =
    el(
      "generateQuarterlyPptBtn"
    );

    const originalHtml =
    button?.innerHTML || `
      <span class="dashboard-dropdown-icon">
        ▣
      </span>

      <span>
        <strong>
          Generate Quarterly PowerPoint
        </strong>

        <small>
          Create the management presentation
        </small>
      </span>
    `;

  try {
    if (!window.PptxGenJS) {
      throw new Error(
        "PptxGenJS has not loaded. Check the PowerPoint script tag in the HTML panel."
      );
    }

    const data =
      buildQuarterlyPptData();

    if (
      !data.current.audits &&
      !data.current.defects
    ) {
      throw new Error(
        "There is no analytics data for the selected period."
      );
    }

    if (button) {
      button.disabled = true;

            button.innerHTML = `
        <span class="dashboard-dropdown-icon">
          ▣
        </span>

        <span>
          <strong>
            Generating PowerPoint…
          </strong>

          <small>
            Please wait while the presentation is created
          </small>
        </span>
      `;
    }

    const pptx =
      new window.PptxGenJS();

    pptx.layout =
      "LAYOUT_WIDE";

    pptx.author =
      "Property Care Auditing";

    pptx.subject =
      "Quarterly Audit Scorecard";

    pptx.title =
      `${data.currentLabel} Quarterly Audit Scorecard`;

    pptx.company =
      "Property Care";

    pptx.lang =
      "en-GB";

    pptx.theme = {
      headFontFace:
        PPT_THEME.font,

      bodyFontFace:
        PPT_THEME.font,

      lang: "en-GB"
    };


  // Slide 1
{
  const slide =
    pptx.addSlide();

  pptBackground(
    pptx,
    slide
  );

  pptTitle(
    slide,
    "Quarterly Audit Dashboard",
    `${data.currentLabel} compared with ${data.previousLabel}`
  );

  const passRateChange =
    data.current.passRate -
    data.previous.passRate;

  const defectChange =
    data.current.defects -
    data.previous.defects;

  const defectsPerAuditChange =
    data.current.defectsPerAudit -
    data.previous.defectsPerAudit;

  const movementText = (
    value,
    suffix = "%"
  ) => {
    if (!data.previous.audits) {
      return "";
    }

    if (
      Math.abs(value) < 0.005
    ) {
      return "— No change";
    }

    return `${
      value > 0 ? "↑" : "↓"
    } ${
      Math.abs(value).toFixed(
        suffix === "%"
          ? 0
          : 2
      )
    }${suffix}`;
  };

  pptMetric(
    pptx,
    slide,
    0.35,
    1.02,
    3.0,
    "Total audits",
    data.current.audits,
    `${data.currentLabel}`,
    "",
    true
  );

  pptMetric(
    pptx,
    slide,
    3.55,
    1.02,
    3.0,
    "PASS rate",
    `${data.current.passRate}%`,
    "vs previous period",
    movementText(
      passRateChange
    ),
    passRateChange >= 0
  );

  pptMetric(
    pptx,
    slide,
    6.75,
    1.02,
    3.0,
    "Defects",
    data.current.defects,
    "vs previous period",

    data.previous.audits
      ? movementText(
          defectChange,
          ""
        )
      : "",

    defectChange <= 0
  );

  pptMetric(
    pptx,
    slide,
    9.95,
    1.02,
    3.0,
    "Defects / audit",
    data.current.defectsPerAudit.toFixed(
      2
    ),
    "vs previous period",

    data.previous.audits
      ? movementText(
          defectsPerAuditChange,
          ""
        )
      : "",

    defectsPerAuditChange <= 0
  );

  pptCard(
    pptx,
    slide,
    0.35,
    2.72,
    12.63,
    4.1
  );

  slide.addText(
    "Audit PASS / FAIL Rate",
    {
      x: 0.72,
      y: 3.08,
      w: 5,
      h: 0.32,

      fontFace:
        PPT_THEME.font,

      fontSize: 18,
      bold: true,

      color:
        PPT_THEME.navy,

      margin: 0
    }
  );

  slide.addText(
    `${data.current.passes}/${data.current.audits} passed`,
    {
      x: 10.2,
      y: 3.1,
      w: 2.2,
      h: 0.25,

      fontFace:
        PPT_THEME.font,

      fontSize: 10.5,

      color:
        PPT_THEME.muted,

      align: "right",
      margin: 0
    }
  );

  pptPassFailDonut(
    pptx,
    slide,
    2.35,
    3.55,
    data.current.passes,
    data.current.fails,

    data.previous.audits
      ? data.previous.passRate
      : NaN
  );
}


   // Slide 2
{
  const slide =
    pptx.addSlide();

  pptBackground(
    pptx,
    slide
  );

  pptTitle(
    slide,
    "Audit PASS / FAIL Rate",
    `${data.currentLabel} compared with ${data.previousLabel}`
  );

  pptCard(
    pptx,
    slide,
    0.35,
    1.05,
    12.63,
    5.95
  );

  slide.addText(
    "Audit PASS / FAIL Rate",
    {
      x: 0.75,
      y: 1.48,
      w: 5,
      h: 0.32,

      fontFace:
        PPT_THEME.font,

      fontSize: 18,
      bold: true,

      color:
        PPT_THEME.navy,

      margin: 0
    }
  );

  slide.addText(
    `${data.current.passes}/${data.current.audits} passed`,
    {
      x: 10.15,
      y: 1.51,
      w: 2.25,
      h: 0.25,

      fontFace:
        PPT_THEME.font,

      fontSize: 10.5,

      color:
        PPT_THEME.muted,

      align: "right",
      margin: 0
    }
  );

  pptPassFailDonut(
    pptx,
    slide,
    2.32,
    2.28,
    data.current.passes,
    data.current.fails,

    data.previous.audits
      ? data.previous.passRate
      : NaN
  );

  slide.addText(
    `Average defects per audit: ${data.current.defectsPerAudit.toFixed(2)}`,
    {
      x: 0.75,
      y: 6.53,
      w: 3.8,
      h: 0.23,

      fontFace:
        PPT_THEME.font,

      fontSize: 10.5,
      bold: true,

      color:
        PPT_THEME.purple,

      margin: 0
    }
  );
}


    // Slide 3
    {
      const slide =
        pptx.addSlide();

      pptBackground(
        pptx,
        slide
      );

      pptTitle(
        slide,
        "Engineer Audit Performance",
        `${data.currentLabel} • total audits, passes and failures`
      );

      pptEngineerChart(
        pptx,
        slide,
        data.engineers
      );
    }


  // Slide 4
{
  const slide =
    pptx.addSlide();

  pptBackground(
    pptx,
    slide
  );

  pptTitle(
    slide,
    "Quarterly Defect Comparison",
    `${data.currentLabel} compared with ${data.previousLabel}`
  );

  const change =
    data.current.defects -
    data.previous.defects;

  const changePct =
    data.previous.defects
      ? Math.round(
          (
            change /
            data.previous.defects
          ) * 100
        )
      : null;

  const largest =
    [...data.categories]
      .sort(
        (a, b) =>
          b.current -
          a.current
      )[0];

  const largestLabel =
    largest?.category ===
    "Not to Current Standards"
      ? "NCS"
      : largest?.category ||
        "—";

  pptMetric(
    pptx,
    slide,
    0.32,
    0.88,
    3.02,
    "Current period defects",
    data.current.defects,
    `${data.current.audits} audits • ${data.current.defectsPerAudit.toFixed(2)} defects/audit`,
    "",
    true
  );

  pptMetric(
    pptx,
    slide,
    3.54,
    0.88,
    3.02,
    "Comparison period defects",
    data.previous.defects,
    `${data.previous.audits} audits • ${data.previous.defectsPerAudit.toFixed(2)} defects/audit`,
    "",
    true
  );

  pptMetric(
    pptx,
    slide,
    6.76,
    0.88,
    3.02,
    "Change vs comparison",
    `${change >= 0 ? "+" : ""}${change}`,

    changePct === null
      ? "No comparison data available"
      : `${Math.abs(changePct)}% ${
          change >= 0
            ? "more defects"
            : "fewer defects"
        }`,

    changePct === null
      ? ""
      : `${change >= 0 ? "↑" : "↓"} ${Math.abs(changePct)}%`,

    change <= 0
  );

  pptMetric(
    pptx,
    slide,
    9.98,
    0.88,
    3.02,
    "Largest category",
    largestLabel,

    largest
      ? `${largest.current} current • ${largest.previous} comparison`
      : "No data",

    "",
    true
  );

  /*
    Taller chart panels matching the
    proportions of the reference slide.
  */
  pptCard(
    pptx,
    slide,
    0.32,
    2.44,
    6.25,
    2.55
  );

  pptDefectBars(
    pptx,
    slide,
    0.32,
    2.44,
    6.25,
    2.55,
    "Current period",

    data.categories.map(
      item => ({
        category:
          item.category,

        value:
          item.current
      })
    ),

    data.current.defects
  );

  pptCard(
    pptx,
    slide,
    6.76,
    2.44,
    6.25,
    2.55
  );

  pptDefectBars(
    pptx,
    slide,
    6.76,
    2.44,
    6.25,
    2.55,
    "Comparison period",

    data.categories.map(
      item => ({
        category:
          item.category,

        value:
          item.previous
      })
    ),

    data.previous.defects
  );

  /*
    Narrow category-change strip.
  */
  pptCard(
    pptx,
    slide,
    2.35,
    5.07,
    8.63,
    0.32
  );

  slide.addText(
    `Category change: ${pptCategoryChangeSummary(data)}`,
    {
      x: 2.55,
      y: 5.165,
      w: 8.23,
      h: 0.11,

      fontFace:
        PPT_THEME.font,

      fontSize: 8.5,
      bold: true,

      color:
        PPT_THEME.navy,

      align: "center",
      margin: 0,
      fit: "shrink"
    }
  );

  /*
    Bottom panel now has enough height
    for five rows and the footer.
  */
  pptTopDefectsPanel(
    pptx,
    slide,
    0.32,
    5.48,
    12.69,
    1.72,
    data.commonDefects,
    data.categories
  );
}


   // Slide 5
{
  const slide =
    pptx.addSlide();

  pptBackground(
    pptx,
    slide
  );

  pptTitle(
    slide,
    "Most Common Defects by Category",
    `${data.currentLabel} breakdown`
  );

  const visibleCategories =
    data.categories.filter(
      item =>
        item.category === "At Risk" ||
        item.category ===
          "Not to Current Standards" ||
        item.category ===
          "Observations" ||
        item.category ===
          "Documentation Errors"
    );

  const cardWidth = 3.06;
const cardGap = 0.12;
const startX = 0.27;
const startY = 1.05;
const cardHeight = 6.05;

  visibleCategories.forEach(
    (item, index) => {
      pptCategoryBreakdownCard(
        pptx,
        slide,
        startX +
          index *
            (cardWidth + cardGap),
        startY,
        cardWidth,
        cardHeight,
        item
      );
    }
  );
}
    const externalData =
      buildExternalPerformancePptData();

        pptTcwSlide(
      pptx,
      externalData
    );

    pptTcwReasonsSlide(
      pptx,
      externalData
    );

    pptMorganLambertSlide(
      pptx,
      externalData
    );
    const safeName =
      String(
        data.currentLabel ||
        "Quarterly"
      )
        .replace(
          /[^a-z0-9]+/gi,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        );

    await pptx.writeFile({
      fileName:
        `Property-Care-Quarterly-Audit-Scorecard-${safeName || "Report"}.pptx`
    });
  } catch (error) {
    console.error(
      "Quarterly PowerPoint generation failed",
      error
    );

    alert(
      `The PowerPoint could not be generated: ${error?.message || error}`
    );
  } finally {
    if (button) {
      button.disabled = false;

              button.innerHTML =
          originalHtml;
    }
  }
}


function initQuarterlyPowerPointGenerator() {
  const button =
    el(
      "generateQuarterlyPptBtn"
    );

  if (
    !button ||
    button.dataset.pptInitialised ===
      "true"
  ) {
    return;
  }

  button.dataset.pptInitialised =
    "true";

  button.addEventListener(
    "click",
    generateQuarterlyPowerPoint
  );
}

// =============== END QUARTERLY POWERPOINT EXPORT ===============
