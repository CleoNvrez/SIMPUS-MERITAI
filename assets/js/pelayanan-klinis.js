let currentProfile = null;
let registrations = [];
let selectedRegistration = null;
let currentEncounter = null;

document.addEventListener("DOMContentLoaded", init);

async function init() {
  currentProfile = await loadMyProfile();

  if (!currentProfile) return;

  bindEvents();
  await loadRegistrations();
}

function bindEvents() {
  document
    .getElementById("reloadRegistrationsBtn")
    ?.addEventListener("click", loadRegistrations);

  document
    .getElementById("registrationSearch")
    ?.addEventListener("input", renderRegistrations);

  document
    .getElementById("serviceUnitFilter")
    ?.addEventListener("change", renderRegistrations);

  document
    .getElementById("clearSelectedPatientBtn")
    ?.addEventListener("click", clearSelectedPatient);

  document
    .getElementById("startEncounterBtn")
    ?.addEventListener("click", startEncounter);

  document
    .getElementById("openRmeBtn")
    ?.addEventListener("click", openRme);

  document
    .getElementById("reloadEncounterBtn")
    ?.addEventListener("click", loadEncounter);
}


/* =========================================================
   REGISTRASI
========================================================= */

async function loadRegistrations() {
  showRegistrationInfo("Memuat registrasi hari ini...");

  const today = getToday();

  const {
    data,
    error
  } = await sb
    .from("registrations")
    .select(`
      id,
      registration_number,
      patient_id,
      payer_id,
      service_unit_id,
      registration_date,
      registered_at,
      visit_type,
      chief_complaint,
      status,
      patients (
        medical_record_number,
        full_name
      ),
      payers (
        id,
        name
      ),
      units (
        id,
        code,
        name
      )
    `)
    .eq("registration_date", today)
    .neq("status", "CANCELLED")
    .order("registered_at", {
      ascending: true
    });

  if (error) {
    console.error(error);

    registrations = [];

    showRegistrationInfo(
      "Gagal memuat registrasi: " +
      error.message
    );

    renderRegistrations();
    return;
  }

  registrations = data || [];

  loadUnitFilter();

  showRegistrationInfo(
    registrations.length
      ? `${registrations.length} registrasi ditemukan.`
      : "Belum ada registrasi hari ini."
  );

  renderRegistrations();
}


/* =========================================================
   FILTER UNIT
========================================================= */

function loadUnitFilter() {
  const select =
    document.getElementById(
      "serviceUnitFilter"
    );

  if (!select) return;

  const currentValue =
    select.value;

  const units = [];

  registrations.forEach(
    registration => {
      const unit =
        registration.units;

      if (!unit) return;

      if (
        !units.some(
          existing =>
            existing.id === unit.id
        )
      ) {
        units.push(unit);
      }
    }
  );

  units.sort((a, b) =>
    String(a.name).localeCompare(
      String(b.name),
      "id"
    )
  );

  select.innerHTML = `
    <option value="">
      Semua Unit
    </option>

    ${units.map(unit => `
      <option value="${escapeHtml(unit.id)}">
        ${escapeHtml(unit.name)}
      </option>
    `).join("")}
  `;

  if (
    units.some(
      unit =>
        unit.id === currentValue
    )
  ) {
    select.value =
      currentValue;
  }
}


/* =========================================================
   RENDER REGISTRASI
========================================================= */

function renderRegistrations() {
  const container =
    document.getElementById(
      "registrationContainer"
    );

  if (!container) return;

  const search =
    String(
      document.getElementById(
        "registrationSearch"
      )?.value || ""
    )
      .trim()
      .toLowerCase();

  const selectedUnit =
    document.getElementById(
      "serviceUnitFilter"
    )?.value || "";

  const filtered =
    registrations.filter(
      registration => {

        const patient =
          registration.patients || {};

        const unit =
          registration.units || {};

        const searchable = [
          patient.full_name,
          patient.medical_record_number,
          registration.registration_number,
          registration.chief_complaint,
          unit.name
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !search ||
          searchable.includes(search);

        const matchesUnit =
          !selectedUnit ||
          unit.id === selectedUnit;

        return (
          matchesSearch &&
          matchesUnit
        );
      }
    );

  if (!filtered.length) {
    container.innerHTML = `
      <div class="muted">
        Tidak ada registrasi yang sesuai.
      </div>
    `;

    return;
  }

  container.innerHTML =
    filtered
      .map(renderRegistrationCard)
      .join("");

  container
    .querySelectorAll(
      "[data-registration-id]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {
          selectRegistration(
            button.dataset
              .registrationId
          );
        }
      );

    });
}


function renderRegistrationCard(
  registration
) {
  const patient =
    registration.patients || {};

  const unit =
    registration.units || {};

  const payer =
    registration.payers || {};

  return `
    <button
      type="button"
      data-registration-id="${escapeHtml(
        registration.id
      )}"
      style="
        text-align:left;
        width:100%;
        padding:16px;
        border:1px solid #e5e7eb;
        border-radius:10px;
        background:#fff;
        cursor:pointer;
      "
    >

      <strong
        style="
          display:block;
          font-size:1rem;
        "
      >
        ${escapeHtml(
          patient.full_name || "-"
        )}
      </strong>

      <div
        class="muted"
        style="margin-top:6px"
      >
        No. RM:
        ${escapeHtml(
          patient.medical_record_number ||
          "-"
        )}
      </div>

      <div
        style="
          margin-top:12px;
          display:grid;
          gap:5px;
        "
      >

        <div>
          <strong>Registrasi:</strong>
          ${escapeHtml(
            registration.registration_number ||
            "-"
          )}
        </div>

        <div>
          <strong>Unit:</strong>
          ${escapeHtml(
            unit.name || "-"
          )}
        </div>

        <div>
          <strong>Kunjungan:</strong>
          ${escapeHtml(
            visitTypeLabel(
              registration.visit_type
            )
          )}
        </div>

        <div>
          <strong>Penjamin:</strong>
          ${escapeHtml(
            payer.name || "-"
          )}
        </div>

        <div>
          <strong>Status:</strong>
          ${escapeHtml(
            registrationStatusLabel(
              registration.status
            )
          )}
        </div>

      </div>

      ${
        registration.chief_complaint
          ? `
            <div
              class="muted"
              style="
                margin-top:12px;
                border-top:1px solid #e5e7eb;
                padding-top:10px;
              "
            >
              ${escapeHtml(
                registration.chief_complaint
              )}
            </div>
          `
          : ""
      }

    </button>
  `;
}


/* =========================================================
   PILIH REGISTRASI
========================================================= */

async function selectRegistration(id) {
  const registration =
    registrations.find(
      item => item.id === id
    );

  if (!registration) return;

  selectedRegistration =
    registration;

  currentEncounter = null;

  renderSelectedPatient();

  await loadEncounter();
}


function renderSelectedPatient() {
  if (!selectedRegistration) return;

  const registration =
    selectedRegistration;

  const patient =
    registration.patients || {};

  const unit =
    registration.units || {};

  const payer =
    registration.payers || {};

  document.getElementById(
    "selectedPatientSection"
  ).hidden = false;

  setText(
    "patientName",
    patient.full_name || "-"
  );

  setText(
    "patientMedicalRecordNumber",
    patient.medical_record_number || "-"
  );

  /*
   * Belum mengambil NIK/DOB/Jenis Kelamin
   * karena kolom tersebut belum dipastikan
   * dari schema patients.
   */
  setText(
    "patientNik",
    "-"
  );

  setText(
    "patientSex",
    "-"
  );

  setText(
    "patientBirthDate",
    "-"
  );

  setText(
    "registrationNumber",
    registration.registration_number ||
    "-"
  );

  setText(
    "registrationDate",
    formatDate(
      registration.registration_date
    )
  );

  setText(
    "registrationUnit",
    unit.name || "-"
  );

  setText(
    "registrationVisitType",
    visitTypeLabel(
      registration.visit_type
    )
  );

  setText(
    "registrationPayer",
    payer.name || "-"
  );

  setText(
    "registrationStatus",
    registrationStatusLabel(
      registration.status
    )
  );

  setText(
    "registrationComplaint",
    registration.chief_complaint || "-"
  );

  resetEncounterDisplay();
}


function clearSelectedPatient() {
  selectedRegistration = null;
  currentEncounter = null;

  document.getElementById(
    "selectedPatientSection"
  ).hidden = true;

  resetEncounterDisplay();
}


/* =========================================================
   ENCOUNTER
========================================================= */

async function loadEncounter() {
  if (!selectedRegistration) return;

  resetEncounterDisplay();

  const {
    data,
    error
  } = await sb
    .from("encounters")
    .select(`
      id,
      encounter_number,
      registration_id,
      patient_id,
      service_unit_id,
      encounter_type,
      priority,
      status,
      chief_complaint,
      started_at,
      ended_at,
      finalized_at
    `)
    .eq(
      "registration_id",
      selectedRegistration.id
    )
    .order("started_at", {
      ascending: false
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(error);

    setText(
      "encounterStatus",
      "Gagal memuat Encounter"
    );

    showPageMessage(
      "Gagal memuat status Encounter: " +
      error.message
    );

    return;
  }

  if (!data) {
    currentEncounter = null;

    setText(
      "encounterStatus",
      "Belum ada Encounter"
    );

    toggleButton(
      "startEncounterBtn",
      true
    );

    toggleButton(
      "openRmeBtn",
      false
    );

    return;
  }

  currentEncounter = data;

  renderEncounter(data);
}


function renderEncounter(
  encounter
) {
  setText(
    "encounterStatus",
    encounterStatusLabel(
      encounter.status
    )
  );

  setText(
    "encounterNumber",
    encounter.encounter_number ||
    "-"
  );

  setText(
    "encounterPriority",
    encounterPriorityLabel(
      encounter.priority
    )
  );

  setText(
    "encounterStartedAt",
    formatDateTime(
      encounter.started_at
    )
  );

  toggleButton(
    "startEncounterBtn",
    false
  );

  toggleButton(
    "openRmeBtn",
    encounter.status !==
      "CANCELLED"
  );
}


function resetEncounterDisplay() {
  setText(
    "encounterStatus",
    "Belum ada Encounter"
  );

  setText(
    "encounterNumber",
    "-"
  );

  setText(
    "encounterPriority",
    "-"
  );

  setText(
    "encounterStartedAt",
    "-"
  );

  toggleButton(
    "startEncounterBtn",
    false
  );

  toggleButton(
    "openRmeBtn",
    false
  );
}


/* =========================================================
   BUAT ENCOUNTER
========================================================= */

async function startEncounter() {
  if (!selectedRegistration) {
    showPageMessage(
      "Pilih pasien terlebih dahulu."
    );

    return;
  }

  if (currentEncounter) {
    openRme();
    return;
  }

  if (
    selectedRegistration.status !==
    "REGISTERED"
  ) {
    showPageMessage(
      "Registrasi pasien tidak berada pada status REGISTERED."
    );

    return;
  }

  showPageMessage(
    "Membuat Encounter..."
  );

  const {
    error
  } = await sb.rpc(
    "create_encounter",
    {
      p_registration_id:
        selectedRegistration.id,

      p_encounter_type:
        "OUTPATIENT",

      p_priority:
        "ROUTINE",

      p_chief_complaint:
        selectedRegistration
          .chief_complaint || null
    }
  );

  if (error) {
    console.error(error);

    showPageMessage(
      "Gagal membuat Encounter: " +
      error.message
    );

    return;
  }

  showPageMessage(
    "Encounter berhasil dibuat."
  );

  await loadEncounter();
}


/* =========================================================
   BUKA RME
========================================================= */

function openRme() {
  if (!selectedRegistration) {
    showPageMessage(
      "Pilih pasien terlebih dahulu."
    );

    return;
  }

  if (!currentEncounter) {
    showPageMessage(
      "Pasien belum memiliki Encounter."
    );

    return;
  }

  if (
    currentEncounter.status ===
    "CANCELLED"
  ) {
    showPageMessage(
      "Encounter sudah dibatalkan."
    );

    return;
  }

  const params =
    new URLSearchParams();

  params.set(
    "registration_id",
    selectedRegistration.id
  );

  params.set(
    "encounter_id",
    currentEncounter.id
  );

  window.location.href =
    "rme.html?" +
    params.toString();
}


/* =========================================================
   AUTH / PROFILE
========================================================= */

async function loadMyProfile() {
  const session =
    await requireSession();

  if (!session) return null;

  const {
    data,
    error
  } = await sb
    .from(
      "security_user_profiles"
    )
    .select(`
      user_id,
      display_name,
      employee_number,
      status,
      system_role,
      phone,
      notes
    `)
    .eq(
      "user_id",
      session.user.id
    )
    .maybeSingle();

  if (error || !data) {
    await sb.auth.signOut();

    window.location.href =
      "../index.html";

    return null;
  }

  if (
    data.status !== "ACTIVE"
  ) {
    await sb.auth.signOut();

    window.location.href =
      "../index.html";

    return null;
  }

  return {
    session,
    profile: data
  };
}


/* =========================================================
   HELPERS
========================================================= */

function getToday() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


function setText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      value ?? "-";
  }
}


function toggleButton(
  id,
  visible
) {
  const element =
    document.getElementById(id);

  if (element) {
    element.hidden = !visible;
  }
}


function showRegistrationInfo(
  message
) {
  const element =
    document.getElementById(
      "registrationInfo"
    );

  if (element) {
    element.textContent =
      message;
  }
}


function showPageMessage(
  message
) {
  const section =
    document.getElementById(
      "pageMessage"
    );

  const text =
    document.getElementById(
      "pageMessageText"
    );

  if (!section || !text) return;

  text.textContent =
    message;

  section.hidden = false;
}


function escapeHtml(value) {
  return String(
    value ?? ""
  )
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function formatDate(value) {
  if (!value) return "-";

  const date =
    new Date(
      value + "T00:00:00"
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }
  );
}


function formatDateTime(value) {
  if (!value) return "-";

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "id-ID",
    {
      dateStyle: "short",
      timeStyle: "short"
    }
  );
}


/* =========================================================
   LABEL
========================================================= */

function registrationStatusLabel(
  status
) {
  const labels = {
    REGISTERED: "Terdaftar",
    CANCELLED: "Dibatalkan",
    COMPLETED: "Selesai"
  };

  return (
    labels[status] ||
    status ||
    "-"
  );
}


function encounterStatusLabel(
  status
) {
  const labels = {
    DRAFT: "Draft",
    IN_PROGRESS: "Sedang Dilayani",
    FINALIZED: "Selesai / Final",
    AMENDED: "Diamendemen",
    CANCELLED: "Dibatalkan"
  };

  return (
    labels[status] ||
    status ||
    "-"
  );
}


function encounterPriorityLabel(
  priority
) {
  const labels = {
    ROUTINE: "Rutin",
    URGENT: "Mendesak",
    EMERGENCY: "Darurat"
  };

  return (
    labels[priority] ||
    priority ||
    "-"
  );
}


function visitTypeLabel(type) {
  const labels = {
    NEW: "Kunjungan Baru",
    FOLLOW_UP: "Kunjungan Ulang",
    EMERGENCY: "Gawat Darurat",
    REFERRAL: "Rujukan",
    OTHER: "Lainnya"
  };

  return (
    labels[type] ||
    type ||
    "-"
  );
}
