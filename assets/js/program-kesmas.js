let currentProfile = null;

let programs = [];
let activities = [];
let indicators = [];
let activityRecords = [];

let selectedProgram = null;
let selectedActivity = null;
let selectedIndicator = null;

let editingRecordId = null;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();

  setDefaultActivityDate();
  clearRecordForm();

  const profile = await loadMyProfile();

  if (!profile) {
    return;
  }

  currentProfile = profile;

  await loadPrograms();
});


/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents() {

  const reloadProgramsBtn =
    document.getElementById("reloadProgramsBtn");

  if (reloadProgramsBtn) {
    reloadProgramsBtn.addEventListener(
      "click",
      loadPrograms
    );
  }


  const backToProgramsBtn =
    document.getElementById("backToProgramsBtn");

  if (backToProgramsBtn) {
    backToProgramsBtn.addEventListener(
      "click",
      showProgramSection
    );
  }


  const backToActivitiesBtn =
    document.getElementById("backToActivitiesBtn");

  if (backToActivitiesBtn) {
    backToActivitiesBtn.addEventListener(
      "click",
      showActivitySection
    );
  }


  const reloadRecordsBtn =
    document.getElementById("reloadRecordsBtn");

  if (reloadRecordsBtn) {
    reloadRecordsBtn.addEventListener(
      "click",
      async () => {

        if (!selectedActivity) {
          return;
        }

        await loadActivityRecords(
          selectedActivity.id
        );
      }
    );
  }


  const activityRecordForm =
    document.getElementById("activityRecordForm");

  if (activityRecordForm) {
    activityRecordForm.addEventListener(
      "submit",
      saveActivityRecord
    );
  }


  const cancelRecordEditBtn =
    document.getElementById("cancelRecordEditBtn");

  if (cancelRecordEditBtn) {
    cancelRecordEditBtn.addEventListener(
      "click",
      clearRecordForm
    );
  }
}


/* =========================================================
   AUTH / PROFILE
   ========================================================= */

async function loadMyProfile() {

  const session =
    await requireSession();

  if (!session) {
    return null;
  }

  const {
    data,
    error
  } = await sb
    .from("security_user_profiles")
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

    console.error(
      "Gagal memuat profil:",
      error
    );

    await sb.auth.signOut();

    window.location.href =
      "../index.html";

    return null;
  }

  if (data.status !== "ACTIVE") {

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
   PROGRAM
   ========================================================= */

async function loadPrograms() {

  setProgramInfo(
    "Memuat program..."
  );

  const {
    data,
    error
  } = await sb
    .from("program_kesmas_programs")
    .select(`
      id,
      cluster_id,
      code,
      name,
      description,
      display_order,
      is_active
    `)
    .eq(
      "is_active",
      true
    )
    .order(
      "display_order",
      {
        ascending: true
      }
    );


  if (error) {

    console.error(
      "Gagal memuat program:",
      error
    );

    setProgramInfo(
      "Program gagal dimuat."
    );

    showPageMessage(
      "Terjadi kesalahan saat memuat program kesehatan masyarakat."
    );

    return;
  }


  programs = data || [];

  renderPrograms();

  setProgramInfo(
    programs.length
      ? `${programs.length} program aktif tersedia.`
      : "Belum ada program aktif."
  );

  showProgramSection();
}


/* =========================================================
   RENDER PROGRAM
   ========================================================= */

function renderPrograms() {

  const container =
    document.getElementById(
      "programContainer"
    );

  if (!container) {
    return;
  }

  if (!programs.length) {

    container.innerHTML = `
      <div class="muted">
        Belum ada program kesehatan masyarakat yang aktif.
      </div>
    `;

    return;
  }


  container.innerHTML =
    programs.map(
      program => {

        return `
          <button
            type="button"
            class="card"
            style="
              text-align:left;
              cursor:pointer;
              width:100%;
              border:1px solid #e5e7eb;
              background:#f8fafc;
              padding:16px;
            "
            data-program-id="${escapeHtml(program.id)}"
            onclick="selectProgram('${escapeJs(program.id)}')"
          >

            <strong>
              ${escapeHtml(program.name)}
            </strong>

            <div
              class="muted"
              style="margin-top:6px"
            >
              ${escapeHtml(program.code)}
            </div>

            <div
              style="
                margin-top:10px;
                color:#6b7280;
              "
            >
              ${escapeHtml(
                program.description ||
                "Tidak ada deskripsi."
              )}
            </div>

          </button>
        `;
      }
    ).join("");
}


/* =========================================================
   SELECT PROGRAM
   ========================================================= */

async function selectProgram(
  programId
) {

  const program =
    programs.find(
      item =>
        item.id === programId
    );

  if (!program) {
    return;
  }

  selectedProgram = program;
  selectedActivity = null;
  selectedIndicator = null;

  activities = [];
  indicators = [];
  activityRecords = [];

  clearRecordForm();

  const title =
    document.getElementById(
      "selectedProgramTitle"
    );

  const description =
    document.getElementById(
      "selectedProgramDescription"
    );

  if (title) {
    title.textContent =
      program.name;
  }

  if (description) {
    description.textContent =
      program.description ||
      "";
  }

  showActivitySection();

  await loadActivities(
    program.id
  );
}


/* =========================================================
   ACTIVITIES
   ========================================================= */

async function loadActivities(
  programId
) {

  setActivityInfo(
    "Memuat kegiatan..."
  );

  const {
    data,
    error
  } = await sb
    .from("program_kesmas_activities")
    .select(`
      id,
      program_id,
      unit_id,
      code,
      name,
      description,
      display_order,
      is_active
    `)
    .eq(
      "program_id",
      programId
    )
    .eq(
      "is_active",
      true
    )
    .order(
      "display_order",
      {
        ascending: true
      }
    );


  if (error) {

    console.error(
      "Gagal memuat kegiatan:",
      error
    );

    setActivityInfo(
      "Kegiatan gagal dimuat."
    );

    return;
  }


  activities =
    data || [];

  renderActivities();

  setActivityInfo(
    activities.length
      ? `${activities.length} kegiatan tersedia.`
      : "Belum ada kegiatan aktif."
  );
}


/* =========================================================
   RENDER ACTIVITIES
   ========================================================= */

function renderActivities() {

  const container =
    document.getElementById(
      "activityContainer"
    );

  if (!container) {
    return;
  }


  if (!activities.length) {

    container.innerHTML = `
      <div class="muted">
        Belum ada kegiatan aktif untuk program ini.
      </div>
    `;

    return;
  }


  container.innerHTML =
    activities.map(
      activity => {

        return `
          <button
            type="button"
            class="card"
            style="
              text-align:left;
              cursor:pointer;
              width:100%;
              border:1px solid #e5e7eb;
              background:#f8fafc;
              padding:16px;
            "
            onclick="selectActivity('${escapeJs(activity.id)}')"
          >

            <strong>
              ${escapeHtml(activity.name)}
            </strong>

            <div
              class="muted"
              style="margin-top:6px"
            >
              ${escapeHtml(activity.code)}
            </div>

            <div
              style="
                margin-top:10px;
                color:#6b7280;
              "
            >
              ${escapeHtml(
                activity.description ||
                "Tidak ada deskripsi."
              )}
            </div>

          </button>
        `;
      }
    ).join("");
}


/* =========================================================
   SELECT ACTIVITY
   ========================================================= */

async function selectActivity(
  activityId
) {

  const activity =
    activities.find(
      item =>
        item.id === activityId
    );

  if (!activity) {
    return;
  }


  selectedActivity =
    activity;

  selectedIndicator = null;

  indicators = [];

  const title =
    document.getElementById(
      "selectedActivityTitle"
    );

  const description =
    document.getElementById(
      "selectedActivityDescription"
    );

  if (title) {
    title.textContent =
      activity.name;
  }

  if (description) {
    description.textContent =
      activity.description ||
      "";
  }


  const recordContext =
    document.getElementById(
      "recordContext"
    );

  if (recordContext) {

    recordContext.textContent =
      `${selectedProgram?.name || ""} — ${activity.name}`;
  }


  showIndicatorSection();

  await loadIndicators(
    activity.id
  );

  await loadActivityRecords(
    activity.id
  );
}


/* =========================================================
   INDICATORS
   ========================================================= */

async function loadIndicators(
  activityId
) {

  setIndicatorInfo(
    "Memuat indikator..."
  );

  const {
    data,
    error
  } = await sb
    .from("program_kesmas_indicators")
    .select(`
      id,
      program_id,
      activity_id,
      code,
      name,
      description,
      unit,
      target_value,
      display_order,
      is_active
    `)
    .eq(
      "activity_id",
      activityId
    )
    .eq(
      "is_active",
      true
    )
    .order(
      "display_order",
      {
        ascending: true
      }
    );


  if (error) {

    console.error(
      "Gagal memuat indikator:",
      error
    );

    setIndicatorInfo(
      "Indikator gagal dimuat."
    );

    return;
  }


  indicators =
    data || [];

  renderIndicators();

  setIndicatorInfo(
    indicators.length
      ? `${indicators.length} indikator tersedia.`
      : "Belum ada indikator aktif."
  );
}


/* =========================================================
   RENDER INDICATORS
   ========================================================= */

function renderIndicators() {

  const tbody =
    document.getElementById(
      "indicatorTableBody"
    );

  if (!tbody) {
    return;
  }


  if (!indicators.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="5"
          class="muted"
          style="padding:12px"
        >
          Belum ada indikator.
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    indicators.map(
      indicator => {

        const target =
          indicator.target_value === null ||
          indicator.target_value === undefined
            ? "Belum ditetapkan"
            : escapeHtml(
                String(
                  indicator.target_value
                )
              );

        return `
          <tr>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
              "
            >
              ${escapeHtml(indicator.code)}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
              "
            >

              <strong>
                ${escapeHtml(indicator.name)}
              </strong>

              ${
                indicator.description
                  ? `
                    <div
                      class="muted"
                      style="margin-top:4px"
                    >
                      ${escapeHtml(
                        indicator.description
                      )}
                    </div>
                  `
                  : ""
              }

            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
              "
            >
              ${escapeHtml(
                indicator.unit || "-"
              )}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
              "
            >
              ${target}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
              "
            >

              <button
                type="button"
                onclick="selectIndicator('${escapeJs(indicator.id)}')"
              >
                Pilih
              </button>

            </td>

          </tr>
        `;
      }
    ).join("");
}


/* =========================================================
   SELECT INDICATOR
   ========================================================= */

function selectIndicator(
  indicatorId
) {

  const indicator =
    indicators.find(
      item =>
        item.id === indicatorId
    );

  if (!indicator) {
    return;
  }


  selectedIndicator =
    indicator;


  const recordContext =
    document.getElementById(
      "recordContext"
    );

  if (recordContext) {

    recordContext.textContent =
      `${selectedProgram?.name || ""} — ` +
      `${selectedActivity?.name || ""} — ` +
      `${indicator.name}`;
  }


  showRecordSection();

  setRecordInfo(
    `Indikator aktif: ${indicator.name}`
  );
}


/* =========================================================
   ACTIVITY RECORDS
   ========================================================= */

async function loadActivityRecords(
  activityId
) {

  setRecordInfo(
    "Memuat pencatatan kegiatan..."
  );


  const {
    data,
    error
  } = await sb
    .from("program_kesmas_activity_records")
    .select(`
      id,
      activity_id,
      unit_id,
      activity_date,
      location,
      target_group,
      target_count,
      participant_count,
      result_summary,
      notes,
      status,
      conducted_by,
      created_by,
      updated_by,
      created_at,
      updated_at
    `)
    .eq(
      "activity_id",
      activityId
    )
    .order(
      "activity_date",
      {
        ascending: false
      }
    )
    .order(
      "created_at",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      "Gagal memuat pencatatan:",
      error
    );

    setRecordInfo(
      "Pencatatan kegiatan gagal dimuat."
    );

    return;
  }


  activityRecords =
    data || [];

  renderActivityRecords();

  setRecordInfo(
    `${activityRecords.length} pencatatan kegiatan ditemukan.`
  );
}


/* =========================================================
   RENDER RECORDS
   ========================================================= */

function renderActivityRecords() {

  const tbody =
    document.getElementById(
      "recordTableBody"
    );

  if (!tbody) {
    return;
  }


  if (!activityRecords.length) {

    tbody.innerHTML = `
      <tr>
        <td
          colspan="7"
          class="muted"
          style="padding:12px"
        >
          Belum ada pencatatan kegiatan.
        </td>
      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    activityRecords.map(
      record => {

        return `
          <tr>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
              "
            >
              ${escapeHtml(
                formatDate(
                  record.activity_date
                )
              )}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
              "
            >
              ${escapeHtml(
                record.location || "-"
              )}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
              "
            >
              ${escapeHtml(
                record.target_group || "-"
              )}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
              "
            >
              ${escapeHtml(
                formatNumber(
                  record.target_count
                )
              )}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
              "
            >
              ${escapeHtml(
                formatNumber(
                  record.participant_count
                )
              )}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
              "
            >
              ${escapeHtml(
                formatStatus(
                  record.status
                )
              )}
            </td>

            <td
              style="
                padding:10px;
                border-bottom:1px solid #e5e7eb;
              "
            >

              <button
                type="button"
                onclick="editActivityRecord('${escapeJs(record.id)}')"
              >
                Edit
              </button>

            </td>

          </tr>
        `;
      }
    ).join("");
}


/* =========================================================
   SAVE RECORD
   ========================================================= */

async function saveActivityRecord(
  event
) {

  event.preventDefault();


  if (!selectedActivity) {

    setRecordInfo(
      "Pilih kegiatan terlebih dahulu."
    );

    return;
  }


  if (!currentProfile?.session?.user?.id) {

    setRecordInfo(
      "Sesi pengguna tidak tersedia."
    );

    return;
  }


  const activityDate =
    getValue("activityDate");

  const location =
    getValue("activityLocation");

  const targetGroup =
    getValue("targetGroup");

  const targetCount =
    getNumericValue("targetCount");

  const participantCount =
    getNumericValue("participantCount");

  const resultSummary =
    getValue("resultSummary");

  const notes =
    getValue("recordNotes");

  const status =
    getValue("recordStatus");


  if (!activityDate) {

    setRecordInfo(
      "Tanggal kegiatan wajib diisi."
    );

    return;
  }


  if (
    targetCount !== null &&
    targetCount < 0
  ) {

    setRecordInfo(
      "Jumlah target tidak boleh negatif."
    );

    return;
  }


  if (
    participantCount !== null &&
    participantCount < 0
  ) {

    setRecordInfo(
      "Jumlah peserta tidak boleh negatif."
    );

    return;
  }


  if (
    targetCount !== null &&
    participantCount !== null &&
    participantCount > targetCount
  ) {

    setRecordInfo(
      "Jumlah peserta tidak boleh melebihi jumlah target."
    );

    return;
  }


  const payload = {

    activity_id:
      selectedActivity.id,

    unit_id:
      selectedActivity.unit_id,

    activity_date:
      activityDate,

    location:
      location || null,

    target_group:
      targetGroup || null,

    target_count:
      targetCount,

    participant_count:
      participantCount,

    result_summary:
      resultSummary || null,

    notes:
      notes || null,

    status:
      status || "PLANNED"
  };


  let result;


  if (editingRecordId) {

    result =
      await sb
        .from(
          "program_kesmas_activity_records"
        )
        .update({

          ...payload,

          updated_by:
            currentProfile.session.user.id

        })
        .eq(
          "id",
          editingRecordId
        )
        .eq(
          "activity_id",
          selectedActivity.id
        )
        .select()
        .single();

  } else {

    result =
      await sb
        .from(
          "program_kesmas_activity_records"
        )
        .insert({

          ...payload,

          conducted_by:
            currentProfile.session.user.id,

          created_by:
            currentProfile.session.user.id

        })
        .select()
        .single();
  }


  if (result.error) {

    console.error(
      "Gagal menyimpan kegiatan:",
      result.error
    );

    setRecordInfo(
      `Gagal menyimpan: ${result.error.message}`
    );

    return;
  }


  setRecordInfo(
    editingRecordId
      ? "Pencatatan kegiatan berhasil diperbarui."
      : "Pencatatan kegiatan berhasil disimpan."
  );


  clearRecordForm();


  await loadActivityRecords(
    selectedActivity.id
  );
}


/* =========================================================
   EDIT RECORD
   ========================================================= */

function editActivityRecord(
  recordId
) {

  const record =
    activityRecords.find(
      item =>
        item.id === recordId
    );

  if (!record) {
    return;
  }


  editingRecordId =
    record.id;


  setValue(
    "recordId",
    record.id
  );

  setValue(
    "activityDate",
    record.activity_date
  );

  setValue(
    "activityLocation",
    record.location
  );

  setValue(
    "targetGroup",
    record.target_group
  );

  setValue(
    "targetCount",
    record.target_count
  );

  setValue(
    "participantCount",
    record.participant_count
  );

  setValue(
    "resultSummary",
    record.result_summary
  );

  setValue(
    "recordNotes",
    record.notes
  );

  setValue(
    "recordStatus",
    record.status
  );


  const button =
    document.getElementById(
      "saveRecordBtn"
    );

  if (button) {
    button.textContent =
      "Simpan Perubahan";
  }


  showRecordSection();

  setRecordInfo(
    "Mode edit pencatatan kegiatan aktif."
  );


  const form =
    document.getElementById(
      "activityRecordForm"
    );

  if (form) {

    form.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });

  }
}


/* =========================================================
   CLEAR FORM
   ========================================================= */

function clearRecordForm() {

  editingRecordId = null;


  const form =
    document.getElementById(
      "activityRecordForm"
    );

  if (form) {
    form.reset();
  }


  setValue(
    "recordId",
    ""
  );


  setDefaultActivityDate();


  setValue(
    "recordStatus",
    "PLANNED"
  );


  const button =
    document.getElementById(
      "saveRecordBtn"
    );

  if (button) {
    button.textContent =
      "Simpan Kegiatan";
  }
}


/* =========================================================
   NAVIGATION / SECTIONS
   ========================================================= */

function showProgramSection() {

  setHidden(
    "activitySection",
    true
  );

  setHidden(
    "indicatorSection",
    true
  );

  setHidden(
    "recordSection",
    true
  );
}


function showActivitySection() {

  setHidden(
    "activitySection",
    false
  );

  setHidden(
    "indicatorSection",
    true
  );

  setHidden(
    "recordSection",
    true
  );
}


function showIndicatorSection() {

  setHidden(
    "activitySection",
    false
  );

  setHidden(
    "indicatorSection",
    false
  );

  setHidden(
    "recordSection",
    false
  );
}


function showRecordSection() {

  setHidden(
    "activitySection",
    false
  );

  setHidden(
    "indicatorSection",
    false
  );

  setHidden(
    "recordSection",
    false
  );
}


/* =========================================================
   INFO / STATUS
   ========================================================= */

function setProgramInfo(
  message
) {

  const element =
    document.getElementById(
      "programInfo"
    );

  if (element) {
    element.textContent =
      message || "";
  }
}


function setActivityInfo(
  message
) {

  const element =
    document.getElementById(
      "activityInfo"
    );

  if (element) {
    element.textContent =
      message || "";
  }
}


function setIndicatorInfo(
  message
) {

  const element =
    document.getElementById(
      "indicatorInfo"
    );

  if (element) {
    element.textContent =
      message || "";
  }
}


function setRecordInfo(
  message
) {

  const element =
    document.getElementById(
      "recordInfo"
    );

  if (element) {
    element.textContent =
      message || "";
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

  if (text) {
    text.textContent =
      message || "";
  }

  if (section) {
    section.hidden = false;
  }
}


/* =========================================================
   FORM HELPERS
   ========================================================= */

function getValue(
  id
) {

  const element =
    document.getElementById(id);

  return element
    ? String(element.value || "").trim()
    : "";
}


function setValue(
  id,
  value
) {

  const element =
    document.getElementById(id);

  if (!element) {
    return;
  }

  element.value =
    value === null ||
    value === undefined
      ? ""
      : value;
}


function getNumericValue(
  id
) {

  const value =
    getValue(id);

  if (value === "") {
    return null;
  }

  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return null;
  }

  return number;
}


function setDefaultActivityDate() {

  const input =
    document.getElementById(
      "activityDate"
    );

  if (!input) {
    return;
  }

  if (!input.value) {

    const now =
      new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(
        2,
        "0"
      );

    const day =
      String(
        now.getDate()
      ).padStart(
        2,
        "0"
      );

    input.value =
      `${year}-${month}-${day}`;
  }
}


/* =========================================================
   DISPLAY HELPERS
   ========================================================= */

function formatDate(
  value
) {

  if (!value) {
    return "-";
  }

  const date =
    new Date(
      `${value}T00:00:00`
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


function formatNumber(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return String(value);
  }

  return number.toLocaleString(
    "id-ID"
  );
}


function formatStatus(
  status
) {

  const map = {

    PLANNED:
      "Direncanakan",

    ONGOING:
      "Berlangsung",

    COMPLETED:
      "Selesai",

    CANCELLED:
      "Dibatalkan"
  };

  return (
    map[status] ||
    status ||
    "-"
  );
}


/* =========================================================
   SECURITY / HTML ESCAPING
   ========================================================= */

function escapeHtml(
  value
) {

  return String(
    value === null ||
    value === undefined
      ? ""
      : value
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


function escapeJs(
  value
) {

  return String(
    value === null ||
    value === undefined
      ? ""
      : value
  )
    .replace(
      /\\/g,
      "\\\\"
    )
    .replace(
      /'/g,
      "\\'"
    )
    .replace(
      /"/g,
      '\\"'
    )
    .replace(
      /\r/g,
      "\\r"
    )
    .replace(
      /\n/g,
      "\\n"
    );
}


/* =========================================================
   DOM HELPERS
   ========================================================= */

function setHidden(
  id,
  hidden
) {

  const element =
    document.getElementById(id);

  if (element) {
    element.hidden =
      hidden;
  }
}
