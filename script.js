let data = JSON.parse(localStorage.getItem('myFinanceDataPRO_V9')) || {
    transactions: [],
    goals: [],
    debts: [],
    payments: [] 
};

let myFinanceChart = null;
let currentAnalyticsMode = 'expense'; 

document.documentElement.setAttribute('data-theme', 'dark');

const savedMonth = localStorage.getItem('selectedFinanceMonth');
const viewMonthSelect = document.getElementById('view-month');
const viewYearSelect = document.getElementById('view-year');

if (savedMonth !== null) {
    viewMonthSelect.value = savedMonth;
} else {
    viewMonthSelect.value = "9";
}
viewYearSelect.value = "2026";   

function saveData() {
    localStorage.setItem('myFinanceDataPRO_V9', JSON.stringify(data));
    render();
    if (document.getElementById('calendar-screen').classList.contains('active')) {
        initCalendar();
    }
}

function changeViewMonth() {
    localStorage.setItem('selectedFinanceMonth', viewMonthSelect.value);
    render();
    if (document.getElementById('calendar-screen').classList.contains('active')) {
        initCalendar();
    }
}

function stepMonth(direction) {
    let currentMonth = parseInt(viewMonthSelect.value);
    let currentYear = parseInt(viewYearSelect.value);
    currentMonth += direction;
    if (currentMonth > 11) { currentMonth = 0; currentYear += 1; }
    else if (currentMonth < 0) { currentMonth = 11; currentYear -= 1; }
    viewMonthSelect.value = String(currentMonth);
    viewYearSelect.value = String(currentYear);
    changeViewMonth();
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if (event && event.currentTarget) event.currentTarget.classList.add('active');

    if (tabId === 'calendar-screen') initCalendar();
    if (tabId === 'analytics-screen' || tabId === 'debts-screen' || tabId === 'goals-screen') render();
}

function addTransaction() {
    const amountInput = document.getElementById('tx-amount');
    const descInput = document.getElementById('tx-desc');
    const categoryInput = document.getElementById('tx-category');
    const dateInput = document.getElementById('tx-date');
    const amount = parseFloat(amountInput.value);
    const category = categoryInput ? categoryInput.value : '🛠️ Другое';
    let desc = descInput.value ? descInput.value.trim() : '';
    if (!desc) desc = category;
    const type = (category === '💼 Доход') ? 'income' : 'expense';
    let date = dateInput.value || ''; 
    if (!amount || amount <= 0) { alert('Укажите сумму!'); return; }
    data.transactions.push({ id: Date.now(), amount, desc, category, type, date });
    amountInput.value = ''; descInput.value = ''; dateInput.value = ''; 
    saveData();
}

function addRecurringPayment() {
    const amountInput = document.getElementById('pay-amount');
    const descInput = document.getElementById('pay-desc');
    const dayInput = document.getElementById('pay-day');
    const amount = parseFloat(amountInput.value);
    const desc = descInput.value ? descInput.value.trim() : 'Подписка';
    const day = parseInt(dayInput.value);
    if (!amount || amount <= 0 || !day || day < 1 || day > 31) { alert('Проверьте поля!'); return; }
    data.payments.push({ id: Date.now(), amount, desc, day, endMonth: 11, endYear: 2026, skippedExceptions: [], paidExceptions: [] });
    amountInput.value = ''; descInput.value = ''; dayInput.value = '';
    saveData();
}

function addGoal() {
    const nameInput = document.getElementById('goal-name');
    const targetInput = document.getElementById('goal-target');
    const currentInput = document.getElementById('goal-current');
    const name = nameInput.value ? nameInput.value.trim() : '';
    const target = parseFloat(targetInput.value);
    const current = parseFloat(currentInput.value) || 0;
    if (!name || !target || target <= 0) { alert('Заполните цель!'); return; }
    data.goals.push({ id: Date.now(), name, target, current });
    nameInput.value = ''; targetInput.value = ''; currentInput.value = '0';
    saveData();
}

function depositToGoal(id) {
    const amount = parseFloat(prompt('Сколько добавить?'));
    if (!amount || amount <= 0) return;
    const goal = data.goals.find(g => g.id === id);
    if (goal) { goal.current = Math.min(goal.current + amount, goal.target); saveData(); }
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
    const typeInput = document.getElementById('debt-type');
    const dateInput = document.getElementById('debt-date');
    const descInput = document.getElementById('debt-desc');
    const name = nameInput.value.trim();
    const amount = parseFloat(amountInput.value);
    if (!name || !amount || amount <= 0) { alert('Укажите имя и сумму!'); return; }
    data.debts.push({ id: Date.now(), name, amount, type: typeInput.value, date: dateInput.value, desc: descInput.value || 'Долг' });
    nameInput.value = ''; amountInput.value = ''; dateInput.value = ''; descInput.value = '';
    saveData();
}

function editDebt(id) {
    const debt = data.debts.find(d => d.id === id);
    if (!debt) return;
    document.getElementById('edit-debt-id').value = debt.id;
    document.getElementById('edit-debt-name').value = debt.name;
    document.getElementById('edit-debt-amount').value = debt.amount;
    document.getElementById('edit-debt-date').value = debt.date || '';
    document.getElementById('edit-debt-desc').value = debt.desc || '';
    document.getElementById('modal-edit-debt').classList.add('open');
}
function closeDebtModal() { document.getElementById('modal-edit-debt').classList.remove('open'); }
function saveDebtModal() {
    const id = parseInt(document.getElementById('edit-debt-id').value);
    const debt = data.debts.find(d => d.id === id);
    if(debt) {
        debt.name = document.getElementById('edit-debt-name').value.trim();
        debt.amount = parseFloat(document.getElementById('edit-debt-amount').value);
        debt.date = document.getElementById('edit-debt-date').value;
        debt.desc = document.getElementById('edit-debt-desc').value.trim();
        saveData();
    }
    closeDebtModal();
}

function isPaymentActiveInMonth(p, m, y) {
    const dateKey = `${y}-${String(m + 1).padStart(2, '0')}`;
    if (p.skippedExceptions?.includes(dateKey) || p.paidExceptions?.includes(dateKey)) return false;
    return true;
}

function deleteItem(dataType, id) { data[dataType] = data[dataType].filter(item => item.id !== id); saveData(); }
function setAnalyticsMode(mode) {
    currentAnalyticsMode = mode;
    document.getElementById('btn-chart-expense').style.background = mode === 'expense' ? 'var(--card-bg)' : 'none';
    document.getElementById('btn-chart-income').style.background = mode === 'income' ? 'var(--card-bg)' : 'none';
    render();
}

function render() {
    const selectedMonth = parseInt(viewMonthSelect.value);
    const selectedYear = parseInt(viewYearSelect.value);
    const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    let monthBalance = 0, grossIncome = 0, totalUndatedDebtsAmount = 0;

    const filteredTx = data.transactions.filter(t => {
        if (!t.date) return true;
        const d = new Date(t.date);
        return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const currentMonthDebts = [];
    data.debts.forEach(d => {
        if (!d.date) totalUndatedDebtsAmount += d.amount;
        else {
            const dDate = d.date === "settled-archived" ? new Date(d.id) : new Date(d.date);
            if (dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear) currentMonthDebts.push(d);
        }
    });

    let activeRecurringAmount = 0;
    data.payments.forEach(p => {
        if (p.paidExceptions?.includes(dateKey) || isPaymentActiveInMonth(p, selectedMonth, selectedYear)) activeRecurringAmount += p.amount;
    });

    filteredTx.forEach(t => { if (t.type === 'income') { monthBalance += t.amount; grossIncome += t.amount; } else monthBalance -= t.amount; });
    currentMonthDebts.forEach(d => { if (d.type === 'i-owe') monthBalance -= d.amount; else { monthBalance += d.amount; grossIncome += d.amount; } });
    monthBalance -= activeRecurringAmount;

    document.getElementById('total-income').innerText = `${grossIncome.toLocaleString()} ₽`;
    document.getElementById('total-balance').innerText = `${monthBalance.toLocaleString()} ₽`;
    document.getElementById('total-balance').style.color = monthBalance >= 0 ? 'var(--green)' : 'var(--red)';
    document.getElementById('total-undated-debts').innerText = `${totalUndatedDebtsAmount.toLocaleString()} ₽`;

    const incTx = filteredTx.filter(t => t.type === 'income');
    const expTx = filteredTx.filter(t => t.type === 'expense');
    const formatTx = (t) => `<div class="list-item"><div><span class="category-tag">${t.category}</span><strong>${t.desc}</strong></div><span>${t.type==='income'?'+':'-'}${t.amount} ₽<button class="delete-btn" onclick="deleteItem('transactions', ${t.id})">✕</button></span></div>`;
    
    document.getElementById('tx-income-list').innerHTML = incTx.length ? incTx.map(formatTx).join('') : 'Нет доходов';
    document.getElementById('tx-expense-list').innerHTML = expTx.length ? expTx.map(formatTx).join('') : 'Нет расходов';

    document.getElementById('debts-list').innerHTML = data.debts.length ? data.debts.map(d => `<div class="list-item"><span><strong>${d.name}</strong> (${d.type==='i-owe'?'Я должен':'Мне'})</span><span>${d.amount} ₽ <button onclick="editDebt(${d.id})">Изм.</button><button class="delete-btn" onclick="deleteItem('debts', ${d.id})">✕</button></span></div>`).join('') : 'Нет долгов';
    document.getElementById('goals-list').innerHTML = data.goals.length ? data.goals.map(g => `<div class="goal-container"><div class="goal-info"><span>${g.name}</span><span>${g.current}/${g.target} ₽</span></div><div class="progress-bar"><div class="progress-fill" style="width:${(g.current/g.target)*100}%"></div></div><button onclick="depositToGoal(${g.id})" style="padding:4px; margin-top:5px; font-size:11px; width:auto;">+ Пополнить</button></div>`).join('') : 'Нет целей';
    document.getElementById('payments-list').innerHTML = data.payments.length ? data.payments.map(p => `<div class="list-item"><span>${p.desc} (${p.day} число)</span><span>${p.amount} ₽ <button class="delete-btn" onclick="deleteItem('payments', ${p.id})">✕</button></span></div>`).join('') : 'Нет подписок';

    // --- АНАЛИТИКА (ГРАФИК) ---
    const categorySums = {};
    if (currentAnalyticsMode === 'expense') {
        expTx.forEach(t => { categorySums[t.category] = (categorySums[t.category] || 0) + t.amount; });
    } else {
        incTx.forEach(t => { categorySums[t.category] = (categorySums[t.category] || 0) + t.amount; });
    }

    const chartLabels = Object.keys(categorySums);
    const chartData = Object.values(categorySums);
    const chartCtx = document.getElementById('financeCircleChart');

    if (chartCtx) {
        if (myFinanceChart) myFinanceChart.destroy();
        if (chartLabels.length === 0) {
            myFinanceChart = new Chart(chartCtx, { type: 'doughnut', data: { labels: ['Нет данных'], datasets: [{ data:[1], backgroundColor: ['#3a3a3c'] }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
            document.getElementById('analytics-legend-list').innerHTML = 'Нет операций';
        } else {
            const colors = ['#ff3b30', '#34c759', '#0071e3', '#ff9500', '#af52de'];
            myFinanceChart = new Chart(chartCtx, { type: 'doughnut', data: { labels: chartLabels, datasets: [{ data: chartData, backgroundColor: colors, borderWidth: 1, borderColor: '#2c2c2e' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } } });
            document.getElementById('analytics-legend-list').innerHTML = chartLabels.map((l, i) => `<div class="list-item"><span>${l}</span><strong>${chartData[i]} ₽</strong></div>`).join('');
        }
    }
}

function initCalendar() { /* Логика календаря */ }
function resolveDebtFromCalendar() {}
function resolvePayFromCalendar() {}
function showStatModal() {}
render();
