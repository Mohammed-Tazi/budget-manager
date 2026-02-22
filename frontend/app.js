import { store } from "./store.js";

// --- SUPPRESSION ---
window.deleteTx = async function(id) {
    if (!confirm("Voulez-vous vraiment supprimer cette transaction ?")) return;
    try {
        await store.deleteTransaction(id);
        await init(); // Recharge les données pour mettre à jour le Dashboard et la liste
    } catch (err) {
        console.error("Erreur lors de la suppression:", err);
    }
};

// --- AJOUT ---
window.handleAdd = async function() {
    const textEl = document.getElementById('text');
    const amountEl = document.getElementById('amount');
    const categoryEl = document.getElementById('category');
    const typeEl = document.getElementById('type');

    if (!textEl.value || !amountEl.value) return alert("Remplissez les champs !");

    const data = {
        text: textEl.value,
        amount: Number(amountEl.value),
        category: categoryEl ? categoryEl.value : "Général",
        type: typeEl ? typeEl.value : (categoryEl.value === 'Salaire' ? 'income' : 'expense')
    };

    await store.saveTransaction(data);
    textEl.value = "";
    amountEl.value = "";
    await init();
};

// --- SYNCHRONISATION & AFFICHAGE ---
async function init() {
    await store.fetchTransactions();
    const tx = store.transactions;

    // Calculs pour les KPI (Dashboard)
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const total = income - expense;

    // Mise à jour des éléments du Dashboard s'ils existent
    if(document.getElementById("kpiTotal")) document.getElementById("kpiTotal").innerText = `${total} MAD`;
    if(document.getElementById("kpiIncome")) document.getElementById("kpiIncome").innerText = income;
    if(document.getElementById("kpiExpense")) document.getElementById("kpiExpense").innerText = expense;

    // Score Santé
    const scoreEl = document.getElementById("financeScore");
    if (scoreEl) {
        const score = income > 0 ? Math.max(0, Math.min(100, Math.round((total / income) * 100))) : 0;
        scoreEl.innerText = `${score}/100`;
    }

    // Affichage de l'historique (Transactions ou Dashboard)
    const listEl = document.getElementById("txList") || document.getElementById("txLive");
    if (listEl) {
        listEl.innerHTML = tx.map(t => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid rgba(255,255,255,0.1);">
                <div>
                    <div>${t.text}</div>
                    <small style="opacity:0.5;">${t.category}</small>
                </div>
                <div style="display:flex; align-items:center; gap:15px;">
                    <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                        ${t.type === 'income' ? '+' : '-'}${t.amount} MAD
                    </b>
                    <button onclick="window.deleteTx('${t._id}')" style="width:auto; padding:5px 8px; background:#e74a3b; font-size:10px; border-radius:5px;">X</button>
                </div>
            </div>
        `).join("");
    }
}

document.addEventListener("DOMContentLoaded", init);