// SIMPUS MERITAI — Fresh Start V2 Authentication
async function requireSession(){const {data,error}=await sb.auth.getSession();if(error||!data.session){window.location.href="index.html";return null;}return data.session;}
async function loadMyProfile(){const session=await requireSession();if(!session)return null;const {data,error}=await sb.from("security_user_profiles").select("user_id,display_name,employee_number,status,system_role,phone,notes").eq("user_id",session.user.id).maybeSingle();if(error||!data){await sb.auth.signOut();window.location.href="index.html";return null;}if(data.status!=="ACTIVE"){await sb.auth.signOut();window.location.href="index.html";return null;}return {session,profile:data};}
async function logout(){await sb.auth.signOut();window.location.href="index.html";}
