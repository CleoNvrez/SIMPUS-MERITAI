let currentProfile = null;
let currentFacilities = [];
let editingFacilityId = null;


// =========================================================
// INITIALIZATION
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {
    bindEvents();

    const profileResult = await loadMyProfile();

    if (!profileResult) {
        return;
    }

    currentProfile = profileResult.profile;

    resetFacilityForm();

    await loadFacilities();
});


// =========================================================
// EVENT BINDINGS
// =========================================================

function bindEvents() {

    const form = document.getElementById("networkFacilityForm");

    if (form) {
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            await saveFacility();
        });
    }


    const reloadButton =
        document.getElementById("reloadFacilitiesBtn");

    if (reloadButton) {
        reloadButton.addEventListener("click", async () => {
            await loadFacilities();
        });
    }


    const cancelButton =
        document.getElementById("cancelEditBtn");

    if (cancelButton) {
        cancelButton.addEventListener("click", () => {
            resetFacilityForm();
        });
    }
}


// =========================================================
// LOAD PROFILE
// =========================================================

async function loadMyProfile() {

    const sessionResult = await sb.auth.getSession();

    if (sessionResult.error || !sessionResult.data.session) {

        window.location.href = "../index.html";

        return null;
    }


    const session = sessionResult.data.session;


    const { data, error } = await sb
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
        .eq("user_id", session.user.id)
        .maybeSingle();


    if (error || !data) {

        await sb.auth.signOut();

        window.location.href = "../index.html";

        return null;
    }


    if (data.status !== "ACTIVE") {

        await sb.auth.signOut();

        window.location.href = "../index.html";

        return null;
    }


    return {
        session,
        profile: data
    };
}


// =========================================================
// LOAD FACILITIES
// =========================================================

async function loadFacilities() {

    setFacilityInfo("Memuat data jejaring...");


    const { data, error } = await sb
        .from("network_facilities")
        .select(`
            id,
            code,
            name,
            facility_type,
            address,
            village,
            district,
            regency,
            phone,
            responsible_person,
            responsible_phone,
            is_active,
            notes,
            created_at,
            updated_at
        `)
        .order("name", {
            ascending: true
        });


    if (error) {

        console.error(error);

        setFacilityInfo(
            "Gagal memuat data jejaring: " +
            error.message
        );

        renderFacilities([]);

        return;
    }


    currentFacilities = data || [];

    renderFacilities(currentFacilities);


    if (currentFacilities.length === 0) {

        setFacilityInfo(
            "Belum ada fasilitas jejaring."
        );

        return;
    }


    setFacilityInfo(
        `${currentFacilities.length} fasilitas ditemukan.`
    );
}


// =========================================================
// SAVE / UPDATE FACILITY
// =========================================================

async function saveFacility() {

    if (!currentProfile) {

        setFormInfo(
            "Profil pengguna belum tersedia.",
            true
        );

        return;
    }


    const code =
        document.getElementById("facilityCode").value.trim();

    const name =
        document.getElementById("facilityName").value.trim();

    const facilityType =
        document.getElementById("facilityType").value;

    const phone =
        document.getElementById("facilityPhone").value.trim();

    const responsiblePerson =
        document
            .getElementById("responsiblePerson")
            .value
            .trim();

    const responsiblePhone =
        document
            .getElementById("responsiblePhone")
            .value
            .trim();

    const address =
        document
            .getElementById("facilityAddress")
            .value
            .trim();

    const village =
        document
            .getElementById("facilityVillage")
            .value
            .trim();

    const district =
        document
            .getElementById("facilityDistrict")
            .value
            .trim();

    const regency =
        document
            .getElementById("facilityRegency")
            .value
            .trim();

    const notes =
        document
            .getElementById("facilityNotes")
            .value
            .trim();


    if (!code) {

        setFormInfo(
            "Kode fasilitas wajib diisi.",
            true
        );

        return;
    }


    if (!name) {

        setFormInfo(
            "Nama fasilitas wajib diisi.",
            true
        );

        return;
    }


    if (!facilityType) {

        setFormInfo(
            "Jenis fasilitas wajib dipilih.",
            true
        );

        return;
    }


    const payload = {
        code,
        name,
        facility_type: facilityType,
        phone: phone || null,
        responsible_person: responsiblePerson || null,
        responsible_phone: responsiblePhone || null,
        address: address || null,
        village: village || null,
        district: district || null,
        regency: regency || null,
        notes: notes || null
    };


    let error = null;


    if (editingFacilityId) {

        const result = await sb
            .from("network_facilities")
            .update({
                ...payload,
                updated_by: currentProfile.user_id
            })
            .eq("id", editingFacilityId);


        error = result.error;

    } else {

        const result = await sb
            .from("network_facilities")
            .insert({
                ...payload,
                created_by: currentProfile.user_id,
                updated_by: currentProfile.user_id
            });


        error = result.error;
    }


    if (error) {

        console.error(error);

        setFormInfo(
            "Gagal menyimpan data: " +
            error.message,
            true
        );

        return;
    }


    if (editingFacilityId) {

        setFormInfo(
            "Data fasilitas berhasil diperbarui."
        );

    } else {

        setFormInfo(
            "Data fasilitas berhasil ditambahkan."
        );
    }


    resetFacilityForm(false);

    await loadFacilities();
}


// =========================================================
// EDIT FACILITY
// =========================================================

function editFacility(id) {

    const facility =
        currentFacilities.find(
            item => item.id === id
        );


    if (!facility) {

        setFormInfo(
            "Data fasilitas tidak ditemukan.",
            true
        );

        return;
    }


    editingFacilityId = facility.id;


    document.getElementById("facilityId").value =
        facility.id;

    document.getElementById("facilityCode").value =
        facility.code || "";

    document.getElementById("facilityName").value =
        facility.name || "";

    document.getElementById("facilityType").value =
        facility.facility_type || "PUSTU";

    document.getElementById("facilityPhone").value =
        facility.phone || "";

    document.getElementById("responsiblePerson").value =
        facility.responsible_person || "";

    document.getElementById("responsiblePhone").value =
        facility.responsible_phone || "";

    document.getElementById("facilityAddress").value =
        facility.address || "";

    document.getElementById("facilityVillage").value =
        facility.village || "";

    document.getElementById("facilityDistrict").value =
        facility.district || "";

    document.getElementById("facilityRegency").value =
        facility.regency || "";

    document.getElementById("facilityNotes").value =
        facility.notes || "";


    document.getElementById("formTitle").textContent =
        "Edit Jejaring / Pustu";

    document.getElementById("saveFacilityBtn").textContent =
        "Update";


    setFormInfo(
        "Mode edit aktif."
    );


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// =========================================================
// RESET FORM
// =========================================================

function resetFacilityForm(clearMessage = true) {

    editingFacilityId = null;


    const form =
        document.getElementById(
            "networkFacilityForm"
        );


    if (form) {
        form.reset();
    }


    document.getElementById("facilityId").value = "";


    document.getElementById("facilityType").value =
        "PUSTU";


    document.getElementById("formTitle").textContent =
        "Tambah Jejaring / Pustu";


    document.getElementById("saveFacilityBtn").textContent =
        "Simpan";


    if (clearMessage) {
        setFormInfo("");
    }
}


// =========================================================
// RENDER TABLE
// =========================================================

function renderFacilities(facilities) {

    const tbody =
        document.getElementById(
            "facilityTableBody"
        );


    if (!tbody) {
        return;
    }


    if (!facilities || facilities.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    style="padding:16px;text-align:center;"
                >
                    Belum ada data fasilitas.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML =
        facilities
            .map(facility => {

                const location =
                    [
                        facility.village,
                        facility.district,
                        facility.regency
                    ]
                    .filter(Boolean)
                    .join(", ") || "-";


                const status =
                    facility.is_active
                        ? "Aktif"
                        : "Nonaktif";


                return `
                    <tr>

                        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">
                            ${escapeHtml(facility.code)}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">
                            ${escapeHtml(facility.name)}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">
                            ${escapeHtml(
                                getFacilityTypeLabel(
                                    facility.facility_type
                                )
                            )}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">
                            ${escapeHtml(location)}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">
                            ${escapeHtml(
                                facility.responsible_person || "-"
                            )}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">
                            ${escapeHtml(status)}
                        </td>

                        <td style="padding:10px;border-bottom:1px solid #e5e7eb;">

                            <button
                                type="button"
                                onclick="editFacility('${escapeJs(facility.id)}')"
                            >
                                Edit
                            </button>

                            <button
                                type="button"
                                onclick="toggleFacilityStatus('${escapeJs(facility.id)}')"
                            >
                                ${facility.is_active
                                    ? "Nonaktifkan"
                                    : "Aktifkan"}
                            </button>

                        </td>

                    </tr>
                `;
            })
            .join("");
}


// =========================================================
// TOGGLE ACTIVE STATUS
// =========================================================

async function toggleFacilityStatus(id) {

    if (!currentProfile) {
        return;
    }


    const facility =
        currentFacilities.find(
            item => item.id === id
        );


    if (!facility) {
        return;
    }


    const newStatus =
        !facility.is_active;


    const confirmation =
        newStatus
            ? "Aktifkan kembali fasilitas ini?"
            : "Nonaktifkan fasilitas ini?";


    if (!window.confirm(confirmation)) {
        return;
    }


    const { error } = await sb
        .from("network_facilities")
        .update({
            is_active: newStatus,
            updated_by: currentProfile.user_id
        })
        .eq("id", id);


    if (error) {

        console.error(error);

        setFacilityInfo(
            "Gagal mengubah status: " +
            error.message
        );

        return;
    }


    await loadFacilities();
}


// =========================================================
// FACILITY TYPE LABEL
// =========================================================

function getFacilityTypeLabel(type) {

    const labels = {

        PUSTU: "Pustu",

        POSYANDU: "Posyandu",

        KLINIK: "Klinik",

        PRAKTIK_MANDIRI: "Praktik Mandiri",

        APOTEK: "Apotek",

        LABORATORIUM: "Laboratorium",

        FASILITAS_KESEHATAN:
            "Fasilitas Kesehatan",

        JEJARING_LAINNYA:
            "Jejaring Lainnya"
    };


    return labels[type] || type || "-";
}


// =========================================================
// HTML ESCAPE
// =========================================================

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function escapeJs(value) {

    return String(value ?? "")
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'");
}


// =========================================================
// INFO HELPERS
// =========================================================

function setFormInfo(message, isError = false) {

    const element =
        document.getElementById("formInfo");


    if (!element) {
        return;
    }


    element.textContent = message || "";


    if (isError) {
        element.style.color = "#b91c1c";
    } else {
        element.style.color = "";
    }
}


function setFacilityInfo(message) {

    const element =
        document.getElementById(
            "facilityInfo"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message || "";
}
