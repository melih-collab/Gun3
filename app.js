const SUPABASE_URL = "https://bkpevbxfximqsjwtsywy.supabase.co/rest/v1";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrcGV2YnhmeGltcXNqd3RzeXd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MDA4MjIsImV4cCI6MjA5MDM3NjgyMn0.x_8hcW6saHiiwkeNuqxDZOcAvcuyppJocu0PsvKTJc8";

const headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
};

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");

let todos = [];

async function fetchTodos() {
    const res = await fetch(`${SUPABASE_URL}/todos?order=created_at.asc`, { headers });
    todos = await res.json();
    render();
}

async function addTodo(text) {
    const res = await fetch(`${SUPABASE_URL}/todos`, {
        method: "POST",
        headers,
        body: JSON.stringify({ text, done: false })
    });
    const [todo] = await res.json();
    todos.push(todo);
    render();
}

async function updateTodo(id, updates) {
    await fetch(`${SUPABASE_URL}/todos?id=eq.${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(updates)
    });
}

async function deleteTodo(id) {
    await fetch(`${SUPABASE_URL}/todos?id=eq.${id}`, {
        method: "DELETE",
        headers
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

fetchTodos();
