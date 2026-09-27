// ==========================================
// ЧАСТЬ 1: ИНИЦИАЛИЗАЦИЯ И СТАРТОВЫЕ НАСТРОЙКИ
// ==========================================

// Загружаем данные из локальной памяти устройства
let data = JSON.parse(localStorage.getItem('myFinanceDataPRO_V5')) || {
    transactions: [],
    goals: [],
    debts: []
};

// Всегда принудительно включаем темную тему
document.documentElement.setAttribute('data-theme', 'dark');

// Настройка запоминания выбранного месяца
const savedMonth = localStorage.getItem('selectedFinanceMonth');
const viewMonthSelect = document.getElementById('view-month');
const viewYearSelect = document.getElementById('view-year');

if (savedMonth !== null) {
    viewMonthSelect.value = savedMonth;
} else {
    viewMonthSelect.value = "9"; // По умолчанию Октябрь 2026 года
}
viewYearSelect.value = "2026";   

// Оставляем поля дат изначально пустыми
document.getElementById('tx-date').value = "";
document.getElementById('debt-date').value = "";

let calendar = null;

// Функция вечного сохранения данных в localStorage
function saveData() {
    localStorage.setItem('myFinanceDataPRO_V5', JSON.stringify(data));
    render();
    if (document.getElementById('calendar-screen').classList.contains('active')) {
        initCalendar();
    }
}

// Запоминаем выбор месяца
function changeViewMonth() {
    localStorage.setItem('selectedFinanceMonth', viewMonthSelect.value);
    render();
    if (document.getElementById('calendar-screen').classList.contains('active')) {
        initCalendar();
    }
}

// Переключение экранов (Вкладки)
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

// Добавление новой операции (Описание необязательно)
function addTransaction() {
    const amountInput = document.getElementById('tx-amount');
    const descInput = document.getElementById('tx-desc');
    const categoryInput = document.getElementById('tx-category');
    const dateInput = document.getElementById('tx-date');

    const amount = parseFloat(amountInput.value);
    const category = categoryInput ? categoryInput.value : '🛠️ Другое';
    
    let desc = descInput.value ? descInput.value.trim() : '';
    if (!desc) { desc = category; } // Если описание пустое — ставим категорию
    
    const type = (category === '💼 Доход') ? 'income' : 'expense';
    let date = dateInput.value ? dateInput.value : ''; // Оставляем пустой, если не выбрана

    if (!amount || amount <= 0) {
        alert('Пожалуйста, укажите сумму операции!');
        return;
    }

    data.transactions.push({ id: Date.now(), amount, desc, category, type, date });
    amountInput.value = '';
    descInput.value = '';
    dateInput.value = ''; 
    saveData();
}

// Обработка клавиши Enter на клавиатуре
window.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        if(document.querySelector('.modal-backdrop.open')) return; // Отключаем, если открыто окно

        const txScreen = document.getElementById('transactions-screen');
        const goalsScreen = document.getElementById('goals-screen');
        const debtsScreen = document.getElementById('debts-screen');

        if (txScreen && txScreen.classList.contains('active')) addTransaction();
        else if (goalsScreen && goalsScreen.classList.contains('active')) addGoal();
        else if (debtsScreen && debtsScreen.classList.contains('active')) addDebt();
    }
});
// ==========================================
// ЧАСТЬ 2: ЛОГИКА ЦЕЛЕЙ, ДОЛГОВ И МОДАЛЬНЫХ ОКОН
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

    document.getElementById('edit-goal-id').value = goal.id;
    document.getElementById('edit-goal-name').value = goal.name;
    document.getElementById('edit-goal-target').value = goal.target;
    document.getElementById('edit-goal-current').value = goal.current;
    document.getElementById('modal-edit-goal').classList.add('open');
}

function closeGoalModal() { 
    document.getElementById('modal-edit-goal').classList.remove('open'); 
}

function saveGoalModal() {
    const id = parseInt(document.getElementById('edit-goal-id').value);
    const goal = data.goals.find(g => g.id === id);
    if(goal) {
        goal.name = document.getElementById('edit-goal-name').value.trim() || goal.name;
        goal.target = parseFloat(document.getElementById('edit-goal-target').value) || goal.target;
        goal.current = parseFloat(document.getElementById('edit-goal-current').value) || 0;
        saveData();
    }
    closeGoalModal();
}

function addDebt() {
    const nameInput = document.getElementById('debt-name');
    const amountInput = document.getElementById('debt-amount');
    const typeInput = document.getElementById('debt-type');
    const dateInput = document.getElementById('debt-date');

    const name = nameInput.value ? nameInput.value.trim() : '';
    const amount = parseFloat(amountInput.value);
    const type = typeInput ? typeInput.value : 'i-owe';
    let date = dateInput.value; // Оставляем пустой, если не выбрана

    if (!name || !amount || amount <= 0) {
        alert('Укажите имя и сумму долга!');
        return;
    }

    data.debts.push({ id: Date.now(), name, amount, type, date });
    nameInput.value = '';
    amountInput.value = '';
    dateInput.value = ''; 
    saveData();
}

function editDebt(id) {
    const debt = data.debts.find(d => d.id === id);
    if (!debt) return;

    document.getElementById('edit-debt-id').value = debt.id;
    document.getElementById('edit-debt-name').value = debt.name;
    document.getElementById('edit-debt-amount').value = debt.amount;
    document.getElementById('edit-debt-date').value = debt.date; 
    document.getElementById('modal-edit-debt').classList.add('open');
}

function closeDebtModal() { 
    document.getElementById('modal-edit-debt').classList.remove('open'); 
}

function saveDebtModal() {
    const id = parseInt(document.getElementById('edit-debt-id').value);
    const debt = data.debts.find(d => d.id === id);
    if(debt) {
        debt.name = document.getElementById('edit-debt-name').value.trim() || debt.name;
        debt.amount = parseFloat(document.getElementById('edit-debt-amount').value) || debt.amount;
        debt.date = document.getElementById('edit-debt-date').value; 
        saveData();
    }
    closeDebtModal();
}
// ==========================================
// ЧАСТЬ 3: МАТЕМАТИКА БАЛАНСОВ И ВЫВОД СПИСКОВ
// ==========================================

function render() {
    const selectedMonth = parseInt(document.getElementById('view-month').value);
    const selectedYear = parseInt(document.getElementById('view-year').value);

    let monthBalance = 0; 
    let grossIncome = 0;
    let totalUndatedDebtsAmount = 0; // Наш новый счетчик бессрочных долгов
    
    // ТРАНЗАКЦИИ: бессрочные (без даты) привязываются к текущему выбранному просмотру месяца
    const filteredTx = data.transactions.filter(t => {
        if (!t.date) return true; 
        const tDate = new Date(t.date);
        return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
    });

    // ДОЛГИ: разделяем на срочные этого месяца и бессрочные (глобальные)
    const currentMonthDebts = [];

    data.debts.forEach(d => {
        if (!d.date) {
            totalUndatedDebtsAmount += d.amount; // Считаем сумму бессрочных долгов
        } else {
            const dDate = new Date(d.date);
            if (dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear) {
                currentMonthDebts.push(d); // Срочный долг текущего месяца
            }
        }
    });

    // Считаем баланс операций (доходы / расходы)
    filteredTx.forEach(t => {
        if (t.type === 'income') { monthBalance += t.amount; grossIncome += t.amount; } 
        else { monthBalance -= t.amount; }
    });

    // Корректируем чистый баланс месяца только срочными долгами текущего периода
    currentMonthDebts.forEach(d => {
        if (d.type === 'i-owe') monthBalance -= d.amount;
        else if (d.type === 'me-owe') { monthBalance += d.amount; grossIncome += d.amount; }
    });
    
    // Выводим данные в три наши карточки в шапке
    const incomeEl = document.getElementById('total-income');
    if (incomeEl) incomeEl.innerText = `${grossIncome.toLocaleString()} ₽`;

    const balanceEl = document.getElementById('total-balance');
    if (balanceEl) {
        balanceEl.innerText = `${monthBalance.toLocaleString()} ₽`;
        balanceEl.style.color = monthBalance >= 0 ? 'var(--green)' : 'var(--red)';
    }

    const undatedDebtsEl = document.getElementById('total-undated-debts');
    if (undatedDebtsEl) {
        undatedDebtsEl.innerText = `${totalUndatedDebtsAmount.toLocaleString()} ₽`;
    }

    // Разделяем транзакции на экранах на два независимых списка
    const incomeTx = filteredTx.filter(t => t.type === 'income');
    const expenseTx = filteredTx.filter(t => t.type === 'expense');

    const formatListItem = (t) => {
        const dateText = t.date ? `(${t.date.split('-').reverse().slice(0,2).join('.')})` : '<span style="color:var(--accent)">(бессрочно)</span>';
        return `
            <div class="list-item">
                <div>
                    <span class="category-tag">${t.category}</span>
                    <strong>${t.desc}</strong> <span style="font-size:11px; color:var(--text-muted)">${dateText}</span>
                </div>
                <span style="color: ${t.type === 'income' ? 'var(--green)' : 'var(--red)'}; font-weight:600;">
                    ${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()} ₽
                    <button class="delete-btn" onclick="deleteItem('transactions', ${t.id})">✕</button>
                </span>
            </div>
        `;
    };

    const incomeListEl = document.getElementById('tx-income-list');
    if (incomeTx.length === 0) incomeListEl.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px; font-size:13px;">Нет поступлений</div>';
    else incomeListEl.innerHTML = incomeTx.map(formatListItem).join('');

    const expenseListEl = document.getElementById('tx-expense-list');
    if (expenseTx.length === 0) expenseListEl.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px; font-size:13px;">Нет расходов</div>';
    else expenseListEl.innerHTML = expenseTx.map(formatListItem).join('');

    // Вывод целей
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

    // Вывод долгов
    const debtsList = document.getElementById('debts-list');
    if (data.debts.length === 0) {
        debtsList.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">Нет долгов</div>';
    } else {
        const sortedDebts = [...data.debts].sort((a, b) => {
            if (!a.date) return 1; if (!b.date) return -1;
            return new Date(a.date) - new Date(b.date);
        });
        
        debtsList.innerHTML = sortedDebts.map(d => {
            let dateText = d.date ? `(срок: ${d.date.split('-').reverse().join('.')})` : `<span style="color:var(--accent); font-weight:500;">(бессрочно)</span>`;
            return `
                <div class="list-item">
                    <span><span style="color:${d.type === 'i-owe' ? 'var(--red)' : 'var(--green)'}; font-weight:600;">${d.type === 'i-owe' ? 'Я должен' : 'Мне должны'}</span> — <strong>${d.name}</strong> <span style="font-size:11px; color:var(--text-muted)"> ${dateText}</span></span>
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
// ==========================================
// ЧАСТЬ 4: ИНТЕРАКТИВНЫЕ МОДАЛЬНЫЕ ОКНА И КАЛЕНДАРЬ
// ==========================================

function showStatModal(type) {
    const selectedMonth = parseInt(document.getElementById('view-month').value);
    const selectedYear = parseInt(document.getElementById('view-year').value);
    
    const titleEl = document.getElementById('stat-modal-title');
    const contentEl = document.getElementById('stat-modal-content');
    let html = '';

    const monthTx = data.transactions.filter(t => {
        if (!t.date) return true;
        const tDate = new Date(t.date);
        return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
    });

    if (type === 'income') {
        titleEl.innerText = "💼 Детализация доходов";
        const incomes = monthTx.filter(t => t.type === 'income');
        
        const debtsToMe = data.debts.filter(d => {
            if(!d.date || d.type !== 'me-owe') return false;
            const dDate = new Date(d.date);
            return dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear;
        });

        if(incomes.length === 0 && debtsToMe.length === 0) {
            html = '<div style="color:var(--text-muted); text-align:center; padding:15px;">В этом месяце поступлений не было.</div>';
        } else {
            incomes.forEach(t => {
                html += `<div class="stat-modal-item"><span>${t.desc}</span><span style="color:var(--green); font-weight:600;">+${t.amount.toLocaleString()} ₽</span></div>`;
            });
            debtsToMe.forEach(d => {
                html += `<div class="stat-modal-item"><span>🤝 Возврат долга: ${d.name}</span><span style="color:var(--green); font-weight:600;">+${d.amount.toLocaleString()} ₽</span></div>`;
            });
        }
    } 
    else if (type === 'expense') {
        titleEl.innerText = "📉 Детализация расходов";
        const expenses = monthTx.filter(t => t.type === 'expense');
        
        const debtsFromMe = data.debts.filter(d => {
            if(!d.date || d.type !== 'i-owe') return false;
            const dDate = new Date(d.date);
            return dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear;
        });

        if(expenses.length === 0 && debtsFromMe.length === 0) {
            html = '<div style="color:var(--text-muted); text-align:center; padding:15px;">В этом месяце трат не было.</div>';
        } else {
            expenses.forEach(t => {
                html += `<div class="stat-modal-item"><span><small style="color:var(--text-muted)">${t.category}</small> ${t.desc}</span><span style="color:var(--red); font-weight:600;">-${t.amount.toLocaleString()} ₽</span></div>`;
            });
            debtsFromMe.forEach(d => {
                html += `<div class="stat-modal-item"><span>🤝 Выплата долга: ${d.name}</span><span style="color:var(--red); font-weight:600;">-${d.amount.toLocaleString()} ₽</span></div>`;
            });
        }
    } 
    else if (type === 'undated-debts') {
        titleEl.innerText = "🤝 Глобальные бессрочные долги";
        const undatedList = data.debts.filter(d => !d.date);

        if(undatedList.length === 0) {
            html = '<div style="color:var(--text-muted); text-align:center; padding:15px;">У вас нет бессрочных долгов!</div>';
        } else {
            undatedList.forEach(d => {
                const color = d.type === 'i-owe' ? 'var(--red)' : 'var(--green)';
                const sign = d.type === 'i-owe' ? 'Я должен' : 'Мне должны';
                html += `<div class="stat-modal-item"><span>${sign} — <strong>${d.name}</strong></span><span style="color:${color}; font-weight:600;">${d.amount.toLocaleString()} ₽</span></div>`;
            });
        }
    }

    contentEl.innerHTML = html;
    document.getElementById('modal-statistics').classList.add('open');
}

function closeStatModal() {
    document.getElementById('modal-statistics').classList.remove('open');
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

    for (let i = 0; i < shiftIndex; i++) html += '<div class="calendar-day empty"></div>';

    for (let day = 1; day <= daysInMonth; day++) {
        const currentM = String(selectedMonth + 1).padStart(2, '0'); const currentD = String(day).padStart(2, '0');
        const dateStr = `${selectedYear}-${currentM}-${currentD}`;

        const dayTx = data.transactions.filter(t => t.date === dateStr);
        const dayDebts = data.debts.filter(d => d.date === dateStr);

        let eventsHtml = '<div class="calendar-events-container">';
        dayTx.forEach(t => { eventsHtml += `<div class="cal-event-badge ${t.type}">${t.type === 'income' ? '+' : '-'}${t.amount} ${t.desc}</div>`; });
        dayDebts.forEach(d => { eventsHtml += `<div class="cal-event-badge debt">🤝 ${d.amount} (${d.name})</div>`; });
        eventsHtml += '</div>';

        html += `<div class="calendar-day"><div class="calendar-day-number">${day}</div>${eventsHtml}</div>`;
    }
    html += '</div>'; calendarEl.innerHTML = html;
}

render();
