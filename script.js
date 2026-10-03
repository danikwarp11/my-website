let data = JSON.parse(localStorage.getItem('myFinanceDataPRO_V9')) || {
    transactions: [],
    goals: [],
    debts: [],
    payments: [] 
};

let myFinanceChart = null;
let currentAnalyticsMode = 'expense'; 

document.documentElement.setAttribute('data-theme', 'dark');

const viewMonthSelect = document.getElementById('view-month');
const viewYearSelect = document.getElementById('view-year');
const savedMonth = localStorage.getItem('selectedFinanceMonth');

if (savedMonth !== null) { viewMonthSelect.value = savedMonth; } 
else { viewMonthSelect.value = "9"; }
viewYearSelect.value = "2026";   

function saveData() {
    localStorage.setItem('myFinanceDataPRO_V9', JSON.stringify(data));
    render();
    if (document.getElementById('calendar-screen').classList.contains('active')) { initCalendar(); }
}

function changeViewMonth() {
    localStorage.setItem('selectedFinanceMonth', viewMonthSelect.value);
    render();
    if (document.getElementById('calendar-screen').classList.contains('active')) { initCalendar(); }
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
    if (event && event.currentTarget) { event.currentTarget.classList.add('active'); }
    if (tabId === 'calendar-screen') { initCalendar(); }
    if (tabId === 'analytics-screen') { render(); }
}

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
    let date = dateInput.value ? dateInput.value : ''; 
    if (!amount || amount <= 0) { alert('Укажите сумму операции!'); return; }
    data.transactions.push({ id: Date.now(), amount, desc, category, type, date });
    amountInput.value = ''; descInput.value = ''; dateInput.value = ''; 
    saveData();
}

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
    if (!amount || amount <= 0 || !day || day < 1 || day > 31) { alert('Укажите корректные параметры!'); return; }
    data.payments.push({ id: Date.now(), amount, desc, day, endMonth, endYear, skippedExceptions: [], paidExceptions: [] });
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
    if (!name || !target || target <= 0) { alert('Укажите параметры цели.'); return; }
    data.goals.push({ id: Date.now(), name, target, current });
    nameInput.value = ''; targetInput.value = ''; currentInput.value = '0';
    saveData();
}

function depositToGoal(id) {
    const depositAmount = parseFloat(prompt('Сколько добавить к цели?'));
    if (!depositAmount || depositAmount <= 0) return;
    const goal = data.goals.find(g => g.id === id);
    if (goal) { goal.current += depositAmount; if (goal.current > goal.target) goal.current = goal.target; saveData(); }
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
    if (!name || !amount || amount <= 0) { alert('Укажите имя и сумму долга!'); return; }
    data.debts.push({ id: Date.now(), name, amount, type, date, desc });
    nameInput.value = ''; amountInput.value = ''; descInput.value = ''; dateInput.value = ''; 
    saveData();
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

function isPaymentActiveInMonth(p, targetMonth, targetYear) {
    if (targetYear > p.endYear) return false;
    if (targetYear < 2026) return false;
    const dateKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
    if (p.skippedExceptions && p.skippedExceptions.includes(dateKey)) return false;
    if (p.paidExceptions && p.paidExceptions.includes(dateKey)) return false;
    if (targetYear === p.endYear) {
        const normalize = (m) => m >= 9 ? m - 9 : m + 3;
        return normalize(targetMonth) <= normalize(p.endMonth);
    }
    return true;
}

function deleteItem(dataType, id) {
    data[dataType] = data[dataType].filter(item => item.id !== id);
    saveData();
}

function setAnalyticsMode(mode) {
    currentAnalyticsMode = mode;
    const expBtn = document.getElementById('btn-chart-expense');
    const incBtn = document.getElementById('btn-chart-income');
    if (mode === 'expense') {
        expBtn.style.background = 'var(--card-bg)'; expBtn.style.color = 'var(--text-main)';
        incBtn.style.background = 'none'; incBtn.style.color = 'var(--text-muted)';
    } else {
        incBtn.style.background = 'var(--card-bg)'; incBtn.style.color = 'var(--text-main)';
        expBtn.style.background = 'none'; expBtn.style.color = 'var(--text-muted)';
    }
    render();
}

function render() {
    const selectedMonth = parseInt(viewMonthSelect.value);
    const selectedYear = parseInt(viewYearSelect.value);
    let monthBalance = 0; let grossIncome = 0; let totalUndatedDebtsAmount = 0; 
    
    const filteredTx = data.transactions.filter(t => {
        if (!t.date) return true; 
        const tDate = new Date(t.date);
        return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
    });

    const currentMonthDebts = [];
    data.debts.forEach(d => {
        if (!d.date) { totalUndatedDebtsAmount += d.amount; } 
        else {
            const dDate = (d.date === "settled-archived") ? new Date(d.id) : new Date(d.date);
            if (dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear) { currentMonthDebts.push(d); }
        }
    });

    let activeRecurringAmount = 0;
    const dateKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
    
    data.payments.forEach(p => {
        if (p.paidExceptions && p.paidExceptions.includes(dateKey)) { activeRecurringAmount += p.amount; } 
        else if (isPaymentActiveInMonth(p, selectedMonth, selectedYear)) { activeRecurringAmount += p.amount; }
    });

    filteredTx.forEach(t => {
        if (t.type === 'income') { monthBalance += t.amount; grossIncome += t.amount; } 
        else { monthBalance -= t.amount; }
    });

    currentMonthDebts.forEach(d => {
        if (d.type === 'i-owe') monthBalance -= d.amount;
        else if (d.type === 'me-owe') { monthBalance += d.amount; grossIncome += d.amount; }
    });
    
    monthBalance -= activeRecurringAmount;

    if (document.getElementById('total-income')) document.getElementById('total-income').innerText = `${grossIncome.toLocaleString()} ₽`;
    const balanceEl = document.getElementById('total-balance');
    if (balanceEl) {
        balanceEl.innerText = `${monthBalance.toLocaleString()} ₽`;
        balanceEl.style.color = monthBalance >= 0 ? 'var(--green)' : 'var(--red)';
    }
    if (document.getElementById('total-undated-debts')) document.getElementById('total-undated-debts').innerText = `${totalUndatedDebtsAmount.toLocaleString()} ₽`;

    const incomeTx = filteredTx.filter(t => t.type === 'income');
    const expenseTx = filteredTx.filter(t => t.type === 'expense');

    const formatListItem = (t) => {
        const dateText = t.date ? `(${t.date.split('-').reverse().slice(0,2).join('.')})` : '<span style="color:var(--accent)">(бессрочно)</span>';
        return `<div class="list-item"><div><span class="category-tag">${t.category}</span><strong>${t.desc}</strong> <span style="font-size:11px; color:var(--text-muted)">${dateText}</span></div><span style="color:${t.type === 'income' ? 'var(--green)' : 'var(--red)'}; font-weight:600;">${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()} ₽<button class="delete-btn" onclick="deleteItem('transactions', ${t.id})">✕</button></span></div>`;
    };

    document.getElementById('tx-income-list').innerHTML = incomeTx.length === 0 ? '<div style="color:var(--text-muted); text-align:center; padding:10px; font-size:13px;">Нет поступлений</div>' : incomeTx.map(formatListItem).join('');
    document.getElementById('tx-expense-list').innerHTML = expenseTx.length === 0 ? '<div style="color:var(--text-muted); text-align:center; padding:10px; font-size:13px;">Нет расходов</div>' : expenseTx.map(formatListItem).join('');

    document.getElementById('goals-list').innerHTML = data.goals.length === 0 ? '<div style="color:var(--text-muted); text-align:center; padding:10px;">Нет целей</div>' : data.goals.map(g => {
        const pct = Math.min((g.current / g.target) * 100, 100).toFixed(0);
        return `<div class="goal-container"><div class="goal-info"><span><strong>${g.name}</strong></span><span style="color:var(--text-muted); font-size:13px;">${g.current.toLocaleString()} / ${g.target.toLocaleString()} ₽ (${pct}%)</span></div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div><div style="display:flex; justify-content:flex-end; gap:12px; margin-top:8px;"><span style="cursor:pointer; color:var(--accent); font-size:12px; font-weight:600;" onclick="depositToGoal(${g.id})">Пополнить</span><span style="cursor:pointer; color:var(--accent); font-size:12px;" onclick="editGoal(${g.id})">Изм.</span><span style="cursor:pointer; color:var(--text-muted); font-size:12px;" onclick="deleteItem('goals', ${g.id})">Удалить</span></div></div>`;
    }).join('');

    const activeVisibleDebts = data.debts.filter(d => d.date !== "settled-archived");
    const sortedDebts = [...activeVisibleDebts].sort((a, b) => { if (!a.date) return 1; if (!b.date) return -1; return new Date(a.date) - new Date(b.date); });
    document.getElementById('debts-list').innerHTML = activeVisibleDebts.length === 0 ? '<div style="color:var(--text-muted); text-align:center; padding:10px;">Нет долгов</div>' : sortedDebts.map(d => {
        let dateText = d.date ? `(срок: ${d.date.split('-').reverse().join('.')})` : `<span style="color:var(--accent); font-weight:500;">(бессрочно)</span>`;
        return `<div class="list-item"><span><span style="color:${d.type === 'i-owe' ? 'var(--red)' : 'var(--green)'}; font-weight:600;">${d.type === 'i-owe' ? 'Я должен' : 'Мне должны'}</span> — <strong>${d.name}</strong><small style="color:var(--text-muted)"> [${d.desc}]</small> <span style="font-size:11px; color:var(--text-muted)"> ${dateText}</span></span><span style="font-weight:600;">${d.amount.toLocaleString()} ₽<button style="width:auto; display:inline-block; padding:2px 6px; font-size:11px; margin-left:5px; background:var(--tab-bg); color:var(--text-main); border:1px solid var(--border-color); border-radius:4px; cursor:pointer;" onclick="editDebt(${d.id})">Изм.</button><button class="delete-btn" onclick="deleteItem('debts', ${d.id})">✕</button></span></div>`;
    }).join('');

    const monthNames = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('payments-list').innerHTML = data.payments.length === 0 ? '<div style="color:var(--text-muted); text-align:center; padding:10px;">Нет активных регулярных платежей</div>' : data.payments.map(p => `
        <div class="list-item"><div><strong>${p.desc}</strong> <span style="font-size:11px; color:var(--text-muted)">(${p.day} числа)</span><div style="font-size:11px; color:var(--accent); margin-top:2px;">Включительно до: ${monthNames[p.endMonth]} ${p.endYear}</div></div><span style="font-weight:600; color:var(--red);">${p.amount.toLocaleString()} ₽<button class="delete-btn" onclick="deleteItem('payments', ${p.id})">✕</button></span></div>
    `).join('');

    const categorySums = {};
    if (currentAnalyticsMode === 'expense') {
        expenseTx.forEach(t => { const cat = t.category || '🛠️ Другое'; categorySums[cat] = (categorySums[cat] || 0) + t.amount; });
        data.debts.forEach(d => {
            if (d.type === 'i-owe') {
                const dDate = (d.date === "settled-archived") ? new Date(d.id) : (d.date ? new Date(d.date) : null);
                if (dDate && dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear) {
                    const label = `🤝 Выплата долга (${d.name})`; categorySums[label] = (categorySums[label] || 0) + d.amount;
                }
            }
        });
        data.payments.forEach(p => {
            if ((p.paidExceptions && p.paidExceptions.includes(dateKey)) || isPaymentActiveInMonth(p, selectedMonth, selectedYear)) {
                const label = `💳 Подписка: ${p.desc}`; categorySums[label] = (categorySums[label] || 0) + p.amount;
            }
        });
    } else {
        incomeTx.forEach(t => { const cat = t.category || '💼 Доход'; categorySums[cat] = (categorySums[cat] || 0) + t.amount; });
        data.debts.forEach(d => {
            if (d.type === 'me-owe') {
                const dDate = (d.date === "settled-archived") ? new Date(d.id) : (d.date ? new Date(d.date) : null);
                if (dDate && dDate.getMonth() === selectedMonth && dDate.getFullYear() === selectedYear) {
                    const label = `🤝 Возврат долга (${d.name})`; categorySums[label] = (categorySums[label] || 0) + d.amount;
                }
            }
        });
    }

    const chartLabels = Object.keys(categorySums);
    const chartData = Object.values(categorySums);
    const chartCtx = document.getElementById('financeCircleChart');

    if (chartCtx) {
        if (myFinanceChart) { myFinanceChart.destroy(); }
        if (chartLabels.length === 0) {
            myFinanceChart = new Chart(chartCtx, {
                type: 'doughnut',
                data: { labels: ['Нет данных'], datasets: [{ data: [1], backgroundColor: ['#3a3a3c'] }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
            
            
            document.getElementById('analytics-legend-list').innerHTML = '<div style="color:var(--text-muted); text-align:center; padding:10px;">Нет операций в этом месяце</div>';
        } else {
            const colors = ['#ff3b30', '#34c759', '#0071e3', '#ff9500', '#af52de', '#ffcc00', '#5ac8fa', '#ff2d55', '#5856d6', '#a4a4aa'];
            myFinanceChart = new Chart(chartCtx, {
                type: 'doughnut',
                data: { labels: chartLabels, datasets: [{ data: chartData, backgroundColor: colors.slice(0, chartLabels.length), borderWidth: 1, borderColor: '#2c2c2e' }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });

            let legendHtml = '';
            chartLabels.forEach((label, idx) => {
                legendHtml += `<div class="list-item" style="padding: 10px 0;"><div style="display:flex; align-items:center; gap:10px;"><span style="display:inline-block; width:12px; height:12px; background:${colors[idx % colors.length]}; border-radius:50%;"></span><strong>${label}</strong></div><span style="font-weight:600;">${chartData[idx].toLocaleString()} ₽</span></div>`;
            });
            document.getElementById('analytics-legend-list').innerHTML = legendHtml;
        }
    }
}

function showStatModal(type) {
    const selectedMonth = parseInt(viewMonthSelect.value);
    const selectedYear = parseInt(viewYearSelect.value);
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
        monthTx.filter(t => t.type === 'income').forEach(t => html += `<div class="stat-modal-item"><span>${t.desc}</span><span style="color:var(--green); font-weight:600;">+${t.amount.toLocaleString()} ₽</span></div>`);
    } else if (type === 'undated-debts') {
        titleEl.innerText = "🤝 Глобальные бессрочные долги";
        data.debts.filter(d => !d.date).forEach(d => {
            html += `<div class="stat-modal-item"><span>${d.type === 'i-owe' ? 'Я должен' : 'Мне должны'} — <strong>${d.name}</strong></span><span style="color:${d.type==='i-owe'?'var(--red)':'var(--green)'}; font-weight:600;">${d.amount.toLocaleString()} ₽</span></div>`;
        });
    }
    contentEl.innerHTML = html || '<div style="color:var(--text-muted); text-align:center; padding:15px;">Нет записей.</div>';
    document.getElementById('modal-statistics').classList.add('open');
}
function closeStatModal() { document.getElementById('modal-statistics').classList.remove('open'); }

function initCalendar() {
    const calendarEl = document.getElementById('custom-calendar');
    const selectedMonth = parseInt(viewMonthSelect.value);
    const selectedYear = parseInt(viewYearSelect.value);
    const monthNamesHeader = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
    document.getElementById('calendar-title').innerText = `📅 Календарь запланированных трат: ${monthNamesHeader[selectedMonth]} ${selectedYear}`;
    
    const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    let html = '<div class="calendar-grid">';
    weekdays.forEach(day => html += `<div class="calendar-weekday">${day}</div>`);
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const shiftIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    for (let i = 0; i < shiftIndex; i++) html += '<div class="calendar-day empty"></div>';
    for (let day = 1; day <= daysInMonth; day++) {
        const currentM = String(selectedMonth + 1).padStart(2, '0'); const currentD = String(day).padStart(2, '0');
        const dateStr = `${selectedYear}-${currentM}-${currentD}`; const dateKey = `${selectedYear}-${currentM}`;
        const dayTx = data.transactions.filter(t => t.date === dateStr);
        const dayDebts = data.debts.filter(d => d.date === dateStr && d.date !== "settled-archived");
        const dayPayments = data.payments.filter(p => p.day === day && ((p.paidExceptions && p.paidExceptions.includes(dateKey)) || isPaymentActiveInMonth(p, selectedMonth, selectedYear)));
        const realToday = new Date();
        const todayClass = (day === realToday.getDate() && selectedMonth === realToday.getMonth() && selectedYear === realToday.getFullYear()) ? 'today-highlight' : '';
        let eventsHtml = '<div class="calendar-events-container">';
        dayTx.forEach(t => eventsHtml += `<div class="cal-event-badge ${t.type}" onclick="handleCalendarCardClick('transaction', ${t.id})">${t.type==='income'?'+':'-'}${t.amount}</div>`);
        dayDebts.forEach(d => eventsHtml += `<div class="cal-event-badge debt" onclick="handleCalendarCardClick('debt', ${d.id})">🤝${d.amount}</div>`);
        dayPayments.forEach(p => {
            const isAlreadyPaid = p.paidExceptions && p.paidExceptions.includes(dateKey);
            eventsHtml += `<div class="cal-event-badge recurring" style="${isAlreadyPaid?'opacity:0.55;text-decoration:line-through':''}" onclick="handleCalendarCardClick('recurring', ${p.id}, '${dateStr}')">💳${p.amount}</div>`;
        });
        eventsHtml += '</div>';
        html += `<div class="calendar-day ${todayClass}"><div class="calendar-day-number">${day}</div>${eventsHtml}</div>`;
    }
    html += '</div>'; calendarEl.innerHTML = html;
}

function handleCalendarCardClick(type, id, extraData = '') {
    if (type === 'debt') {
        const debt = data.debts.find(d => d.id === id);
        if (debt) {
            document.getElementById('cal-debt-id').value = id;
            document.getElementById('cal-debt-text').innerText = `Долг: ${debt.name} (${debt.amount} ₽). Действие?`;
            document.getElementById('modal-calendar-debt').classList.add('open');
        }
    } else if (type === 'recurring') {
        const payment = data.payments.find(p => p.id === id);
        if (payment) {
            document.getElementById('cal-pay-id').value = id; document.getElementById('cal-pay-date').value = extraData;
            document.getElementById('cal-pay-text').innerText = `Платеж: "${payment.desc}" (${payment.amount} ₽). Действие?`;
            document.getElementById('modal-calendar-pay').classList.add('open');
        }
    } else if (type === 'transaction') { if (confirm('Удалить операцию?')) { deleteItem('transactions', id); } }
}
function closeCalDebtModal() { document.getElementById('modal-calendar-debt').classList.remove('open'); }
function closeCalPayModal() { document.getElementById('modal-calendar-pay').classList.remove('open'); }

function resolveDebtFromCalendar(isSettled) {
    const id = parseInt(document.getElementById('cal-debt-id').value);
    const debt = data.debts.find(d => d.id === id);
    if (debt) {
        if (isSettled) {
            data.transactions.push({ id: Date.now(), amount: debt.amount, type: (debt.type === 'i-owe'?'expense':'income'), category: (debt.type === 'i-owe'?'Выплата долга':'Возврат долга'), desc: `${debt.name}`, date: debt.date });
            data.debts = data.debts.filter(d => d.id !== id); saveData();
        } else { deleteItem('debts', id); }
    }
    closeCalDebtModal();
}

function resolvePayFromCalendar(isPaid) {
    const id = parseInt(document.getElementById('cal-pay-id').value);
    const dateStr = document.getElementById('cal-pay-date').value;
    const payment = data.payments.find(p => p.id === id);
    if (payment) {
        const parts = dateStr.split('-'); const dateKey = `${parts[0]}-${parts[1]}`;
        if (isPaid) { if (!payment.paidExceptions) payment.paidExceptions = []; payment.paidExceptions.push(dateKey); } 
        else { if (!payment.skippedExceptions) payment.skippedExceptions = []; payment.skippedExceptions.push(dateKey); }
        saveData();
    }
    closeCalPayModal();
}

window.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        if(document.querySelector('.modal-backdrop.open')) return;
        if (document.getElementById('transactions-screen').classList.contains('active')) addTransaction();
    }
});

render();
