import { store } from "./store.js";

/* ==========================================
   1. ACTIONS ASYNCHRONES (Liaison API)
========================================== */

// Ajouter une transaction
window.addTransaction = async (t) => {
    if (!t.title || !t.amount) return alert("Veuillez remplir le titre et le montant.");
    
    const newTx = {
        ...t,
        amount: Number(t.amount),
        category: t.category || "Général",
        date: new Date().toISOString()
    };

    try {
        await store.saveTransaction(newTx); // Appelle l'API POST
        clearInputs(["title", "amount", "category"]);
        await refreshData(); // Recharge les données depuis le serveur
    } catch (err) {
        alert("Erreur lors de l'enregistrement");
    }
};

// Fixer un budget
window.setBudget = async (cat, val) => {
    if (!cat || !val) return alert("Remplissez tous les champs.");
    
    try {
        await store.saveBudget({ category: cat, limit: Number(val) });
        clearInputs(["cat", "val"]);
        await refreshData();
    } catch (err) {
        console.error(err);
    }
};

// Ajouter un objectif
window.addGoal = async (g) => {
    if (!g.name || !g.target) return alert("Remplissez tous les champs.");
    
    try {
        await store.saveGoal({
            ...g,
            target: Number(g.target),
            saved: Number(g.saved || 0)
        });
        clearInputs(["name", "target", "saved"]);
        await refreshData();
    } catch (err) {
        console.error(err);
    }
};

// Supprimer une transaction
window.deleteTransaction = async (id) => {
    if(confirm("Supprimer cette transaction ?")) {
        try {
            await store.deleteTransaction(id); // Appelle l'API DELETE
            await refreshData();
        } catch (err) {
            alert("Erreur lors de la suppression");
        }
    }
};

/* ==========================================
   2. LOGIQUE DE RENDU (UI)
========================================= */

// Fonction centrale pour rafraîchir l'interface
async function refreshData() {
    await store.fetchTransactions(); // On récupère les dernières data du serveur
    // Tu peux aussi ajouter store.fetchBudgets() et store.fetchGoals() ici
    render();
}

window.render = () => {
    const stats = calculateTotals();

    // Mise à jour KPI
    const update = (id, val, isCurrency = false) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val.toLocaleString() + (isCurrency ? " MAD" : "");
    };

    update("kpiTotal", stats.total, true);
    update("kpiIncome", stats.income);
    update("kpiExpense", stats.expense);

    renderTransactionsList();
    renderBudgetsUI();
    renderGoalsUI();
};

function calculateTotals() {
    let income = 0, expense = 0;
    store.transactions.forEach(t => {
        const val = Number(t.amount) || 0;
        t.type === "income" ? income += val : expense += val;
    });
    return { income, expense, total: income - expense };
}

// Liste des transactions (Correction : utilise t._id venant de MongoDB)
function renderTransactionsList() {
    const el = document.getElementById("txList") || document.getElementById("txLive");
    if (!el) return;
    
    if (store.transactions.length === 0) {
        el.innerHTML = `<p style="opacity:0.5; padding:15px;">Aucune donnée disponible.</p>`;
        return;
    }

    el.innerHTML = store.transactions.map((t) => `
        <div class="card transaction-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div>
                <strong>${t.title}</strong> 
                <br><small style="opacity:0.7">${t.category || 'Général'}</small>
            </div>
            <div style="text-align: right; display:flex; align-items:center; gap:15px;">
                <span style="font-weight:bold; color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                    ${t.type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString()} MAD
                </span>
                <button onclick="deleteTransaction('${t._id}')" class="btn-del">✕</button>
            </div>
        </div>
    `).reverse().join("");
}

/* --- Fonctions Budgets et Goals identiques à ta version précédente --- */
function renderBudgetsUI() { /* ... ta logique existante ... */ }
function renderGoalsUI() { /* ... ta logique existante ... */ }

function clearInputs(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

// Initialisation au chargement
document.addEventListener("DOMContentLoaded", refreshData);