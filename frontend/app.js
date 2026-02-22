import { store } from "./store.js";

// --- SUPPRESSION TRANSACTION ---
window.deleteTx = async function(id) {
    if (!id || id === 'undefined') return;
    if (!confirm("Voulez-vous vraiment supprimer cet élément ?")) return;
    try {
        await store.deleteTransaction(id);
        await init(); 
    } catch (err) {
        console.error("Erreur suppression:", err);
        alert("Action impossible.");
    }
};

// --- INITIALISATION GLOBALE ---
async function init() {
    try {
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets(),
            store.fetchGoals()
        ]);
        
        const tx = store.transactions || [];
        const budgets = store.budgets || [];
        const goals = store.goals || [];

        // 1. Calculs des KPI
        const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
        const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
        const total = income - expense;

        const updateText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        updateText("kpiTotal", `${total.toLocaleString()} MAD`);
        updateText("kpiIncome", `${income.toLocaleString()} MAD`);
        updateText("kpiExpense", `${expense.toLocaleString()} MAD`);

        // 2. Mise à jour des graphiques (via Analytics.js ou localement)
        if (window.refreshCharts) window.refreshCharts();

        // 3. Rendu des listes
        renderBudgetList(budgets, tx);
        renderGoalList(goals);
        renderTransactionList(tx);

    } catch (err) {
        console.error("Erreur initialisation:", err);
    }
}

// --- FONCTIONS DE RENDU CORRIGÉES ---

function renderGoalList(goals) {
    const el = document.getElementById("goalList");
    if (!el) return;

    el.innerHTML = goals.length === 0 ?
        '<p style="opacity:0.5;">Aucun objectif défini.</p>' :
        goals.map(g => {
            const id = g._id || g.id; // Sécurité ID MongoDB
            const name = g.title || g.name || "Objectif sans nom"; // Correction titre vide
            const progress = Math.min(100, (Number(g.current) / Number(g.target)) * 100) || 0;

            return `
                <div class="card" style="position:relative; margin-bottom:15px;">
                    <button onclick="handleDeleteGoal('${id}')" style="position:absolute; top:10px; right:10px; background:none; border:none; color:#e74a3b; cursor:pointer;">✕</button>
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <strong>${name}</strong>
                        <span>${g.current} / ${g.target} MAD</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.1); height:10px; border-radius:10px; overflow:hidden;">
                        <div style="background:#1cc88a; width:${progress}%; height:100%;"></div>
                    </div>
                    <p style="font-size:11px; margin-top:5px; opacity:0.6;">${progress.toFixed(0)}% atteint</p>
                </div>`;
        }).join("");
}

// Ajout de la fonction globale pour supprimer les objectifs
window.handleDeleteGoal = async function(id) {
    if (!confirm("Supprimer cet objectif ?")) return;
    try {
        await store.deleteGoal(id);
        await init();
    } catch (err) {
        alert("Erreur lors de la suppression de l'objectif.");
    }
};

function renderTransactionList(tx) {
    const el = document.getElementById("txList") || document.getElementById("txLive");
    if (!el) return;
    el.innerHTML = tx.length === 0 ? '<p style="opacity:0.5; padding:10px;">Aucune transaction.</p>' : 
        tx.slice().reverse().map(t => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">
                <div>
                    <div style="font-weight:500;">${t.text}</div>
                    <small style="opacity:0.5;">${t.category}</small>
                </div>
                <div style="display:flex; align-items:center; gap:15px;">
                    <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                        ${t.type === 'income' ? '+' : '-'}${Math.abs(t.amount)}
                    </b>
                    <button onclick="window.deleteTx('${t._id || t.id}')" style="background:none; border:none; color:#e74a3b; cursor:pointer;">✕</button>
                </div>
            </div>`).join("");
}

// Gardez votre fonction renderBudgetList actuelle...

document.addEventListener("DOMContentLoaded", init);