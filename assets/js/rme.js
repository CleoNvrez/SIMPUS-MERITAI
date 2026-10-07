// SIMPUS MERITAI — Fresh Start V2
// Modul Rekam Medis Elektronik — Encounter + Anamnesis + Vital Sign

let currentProfile = null;
let selectedRegistration = null;
let currentEncounter = null;
let currentAnamnesis = null;
let currentVital = null;


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

  const vitalForm =
    document.getElementById("vitalForm");

  const reloadVitalButton =
    document.getElementById("reloadVitalBtn");

  const weightInput =
    document.getElementById("weightKg");

  const heightInput =
    document.getElementById("heightCm");


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


  if (vitalForm) {

    vitalForm.addEventListener(
      "submit",
      saveVital
    );

  }


  if (reloadVitalButton) {

    reloadVitalButton.addEventListener(
      "click",
      async () => {

        if (!currentEncounter) {

          setMessage(
            "Belum ada Encounter aktif.",
            true
          );

          return;

        }

        await loadVital(
          currentEncounter.id
        );

      }
    );

  }


  if (weightInput) {

    weightInput.addEventListener(
      "input",
      calculateBMI
    );

  }


  if (heightInput) {

    heightInput.addEventListener(
      "input",
      calculateBMI
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
  currentVital = null;

  showEncounterPanel();

  clearAnamnesisForm();

  clearVitalForm();

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
    currentVital = null;

    updateEncounterDisplay();
    clearAnamnesisForm();
    clearVitalForm();

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


  await loadVital(
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


    await loadVital(
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
// LOAD VITAL SIGN
// ============================================================

async function loadVital(
  encounterId
) {

  clearVitalForm();


  const {
    data,
    error
  } = await sb
    .from("clinical_vitals")
    .select(`
      id,
      encounter_id,
      measured_at,
      systolic_bp,
      diastolic_bp,
      pulse_rate,
      respiratory_rate,
      temperature_c,
      oxygen_saturation,
      weight_kg,
      height_cm,
      head_circumference_cm,
      mid_upper_arm_circumference_cm,
      consciousness_level,
      additional_notes,
      recorded_by,
      created_by,
      updated_by,
      created_at,
      updated_at
    `)
    .eq("encounter_id", encounterId)
    .order("measured_at", {
      ascending: false
    })
    .limit(1)
    .maybeSingle();


  if (error) {

    console.error(error);

    setMessage(
      "Gagal memuat Vital Sign.",
      true
    );

    return;

  }


  if (!data) {

    currentVital = null;

    setDefaultMeasuredAt();

    updateVitalInfo(
      "Belum ada Vital Sign tersimpan."
    );

    calculateBMI();

    return;

  }


  currentVital =
    data;


  setInputValue(
    "measuredAt",
    toDateTimeLocal(data.measured_at)
  );


  setInputValue(
    "systolicBp",
    data.systolic_bp
  );


  setInputValue(
    "diastolicBp",
    data.diastolic_bp
  );


  setInputValue(
    "pulseRate",
    data.pulse_rate
  );


  setInputValue(
    "respiratoryRate",
    data.respiratory_rate
  );


  setInputValue(
    "temperatureC",
    data.temperature_c
  );


  setInputValue(
    "oxygenSaturation",
    data.oxygen_saturation
  );


  setInputValue(
    "weightKg",
    data.weight_kg
  );


  setInputValue(
    "heightCm",
    data.height_cm
  );


  setInputValue(
    "headCircumferenceCm",
    data.head_circumference_cm
  );


  setInputValue(
    "midUpperArmCircumferenceCm",
    data.mid_upper_arm_circumference_cm
  );


  setInputValue(
    "consciousnessLevel",
    data.consciousness_level
  );


  setInputValue(
    "vitalAdditionalNotes",
    data.additional_notes
  );


  calculateBMI();


  updateVitalInfo(
    `Vital Sign terakhir diukur ${formatDateTime(data.measured_at)}.`
  );

}


// ============================================================
// SAVE VITAL SIGN
// ============================================================

async function saveVital(
  event
) {

  event.preventDefault();


  if (!currentEncounter) {

    setMessage(
      "Vital Sign tidak dapat disimpan karena belum ada Encounter.",
      true
    );

    return;

  }


  if (
    currentEncounter.status !==
    "IN_PROGRESS"
  ) {

    setMessage(
      "Vital Sign hanya dapat dicatat pada Encounter yang masih IN_PROGRESS.",
      true
    );

    return;

  }


  const button =
    document.getElementById(
      "saveVitalBtn"
    );


  button.disabled = true;


  try {

    const userId =
      currentProfile.user_id;


    const measuredAt =
      getDateTimeValue("measuredAt");


    const vitalData = {

      encounter_id:
        currentEncounter.id,

      measured_at:
        measuredAt || new Date().toISOString(),

      systolic_bp:
        getNumberValue("systolicBp"),

      diastolic_bp:
        getNumberValue("diastolicBp"),

      pulse_rate:
        getNumberValue("pulseRate"),

      respiratory_rate:
        getNumberValue("respiratoryRate"),

      temperature_c:
        getNumberValue("temperatureC"),

      oxygen_saturation:
        getNumberValue("oxygenSaturation"),

      weight_kg:
        getNumberValue("weightKg"),

      height_cm:
        getNumberValue("heightCm"),

      head_circumference_cm:
        getNumberValue("headCircumferenceCm"),

      mid_upper_arm_circumference_cm:
        getNumberValue("midUpperArmCircumferenceCm"),

      consciousness_level:
        getValue("consciousnessLevel"),

      additional_notes:
        getValue("vitalAdditionalNotes")

    };


    if (!currentVital) {

      vitalData.recorded_by =
        userId;

      vitalData.created_by =
        userId;


      const {
        data,
        error
      } = await sb
        .from("clinical_vitals")
        .insert(vitalData)
        .select()
        .single();


      if (error) {
        throw error;
      }


      currentVital =
        data;


      updateVitalInfo(
        `Vital Sign tersimpan pada ${formatDateTime(data.measured_at)}.`
      );


      setMessage(
        "Vital Sign berhasil disimpan."
      );

    } else {

      vitalData.updated_by =
        userId;


      const {
        data,
        error
      } = await sb
        .from("clinical_vitals")
        .update(vitalData)
        .eq("id", currentVital.id)
        .select()
        .single();


      if (error) {
        throw error;
      }


      currentVital =
        data;


      updateVitalInfo(
        `Vital Sign diperbarui pada ${formatDateTime(data.updated_at)}.`
      );


      setMessage(
        "Vital Sign berhasil diperbarui."
      );

    }


    calculateBMI();

  } catch (error) {

    console.error(error);

    setMessage(
      "Vital Sign gagal disimpan: " +
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
// CLEAR VITAL FORM
// ============================================================

function clearVitalForm() {

  const fields = [

    "systolicBp",
    "diastolicBp",
    "pulseRate",
    "respiratoryRate",
    "temperatureC",
    "oxygenSaturation",
    "weightKg",
    "heightCm",
    "headCircumferenceCm",
    "midUpperArmCircumferenceCm",
    "consciousnessLevel",
    "vitalAdditionalNotes"

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


  currentVital = null;


  setDefaultMeasuredAt();


  updateVitalInfo(
    "Belum ada Vital Sign tersimpan."
  );


  const bmi =
    document.getElementById(
      "bmiDisplay"
    );


  if (bmi) {

    bmi.textContent =
      "Belum dapat dihitung.";

  }

}


// ============================================================
// DEFAULT WAKTU PENGUKURAN
// ============================================================

function setDefaultMeasuredAt() {

  const element =
    document.getElementById(
      "measuredAt"
    );


  if (!element) {
    return;
  }


  const now =
    new Date();


  const offset =
    now.getTimezoneOffset();


  const localDate =
    new Date(
      now.getTime() -
      offset * 60000
    );


  element.value =
    localDate
      .toISOString()
      .slice(0, 16);

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
// UPDATE VITAL INFO
// ============================================================

function updateVitalInfo(
  message
) {

  const element =
    document.getElementById(
      "vitalInfo"
    );


  if (element) {
    element.textContent = message;
  }

}


// ============================================================
// BMI / IMT
// ============================================================

function calculateBMI() {

  const weight =
    getNumberValue("weightKg");

  const heightCm =
    getNumberValue("heightCm");

  const display =
    document.getElementById(
      "bmiDisplay"
    );


  if (!display) {
    return;
  }


  if (
    !weight ||
    !heightCm ||
    weight <= 0 ||
    heightCm <= 0
  ) {

    display.textContent =
      "Belum dapat dihitung.";

    return;

  }


  const heightM =
    heightCm / 100;


  const bmi =
    weight /
    (heightM * heightM);


  if (!Number.isFinite(bmi)) {

    display.textContent =
      "Belum dapat dihitung.";

    return;

  }


  display.textContent =
    `IMT / BMI: ${bmi.toFixed(1)}`;

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
// GENERIC FIELD HELPERS
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


function getNumberValue(
  id
) {

  const element =
    document.getElementById(id);


  if (!element) {
    return null;
  }


  const value =
    element.value.trim();


  if (value === "") {
    return null;
  }


  const number =
    Number(value);


  return Number.isFinite(number)
    ? number
    : null;

}


function getDateTimeValue(
  id
) {

  const element =
    document.getElementById(id);


  if (!element) {
    return null;
  }


  const value =
    element.value;


  if (!value) {
    return null;
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return null;

  }


  return date.toISOString();

}


function setInputValue(
  id,
  value
) {

  const element =
    document.getElementById(id);


  if (!element) {
    return;
  }


  if (
    value === null ||
    value === undefined
  ) {

    element.value = "";

    return;

  }


  element.value =
    value;

}


function toDateTimeLocal(
  value
) {

  if (!value) {
    return "";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "";

  }


  const offset =
    date.getTimezoneOffset();


  const localDate =
    new Date(
      date.getTime() -
      offset * 60000
    );


  return localDate
    .toISOString()
    .slice(0, 16);

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
