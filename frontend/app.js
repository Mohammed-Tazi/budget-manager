import { store } from "./store.js";

// --- INITIALISATION CENTRALE ---
async function init() {
    try {
        // Chargement de toutes les données en parallèle
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets(),
            store.fetchGoals?.() 
        ]);

        const { transactions: tx = [], budgets = [], goals = [] } = store;

        // Détection et Rendu automatique selon la page
        const pages = [
            { id: 'kpiTotal', run: () => renderDashboard(tx) },
            { id: 'txListFull', run: () => renderTransactions(tx) },
            { id: 'budgetList', run: () => renderBudgets(budgets, tx) },
            { id: 'goalList', run: () => renderGoals(goals, tx) }
        ];

        pages.forEach(page => {
            if (document.getElementById(page.id)) page.run();
        });

    } catch (err) {
        console.error("Erreur d'initialisation :", err);
    }
}

// --- RENDU : TRANSACTIONS ---
function renderTransactions(tx) {
    const listEl = document.getElementById("txListFull") || document.getElementById("txList");
    if (!listEl) return;

    listEl.innerHTML = tx.length === 0 ? 
        `<p style="padding:20px; opacity:0.5;">Aucune opération.</p>` :
        tx.slice().reverse().map(t => `
            <div class="card-item" style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <div>
                    <strong>${t.text}</strong><br>
                    <small style="opacity:0.5;">${t.category || 'Général'}</small>
                </div>
                <div style="display:flex; align-items:center; gap:20px;">
                    <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                        ${t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toLocaleString()} MAD
                    </b>
                    <button onclick="window.handleDelete('transaction', '${t._id || t.id}')" class="btn-delete">✕</button>
                </div>
            </div>
        `).join("");
}

// --- RENDU : BUDGETS ---
function renderBudgets(budgets, tx) {
    const listEl = document.getElementById("budgetList");
    if (!listEl) return;

    listEl.innerHTML = budgets.map(b => {
        const spent = tx.filter(t => t.category === b.category && t.type === 'expense')
                        .reduce((sum, t) => sum + Number(t.amount), 0);
        const percent = Math.min(100, Math.round((spent / b.limit) * 100));
        const color = percent > 90 ? '#e74a3b' : percent > 70 ? '#f6c23e' : '#1cc88a';

        return `
            <div class="card" style="margin-bottom: 15px; padding:15px; border-left: 4px solid ${color};">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <div>
                        <strong>${b.category}</strong><br>
                        <small>${spent.toLocaleString()} / ${b.limit.toLocaleString()} MAD</small>
                    </div>
                    <button onclick="window.handleDelete('budget', '${b._id || b.id}')" class="btn-delete">✕</button>
                </div>
                <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin-top:10px; overflow:hidden;">
                    <div style="width: ${percent}%; background: ${color}; height: 100%;"></div>
                </div>
            </div>`;
    }).join("");
}

// --- RENDU : GOALS ---
function renderGoals(goals, tx) {
    const listEl = document.getElementById("goalList");
    if (!listEl) return;

    // Calcul de l'épargne (Revenus - Dépenses)
    const savings = tx.reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount), 0);

    listEl.innerHTML = goals.map(g => {
        const percent = Math.min(100, Math.round((Math.max(0, savings) / g.target) * 100));
        return `
            <div class="card" style="margin-bottom: 15px; padding:15px; border-radius:10px; background: rgba(59,130,246,0.05);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <strong>🎯 ${g.text}</strong>
                    <button onclick="window.handleDelete('goal', '${g._id || g.id}')" class="btn-delete">✕</button>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-top:10px;">
                    <span>Progression</span>
                    <span>${percent}%</span>
                </div>
                <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin-top:5px; overflow:hidden;">
                    <div style="width: ${percent}%; background: #3b82f6; height: 100%;"></div>
                </div>
                <small style="display:block; margin-top:5px; opacity:0.6;">Cible: ${g.target.toLocaleString()} MAD</small>
            </div>`;
    }).join("");
}

// --- ACTIONS GLOBALES (DELETE UNIFIÉ) ---

window.handleDelete = async function(type, id) {
    if (!confirm(`Supprimer cet élément (${type}) ?`)) return;

    try {
        if (type === 'transaction') await store.deleteTransaction(id);
        if (type === 'budget') await store.deleteBudget?.(id); // Nécessite deleteBudget dans store.js
        if (type === 'goal') await store.deleteGoal?.(id);     // Nécessite deleteGoal dans store.js
        
        await init(); // Rafraîchir tout
    } catch (err) {
        alert("Erreur lors de la suppression.");
    }
};

// --- ENREGISTREMENT ---

window.handleSaveBudget = async function() {
    const catEl = document.getElementById('budgetCategory');
    const limitEl = document.getElementById('budgetLimit');
    if (!catEl?.value || !limitEl?.value) return alert("Veuillez remplir tous les champs.");

    try {
        await store.saveBudget({ category: catEl.value, limit: Number(limitEl.value) });
        catEl.value = ""; limitEl.value = "";
        await init();
    } catch (err) { alert("Erreur budget."); }
};

window.handleSaveGoal = async function() {
    const textEl = document.getElementById('goalText');
    const targetEl = document.getElementById('goalTarget');
    if (!textEl?.value || !targetEl?.value) return alert("Veuillez remplir tous les champs.");

    try {
        await store.saveGoal({ text: textEl.value, target: Number(targetEl.value) });
        textEl.value = ""; targetEl.value = "";
        await init();
    } catch (err) { alert("Erreur objectif."); }
};

// ... (Gardez handleAdd et renderDashboard/FlowChart comme avant) ...

document.addEventListener("DOMContentLoaded", init);