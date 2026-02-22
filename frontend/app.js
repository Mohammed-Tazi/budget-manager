import { store } from "./store.js";

/**
 * RECHARGEMENT GLOBAL
 * Centralise la mise à jour des données pour éviter les décalages d'affichage.
 */
async function refreshAll() {
    try {
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets(),
            store.fetchGoals()
        ]);
        await init();
    } catch (err) {
        console.error("Erreur de rafraîchissement :", err);
    }
}

// --- SUPPRESSION TRANSACTION ---
window.deleteTx = async function(id) {
    if (!id || !confirm("Supprimer cette transaction ?")) return;
    try {
        await store.deleteTransaction(id);
        await refreshAll();
    } catch (err) {
        console.error("Erreur suppression TX :", err);
    }
};

// --- SUPPRESSION OBJECTIF (GOAL) ---
window.deleteGoal = async function(id) {
    if (!id || id === 'undefined') {
        alert("Erreur : ID de l'objectif introuvable.");
        return;
    }
    
    if (!confirm("Voulez-vous vraiment supprimer cet objectif ?")) return;

    try {
        // Sécurité : utilise deleteGoal si dispo, sinon tente deleteTransaction (souvent la même route API)
        if (typeof store.deleteGoal === "function") {
            await store.deleteGoal(id);
        } else if (typeof store.deleteTransaction === "function") {
            await store.deleteTransaction(id);
        } else {
            throw new Error("Aucune méthode de suppression trouvée dans store.js");
        }
        
        await refreshAll();
        console.log("Objectif supprimé :", id);
    } catch (err) {
        console.error("Échec de la suppression :", err);
        alert("Impossible de supprimer. Vérifiez votre store.js");
    }
};

// --- AJOUT OBJECTIF ---
window.handleSaveGoal = async function() {
    const titleEl = document.getElementById('goalName');
    const targetEl = document.getElementById('goalTarget');
    const currentEl = document.getElementById('goalSaved');

    if (!titleEl?.value || !targetEl?.value) {
        return alert("Le nom et le montant cible sont obligatoires.");
    }

    try {
        const payload = {
            title: titleEl.value.trim(),
            target: Number(targetEl.value),
            current: Number(currentEl.value) || 0
        };

        await store.saveGoal(payload);
        
        // Nettoyage immédiat
        titleEl.value = "";
        targetEl.value = "";
        currentEl.value = "";
        
        await refreshAll();
    } catch (err) {
        console.error("Erreur lors de l'épargne de l'objectif :", err);
    }
};

// --- INITIALISATION DE L'INTERFACE ---
async function init() {
    const { transactions: tx, budgets, goals } = store;

    // 1. DASHBOARD & KPI
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const total = income - expense;

    const updateText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = `${val} MAD`;
    };

    updateText("kpiTotal", total);
    updateText("kpiIncome", income);
    updateText("kpiExpense", expense);

    // 2. RENDU DES OBJECTIFS (Correction bug 0% et Undefined)
    const goalListEl = document.getElementById("goalList");
    if (goalListEl) {
        goalListEl.innerHTML = goals.length === 0 ? 
            '<p style="opacity:0.5; grid-column: 1/-1;">Aucun projet en cours.</p>' : 
            goals.map(g => {
                const id = g._id || g.id; // Supporte les deux formats d'ID
                const title = g.title || g.name || "Objectif";
                const target = Number(g.target) || 0;
                const current = Number(g.current) || Number(g.saved) || 0; // Fallback pour 'saved'
                const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

                return `
                    <div class="card" style="position: relative; border: 1px solid rgba(255,255,255,0.1);">
                        <button onclick="window.deleteGoal('${id}')" 
                                style="position: absolute; top: 10px; right: 10px; background: #e74a3b22; color: #e74a3b; border: none; border-radius: 4px; cursor: pointer; padding: 2px 8px;">
                            ✕
                        </button>
                        <div style="margin-bottom: 12px; padding-right: 25px;">
                            <strong style="display:block; font-size: 1.1em;">${title}</strong>
                            <small style="opacity: 0.6;">${current.toLocaleString()} / ${target.toLocaleString()} MAD</small>
                        </div>
                        <div style="background: rgba(255,255,255,0.05); height: 10px; border-radius: 5px; overflow: hidden;">
                            <div style="background: #1cc88a; width: ${progress}%; height: 100%; transition: width 0.3s;"></div>
                        </div>
                        <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                            <span style="font-size: 0.8em; font-weight: bold; color: #1cc88a;">${progress.toFixed(0)}%</span>
                            <span style="font-size: 0.8em; opacity: 0.5;">atteint</span>
                        </div>
                    </div>`;
            }).join("");
    }

    // 3. RENDU DES TRANSACTIONS
    const listEl = document.getElementById("txList") || document.getElementById("txLive");
    if (listEl) {
        listEl.innerHTML = tx.length === 0 ? '<p style="padding:15px; opacity:0.5;">Historique vide.</p>' : 
            tx.map(t => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">
                    <div>
                        <div style="font-weight: 500;">${t.text}</div>
                        <small style="opacity:0.5;">${t.category}</small>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                            ${t.type === 'income' ? '+' : '-'}${t.amount}
                        </b>
                        <button onclick="window.deleteTx('${t._id || t.id}')" style="background:none; border:none; color:#e74a3b; cursor:pointer;">✕</button>
                    </div>
                </div>`).join("");
    }
}

// Initialisation au chargement
document.addEventListener("DOMContentLoaded", refreshAll);