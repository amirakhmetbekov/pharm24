// =====================================================================
// SUPABASE SETUP
// Replace the values below with your project's own credentials:
// Supabase Dashboard -> Project Settings -> API
// =====================================================================
const SUPABASE_URL = "https://smqfjgsdnqhusxvdgbia.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_hJg3cVmf_gs84W6sV0xF9Q_bk5mo0e4";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =====================================================================
// DOM elements
// =====================================================================
const authSection = document.getElementById("auth-section");
const appSection = document.getElementById("app-section");
const userBox = document.getElementById("user-box");
const userEmailEl = document.getElementById("user-email");

const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubmitBtn = document.getElementById("auth-submit-btn");
const authToggleBtn = document.getElementById("auth-toggle-btn");
const authToggleText = document.getElementById("auth-toggle-text");
const authError = document.getElementById("auth-error");

const logoutBtn = document.getElementById("logout-btn");

const addForm = document.getElementById("add-form");
const addNotice = document.getElementById("add-notice");
const haveList = document.getElementById("have-list");
const needList = document.getElementById("need-list");
const haveCount = document.getElementById("have-count");
const needCount = document.getElementById("need-count");

let isRegisterMode = false;

const CATEGORY_LABELS = {
  pain: "Pain relief",
  cold: "Cold & flu",
  antibiotic: "Antibiotic",
  vitamin: "Vitamins",
  first_aid: "First aid / bandages",
  chronic: "Chronic / daily use",
  other: "Other",
};

// =====================================================================
// AUTHENTICATION
// =====================================================================

authToggleBtn.addEventListener("click", () => {
  isRegisterMode = !isRegisterMode;
  authTitle.textContent = isRegisterMode ? "Sign up" : "Log in";
  authSubmitBtn.textContent = isRegisterMode ? "Create account" : "Log in";
  authToggleText.textContent = isRegisterMode ? "Already have an account?" : "No account yet?";
  authToggleBtn.textContent = isRegisterMode ? "Log in" : "Sign up";
  authError.textContent = "";
});

authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.textContent = "";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  authSubmitBtn.disabled = true;

  try {
    if (isRegisterMode) {
      const { error } = await supabaseClient.auth.signUp({ email, password });
      if (error) throw error;
      authError.style.color = "#1f4b43";
      authError.textContent = "Account created! Confirm your email if required, then log in.";
    } else {
      const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
    }
  } catch (err) {
    authError.style.color = "#a13c2a";
    authError.textContent = translateAuthError(err.message);
  } finally {
    authSubmitBtn.disabled = false;
  }
});

logoutBtn.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
});

function translateAuthError(msg) {
  if (msg.includes("Invalid login credentials")) return "Incorrect email or password.";
  if (msg.includes("User already registered")) return "An account with this email already exists.";
  if (msg.includes("Password should be")) return "Password is too short (minimum 6 characters).";
  return msg;
}

// Watch auth session state
supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session) {
    showApp(session.user);
  } else {
    showAuth();
  }
});

function showAuth() {
  authSection.hidden = false;
  appSection.hidden = true;
  userBox.hidden = true;
}

function showApp(user) {
  authSection.hidden = true;
  appSection.hidden = false;
  userBox.hidden = false;
  userEmailEl.textContent = user.email;
  loadMedications();
}

// =====================================================================
// CRUD: MEDICATIONS
// =====================================================================

addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  addNotice.textContent = "";

  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return;

  const name = document.getElementById("m-name").value.trim();
  const category = document.getElementById("m-category").value;
  const quantity = document.getElementById("m-qty").value || null;
  const unit = document.getElementById("m-unit").value.trim() || "pcs";
  const expiry = document.getElementById("m-expiry").value || null;

  if (!name) return;

  // if quantity is 0 or not provided, place it straight into "need to buy"
  const inStock = quantity && Number(quantity) > 0;

  const { error } = await supabaseClient.from("medications").insert({
    user_id: user.id,
    name,
    category,
    quantity,
    unit,
    expiry_date: expiry,
    in_stock: inStock,
  });

  if (error) {
    addNotice.style.color = "#a13c2a";
    addNotice.textContent = "Error: " + error.message;
    return;
  }

  addForm.reset();
  document.getElementById("m-unit").value = "pcs";
  addNotice.style.color = "#6c7268";
  addNotice.textContent = "Added.";
  loadMedications();
});

async function loadMedications() {
  const { data, error } = await supabaseClient
    .from("medications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  renderBoard(data || []);
}

function renderBoard(items) {
  const have = items.filter((m) => m.in_stock);
  const need = items.filter((m) => !m.in_stock);

  haveCount.textContent = `(${have.length})`;
  needCount.textContent = `(${need.length})`;

  haveList.innerHTML = have.length
    ? have.map((m) => medCardHTML(m, true)).join("")
    : `<p class="empty-note">Nothing here yet. Add a medication above.</p>`;

  needList.innerHTML = need.length
    ? need.map((m) => medCardHTML(m, false)).join("")
    : `<p class="empty-note">Everything you need is in stock.</p>`;

  // wire up event handlers
  document.querySelectorAll("[data-move]").forEach((btn) => {
    btn.addEventListener("click", () => toggleStock(btn.dataset.move, btn.dataset.next === "true"));
  });
  document.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteMedication(btn.dataset.delete));
  });
}

function medCardHTML(m, isInStock) {
  const meta = [];
  if (m.quantity) meta.push(`${m.quantity} ${escapeHTML(m.unit || "pcs")}`);
  meta.push(CATEGORY_LABELS[m.category] || "Other");
  if (m.expiry_date) {
    const soon = isExpiringSoon(m.expiry_date);
    meta.push(`<span class="${soon ? "expiry-warn" : ""}">expires ${formatDate(m.expiry_date)}</span>`);
  }

  return `
    <div class="med-card">
      <div class="med-info">
        <p class="med-name">${escapeHTML(m.name)}</p>
        <p class="med-meta">${meta.join(" · ")}</p>
      </div>
      <div class="med-actions">
        <button class="move" data-move="${m.id}" data-next="${!isInStock}">
          ${isInStock ? "Ran out" : "Mark in stock"}
        </button>
        <button class="delete" data-delete="${m.id}">Delete</button>
      </div>
    </div>
  `;
}

async function toggleStock(id, nextValue) {
  const { error } = await supabaseClient
    .from("medications")
    .update({ in_stock: nextValue })
    .eq("id", id);
  if (error) console.error(error);
  loadMedications();
}

async function deleteMedication(id) {
  const { error } = await supabaseClient.from("medications").delete().eq("id", id);
  if (error) console.error(error);
  loadMedications();
}

// =====================================================================
// UTILITIES
// =====================================================================

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function isExpiringSoon(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = (d - now) / (1000 * 60 * 60 * 24);
  return diffDays < 30;
}
