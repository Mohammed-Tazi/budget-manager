import { store } from "./store.js";

// On attache la fonction à 'window' pour que le bouton HTML la trouve
window.handleAdd = async function() {
    const textEl = document.getElementById('text');
    const amountEl = document.getElementById('amount');
    const categoryEl = document.getElementById('category');
    const typeEl = document.getElementById('type');

    if (!textEl.value || !amountEl.value) {
        alert("Veuillez remplir le libellé et le montant.");
        return;
    }

    const data = {
        text: textEl.value,
        amount: Number(amountEl.value),
        category: categoryEl ? categoryEl.value : "Général",
        type: typeEl ? typeEl.value : (categoryEl?.value === 'Salaire' ? 'income' : 'expense')
    };

    try {
        await store.saveTransaction(data);
        textEl.value = "";
        amountEl.value = "";
        // On relance l'affichage immédiatement après l'ajout
        await init();
    } catch (err) {
        console.error("Erreur d'ajout:", err);
    }
};

async function init() {
    await store.fetchTransactions();
    const tx = store.transactions;

    // 1. Calcul des KPI (Solde, Revenus, Dépenses)
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const total = income - expense;

    if(document.getElementById("kpiTotal")) document.getElementById("kpiTotal").innerText = `${total} MAD`;
    if(document.getElementById("kpiIncome")) document.getElementById("kpiIncome").innerText = income;
    if(document.getElementById("kpiExpense")) document.getElementById("kpiExpense").innerText = expense;

    // 2. Score Santé dynamique
    const scoreEl = document.getElementById("financeScore");
    if (scoreEl) {
        const score = income > 0 ? Math.max(0, Math.min(100, Math.round((total / income) * 100))) : 0;
        scoreEl.innerText = `${score}/100`;
        scoreEl.style.color = score > 70 ? "#1cc88a" : score > 40 ? "#f6c23e" : "#e74a3b";
    }

    // 3. Affichage de l'historique
    const listEl = document.getElementById("txList") || document.getElementById("txLive");
    if (listEl) {
        listEl.innerHTML = tx.length === 0 ? 
            "<p style='padding:15px; opacity:0.5;'>Aucune donnée...</p>" : 
            tx.map(t => `
                <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid rgba(255,255,255,0.1);">
                    <span>${t.text} <small style="opacity:0.5">(${t.category})</small></span>
                    <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                        ${t.type === 'income' ? '+' : '-'}${t.amount} MAD
                    </b>
                </div>
            `).join("");
    }
}

document.addEventListener("DOMContentLoaded", init);