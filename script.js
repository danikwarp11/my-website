// ==========================================
// ЧАСТЬ 1: ИНИЦИАЛИЗАЦИЯ И УПРАВЛЕНИЕ ЭКРАНАМИ
// ==========================================

// Инициализируем локальные данные из хранилища смартфона/ПК
let data = JSON.parse(localStorage.getItem('myFinanceDataPRO_V3')) || {
    transactions: [],
    goals: [],
    debts: []
};

// Настраиваем стартовый месяц: достаем сохраненный или ставим Октябрь 2026 года (индекс 9)
const savedMonth = localStorage.getItem('selectedFinanceMonth');
const viewMonthSelect = document.getElementById('view-month');
const viewYearSelect = document.getElementById('view-year');

if (savedMonth !== null) {
    viewMonthSelect.value = savedMonth;
} else {
    viewMonthSelect.value = "9"; // По умолчанию Октябрь
}
viewYearSelect.value = "2026";   // По умолчанию 2026 год

// Выставляем сегодняшнюю дату в поля ввода для удобства
const today = new Date();
document.getElementById('tx-date').valueAsDate = today;
document.getElementById('debt-date').valueAsDate = today;

// Функция вечного сохранения данных на диск ПК/iPhone
function saveData() {
    localStorage.setItem('myFinanceDataPRO_V3', JSON.stringify(data));
    render();
    if (document.getElementById('calendar-screen').classList.contains('active')) {
        initCalendar();
    }
}

// Запоминаем выбор месяца при переключении пользователем
function changeViewMonth() {
    localStorage.setItem('selectedFinanceMonth', viewMonthSelect.value);
    render();
    if (document.getElementById('calendar-screen').classList.contains('active')) {
        initCalendar();
    }
}

// Переключение вкладок (Таб-бар)
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');

    if (tabId === 'calendar-screen') {
        initCalendar();
    }
}

// Умное авто-переключение категорий доходов/расходов
function toggleCategoryStyle() {
    const type = document.getElementById('tx-type').value;
    const catSelect = document.getElementById('tx-category');
    if (type === 'income') catSelect.value = '💼 Доход';
    else if (catSelect.value === '💼 Доход') catSelect.value = '🛠️ Другое';
}

// Удаление элементов
function deleteItem(dataType, id) {
    data[dataType] = data[dataType].filter(item => item.id !== id);
    saveData();
}

// ==========================================
// ЛОГИКА ОПЕРАЦИЙ И ОБРАБОТКА ENTER
// ==========================================

function addTransaction() {
    const amountInput = document.getElementById('tx-amount');
    const descInput = document.getElementById('tx-desc');
    const categoryInput = document.getElementById('tx-category');
    const dateInput = document.getElementById('tx-date');

    const amount = parseFloat(amountInput.value);
    const desc = descInput.value ? descInput.value.trim() : '';
    const category = categoryInput ? categoryInput.value : '🛠️ Другое';
    
    // АВТО-ОПРЕДЕЛЕНИЕ: если категория Доход — ставим тип income, иначе expense
    const type = (category === '💼 Доход') ? 'income' : 'expense';
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


// Горячая клавиша Enter для мгновенной записи без мышки
window.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        const txScreen = document.getElementById('transactions-screen');
        const goalsScreen = document.getElementById('goals-screen');
        const debtsScreen = document.getElementById('debts-screen');

        if (txScreen && txScreen.classList.contains('active')) addTransaction();
        else if (goalsScreen && goalsScreen.classList.contains('active')) addGoal();
        else if (debtsScreen && debtsScreen.classList.contains('active')) addDebt();
    }
});
// ==========================================
// ЧАСТЬ 2: ЛОГИКА ЦЕЛЕЙ И УЧЕТА ДОЛГОВ
// ==========================================

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
    
    // Если дата пустая — сохраняем пустую строку (бессрочный долг)
    let date = dateInput ? dateInput.value : '';

    if (!name || !amount || amount <= 0) {
        alert('Укажите имя и сумму долга!');
        return;
    }

    data.debts.push({ id: Date.now(), name, amount, type, date });
    nameInput.value = '';
    amountInput.value = '';
    if(dateInput) dateInput.value = '';
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

    const newDate = prompt('Изменить дату (ГГГГ-ММ-ДД или оставьте пустым для бессрочного):', debt.date);
    if (newDate === null) return;

    debt.name = newName.trim() || debt.name;
    debt.amount = newAmount;
    debt.date = newDate.trim();
    saveData();
}
// ==========================================
// ЧАСТЬ 3: РАСЧЕТЫ БАЛАНСА И ГЕНЕРАЦИЯ КАЛЕНДАРЯ
// ==========================================

function render() {
    const selectedMonth = parseInt(document.getElementById('view-month').value);
    const selectedYear = parseInt(document.getElementById('view-year').value);

    let monthBalance = 0;
    let grossIncome = 0;
    
    // Фильтруем транзакции выбранного месяца
    const filteredTx = data.transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
    });

    // Фильтруем ТОЛЬКО срочные долги текущего месяца для баланса
    const currentMonthDebts = data.debts.filter(d => {
        if (!d.date) return false; 
        const dDate = new Date(d.date);
        return dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear;
    });

    // Расчет доходов и расходов
    filteredTx.forEach(t => {
        if (t.type === 'income') {
            monthBalance += t.amount;
            grossIncome += t.amount;
        } else {
            monthBalance -= t.amount;
        }
    });

    // Корректировка баланса срочными долгами
    currentMonthDebts.forEach(d => {
        if (d.type === 'i-owe') {
            monthBalance -= d.amount;
        } else if (d.type === 'me-owe') {
            monthBalance += d.amount;
            grossIncome += d.amount;
        }
    });
    
    const incomeEl = document.getElementById('total-income');
    if (incomeEl) incomeEl.innerText = `${grossIncome.toLocaleString()} ₽`;

    const balanceEl = document.getElementById('total-balance');
    balanceEl.innerText = `${monthBalance.toLocaleString()} ₽`;
    balanceEl.style.color = monthBalance >= 0 ? 'var(--green)' : 'var(--red)';

    // Вывод транзакций
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

    // Вывод целей (Отображаются всегда)
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

    // Вывод долгов (Отображаются всегда)
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
            let dateText = d.date ? `(срок: ${d.date.split('-').reverse().join('.')})` : `<span style="color:var(--accent); font-weight:500;">(бессрочно)</span>`;

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

// Генерация сетки календаря
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

// Запуск при старте
render();
