const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");

let todos = JSON.parse(localStorage.getItem("todos")) || [];

function save() {
    localStorage.setItem("todos", JSON.stringify(todos));
}

function render() {
    list.innerHTML = "";
    todos.forEach((todo, i) => {
        const li = document.createElement("li");
        li.className = "todo-item" + (todo.done ? " done" : "");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = todo.done;
        checkbox.addEventListener("change", () => {
            todos[i].done = checkbox.checked;
            save();
            render();
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
        del.addEventListener("click", () => {
            todos.splice(i, 1);
            save();
            render();
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

    function saveEdit() {
        const newText = editInput.value.trim();
        if (newText) {
            todos[i].text = newText;
            save();
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
    todos.push({ text, done: false });
    save();
    render();
    input.value = "";
});

render();
