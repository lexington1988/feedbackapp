/* PPC Inspection Feedback (CodePen prototype)
   - Local-first (localStorage)
   - Generates matey verbal script + professional report
   - Adds Engineer summaries (trends/top issues/scores)
   - Print-to-PDF via window.print()
*/

const STORAGE_KEY = "ppc_inspection_feedback_v1";
const CLOUDINARY_CLOUD_NAME = "dnz3fuyjx";
const CLOUDINARY_UPLOAD_PRESET = "feedback";

const el = (id) => document.getElementById(id);
const uid = () => Math.random().toString(16).slice(2) + Date.now().toString(16);

const state = {
  current: null,
  editingModal: null,
  db: loadDb(),
  modalPhotoDataUrl: "", // local preview
  modalPhotoUrl: ""      // ✅ Cloudinary URL (saved in the finding)
};



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

function cloudSignedIn() {
  return !!auth.currentUser;
}

function getUser() {
  const u = auth.currentUser;
  if (!u) throw new Error("Not logged in");
  return u;
}

function inspectionsCol(uid) {
  return cloudDb.collection("users").doc(uid).collection("inspections");
}

function startCloudSync() {
  const u = getUser();

  if (cloudUnsub) cloudUnsub();

  cloudUnsub = inspectionsCol(u.uid)
    .orderBy("updatedAt", "desc")
    .onSnapshot((snap) => {
      const inspections = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      state.db.inspections = inspections;

      // keep a local cache too
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ inspections }));

      renderSavedList();
      refreshEngineerDropdown();
      refreshEngineerDatalist();
    });
}

function stopCloudSync() {
  if (cloudUnsub) cloudUnsub();
  cloudUnsub = null;
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
auth.onAuthStateChanged((user) => {
  if (user) {
    startCloudSync();
    if (el("loginBtn")) el("loginBtn").classList.add("hidden");
    if (el("logoutBtn")) el("logoutBtn").classList.remove("hidden");
  } else {
    stopCloudSync();
    if (el("loginBtn")) el("loginBtn").classList.remove("hidden");
    if (el("logoutBtn")) el("logoutBtn").classList.add("hidden");
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
      generateEngineerSummary(); // keep it up to date

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
    el("rangeSelect").addEventListener("change", onRangeChange);
    el("generateEngineerBtn").addEventListener("click", generateEngineerSummary);
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
      generateEngineerSummary();

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
generateEngineerSummary();
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
    findings: []
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

async function saveCurrentInspection() {
  pullFormIntoCurrent();
  const c = state.current;

  if (!c.engineer && !c.jobRef) {
    alert("Add at least an Engineer name or Job reference before saving.");
    return;
  }

  const idx = state.db.inspections.findIndex(x => x.id === c.id);
  if (idx >= 0) state.db.inspections[idx] = structuredClone(c);
  else state.db.inspections.unshift(structuredClone(c));

  saveDb();
  renderSavedList();
  refreshEngineerDropdown();
  refreshEngineerDatalist();

  // ✅ Cloud save if logged in
  if (cloudSignedIn()) {
    try {
      await upsertInspectionCloud(structuredClone(c));
    } catch (err) {
      console.error(err);
      alert("Saved locally, but cloud save failed (check Firebase config/rules).");
      return;
    }
  }

  alert(cloudSignedIn() ? "Saved (cloud sync on)." : "Saved (local only).");
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

function renderPositives() {
  const list = el("positivesList");
  list.innerHTML = "";
  const positives = state.current.positives || [];

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
        <div class="meta">${escapeHtml(f.category)} • Due: ${escapeHtml(f.due)} • Status: ${escapeHtml(f.status || "Open")}</div>
        <div class="badges">
          <span class="badge ${sevClass}">${escapeHtml(f.severity)}</span>
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

  const items = state.db.inspections || [];
  el("savedEmpty").classList.toggle("hidden", items.length > 0);

  items.forEach(ins => {
    const card = document.createElement("div");
    card.className = "saved-card";

    const title = `${ins.engineer || "Unnamed engineer"} • ${ins.jobRef || "No job ref"}`;
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

    container.appendChild(card);
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

    // Photo
    state.modalPhotoDataUrl = existing.photoDataUrl || "";
    if (el("findingPhoto")) el("findingPhoto").value = "";
    setPhotoPreview(state.modalPhotoDataUrl);
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
 el("verbalOutput").value = buildVerbalScript();

  renderReportPreview();
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
      else lines.push(`${idx + 1}) ${f.title} (${f.category}, ${f.severity}, due: ${f.due}).`);

      if (length === "full") {
        if (f.why) lines.push(`   • Why it matters: ${f.why}`);
        if (f.action) lines.push(`   • Action: ${f.action}`);
      } else {
        if (f.action) lines.push(`   • Action: ${f.action}`);
      }
    });

    lines.push("");
    lines.push(style === "matey" ? "If you sort those, the job will be bang on." : toneBits.close);
    if (style === "matey") lines.push(toneBits.close);
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
  parts.push(`<div class="rp-section-title">Summary</div>`);
  parts.push(`<div class="rp-small">${escapeHtml(summaryLine(c))}</div>`);

  parts.push(`<div class="rp-section-title">What was done well</div>`);
  parts.push(!positives.length
    ? `<div class="rp-small">No positives recorded.</div>`
    : `<ul class="rp-list">${positives.map(p => `<li>${escapeHtml(p.text)}</li>`).join("")}</ul>`
  );

  parts.push(`<div class="rp-section-title">Findings & required actions</div>`);
  if (!findings.length) {
    parts.push(`<div class="rp-small">No findings recorded.</div>`);
 } else {
  findings.forEach(f => {
    parts.push(`
      <div class="rp-block">
        <div><strong>${escapeHtml(f.title)}</strong></div>
        <div class="rp-small">${escapeHtml(f.category)} • ${escapeHtml(f.severity)} • Due: ${escapeHtml(f.due)} • Status: ${escapeHtml(f.status || "Open")} • Tag: ${escapeHtml(f.tag || "OTHER")}</div>
        ${f.why ? `<div class="rp-small"><strong>Why it matters:</strong> ${escapeHtml(f.why)}</div>` : ""}
        ${f.action ? `<div class="rp-small"><strong>Action:</strong> ${escapeHtml(f.action)}</div>` : ""}
        ${f.notes ? `<div class="rp-small"><strong>Notes:</strong> ${escapeHtml(f.notes)}</div>` : ""}
        ${photoHtml(f, "#e2e2e2")}

      </div>
    `);
  });
}


  parts.push(`<div class="rp-section-title">Close-out</div>`);
  parts.push(`<div class="rp-small">Please confirm once actions are complete. If revisit is required, arrange a suitable time for reinspection.</div>`);

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
      lines.push(`   Category: ${f.category} | Severity: ${f.severity} | Due: ${f.due} | Status: ${f.status || "Open"} | Tag: ${f.tag || "OTHER"}`);
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
  pullFormIntoCurrent(); // ✅ ensure freshest values are used
  const c = state.current;

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
    ? `<ul>${positives.map(p => `<li>${esc(p.text)}</li>`).join("")}</ul>`
    : `<div class="muted">No positives recorded.</div>`;

  const findingsHtml = findings.length
    ? findings.map(f => `
      <div class="rp-block">

          <div><strong>${esc(f.title)}</strong></div>
          <div class="rp-small">${esc(f.category)} • ${esc(f.severity)} • Due: ${esc(f.due)} • Status: ${esc(f.status || "Open")} • Tag: ${esc(f.tag || "OTHER")}</div>
          ${f.why ? `<div class="rp-small"><strong>Why it matters:</strong> ${esc(f.why)}</div>` : ""}
          ${f.action ? `<div class="rp-small"><strong>Action:</strong> ${esc(f.action)}</div>` : ""}
          ${f.notes ? `<div class="rp-small"><strong>Notes:</strong> ${esc(f.notes)}</div>` : ""}
         <div style="margin-top:8px; break-inside:avoid; page-break-inside:avoid;">
  ${photoHtml(f, "#e2e2e2")}
</div>




        </div>
      `).join("")
    : `<div class="muted">No findings recorded.</div>`;

return `
  ${getWatermarkHTML()}

  <div class="print-content">
    <div id="engTop">
      <h1>Engineer Summary Report</h1>

      <div class="muted">
        <div><strong>Engineer:</strong> ${esc(engineer)}</div>
        <div><strong>Range:</strong> ${esc(range)}</div>
        <div><strong>Generated:</strong> ${esc(formatDate(new Date().toISOString().slice(0,10)))}</div>
      </div>

      <div class="box">
        <h3>Summary</h3>
        <div style="white-space:pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:12.5px; line-height:1.45; margin:0; padding:0;">${esc(summaryText)}</div>
      </div>
    </div>

    <div id="engAudits">
      <div class="rp-section-title">Audits in range (with photos)</div>
      <div class="box audits-box">
        ${auditsHtml}
      </div>
    </div>
  </div>
`;



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
    ? `<ul>${positives.map(p => `<li>${esc(p.text)}</li>`).join("")}</ul>`
    : `<div class="muted">No positives recorded.</div>`;

  const findingsHtml = findings.length
    ? findings.map(f => `
        <div class="rp-block">
          <div><strong>${esc(f.title)}</strong></div>
          <div class="rp-small">${esc(f.category)} • ${esc(f.severity)} • Due: ${esc(f.due)} • Status: ${esc(f.status || "Open")} • Tag: ${esc(f.tag || "OTHER")}</div>
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
        <div>${esc(summaryLine(c))}</div>
      </div>

      <div class="box">
        <h3>What was done well</h3>
        ${positivesHtml}
      </div>

      <div class="box findings-box">
  <h3>Findings & required actions</h3>
  ${findingsHtml}
</div>


      <div class="box">
        <h3>Close-out</h3>
        <div>Please confirm once actions are complete. If revisit is required, arrange a suitable time for reinspection.</div>
      </div>
    </div>
  `;
}

function buildPrintableEngineerHTML() {
  refreshEngineerDropdown();

  const engineer = el("engineerSelect")?.value?.trim() || "—";
  const audits = filterAuditsForEngineer(engineer);

  const range = rangeLabel();
  const summaryText = el("engineerOutput")?.value?.trim() || "No summary generated.";

  const esc = escapeHtml;

  const auditsHtml = audits.length
    ? audits
        .slice()
        .sort((a,b) => (b.date || "").localeCompare(a.date || "")) // newest first
        .map(a => {
          const findings = sortFindingsBySeverity(a.findings || []);
          const photosCount = findings.filter(f => !!(f.photoUrl || f.photoDataUrl)).length;


          const findingsHtml = findings.length
            ? findings.map(f => `
              <div class="rp-block" style="margin-top:10px; padding-top:2px; padding-bottom:10px; break-inside:avoid; page-break-inside:avoid;">


                  <div><strong>${esc(f.title || "(No title)")}</strong></div>
                  <div class="rp-small" style="line-height:1.35; margin-top:2px;">

                    ${esc(f.category || "—")} • ${esc(f.severity || "—")}
                    • Due: ${esc(f.due || "—")}
                    • Status: ${esc(f.status || "Open")}
                    • Tag: ${esc(f.tag || "OTHER")}
                  </div>
                ${f.action ? `<div class="rp-small" style="margin-top:4px; line-height:1.35;"><strong>Action:</strong> ${esc(f.action)}</div>` : ""}

                 ${photoHtml(f, "#e2e2e2")}


                </div>
              `).join("")
            : `<div class="rp-small">No findings on this audit.</div>`;

          return `
            <div class="box audit-box">
              <h3>${esc(a.engineer || "Engineer")} • ${esc(a.jobRef || "No job ref")} • ${esc(formatDate(a.date))}</h3>
              <div class="rp-small">
                Outcome: ${esc(a.outcome || "—")} • Positives: ${(a.positives || []).length} • Findings: ${findings.length} • Photos: ${photosCount}
              </div>
              ${findingsHtml}
            </div>
          `;
        })
        .join("")
    : `<div class="box"><div class="rp-small">No audits found for this engineer in the selected range.</div></div>`;

  return `
    ${getWatermarkHTML()}

    <div class="print-content">
      <h1>Engineer Summary Report</h1>

      <div class="muted">
        <div><strong>Engineer:</strong> ${esc(engineer)}</div>
        <div><strong>Range:</strong> ${esc(range)}</div>
        <div><strong>Generated:</strong> ${esc(formatDate(new Date().toISOString().slice(0,10)))}</div>
      </div>

      <div class="box">
        <h3>Summary</h3>
      <div style="white-space:pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:12.5px; line-height:1.45; margin:0; padding:0;">${esc(summaryText)}</div>

      </div>

       <div class="page-break-before"></div>

<div class="rp-section-title">Audits in range (with photos)</div>
<div class="box audits-box">
  ${auditsHtml}
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
  }
}

function generateEngineerSummary() {
  refreshEngineerDropdown();

  const engineer = el("engineerSelect")?.value?.trim();
  if (!engineer) {
    alert("No engineer selected.");
    return;
  }

  const audits = filterAuditsForEngineer(engineer);
  if (!audits.length) {
    el("engineerOutput").innerText = "No audits found for this engineer in the selected range.";
    return;
  }

  const summary = buildEngineerSummary(engineer, audits);
 el("engineerOutput").value = summary.text;

}

function filterAuditsForEngineer(engineerName) {
  const target = normalizeEngineer(engineerName);

  const all = (state.db.inspections || [])
    .filter(a => normalizeEngineer(a.engineer || "") === target)
    .sort((a,b) => (a.date || "").localeCompare(b.date || ""));

  const range = el("rangeSelect").value;
  const today = new Date();

  if (range === "last5") return all.slice(-5);
  if (range === "last10") return all.slice(-10);

  if (range === "30d" || range === "90d") {
    const days = range === "30d" ? 30 : 90;
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - days);

    return all.filter(a => {
      const d = parseDateSafe(a.date);
      return d && d >= cutoff && d <= today;
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
  const paperworkTagCounts = {};
  const trend = [];

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

      if (tag.startsWith("PAPERWORK_") || cat === "Benchmark / paperwork") {
        paperworkTagCounts[tag] = (paperworkTagCounts[tag] || 0) + 1;
      }
    });
  });

  const auditCount = audits.length;
  const avgScore = auditCount ? Math.round(scoreSum / auditCount) : 0;

  const topTags = topN(tagCounts, 5);
  const topPaperwork = topN(paperworkTagCounts, 3);
  const topCats = topN(categoryCounts, 5);

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

 lines.push("OUTCOME SUMMARY");
lines.push(
  `Work & Documentation Correct: ${outcomes["Work & Documentation Correct"]} • ` +
  `Work FAIL / Docs PASS: ${outcomes["Work FAIL - Documentation PASS"]} • ` +
  `Work PASS / Docs FAIL: ${outcomes["Work PASS - Documentation FAIL"]} • ` +
  `Work FAIL / Docs FAIL: ${outcomes["Work FAIL - Documentation FAIL"]}`
);
lines.push(`Totals: ${totalFindings} findings • ${totalPositives} positives`);
lines.push(`Severity: Critical ${severityCounts.Critical} • Major ${severityCounts.Major} • Minor ${severityCounts.Minor} • Advisory ${severityCounts.Advisory}`);
lines.push("");


  lines.push("TOP 5 RECURRING ISSUES (by Issue Tag)");
  if (!topTags.length) lines.push("- No tagged issues found (start using Issue Tag).");
  else topTags.forEach(([k,v], i) => lines.push(`${i+1}. ${k} (x${v})`));
  lines.push("");

  lines.push("TOP CATEGORIES");
  if (!topCats.length) lines.push("- No category data.");
  else topCats.forEach(([k,v], i) => lines.push(`${i+1}. ${k} (x${v})`));
  lines.push("");

  lines.push("COMMON PAPERWORK ISSUES");
  if (!topPaperwork.length) lines.push("- None flagged as paperwork tags yet.");
  else topPaperwork.forEach(([k,v]) => lines.push(`- ${k} (x${v})`));
  lines.push("");

  lines.push("TREND (Findings + Score by audit)");
  if (!trendLines.length) lines.push("- No audits.");
  else lines.push(...trendLines);
  lines.push("");

  lines.push("COACHING SUMMARY (supportive)");
  lines.push(coaching);
  lines.push("");

  lines.push("MATEY VERBAL SUMMARY (you can read this out)");
  lines.push(buildMateyEngineerVerbal(engineer, avgScore, topTags, severityCounts));
  lines.push("");

  lines.push("NOTES");
  lines.push("- Scores are a simple consistency measure (100 minus severity penalties).");
  lines.push("- Trends are best when Issue Tags are used consistently.");

  return { text: lines.join("\n"), audits };
}

function buildMateyEngineerVerbal(engineer, _avgScore, topTags, severityCounts) {
  const top2 = topTags.slice(0,2).map(([k]) => k);
  const majors = severityCounts.Major || 0;
  const criticals = severityCounts.Critical || 0;

  const bits = [];
  bits.push(`Alright ${engineer}, I’ve pulled together the ${rangeLabel()} worth of audits.`);
  if (criticals > 0) bits.push(`There were ${criticals} critical item(s) — those need eliminating completely.`);
  if (majors > 0) bits.push(`You’ve had ${majors} major item(s) — main thing is reducing those down.`);
  if (top2.length) bits.push(`The two repeat ones I keep seeing are: ${top2.join(" and ")}.`);
  bits.push(`Good work overall — if we tighten those up every time, you’ll fly through audits.`);
  return bits.join(" ");
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
  const r = el("rangeSelect")?.value || "last5";
  if (r === "last5") return "last 5 Audits";
  if (r === "last10") return "last 10 Audits";
  if (r === "30d") return "last 30 days";
  if (r === "90d") return "last 90 days";
  if (r === "custom") return "custom range";
  return r;
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
  "Harrison Daly",
  "John Turlington",
  "Joshua Porter",
  "Pete Topliss",
  "Paul Teece",
  "Renjie Chen",
  "Sam Ogejo",
  "Sohail Mahmood",
];


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

// Draw the ghost text behind the input
function renderEngineerGhost() {
  const input = el("engineerInput");
  const ghost = el("engineerGhost");
  if (!input || !ghost) return;

  const typed = input.value || "";
  const suggestion = findGhostSuggestion(typed);

  if (!suggestion) {
    ghost.innerHTML = "";
    return;
  }

  ghost.innerHTML =
    `<span class="typed">${escapeHtml(typed)}</span>` +
    `${escapeHtml(suggestion.slice(typed.length))}`;
}

// Accept the ghost suggestion into the input
function acceptEngineerGhost() {
  const input = el("engineerInput");
  if (!input) return false;

  const suggestion = findGhostSuggestion(input.value || "");
  if (!suggestion) return false;

  input.value = suggestion;
  renderEngineerGhost();
  return true;
}

// If typed name matches an existing engineer (ignoring case/spaces),
// snap it to the existing saved display name. Otherwise allow new name.
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
      lines.push(`   Category: ${f.category} | Severity: ${f.severity} | Due: ${f.due || "—"} | Status: ${f.status || "Open"} | Tag: ${f.tag || "OTHER"}`);
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


// ---------- Helpers ----------
function setTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));

  el("tabVerbal").classList.toggle("active", name === "verbal");
  el("tabReport").classList.toggle("active", name === "report");
  el("tabSaved").classList.toggle("active", name === "saved");
  if (el("tabEngineers")) el("tabEngineers").classList.toggle("active", name === "engineers");

  if (name === "report") renderReportPreview();
  if (name === "saved") renderSavedList();
  if (name === "engineers") {
    refreshEngineerDropdown(); // ✅ always refresh when opening Engineers
    if (state.db.inspections.length) generateEngineerSummary();
  }
}

function sortFindingsBySeverity(findings) {
  const order = { Critical: 0, Major: 1, Minor: 2, Advisory: 3 };
  return [...findings].sort((a,b) => (order[a.severity] ?? 99) - (order[b.severity] ?? 99));
}

function summaryLine(c) {
  const findings = c.findings || [];
  const counts = { Critical: 0, Major: 0, Minor: 0, Advisory: 0 };
  findings.forEach(f => { if (counts[f.severity] !== undefined) counts[f.severity]++; });

  const posCount = (c.positives || []).length;

  const bits = [];
  bits.push(`${posCount} positive${posCount === 1 ? "" : "s"}`);
  bits.push(`${findings.length} finding${findings.length === 1 ? "" : "s"}`);
  const sevBits = Object.keys(counts).filter(k => counts[k] > 0).map(k => `${counts[k]} ${k}`);
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
  body { margin:0; padding:24px; background:#fff; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:#111; }
  .print-content { max-width: 900px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 0 0 12px; }
  h3 { margin: 0 0 8px; }
  .muted { color:#444; font-size: 13px; line-height: 1.4; }
  .box { border:1px solid #d7d7d7; border-radius: 14px; padding: 12px; margin: 12px 0; }
  .rp-section-title { font-weight: 700; margin: 14px 0 6px; }
  .rp-small { font-size: 13px; line-height: 1.4; color:#222; }
  .rp-block { border:1px solid #d7d7d7; border-radius: 14px; padding: 12px; margin: 10px 0; }
  ul { margin: 8px 0 0 18px; }
  img { max-width: 100%; height: auto; }

  /* Watermark */
  .print-watermark { position: fixed; top: 14px; right: 14px; opacity: 0.18; pointer-events: none; z-index: 10; }
  .print-watermark img { max-width: 220px; height: auto; }
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
