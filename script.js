// 1. Инициализируем данные и настройки темы
let data = JSON.parse(localStorage.getItem('myFinanceDataPRO_V2')) || {
    transactions: [],
    goals: [],
    debts: []
};

let currentTheme = localStorage.getItem('financeTheme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

const today = new Date();
document.getElementById('view-month').value = today.getMonth();
document.getElementById('view-year').value = today.getFullYear();
document.getElementById('tx-date').valueAsDate = today;
document.getElementById('debt-date').valueAsDate = today;

let calendar = null;

function saveData() {
    localStorage.setItem('myFinanceDataPRO_V2', JSON.stringify(data));
    render();
    if (document.getElementById('calendar-screen').classList.contains('active')) {
        initCalendar();
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('financeTheme', currentTheme);
}

function changeViewMonth() {
    render();
    if (document.getElementById('calendar-screen').classList.contains('active')) {
        initCalendar();
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabId === 'calendar-screen') {
        initCalendar();
    }
}

function toggleCategoryStyle() {
    const type = document.getElementById('tx-type').value;
    const catSelect = document.getElementById('tx-category');
    if (type === 'income') catSelect.value = '💼 Доход';
    else if (catSelect.value === '💼 Доход') catSelect.value = '🛠️ Другое';
}

function deleteItem(dataType, id) {
    data[dataType] = data[dataType].filter(item => item.id !== id);
    saveData();
}

// НОВЫЙ БЛОК: Отслеживание нажатия Enter в зависимости от открытого экрана
window.addEventListener('keydown', function(event) {
    // Проверяем, что нажата именно клавиша Enter
    if (event.key === 'Enter') {
        
        // 1. Если мы на экране "Операции"
        const txScreen = document.getElementById('transactions-screen');
        if (txScreen && txScreen.classList.contains('active')) {
            addTransaction();
        }
        
        // 2. Если мы на экране "Цели"
        const goalsScreen = document.getElementById('goals-screen');
        if (goalsScreen && goalsScreen.classList.contains('active')) {
            addGoal();
        }
        
        // 3. Если мы на экране "Долги"
        const debtsScreen = document.getElementById('debts-screen');
        if (debtsScreen && debtsScreen.classList.contains('active')) {
            addDebt();
        }
    }
});
function addTransaction() {
    const amountInput = document.getElementById('tx-amount');
    const descInput = document.getElementById('tx-desc');
    const categoryInput = document.getElementById('tx-category');
    const typeInput = document.getElementById('tx-type');
    const dateInput = document.getElementById('tx-date');

    const amount = parseFloat(amountInput.value);
    const desc = descInput.value ? descInput.value.trim() : '';
    const category = categoryInput ? categoryInput.value : '🛠️ Другое';
    const type = typeInput ? typeInput.value : 'expense';
    let date = dateInput ? dateInput.value : '';

    if (!date) {
        date = new Date().toISOString().split('T')[0];
    }

    if (!amount || amount <= 0 || !desc) {
        alert('Пожалуйста, заполните сумму и описание операции!');
        return;
    }

    data.transactions.push({ id: Date.now(), amount, desc, category, type, date });
    amountInput.value = '';
    descInput.value = '';
    saveData();
}
function addGoal() {
    const nameInput = document.getElementById('goal-name');
    const targetInput = document.getElementById('goal-target');
    const currentInput = document.getElementById('goal-current');

    const name = nameInput.value ? nameInput.value.trim() : '';
    const target = parseFloat(targetInput.value);
    const current = parseFloat(currentInput.value) || 0;

    if (!name || !target || target <= 0) {
        alert('Укажите название и стоимость цели.');
        return;
    }

    data.goals.push({ id: Date.now(), name, target, current });
    nameInput.value = '';
    targetInput.value = '';
    currentInput.value = '0';
    saveData();
}

function depositToGoal(id) {
    const depositAmount = parseFloat(prompt('Сколько добавить к цели?'));
    if (!depositAmount || depositAmount <= 0) return;

    const goal = data.goals.find(g => g.id === id);
    if (goal) {
        goal.current += depositAmount;
        if (goal.current > goal.target) goal.current = goal.target;
        saveData();
    }
}

function editGoal(id) {
    const goal = data.goals.find(g => g.id === id);
    if (!goal) return;

    const newName = prompt('Новое название цели:', goal.name);
    if (newName === null) return;

    const newTarget = parseFloat(prompt('Новая полная стоимость цели (₽):', goal.target));
    if (isNaN(newTarget) || newTarget <= 0) {
        alert('Введена некорректная стоимость.');
        return;
    }

    const newCurrent = parseFloat(prompt('Сколько УЖЕ накоплено (₽):', goal.current));
    if (isNaN(newCurrent) || newCurrent < 0) {
        alert('Введена некорректная сумма накоплений.');
        return;
    }

    goal.name = newName.trim() || goal.name;
    goal.target = newTarget;
    goal.current = Math.min(newCurrent, newTarget);
    saveData();
}

function addDebt() {
    const nameInput = document.getElementById('debt-name');
    const amountInput = document.getElementById('debt-amount');
    const typeInput = document.getElementById('debt-type');
    const dateInput = document.getElementById('debt-date');

    const name = nameInput.value ? nameInput.value.trim() : '';
    const amount = parseFloat(amountInput.value);
    const type = typeInput ? typeInput.value : 'i-owe';
    
    // ТЕПЕРЬ ТУТ: Если дата не выбрана, оставляем поле пустым (без автоподстановки)
    let date = dateInput ? dateInput.value : ''; 

    if (!name || !amount || amount <= 0) {
        alert('Укажите имя и сумму долга!');
        return;
    }

    data.debts.push({ id: Date.now(), name, amount, type, date });
    nameInput.value = '';
    amountInput.value = '';
    dateInput.value = ''; // Очищаем поле даты
    saveData();
}

function editDebt(id) {
    const debt = data.debts.find(d => d.id === id);
    if (!debt) return;

    const newName = prompt('Изменить имя человека:', debt.name);
    if (newName === null) return;

    const newAmount = parseFloat(prompt('Изменить сумму долга (₽):', debt.amount));
    if (isNaN(newAmount) || newAmount <= 0) {
        alert('Введена некорректная сумма.');
        return;
    }

    const newDate = prompt('Изменить дату (формат ГГГГ-ММ-ДД или оставьте пустым для бессрочного):', debt.date);
    if (newDate === null) return;

    debt.name = newName.trim() || debt.name;
    debt.amount = newAmount;
    debt.date = newDate.trim();
    saveData();
}

function addGoal() {
    const nameInput = document.getElementById('goal-name');
    const targetInput = document.getElementById('goal-target');
    const currentInput = document.getElementById('goal-current');

    const name = nameInput.value ? nameInput.value.trim() : '';
    const target = parseFloat(targetInput.value);
    const current = parseFloat(currentInput.value) || 0;

    if (!name || !target || target <= 0) {
        alert('Укажите название и стоимость цели.');
        return;
    }

    data.goals.push({ id: Date.now(), name, target, current });
    nameInput.value = '';
    targetInput.value = '';
    currentInput.value = '0';
    saveData();
}

function depositToGoal(id) {
    const depositAmount = parseFloat(prompt('Сколько добавить к цели?'));
    if (!depositAmount || depositAmount <= 0) return;

    const goal = data.goals.find(g => g.id === id);
    if (goal) {
        goal.current += depositAmount;
        if (goal.current > goal.target) goal.current = goal.target;
        saveData();
    }
}

function editGoal(id) {
    const goal = data.goals.find(g => g.id === id);
    if (!goal) return;

    const newName = prompt('Новое название цели:', goal.name);
    if (newName === null) return;

    const newTarget = parseFloat(prompt('Новая полная стоимость цели (₽):', goal.target));
    if (isNaN(newTarget) || newTarget <= 0) {
        alert('Введена некорректная стоимость.');
        return;
    }

    const newCurrent = parseFloat(prompt('Сколько УЖЕ накоплено (₽):', goal.current));
    if (isNaN(newCurrent) || newCurrent < 0) {
        alert('Введена некорректная сумма накоплений.');
        return;
    }

    goal.name = newName.trim() || goal.name;
    goal.target = newTarget;
    goal.current = Math.min(newCurrent, newTarget);
    saveData();
}

function addDebt() {
    const nameInput = document.getElementById('debt-name');
    const amountInput = document.getElementById('debt-amount');
    const typeInput = document.getElementById('debt-type');
    const dateInput = document.getElementById('debt-date');

    const name = nameInput.value ? nameInput.value.trim() : '';
    const amount = parseFloat(amountInput.value);
    const type = typeInput ? typeInput.value : 'i-owe';
    let date = dateInput ? dateInput.value : '';

    if (!date) {
        date = new Date().toISOString().split('T');
    }

    if (!name || !amount || amount <= 0) {
        alert('Укажите имя и сумму долга!');
        return;
    }

    data.debts.push({ id: Date.now(), name, amount, type, date });
    nameInput.value = '';
    amountInput.value = '';
    saveData();
}

function editDebt(id) {
    const debt = data.debts.find(d => d.id === id);
    if (!debt) return;

    const newName = prompt('Изменить имя человека:', debt.name);
    if (newName === null) return;

    const newAmount = parseFloat(prompt('Изменить сумму долга (₽):', debt.amount));
    if (isNaN(newAmount) || newAmount <= 0) {
        alert('Введена некорректная сумма.');
        return;
    }

    const newDate = prompt('Изменить дату (формат ГГГГ-ММ-ДД):', debt.date);
    if (newDate === null) return;

    debt.name = newName.trim() || debt.name;
    debt.amount = newAmount;
    debt.date = newDate || debt.date;
    saveData();
}
function render() {
    const selectedMonth = parseInt(document.getElementById('view-month').value);
    const selectedYear = parseInt(document.getElementById('view-year').value);

    let monthBalance = 0;
    
    // 1. ТРАНЗАКЦИИ фильтруем по выбранному месяцу и году
    const filteredTx = data.transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
    });

    // 2. ДОЛГИ для баланса фильтруем по выбранному месяцу (чтобы баланс месяца был точным)
    const currentMonthDebts = data.debts.filter(d => {
        const dDate = new Date(d.date);
        return dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear;
    });

    // 3. Считаем баланс операций (Доходы минус Расходы за месяц)
    filteredTx.forEach(t => monthBalance += t.type === 'income' ? t.amount : -t.amount);

    // 4. Корректируем баланс месяца с учетом долгов текущего месяца
    currentMonthDebts.forEach(d => {
        if (d.type === 'i-owe') {
            monthBalance -= d.amount;
        } else if (d.type === 'me-owe') {
            monthBalance += d.amount;
        }
    });
    
    const balanceEl = document.getElementById('total-balance');
    balanceEl.innerText = `${monthBalance.toLocaleString()} ₽`;
    balanceEl.style.color = monthBalance >= 0 ? 'var(--green)' : 'var(--red)';

    // Вывод операций за выбранный месяц
    const txList = document.getElementById('tx-list');
    if (filteredTx.length === 0) {
        txList.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">В этом месяце нет операций</div>';
    } else {
        txList.innerHTML = filteredTx.map(t => `
            <div class="list-item">
                <div>
                    <span class="category-tag">${t.category}</span>
                    <strong>${t.desc}</strong> <span style="font-size:11px; color:var(--text-muted)">(${t.date.split('-').reverse().slice(0,2).join('.')})</span>
                </div>
                <span style="color: ${t.type === 'income' ? 'var(--green)' : 'var(--red)'}; font-weight:600;">
                    ${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()} ₽
                    <button class="delete-btn" onclick="deleteItem('transactions', ${t.id})">✕</button>
                </span>
            </div>
        `).join('');
    }

    // Вывод целей (ОТОБРАЖАЮТСЯ ВСЕГДА, без фильтрации)
    const goalsList = document.getElementById('goals-list');
    if (data.goals.length === 0) {
        goalsList.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">Нет целей</div>';
    } else {
        goalsList.innerHTML = data.goals.map(g => {
            const pct = Math.min((g.current / g.target) * 100, 100).toFixed(0);
            return `
                <div class="goal-container">
                    <div class="goal-info">
                        <span><strong>${g.name}</strong></span>
                        <span style="color:var(--text-muted); font-size:13px;">${g.current.toLocaleString()} / ${g.target.toLocaleString()} ₽ (${pct}%)</span>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div>
                    <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:8px;">
                        <span style="cursor:pointer; color:var(--accent); font-size:12px; font-weight:600;" onclick="depositToGoal(${g.id})">Пополнить</span>
                        <span style="cursor:pointer; color:var(--accent); font-size:12px;" onclick="editGoal(${g.id})">Изм.</span>
                        <span style="cursor:pointer; color:var(--text-muted); font-size:12px;" onclick="deleteItem('goals', ${g.id})">Удалить</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Вывод долгов (ТЕПЕРЬ ОТОБРАЖАЮТСЯ ВСЕГДА, без фильтрации по месяцам)
    const debtsList = document.getElementById('debts-list');
    if (data.debts.length === 0) {
        debtsList.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">Нет долгов</div>';
    } else {
        // Сортируем долги по дате, чтобы ближайшие были сверху
        const sortedDebts = [...data.debts].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        debtsList.innerHTML = sortedDebts.map(d => {
            // Красиво форматируем дату для отображения (ДД.ММ.ГГГГ)
            const dateParts = d.date.split('-');
            const formattedDate = dateParts.length === 3 ? `${dateParts[2]}.${dateParts[1]}.${dateParts[0]}` : d.date;

            return `
                <div class="list-item">
                    <span>
                        <span style="color:${d.type === 'i-owe' ? 'var(--red)' : 'var(--green)'}; font-weight:600;">
                            ${d.type === 'i-owe' ? 'Я должен' : 'Мне должны'}
                        </span> — <strong>${d.name}</strong> 
                        <span style="font-size:11px; color:var(--text-muted)"> (срок: ${formattedDate})</span>
                    </span>
                    <span style="font-weight:600;">
                        ${d.amount.toLocaleString()} ₽
                        <button style="width:auto; display:inline-block; padding:2px 6px; font-size:11px; margin-left:5px; background:var(--tab-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:4px; cursor:pointer;" onclick="editDebt(${d.id})">Изм.</button>
                        <button class="delete-btn" onclick="deleteItem('debts', ${d.id})">✕</button>
                    </span>
                </div>
            `;
        }).join('');
    }
}

function initCalendar() {
    const calendarEl = document.getElementById('custom-calendar');
    const selectedMonth = parseInt(document.getElementById('view-month').value);
    const selectedYear = parseInt(document.getElementById('view-year').value);

    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('calendar-title').innerText = `📅 Календарь запланированных трат: ${monthNames[selectedMonth]} ${selectedYear}`;

    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    let html = '<div class="calendar-grid">';
    weekdays.forEach(day => html += `<div class="calendar-weekday">${day}</div>`);

    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const shiftIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    for (let i = 0; i < shiftIndex; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const currentM = String(selectedMonth + 1).padStart(2, '0');
        const currentD = String(day).padStart(2, '0');
        const dateStr = `${selectedYear}-${currentM}-${currentD}`;

        const dayTx = data.transactions.filter(t => t.date === dateStr);
        const dayDebts = data.debts.filter(d => d.date === dateStr);

        let eventsHtml = '<div class="calendar-events-container">';
        dayTx.forEach(t => {
            eventsHtml += `<div class="cal-event-badge ${t.type}">${t.type === 'income' ? '+' : '-'}${t.amount} ${t.desc}</div>`;
        });
        dayDebts.forEach(d => {
            eventsHtml += `<div class="cal-event-badge debt">🤝 ${d.amount} (${d.name})</div>`;
        });
        eventsHtml += '</div>';

        html += `
            <div class="calendar-day">
                <div class="calendar-day-number">${day}</div>
                ${eventsHtml}
            </div>
        `;
    }

    html += '</div>';
    calendarEl.innerHTML = html;
}

function render() {
    const selectedMonth = parseInt(document.getElementById('view-month').value);
    const selectedYear = parseInt(document.getElementById('view-year').value);

    let monthBalance = 0;
    let grossIncome = 0; // Переменная для подсчета общего дохода
    
    // 1. Транзакции месяца
    const filteredTx = data.transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
    });

    // 2. ДОЛГИ ДЛЯ БАЛАНСА: Считаем только те, у которых есть дата И она совпадает с текущим месяцем
    const currentMonthDebts = data.debts.filter(d => {
        if (!d.date) return false; // Бессрочные долги пропускаем, они не идут в баланс
        const dDate = new Date(d.date);
        return dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear;
    });

    // 3. Считаем баланс операций и отдельно суммируем весь «грязный» доход
    filteredTx.forEach(t => {
        if (t.type === 'income') {
            monthBalance += t.amount;
            grossIncome += t.amount; // Прибавляем к общему доходу
        } else {
            monthBalance -= t.amount;
        }
    });

    // 4. Корректируем баланс чистых денег с учетом долгов текущего месяца
    currentMonthDebts.forEach(d => {
        if (d.type === 'i-owe') {
            monthBalance -= d.amount; // Если я должен — вычитаем из чистых денег
        } else if (d.type === 'me-owe') {
            monthBalance += d.amount; // Если мне должны — прибавляем к чистым деньгам
            grossIncome += d.amount;  // Долг, который вернут нам, также увеличивает общую прибыль
        }
    });
    
    // Выводим общий доход
    const incomeEl = document.getElementById('total-income');
    if (incomeEl) {
        incomeEl.innerText = `${grossIncome.toLocaleString()} ₽`;
    }

    // Выводим чистый баланс
    const balanceEl = document.getElementById('total-balance');
    balanceEl.innerText = `${monthBalance.toLocaleString()} ₽`;
    balanceEl.style.color = monthBalance >= 0 ? 'var(--green)' : 'var(--red)';

    // Вывод операций за выбранный месяц
    const txList = document.getElementById('tx-list');
    if (filteredTx.length === 0) {
        txList.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">В этом месяце нет операций</div>';
    } else {
        txList.innerHTML = filteredTx.map(t => `
            <div class="list-item">
                <div>
                    <span class="category-tag">${t.category}</span>
                    <strong>${t.desc}</strong> <span style="font-size:11px; color:var(--text-muted)">(${t.date.split('-').reverse().slice(0,2).join('.')})</span>
                </div>
                <span style="color: ${t.type === 'income' ? 'var(--green)' : 'var(--red)'}; font-weight:600;">
                    ${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()} ₽
                    <button class="delete-btn" onclick="deleteItem('transactions', ${t.id})">✕</button>
                </span>
            </div>
        `).join('');
    }

    // Вывод целей (ОТОБРАЖАЮТСЯ ВСЕГДА)
    const goalsList = document.getElementById('goals-list');
    if (data.goals.length === 0) {
        goalsList.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">Нет целей</div>';
    } else {
        goalsList.innerHTML = data.goals.map(g => {
            const pct = Math.min((g.current / g.target) * 100, 100).toFixed(0);
            return `
                <div class="goal-container">
                    <div class="goal-info">
                        <span><strong>${g.name}</strong></span>
                        <span style="color:var(--text-muted); font-size:13px;">${g.current.toLocaleString()} / ${g.target.toLocaleString()} ₽ (${pct}%)</span>
                    </div>
                    <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%"></div></div>
                    <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:8px;">
                        <span style="cursor:pointer; color:var(--accent); font-size:12px; font-weight:600;" onclick="depositToGoal(${g.id})">Пополнить</span>
                        <span style="cursor:pointer; color:var(--accent); font-size:12px;" onclick="editGoal(${g.id})">Изм.</span>
                        <span style="cursor:pointer; color:var(--text-muted); font-size:12px;" onclick="deleteItem('goals', ${g.id})">Удалить</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Вывод долгов (ОТОБРАЖАЮТСЯ ВСЕГДА)
    const debtsList = document.getElementById('debts-list');
    if (data.debts.length === 0) {
        debtsList.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">Нет долгов</div>';
    } else {
        const sortedDebts = [...data.debts].sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            return new Date(a.date) - new Date(b.date);
        });
        
        debtsList.innerHTML = sortedDebts.map(d => {
            let dateText = '';
            if (d.date) {
                const dateParts = d.date.split('-');
                dateText = `(срок: ${dateParts[2]}.${dateParts[1]}.${dateParts[0]})`;
            } else {
                dateText = `<span style="color:var(--accent); font-weight:500;">(бессрочно)</span>`;
            }

            return `
                <div class="list-item">
                    <span>
                        <span style="color:${d.type === 'i-owe' ? 'var(--red)' : 'var(--green)'}; font-weight:600;">
                            ${d.type === 'i-owe' ? 'Я должен' : 'Мне должны'}
                        </span> — <strong>${d.name}</strong> 
                        <span style="font-size:11px; color:var(--text-muted)"> ${dateText}</span>
                    </span>
                    <span style="font-weight:600;">
                        ${d.amount.toLocaleString()} ₽
                        <button style="width:auto; display:inline-block; padding:2px 6px; font-size:11px; margin-left:5px; background:var(--tab-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:4px; cursor:pointer;" onclick="editDebt(${d.id})">Изм.</button>
                        <button class="delete-btn" onclick="deleteItem('debts', ${d.id})">✕</button>
                    </span>
                </div>
            `;
        }).join('');
    }
}

function initCalendar() {
    const calendarEl = document.getElementById('custom-calendar');
    const selectedMonth = parseInt(document.getElementById('view-month').value);
    const selectedYear = parseInt(document.getElementById('view-year').value);

    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('calendar-title').innerText = `📅 Календарь запланированных трат: ${monthNames[selectedMonth]} ${selectedYear}`;

    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    let html = '<div class="calendar-grid">';
    weekdays.forEach(day => html += `<div class="calendar-weekday">${day}</div>`);

    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const shiftIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    for (let i = 0; i < shiftIndex; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const currentM = String(selectedMonth + 1).padStart(2, '0');
        const currentD = String(day).padStart(2, '0');
        const dateStr = `${selectedYear}-${currentM}-${currentD}`;

        const dayTx = data.transactions.filter(t => t.date === dateStr);
        const dayDebts = data.debts.filter(d => d.date === dateStr);

        let eventsHtml = '<div class="calendar-events-container">';
        dayTx.forEach(t => {
            eventsHtml += `<div class="cal-event-badge ${t.type}">${t.type === 'income' ? '+' : '-'}${t.amount} ${t.desc}</div>`;
        });
        dayDebts.forEach(d => {
            eventsHtml += `<div class="cal-event-badge debt">🤝 ${d.amount} (${d.name})</div>`;
        });
        eventsHtml += '</div>';

        html += `
            <div class="calendar-day">
                <div class="calendar-day-number">${day}</div>
                ${eventsHtml}
            </div>
        `;
    }

    html += '</div>';
    calendarEl.innerHTML = html;
}

render();