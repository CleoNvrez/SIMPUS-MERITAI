// ============================================================
// SIMPUS MERITAI — Fresh Start V2
// Modul: Klaster Pelayanan Puskesmas
// ============================================================

let currentProfile = null;
let clusters = [];
let clusterServices = [];


// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  await initKlaster();
});


// ============================================================
// INITIALIZATION
// ============================================================

async function initKlaster() {
  try {
    const profileResult = await loadMyProfile();

    if (!profileResult) {
      return;
    }

    currentProfile = profileResult.profile;

    await loadClusters();

  } catch (error) {
    console.error("Gagal menginisialisasi modul klaster:", error);

    showError(
      "Terjadi kesalahan saat memuat modul Klaster Pelayanan."
    );
  }
}


// ============================================================
// LOAD CLUSTERS
// ============================================================

async function loadClusters() {

  setInfo("Memuat data klaster pelayanan...");

  const { data, error } = await sb
    .from("clusters")
    .select(`
      id,
      code,
      name,
      description,
      display_order,
      is_active
    `)
    .eq("is_active", true)
    .order("display_order", {
      ascending: true
    });

  if (error) {
    console.error("Gagal mengambil clusters:", error);

    showError(
      "Data klaster tidak dapat dimuat. Silakan coba lagi."
    );

    return;
  }

  clusters = data || [];

  await loadClusterServices();
}


// ============================================================
// LOAD CLUSTER SERVICES
// ============================================================

async function loadClusterServices() {

  const { data, error } = await sb
    .from("cluster_services")
    .select(`
      id,
      cluster_id,
      unit_id,
      code,
      name,
      description,
      display_order,
      is_active,
      units (
        id,
        code,
        name,
        is_active
      )
    `)
    .eq("is_active", true)
    .order("display_order", {
      ascending: true
    });

  if (error) {
    console.error("Gagal mengambil cluster_services:", error);

    showError(
      "Data layanan klaster tidak dapat dimuat. Silakan coba lagi."
    );

    return;
  }

  clusterServices = data || [];

  renderClusters();
}


// ============================================================
// RENDER CLUSTERS
// ============================================================

function renderClusters() {

  const container = document.getElementById(
    "clusterContainer"
  );

  if (!container) {
    return;
  }

  if (!clusters.length) {

    container.innerHTML = `
      <div class="card">
        <h3>Belum Ada Klaster</h3>

        <p class="muted">
          Belum terdapat klaster pelayanan aktif
          pada database.
        </p>
      </div>
    `;

    setInfo("Tidak ada klaster aktif.");

    return;
  }

  let html = "";

  clusters.forEach((cluster, index) => {

    const services = clusterServices
      .filter(service =>
        service.cluster_id === cluster.id
      )
      .sort((a, b) =>
        (a.display_order || 0) -
        (b.display_order || 0)
      );

    html += renderClusterCard(
      cluster,
      services,
      index + 1
    );
  });

  container.innerHTML = html;

  const totalServices = clusterServices.length;

  setInfo(
    `${clusters.length} klaster aktif · ` +
    `${totalServices} layanan aktif`
  );
}


// ============================================================
// RENDER CLUSTER CARD
// ============================================================

function renderClusterCard(
  cluster,
  services,
  number
) {

  const serviceCount = services.length;

  let servicesHtml = "";

  if (!serviceCount) {

    servicesHtml = `
      <div class="muted">
        Belum ada layanan aktif pada klaster ini.
      </div>
    `;

  } else {

    servicesHtml = services
      .map((service, index) =>
        renderService(
          service,
          index + 1
        )
      )
      .join("");
  }


  return `
    <section class="card" style="margin-top:16px">

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:16px;
          flex-wrap:wrap;
        "
      >

        <div>

          <div
            class="muted"
            style="font-size:.85rem;margin-bottom:4px"
          >
            KLASTER ${number}
          </div>

          <h2 style="margin:0">
            ${escapeHtml(cluster.name)}
          </h2>

          ${
            cluster.description
              ? `
                <p class="muted">
                  ${escapeHtml(cluster.description)}
                </p>
              `
              : ""
          }

        </div>

        <div
          style="
            padding:6px 10px;
            border-radius:999px;
            background:#f0fdfa;
            color:#0f766e;
            font-size:.85rem;
            white-space:nowrap;
          "
        >
          ${serviceCount} layanan
        </div>

      </div>


      <div
        style="
          display:grid;
          grid-template-columns:
            repeat(auto-fit,minmax(240px,1fr));
          gap:12px;
          margin-top:16px;
        "
      >

        ${servicesHtml}

      </div>

    </section>
  `;
}


// ============================================================
// RENDER SERVICE
// ============================================================

function renderService(
  service,
  number
) {

  const unit = Array.isArray(service.units)
    ? service.units[0]
    : service.units;

  const unitName =
    unit && unit.is_active !== false
      ? unit.name
      : "Unit belum tersedia";


  return `
    <div
      style="
        border:1px solid #e5e7eb;
        border-radius:10px;
        padding:14px;
        background:#f8fafc;
      "
    >

      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:10px;
          align-items:flex-start;
        "
      >

        <strong>
          ${escapeHtml(service.name)}
        </strong>

        <span
          class="muted"
          style="font-size:.8rem"
        >
          ${escapeHtml(service.code)}
        </span>

      </div>


      ${
        service.description
          ? `
            <p
              class="muted"
              style="margin:8px 0"
            >
              ${escapeHtml(service.description)}
            </p>
          `
          : ""
      }


      <div
        style="
          margin-top:10px;
          padding-top:8px;
          border-top:1px solid #e5e7eb;
          font-size:.85rem;
        "
      >

        <span class="muted">
          Unit pelayanan:
        </span>

        <strong>
          ${escapeHtml(unitName)}
        </strong>

      </div>

    </div>
  `;
}


// ============================================================
// UI HELPERS
// ============================================================

function setInfo(message) {

  const element = document.getElementById(
    "clusterInfo"
  );

  if (element) {
    element.textContent = message;
  }
}


function showError(message) {

  const container = document.getElementById(
    "clusterContainer"
  );

  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="card">

      <h3 style="margin-top:0">
        Gagal Memuat Data
      </h3>

      <p class="muted">
        ${escapeHtml(message)}
      </p>

      <button
        type="button"
        onclick="reloadClusters()"
        style="max-width:160px"
      >
        Muat Ulang
      </button>

    </div>
  `;

  setInfo("Terjadi kesalahan.");
}


// ============================================================
// RELOAD
// ============================================================

async function reloadClusters() {

  const container = document.getElementById(
    "clusterContainer"
  );

  if (container) {

    container.innerHTML = `
      <div class="card">
        <p class="muted">
          Memuat ulang data klaster...
        </p>
      </div>
    `;
  }

  await loadClusters();
}


// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
