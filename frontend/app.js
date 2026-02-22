import { store } from "./store.js";

// 1. FONCTION POUR AJOUTER (Liée au bouton Bleu)
window.handleAdd = async () => {
    // On récupère les éléments selon tes captures d'écran
    const textEl = document.getElementById('text');
    const amountEl = document.getElementById('amount');
    const categoryEl = document.getElementById('category');
    const typeEl = document.getElementById('type'); // Pour la page transactions

    if (!textEl.value || !amountEl.value) {
        return alert("Veuillez remplir le libellé et le montant.");
    }

    // Déterminer le type (Revenu si c'est "Salaire" ou si le sélecteur est sur vert)
    let type = 'expense';
    if (typeEl) {
        type = typeEl.value;
    } else if (categoryEl.value === 'Salaire') {
        type = 'income';
    }

    const data = {
        text: textEl.value,
        amount: Number(amountEl.value),
        category: categoryEl.value,
        type: type
    };

    try {
        await store.saveTransaction(data);
        // Reset des champs
        textEl.value = "";
        amountEl.value = "";
        // Rafraîchir l'affichage immédiatement
        initPage();
    } catch (err) {
        alert("Erreur lors de l'ajout.");
    }
};

// 2. FONCTION POUR AFFICHER L'HISTORIQUE ET LES KPI
async function initPage() {
    await store.fetchTransactions();
    const tx = store.transactions;

    // Mise à jour des cartes (Solde, Revenus, Dépenses, Score)
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    
    if(document.getElementById("kpiTotal")) document.getElementById("kpiTotal").innerText = (income - expense) + " MAD";
    if(document.getElementById("kpiIncome")) document.getElementById("kpiIncome").innerText = income;
    if(document.getElementById("kpiExpense")) document.getElementById("kpiExpense").innerText = expense;

    // Calcul du Score Santé
    const scoreEl = document.getElementById("financeScore");
    if (scoreEl) {
        const score = income > 0 ? Math.max(0, Math.min(100, Math.round(((income - expense) / income) * 100))) : 0;
        scoreEl.innerText = `${score}/100`;
    }

    // Remplissage de l'historique (image_1f91e5)
    const listEl = document.getElementById("txList") || document.getElementById("txLive");
    if (listEl) {
        if (tx.length === 0) {
            listEl.innerHTML = "<p style='padding:15px; opacity:0.5;'>Aucune transaction trouvée.</p>";
        } else {
            listEl.innerHTML = tx.map(t => `
                <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span>${t.text} <small style="opacity:0.5">(${t.category})</small></span>
                    <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                        ${t.type === 'income' ? '+' : '-'}${t.amount} MAD
                    </b>
                </div>
            `).join("");
        }
    }
}

document.addEventListener("DOMContentLoaded", initPage);