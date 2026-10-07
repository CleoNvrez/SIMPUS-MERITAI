// SIMPUS MERITAI — Fresh Start V2
// Modul Administrasi Pasien

let currentPatient = null;


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  const session = await requireSession();

  if (!session) {
    return;
  }

  bindEvents();

});


/* =========================================================
   EVENT BINDING
   ========================================================= */

function bindEvents() {

  document
    .getElementById("btnNewPatient")
    .addEventListener("click", showNewPatientForm);

  document
    .getElementById("btnSearch")
    .addEventListener("click", searchPatients);

  document
    .getElementById("searchPatient")
    .addEventListener("keydown", event => {

      if (event.key === "Enter") {
        event.preventDefault();
        searchPatients();
      }

    });

  document
    .getElementById("patientForm")
    .addEventListener("submit", savePatient);

  document
    .getElementById("btnCancelPatient")
    .addEventListener("click", hidePatientForm);

}


/* =========================================================
   NEW PATIENT FORM
   ========================================================= */

function showNewPatientForm() {

  currentPatient = null;

  const form = document.getElementById("patientForm");

  form.reset();

  document.getElementById("sex").value = "UNKNOWN";

  document.getElementById("formTitle").textContent =
    "Pasien Baru";

  document.getElementById("formMessage").textContent = "";

  document.getElementById("patientFormCard").style.display =
    "block";

  document.getElementById("patientDetailCard").style.display =
    "none";

  window.scrollTo({
    top: document.getElementById("patientFormCard").offsetTop - 20,
    behavior: "smooth"
  });

  document.getElementById("fullName").focus();

}


/* =========================================================
   HIDE FORM
   ========================================================= */

function hidePatientForm() {

  document.getElementById("patientFormCard").style.display =
    "none";

  document.getElementById("formMessage").textContent = "";

  currentPatient = null;

}


/* =========================================================
   SEARCH
   ========================================================= */

async function searchPatients() {

  const input =
    document.getElementById("searchPatient");

  const message =
    document.getElementById("searchMessage");

  const list =
    document.getElementById("patientList");

  const term = input.value.trim();


  if (term.length < 2) {

    message.textContent =
      "Masukkan minimal 2 karakter.";

    list.innerHTML =
      '<p class="muted">Pencarian belum dilakukan.</p>';

    return;

  }


  message.textContent =
    "Mencari pasien...";

  list.innerHTML =
    '<p class="muted">Memuat data...</p>';


  const safeTerm = term
    .replace(/[%(),]/g, " ")
    .trim();


  const { data, error } = await sb
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
    .order("full_name", { ascending: true })
    .limit(30);


  if (error) {

    console.error(error);

    message.textContent =
      "Gagal mengambil data pasien.";

    list.innerHTML =
      `<p class="error">${escapeHtml(error.message)}</p>`;

    return;

  }


  message.textContent =
    `${data.length} pasien ditemukan.`;


  if (!data.length) {

    list.innerHTML =
      '<p class="muted">Pasien tidak ditemukan.</p>';

    return;

  }


  list.innerHTML = data
    .map(patient => patientRow(patient))
    .join("");


  list
    .querySelectorAll("[data-patient-id]")
    .forEach(button => {

      button.addEventListener("click", () => {

        const patientId =
          button.getAttribute("data-patient-id");

        loadPatientDetail(patientId);

      });

    });

}


/* =========================================================
   PATIENT ROW
   ========================================================= */

function patientRow(patient) {

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
            RM:
            ${escapeHtml(patient.medical_record_number)}
          </div>

          <div class="muted">
            NIK:
            ${escapeHtml(patient.national_id || "-")}
          </div>

          <div class="muted">
            ${formatDate(patient.date_of_birth)}
            ·
            ${formatSex(patient.sex)}
            ·
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
            data-patient-id="${patient.id}"
            style="max-width:140px"
          >
            Detail
          </button>

        </div>

      </div>

    </div>
  `;

}


/* =========================================================
   LOAD PATIENT DETAIL
   ========================================================= */

async function loadPatientDetail(patientId) {

  const detailCard =
    document.getElementById("patientDetailCard");

  const detail =
    document.getElementById("patientDetail");


  detailCard.style.display = "block";

  detail.innerHTML =
    '<p class="muted">Memuat detail pasien...</p>';


  const { data, error } = await sb
    .from("patients")
    .select(`
      id,
      medical_record_number,
      full_name,
      national_id,
      date_of_birth,
      place_of_birth,
      sex,
      blood_type,
      marital_status,
      education,
      occupation,
      religion,
      phone,
      email,
      address,
      village,
      district,
      regency,
      province,
      postal_code,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      status,
      notes,
      created_at,
      updated_at
    `)
    .eq("id", patientId)
    .single();


  if (error) {

    console.error(error);

    detail.innerHTML =
      `<p class="error">${escapeHtml(error.message)}</p>`;

    return;

  }


  currentPatient = data;


  detail.innerHTML = `

    <div class="grid">

      <div>
        <strong>No. Rekam Medis</strong>
        <div>
          ${escapeHtml(data.medical_record_number)}
        </div>
      </div>

      <div>
        <strong>Nama Lengkap</strong>
        <div>
          ${escapeHtml(data.full_name)}
        </div>
      </div>

      <div>
        <strong>NIK</strong>
        <div>
          ${escapeHtml(data.national_id || "-")}
        </div>
      </div>

      <div>
        <strong>Jenis Kelamin</strong>
        <div>
          ${formatSex(data.sex)}
        </div>
      </div>

      <div>
        <strong>Tempat / Tanggal Lahir</strong>
        <div>
          ${escapeHtml(data.place_of_birth || "-")}
          /
          ${formatDate(data.date_of_birth)}
        </div>
      </div>

      <div>
        <strong>Golongan Darah</strong>
        <div>
          ${escapeHtml(data.blood_type || "-")}
        </div>
      </div>

      <div>
        <strong>Status Perkawinan</strong>
        <div>
          ${escapeHtml(data.marital_status || "-")}
        </div>
      </div>

      <div>
        <strong>Pendidikan</strong>
        <div>
          ${escapeHtml(data.education || "-")}
        </div>
      </div>

      <div>
        <strong>Pekerjaan</strong>
        <div>
          ${escapeHtml(data.occupation || "-")}
        </div>
      </div>

      <div>
        <strong>Agama</strong>
        <div>
          ${escapeHtml(data.religion || "-")}
        </div>
      </div>

      <div>
        <strong>No. HP</strong>
        <div>
          ${escapeHtml(data.phone || "-")}
        </div>
      </div>

      <div>
        <strong>Email</strong>
        <div>
          ${escapeHtml(data.email || "-")}
        </div>
      </div>

    </div>


    <hr style="margin:24px 0">


    <h4>Alamat</h4>

    <p>
      ${escapeHtml(data.address || "-")}
    </p>

    <div class="grid">

      <div>
        <strong>Kelurahan / Desa</strong>
        <div>${escapeHtml(data.village || "-")}</div>
      </div>

      <div>
        <strong>Kecamatan</strong>
        <div>${escapeHtml(data.district || "-")}</div>
      </div>

      <div>
        <strong>Kabupaten / Kota</strong>
        <div>${escapeHtml(data.regency || "-")}</div>
      </div>

      <div>
        <strong>Provinsi</strong>
        <div>${escapeHtml(data.province || "-")}</div>
      </div>

      <div>
        <strong>Kode Pos</strong>
        <div>${escapeHtml(data.postal_code || "-")}</div>
      </div>

    </div>


    <hr style="margin:24px 0">


    <h4>Kontak Darurat</h4>

    <div class="grid">

      <div>
        <strong>Nama</strong>
        <div>
          ${escapeHtml(data.emergency_contact_name || "-")}
        </div>
      </div>

      <div>
        <strong>No. HP</strong>
        <div>
          ${escapeHtml(data.emergency_contact_phone || "-")}
        </div>
      </div>

      <div>
        <strong>Hubungan</strong>
        <div>
          ${escapeHtml(
            data.emergency_contact_relationship || "-"
          )}
        </div>
      </div>

    </div>


    <hr style="margin:24px 0">


    <div class="grid">

      <div>
        <strong>Status Pasien</strong>
        <div>${escapeHtml(data.status)}</div>
      </div>

      <div>
        <strong>Dibuat</strong>
        <div>${formatDateTime(data.created_at)}</div>
      </div>

      <div>
        <strong>Diperbarui</strong>
        <div>${formatDateTime(data.updated_at)}</div>
      </div>

    </div>


    <div style="margin-top:18px">

      <strong>Catatan</strong>

      <p>
        ${escapeHtml(data.notes || "-")}
      </p>

    </div>

  `;


  window.scrollTo({
    top: detailCard.offsetTop - 20,
    behavior: "smooth"
  });

}


/* =========================================================
   SAVE PATIENT
   ========================================================= */

async function savePatient(event) {

  event.preventDefault();


  const message =
    document.getElementById("formMessage");

  const button =
    document.getElementById("btnSavePatient");


  const fullName =
    document.getElementById("fullName")
      .value
      .trim();

  const nationalId =
    document.getElementById("nationalId")
      .value
      .trim();


  if (!fullName) {

    message.textContent =
      "Nama lengkap wajib diisi.";

    return;

  }


  if (nationalId && !/^\d{16}$/.test(nationalId)) {

    message.textContent =
      "NIK harus terdiri dari 16 digit angka.";

    return;

  }


  button.disabled = true;

  message.textContent =
    "Menyimpan pasien...";


  try {

    /*
     * Cek NIK sebelum INSERT.
     *
     * Karena schema saat ini belum mempunyai
     * UNIQUE constraint pada national_id,
     * pengecekan ini penting untuk mencegah
     * duplikasi NIK pada alur normal aplikasi.
     */

    if (nationalId) {

      const { data: existing, error: duplicateError } =
        await sb
          .from("patients")
          .select("id,medical_record_number,full_name")
          .eq("national_id", nationalId)
          .limit(1);


      if (duplicateError) {
        throw duplicateError;
      }


      if (existing && existing.length > 0) {

        message.textContent =
          `NIK sudah terdaftar atas nama ${existing[0].full_name} ` +
          `(${existing[0].medical_record_number}).`;

        await loadPatientDetail(existing[0].id);

        return;

      }

    }


    const payload = {

      full_name: fullName,

      national_id:
        nationalId || null,

      date_of_birth:
        valueOrNull("dateOfBirth"),

      place_of_birth:
        valueOrNull("placeOfBirth"),

      sex:
        document.getElementById("sex").value,

      blood_type:
        valueOrNull("bloodType"),

      marital_status:
        valueOrNull("maritalStatus"),

      education:
        valueOrNull("education"),

      occupation:
        valueOrNull("occupation"),

      religion:
        valueOrNull("religion"),

      phone:
        valueOrNull("phone"),

      email:
        valueOrNull("email"),

      address:
        valueOrNull("address"),

      village:
        valueOrNull("village"),

      district:
        valueOrNull("district"),

      regency:
        valueOrNull("regency"),

      province:
        valueOrNull("province"),

      postal_code:
        valueOrNull("postalCode"),

      emergency_contact_name:
        valueOrNull("emergencyContactName"),

      emergency_contact_phone:
        valueOrNull("emergencyContactPhone"),

      emergency_contact_relationship:
        valueOrNull("emergencyContactRelationship"),

      notes:
        valueOrNull("notes")

    };


    const { data, error } = await sb
      .from("patients")
      .insert(payload)
      .select(`
        id,
        medical_record_number,
        full_name,
        national_id,
        date_of_birth,
        sex,
        status
      `)
      .single();


    if (error) {

      throw error;

    }


    message.textContent =
      `Pasien berhasil disimpan. No. RM: ` +
      `${data.medical_record_number}`;


    document.getElementById("patientForm").reset();

    document.getElementById("sex").value =
      "UNKNOWN";


    await loadPatientDetail(data.id);


    /*
     * Refresh hasil pencarian jika sedang digunakan.
     */

    const searchTerm =
      document.getElementById("searchPatient")
        .value
        .trim();

    if (searchTerm.length >= 2) {
      await searchPatients();
    }


  } catch (error) {

    console.error(error);

    message.textContent =
      `Gagal menyimpan pasien: ${error.message}`;

  } finally {

    button.disabled = false;

  }

}


/* =========================================================
   HELPERS
   ========================================================= */

function valueOrNull(id) {

  const value =
    document.getElementById(id)
      .value
      .trim();

  return value || null;

}


function formatDate(value) {

  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("id-ID");

}


function formatDateTime(value) {

  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("id-ID");

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


function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}