document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const msg = document.getElementById("msg");

  msg.textContent = "Memproses...";

  const { error } = await sb.auth.signInWithPassword({ email, password });

  if (error) {
    msg.textContent = error.message;
    return;
  }

  window.location.href = "dashboard.html";
});
