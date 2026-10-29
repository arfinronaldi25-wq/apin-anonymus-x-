"use strict";

const $ = (selector) => document.querySelector(selector);

const notice = $("#notice");
const sidebar = $("#sidebar");
const searchInput = $("#searchInput");
const tableBody = $("#tableBody");
const rowCount = $("#rowCount");
const originalRows = Array.from(tableBody.querySelectorAll("tr"));

function showNotice(message) {
  notice.textContent = "> " + message;
}

const pageInfo = {
  overview: ["Dashboard Overview", "OVERVIEW"],
  analytics: ["Analytics", "ANALYTICS"],
  projects: ["Projects", "PROJECTS"],
  customers: ["Customers", "CUSTOMERS"],
  settings: ["Settings", "SETTINGS"]
};

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => {
    const page = button.dataset.page;
    const info = pageInfo[page];

    if (!info) return;

    document.querySelectorAll(".nav-item").forEach((item) => {
      item.classList.toggle("active", item === button);
    });

    $("#pageTitle").textContent = info[0];
    $("#breadcrumb").textContent = info[1];

    $("#overviewContent").hidden = page !== "overview";
    $("#stats").hidden = page !== "overview";
    $("#projectsContent").hidden =
      page !== "overview" && page !== "projects";

    if (page === "analytics") {
      showNotice("Grafik saat ini menggunakan data contoh.");
    } else if (page === "customers") {
      showNotice("Data pelanggan belum terhubung ke database.");
    } else if (page === "settings") {
      showNotice("Pengaturan lanjutan belum dikonfigurasi.");
    } else {
      showNotice(info[0] + " dibuka.");
    }

    sidebar.classList.remove("open");
  });
});

$("#menuToggle").addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

$("#profileButton").addEventListener("click", () => {
  showNotice("Profil demo: Admin. Login belum diaktifkan.");
});

function filterRows() {
  const query = searchInput.value.trim().toLowerCase();
  let visible = 0;

  originalRows.forEach((row) => {
    const matches = row.textContent.toLowerCase().includes(query);
    row.hidden = !matches;
    if (matches) visible++;
  });

  rowCount.textContent =
    "Showing " + visible + " of " + originalRows.length +
    " sample records";
}

// Pencarian tabel sekarang ditangani APIN_PROJECT_CRUD_V1.

$("#exportButton").addEventListener("click", () => {
  const rows = [
    ["Project", "Owner", "Status", "Updated"],
    ...originalRows.map((row) =>
      Array.from(row.querySelectorAll("td")).map((cell) =>
        cell.textContent.trim()
      )
    )
  ];

  const csv = rows.map((row) =>
    row.map((value) =>
      '"' + value.replace(/"/g, '""') + '"'
    ).join(",")
  ).join("\r\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "apin-projects.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showNotice("Ekspor CSV dibuat dari data contoh.");
});

console.log("APIN.DEV dashboard initialized.");

// APIN configurable branding
if (typeof APIN_CONFIG !== "undefined") {
  const brand = APIN_CONFIG.brandName;
  const dashboard = APIN_CONFIG.dashboardName;
  const accent = APIN_CONFIG.accentColor;

  document.title = `${brand} • ${dashboard}`;

  const footer = document.querySelector("footer");
  if (footer) {
    footer.textContent = `${brand} ${dashboard} · BUILT FOR CUSTOMIZATION`;
  }

  if (accent) {
    document.documentElement.style.setProperty("--accent", accent);
  }

  console.log(`${brand} configuration loaded`);
}

// APIN_PROJECT_CRUD_V1
(() => {
  const $ = (s) => document.querySelector(s);
  const body = $("#tableBody");
  const panel = $("#projectFormPanel");
  const form = $("#projectForm");
  const name = $("#projectName");
  const owner = $("#projectOwner");
  const status = $("#projectStatus");
  const title = $("#projectFormTitle");
  const search = $("#searchInput");
  const count = $("#rowCount");
  const key = "apin_anonymus_x_projects_v1";

  if (!body || !panel || !form || !$("#addProjectButton")) {
    console.error("APIN: elemen form tidak ditemukan");
    return;
  }

  let projects;

  try {
    const saved = localStorage.getItem(key);
    projects = saved ? JSON.parse(saved) : null;
  } catch {
    projects = null;
  }

  if (!Array.isArray(projects)) {
    projects = Array.from(body.querySelectorAll("tr")).map((r, i) => ({
      id: "sample-" + i,
      name: r.cells[0]?.textContent.trim() || "",
      owner: r.cells[1]?.textContent.trim() || "",
      status: r.cells[2]?.textContent.trim() || "Active",
      updated: r.cells[3]?.textContent.trim() || "Today"
    }));
  }

  let editing = null;

  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(projects));
      return true;
    } catch (e) {
      alert("Data gagal disimpan. Periksa penyimpanan browser.");
      return false;
    }
  }

  function cell(value) {
    const td = document.createElement("td");
    td.textContent = value;
    return td;
  }

  function render() {
    const q = (search.value || "").trim().toLowerCase();
    const visible = projects.filter(p =>
      [p.name, p.owner, p.status, p.updated]
        .some(v => String(v).toLowerCase().includes(q))
    );

    body.replaceChildren();

    visible.forEach(p => {
      const row = document.createElement("tr");
      row.append(cell(p.name), cell(p.owner));

      const td = cell("");
      const pill = document.createElement("span");
      pill.className = "status-pill" +
        (p.status === "Completed" ? " muted-pill" : "");
      pill.textContent = p.status;
      td.append(pill);
      row.append(td, cell(p.updated));

      const actions = cell("");
      const edit = document.createElement("button");
      edit.type = "button";
      edit.textContent = "Edit";
      edit.onclick = () => openForm(p);

      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "Delete";
      del.onclick = () => {
        if (!confirm("Hapus proyek " + p.name + "?")) return;
        projects = projects.filter(x => x.id !== p.id);
        if (save()) render();
      };

      actions.append(edit, document.createTextNode(" "), del);
      row.append(actions);
      body.append(row);
    });

    count.textContent = `Showing ${visible.length} of ${projects.length} projects`;
  }

  function openForm(p = null) {
    editing = p ? p.id : null;
    title.textContent = p ? "Edit Project" : "Add Project";
    form.reset();
    name.value = p?.name || "";
    owner.value = p?.owner || "";
    status.value = p?.status || "Active";
    panel.hidden = false;
    name.focus();
  }

  $("#addProjectButton").addEventListener("click", () => openForm());

  $("#cancelProjectButton").addEventListener("click", () => {
    form.reset();
    panel.hidden = true;
    editing = null;
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const n = name.value.trim();
    const o = owner.value.trim();
    const st = status.value;

    if (!n || !o) {
      alert("Isi nama proyek dan owner dulu.");
      return;
    }

    if (editing) {
      const p = projects.find(x => x.id === editing);
      if (p) Object.assign(p, {
        name: n, owner: o, status: st, updated: "Just now"
      });
    } else {
      projects.unshift({
        id: "project-" + Date.now(),
        name: n, owner: o, status: st, updated: "Just now"
      });
    }

    if (!save()) return;

    form.reset();
    panel.hidden = true;
    editing = null;
    render();
    alert("Proyek berhasil disimpan!");
  });

  search.addEventListener("input", render);
  render();
})();
