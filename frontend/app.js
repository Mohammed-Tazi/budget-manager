import { store } from "./store.js";

/* ==========================================
   1. ACTIONS GLOBALES (Accessibles via HTML)
========================================== */

window.addTransaction = async (t) => {
    if (!t.text || !t.amount) return alert("Veuillez remplir le libellé et le montant.");
    
    const newTx = {
        text: t.text,
        amount: Number(t.amount),
        category: t.category || "Général",
        type: t.type || "expense"
    };

    try {
        await store.saveTransaction(newTx); 
        clearInputs(["text", "amount", "category"]);
        await refreshData(); 
        alert("Transaction ajoutée !");
    } catch (err) {
        alert("Erreur : " + err.message);
    }
};

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
   2. RENDU ET MISE À JOUR
========================================= */

async function refreshData() {
    try {
        await store.fetchTransactions();
        render();
    } catch (err) {
        console.error("Échec du chargement", err);
    }
}

function render() {
    const stats = calculateTotals();

    const update = (id, val, isCurrency = false) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val.toLocaleString() + (isCurrency ? " MAD" : "");
    };

    update("kpiTotal", stats.total, true);
    update("kpiIncome", stats.income);
    update("kpiExpense", stats.expense);

    renderTransactionsList();
}

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
        el.innerHTML = `<p style="opacity:0.5; padding:15px;">Aucune donnée.</p>`;
        return;
    }

    el.innerHTML = store.transactions.map((t) => `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 8px;">
            <div>
                <strong>${t.text}</strong> <br><small style="opacity:0.7">${t.category}</small>
            </div>
            <div style="text-align: right; display:flex; align-items:center; gap:15px;">
                <span style="font-weight:bold; color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                    ${t.type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString()} MAD
                </span>
                <button onclick="deleteTransaction('${t._id}')" style="background:none; border:none; color:#e74a3b; cursor:pointer; font-size: 1.2rem;">✕</button>
            </div>
        </div>
    `).join("");
}

function clearInputs(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

document.addEventListener("DOMContentLoaded", refreshData);