import { store } from "./store.js";

// --- CONSTANTES & UTILITAIRES ---
const formatMAD = (amount) => new Intl.NumberFormat('fr-MA', { 
    style: 'currency', 
    currency: 'MAD',
    maximumFractionDigits: 0 
}).format(amount);

// --- INITIALISATION ---
async function init() {
    const mainEl = document.querySelector('.main');
    if (mainEl) mainEl.style.opacity = "0.5"; // Feedback visuel chargement

    try {
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets(),
            store.fetchGoals()
        ]);
        refreshUI();
    } catch (err) {
        console.error("🚀 Erreur critique :", err);
    } finally {
        if (mainEl) mainEl.style.opacity = "1";
    }
}

// Mise à jour globale de l'interface
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
        <div class="card fade-in" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-left: 4px solid #3b82f6;">
            <div>
                <strong style="font-size: 1.1em;">${b.category}</strong><br>
                <small style="opacity: 0.6;">Plafond : ${formatMAD(b.limit)}</small>
            </div>
            <button onclick="handleDelete('${b._id || b.id}', 'budget')" class="btn-delete">✕</button>
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
        const color = progress >= 100 ? '#1cc88a' : '#f6c23e';

        return `
            <div class="card goal-card">
                <button onclick="handleDelete('${g._id || g.id}', 'goal')" class="btn-delete-abs">✕</button>
                <div style="margin-bottom: 8px;">
                    <strong style="font-size: 1.1em;">${g.title || g.name}</strong>
                    <div style="float: right; color: ${color}; font-weight: bold;">${progress.toFixed(0)}%</div>
                </div>
                <div style="font-size: 0.9em; margin-bottom: 10px; opacity: 0.8;">
                    ${formatMAD(current)} / ${formatMAD(target)}
                </div>
                <div class="progress-bg">
                    <div class="progress-bar" style="width: ${progress}%; background: ${color};"></div>
                </div>
            </div>`;
    }).join("");
}

function renderTransactions() {
    const listEl = document.getElementById("txList") || document.getElementById("txLive");
    if (!listEl) return;

    listEl.innerHTML = (store.transactions || []).map(t => `
        <div class="transaction-item">
            <span>${t.text} <br><small style="opacity:0.5">${t.category || 'Général'}</small></span>
            <div style="text-align: right;">
                <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                    ${t.type === 'income' ? '+' : '-'} ${formatMAD(t.amount)}
                </b>
                <button onclick="handleDelete('${t._id || t.id}', 'tx')" class="btn-small-del">✕</button>
            </div>
        </div>
    `).join("");
}

// --- LOGIQUE DASHBOARD ---
function updateDashboard() {
    const tx = store.transactions || [];
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const total = income - expense;

    const kpiTotal = document.getElementById("kpiTotal");
    if(kpiTotal) {
        kpiTotal.innerText = formatMAD(total);
        kpiTotal.style.color = total >= 0 ? "#1cc88a" : "#e74a3b";
    }
    
    updateChart(income, expense);
}

// --- ACTIONS GLOBALES (WINDOW) ---

window.handleSaveBudget = async function() {
    const catEl = document.getElementById('cat');
    const valEl = document.getElementById('val');

    if (!catEl?.value || !valEl?.value) return alert("⚠️ Remplissez tous les champs.");

    try {
        await store.saveBudget({ category: catEl.value, limit: Number(valEl.value) });
        catEl.value = ""; valEl.value = "";
        await init();
    } catch (err) { alert("Erreur lors de l'enregistrement"); }
};

window.handleSaveGoal = async function() {
    const titleEl = document.getElementById('goalName');
    const targetEl = document.getElementById('goalTarget');
    const currentEl = document.getElementById('goalSaved');

    if (!titleEl?.value || !targetEl?.value) return alert("⚠️ Nom et objectif requis.");

    try {
        await store.saveGoal({ 
            title: titleEl.value, 
            target: Number(targetEl.value), 
            current: Number(currentEl.value || 0) 
        });
        titleEl.value = ""; targetEl.value = ""; currentEl.value = "";
        await init();
    } catch (err) { alert("Erreur lors de l'enregistrement"); }
};

window.handleDelete = async function(id, type) {
    if (!id || id === 'undefined') return;
    if (!confirm("🗑️ Supprimer définitivement cet élément ?")) return;

    try {
        if (type === 'goal') await store.deleteGoal(id);
        else if (type === 'budget') await store.deleteBudget(id);
        else await store.deleteTransaction(id);
        await init();
    } catch (err) { alert("Erreur suppression"); }
};

window.handleReset = async function() {
    if (!confirm("⚠️ ATTENTION : Cela va effacer TOUTES vos données. Continuer ?")) return;
    try {
        await store.resetAllData();
        await init();
    } catch (err) { alert("Erreur reset"); }
};

document.addEventListener("DOMContentLoaded", init);