// Selectors
const todoForm = document.getElementById('todo-form');
const toDoInput = document.querySelector('.todo-input');
const todoCategory = document.querySelector('.todo-category');
const todoPriority = document.querySelector('.todo-priority');
const todoDueDate = document.querySelector('.todo-due-date');
const todoDueTime = document.querySelector('.todo-due-time');
const listSection = document.getElementById('list-section');

const pendingList = document.getElementById('pending-list');
const expiredList = document.getElementById('expired-list');
const completedList = document.getElementById('completed-list');

const pendingSection = document.getElementById('pending-section');
const expiredSection = document.getElementById('expired-section');
const completedSection = document.getElementById('completed-section');

const searchInput = document.getElementById('search-input');
const filterTodo = document.getElementById('filter-todo');
const emptyState = document.getElementById('empty-state');

const standardTheme = document.querySelector('.standard-theme');
const lightTheme = document.querySelector('.light-theme');
const darkerTheme = document.querySelector('.darker-theme');

// Event Listeners
document.addEventListener("DOMContentLoaded", initializeApp);
todoForm.addEventListener('submit', addToDo);
listSection.addEventListener('click', deleteOrCheck);
searchInput.addEventListener('input', filterTasks);
filterTodo.addEventListener('change', filterTasks);

standardTheme.addEventListener('click', () => changeTheme('standard'));
lightTheme.addEventListener('click', () => changeTheme('light'));
darkerTheme.addEventListener('click', () => changeTheme('darker'));

// Global Tasks Array
let tasks = [];
let savedTheme = localStorage.getItem('savedTheme') || 'standard';

// Functions
function initializeApp() {
    changeTheme(savedTheme);
    loadTodos();

    // Smart auto-refresh every second to catch expirations exactly when they happen without reloading
    setInterval(() => {
        let needsUpdate = false;
        const now = new Date();

        tasks.forEach(task => {
            if (!task.completed && task.dueDate) {
                let dateTimeStr = task.dueDate;
                dateTimeStr += task.dueTime ? 'T' + task.dueTime : 'T23:59:59';
                const taskDeadline = new Date(dateTimeStr);
                const isCurrentlyExpired = (taskDeadline < now);

                // If the dynamic expiration state changed since last render, trigger a visual update
                if (task._isExpired !== isCurrentlyExpired) {
                    needsUpdate = true;
                }
            }
        });

        if (needsUpdate) {
            renderTasks();
        }
    }, 1000);

    // Show tooltip on load, then hide it
    const tooltip = document.getElementById('task-tooltip');
    if (tooltip) {
        setTimeout(() => tooltip.classList.add('show-tooltip'), 500);
        setTimeout(() => tooltip.classList.remove('show-tooltip'), 4000); // vanishes after roughly 3-4s
    }
}

function showToast(message, type = 'error') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.classList.add('toast', `toast-${type}`);
    toast.innerHTML = `
        <i class="fas ${type === 'error' ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10);

    setTimeout(() => {
        toast.classList.remove('show');
        toast.addEventListener('transitionend', () => toast.remove());
    }, 3000);
}

function generateId() {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function addToDo(event) {
    event.preventDefault();

    const title = toDoInput.value.trim();
    const category = todoCategory.value;
    const priority = todoPriority.value;
    const dueDate = todoDueDate.value;
    const dueTime = todoDueTime.value;

    if (!title) {
        showToast("Task title cannot be empty!");
        return;
    }
    if (!category) {
        showToast("Please select a category.");
        return;
    }
    if (!priority) {
        showToast("Please select a priority.");
        return;
    }

    const newTask = {
        id: generateId(),
        title: title,
        category: category,
        priority: priority,
        dueDate: dueDate,
        dueTime: dueTime,
        completed: false
    };

    tasks.push(newTask);
    saveLocalTodos();

    toDoInput.value = '';
    todoCategory.value = '';
    todoPriority.value = '';
    todoDueDate.value = '';
    todoDueTime.value = '';

    renderTasks();
    showToast("Task added successfully!", "success");
}

function deleteOrCheck(event) {
    const item = event.target;
    const todoDiv = item.closest('.todo');
    if (!todoDiv) return;

    const taskId = todoDiv.dataset.id;
    const taskIndex = tasks.findIndex(t => t.id === taskId);

    if (item.closest('.delete-btn')) {
        todoDiv.classList.add("fall");
        todoDiv.addEventListener('transitionend', function () {
            tasks.splice(taskIndex, 1);
            saveLocalTodos();
            renderTasks();
            showToast("Task deleted.", "success");
        });
    }

    if (item.closest('.check-btn')) {
        tasks[taskIndex].completed = !tasks[taskIndex].completed;
        saveLocalTodos();
        renderTasks();
    }
}

function renderTasks() {
    pendingList.innerHTML = '';
    expiredList.innerHTML = '';
    completedList.innerHTML = '';

    let filteredTasks = tasks;
    const searchTerm = searchInput.value.toLowerCase();
    const filterStatus = filterTodo.value;

    if (searchTerm) {
        filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(searchTerm) || t.category.toLowerCase().includes(searchTerm));
    }

    if (filterStatus === 'completed') {
        filteredTasks = filteredTasks.filter(t => t.completed);
    } else if (filterStatus === 'uncompleted') {
        filteredTasks = filteredTasks.filter(t => !t.completed);
    }

    if (filteredTasks.length === 0) {
        emptyState.style.display = 'flex';
        pendingSection.style.display = 'none';
        expiredSection.style.display = 'none';
        completedSection.style.display = 'none';
    } else {
        emptyState.style.display = 'none';

        let pendingCount = 0;
        let expiredCount = 0;
        let completedCount = 0;

        const now = new Date();

        filteredTasks.forEach(task => {
            const toDoDiv = document.createElement("div");
            toDoDiv.classList.add('todo', `${savedTheme}-todo`);
            if (task.completed) toDoDiv.classList.add('completed');
            toDoDiv.dataset.id = task.id;

            const contentDiv = document.createElement("div");
            contentDiv.classList.add('todo-content');

            const titleEl = document.createElement('li');
            titleEl.innerText = task.title;
            titleEl.classList.add('todo-item');

            const metaDiv = document.createElement('div');
            metaDiv.classList.add('todo-meta');

            let dateHtml = '';
            if (task.dueDate) {
                const dateStr = new Date(task.dueDate).toLocaleDateString();
                const timeStr = task.dueTime ? `\u00A0@\u00A0${task.dueTime}` : '';
                dateHtml = `<span class="badge date-badge"><i class="far fa-calendar-alt"></i> ${dateStr}${timeStr}</span>`;
            }

            metaDiv.innerHTML = `
                <span class="badge category-badge">${task.category}</span>
                <span class="badge priority-${task.priority.toLowerCase()}">${task.priority}</span>
                ${dateHtml}
            `;

            contentDiv.appendChild(titleEl);
            contentDiv.appendChild(metaDiv);
            toDoDiv.appendChild(contentDiv);

            const controlsDiv = document.createElement("div");
            controlsDiv.classList.add('todo-controls');

            // Logic to check expiration early so we can adapt the UI
            let isExpired = false;
            if (!task.completed && task.dueDate) {
                let dateTimeStr = task.dueDate;
                if (task.dueTime) {
                    dateTimeStr += 'T' + task.dueTime;
                } else {
                    dateTimeStr += 'T23:59:59';
                }
                const taskDeadline = new Date(dateTimeStr);
                if (taskDeadline < now) {
                    isExpired = true;
                }
            }

            // Store internal state to allow the 1s interval poller to detect changes
            task._isExpired = isExpired;

            // Only append the check button if it's NOT expired
            if (!isExpired) {
                const checked = document.createElement('button');
                checked.innerHTML = '<i class="fas fa-check"></i>';
                checked.classList.add('check-btn', `${savedTheme}-button`);
                controlsDiv.appendChild(checked);
            }

            const deleted = document.createElement('button');
            deleted.innerHTML = '<i class="fas fa-trash"></i>';
            deleted.classList.add('delete-btn', `${savedTheme}-button`);
            controlsDiv.appendChild(deleted);

            toDoDiv.appendChild(controlsDiv);

            if (task.completed) {
                completedList.appendChild(toDoDiv);
                completedCount++;
            } else if (isExpired) {
                toDoDiv.classList.add('expired');
                // We still want expired tasks to be checkable if they complete it late!
                expiredList.appendChild(toDoDiv);
                expiredCount++;
            } else {
                pendingList.appendChild(toDoDiv);
                pendingCount++;
            }
        });

        pendingSection.style.display = pendingCount > 0 ? 'flex' : 'none';
        expiredSection.style.display = expiredCount > 0 ? 'flex' : 'none';
        completedSection.style.display = completedCount > 0 ? 'flex' : 'none';
    }
}

function filterTasks() {
    renderTasks();
}

function loadTodos() {
    let saved = localStorage.getItem('todos');
    if (!saved) {
        tasks = [];
    } else {
        let parsed = JSON.parse(saved);
        tasks = parsed.map(todo => {
            if (typeof todo === 'string') {
                return {
                    id: generateId(),
                    title: todo,
                    category: 'Other',
                    priority: 'Low',
                    dueDate: '',
                    dueTime: '',
                    completed: false
                };
            }
            return todo;
        });
        saveLocalTodos();
    }
    renderTasks();
}

function saveLocalTodos() {
    localStorage.setItem('todos', JSON.stringify(tasks));
}

function changeTheme(color) {
    localStorage.setItem('savedTheme', color);
    savedTheme = localStorage.getItem('savedTheme');
    document.body.className = color;

    color === 'darker' ?
        document.getElementById('title').classList.add('darker-title') :
        document.getElementById('title').classList.remove('darker-title');
}