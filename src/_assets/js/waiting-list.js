/**
 * Waiting List – Client-side logic
 * Handles the FAB speed dial, assignment modal (A), and list modal (B).
 */

// ─── State ───────────────────────────────────────────────────────────
let professionals = [];
let specialties = [];
let currentSort = "asc";
let currentPage = 1;
const PAGE_SIZE = 10;
let debounceTimer = null;

// ─── API helpers ─────────────────────────────────────────────────────
/**
 * @param {string} url
 * @param {RequestInit} [opts]
 */
async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  const body = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, body };
}

// ─── Toast ───────────────────────────────────────────────────────────
/**
 *
 * @param {string} message
 * @param {string} type
 */
function showToast(message, type = "info") {
  const container = document.getElementById("wl-toast-container");
  if (!container) return;

  const alertClass =
    type === "success"
      ? "alert-success"
      : type === "error"
        ? "alert-error"
        : "alert-info";

  const div = document.createElement("div");
  div.className = `alert ${alertClass} shadow-lg text-sm py-2 px-4`;
  div.innerHTML = `<span>${message}</span>`;
  container.appendChild(div);

  setTimeout(() => {
    div.classList.add("opacity-0", "transition-opacity", "duration-300");
    setTimeout(() => div.remove(), 300);
  }, 3500);
}

// ─── FAB ─────────────────────────────────────────────────────────────
// DaisyUI FAB component is CSS-only via :focus-within – no JS needed.

// ─── Load Reference Data ─────────────────────────────────────────────
/**
 *
 */
async function loadReferenceData() {
  const [profRes, specRes] = await Promise.all([
    api("/api/v1/professionals"),
    api("/api/v1/specialties"),
  ]);

  if (profRes.ok) professionals = profRes.body;
  if (specRes.ok) specialties = specRes.body;

  populateSelects();
}

/**
 *
 */
function populateSelects() {
  // Modal A selects
  populateSelect(
    "wl-professional-select",
    professionals,
    "— Cualquier profesional —"
  );
  populateSelect(
    "wl-specialty-select",
    specialties,
    "— Cualquier especialidad —"
  );

  // Modal B filter selects
  populateSelect(
    "wl-filter-professional",
    professionals,
    "Todos los profesionales"
  );
  populateSelect(
    "wl-filter-specialty",
    specialties,
    "Todas las especialidades"
  );
}

/**
 *
 * @param selectId
 * @param items
 * @param defaultText
 */
function populateSelect(selectId, items, defaultText) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = `<option value="">${defaultText}</option>`;

  items.forEach((item) => {
    const opt = document.createElement("option");
    opt.value = item.id;
    opt.textContent = item.name;
    select.appendChild(opt);
  });

  select.value = currentVal;
}

// ─── Bi-directional Filtering (Modal A) ──────────────────────────────
/**
 *
 */
function setupBidirectionalFiltering() {
  const profSelect = document.getElementById("wl-professional-select");
  const specSelect = document.getElementById("wl-specialty-select");

  if (!profSelect || !specSelect) return;

  profSelect.addEventListener("change", () => {
    const profId = parseInt(profSelect.value);

    if (!profId) {
      // Reset specialty select to all specialties
      populateSelect(
        "wl-specialty-select",
        specialties,
        "— Cualquier especialidad —"
      );
      return;
    }

    // Filter specialties to only those related to this professional
    const prof = professionals.find((p) => p.id === profId);
    if (prof) {
      populateSelect(
        "wl-specialty-select",
        prof.specialties,
        "— Cualquier especialidad —"
      );
    }
  });

  specSelect.addEventListener("change", () => {
    const specId = parseInt(specSelect.value);

    if (!specId) {
      // Reset professional select to all professionals
      populateSelect(
        "wl-professional-select",
        professionals,
        "— Cualquier profesional —"
      );
      return;
    }

    // Filter professionals to only those who have this specialty
    const filtered = professionals.filter((p) =>
      p.specialties.some((s) => s.id === specId)
    );
    populateSelect(
      "wl-professional-select",
      filtered,
      "— Cualquier profesional —"
    );
  });
}

// ─── DNI Search with Debounce ────────────────────────────────────────
/**
 *
 */
function setupDniSearch() {
  const input = document.getElementById("wl-dni-input");
  if (!input) return;

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const dni = input.value.trim();

    hidePatientResult();

    if (dni.length < 6) return;

    debounceTimer = setTimeout(() => searchPatient(dni), 400);
  });
}

/**
 *
 * @param dni
 */
async function searchPatient(dni) {
  const res = await api(
    `/api/v1/patients/search?dni=${encodeURIComponent(dni)}`
  );
  const resultDiv = document.getElementById("wl-patient-result");
  const nameSpan = document.getElementById("wl-patient-name");
  const errorDiv = document.getElementById("wl-patient-error");

  if (res.ok) {
    nameSpan.textContent = `${res.body.firstNames} ${res.body.lastNames}`;
    resultDiv.classList.remove("hidden");
    errorDiv.classList.add("hidden");
  } else {
    resultDiv.classList.add("hidden");
    errorDiv.textContent = res.body?.message || "Paciente no encontrado.";
    errorDiv.classList.remove("hidden");
  }
}

/**
 *
 */
function hidePatientResult() {
  const resultDiv = document.getElementById("wl-patient-result");
  const errorDiv = document.getElementById("wl-patient-error");
  if (resultDiv) resultDiv.classList.add("hidden");
  if (errorDiv) errorDiv.classList.add("hidden");
}

// ─── Form Submission (Modal A) ───────────────────────────────────────
/**
 *
 */
function setupFormSubmission() {
  const form = document.getElementById("wl-add-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      dni: formData.get("dni"),
      professionalId: formData.get("professionalId")
        ? parseInt(formData.get("professionalId"))
        : undefined,
      specialtyId: formData.get("specialtyId")
        ? parseInt(formData.get("specialtyId"))
        : undefined,
    };

    const submitBtn = document.getElementById("wl-submit-btn");
    submitBtn.disabled = true;
    submitBtn.classList.add("btn-disabled");

    const res = await api("/api/v1/waiting-list", {
      method: "POST",
      body: JSON.stringify(data),
    });

    submitBtn.disabled = false;
    submitBtn.classList.remove("btn-disabled");

    if (res.ok) {
      showToast(
        res.body.message || "Paciente agregado a la lista de espera.",
        "success"
      );
      form.reset();
      hidePatientResult();
      document.getElementById("wl-add-modal").close();
    } else {
      showToast(
        res.body?.message || "Error al agregar a la lista de espera.",
        "error"
      );
    }
  });
}

// ─── List Modal (Modal B) ────────────────────────────────────────────
/**
 *
 */
async function openListModal() {
  currentPage = 1;
  document.getElementById("wl-list-modal").showModal();
  await loadWaitingList();
}

/**
 *
 */
async function loadWaitingList() {
  const tableBody = document.getElementById("wl-table-body");
  tableBody.innerHTML = `
    <tr>
      <td colspan="4" class="text-center text-base-content/50 py-8">
        <span class="loading loading-spinner loading-md"></span> Cargando...
      </td>
    </tr>`;

  const params = new URLSearchParams({
    page: currentPage.toString(),
    limit: PAGE_SIZE.toString(),
    sort: currentSort,
  });

  const profFilter = document.getElementById("wl-filter-professional")?.value;
  const specFilter = document.getElementById("wl-filter-specialty")?.value;

  if (profFilter) params.set("professionalId", profFilter);
  if (specFilter) params.set("specialtyId", specFilter);

  const res = await api(`/api/v1/waiting-list?${params.toString()}`);

  if (!res.ok) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-error py-8">
          Error al cargar la lista de espera.
        </td>
      </tr>`;
    return;
  }

  const { data, total } = res.body;

  if (data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center text-base-content/50 py-8">
          <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-40"></i>
          <p>No hay pacientes en la lista de espera.</p>
        </td>
      </tr>`;
    lucide.createIcons();
    updatePagination(total);
    return;
  }

  tableBody.innerHTML = data
    .map(
      (entry) => `
      <tr>
        <td class="whitespace-nowrap">
          ${new Date(entry.requestDate).toLocaleDateString("es-AR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </td>
        <td>
          <div class="font-medium">${entry.patientName}</div>
          <div class="text-xs opacity-60">DNI: ${entry.patientDni}</div>
        </td>
        <td>
          ${entry.professionalName ? `<div class="text-sm">${entry.professionalName}</div>` : ""}
          ${entry.specialtyName ? `<div class="badge badge-sm badge-outline">${entry.specialtyName}</div>` : ""}
        </td>
        <td>
          <button class="btn btn-sm btn-error btn-outline" onclick="WaitingList.release(${entry.id})" title="Liberar">
            <i data-lucide="user-x" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>`
    )
    .join("");

  lucide.createIcons();
  updatePagination(total);
}

/**
 *
 * @param total
 */
function updatePagination(total) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  document.getElementById("wl-page-info").textContent =
    `Mostrando página ${currentPage} de ${totalPages} (${total} registros)`;
  document.getElementById("wl-page-number").textContent = currentPage;
  document.getElementById("wl-prev-btn").disabled = currentPage <= 1;
  document.getElementById("wl-next-btn").disabled = currentPage >= totalPages;
}

// ─── Release entry ───────────────────────────────────────────────────
/**
 *
 * @param id
 */
async function release(id) {
  const res = await api(`/api/v1/waiting-list/${id}`, { method: "DELETE" });

  if (res.ok) {
    showToast(res.body?.message || "Paciente liberado de la lista.", "success");
    await loadWaitingList();
  } else {
    showToast(res.body?.message || "Error al liberar al paciente.", "error");
  }
}

// ─── List Modal Controls ─────────────────────────────────────────────
/**
 *
 */
function setupListControls() {
  const sortToggle = document.getElementById("wl-sort-toggle");
  const sortLabel = document.getElementById("wl-sort-label");
  const prevBtn = document.getElementById("wl-prev-btn");
  const nextBtn = document.getElementById("wl-next-btn");
  const filterProf = document.getElementById("wl-filter-professional");
  const filterSpec = document.getElementById("wl-filter-specialty");

  if (sortToggle) {
    sortToggle.addEventListener("click", () => {
      currentSort = currentSort === "asc" ? "desc" : "asc";
      sortLabel.textContent =
        currentSort === "asc"
          ? "Más antiguos primero"
          : "Más recientes primero";
      currentPage = 1;
      loadWaitingList();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        loadWaitingList();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentPage++;
      loadWaitingList();
    });
  }

  if (filterProf) {
    filterProf.addEventListener("change", () => {
      currentPage = 1;
      loadWaitingList();
    });
  }

  if (filterSpec) {
    filterSpec.addEventListener("change", () => {
      currentPage = 1;
      loadWaitingList();
    });
  }
}

// ─── Init ────────────────────────────────────────────────────────────
/**
 *
 */
function init() {
  loadReferenceData();
  setupBidirectionalFiltering();
  setupDniSearch();
  setupFormSubmission();
  setupListControls();
}

// Export for global access from onclick handlers
window.WaitingList = {
  openListModal,
  release,
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
