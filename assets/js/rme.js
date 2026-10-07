

// SIMPUS MERITAI — Fresh Start V2
// Modul Rekam Medis Elektronik
// Encounter + Anamnesis + Vital Sign + Pemeriksaan Fisik
// + Diagnosis + Tindakan + Rujukan

let currentProfile = null;
let selectedRegistration = null;
let currentEncounter = null;
let currentAnamnesis = null;
let currentVital = null;

let currentPhysicalExams = [];
let editingPhysicalExamId = null;

let currentDiagnoses = [];
let editingDiagnosisId = null;

let currentActions = [];
let editingActionId = null;

let currentReferrals = [];
let editingReferralId = null;


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

  const physicalExamForm =
    document.getElementById("physicalExamForm");

  const reloadPhysicalExamButton =
    document.getElementById("reloadPhysicalExamBtn");

  const cancelPhysicalExamEditButton =
    document.getElementById("cancelPhysicalExamEditBtn");

  const diagnosisForm =
    document.getElementById("diagnosisForm");

  const reloadDiagnosisButton =
    document.getElementById("reloadDiagnosisBtn");

  const cancelDiagnosisEditButton =
    document.getElementById("cancelDiagnosisEditBtn");

  const actionForm =
    document.getElementById("actionForm");

  const reloadActionButton =
    document.getElementById("reloadActionBtn");

  const cancelActionEditButton =
    document.getElementById("cancelActionEditBtn");

  const referralForm =
    document.getElementById("referralForm");

  const reloadReferralButton =
    document.getElementById("reloadReferralBtn");

  const cancelReferralEditButton =
    document.getElementById("cancelReferralEditBtn");


  // ==========================================================
  // ENCOUNTER
  // ==========================================================

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


  // ==========================================================
  // ANAMNESIS
  // ==========================================================

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


  // ==========================================================
  // VITAL SIGN
  // ==========================================================

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


  // ==========================================================
  // PEMERIKSAAN FISIK
  // ==========================================================

  if (physicalExamForm) {

    physicalExamForm.addEventListener(
      "submit",
      savePhysicalExam
    );

  }


  if (reloadPhysicalExamButton) {

    reloadPhysicalExamButton.addEventListener(
      "click",
      async () => {

        if (!currentEncounter) {

          setMessage(
            "Belum ada Encounter aktif.",
            true
          );

          return;

        }

        await loadPhysicalExams(
          currentEncounter.id
        );

      }
    );

  }


  if (cancelPhysicalExamEditButton) {

    cancelPhysicalExamEditButton.addEventListener(
      "click",
      cancelPhysicalExamEdit
    );

  }


  // ==========================================================
  // DIAGNOSIS
  // ==========================================================

  if (diagnosisForm) {

    diagnosisForm.addEventListener(
      "submit",
      saveDiagnosis
    );

  }


  if (reloadDiagnosisButton) {

    reloadDiagnosisButton.addEventListener(
      "click",
      async () => {

        if (!currentEncounter) {

          setMessage(
            "Belum ada Encounter aktif.",
            true
          );

          return;

        }

        await loadDiagnoses(
          currentEncounter.id
        );

      }
    );

  }


  if (cancelDiagnosisEditButton) {

    cancelDiagnosisEditButton.addEventListener(
      "click",
      cancelDiagnosisEdit
    );

  }


  // ==========================================================
  // TINDAKAN
  // ==========================================================

  if (actionForm) {

    actionForm.addEventListener(
      "submit",
      saveAction
    );

  }


  if (reloadActionButton) {

    reloadActionButton.addEventListener(
      "click",
      async () => {

        if (!currentEncounter) {

          setMessage(
            "Belum ada Encounter aktif.",
            true
          );

          return;

        }

        await loadActions(
          currentEncounter.id
        );

      }
    );

  }


  if (cancelActionEditButton) {

    cancelActionEditButton.addEventListener(
      "click",
      cancelActionEdit
    );

  }


  // ==========================================================
  // RUJUKAN
  // ==========================================================

  if (referralForm) {

    referralForm.addEventListener(
      "submit",
      saveReferral
    );

  }


  if (reloadReferralButton) {

    reloadReferralButton.addEventListener(
      "click",
      async () => {

        if (!currentEncounter) {

          setMessage(
            "Belum ada Encounter aktif.",
            true
          );

          return;

        }

        await loadReferrals(
          currentEncounter.id
        );

      }
    );

  }


  if (cancelReferralEditButton) {

    cancelReferralEditButton.addEventListener(
      "click",
      cancelReferralEdit
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

  currentPhysicalExams = [];
  editingPhysicalExamId = null;

  currentDiagnoses = [];
  editingDiagnosisId = null;

  currentActions = [];
  editingActionId = null;

  currentReferrals = [];
  editingReferralId = null;

  showEncounterPanel();

  clearAnamnesisForm();

  clearVitalForm();

  clearPhysicalExamForm();

  clearDiagnosisForm();

  clearActionForm();

  clearReferralForm();

  renderPhysicalExamTable();

  renderDiagnosisTable();

  renderActionTable();

  renderReferralTable();

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

    currentPhysicalExams = [];
    editingPhysicalExamId = null;

    currentDiagnoses = [];
    editingDiagnosisId = null;

    currentActions = [];
    editingActionId = null;

    currentReferrals = [];
    editingReferralId = null;

    updateEncounterDisplay();

    clearAnamnesisForm();

    clearVitalForm();

    clearPhysicalExamForm();

    clearDiagnosisForm();

    clearActionForm();

    clearReferralForm();

    renderPhysicalExamTable();

    renderDiagnosisTable();

    renderActionTable();

    renderReferralTable();

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


  await loadPhysicalExams(
    data.id
  );


  await loadDiagnoses(
    data.id
  );


  await loadActions(
    data.id
  );


  await loadReferrals(
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


    await loadPhysicalExams(
      data.id
    );


    await loadDiagnoses(
      data.id
    );


    await loadActions(
      data.id
    );


    await loadReferrals(
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
// LOAD PEMERIKSAAN FISIK
// ============================================================

async function loadPhysicalExams(
  encounterId
) {

  currentPhysicalExams = [];
  editingPhysicalExamId = null;

  clearPhysicalExamForm();


  const {
    data,
    error
  } = await sb
    .from("clinical_physical_exams")
    .select(`
      id,
      encounter_id,
      examined_at,
      body_system,
      body_region,
      finding,
      normal_abnormal,
      additional_notes,
      recorded_by,
      created_by,
      updated_by,
      created_at,
      updated_at
    `)
    .eq("encounter_id", encounterId)
    .order("examined_at", {
      ascending: false
    })
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    setMessage(
      "Gagal memuat Pemeriksaan Fisik.",
      true
    );

    renderPhysicalExamTable();

    return;

  }


  currentPhysicalExams =
    data || [];


  renderPhysicalExamTable();


  if (
    currentPhysicalExams.length === 0
  ) {

    updatePhysicalExamInfo(
      "Belum ada pemeriksaan fisik tersimpan."
    );

  } else {

    updatePhysicalExamInfo(
      `${currentPhysicalExams.length} temuan pemeriksaan fisik tersimpan.`
    );

  }

}


// ============================================================
// SAVE / UPDATE PEMERIKSAAN FISIK
// ============================================================

async function savePhysicalExam(
  event
) {

  event.preventDefault();


  if (!currentEncounter) {

    setMessage(
      "Pemeriksaan Fisik tidak dapat disimpan karena belum ada Encounter.",
      true
    );

    return;

  }


  if (
    currentEncounter.status !==
    "IN_PROGRESS"
  ) {

    setMessage(
      "Pemeriksaan Fisik hanya dapat dicatat pada Encounter yang masih IN_PROGRESS.",
      true
    );

    return;

  }


  const bodySystem =
    getValue("bodySystem");

  const finding =
    getValue("physicalFinding");


  if (!bodySystem) {

    setMessage(
      "Sistem tubuh wajib dipilih.",
      true
    );

    return;

  }


  if (!finding) {

    setMessage(
      "Temuan pemeriksaan wajib diisi.",
      true
    );

    return;

  }


  const button =
    document.getElementById(
      "savePhysicalExamBtn"
    );


  button.disabled = true;


  try {

    const userId =
      currentProfile.user_id;


    const examinedAt =
      getDateTimeValue("examinedAt");


    const physicalExamData = {

      encounter_id:
        currentEncounter.id,

      examined_at:
        examinedAt || new Date().toISOString(),

      body_system:
        bodySystem,

      body_region:
        getValue("bodyRegion"),

      finding:
        finding,

      normal_abnormal:
        getValue("normalAbnormal"),

      additional_notes:
        getValue("physicalAdditionalNotes")

    };


    if (editingPhysicalExamId) {

      physicalExamData.updated_by =
        userId;


      const {
        data,
        error
      } = await sb
        .from("clinical_physical_exams")
        .update(physicalExamData)
        .eq("id", editingPhysicalExamId)
        .eq("encounter_id", currentEncounter.id)
        .select()
        .single();


      if (error) {
        throw error;
      }


      setMessage(
        "Pemeriksaan Fisik berhasil diperbarui."
      );


      await loadPhysicalExams(
        currentEncounter.id
      );


      return;

    }


    physicalExamData.recorded_by =
      userId;

    physicalExamData.created_by =
      userId;


    const {
      data,
      error
    } = await sb
      .from("clinical_physical_exams")
      .insert(physicalExamData)
      .select()
      .single();


    if (error) {
      throw error;
    }


    setMessage(
      "Pemeriksaan Fisik berhasil ditambahkan."
    );


    currentPhysicalExams = [
      data,
      ...currentPhysicalExams
    ];


    editingPhysicalExamId = null;


    clearPhysicalExamForm();


    renderPhysicalExamTable();


    updatePhysicalExamInfo(
      `${currentPhysicalExams.length} temuan pemeriksaan fisik tersimpan.`
    );

  } catch (error) {

    console.error(error);

    setMessage(
      "Pemeriksaan Fisik gagal disimpan: " +
      (error.message || "kesalahan tidak diketahui"),
      true
    );

  } finally {

    button.disabled = false;

  }

}


// ============================================================
// EDIT PEMERIKSAAN FISIK
// ============================================================

function editPhysicalExam(
  id
) {

  if (!currentEncounter) {

    setMessage(
      "Belum ada Encounter aktif.",
      true
    );

    return;

  }


  if (
    currentEncounter.status !==
    "IN_PROGRESS"
  ) {

    setMessage(
      "Pemeriksaan Fisik tidak dapat diubah karena Encounter sudah tidak IN_PROGRESS.",
      true
    );

    return;

  }


  const item =
    currentPhysicalExams.find(
      exam => exam.id === id
    );


  if (!item) {

    setMessage(
      "Data Pemeriksaan Fisik tidak ditemukan.",
      true
    );

    return;

  }


  editingPhysicalExamId =
    item.id;


  setInputValue(
    "examinedAt",
    toDateTimeLocal(item.examined_at)
  );


  setInputValue(
    "bodySystem",
    item.body_system
  );


  setInputValue(
    "bodyRegion",
    item.body_region
  );


  setInputValue(
    "physicalFinding",
    item.finding
  );


  setInputValue(
    "normalAbnormal",
    item.normal_abnormal
  );


  setInputValue(
    "physicalAdditionalNotes",
    item.additional_notes
  );


  const saveButton =
    document.getElementById(
      "savePhysicalExamBtn"
    );


  const cancelButton =
    document.getElementById(
      "cancelPhysicalExamEditBtn"
    );


  if (saveButton) {

    saveButton.textContent =
      "Simpan Perubahan";

  }


  if (cancelButton) {

    cancelButton.style.display =
      "inline-block";

  }


  updatePhysicalExamInfo(
    `Sedang mengubah temuan pemeriksaan ${formatDateTime(item.examined_at)}.`
  );


  const findingInput =
    document.getElementById(
      "physicalFinding"
    );


  if (findingInput) {

    findingInput.focus();

  }

}


// ============================================================
// CANCEL EDIT PEMERIKSAAN FISIK
// ============================================================

function cancelPhysicalExamEdit() {

  editingPhysicalExamId = null;

  clearPhysicalExamForm();


  updatePhysicalExamInfo(
    currentPhysicalExams.length
      ? `${currentPhysicalExams.length} temuan pemeriksaan fisik tersimpan.`
      : "Belum ada pemeriksaan fisik tersimpan."
  );

}


// ============================================================
// RENDER PEMERIKSAAN FISIK
// ============================================================

function renderPhysicalExamTable() {

  const table =
    document.getElementById(
      "physicalExamTable"
    );


  if (!table) {
    return;
  }


  if (
    !currentPhysicalExams ||
    currentPhysicalExams.length === 0
  ) {

    table.innerHTML = `
      <tr>
        <td colspan="7" class="muted">
          Belum ada temuan pemeriksaan fisik.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML = "";


  currentPhysicalExams.forEach(
    exam => {

      const row =
        document.createElement("tr");


      const systemLabel =
        getPhysicalSystemLabel(
          exam.body_system
        );


      const statusLabel =
        getPhysicalStatusLabel(
          exam.normal_abnormal
        );


      row.innerHTML = `

        <td>
          ${escapeHtml(
            formatDateTime(
              exam.examined_at
            )
          )}
        </td>

        <td>
          ${escapeHtml(
            systemLabel
          )}
        </td>

        <td>
          ${escapeHtml(
            exam.body_region || "-"
          )}
        </td>

        <td>
          ${escapeHtml(
            statusLabel
          )}
        </td>

        <td style="white-space:pre-wrap">
          ${escapeHtml(
            exam.finding || "-"
          )}
        </td>

        <td style="white-space:pre-wrap">
          ${escapeHtml(
            exam.additional_notes || "-"
          )}
        </td>

        <td>

          <button
            type="button"
            class="edit-physical-exam"
          >
            Ubah
          </button>

        </td>

      `;


      const editButton =
        row.querySelector(
          ".edit-physical-exam"
        );


      if (editButton) {

        editButton.addEventListener(
          "click",
          () => {

            editPhysicalExam(
              exam.id
            );

          }
        );

      }


      table.appendChild(row);

    }
  );

}


// ============================================================
// DIAGNOSIS — LOAD
// ============================================================

async function loadDiagnoses(
  encounterId
) {

  currentDiagnoses = [];
  editingDiagnosisId = null;

  clearDiagnosisForm();


  const {
    data,
    error
  } = await sb
    .from("clinical_diagnoses")
    .select(`
      id,
      encounter_id,
      diagnosis_type,
      diagnosis_code,
      diagnosis_name,
      diagnosis_notes,
      diagnosed_at,
      recorded_by,
      created_by,
      updated_by,
      created_at,
      updated_at
    `)
    .eq("encounter_id", encounterId)
    .order("diagnosed_at", {
      ascending: false
    })
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    setMessage(
      "Gagal memuat Diagnosis.",
      true
    );

    renderDiagnosisTable();

    return;

  }


  currentDiagnoses =
    data || [];


  renderDiagnosisTable();


  if (
    currentDiagnoses.length === 0
  ) {

    updateDiagnosisInfo(
      "Belum ada diagnosis tersimpan."
    );

  } else {

    updateDiagnosisInfo(
      `${currentDiagnoses.length} diagnosis tersimpan.`
    );

  }

}


// ============================================================
// DIAGNOSIS — SAVE / UPDATE
// ============================================================

async function saveDiagnosis(
  event
) {

  event.preventDefault();


  if (!currentEncounter) {

    setMessage(
      "Diagnosis tidak dapat disimpan karena belum ada Encounter.",
      true
    );

    return;

  }


  if (
    currentEncounter.status !==
    "IN_PROGRESS"
  ) {

    setMessage(
      "Diagnosis hanya dapat dicatat pada Encounter yang masih IN_PROGRESS.",
      true
    );

    return;

  }


  const diagnosisType =
    getValue("diagnosisType");

  const diagnosisName =
    getValue("diagnosisName");


  if (!diagnosisType) {

    setMessage(
      "Tipe diagnosis wajib dipilih.",
      true
    );

    return;

  }


  if (!diagnosisName) {

    setMessage(
      "Nama diagnosis wajib diisi.",
      true
    );

    return;

  }


  const button =
    document.getElementById(
      "saveDiagnosisBtn"
    );


  button.disabled = true;


  try {

    const userId =
      currentProfile.user_id;


    const diagnosedAt =
      getDateTimeValue("diagnosedAt");


    const diagnosisData = {

      encounter_id:
        currentEncounter.id,

      diagnosis_type:
        diagnosisType,

      diagnosis_code:
        getValue("diagnosisCode"),

      diagnosis_name:
        diagnosisName,

      diagnosis_notes:
        getValue("diagnosisNotes"),

      diagnosed_at:
        diagnosedAt || new Date().toISOString()

    };


    if (editingDiagnosisId) {

      diagnosisData.updated_by =
        userId;


      const {
        data,
        error
      } = await sb
        .from("clinical_diagnoses")
        .update(diagnosisData)
        .eq("id", editingDiagnosisId)
        .eq("encounter_id", currentEncounter.id)
        .select()
        .single();


      if (error) {
        throw error;
      }


      setMessage(
        "Diagnosis berhasil diperbarui."
      );


      await loadDiagnoses(
        currentEncounter.id
      );


      return;

    }


    diagnosisData.recorded_by =
      userId;

    diagnosisData.created_by =
      userId;


    const {
      data,
      error
    } = await sb
      .from("clinical_diagnoses")
      .insert(diagnosisData)
      .select()
      .single();


    if (error) {
      throw error;
    }


    currentDiagnoses = [
      data,
      ...currentDiagnoses
    ];


    editingDiagnosisId = null;


    clearDiagnosisForm();


    renderDiagnosisTable();


    updateDiagnosisInfo(
      `${currentDiagnoses.length} diagnosis tersimpan.`
    );


    setMessage(
      "Diagnosis berhasil ditambahkan."
    );

  } catch (error) {

    console.error(error);

    setMessage(
      "Diagnosis gagal disimpan: " +
      (error.message || "kesalahan tidak diketahui"),
      true
    );

  } finally {

    button.disabled = false;

  }

}


// ============================================================
// DIAGNOSIS — EDIT
// ============================================================

function editDiagnosis(
  id
) {

  if (!currentEncounter) {

    setMessage(
      "Belum ada Encounter aktif.",
      true
    );

    return;

  }


  if (
    currentEncounter.status !==
    "IN_PROGRESS"
  ) {

    setMessage(
      "Diagnosis tidak dapat diubah karena Encounter sudah tidak IN_PROGRESS.",
      true
    );

    return;

  }


  const item =
    currentDiagnoses.find(
      diagnosis => diagnosis.id === id
    );


  if (!item) {

    setMessage(
      "Data Diagnosis tidak ditemukan.",
      true
    );

    return;

  }


  editingDiagnosisId =
    item.id;


  setInputValue(
    "diagnosedAt",
    toDateTimeLocal(item.diagnosed_at)
  );


  setInputValue(
    "diagnosisType",
    item.diagnosis_type
  );


  setInputValue(
    "diagnosisCode",
    item.diagnosis_code
  );


  setInputValue(
    "diagnosisName",
    item.diagnosis_name
  );


  setInputValue(
    "diagnosisNotes",
    item.diagnosis_notes
  );


  const saveButton =
    document.getElementById(
      "saveDiagnosisBtn"
    );


  const cancelButton =
    document.getElementById(
      "cancelDiagnosisEditBtn"
    );


  if (saveButton) {

    saveButton.textContent =
      "Simpan Perubahan";

  }


  if (cancelButton) {

    cancelButton.style.display =
      "inline-block";

  }


  updateDiagnosisInfo(
    `Sedang mengubah diagnosis ${item.diagnosis_name}.`
  );


  const nameInput =
    document.getElementById(
      "diagnosisName"
    );


  if (nameInput) {

    nameInput.focus();

  }

}


// ============================================================
// DIAGNOSIS — CANCEL EDIT
// ============================================================

function cancelDiagnosisEdit() {

  editingDiagnosisId = null;

  clearDiagnosisForm();


  updateDiagnosisInfo(
    currentDiagnoses.length
      ? `${currentDiagnoses.length} diagnosis tersimpan.`
      : "Belum ada diagnosis tersimpan."
  );

}


// ============================================================
// DIAGNOSIS — RENDER TABLE
// ============================================================

function renderDiagnosisTable() {

  const table =
    document.getElementById(
      "diagnosisTable"
    );


  if (!table) {
    return;
  }


  if (
    !currentDiagnoses ||
    currentDiagnoses.length === 0
  ) {

    table.innerHTML = `
      <tr>
        <td colspan="7" class="muted">
          Belum ada diagnosis tersimpan.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML = "";


  currentDiagnoses.forEach(
    diagnosis => {

      const row =
        document.createElement("tr");


      row.innerHTML = `

        <td>
          ${escapeHtml(
            formatDateTime(
              diagnosis.diagnosed_at
            )
          )}
        </td>

        <td>
          ${escapeHtml(
            getDiagnosisTypeLabel(
              diagnosis.diagnosis_type
            )
          )}
        </td>

        <td>
          ${escapeHtml(
            diagnosis.diagnosis_code || "-"
          )}
        </td>

        <td style="white-space:pre-wrap">
          ${escapeHtml(
            diagnosis.diagnosis_name || "-"
          )}
        </td>

        <td style="white-space:pre-wrap">
          ${escapeHtml(
            diagnosis.diagnosis_notes || "-"
          )}
        </td>

        <td>
          ${escapeHtml(
            diagnosis.updated_at
              ? formatDateTime(
                  diagnosis.updated_at
                )
              : formatDateTime(
                  diagnosis.created_at
                )
          )}
        </td>

        <td>

          <button
            type="button"
            class="edit-diagnosis"
          >
            Ubah
          </button>

        </td>

      `;


      const editButton =
        row.querySelector(
          ".edit-diagnosis"
        );


      if (editButton) {

        editButton.addEventListener(
          "click",
          () => {

            editDiagnosis(
              diagnosis.id
            );

          }
        );

      }


      table.appendChild(row);

    }
  );

}


// ============================================================
// DIAGNOSIS — CLEAR FORM
// ============================================================

function clearDiagnosisForm() {

  const fields = [

    "diagnosisType",
    "diagnosisCode",
    "diagnosisName",
    "diagnosisNotes"

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


  editingDiagnosisId = null;


  setDefaultDiagnosedAt();


  const saveButton =
    document.getElementById(
      "saveDiagnosisBtn"
    );


  const cancelButton =
    document.getElementById(
      "cancelDiagnosisEditBtn"
    );


  if (saveButton) {

    saveButton.textContent =
      "Tambah Diagnosis";

  }


  if (cancelButton) {

    cancelButton.style.display =
      "none";

  }

}


// ============================================================
// DIAGNOSIS — DEFAULT WAKTU
// ============================================================

function setDefaultDiagnosedAt() {

  const element =
    document.getElementById(
      "diagnosedAt"
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
// DIAGNOSIS — LABEL
// ============================================================

function getDiagnosisTypeLabel(
  value
) {

  const labels = {

    WORKING:
      "Diagnosis Kerja",

    PRIMARY:
      "Diagnosis Utama",

    SECONDARY:
      "Diagnosis Sekunder",

    FINAL:
      "Diagnosis Final"

  };


  return labels[value] || value || "-";

}


// ============================================================
// DIAGNOSIS — INFO
// ============================================================

function updateDiagnosisInfo(
  message
) {

  const element =
    document.getElementById(
      "diagnosisInfo"
    );


  if (element) {

    element.textContent =
      message;

  }

}


// ============================================================
// TINDAKAN — LOAD
// ============================================================

async function loadActions(
  encounterId
) {

  currentActions = [];
  editingActionId = null;

  clearActionForm();


  const {
    data,
    error
  } = await sb
    .from("clinical_actions")
    .select(`
      id,
      encounter_id,
      action_code,
      action_name,
      action_notes,
      performed_at,
      performed_by,
      created_by,
      updated_by,
      created_at,
      updated_at
    `)
    .eq("encounter_id", encounterId)
    .order("performed_at", {
      ascending: false
    })
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    setMessage(
      "Gagal memuat Tindakan.",
      true
    );

    renderActionTable();

    return;

  }


  currentActions =
    data || [];


  renderActionTable();


  if (
    currentActions.length === 0
  ) {

    updateActionInfo(
      "Belum ada tindakan tersimpan."
    );

  } else {

    updateActionInfo(
      `${currentActions.length} tindakan tersimpan.`
    );

  }

}


// ============================================================
// TINDAKAN — SAVE / UPDATE
// ============================================================

async function saveAction(
  event
) {

  event.preventDefault();


  if (!currentEncounter) {

    setMessage(
      "Tindakan tidak dapat disimpan karena belum ada Encounter.",
      true
    );

    return;

  }


  if (
    currentEncounter.status !==
    "IN_PROGRESS"
  ) {

    setMessage(
      "Tindakan hanya dapat dicatat pada Encounter yang masih IN_PROGRESS.",
      true
    );

    return;

  }


  const actionName =
    getValue("actionName");


  if (!actionName) {

    setMessage(
      "Nama tindakan wajib diisi.",
      true
    );

    return;

  }


  const button =
    document.getElementById(
      "saveActionBtn"
    );


  button.disabled = true;


  try {

    const userId =
      currentProfile.user_id;


    const performedAt =
      getDateTimeValue("performedAt");


    const actionData = {

      encounter_id:
        currentEncounter.id,

      action_code:
        getValue("actionCode"),

      action_name:
        actionName,

      action_notes:
        getValue("actionNotes"),

      performed_at:
        performedAt || new Date().toISOString()

    };


    // --------------------------------------------------------
    // UPDATE TINDAKAN
    // --------------------------------------------------------

    if (editingActionId) {

      actionData.updated_by =
        userId;


      const {
        data,
        error
      } = await sb
        .from("clinical_actions")
        .update(actionData)
        .eq("id", editingActionId)
        .eq("encounter_id", currentEncounter.id)
        .select()
        .single();


      if (error) {
        throw error;
      }


      setMessage(
        "Tindakan berhasil diperbarui."
      );


      await loadActions(
        currentEncounter.id
      );


      return;

    }


    // --------------------------------------------------------
    // INSERT TINDAKAN BARU
    // --------------------------------------------------------

    actionData.performed_by =
      userId;

    actionData.created_by =
      userId;


    const {
      data,
      error
    } = await sb
      .from("clinical_actions")
      .insert(actionData)
      .select()
      .single();


    if (error) {
      throw error;
    }


    currentActions = [
      data,
      ...currentActions
    ];


    editingActionId = null;


    clearActionForm();


    renderActionTable();


    updateActionInfo(
      `${currentActions.length} tindakan tersimpan.`
    );


    setMessage(
      "Tindakan berhasil ditambahkan."
    );

  } catch (error) {

    console.error(error);

    setMessage(
      "Tindakan gagal disimpan: " +
      (error.message || "kesalahan tidak diketahui"),
      true
    );

  } finally {

    button.disabled = false;

  }

}


// ============================================================
// TINDAKAN — EDIT
// ============================================================

function editAction(
  id
) {

  if (!currentEncounter) {

    setMessage(
      "Belum ada Encounter aktif.",
      true
    );

    return;

  }


  if (
    currentEncounter.status !==
    "IN_PROGRESS"
  ) {

    setMessage(
      "Tindakan tidak dapat diubah karena Encounter sudah tidak IN_PROGRESS.",
      true
    );

    return;

  }


  const item =
    currentActions.find(
      action => action.id === id
    );


  if (!item) {

    setMessage(
      "Data Tindakan tidak ditemukan.",
      true
    );

    return;

  }


  editingActionId =
    item.id;


  setInputValue(
    "performedAt",
    toDateTimeLocal(item.performed_at)
  );


  setInputValue(
    "actionCode",
    item.action_code
  );


  setInputValue(
    "actionName",
    item.action_name
  );


  setInputValue(
    "actionNotes",
    item.action_notes
  );


  const saveButton =
    document.getElementById(
      "saveActionBtn"
    );


  const cancelButton =
    document.getElementById(
      "cancelActionEditBtn"
    );


  if (saveButton) {

    saveButton.textContent =
      "Simpan Perubahan";

  }


  if (cancelButton) {

    cancelButton.style.display =
      "inline-block";

  }


  updateActionInfo(
    `Sedang mengubah tindakan ${item.action_name}.`
  );


  const nameInput =
    document.getElementById(
      "actionName"
    );


  if (nameInput) {

    nameInput.focus();

  }

}


// ============================================================
// TINDAKAN — CANCEL EDIT
// ============================================================

function cancelActionEdit() {

  editingActionId = null;

  clearActionForm();


  updateActionInfo(
    currentActions.length
      ? `${currentActions.length} tindakan tersimpan.`
      : "Belum ada tindakan tersimpan."
  );

}


// ============================================================
// TINDAKAN — RENDER TABLE
// ============================================================

function renderActionTable() {

  const table =
    document.getElementById(
      "actionTable"
    );


  if (!table) {
    return;
  }


  if (
    !currentActions ||
    currentActions.length === 0
  ) {

    table.innerHTML = `
      <tr>
        <td colspan="6" class="muted">
          Belum ada tindakan tersimpan.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML = "";


  currentActions.forEach(
    action => {

      const row =
        document.createElement("tr");


      row.innerHTML = `

        <td>
          ${escapeHtml(
            formatDateTime(
              action.performed_at
            )
          )}
        </td>

        <td>
          ${escapeHtml(
            action.action_code || "-"
          )}
        </td>

        <td style="white-space:pre-wrap">
          ${escapeHtml(
            action.action_name || "-"
          )}
        </td>

        <td style="white-space:pre-wrap">
          ${escapeHtml(
            action.action_notes || "-"
          )}
        </td>

        <td>
          ${escapeHtml(
            action.updated_at
              ? formatDateTime(
                  action.updated_at
                )
              : formatDateTime(
                  action.created_at
                )
          )}
        </td>

        <td>

          <button
            type="button"
            class="edit-action"
          >
            Ubah
          </button>

        </td>

      `;


      const editButton =
        row.querySelector(
          ".edit-action"
        );


      if (editButton) {

        editButton.addEventListener(
          "click",
          () => {

            editAction(
              action.id
            );

          }
        );

      }


      table.appendChild(row);

    }
  );

}


// ============================================================
// TINDAKAN — CLEAR FORM
// ============================================================

function clearActionForm() {

  const fields = [

    "actionCode",
    "actionName",
    "actionNotes"

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


  editingActionId = null;


  setDefaultPerformedAt();


  const saveButton =
    document.getElementById(
      "saveActionBtn"
    );


  const cancelButton =
    document.getElementById(
      "cancelActionEditBtn"
    );


  if (saveButton) {

    saveButton.textContent =
      "Tambah Tindakan";

  }


  if (cancelButton) {

    cancelButton.style.display =
      "none";

  }

}


// ============================================================
// TINDAKAN — DEFAULT WAKTU
// ============================================================

function setDefaultPerformedAt() {

  const element =
    document.getElementById(
      "performedAt"
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
// TINDAKAN — INFO
// ============================================================

function updateActionInfo(
  message
) {

  const element =
    document.getElementById(
      "actionInfo"
    );


  if (element) {

    element.textContent =
      message;

  }

}



// ============================================================
// RUJUKAN — LOAD
// ============================================================

async function loadReferrals(
  encounterId
) {

  currentReferrals = [];
  editingReferralId = null;

  clearReferralForm();


  const {
    data,
    error
  } = await sb
    .from("clinical_referrals")
    .select(`
      id,
      encounter_id,
      referral_type,
      destination_facility_name,
      destination_facility_code,
      referral_reason,
      clinical_summary,
      referral_diagnosis,
      patient_condition,
      referral_number,
      referral_status,
      referred_at,
      referred_by,
      created_by,
      updated_by,
      created_at,
      updated_at
    `)
    .eq("encounter_id", encounterId)
    .order("referred_at", {
      ascending: false
    })
    .order("created_at", {
      ascending: false
    });


  if (error) {

    console.error(error);

    setMessage(
      "Gagal memuat Rujukan.",
      true
    );

    renderReferralTable();

    return;

  }


  currentReferrals =
    data || [];


  renderReferralTable();


  if (
    currentReferrals.length === 0
  ) {

    updateReferralInfo(
      "Belum ada rujukan tersimpan."
    );

  } else {

    updateReferralInfo(
      `${currentReferrals.length} rujukan tersimpan.`
    );

  }

}


// ============================================================
// RUJUKAN — SAVE / UPDATE
// ============================================================

async function saveReferral(
  event
) {

  event.preventDefault();


  if (!currentEncounter) {

    setMessage(
      "Rujukan tidak dapat disimpan karena belum ada Encounter.",
      true
    );

    return;

  }


  if (
    currentEncounter.status !==
    "IN_PROGRESS"
  ) {

    setMessage(
      "Rujukan hanya dapat dicatat pada Encounter yang masih IN_PROGRESS.",
      true
    );

    return;

  }


  const referralType =
    getValue("referralType");

  const destinationFacilityName =
    getValue("destinationFacilityName");

  const referralReason =
    getValue("referralReason");


  if (!referralType) {

    setMessage(
      "Jenis rujukan wajib dipilih.",
      true
    );

    return;

  }


  if (!destinationFacilityName) {

    setMessage(
      "Fasilitas tujuan wajib diisi.",
      true
    );

    return;

  }


  if (!referralReason) {

    setMessage(
      "Alasan / indikasi rujukan wajib diisi.",
      true
    );

    return;

  }


  const button =
    document.getElementById(
      "saveReferralBtn"
    );


  if (button) {
    button.disabled = true;
  }


  try {

    const userId =
      currentProfile.user_id;


    const referredAt =
      getDateTimeValue("referredAt");


    const referralData = {

      encounter_id:
        currentEncounter.id,

      referral_type:
        referralType,

      destination_facility_name:
        destinationFacilityName,

      destination_facility_code:
        getValue("destinationFacilityCode"),

      referral_reason:
        referralReason,

      clinical_summary:
        getValue("clinicalSummary"),

      referral_diagnosis:
        getValue("referralDiagnosis"),

      patient_condition:
        getValue("patientCondition"),

      referral_number:
        getValue("referralNumber"),

      referral_status:
        getValue("referralStatus") || "PLANNED",

      referred_at:
        referredAt || new Date().toISOString()

    };


    // --------------------------------------------------------
    // UPDATE RUJUKAN
    // --------------------------------------------------------

    if (editingReferralId) {

      referralData.updated_by =
        userId;


      const {
        data,
        error
      } = await sb
        .from("clinical_referrals")
        .update(referralData)
        .eq("id", editingReferralId)
        .eq("encounter_id", currentEncounter.id)
        .select()
        .single();


      if (error) {
        throw error;
      }


      setMessage(
        "Rujukan berhasil diperbarui."
      );


      await loadReferrals(
        currentEncounter.id
      );


      return;

    }


    // --------------------------------------------------------
    // INSERT RUJUKAN BARU
    // --------------------------------------------------------

    referralData.referred_by =
      userId;

    referralData.created_by =
      userId;


    const {
      data,
      error
    } = await sb
      .from("clinical_referrals")
      .insert(referralData)
      .select()
      .single();


    if (error) {
      throw error;
    }


    currentReferrals = [
      data,
      ...currentReferrals
    ];


    editingReferralId = null;


    clearReferralForm();

    renderReferralTable();


    updateReferralInfo(
      `${currentReferrals.length} rujukan tersimpan.`
    );


    setMessage(
      "Rujukan berhasil ditambahkan."
    );

  } catch (error) {

    console.error(error);

    setMessage(
      "Rujukan gagal disimpan: " +
      (error.message || "kesalahan tidak diketahui"),
      true
    );

  } finally {

    if (button) {
      button.disabled = false;
    }

  }

}


// ============================================================
// RUJUKAN — EDIT
// ============================================================

function editReferral(
  id
) {

  if (!currentEncounter) {

    setMessage(
      "Belum ada Encounter aktif.",
      true
    );

    return;

  }


  if (
    currentEncounter.status !==
    "IN_PROGRESS"
  ) {

    setMessage(
      "Rujukan tidak dapat diubah karena Encounter sudah tidak IN_PROGRESS.",
      true
    );

    return;

  }


  const item =
    currentReferrals.find(
      referral => referral.id === id
    );


  if (!item) {

    setMessage(
      "Data Rujukan tidak ditemukan.",
      true
    );

    return;

  }


  editingReferralId =
    item.id;


  setInputValue(
    "referredAt",
    toDateTimeLocal(item.referred_at)
  );

  setInputValue(
    "referralType",
    item.referral_type
  );

  setInputValue(
    "destinationFacilityName",
    item.destination_facility_name
  );

  setInputValue(
    "destinationFacilityCode",
    item.destination_facility_code
  );

  setInputValue(
    "referralReason",
    item.referral_reason
  );

  setInputValue(
    "clinicalSummary",
    item.clinical_summary
  );

  setInputValue(
    "referralDiagnosis",
    item.referral_diagnosis
  );

  setInputValue(
    "patientCondition",
    item.patient_condition
  );

  setInputValue(
    "referralNumber",
    item.referral_number
  );

  setInputValue(
    "referralStatus",
    item.referral_status || "PLANNED"
  );


  const saveButton =
    document.getElementById(
      "saveReferralBtn"
    );

  const cancelButton =
    document.getElementById(
      "cancelReferralEditBtn"
    );


  if (saveButton) {

    saveButton.textContent =
      "Simpan Perubahan";

  }


  if (cancelButton) {

    cancelButton.style.display =
      "inline-block";

  }


  updateReferralInfo(
    `Sedang mengubah rujukan ke ${item.destination_facility_name}.`
  );


  const typeInput =
    document.getElementById(
      "referralType"
    );


  if (typeInput) {

    typeInput.focus();

  }

}


// ============================================================
// RUJUKAN — CANCEL EDIT
// ============================================================

function cancelReferralEdit() {

  editingReferralId = null;

  clearReferralForm();


  updateReferralInfo(
    currentReferrals.length
      ? `${currentReferrals.length} rujukan tersimpan.`
      : "Belum ada rujukan tersimpan."
  );

}


// ============================================================
// RUJUKAN — RENDER TABLE
// ============================================================

function renderReferralTable() {

  const table =
    document.getElementById(
      "referralTable"
    );


  if (!table) {
    return;
  }


  if (
    !currentReferrals ||
    currentReferrals.length === 0
  ) {

    table.innerHTML = `
      <tr>
        <td colspan="9" class="muted">
          Belum ada rujukan tersimpan.
        </td>
      </tr>
    `;

    return;

  }


  table.innerHTML = "";


  currentReferrals.forEach(
    referral => {

      const row =
        document.createElement("tr");


      row.innerHTML = `

        <td>
          ${escapeHtml(
            formatDateTime(
              referral.referred_at
            )
          )}
        </td>

        <td>
          ${escapeHtml(
            referral.referral_type || "-"
          )}
        </td>

        <td style="white-space:pre-wrap">
          ${escapeHtml(
            referral.destination_facility_name || "-"
          )}
          ${
            referral.destination_facility_code
              ? `<br><small class="muted">Kode: ${escapeHtml(
                  referral.destination_facility_code
                )}</small>`
              : ""
          }
        </td>

        <td style="white-space:pre-wrap">
          ${escapeHtml(
            referral.referral_reason || "-"
          )}
        </td>

        <td style="white-space:pre-wrap">
          ${escapeHtml(
            referral.referral_diagnosis || "-"
          )}
        </td>

        <td>
          ${escapeHtml(
            referral.referral_number || "-"
          )}
        </td>

        <td>
          ${escapeHtml(
            referral.referral_status || "-"
          )}
        </td>

        <td>
          ${escapeHtml(
            referral.updated_at
              ? formatDateTime(
                  referral.updated_at
                )
              : formatDateTime(
                  referral.created_at
                )
          )}
        </td>

        <td>

          <button
            type="button"
            class="edit-referral"
          >
            Ubah
          </button>

        </td>

      `;


      const editButton =
        row.querySelector(
          ".edit-referral"
        );


      if (editButton) {

        editButton.addEventListener(
          "click",
          () => {

            editReferral(
              referral.id
            );

          }
        );

      }


      table.appendChild(row);

    }
  );

}


// ============================================================
// RUJUKAN — CLEAR FORM
// ============================================================

function clearReferralForm() {

  const fields = [

    "destinationFacilityName",
    "destinationFacilityCode",
    "referralReason",
    "clinicalSummary",
    "referralDiagnosis",
    "patientCondition",
    "referralNumber"

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


  const referralType =
    document.getElementById(
      "referralType"
    );


  if (referralType) {
    referralType.value = "";
  }


  const referralStatus =
    document.getElementById(
      "referralStatus"
    );


  if (referralStatus) {
    referralStatus.value = "PLANNED";
  }


  editingReferralId = null;


  setDefaultReferredAt();


  const saveButton =
    document.getElementById(
      "saveReferralBtn"
    );


  const cancelButton =
    document.getElementById(
      "cancelReferralEditBtn"
    );


  if (saveButton) {

    saveButton.textContent =
      "Tambah Rujukan";

  }


  if (cancelButton) {

    cancelButton.style.display =
      "none";

  }

}


// ============================================================
// RUJUKAN — DEFAULT WAKTU
// ============================================================

function setDefaultReferredAt() {

  const element =
    document.getElementById(
      "referredAt"
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
// RUJUKAN — INFO
// ============================================================

function updateReferralInfo(
  message
) {

  const element =
    document.getElementById(
      "referralInfo"
    );


  if (element) {

    element.textContent =
      message;

  }

}


// ============================================================
// CLEAR PEMERIKSAAN FISIK FORM
// ============================================================

function clearPhysicalExamForm() {

  const fields = [

    "bodySystem",
    "bodyRegion",
    "physicalFinding",
    "normalAbnormal",
    "physicalAdditionalNotes"

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


  setDefaultExaminedAt();


  editingPhysicalExamId = null;


  const saveButton =
    document.getElementById(
      "savePhysicalExamBtn"
    );


  const cancelButton =
    document.getElementById(
      "cancelPhysicalExamEditBtn"
    );


  if (saveButton) {

    saveButton.textContent =
      "Tambah Temuan";

  }


  if (cancelButton) {

    cancelButton.style.display =
      "none";

  }

}


// ============================================================
// DEFAULT WAKTU PEMERIKSAAN
// ============================================================

function setDefaultExaminedAt() {

  const element =
    document.getElementById(
      "examinedAt"
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
// LABEL SISTEM TUBUH
// ============================================================

function getPhysicalSystemLabel(
  value
) {

  const labels = {

    GENERAL:
      "Umum",

    HEAD_NECK:
      "Kepala & Leher",

    EYE:
      "Mata",

    ENT:
      "THT",

    RESPIRATORY:
      "Respirasi",

    CARDIOVASCULAR:
      "Kardiovaskular",

    ABDOMEN:
      "Abdomen",

    GENITOURINARY:
      "Genitourinaria",

    MUSCULOSKELETAL:
      "Muskuloskeletal",

    NEUROLOGICAL:
      "Neurologis",

    SKIN:
      "Kulit",

    EXTREMITIES:
      "Ekstremitas",

    OTHER:
      "Lainnya"

  };


  return labels[value] || value || "-";

}


// ============================================================
// LABEL STATUS PEMERIKSAAN
// ============================================================

function getPhysicalStatusLabel(
  value
) {

  if (
    value === "NORMAL"
  ) {

    return "Normal";

  }


  if (
    value === "ABNORMAL"
  ) {

    return "Abnormal";

  }


  return value || "-";

}


// ============================================================
// UPDATE INFO PEMERIKSAAN FISIK
// ============================================================

function updatePhysicalExamInfo(
  message
) {

  const element =
    document.getElementById(
      "physicalExamInfo"
    );


  if (element) {

    element.textContent =
      message;

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
