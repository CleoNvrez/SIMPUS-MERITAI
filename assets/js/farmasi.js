// SIMPUS MERITAI — Farmasi Fresh Start V2
// Tahap awal: katalog obat dan daftar resep.
// Tidak mengelola stok, membuat resep, atau mengubah status resep.

"use strict";

document.addEventListener("DOMContentLoaded", initFarmasi);

let currentSession = null;
let currentProfile = null;
let canManageCatalog = false;
let medicines = [];
let prescriptions = [];

const $ = (id) => document.getElementById(id);

async function initFarmasi() {
  $("logoutButton").addEventListener("click", logout);
  $("medicineSearch").addEventListener("input", renderMedicines);
  $("prescriptionSearch").addEventListener("input", renderPrescriptions);
  $("medicineForm").addEventListener("submit", saveMedicine);

  try {
    if (!window.sb || typeof window.loadMyProfile !== "function") {
      showPageMessage(
        "Konfigurasi Supabase atau fungsi autentikasi tidak tersedia.",
        true
      );
      return;
    }

    const result = await window.loadMyProfile();

    // loadMyProfile mengarahkan pengguna ke halaman login jika sesi
    // atau profil tidak valid.
    if (!result || !result.session || !result.profile) return;

    currentSession = result.session;
    currentProfile = result.profile;

    $("profileInfo").textContent =
      `Pengguna: ${currentProfile.display_name || currentSession.user.email || "Pengguna"}`
      + ` | Peran sistem: ${currentProfile.system_role || "Tidak diketahui"}`;

    canManageCatalog = await hasPermission("PHARMACY_CATALOG_MANAGE");

    $("medicineFormSection").hidden = !canManageCatalog;

    await Promise.all([
      loadMedicines(),
      loadPrescriptions()
    ]);

    showPageMessage("Halaman Farmasi berhasil diinisialisasi.", false);
  } catch (error) {
    console.error("Inisialisasi Farmasi gagal:", error);
    showPageMessage(
      "Modul Farmasi gagal dimuat. Periksa koneksi dan konfigurasi Supabase.",
      true
    );
  }
}

async function hasPermission(permissionCode) {
  if (!currentSession || !currentProfile) return false;

  // Pemeriksaan UI untuk kenyamanan pengguna.
  // Keputusan akhir tetap dilakukan oleh RLS/RPC di database.
  if (currentProfile.system_role === "SYSTEM_ADMIN") return true;

  const { data, error } = await window.sb.rpc(
    "security_has_permission",
    { p_permission_code: permissionCode }
  );

  if (error) {
    console.warn(
      `Pemeriksaan izin ${permissionCode} gagal:`,
      error.message
    );
    return false;
  }

  return data === true;
}

async function loadMedicines() {
  const container = $("medicineList");
  container.replaceChildren(createMessage("Memuat katalog obat..."));

  const { data, error } = await window.sb
    .from("pharmacy_medicines")
    .select(
      "id,code,name,generic_name,dosage_form,strength,unit,medicine_type,is_active"
    )
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(500);

  if (error) {
    console.error("Gagal memuat katalog obat:", error);
    container.replaceChildren(
      createMessage(
        "Katalog tidak dapat dimuat. Pastikan akun memiliki izin melihat katalog obat.",
        true
      )
    );
    return;
  }

  medicines = data || [];
  renderMedicines();
}

function renderMedicines() {
  const container = $("medicineList");
  const query = $("medicineSearch").value.trim().toLowerCase();

  const filtered = medicines.filter((medicine) => {
    const searchable = [
      medicine.code,
      medicine.name,
      medicine.generic_name,
      medicine.dosage_form,
      medicine.strength
    ].filter(Boolean).join(" ").toLowerCase();

    return searchable.includes(query);
  });

  container.replaceChildren();

  if (filtered.length === 0) {
    container.append(
      createMessage(
        query
          ? "Tidak ada obat aktif yang cocok dengan pencarian."
          : "Belum ada obat aktif dalam katalog."
      )
    );
    return;
  }

  for (const medicine of filtered) {
    const card = document.createElement("article");
    card.className = "menu-card";

    const title = document.createElement("strong");
    title.textContent = medicine.name;
    card.append(title);

    appendDetail(card, "Kode", medicine.code);
    appendDetail(card, "Generik", medicine.generic_name);
    appendDetail(card, "Bentuk", medicine.dosage_form);
    appendDetail(card, "Kekuatan", medicine.strength);
    appendDetail(card, "Satuan", medicine.unit);
    appendDetail(card, "Jenis", medicine.medicine_type);

    const note = document.createElement("span");
    note.textContent = "Informasi stok tidak tersedia pada modul ini.";
    card.append(note);

    container.append(card);
  }
}

async function saveMedicine(event) {
  event.preventDefault();

  const message = $("medicineFormMessage");
  const button = $("saveMedicineButton");

  message.textContent = "";

  if (!canManageCatalog) {
    setMessage(
      message,
      "Akun Anda tidak memiliki izin mengelola katalog obat.",
      true
    );
    return;
  }

  if (!currentSession || !currentSession.user) {
    setMessage(message, "Sesi pengguna tidak tersedia. Silakan masuk kembali.", true);
    return;
  }

  const code = $("medicineCode").value.trim();
  const name = $("medicineName").value.trim();

  if (!code || !name) {
    setMessage(message, "Kode obat dan nama obat wajib diisi.", true);
    return;
  }

  const payload = {
    code,
    name,
    generic_name: optionalValue("medicineGeneric"),
    dosage_form: optionalValue("medicineFormType"),
    strength: optionalValue("medicineStrength"),
    unit: optionalValue("medicineUnit"),
    medicine_type: $("medicineType").value,
    manufacturer: optionalValue("medicineManufacturer"),
    registration_number: optionalValue("medicineRegistration"),
    notes: optionalValue("medicineNotes"),
    is_active: true
  };

  button.disabled = true;
  button.textContent = "Menyimpan...";

  try {
    const { error } = await window.sb
      .from("pharmacy_medicines")
      .insert(payload);

    if (error) {
      console.error("Penyimpanan obat gagal:", error);

      if (error.code === "23505") {
        setMessage(
          message,
          "Kode obat sudah digunakan. Periksa kembali kode tersebut.",
          true
        );
      } else if (error.code === "42501") {
        setMessage(
          message,
          "Database menolak operasi ini karena izin tidak mencukupi.",
          true
        );
      } else {
        setMessage(
          message,
          `Obat gagal disimpan: ${error.message}`,
          true
        );
      }
      return;
    }

    $("medicineForm").reset();
    setMessage(message, "Obat berhasil ditambahkan ke katalog.", false);

    await loadMedicines();
  } catch (error) {
    console.error("Kesalahan saat menyimpan obat:", error);
    setMessage(
      message,
      "Terjadi kesalahan saat menyimpan obat. Silakan coba lagi.",
      true
    );
  } finally {
    button.disabled = false;
    button.textContent = "Simpan Obat";
  }
}

async function loadPrescriptions() {
  const container = $("prescriptionList");
  container.replaceChildren(createMessage("Memuat daftar resep..."));

  const { data, error } = await window.sb
    .from("pharmacy_prescriptions")
    .select(
      "id,prescription_number,prescription_date,status,encounter_id,verified_at"
    )
    .order("prescription_date", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Gagal memuat daftar resep:", error);

    container.replaceChildren(
      createMessage(
        "Daftar resep tidak dapat dimuat. Periksa izin akses dan kebijakan RLS.",
        true
      )
    );
    return;
  }

  prescriptions = data || [];
  renderPrescriptions();
}

function renderPrescriptions() {
  const container = $("prescriptionList");
  const query = $("prescriptionSearch").value.trim().toLowerCase();

  const filtered = prescriptions.filter((prescription) => {
    const searchable = [
      prescription.prescription_number,
      prescription.status,
      prescription.prescription_date
    ].filter(Boolean).join(" ").toLowerCase();

    return searchable.includes(query);
  });

  container.replaceChildren();

  if (filtered.length === 0) {
    container.append(
      createMessage(
        query
          ? "Tidak ada resep yang cocok dengan pencarian."
          : "Belum ada resep yang dapat ditampilkan."
      )
    );
    return;
  }

  for (const prescription of filtered) {
    const card = document.createElement("article");
    card.className = "menu-card";
    card.style.marginBottom = "12px";

    const title = document.createElement("strong");
    title.textContent =
      prescription.prescription_number || "Nomor resep tidak tersedia";
    card.append(title);

    appendDetail(card, "Tanggal", prescription.prescription_date);
    appendDetail(card, "Status", prescription.status);
    appendDetail(card, "ID Encounter", prescription.encounter_id);
    appendDetail(
      card,
      "Waktu verifikasi",
      prescription.verified_at
        ? new Date(prescription.verified_at).toLocaleString("id-ID")
        : "Belum diverifikasi"
    );

    container.append(card);
  }
}

function optionalValue(id) {
  const value = $(id).value.trim();
  return value === "" ? null : value;
}

function appendDetail(container, label, value) {
  if (value === null || value === undefined || value === "") return;

  const span = document.createElement("span");
  span.textContent = `${label}: ${value}`;
  container.append(span);
}

function createMessage(text, isError = false) {
  const paragraph = document.createElement("p");
  paragraph.className = isError ? "error" : "muted";
  paragraph.textContent = text;
  return paragraph;
}

function setMessage(element, text, isError = false) {
  element.textContent = text;
  element.className = isError ? "error" : "muted";
}

function showPageMessage(text, isError = false) {
  setMessage($("pageMessage"), text, isError);
}
