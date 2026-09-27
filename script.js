// ==========================================
// ЧАСТЬ 1: ИНИЦИАЛИЗАЦИЯ И РЕГУЛЯРНЫЕ ПЛАТЕЖИ
// ==========================================

// Загружаем данные (Переходим на стабильную версию хранилища V8)
let data = JSON.parse(localStorage.getItem('myFinanceDataPRO_V8')) || {
    transactions: [],
    goals: [],
    debts: [],
    payments: [] 
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
    localStorage.setItem('myFinanceDataPRO_V8', JSON.stringify(data));
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

// Новая функция: Отмена регулярной подписки ТОЛЬКО на один выбранный месяц
function deletePaymentForSingleMonth(paymentId, dateStr) {
    const payment = data.payments.find(p => p.id === paymentId);
    if (payment) {
        if (!payment.skippedExceptions) {
            payment.skippedExceptions = [];
        }
        payment.skippedExceptions.push(dateStr);
        saveData();
    }
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
    if (!desc) { desc = category; } 
    
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

// Добавление регулярного шаблона подписок
function addRecurringPayment() {
    const amountInput = document.getElementById('pay-amount');
    const descInput = document.getElementById('pay-desc');
    const dayInput = document.getElementById('pay-day');
    const endMonthSelect = document.getElementById('pay-end-month');
    const endYearSelect = document.getElementById('pay-end-year');

    const amount = parseFloat(amountInput.value);
    const desc = descInput.value ? descInput.value.trim() : 'Регулярный платеж';
    const day = parseInt(dayInput.value);
    const endMonth = parseInt(endMonthSelect.value);
    const endYear = parseInt(endYearSelect.value);

    if (!amount || amount <= 0 || !day || day < 1 || day > 31) {
        alert('Укажите корректную сумму и число месяца (1-31)!');
        return;
    }

    data.payments.push({
        id: Date.now(),
        amount: amount,
        desc: desc,
        day: day,
        endMonth: endMonth,
        endYear: endYear,
        skippedExceptions: [] // Тут сохраняем даты отмененных месяцев
    });

    amountInput.value = '';
    descInput.value = '';
    dayInput.value = '';
    saveData();
}

// Обработка клавиши Enter на клавиатуре
window.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        if(document.querySelector('.modal-backdrop.open')) return; 

        const txScreen = document.getElementById('transactions-screen');
        const goalsScreen = document.getElementById('goals-screen');
        const debtsScreen = document.getElementById('debts-screen');
        const paymentsScreen = document.getElementById('payments-screen');

        if (txScreen && txScreen.classList.contains('active')) addTransaction();
        else if (goalsScreen && goalsScreen.classList.contains('active')) addGoal();
        else if (debtsScreen && debtsScreen.mathbf.contains('active')) addDebt();
        else if (paymentsScreen && paymentsScreen.classList.contains('active')) addRecurringPayment();
    }
});
// ==========================================
// ЧАСТЬ 2: ЦЕЛИ, ДОЛГИ И ОКНА РЕДАКТИРОВАНИЯ
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
function closeGoalModal() { document.getElementById('modal-edit-goal').classList.remove('open'); }
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
    const descInput = document.getElementById('debt-desc'); 
    const typeInput = document.getElementById('debt-type');
    const dateInput = document.getElementById('debt-date');

    const name = nameInput.value ? nameInput.value.trim() : '';
    const amount = parseFloat(amountInput.value);
    const type = typeInput ? typeInput.value : 'i-owe';
    let date = dateInput.value; 
    let desc = descInput.value ? descInput.value.trim() : 'Долг';

    if (!name || !amount || amount <= 0) {
        alert('Укажите имя и сумму долга!');
        return;
    }

    data.debts.push({ id: Date.now(), name, amount, type, date, desc });
    nameInput.value = ''; amountInput.value = ''; descInput.value = ''; dateInput.value = ''; 
    saveData();
}

// Привязка клавиши Enter для экрана долгов
if (document.getElementById('debts-screen')) {
    document.getElementById('debts-screen').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') addDebt();
    });
}

function editDebt(id) {
    const debt = data.debts.find(d => d.id === id);
    if (!debt) return;
    document.getElementById('edit-debt-id').value = debt.id;
    document.getElementById('edit-debt-name').value = debt.name;
    document.getElementById('edit-debt-amount').value = debt.amount;
    document.getElementById('edit-debt-desc').value = debt.desc || 'Долг'; 
    document.getElementById('edit-debt-date').value = debt.date; 
    document.getElementById('modal-edit-debt').classList.add('open');
}
function closeDebtModal() { document.getElementById('modal-edit-debt').classList.remove('open'); }
function saveDebtModal() {
    const id = parseInt(document.getElementById('edit-debt-id').value);
    const debt = data.debts.find(d => d.id === id);
    if(debt) {
        debt.name = document.getElementById('edit-debt-name').value.trim() || debt.name;
        debt.amount = parseFloat(document.getElementById('edit-debt-amount').value) || debt.amount;
        debt.desc = document.getElementById('edit-debt-desc').value.trim() || 'Долг'; 
        debt.date = document.getElementById('edit-debt-date').value; 
        saveData();
    }
    closeDebtModal();
}
// ==========================================
// ЧАСТЬ 3: МАТЕМАТИКА БАЛАНСА И СТРУКТУРА СПИСКОВ
// ==========================================

// Функция проверки: действует ли регулярная подписка в выбранный месяц и год
function isPaymentActiveInMonth(p, targetMonth, targetYear) {
    if (targetYear > p.endYear) return false;
    if (targetYear < 2026) return false;
    
    // Проверяем, не была ли подписка отменена на этот конкретный месяц
    if (p.skippedExceptions && p.skippedExceptions.includes(`${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`)) {
        return false; // Если дата в черном списке — подписка в этом месяце не действует
    }
    
    if (targetYear === p.endYear) {
        // Сравниваем индексы месяцев с учетом сдвига с Октября (индекс 9)
        const normalize = (m) => m >= 9 ? m - 9 : m + 3;
        return normalize(targetMonth) <= normalize(p.endMonth);
    }
    return true;
}

function render() {
    const selectedMonth = parseInt(document.getElementById('view-month').value);
    const selectedYear = parseInt(document.getElementById('view-year').value);

    let monthBalance = 0; 
    let grossIncome = 0;
    let totalUndatedDebtsAmount = 0; 
    
    // ТРАНЗАКЦИИ: бессрочные (без даты) автоматически показываются в текущем выбранном месяце
    const filteredTx = data.transactions.filter(t => {
        if (!t.date) return true; 
        const tDate = new Date(t.date);
        return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
    });

    const currentMonthDebts = [];
    data.debts.forEach(d => {
        if (!d.date) totalUndatedDebtsAmount += d.amount; 
        else {
            const dDate = new Date(d.date);
            if (dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear) currentMonthDebts.push(d); 
        }
    });

    // АВТОРАСЧЕТ: суммируем регулярные платежи, активные в этом месяце (как долги)
    let activeRecurringAmount = 0;
    data.payments.forEach(p => {
        if (isPaymentActiveInMonth(p, selectedMonth, selectedYear)) {
            activeRecurringAmount += p.amount;
        }
    });

    // Математика доходов и расходов за месяц
    filteredTx.forEach(t => {
        if (t.type === 'income') { monthBalance += t.amount; grossIncome += t.amount; } 
        else { monthBalance -= t.amount; }
    });

    // Корректируем чистый баланс срочными долгами текущего периода
    currentMonthDebts.forEach(d => {
        if (d.type === 'i-owe') monthBalance -= d.amount;
        else if (d.type === 'me-owe') { monthBalance += d.amount; grossIncome += d.amount; }
    });
    
    // Вычитаем регулярные платежи из чистого баланса
    monthBalance -= activeRecurringAmount;

    // Выводим результаты в три плашки шапки
    if (document.getElementById('total-income')) document.getElementById('total-income').innerText = `${grossIncome.toLocaleString()} ₽`;
    const balanceEl = document.getElementById('total-balance');
    if (balanceEl) {
        balanceEl.innerText = `${monthBalance.toLocaleString()} ₽`;
        balanceEl.style.color = monthBalance >= 0 ? 'var(--green)' : 'var(--red)';
    }
    if (document.getElementById('total-undated-debts')) document.getElementById('total-undated-debts').innerText = `${totalUndatedDebtsAmount.toLocaleString()} ₽`;

    // Разделяем транзакции на два независимых списка истории
    const incomeTx = filteredTx.filter(t => t.type === 'income');
    const expenseTx = filteredTx.filter(t => t.type === 'expense');

    const formatListItem = (t) => {
        const dateText = t.date ? `(${t.date.split('-').reverse().slice(0,2).join('.')})` : '<span style="color:var(--accent)">(бессрочно)</span>';
        return `<div class="list-item"><div><span class="category-tag">${t.category}</span><strong>${t.desc}</strong> <span style="font-size:11px; color:var(--text-muted)">${dateText}</span></div><span style="color:${t.type === 'income' ? 'var(--green)' : 'var(--red)'}; font-weight:600;">${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()} ₽<button class="delete-btn" onclick="deleteItem('transactions', ${t.id})">✕</button></span></div>`;
    };

    document.getElementById('tx-income-list').innerHTML = incomeTx.length === 0 ? '<div style="color:var(--text-muted); text-align:center; padding:10px; font-size:13px;">Нет поступлений</div>' : incomeTx.map(formatListItem).join('');
    document.getElementById('tx-expense-list').innerHTML = expenseTx.length === 0 ? '<div style="color:var(--text-muted); text-align:center; padding:10px; font-size:13px;">Нет расходов</div>' : expenseTx.map(formatListItem).join('');
// ==========================================
// ЧАСТЬ 4: РЕНДЕРИНГ ЦЕЛЕЙ, ДОЛГОВ И СПИСКА ПОДПИСОК
// ==========================================

    // Вывод целей
    document.getElementById('goals-list').innerHTML = data.goals.length === 0 ? '<div style="color:var(--text-muted); text-align:center; padding:10px;">Нет целей</div>' : data.goals.map(g => {
        const pct = Math.min((g.current / g.target) * 100, 100).toFixed(0);
        return `<div class="goal-container"><div class="goal-info"><span><strong>${g.name}</strong></span><span style="color:var(--text-muted); font-size:13px;">${g.current.toLocaleString()} / ${g.target.toLocaleString()} ₽ (${pct}%)</span></div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div><div style="display:flex; justify-content:flex-end; gap:12px; margin-top:8px;"><span style="cursor:pointer; color:var(--accent); font-size:12px; font-weight:600;" onclick="depositToGoal(${g.id})">Пополнить</span><span style="cursor:pointer; color:var(--accent); font-size:12px;" onclick="editGoal(${g.id})">Изм.</span><span style="cursor:pointer; color:var(--text-muted); font-size:12px;" onclick="deleteItem('goals', ${g.id})">Удалить</span></div></div>`;
    }).join('');

    // Вывод долгов
    const sortedDebts = [...data.debts].sort((a, b) => { if (!a.date) return 1; if (!b.date) return -1; return new Date(a.date) - new Date(b.date); });
    document.getElementById('debts-list').innerHTML = data.debts.length === 0 ? '<div style="color:var(--text-muted); text-align:center; padding:10px;">Нет долгов</div>' : sortedDebts.map(d => {
        let dateText = d.date ? `(срок: ${d.date.split('-').reverse().join('.')})` : `<span style="color:var(--accent); font-weight:500;">(бессрочно)</span>`;
        return `<div class="list-item"><span><span style="color:${d.type === 'i-owe' ? 'var(--red)' : 'var(--green)'}; font-weight:600;">${d.type === 'i-owe' ? 'Я должен' : 'Мне должны'}</span> — <strong>${d.name}</strong><small style="color:var(--text-muted)"> [${d.desc}]</small> <span style="font-size:11px; color:var(--text-muted)"> ${dateText}</span></span><span style="font-weight:600;">${d.amount.toLocaleString()} ₽<button style="width:auto; display:inline-block; padding:2px 6px; font-size:11px; margin-left:5px; background:var(--tab-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:4px; cursor:pointer;" onclick="editDebt(${d.id})">Изм.</button><button class="delete-btn" onclick="deleteItem('debts', ${d.id})">✕</button></span></div>`;
    }).join('');

    // Вывод списка регулярных шаблонов подписок в свою вкладку
    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    const pListEl = document.getElementById('payments-list');
    if (data.payments.length === 0) {
        pListEl.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">Нет активных регулярных платежей</div>';
    } else {
        pListEl.innerHTML = data.payments.map(p => `
            <div class="list-item">
                <div>
                    <strong>${p.desc}</strong> <span style="font-size:11px; color:var(--text-muted)">(${p.day} числа каждого месяца)</span>
                    <div style="font-size:11px; color:var(--accent); margin-top:2px;">Действует включительно до: ${monthNames[p.endMonth]} ${p.endYear} г.</div>
                </div>
                <span style="font-weight:600; color:var(--red);">${p.amount.toLocaleString()} ₽<button class="delete-btn" onclick="deleteItem('payments', ${p.id})">✕</button></span>
            </div>
        `).join('');
    }
}
// ==========================================
// ЧАСТЬ 5: ОКНА ДЕТАЛИЗАЦИИ И СЕТКА КАЛЕНДАРЯ
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
        const debtsToMe = data.debts.filter(d => { if(!d.date || d.type !== 'me-owe') return false; const dDate = new Date(d.date); return dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear; });

        incomes.forEach(t => html += `<div class="stat-modal-item"><span>${t.desc}</span><span style="color:var(--green); font-weight:600;">+${t.amount.toLocaleString()} ₽</span></div>`);
        debtsToMe.forEach(d => html += `<div class="stat-modal-item"><span>🤝 Возврат долга [${d.desc}]: ${d.name}</span><span style="color:var(--green); font-weight:600;">+${d.amount.toLocaleString()} ₽</span></div>`);
    } 
    else if (type === 'expense') {
        titleEl.innerText = "📉 Детализация расходов (Вкл. Подписки)";
        const expenses = monthTx.filter(t => t.type === 'expense');
        const debtsFromMe = data.debts.filter(d => { if(!d.date || d.type !== 'i-owe') return false; const dDate = new Date(d.date); return dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear; });

        expenses.forEach(t => html += `<div class="stat-modal-item"><span><small style="color:var(--text-muted)">${t.category}</small> ${t.desc}</span><span style="color:var(--red); font-weight:600;">-${t.amount.toLocaleString()} ₽</span></div>`);
        debtsFromMe.forEach(d => html += `<div class="stat-modal-item"><span>🤝 Выплата долга [${d.desc}]: ${d.name}</span><span style="color:var(--red); font-weight:600;">-${d.amount.toLocaleString()} ₽</span></div>`);
        
        data.payments.forEach(p => {
            if (isPaymentActiveInMonth(p, selectedMonth, selectedYear)) {
                html += `<div class="stat-modal-item"><span>💳 Подписка: ${p.desc}</span><span style="color:var(--red); font-weight:600;">-${p.amount.toLocaleString()} ₽</span></div>`;
            }
        });
    } 
    else if (type === 'undated-debts') {
        titleEl.innerText = "🤝 Глобальные бессрочные долги";
        const undatedList = data.debts.filter(d => !d.date);
        undatedList.forEach(d => {
            const color = d.type === 'i-owe' ? 'var(--red)' : 'var(--green)';
            html += `<div class="stat-modal-item"><span>${d.type === 'i-owe' ? 'Я должен' : 'Мне должны'} — <strong>${d.name}</strong> <small style="color:var(--text-muted)">[${d.desc}]</small></span><span style="color:${color}; font-weight:600;">${d.amount.toLocaleString()} ₽</span></div>`;
        });
    }
    contentEl.innerHTML = html || '<div style="color:var(--text-muted); text-align:center; padding:15px;">Нет записей.</div>';
    document.getElementById('modal-statistics').classList.add('open');
}

function closeStatModal() { 
    document.getElementById('modal-statistics').classList.remove('open'); 
}

function initCalendar() {
    const calendarEl = document.getElementById('custom-calendar');
    const selectedMonth = parseInt(document.getElementById('view-month').value);
    const selectedYear = parseInt(document.getElementById('view-year').value);

    const monthNamesHeader = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('calendar-title').innerText = `📅 Календарь запланированных трат: ${monthNamesHeader[selectedMonth]} ${selectedYear}`;

    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    let html = '<div class="calendar-grid">';
    weekdays.forEach(day => html += `<div class="calendar-weekday">${day}</div>`);

    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const shiftIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

    // Получаем текущую дату для подсветки сегодняшнего дня
    const realToday = new Date();
    const realDay = realToday.getDate();
    const realMonth = realToday.getMonth();
    const realYear = realToday.getFullYear();

    for (let i = 0; i < shiftIndex; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const currentM = String(selectedMonth + 1).padStart(2, '0'); 
        const currentD = String(day).padStart(2, '0');
        const dateStr = `${selectedYear}-${currentM}-${currentD}`;

        const dayTx = data.transactions.filter(t => t.date === dateStr);
        const dayDebts = data.debts.filter(d => d.date === dateStr);
        const dayPayments = data.payments.filter(p => p.day === day && isPaymentActiveInMonth(p, selectedMonth, selectedYear));

        // Проверяем, является ли эта ячейка сегодняшним днем
        const isToday = (day === realDay && selectedMonth === realMonth && selectedYear === realYear);
        const todayClass = isToday ? 'today-highlight' : '';

        let eventsHtml = '<div class="calendar-events-container">';
        
        dayTx.forEach(t => { 
            const sign = t.type === 'income' ? '+' : '-';
            eventsHtml += `<div class="cal-event-badge ${t.type}">${sign}${t.amount} ${t.desc}</div>`; 
        });
        
        dayDebts.forEach(d => { 
            eventsHtml += `<div class="cal-event-badge debt">🤝${d.amount} ${d.name}</div>`; 
        });
        
        dayPayments.forEach(p => {
            eventsHtml += `
                <div class="cal-event-badge recurring">
                    <span>💳${p.amount} ${p.desc}</span>
                    <button onclick="event.stopPropagation(); deletePaymentForSingleMonth(${p.id}, '${dateStr}')">✕</button>
                </div>`;
        });
        
        eventsHtml += '</div>';

        // Выводим только строгую чистую цифру дня, никаких длинных надписей наружу!
        html += `
            <div class="calendar-day ${todayClass}">
                <div class="calendar-day-number">${day}</div>
                ${eventsHtml}
            </div>
        `;
    }
    html += '</div>'; 
    calendarEl.innerHTML = html;
}
