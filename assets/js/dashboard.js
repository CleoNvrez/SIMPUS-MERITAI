// SIMPUS MERITAI — Fresh Start V2 Dashboard

(async () => {

  const result = await loadMyProfile();

  if (!result) {
    return;
  }

  const {
    session,
    profile
  } = result;


  const email =
    document.getElementById("userEmail");

  const name =
    document.getElementById("userName");

  const role =
    document.getElementById("userRole");


  if (email) {
    email.textContent =
      session.user.email || "";
  }


  if (name) {
    name.textContent =
      profile.display_name ||
      session.user.email ||
      "";
  }


  if (role) {
    role.textContent =
      profile.system_role ||
      "-";
  }

})();
