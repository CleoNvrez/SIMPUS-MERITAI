// SIMPUS MERITAI — Fresh Start V2
// Modul Rekam Medis Elektronik — Encounter + Anamnesis

let currentProfile = null;
let selectedRegistration = null;
let currentEncounter = null;
let currentAnamnesis = null;


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

  try {

    const result = await loadMyProfile();

    if (!result) {
      return;
    }

    currentProfile = result.profile;

    bindEvents();

    await loadTodayRegistrations();

    setMessage("Modul RME siap digunakan.");

  } catch (error) {

    console.error(error);

    setMessage(
      "Terjadi kesalahan saat memuat modul RME.",
      true
    );

  }

});


// ============================================================
// EVENT
// ============================================================

function bindEvents() {

  const refreshButton =
    document.getElementById("refreshEncounterBtn");

  const startButton =
    document.getElementById("startEncounterBtn");

  const anamnesisForm =
    document.getElementById("anamnesisForm");

  const reloadAnamnesisButton =
    document.getElementById("reloadAnamnesisBtn");


  if (refreshButton) {

    refreshButton.addEventListener(
      "click",
      async () => {

        if (!selectedRegistration) {
          return;
        }

        await loadEncounterForRegistration(
          selectedRegistration.id
        );

      }
    );

  }


  if (startButton) {

    startButton.addEventListener(
      "click",
      createEncounter
    );

  }


  if (anamnesisForm) {

    anamnesisForm.addEventListener(
      "submit",
      saveAnamnesis
    );

  }


  if (reloadAnamnesisButton) {

    reloadAnamnesisButton.addEventListener(
      "click",
      async () => {

        if (!currentEncounter) {

          setMessage(
            "Belum ada Encounter aktif.",
            true
          );

          return;

        }

        await loadAnamnesis(
          currentEncounter.id
        );

      }
    );

  }

}


// ============================================================
// LOAD PENDAFTARAN HARI INI
// ============================================================

async function loadTodayRegistrations() {

  const table =
    document.getElementById("registrationTable");

  table.innerHTML = `
    <tr>
      <td colspan="7" class="muted">
        Memuat data pendaftaran...
      </td>
    </tr>
  `;


  const today =
    new Date().toISOString().slice(0, 10);


  const {
    data,
    error
  } = await sb
    .from("registrations")
    .select(`
      id,
      registration_number,
      patient_id,
      service_unit_id,
      registration_date,
      visit_type,
      chief_complaint,
      status,
      patients (
        medical_record_number,
        full_name
      ),
      units (
        code,
        name
      )
    `)
    .eq("registration_date", today)
    .neq("status", "CANCELLED")
    .order("registered_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    table.innerHTML = `
      <tr>
        <td colspan="7">
          Gagal memuat pendaftaran.
        </td>
      </tr>
    `;

    setMessage(
      "Gagal memuat data pendaftaran.",
      true
    );

    return;

  }


  if (!data || data.length === 0) {

    table.innerHTML = `
      <tr>
        <td colspan="7" class="muted">
          Belum ada pendaftaran hari ini.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML = "";


  data.forEach(registration => {

    const patient =
      registration.patients || {};

    const unit =
      registration.units || {};


    const row =
      document.createElement("tr");


    row.innerHTML = `

      <td>
        ${escapeHtml(
          registration.registration_number
        )}
      </td>

      <td>
        ${escapeHtml(
          patient.medical_record_number || "-"
        )}
      </td>

      <td>
        ${escapeHtml(
          patient.full_name || "-"
        )}
      </td>

      <td>
        ${escapeHtml(
          unit.name || "-"
        )}
      </td>

      <td>
        ${escapeHtml(
          registration.visit_type || "-"
        )}
      </td>

      <td>
        ${escapeHtml(
          registration.status || "-"
        )}
      </td>

      <td>

        <button
          type="button"
          class="select-registration"
        >
          Pilih
        </button>

      </td>

    `;


    const button =
      row.querySelector(
        ".select-registration"
      );


    button.addEventListener(
      "click",
      async () => {

        await selectRegistration(
          registration
        );

      }
    );


    table.appendChild(row);

  });

}


// ============================================================
// SELECT PENDAFTARAN
// ============================================================

async function selectRegistration(
  registration
) {

  selectedRegistration =
    registration;

  currentEncounter = null;
  currentAnamnesis = null;

  showEncounterPanel();

  clearAnamnesisForm();

  setMessage(
    `Pendaftaran ${registration.registration_number} dipilih.`
  );

  await loadEncounterForRegistration(
    registration.id
  );

}


// ============================================================
// LOAD ENCOUNTER
// ============================================================

async function loadEncounterForRegistration(
  registrationId
) {

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
      clinical_summary,
      started_at,
      ended_at,
      finalized_at,
      finalized_by,
      version_no,
      created_by,
      created_at,
      updated_at
    `)
    .eq("registration_id", registrationId)
    .order("created_at", {
      ascending: false
    })
    .limit(1)
    .maybeSingle();


  if (error) {

    console.error(error);

    setMessage(
      "Gagal memeriksa Encounter.",
      true
    );

    return;

  }


  if (!data) {

    currentEncounter = null;
    currentAnamnesis = null;

    updateEncounterDisplay();
    clearAnamnesisForm();

    setMessage(
      "Pendaftaran ini belum memiliki Encounter."
    );

    return;

  }


  currentEncounter =
    data;


  updateEncounterDisplay();


  await loadParticipants(
    data.id
  );


  await loadAnamnesis(
    data.id
  );


  setMessage(
    `Encounter ${data.encounter_number} ditemukan.`
  );

}


// ============================================================
// CREATE ENCOUNTER
// ============================================================

async function createEncounter() {

  if (!selectedRegistration) {

    setMessage(
      "Pilih pendaftaran terlebih dahulu.",
      true
    );

    return;

  }


  if (currentEncounter) {

    setMessage(
      "Pendaftaran ini sudah memiliki Encounter."
    );

    return;

  }


  const button =
    document.getElementById(
      "startEncounterBtn"
    );


  button.disabled = true;


  try {

    const registration =
      selectedRegistration;


    const insertData = {

      registration_id:
        registration.id,

      patient_id:
        registration.patient_id,

      service_unit_id:
        registration.service_unit_id,

      encounter_type:
        "OUTPATIENT",

      priority:
        "ROUTINE",

      chief_complaint:
        registration.chief_complaint || null,

      created_by:
        currentProfile.user_id

    };


    const {
      data,
      error
    } = await sb
      .from("encounters")
      .insert(insertData)
      .select()
      .single();


    if (error) {

      console.error(error);


      if (
        error.code === "23505"
      ) {

        await loadEncounterForRegistration(
          registration.id
        );

        setMessage(
          "Encounter sudah tersedia."
        );

        return;

      }


      throw error;

    }


    currentEncounter =
      data;


    updateEncounterDisplay();


    await loadParticipants(
      data.id
    );


    await loadAnamnesis(
      data.id
    );


    setMessage(
      `Encounter ${data.encounter_number} berhasil dibuat.`
    );


  } catch (error) {

    console.error(error);

    setMessage(
      "Encounter gagal dibuat: " +
      (error.message || "kesalahan tidak diketahui"),
      true
    );

  } finally {

    button.disabled = false;

  }

}


// ============================================================
// LOAD PARTICIPANTS
// ============================================================

async function loadParticipants(
  encounterId
) {

  const table =
    document.getElementById(
      "participantTable"
    );


  table.innerHTML = `
    <tr>
      <td colspan="5" class="muted">
        Memuat peserta pelayanan...
      </td>
    </tr>
  `;


  const {
    data,
    error
  } = await sb
    .from("encounter_participants")
    .select(`
      id,
      encounter_id,
      user_id,
      profession_id,
      unit_id,
      role_code,
      is_primary,
      started_at,
      ended_at,
      professions (
        code,
        name
      ),
      units (
        code,
        name
      )
    `)
    .eq("encounter_id", encounterId)
    .order("is_primary", {
      ascending: false
    })
    .order("started_at", {
      ascending: true
    });


  if (error) {

    console.error(error);

    table.innerHTML = `
      <tr>
        <td colspan="5">
          Gagal memuat peserta pelayanan.
        </td>
      </tr>
    `;

    return;

  }


  if (!data || data.length === 0) {

    table.innerHTML = `
      <tr>
        <td colspan="5" class="muted">
          Belum ada peserta pelayanan.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML = "";


  data.forEach(
    participant => {

      const profession =
        participant.professions || {};

      const unit =
        participant.units || {};


      const row =
        document.createElement("tr");


      row.innerHTML = `

        <td>
          ${escapeHtml(
            participant.role_code || "-"
          )}
        </td>

        <td>
          ${escapeHtml(
            profession.name || "-"
          )}
        </td>

        <td>
          ${escapeHtml(
            unit.name || "-"
          )}
        </td>

        <td>
          ${
            participant.is_primary
              ? "Ya"
              : "Tidak"
          }
        </td>

        <td>
          ${formatDateTime(
            participant.started_at
          )}
        </td>

      `;


      table.appendChild(row);

    }
  );

}


// ============================================================
// LOAD ANAMNESIS
// ============================================================

async function loadAnamnesis(
  encounterId
) {

  clearAnamnesisForm();


  const {
    data,
    error
  } = await sb
    .from("clinical_anamneses")
    .select(`
      id,
      encounter_id,
      chief_complaint,
      present_illness_history,
      past_medical_history,
      family_history,
      allergy_history,
      medication_history,
      social_history,
      risk_factors,
      additional_notes,
      recorded_by,
      recorded_at,
      created_by,
      updated_by,
      created_at,
      updated_at
    `)
    .eq("encounter_id", encounterId)
    .order("recorded_at", {
      ascending: false
    })
    .limit(1)
    .maybeSingle();


  if (error) {

    console.error(error);

    setMessage(
      "Gagal memuat anamnesis.",
      true
    );

    return;

  }


  if (!data) {

    currentAnamnesis = null;

    updateAnamnesisInfo(
      "Belum ada anamnesis tersimpan."
    );

    return;

  }


  currentAnamnesis =
    data;


  document.getElementById(
    "chiefComplaint"
  ).value =
    data.chief_complaint || "";


  document.getElementById(
    "presentIllnessHistory"
  ).value =
    data.present_illness_history || "";


  document.getElementById(
    "pastMedicalHistory"
  ).value =
    data.past_medical_history || "";


  document.getElementById(
    "familyHistory"
  ).value =
    data.family_history || "";


  document.getElementById(
    "allergyHistory"
  ).value =
    data.allergy_history || "";


  document.getElementById(
    "medicationHistory"
  ).value =
    data.medication_history || "";


  document.getElementById(
    "socialHistory"
  ).value =
    data.social_history || "";


  document.getElementById(
    "riskFactors"
  ).value =
    data.risk_factors || "";


  document.getElementById(
    "additionalNotes"
  ).value =
    data.additional_notes || "";


  updateAnamnesisInfo(
    `Anamnesis terakhir dicatat ${formatDateTime(data.recorded_at)}.`
  );

}


// ============================================================
// SAVE ANAMNESIS
// ============================================================

async function saveAnamnesis(
  event
) {

  event.preventDefault();


  if (!currentEncounter) {

    setMessage(
      "Anamnesis tidak dapat disimpan karena belum ada Encounter.",
      true
    );

    return;

  }


  if (
    currentEncounter.status !==
    "IN_PROGRESS"
  ) {

    setMessage(
      "Anamnesis hanya dapat dicatat pada Encounter yang masih IN_PROGRESS.",
      true
    );

    return;

  }


  const button =
    document.getElementById(
      "saveAnamnesisBtn"
    );


  button.disabled = true;


  try {

    const userId =
      currentProfile.user_id;


    const anamnesisData = {

      encounter_id:
        currentEncounter.id,

      chief_complaint:
        getValue("chiefComplaint"),

      present_illness_history:
        getValue("presentIllnessHistory"),

      past_medical_history:
        getValue("pastMedicalHistory"),

      family_history:
        getValue("familyHistory"),

      allergy_history:
        getValue("allergyHistory"),

      medication_history:
        getValue("medicationHistory"),

      social_history:
        getValue("socialHistory"),

      risk_factors:
        getValue("riskFactors"),

      additional_notes:
        getValue("additionalNotes")

    };


    if (!currentAnamnesis) {

      anamnesisData.recorded_by =
        userId;

      anamnesisData.created_by =
        userId;


      const {
        data,
        error
      } = await sb
        .from("clinical_anamneses")
        .insert(anamnesisData)
        .select()
        .single();


      if (error) {
        throw error;
      }


      currentAnamnesis =
        data;


      updateAnamnesisInfo(
        `Anamnesis tersimpan pada ${formatDateTime(data.recorded_at)}.`
      );


      setMessage(
        "Anamnesis berhasil disimpan."
      );

    } else {

      anamnesisData.updated_by =
        userId;


      const {
        data,
        error
      } = await sb
        .from("clinical_anamneses")
        .update(anamnesisData)
        .eq("id", currentAnamnesis.id)
        .select()
        .single();


      if (error) {
        throw error;
      }


      currentAnamnesis =
        data;


      updateAnamnesisInfo(
        `Anamnesis diperbarui pada ${formatDateTime(data.updated_at)}.`
      );


      setMessage(
        "Anamnesis berhasil diperbarui."
      );

    }

  } catch (error) {

    console.error(error);

    setMessage(
      "Anamnesis gagal disimpan: " +
      (error.message || "kesalahan tidak diketahui"),
      true
    );

  } finally {

    button.disabled = false;

  }

}


// ============================================================
// CLEAR ANAMNESIS FORM
// ============================================================

function clearAnamnesisForm() {

  const fields = [

    "chiefComplaint",
    "presentIllnessHistory",
    "pastMedicalHistory",
    "familyHistory",
    "allergyHistory",
    "medicationHistory",
    "socialHistory",
    "riskFactors",
    "additionalNotes"

  ];


  fields.forEach(
    id => {

      const element =
        document.getElementById(id);

      if (element) {
        element.value = "";
      }

    }
  );


  currentAnamnesis = null;


  updateAnamnesisInfo(
    "Belum ada anamnesis tersimpan."
  );

}


// ============================================================
// UPDATE ANAMNESIS INFO
// ============================================================

function updateAnamnesisInfo(
  message
) {

  const element =
    document.getElementById(
      "anamnesisInfo"
    );


  if (element) {
    element.textContent = message;
  }

}


// ============================================================
// GET FIELD VALUE
// ============================================================

function getValue(
  id
) {

  const element =
    document.getElementById(id);


  if (!element) {
    return null;
  }


  const value =
    element.value.trim();


  return value === ""
    ? null
    : value;

}


// ============================================================
// UPDATE ENCOUNTER DISPLAY
// ============================================================

function updateEncounterDisplay() {

  if (!selectedRegistration) {
    return;
  }


  const registration =
    selectedRegistration;


  const patient =
    registration.patients || {};

  const unit =
    registration.units || {};


  document.getElementById(
    "encounterPatient"
  ).textContent =
    patient.full_name || "-";


  document.getElementById(
    "encounterRM"
  ).textContent =
    patient.medical_record_number || "-";


  document.getElementById(
    "encounterUnit"
  ).textContent =
    unit.name || "-";


  if (!currentEncounter) {

    document.getElementById(
      "encounterNumber"
    ).textContent = "-";


    document.getElementById(
      "encounterStatus"
    ).textContent =
      "BELUM DIBUAT";


    document.getElementById(
      "startEncounterBtn"
    ).disabled = false;


    document.getElementById(
      "startEncounterBtn"
    ).textContent =
      "Mulai / Buka Encounter";


    return;

  }


  document.getElementById(
    "encounterNumber"
  ).textContent =
    currentEncounter.encounter_number;


  document.getElementById(
    "encounterStatus"
  ).textContent =
    currentEncounter.status;


  document.getElementById(
    "startEncounterBtn"
  ).disabled = true;


  document.getElementById(
    "startEncounterBtn"
  ).textContent =
    "Encounter Aktif";

}


// ============================================================
// SHOW PANEL
// ============================================================

function showEncounterPanel() {

  document.getElementById(
    "encounterEmpty"
  ).style.display = "none";


  document.getElementById(
    "encounterPanel"
  ).style.display = "block";

}


// ============================================================
// MESSAGE
// ============================================================

function setMessage(
  message,
  isError = false
) {

  const element =
    document.getElementById("msg");


  if (!element) {
    return;
  }


  element.textContent =
    message;


  element.style.color =
    isError
      ? "#b91c1c"
      : "";

}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHtml(
  value
) {

  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// ============================================================
// FORMAT DATETIME
// ============================================================

function formatDateTime(
  value
) {

  if (!value) {
    return "-";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "-";

  }


  return date.toLocaleString(
    "id-ID",
    {
      dateStyle: "short",
      timeStyle: "short"
    }
  );

}
