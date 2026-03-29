const SUPABASE_URL = "https://bkpevbxfximqsjwtsywy.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrcGV2YnhmeGltcXNqd3RzeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MDA4MjIsImV4cCI6MjA5MDM3NjgyMn0.x_8hcW6saHiiwkeNuqxDZOcAvcuyppJocu0PsvKTJc8";
const REST_URL = `${SUPABASE_URL}/rest/v1`;
const AUTH_URL = `${SUPABASE_URL}/auth/v1`;

let accessToken = null;
let currentUser = null;
let todos = [];

function authHeaders() {
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    };
}

// ---- Auth ----

const authScreen = document.getElementById("auth-screen");
const appScreen = document.getElementById("app-screen");
const authMessage = document.getElementById("auth-message");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const tabs = document.querySelectorAll(".tab");

tabs.forEach(tab => {
    tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        const isLogin = tab.dataset.tab === "login";
        loginForm.hidden = !isLogin;
        signupForm.hidden = isLogin;
        authMessage.hidden = true;
    });
});

function showMessage(text, type) {
    authMessage.textContent = text;
    authMessage.className = `auth-message ${type}`;
    authMessage.hidden = false;
}

signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const btn = signupForm.querySelector("button");
    btn.disabled = true;

    const res = await fetch(`${AUTH_URL}/signup`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    btn.disabled = false;

    if (data.error || data.msg) {
        showMessage(data.error?.message || data.msg || "Bir hata oluştu", "error");
    } else {
        showMessage("Kayıt başarılı! E-postanı kontrol et ve onay linkine tıkla.", "success");
        signupForm.reset();
    }
});

loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const btn = loginForm.querySelector("button");
    btn.disabled = true;

    const res = await fetch(`${AUTH_URL}/token?grant_type=password`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    btn.disabled = false;

    if (data.error || data.error_description) {
        const msg = data.error_description || data.error?.message || "Giriş başarısız";
        showMessage(msg === "Email not confirmed" ? "E-postan henüz onaylanmamış. Gelen kutunu kontrol et." : msg, "error");
    } else {
        localStorage.setItem("sb_session", JSON.stringify(data));
        startSession(data);
    }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
    await fetch(`${AUTH_URL}/logout`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${accessToken}` }
    });
    localStorage.removeItem("sb_session");
    accessToken = null;
    currentUser = null;
    authScreen.hidden = false;
    appScreen.hidden = true;
    loginForm.reset();
    authMessage.hidden = true;
});

function startSession(session) {
    accessToken = session.access_token;
    currentUser = session.user;
    document.getElementById("user-email").textContent = currentUser.email;
    authScreen.hidden = true;
    appScreen.hidden = false;
    fetchTodos();
}

async function refreshSession(session) {
    const res = await fetch(`${AUTH_URL}/token?grant_type=refresh_token`, {
        method: "POST",
        headers: { "apikey": SUPABASE_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    if (res.ok) {
        const data = await res.json();
        localStorage.setItem("sb_session", JSON.stringify(data));
        return data;
    }
    return null;
}

// ---- Todos ----

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");

async function fetchTodos() {
    const res = await fetch(`${REST_URL}/todos?order=created_at.asc`, { headers: authHeaders() });
    todos = await res.json();
    render();
}

async function addTodo(text) {
    const res = await fetch(`${REST_URL}/todos`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ text, done: false, user_id: currentUser.id })
    });
    const [todo] = await res.json();
    todos.push(todo);
    render();
}

async function updateTodo(id, updates) {
    await fetch(`${REST_URL}/todos?id=eq.${id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(updates)
    });
}

async function deleteTodo(id) {
    await fetch(`${REST_URL}/todos?id=eq.${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });
}

function render() {
    list.innerHTML = "";
    todos.forEach((todo, i) => {
        const li = document.createElement("li");
        li.className = "todo-item" + (todo.done ? " done" : "");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.done;
        checkbox.addEventListener("change", async () => {
            todos[i].done = checkbox.checked;
            render();
            await updateTodo(todo.id, { done: checkbox.checked });
        });

        const span = document.createElement("span");
        span.textContent = todo.text;
        span.addEventListener("dblclick", () => startEdit(li, i));

        const editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.textContent = "\u270E";
        editBtn.addEventListener("click", () => startEdit(li, i));

        const del = document.createElement("button");
        del.className = "delete-btn";
        del.textContent = "\u00d7";
        del.addEventListener("click", async () => {
            todos.splice(i, 1);
            render();
            await deleteTodo(todo.id);
        });

        li.append(checkbox, span, editBtn, del);
        list.appendChild(li);
    });
}

function startEdit(li, i) {
    li.innerHTML = "";
    li.className = "todo-item editing";

    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "edit-input";
    editInput.value = todos[i].text;

    const saveBtn = document.createElement("button");
    saveBtn.className = "save-btn";
    saveBtn.textContent = "Kaydet";

    async function saveEdit() {
        const newText = editInput.value.trim();
        if (newText) {
            todos[i].text = newText;
            await updateTodo(todos[i].id, { text: newText });
        }
        render();
    }

    saveBtn.addEventListener("click", saveEdit);
    editInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveEdit();
        if (e.key === "Escape") render();
    });

    li.append(editInput, saveBtn);
    editInput.focus();
    editInput.select();
}

form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addTodo(text);
});

// ---- Handle email confirm redirect ----

function handleAuthRedirect() {
    const hash = window.location.hash;
    if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash.substring(1));
        const access = params.get("access_token");
        const refresh = params.get("refresh_token");
        if (access) {
            // Fetch user info and start session
            fetch(`${AUTH_URL}/user`, {
                headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${access}` }
            }).then(r => r.json()).then(user => {
                const session = { access_token: access, refresh_token: refresh, user };
                localStorage.setItem("sb_session", JSON.stringify(session));
                window.location.hash = "";
                startSession(session);
            });
            return true;
        }
    }
    return false;
}

// ---- Init ----

(async function init() {
    if (handleAuthRedirect()) return;

    const saved = localStorage.getItem("sb_session");
    if (saved) {
        let session = JSON.parse(saved);
        const refreshed = await refreshSession(session);
        if (refreshed) {
            startSession(refreshed);
        } else {
            localStorage.removeItem("sb_session");
        }
    }
})();
