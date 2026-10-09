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
    resetActivityForm();

    await loadFacilities();
    await loadActivities();
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

    const activityForm = document.getElementById("networkActivityForm");
    if (activityForm) {
        activityForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            await saveActivity();
        });
    }

    const reloadActivitiesButton = document.getElementById("reloadActivitiesBtn");
    if (reloadActivitiesButton) {
        reloadActivitiesButton.addEventListener("click", async () => {
            await loadActivities();
        });
    }

    const cancelActivityButton = document.getElementById("cancelActivityEditBtn");
    if (cancelActivityButton) {
        cancelActivityButton.addEventListener("click", () => {
            resetActivityForm();
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


// =========================================================
// AKTIVITAS JEJARING
// =========================================================

let currentActivities = [];
let editingActivityId = null;

function getLocalDateString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function loadActivityFacilityOptions() {
    const select = document.getElementById("activityFacilityId");
    if (!select) return;
    const activeFacilities = currentFacilities.filter(item => item.is_active);
    select.innerHTML = `<option value="">Pilih fasilitas...</option>${activeFacilities.map(facility => `<option value="${escapeHtml(facility.id)}">${escapeHtml(facility.code)} — ${escapeHtml(facility.name)}</option>`).join("")}`;
}

async function loadActivities() {
    const info = document.getElementById("activityTableInfo");
    if (info) info.textContent = "Memuat data aktivitas...";

    const { data, error } = await sb
        .from("network_activity_records")
        .select(`
            id, network_facility_id, activity_date, activity_type, activity_name,
            location, target_group, target_count, participant_count, status,
            result_summary, notes, recorded_by, created_by, updated_by,
            created_at, updated_at,
            network_facilities ( id, code, name, facility_type, is_active )
        `)
        .order("activity_date", { ascending: false })
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        currentActivities = [];
        renderActivities([]);
        if (info) info.textContent = "Gagal memuat aktivitas: " + error.message;
        return;
    }

    currentActivities = data || [];
    renderActivities(currentActivities);
    loadActivityFacilityOptions();
    if (info) info.textContent = currentActivities.length ? `${currentActivities.length} aktivitas ditemukan.` : "Belum ada aktivitas jejaring.";
}

async function saveActivity() {
    if (!currentProfile) {
        setActivityInfo("Profil pengguna belum tersedia.", true);
        return;
    }

    const facilityId = document.getElementById("activityFacilityId").value;
    const activityDate = document.getElementById("activityDate").value;
    const activityType = document.getElementById("activityType").value.trim();
    const activityName = document.getElementById("activityName").value.trim();
    const location = document.getElementById("activityLocation").value.trim();
    const targetGroup = document.getElementById("activityTargetGroup").value.trim();
    const targetCountRaw = document.getElementById("activityTargetCount").value;
    const participantCountRaw = document.getElementById("activityParticipantCount").value;
    const status = document.getElementById("activityStatus").value;
    const resultSummary = document.getElementById("activityResultSummary").value.trim();
    const notes = document.getElementById("activityNotes").value.trim();

    if (!facilityId) return setActivityInfo("Fasilitas wajib dipilih.", true);
    if (!activityDate) return setActivityInfo("Tanggal aktivitas wajib diisi.", true);
    if (!activityType) return setActivityInfo("Jenis aktivitas wajib diisi.", true);
    if (!activityName) return setActivityInfo("Nama aktivitas wajib diisi.", true);

    const targetCount = targetCountRaw === "" ? null : Number(targetCountRaw);
    const participantCount = participantCountRaw === "" ? null : Number(participantCountRaw);

    if (targetCount !== null && (!Number.isInteger(targetCount) || targetCount < 0)) return setActivityInfo("Jumlah sasaran harus bilangan bulat >= 0.", true);
    if (participantCount !== null && (!Number.isInteger(participantCount) || participantCount < 0)) return setActivityInfo("Jumlah peserta harus bilangan bulat >= 0.", true);

    const payload = {
        network_facility_id: facilityId,
        activity_date: activityDate,
        activity_type: activityType,
        activity_name: activityName,
        location: location || null,
        target_group: targetGroup || null,
        target_count: targetCount,
        participant_count: participantCount,
        status,
        result_summary: resultSummary || null,
        notes: notes || null
    };

    let error = null;
    if (editingActivityId) {
        const result = await sb.from("network_activity_records").update({ ...payload, updated_by: currentProfile.user_id }).eq("id", editingActivityId);
        error = result.error;
    } else {
        const result = await sb.from("network_activity_records").insert({ ...payload, recorded_by: currentProfile.user_id, created_by: currentProfile.user_id, updated_by: currentProfile.user_id });
        error = result.error;
    }

    if (error) {
        console.error(error);
        setActivityInfo("Gagal menyimpan aktivitas: " + error.message, true);
        return;
    }

    setActivityInfo(editingActivityId ? "Aktivitas berhasil diperbarui." : "Aktivitas berhasil ditambahkan.");
    resetActivityForm(false);
    await loadActivities();
}

function editActivity(id) {
    const activity = currentActivities.find(item => item.id === id);
    if (!activity) return setActivityInfo("Data aktivitas tidak ditemukan.", true);

    editingActivityId = activity.id;
    document.getElementById("activityId").value = activity.id;
    document.getElementById("activityFacilityId").value = activity.network_facility_id || "";
    document.getElementById("activityDate").value = activity.activity_date || "";
    document.getElementById("activityType").value = activity.activity_type || "";
    document.getElementById("activityName").value = activity.activity_name || "";
    document.getElementById("activityLocation").value = activity.location || "";
    document.getElementById("activityTargetGroup").value = activity.target_group || "";
    document.getElementById("activityTargetCount").value = activity.target_count ?? "";
    document.getElementById("activityParticipantCount").value = activity.participant_count ?? "";
    document.getElementById("activityStatus").value = activity.status || "COMPLETED";
    document.getElementById("activityResultSummary").value = activity.result_summary || "";
    document.getElementById("activityNotes").value = activity.notes || "";
    document.getElementById("activityFormTitle").textContent = "Edit Aktivitas Jejaring";
    document.getElementById("saveActivityBtn").textContent = "Update Aktivitas";
    setActivityInfo("Mode edit aktivitas aktif.");
}

function resetActivityForm(clearMessage = true) {
    editingActivityId = null;
    const form = document.getElementById("networkActivityForm");
    if (form) form.reset();
    const date = document.getElementById("activityDate");
    const status = document.getElementById("activityStatus");
    const id = document.getElementById("activityId");
    if (id) id.value = "";
    if (date) date.value = getLocalDateString();
    if (status) status.value = "COMPLETED";
    loadActivityFacilityOptions();
    document.getElementById("activityFormTitle").textContent = "Tambah Aktivitas Jejaring";
    document.getElementById("saveActivityBtn").textContent = "Simpan Aktivitas";
    if (clearMessage) setActivityInfo("");
}

function renderActivities(activities) {
    const tbody = document.getElementById("activityTableBody");
    if (!tbody) return;
    if (!activities || activities.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="padding:16px;text-align:center;">Belum ada data aktivitas.</td></tr>`;
        return;
    }
    tbody.innerHTML = activities.map(activity => {
        const facility = activity.network_facilities || {};
        const facilityLabel = `${facility.code || "-"} — ${facility.name || "-"}`;
        return `<tr>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(activity.activity_date || "-")}</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(facilityLabel)}</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(activity.activity_type || "-")}</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(activity.activity_name || "-")}</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(activity.participant_count ?? "-")}</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb">${escapeHtml(getActivityStatusLabel(activity.status))}</td>
            <td style="padding:10px;border-bottom:1px solid #e5e7eb"><button type="button" onclick="editActivity('${escapeJs(activity.id)}')">Edit</button></td>
        </tr>`;
    }).join("");
}

function getActivityStatusLabel(status) {
    const labels = { PLANNED: "Direncanakan", ONGOING: "Berlangsung", COMPLETED: "Selesai", CANCELLED: "Dibatalkan" };
    return labels[status] || status || "-";
}

function setActivityInfo(message, isError = false) {
    const element = document.getElementById("activityInfo");
    if (!element) return;
    element.textContent = message || "";
    element.style.color = isError ? "#b91c1c" : "";
}
