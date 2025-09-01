const subjectsEl = document.getElementById("subjects");

// ----- STORAGE KEYS -----
const k = (subject, topic, type) => `${subject}::${topic}::${type}`;

// Restore all checkboxes/dates + wire events
function initTopicRow(row, subject) {
  const topic = row.getAttribute("data-topic") || row.querySelector("span").textContent.trim();

  // Reviewed / Studied
  row.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    const key = k(subject, topic, cb.dataset.type);
    cb.checked = localStorage.getItem(key) === "true";
    cb.addEventListener("change", () => {
      localStorage.setItem(key, cb.checked);
      updateSubjectProgress(row.closest(".subject"));
      updateMaster();
    });
  });

  // Date
  const date = row.querySelector('input[type="date"]');
  if (date) {
    const dKey = k(subject, topic, "date");
    const saved = localStorage.getItem(dKey); 
    if (saved) date.value = saved;
    date.addEventListener("change", () => localStorage.setItem(dKey, date.value));
  }

  // Remove
  row.querySelector(".remove")?.addEventListener("click", () => {
    // clear storage
    ['reviewed', 'class', 'date'].forEach(t => localStorage.removeItem(k(subject, topic, t)));
    row.remove();
    updateSubjectProgress(row.closest(".subject"));
    updateMaster();
    persistCustomList(row.closest(".subject"));
  });
}

// Initialize all existing rows
document.querySelectorAll(".subject").forEach(sub => {
  sub.querySelectorAll(".topic").forEach(row => initTopicRow(row, sub.dataset.subject));
});

// Progress per subject = topics where both boxes checked
function updateSubjectProgress(subjectEl) {
  const rows = [...subjectEl.querySelectorAll(".topic")];
  const done = rows.filter(r => {
    const boxes = r.querySelectorAll('input[type="checkbox"]');
    return boxes.length ? [...boxes].every(cb => cb.checked) : false;
  }).length;
  const pct = rows.length ? Math.round((100 * done) / rows.length) : 0;
  subjectEl.querySelector(".progress > div").style.width = pct + "%";
  subjectEl.querySelector(".progress > div").title = `${done}/${rows.length} complete`;
}

// Master progress across all subjects
function updateMaster() {
  const allRows = [...document.querySelectorAll(".topic")];
  const done = allRows.filter(r => {
    const boxes = r.querySelectorAll('input[type="checkbox"]');
    return boxes.length ? [...boxes].every(cb => cb.checked) : false;
  }).length;
  const pct = allRows.length ? Math.round(100 * done / allRows.length) : 0;
  document.getElementById("masterBar").style.width = pct + "%";
}

// Add-topic UI (persists your custom list per subject)
function addTopic(subjectEl, text) {
  const subject = subjectEl.dataset.subject;
  const topicsWrap = subjectEl.querySelector(".topics");
  const row = document.createElement("div");
  row.className = "topic";
  row.setAttribute("data-topic", text);
  row.innerHTML = `
    <span>${text}</span>
    <label><input type="checkbox" data-type="reviewed">Reviewed</label>
    <label><input type="checkbox" data-type="class">Studied</label>
    <input type="date" />
    <button class="remove">✕</button>`;
  topicsWrap.appendChild(row);
  initTopicRow(row, subject);
  updateSubjectProgress(subjectEl);
  updateMaster();
  persistCustomList(subjectEl);
}

// Persist and restore custom-added topics per subject (order included)
function persistCustomList(subjectEl) {
  const subject = subjectEl.dataset.subject;
  const builtins = [...subjectEl.querySelectorAll(".topic")].map(r => r.getAttribute("data-topic") || r.querySelector("span").textContent.trim());
  localStorage.setItem(`__customList::${subject}`, JSON.stringify(builtins));
}

function restoreCustomLists() {
  document.querySelectorAll(".subject").forEach(sub => {
    const saved = localStorage.getItem(`__customList::${sub.dataset.subject}`);
    if (!saved) return; // initial load uses built-ins
    const want = JSON.parse(saved);
    // if counts match we're good; otherwise rebuild order by names
    const wrap = sub.querySelector(".topics");
    if (!wrap) return;
    const now = [...wrap.children];
    // simple reorder/add if missing
    want.forEach(name => {
      let row = now.find(r => (r.getAttribute("data-topic") || r.querySelector("span").textContent.trim()) === name);
      if (!row) {
        // create new
        addTopic(sub, name);
      } else {
        wrap.appendChild(row);
      }
    });
  });
}

// Wire add buttons
document.querySelectorAll(".subject .add").forEach(btn => {
  btn.addEventListener("click", () => {
    const sub = btn.closest(".subject");
    const input = btn.parentElement.querySelector('input[type="text"]');
    const text = (input.value || "").trim();
    if (!text) return;
    addTopic(sub, text);
    input.value = "";
  });
});

// Enter key support for add inputs
document.querySelectorAll(".add-wrap input[type='text']").forEach(input => {
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const addBtn = input.parentElement.querySelector(".add");
      addBtn.click();
    }
  });
});

// First draw
document.querySelectorAll(".subject").forEach(updateSubjectProgress);
restoreCustomLists();
updateMaster();
