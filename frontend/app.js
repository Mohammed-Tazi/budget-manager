import { store } from "./store.js";

// --- INITIALISATION ---
async function init() {
    try {
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets(),
            store.fetchGoals()
        ]);

        updateDashboard();
        renderGoals();
        renderTransactions();
        renderBudgets();
    } catch (err) {
        console.error("Erreur d'initialisation :", err);
    }
}

// --- DASHBOARD & GRAPHIQUE ---
function updateDashboard() {
    const tx = store.transactions || [];
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const total = income - expense;

    if(document.getElementById("kpiTotal")) document.getElementById("kpiTotal").innerText = `${total} MAD`;
    if(document.getElementById("kpiIncome")) document.getElementById("kpiIncome").innerText = `${income} MAD`;
    if(document.getElementById("kpiExpense")) document.getElementById("kpiExpense").innerText = `${expense} MAD`;

    // Score Santé
    const scoreEl = document.getElementById("financeScore");
    if (scoreEl) {
        const score = income > 0 ? Math.max(0, Math.min(100, Math.round((total / income) * 100))) : 0;
        scoreEl.innerText = `${score}/100`;
        scoreEl.style.color = score > 60 ? "#1cc88a" : score > 30 ? "#f6c23e" : "#e74a3b";
    }

    updateChart(income, expense);
}

function updateChart(income, expense) {
    const ctx = document.getElementById('flowChart');
    if (!ctx) return;
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Revenus', 'Dépenses'],
            datasets: [{
                data: [income, expense],
                backgroundColor: ['#1cc88a', '#e74a3b'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '80%', plugins: { legend: { display: false } } }
    });
}

// --- RENDU DES OBJECTIFS (Correction undefined/NaN) ---
function renderGoals() {
    const listEl = document.getElementById("goalList");
    if (!listEl) return;

    listEl.innerHTML = (store.goals || []).map(g => {
        const id = g._id || g.id; // Support MongoDB
        const title = g.title || g.name || "Objectif";
        const target = Number(g.target) || 0;
        const current = Number(g.current) || Number(g.saved) || 0;
        const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

        return `
            <div class="card" style="position: relative; margin-bottom: 15px;">
                <button onclick="handleDelete('${id}', 'goal')" style="position: absolute; top: 10px; right: 10px; color: #e74a3b; background: none; border: none; cursor: pointer;">✕</button>
                <strong>${title}</strong><br>
                <small>${current} / ${target} MAD</small>
                <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 5px; margin: 10px 0; overflow: hidden;">
                    <div style="background: #1cc88a; width: ${progress}%; height: 100%;"></div>
                </div>
                <span style="font-size: 11px; opacity: 0.6;">${progress.toFixed(0)}% atteint</span>
            </div>`;
    }).join("");
}

// --- ACTIONS (AJOUT / SUPPRESSION / RESET) ---
window.handleDelete = async function(id, type) {
    if (!id || id === 'undefined') return alert("Erreur ID");
    if (!confirm("Supprimer cet élément ?")) return;
    try {
        if (type === 'goal') await store.deleteGoal(id);
        else await store.deleteTransaction(id);
        await init();
    } catch (err) { console.error(err); }
};

window.handleReset = async function() {
    if (!confirm("⚠️ Tout réinitialiser ?")) return;
    try {
        await store.resetAllData();
        await init();
    } catch (err) { alert("Erreur reset"); }
};

window.handleSaveGoal = async function() {
    const title = document.getElementById('goalName')?.value;
    const target = document.getElementById('goalTarget')?.value;
    const current = document.getElementById('goalSaved')?.value || 0;

    if (!title || !target) return alert("Champs requis");
    await store.saveGoal({ title, target: Number(target), current: Number(current) });
    await init();
};

window.handleAdd = async function() {
    const text = document.getElementById('text')?.value;
    const amount = document.getElementById('amount')?.value;
    if (!text || !amount) return alert("Champs requis");
    await store.saveTransaction({ 
        text, 
        amount: Number(amount), 
        type: document.getElementById('type').value,
        category: document.getElementById('category').value 
    });
    await init();
};

// --- AUTRES RENDUS ---
function renderTransactions() {
    const listEl = document.getElementById("txList") || document.getElementById("txLive");
    if (!listEl) return;
    listEl.innerHTML = store.transactions.map(t => `
        <div style="display:flex; justify-content:space-between; padding: 10px; border-bottom: 1px solid #ffffff11;">
            <span>${t.text}</span>
            <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">${t.amount} MAD</b>
        </div>`).join("");
}

function renderBudgets() { /* Logique similaire pour budgets */ }

document.addEventListener("DOMContentLoaded", init);