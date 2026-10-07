// SIMPUS MERITAI — Fresh Start V2
// Modul Pendaftaran

let selectedPatient = null;

document.addEventListener("DOMContentLoaded", async () => {
  const session = await requireSession();

  if (!session) {
    return;
  }

  bindEvents();

  await loadPayers();
  await loadServiceUnits();
});


function bindEvents() {

  document
    .getElementById("btnSearchPatient")
    .addEventListener("click", searchPatients);


  document
    .getElementById("patientSearch")
    .addEventListener("keydown", event => {

      if (event.key === "Enter") {

        event.preventDefault();

        searchPatients();
      }

    });


  document
    .getElementById("btnChangePatient")
    .addEventListener("click", resetSelectedPatient);


  document
    .getElementById("registrationForm")
    .addEventListener("submit", saveRegistration);


  document
    .getElementById("btnResetRegistration")
    .addEventListener("click", resetRegistration);


  document
    .getElementById("btnLoadToday")
    .addEventListener("click", loadTodayRegistrations);

}


/* =========================================================
   CARI PASIEN
   ========================================================= */

async function searchPatients() {

  const input =
    document.getElementById("patientSearch");

  const message =
    document.getElementById("patientSearchMessage");

  const result =
    document.getElementById("patientSearchResults");

  const term =
    input.value.trim();


  if (term.length < 2) {

    message.textContent =
      "Masukkan minimal 2 karakter.";

    result.innerHTML =
      '<p class="muted">Pencarian belum dilakukan.</p>';

    return;
  }


  message.textContent =
    "Mencari pasien...";

  result.innerHTML =
    '<p class="muted">Memuat data...</p>';


  const safeTerm =
    term.replace(/[%(),]/g, " ").trim();


  const { data, error } =
    await sb
      .from("patients")
      .select(`
        id,
        medical_record_number,
        full_name,
        national_id,
        date_of_birth,
        sex,
        phone,
        status
      `)
      .or(
        `full_name.ilike.%${safeTerm}%,medical_record_number.ilike.%${safeTerm}%,national_id.ilike.%${safeTerm}%,phone.ilike.%${safeTerm}%`
      )
      .order("full_name", {
        ascending: true
      })
      .limit(30);


  if (error) {

    console.error(error);

    message.textContent =
      "Gagal mencari pasien.";

    result.innerHTML =
      `<p class="error">${escapeHtml(error.message)}</p>`;

    return;
  }


  message.textContent =
    `${data.length} pasien ditemukan.`;


  if (!data.length) {

    result.innerHTML =
      '<p class="muted">Pasien tidak ditemukan.</p>';

    return;
  }


  result.innerHTML =
    data.map(patient => patientSearchRow(patient)).join("");


  result
    .querySelectorAll("[data-select-patient]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const patientId =
          button.getAttribute(
            "data-select-patient"
          );

        selectPatient(patientId);

      });

    });

}


/* =========================================================
   BARIS HASIL PASIEN
   ========================================================= */

function patientSearchRow(patient) {

  return `
    <div
      style="
        padding:14px 0;
        border-bottom:1px solid #e5e7eb;
      "
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:12px;
          align-items:flex-start;
          flex-wrap:wrap;
        "
      >

        <div>

          <strong>
            ${escapeHtml(patient.full_name)}
          </strong>

          <div class="muted">
            No. RM:
            ${escapeHtml(patient.medical_record_number)}
          </div>

          <div class="muted">
            NIK:
            ${escapeHtml(patient.national_id || "-")}
          </div>

          <div class="muted">
            Tgl. Lahir:
            ${formatDate(patient.date_of_birth)}
          </div>

          <div class="muted">
            No. HP:
            ${escapeHtml(patient.phone || "-")}
          </div>

        </div>


        <div>

          <span>
            ${escapeHtml(patient.status || "-")}
          </span>

          <br>

          <button
            type="button"
            data-select-patient="${patient.id}"
            style="max-width:160px"
          >
            Pilih Pasien
          </button>

        </div>

      </div>

    </div>
  `;
}


/* =========================================================
   PILIH PASIEN
   ========================================================= */

async function selectPatient(patientId) {

  const { data, error } =
    await sb
      .from("patients")
      .select(`
        id,
        medical_record_number,
        full_name,
        national_id,
        date_of_birth,
        sex,
        phone,
        status
      `)
      .eq("id", patientId)
      .single();


  if (error) {

    console.error(error);

    alert(
      "Data pasien gagal dimuat: " +
      error.message
    );

    return;
  }


  selectedPatient = data;


  document.getElementById(
    "selectedPatientCard"
  ).style.display = "block";


  document.getElementById(
    "registrationCard"
  ).style.display = "block";


  document.getElementById(
    "selectedPatient"
  ).innerHTML = `

    <div class="grid">

      <div>
        <strong>Nama Lengkap</strong>
        <div>
          ${escapeHtml(data.full_name)}
        </div>
      </div>

      <div>
        <strong>No. Rekam Medis</strong>
        <div>
          ${escapeHtml(data.medical_record_number)}
        </div>
      </div>

      <div>
        <strong>NIK</strong>
        <div>
          ${escapeHtml(data.national_id || "-")}
        </div>
      </div>

      <div>
        <strong>Tanggal Lahir</strong>
        <div>
          ${formatDate(data.date_of_birth)}
        </div>
      </div>

      <div>
        <strong>Jenis Kelamin</strong>
        <div>
          ${formatSex(data.sex)}
        </div>
      </div>

      <div>
        <strong>No. HP</strong>
        <div>
          ${escapeHtml(data.phone || "-")}
        </div>
      </div>

    </div>

  `;


  document.getElementById(
    "patientSearchResults"
  ).innerHTML =
    '<p class="muted">Pasien sudah dipilih.</p>';


  document.getElementById(
    "patientSearchMessage"
  ).textContent =
    "Pasien berhasil dipilih.";


  window.scrollTo({
    top:
      document.getElementById(
        "registrationCard"
      ).offsetTop - 20,
    behavior: "smooth"
  });

}


/* =========================================================
   LOAD PENJAMIN
   ========================================================= */

async function loadPayers() {

  const select =
    document.getElementById("payer");


  const { data, error } =
    await sb
      .from("payers")
      .select(`
        id,
        code,
        name
      `)
      .eq("is_active", true)
      .order("name", {
        ascending: true
      });


  if (error) {

    console.error(error);

    select.innerHTML =
      '<option value="">Gagal memuat penjamin</option>';

    return;
  }


  select.innerHTML =
    '<option value="">-- Pilih Penjamin --</option>';


  data.forEach(payer => {

    const option =
      document.createElement("option");

    option.value =
      payer.id;

    option.textContent =
      `${payer.name} (${payer.code})`;

    select.appendChild(option);

  });

}


/* =========================================================
   LOAD UNIT PELAYANAN
   ========================================================= */

async function loadServiceUnits() {

  const select =
    document.getElementById("serviceUnit");


  const { data, error } =
    await sb
      .from("units")
      .select(`
        id,
        code,
        name
      `)
      .eq("is_active", true)
      .order("name", {
        ascending: true
      });


  if (error) {

    console.error(error);

    select.innerHTML =
      '<option value="">Gagal memuat unit pelayanan</option>';

    return;
  }


  select.innerHTML =
    '<option value="">-- Pilih Unit Pelayanan --</option>';


  data.forEach(unit => {

    const option =
      document.createElement("option");

    option.value =
      unit.id;

    option.textContent =
      `${unit.name} (${unit.code})`;

    select.appendChild(option);

  });

}


/* =========================================================
   SIMPAN PENDAFTARAN
   ========================================================= */

async function saveRegistration(event) {

  event.preventDefault();


  const message =
    document.getElementById(
      "registrationMessage"
    );


  const button =
    document.getElementById(
      "btnSaveRegistration"
    );


  if (!selectedPatient) {

    message.textContent =
      "Pilih pasien terlebih dahulu.";

    return;
  }


  const payerId =
    document.getElementById(
      "payer"
    ).value || null;


  const serviceUnitId =
    document.getElementById(
      "serviceUnit"
    ).value;


  const visitType =
    document.getElementById(
      "visitType"
    ).value;


  const chiefComplaint =
    valueOrNull(
      "chiefComplaint"
    );


  const referralSource =
    valueOrNull(
      "referralSource"
    );


  const referralNumber =
    valueOrNull(
      "referralNumber"
    );


  const notes =
    valueOrNull(
      "registrationNotes"
    );


  if (!serviceUnitId) {

    message.textContent =
      "Unit pelayanan wajib dipilih.";

    return;
  }


  if (
    visitType === "REFERRAL" &&
    !referralSource &&
    !referralNumber
  ) {

    message.textContent =
      "Untuk kunjungan rujukan, isi asal rujukan atau nomor rujukan.";

    return;
  }


  button.disabled = true;

  message.textContent =
    "Menyimpan pendaftaran...";


  try {

    const payload = {

      patient_id:
        selectedPatient.id,

      payer_id:
        payerId,

      service_unit_id:
        serviceUnitId,

      visit_type:
        visitType,

      chief_complaint:
        chiefComplaint,

      referral_source:
        referralSource,

      referral_number:
        referralNumber,

      notes:
        notes

    };


    const { data, error } =
      await sb
        .from("registrations")
        .insert(payload)
        .select(`
          id,
          registration_number,
          patient_id,
          payer_id,
          service_unit_id,
          registration_date,
          registered_at,
          visit_type,
          status,
          chief_complaint,
          referral_source,
          referral_number,
          notes
        `)
        .single();


    if (error) {
      throw error;
    }


    message.textContent =
      "Pendaftaran berhasil disimpan.";


    showRegistrationResult(data);


    await loadTodayRegistrations();


  } catch (error) {

    console.error(error);

    message.textContent =
      `Gagal menyimpan pendaftaran: ${error.message}`;

  } finally {

    button.disabled = false;

  }

}


/* =========================================================
   HASIL PENDAFTARAN
   ========================================================= */

async function showRegistrationResult(
  registration
) {

  const card =
    document.getElementById(
      "registrationResultCard"
    );


  const result =
    document.getElementById(
      "registrationResult"
    );


  card.style.display =
    "block";


  let payerName = "-";
  let unitName = "-";


  if (registration.payer_id) {

    const { data } =
      await sb
        .from("payers")
        .select("name")
        .eq(
          "id",
          registration.payer_id
        )
        .maybeSingle();


    if (data) {
      payerName =
        data.name;
    }

  }


  const { data: unit } =
    await sb
      .from("units")
      .select("name")
      .eq(
        "id",
        registration.service_unit_id
      )
      .maybeSingle();


  if (unit) {
    unitName =
      unit.name;
  }


  result.innerHTML = `

    <div class="grid">

      <div>

        <strong>
          Nomor Registrasi
        </strong>

        <div>
          ${escapeHtml(
            registration.registration_number
          )}
        </div>

      </div>


      <div>

        <strong>
          Pasien
        </strong>

        <div>
          ${escapeHtml(
            selectedPatient.full_name
          )}
        </div>

      </div>


      <div>

        <strong>
          No. Rekam Medis
        </strong>

        <div>
          ${escapeHtml(
            selectedPatient.medical_record_number
          )}
        </div>

      </div>


      <div>

        <strong>
          Penjamin
        </strong>

        <div>
          ${escapeHtml(payerName)}
        </div>

      </div>


      <div>

        <strong>
          Unit Pelayanan
        </strong>

        <div>
          ${escapeHtml(unitName)}
        </div>

      </div>


      <div>

        <strong>
          Jenis Kunjungan
        </strong>

        <div>
          ${formatVisitType(
            registration.visit_type
          )}
        </div>

      </div>


      <div>

        <strong>
          Status
        </strong>

        <div>
          ${escapeHtml(
            registration.status
          )}
        </div>

      </div>


      <div>

        <strong>
          Tanggal Pendaftaran
        </strong>

        <div>
          ${formatDate(
            registration.registration_date
          )}
        </div>

      </div>

    </div>

  `;


  window.scrollTo({
    top:
      card.offsetTop - 20,
    behavior: "smooth"
  });

}


/* =========================================================
   PENDAFTARAN HARI INI
   ========================================================= */

async function loadTodayRegistrations() {

  const message =
    document.getElementById(
      "todayMessage"
    );


  const container =
    document.getElementById(
      "todayRegistrations"
    );


  message.textContent =
    "Memuat pendaftaran hari ini...";


  container.innerHTML =
    '<p class="muted">Memuat data...</p>';


  const today =
    new Date()
      .toISOString()
      .slice(0, 10);


  const { data, error } =
    await sb
      .from("registrations")
      .select(`
        id,
        registration_number,
        patient_id,
        payer_id,
        service_unit_id,
        registration_date,
        visit_type,
        status
      `)
      .eq(
        "registration_date",
        today
      )
      .order(
        "registered_at",
        {
          ascending: false
        }
      )
      .limit(50);


  if (error) {

    console.error(error);

    message.textContent =
      "Gagal memuat pendaftaran.";

    container.innerHTML =
      `<p class="error">${escapeHtml(error.message)}</p>`;

    return;
  }


  message.textContent =
    `${data.length} pendaftaran ditemukan.`;


  if (!data.length) {

    container.innerHTML =
      '<p class="muted">Belum ada pendaftaran hari ini.</p>';

    return;
  }


  const patientIds =
    [...new Set(
      data.map(row => row.patient_id)
    )];


  const unitIds =
    [...new Set(
      data.map(row => row.service_unit_id)
    )];


  const payerIds =
    [...new Set(
      data
        .map(row => row.payer_id)
        .filter(Boolean)
    )];


  const [
    patientsResult,
    unitsResult,
    payersResult
  ] = await Promise.all([

    sb
      .from("patients")
      .select(
        "id,full_name,medical_record_number"
      )
      .in("id", patientIds),

    sb
      .from("units")
      .select("id,name")
      .in("id", unitIds),

    payerIds.length
      ? sb
          .from("payers")
          .select("id,name")
          .in("id", payerIds)
      : Promise.resolve({
          data: [],
          error: null
        })

  ]);


  if (patientsResult.error) {
    console.error(
      patientsResult.error
    );
  }

  if (unitsResult.error) {
    console.error(
      unitsResult.error
    );
  }

  if (payersResult.error) {
    console.error(
      payersResult.error
    );
  }


  const patientMap =
    Object.fromEntries(
      (patientsResult.data || [])
        .map(row => [
          row.id,
          row
        ])
    );


  const unitMap =
    Object.fromEntries(
      (unitsResult.data || [])
        .map(row => [
          row.id,
          row
        ])
    );


  const payerMap =
    Object.fromEntries(
      (payersResult.data || [])
        .map(row => [
          row.id,
          row
        ])
    );


  container.innerHTML =
    data
      .map(row => {

        const patient =
          patientMap[row.patient_id];


        const unit =
          unitMap[row.service_unit_id];


        const payer =
          row.payer_id
            ? payerMap[row.payer_id]
            : null;


        return `

          <div
            style="
              padding:14px 0;
              border-bottom:1px solid #e5e7eb;
            "
          >

            <strong>
              ${escapeHtml(
                row.registration_number
              )}
            </strong>


            <div>

              ${escapeHtml(
                patient
                  ? patient.full_name
                  : "-"
              )}

              ·

              RM:
              ${escapeHtml(
                patient
                  ? patient.medical_record_number
                  : "-"
              )}

            </div>


            <div class="muted">

              Unit:
              ${escapeHtml(
                unit
                  ? unit.name
                  : "-"
              )}

              ·

              Penjamin:
              ${escapeHtml(
                payer
                  ? payer.name
                  : "-"
              )}

            </div>


            <div class="muted">

              Kunjungan:
              ${formatVisitType(
                row.visit_type
              )}

              ·

              Status:
              ${escapeHtml(
                row.status
              )}

            </div>

          </div>

        `;

      })
      .join("");

}


/* =========================================================
   RESET
   ========================================================= */

function resetSelectedPatient() {

  selectedPatient = null;


  document.getElementById(
    "selectedPatientCard"
  ).style.display = "none";


  document.getElementById(
    "registrationCard"
  ).style.display = "none";


  document.getElementById(
    "registrationResultCard"
  ).style.display = "none";


  document.getElementById(
    "patientSearchMessage"
  ).textContent =
    "";


  document.getElementById(
    "patientSearchResults"
  ).innerHTML =
    '<p class="muted">Belum ada pasien dipilih.</p>';

}


function resetRegistration() {

  document
    .getElementById(
      "registrationForm"
    )
    .reset();


  document.getElementById(
    "visitType"
  ).value =
    "NEW";


  document.getElementById(
    "registrationMessage"
  ).textContent =
    "";


  document.getElementById(
    "registrationResultCard"
  ).style.display =
    "none";

}


/* =========================================================
   HELPER
   ========================================================= */

function valueOrNull(id) {

  const element =
    document.getElementById(id);


  const value =
    element.value.trim();


  return value || null;

}


function formatDate(value) {

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
    "id-ID"
  );

}


function formatSex(value) {

  if (value === "MALE") {
    return "Laki-laki";
  }


  if (value === "FEMALE") {
    return "Perempuan";
  }


  return "Tidak diketahui";

}


function formatVisitType(value) {

  const labels = {

    NEW:
      "Kunjungan Baru",

    FOLLOW_UP:
      "Kunjungan Ulang / Follow Up",

    EMERGENCY:
      "Kegawatdaruratan",

    REFERRAL:
      "Rujukan",

    OTHER:
      "Lainnya"

  };


  return labels[value] ||
    value ||
    "-";

}


function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }


  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}
