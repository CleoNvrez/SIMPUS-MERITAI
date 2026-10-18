// SIMPUS MERITAI — Farmasi Fresh Start V2
// Tahap: katalog obat, pembuatan resep DRAFT, dan detail obat resep.
// Verifikasi dan penyerahan obat belum diaktifkan di UI.

"use strict";

document.addEventListener("DOMContentLoaded", initFarmasi);

let currentSession = null;
let currentProfile = null;
let canManageCatalog = false;
let canCreatePrescription = false;
let medicines = [];
let prescriptions = [];
let encounters = [];
let selectedPrescription = null;

const $ = (id) => document.getElementById(id);

async function initFarmasi() {
  $("logoutButton").addEventListener("click", logout);
  $("medicineSearch").addEventListener("input", renderMedicines);
  $("prescriptionSearch").addEventListener("input", renderPrescriptions);
  $("medicineForm").addEventListener("submit", saveMedicine);
  $("prescriptionForm").addEventListener("submit", createPrescription);
  $("prescriptionItemForm").addEventListener("submit", addPrescriptionItem);

  try {
    if (!window.sb || typeof window.loadMyProfile !== "function") {
      showPageMessage("Konfigurasi Supabase atau autentikasi tidak tersedia.", true);
      return;
    }

    const result = await window.loadMyProfile();
    if (!result || !result.session || !result.profile) return;

    currentSession = result.session;
    currentProfile = result.profile;

    $("profileInfo").textContent =
      `Pengguna: ${currentProfile.display_name || currentSession.user.email || "Pengguna"}`
      + ` | Peran: ${currentProfile.system_role || "Tidak diketahui"}`;

    canManageCatalog = await hasPermission("PHARMACY_CATALOG_MANAGE");
    canCreatePrescription = await hasPermission("PRESCRIPTION_CREATE");

    $("medicineFormSection").hidden = !canManageCatalog;
    $("prescriptionFormSection").hidden = !canCreatePrescription;

    if (!canCreatePrescription) {
      $("prescriptionAccessMessage").textContent =
        "Akun ini tidak memiliki izin membuat resep.";
    }

    await Promise.all([
      loadMedicines(),
      loadPrescriptions()
    ]);

    if (canCreatePrescription) await loadEncounters();

    showPageMessage("Modul Farmasi berhasil dimuat.", false);
  } catch (error) {
    console.error("Inisialisasi Farmasi gagal:", error);
    showPageMessage(
      "Modul gagal dimuat. Periksa koneksi dan konfigurasi Supabase.",
      true
    );
  }
}

async function hasPermission(permissionCode) {
  if (!currentSession || !currentProfile) return false;
  if (currentProfile.system_role === "SYSTEM_ADMIN") return true;

  const { data, error } = await window.sb.rpc(
    "security_has_permission",
    { p_permission_code: permissionCode }
  );

  if (error) {
    console.warn(`Pemeriksaan ${permissionCode} gagal:`, error.message);
    return false;
  }

  return data === true;
}

// -------------------- KATALOG OBAT --------------------

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
    console.error("Gagal memuat katalog:", error);
    container.replaceChildren(createMessage(
      "Katalog tidak dapat dimuat. Periksa izin PHARMACY_VIEW.",
      true
    ));
    return;
  }

  medicines = data || [];
  renderMedicines();
  populateMedicineOptions();
}

function renderMedicines() {
  const container = $("medicineList");
  const query = $("medicineSearch").value.trim().toLowerCase();

  const filtered = medicines.filter((medicine) =>
    [
      medicine.code,
      medicine.name,
      medicine.generic_name,
      medicine.dosage_form,
      medicine.strength
    ].filter(Boolean).join(" ").toLowerCase().includes(query)
  );

  container.replaceChildren();

  if (!filtered.length) {
    container.append(createMessage(
      query ? "Obat tidak ditemukan." : "Belum ada obat aktif dalam katalog."
    ));
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
    note.textContent = "Stok tidak dikelola oleh modul ini.";
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
    setMessage(message, "Izin mengelola katalog tidak tersedia.", true);
    return;
  }

  const payload = {
    code: $("medicineCode").value.trim(),
    name: $("medicineName").value.trim(),
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

  if (!payload.code || !payload.name) {
    setMessage(message, "Kode dan nama obat wajib diisi.", true);
    return;
  }

  button.disabled = true;

  try {
    const { error } = await window.sb
      .from("pharmacy_medicines")
      .insert(payload);

    if (error) {
      console.error("Gagal menyimpan obat:", error);
      setMessage(
        message,
        error.code === "23505"
          ? "Kode obat sudah digunakan."
          : `Penyimpanan ditolak: ${error.message}`,
        true
      );
      return;
    }

    $("medicineForm").reset();
    setMessage(message, "Obat berhasil ditambahkan.", false);
    await loadMedicines();
  } catch (error) {
    console.error(error);
    setMessage(message, "Terjadi kesalahan saat menyimpan obat.", true);
  } finally {
    button.disabled = false;
  }
}

function populateMedicineOptions() {
  const select = $("itemMedicine");
  select.replaceChildren(new Option("Pilih obat", ""));

  for (const medicine of medicines) {
    select.add(new Option(`${medicine.name} (${medicine.code})`, medicine.id));
  }
}

// -------------------- ENCOUNTER --------------------

async function loadEncounters() {
  const select = $("encounterSelect");
  select.replaceChildren(new Option("Memuat encounter...", ""));

  const { data, error } = await window.sb
    .from("encounters")
    .select("id")
    .limit(100);

  if (error) {
    console.error("Gagal memuat encounter:", error);
    select.replaceChildren(new Option("Encounter tidak dapat dimuat", ""));
    $("encounterMessage").textContent =
      "Database tidak mengizinkan atau gagal menampilkan daftar encounter. "
      + "Periksa izin akses; jangan menggunakan ID yang ditebak.";
    return;
  }

  encounters = data || [];
  select.replaceChildren(new Option("Pilih encounter", ""));

  for (const encounter of encounters) {
    select.add(new Option(encounter.id, encounter.id));
  }

  $("encounterMessage").textContent = encounters.length
    ? `${encounters.length} encounter yang dapat dibaca dimuat.`
    : "Tidak ada encounter yang dapat dipilih oleh akun ini.";
}

// -------------------- RESEP --------------------

async function loadPrescriptions() {
  const container = $("prescriptionList");
  container.replaceChildren(createMessage("Memuat daftar resep..."));

  const { data, error } = await window.sb
    .from("pharmacy_prescriptions")
    .select(
      "id,prescription_number,prescription_date,status,encounter_id,verified_at,prescribed_by"
    )
    .order("prescription_date", { ascending: false })
    .limit(200);

  if (error) {
    console.error("Gagal memuat resep:", error);
    container.replaceChildren(createMessage(
      "Daftar resep tidak dapat dimuat. Periksa izin akses dan RLS.",
      true
    ));
    return;
  }

  prescriptions = data || [];
  renderPrescriptions();
}

function renderPrescriptions() {
  const container = $("prescriptionList");
  const query = $("prescriptionSearch").value.trim().toLowerCase();

  const filtered = prescriptions.filter((prescription) =>
    [
      prescription.prescription_number,
      prescription.status,
      prescription.prescription_date
    ].filter(Boolean).join(" ").toLowerCase().includes(query)
  );

  container.replaceChildren();

  if (!filtered.length) {
    container.append(createMessage(
      query ? "Tidak ada resep yang cocok." : "Belum ada resep yang dapat ditampilkan."
    ));
    return;
  }

  for (const prescription of filtered) {
    const card = document.createElement("article");
    card.className = "menu-card";
    card.style.marginBottom = "12px";

    const title = document.createElement("strong");
    title.textContent = prescription.prescription_number;
    card.append(title);

    appendDetail(card, "Tanggal", prescription.prescription_date);
    appendDetail(card, "Status", prescription.status);

    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.textContent = "Lihat detail resep";
    selectButton.addEventListener("click", () => selectPrescription(prescription));
    card.append(selectButton);

    container.append(card);
  }
}

async function createPrescription(event) {
  event.preventDefault();

  const message = $("prescriptionFormMessage");
  const button = $("createPrescriptionButton");
  message.textContent = "";

  if (!canCreatePrescription) {
    setMessage(message, "Izin membuat resep tidak tersedia.", true);
    return;
  }

  const encounterId = $("encounterSelect").value;
  if (!encounterId) {
    setMessage(message, "Pilih encounter terlebih dahulu.", true);
    return;
  }

  if (!encounters.some((item) => item.id === encounterId)) {
    setMessage(message, "Encounter tidak ada dalam daftar yang dimuat.", true);
    return;
  }

  // Nomor unik praktis dari waktu + fragmen UUID.
  // Constraint UNIQUE database tetap menjadi pengaman terakhir.
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");

  const uniquePart = crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
  const prescriptionNumber = `RX-${datePart}-${uniquePart}`;

  button.disabled = true;
  button.textContent = "Membuat resep...";

  try {
    const { data, error } = await window.sb
      .from("pharmacy_prescriptions")
      .insert({
        encounter_id: encounterId,
        prescription_number: prescriptionNumber,
        prescribed_by: currentSession.user.id,
        status: "DRAFT",
        notes: optionalValue("prescriptionNotes")
      })
      .select(
        "id,prescription_number,prescription_date,status,encounter_id,verified_at,prescribed_by"
      )
      .single();

    if (error) {
      console.error("Gagal membuat resep:", error);
      setMessage(
        message,
        `Resep gagal dibuat: ${error.message}. Periksa izin dan validitas encounter.`,
        true
      );
      return;
    }

    $("prescriptionForm").reset();
    setMessage(
      message,
      `Resep ${data.prescription_number} berhasil dibuat dengan status DRAFT.`,
      false
    );

    await loadPrescriptions();
    await selectPrescription(data);
  } catch (error) {
    console.error(error);
    setMessage(message, "Terjadi kesalahan saat membuat resep.", true);
  } finally {
    button.disabled = false;
    button.textContent = "Buat Resep DRAFT";
  }
}

// -------------------- DETAIL OBAT RESEP --------------------

async function selectPrescription(prescription) {
  selectedPrescription = prescription;

  const canEdit =
    prescription.status === "DRAFT" &&
    (
      prescription.prescribed_by === currentSession.user.id ||
      currentProfile.system_role === "SYSTEM_ADMIN"
    );

  $("selectedPrescriptionMessage").textContent =
    `Resep: ${prescription.prescription_number || prescription.id} | `
    + `Status: ${prescription.status}.`;

  $("prescriptionItemFormSection").hidden = !canEdit;
  $("prescriptionItemMessage").textContent = "";

  if (prescription.status !== "DRAFT") {
    $("selectedPrescriptionMessage").textContent +=
      " Resep tidak lagi DRAFT sehingga item tidak dapat ditambahkan.";
  } else if (!canEdit) {
    $("selectedPrescriptionMessage").textContent +=
      " Hanya pembuat resep atau administrator sistem yang dapat mengubahnya.";
  }

  await loadPrescriptionItems(prescription.id);
}

async function loadPrescriptionItems(prescriptionId) {
  const container = $("prescriptionItemList");
  container.replaceChildren(createMessage("Memuat detail obat resep..."));

  const { data, error } = await window.sb
    .from("pharmacy_prescription_items")
    .select(
      "id,prescription_id,medicine_id,dose,frequency,duration_days,quantity,route,instructions,notes"
    )
    .eq("prescription_id", prescriptionId);

  if (error) {
    console.error("Gagal memuat item resep:", error);
    container.replaceChildren(createMessage(
      "Detail obat tidak dapat dimuat. Periksa izin akses RLS.",
      true
    ));
    return;
  }

  container.replaceChildren();

  if (!data || !data.length) {
    container.append(createMessage("Belum ada item obat pada resep ini."));
    return;
  }

  for (const item of data) {
    const card = document.createElement("article");
    card.className = "menu-card";
    card.style.marginBottom = "10px";

    const medicine = medicines.find((m) => m.id === item.medicine_id);
    const title = document.createElement("strong");
    title.textContent = medicine
      ? `${medicine.name} (${medicine.code})`
      : `ID obat: ${item.medicine_id}`;
    card.append(title);

    appendDetail(card, "Dosis", item.dose);
    appendDetail(card, "Frekuensi", item.frequency);
    appendDetail(card, "Durasi (hari)", item.duration_days);
    appendDetail(card, "Jumlah", item.quantity);
    appendDetail(card, "Rute", item.route);
    appendDetail(card, "Instruksi", item.instructions);
    appendDetail(card, "Catatan", item.notes);

    container.append(card);
  }
}

async function addPrescriptionItem(event) {
  event.preventDefault();

  const message = $("prescriptionItemMessage");
  const button = $("savePrescriptionItemButton");
  message.textContent = "";

  if (!selectedPrescription || selectedPrescription.status !== "DRAFT") {
    setMessage(message, "Pilih resep berstatus DRAFT terlebih dahulu.", true);
    return;
  }

  const canEdit =
    selectedPrescription.prescribed_by === currentSession.user.id ||
    currentProfile.system_role === "SYSTEM_ADMIN";

  if (!canEdit) {
    setMessage(message, "Anda tidak berwenang mengubah resep ini.", true);
    return;
  }

  const medicineId = $("itemMedicine").value;
  const dose = $("itemDose").value.trim();
  const frequency = $("itemFrequency").value.trim();
  const quantity = Number($("itemQuantity").value);
  const durationRaw = $("itemDuration").value;
  const duration = durationRaw === "" ? null : Number(durationRaw);

  if (!medicineId || !dose || !frequency || !Number.isFinite(quantity) || quantity <= 0) {
    setMessage(message, "Obat, dosis, frekuensi, dan jumlah valid wajib diisi.", true);
    return;
  }

  if (duration !== null && (!Number.isInteger(duration) || duration <= 0)) {
    setMessage(message, "Durasi harus berupa bilangan bulat lebih dari nol.", true);
    return;
  }

  const payload = {
    prescription_id: selectedPrescription.id,
    medicine_id: medicineId,
    dose,
    frequency,
    duration_days: duration,
    quantity,
    route: optionalValue("itemRoute"),
    instructions: optionalValue("itemInstructions"),
    notes: optionalValue("itemNotes")
  };

  button.disabled = true;
  button.textContent = "Menyimpan item...";

  try {
    const { error } = await window.sb
      .from("pharmacy_prescription_items")
      .insert(payload);

    if (error) {
      console.error("Gagal menambahkan item resep:", error);
      setMessage(
        message,
        `Item gagal ditambahkan: ${error.message}. Pastikan resep masih DRAFT dan izin tersedia.`,
        true
      );
      return;
    }

    $("prescriptionItemForm").reset();
    setMessage(message, "Item obat berhasil ditambahkan ke resep.", false);
    await loadPrescriptionItems(selectedPrescription.id);
  } catch (error) {
    console.error(error);
    setMessage(message, "Terjadi kesalahan saat menambahkan item.", true);
  } finally {
    button.disabled = false;
    button.textContent = "Tambahkan Obat ke Resep";
  }
}

// -------------------- UTILITAS --------------------

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
