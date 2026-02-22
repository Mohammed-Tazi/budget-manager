import { store } from "./store.js";

// --- UTILITAIRES ---
const formatMAD = (amount) => new Intl.NumberFormat('fr-MA', { 
    style: 'currency', 
    currency: 'MAD',
    maximumFractionDigits: 0 
}).format(amount);

// --- INITIALISATION ---
async function init() {
    const mainEl = document.querySelector('.main');
    if (mainEl) mainEl.style.opacity = "0.5"; 

    try {
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets(),
            store.fetchGoals()
        ]);
        refreshUI();
    } catch (err) {
        console.error("🚀 Erreur initialisation :", err);
    } finally {
        if (mainEl) mainEl.style.opacity = "1";
    }
}

function refreshUI() {
    updateDashboard();
    renderGoals();
    renderTransactions();
    renderBudgets();
}

// --- RENDU DES COMPOSANTS ---

function renderBudgets() {
    const listEl = document.getElementById("budgetList");
    if (!listEl) return;

    listEl.innerHTML = (store.budgets || []).map(b => `
        <div class="card" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-left: 4px solid #3b82f6; padding: 15px;">
            <div>
                <strong style="text-transform: capitalize;">${b.category}</strong><br>
                <small style="opacity: 0.7;">Limite : ${formatMAD(b.limit)}</small>
            </div>
            <button onclick="handleDelete('${b._id || b.id}', 'budget')" style="color: #e74a3b; background: none; border: none; cursor: pointer; font-size: 1.2rem;">✕</button>
        </div>
    `).join("");
}

function renderGoals() {
    const listEl = document.getElementById("goalList");
    if (!listEl) return;

    listEl.innerHTML = (store.goals || []).map(g => {
        const target = Number(g.target) || 0;
        const current = Number(g.current) || 0;
        const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

        return `
            <div class="card" style="position: relative; margin-bottom: 15px; padding: 20px;">
                <button onclick="handleDelete('${g._id || g.id}', 'goal')" style="position: absolute; top: 10px; right: 10px; color: #e74a3b; background: none; border: none; cursor: pointer;">✕</button>
                <strong>${g.title || g.name || "Objectif"}</strong><br>
                <small>${formatMAD(current)} / ${formatMAD(target)}</small>
                <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 5px; margin: 10px 0; overflow: hidden;">
                    <div style="background: #1cc88a; width: ${progress}%; height: 100%;"></div>
                </div>
                <span style="font-size: 11px; color: #1cc88a;">${progress.toFixed(0)}% atteint</span>
            </div>`;
    }).join("");
}

function renderTransactions() {
    const listEl = document.getElementById("txList") || document.getElementById("txLive");
    if (!listEl) return;

    listEl.innerHTML = (store.transactions || []).map(t => `
        <div style="display:flex; justify-content:space-between; padding: 12px; border-bottom: 1px solid #ffffff11;">
            <span>${t.text || 'Sans titre'} <br><small style="opacity:0.5">${t.category || 'Général'}</small></span>
            <div style="text-align: right;">
                <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                    ${t.type === 'income' ? '+' : '-'} ${formatMAD(t.amount)}
                </b>
                <button onclick="handleDelete('${t._id || t.id}', 'transaction')" style="background:none; border:none; color:#ff4d4d; cursor:pointer; margin-left:8px;">✕</button>
            </div>
        </div>
    `).join("");
}

// --- LOGIQUE DASHBOARD ---

function updateDashboard() {
    const tx = store.transactions || [];
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

    const kpiTotal = document.getElementById("kpiTotal");
    if(kpiTotal) kpiTotal.innerText = formatMAD(income - expense);
    
    const kpiIncome = document.getElementById("kpiIncome");
    if(kpiIncome) kpiIncome.innerText = formatMAD(income);

    const kpiExpense = document.getElementById("kpiExpense");
    if(kpiExpense) kpiExpense.innerText = formatMAD(expense);

    updateCharts(income, expense, tx);
}

function updateCharts(income, expense, tx) {
    const flowCtx = document.getElementById("flowChart");
    if (flowCtx) {
        const existing = Chart.getChart(flowCtx);
        if (existing) existing.destroy();
        new Chart(flowCtx, {
            type: "bar",
            data: {
                labels: ["Revenus", "Dépenses"],
                datasets: [{ data: [income, expense], backgroundColor: ["#1cc88a", "#e74a3b"], borderRadius: 8 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }
}

// --- ACTIONS GLOBALES ---

window.handleDelete = async function(id, type) {
    if (!id || id === 'undefined') return;
    if (!confirm("🗑️ Supprimer cet élément ?")) return;

    try {
        if (type === 'goal') await store.deleteGoal(id);
        else if (type === 'budget') await store.deleteBudget(id);
        else await store.deleteTransaction(id);
        await init(); 
    } catch (err) {
        alert("Erreur lors de la suppression.");
    }
};

window.handleSaveBudget = async function() {
    const catEl = document.getElementById('cat');
    const valEl = document.getElementById('val');
    if (!catEl?.value || !valEl?.value) return alert("Champs requis");

    await store.saveBudget({ category: catEl.value, limit: Number(valEl.value) });
    catEl.value = ""; valEl.value = "";
    await init();
};

window.handleReset = async function() {
    if (!confirm("⚠️ Tout effacer ?")) return;
    await store.resetAllData();
    await init();
};

document.addEventListener("DOMContentLoaded", init);