import { store } from "./store.js";

/* ==========================================
   1. ACTIONS ASYNCHRONES (Liaison API)
========================================== */

// Ajouter une transaction
window.addTransaction = async (t) => {
    // CORRECTION : On utilise "text" pour correspondre au schéma server.js
    if (!t.text || !t.amount) return alert("Veuillez remplir le libellé et le montant.");
    
    const newTx = {
        text: t.text, // Changé de title à text
        amount: Number(t.amount),
        category: t.category || "Général",
        type: t.type || "expense",
        date: new Date().toISOString()
    };

    try {
        await store.saveTransaction(newTx); 
        clearInputs(["text", "amount", "category"]); // ID mis à jour
        await refreshData(); 
    } catch (err) {
        alert("Erreur lors de l'enregistrement : " + err.message);
    }
};

// Supprimer une transaction
window.deleteTransaction = async (id) => {
    if(confirm("Supprimer cette transaction ?")) {
        try {
            await store.deleteTransaction(id); 
            await refreshData();
        } catch (err) {
            alert("Erreur lors de la suppression");
        }
    }
};

/* ==========================================
   2. LOGIQUE DE RENDU (UI)
========================================= */

async function refreshData() {
    try {
        await store.fetchTransactions();
        // On peut ajouter store.fetchBudgets() ici plus tard
        render();
    } catch (err) {
        console.error("Échec du chargement des données", err);
    }
}

window.render = () => {
    const stats = calculateTotals();

    const update = (id, val, isCurrency = false) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val.toLocaleString() + (isCurrency ? " MAD" : "");
    };

    update("kpiTotal", stats.total, true);
    update("kpiIncome", stats.income);
    update("kpiExpense", stats.expense);

    renderTransactionsList();
};

function calculateTotals() {
    let income = 0, expense = 0;
    store.transactions.forEach(t => {
        const val = Number(t.amount) || 0;
        t.type === "income" ? income += val : expense += val;
    });
    return { income, expense, total: income - expense };
}

function renderTransactionsList() {
    const el = document.getElementById("txList") || document.getElementById("txLive");
    if (!el) return;
    
    if (store.transactions.length === 0) {
        el.innerHTML = `<p style="opacity:0.5; padding:15px;">Aucune transaction enregistrée.</p>`;
        return;
    }

    el.innerHTML = store.transactions.map((t) => `
        <div class="card transaction-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div>
                <strong>${t.text}</strong> <br><small style="opacity:0.7">${t.category || 'Général'}</small>
            </div>
            <div style="text-align: right; display:flex; align-items:center; gap:15px;">
                <span style="font-weight:bold; color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                    ${t.type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString()} MAD
                </span>
                <button onclick="deleteTransaction('${t._id}')" class="btn-del" style="background:none; border:none; color:#e74a3b; cursor:pointer;">✕</button>
            </div>
        </div>
    `).join(""); // Retrait du .reverse() car le backend trie déjà par date
}

function clearInputs(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

document.addEventListener("DOMContentLoaded", refreshData);