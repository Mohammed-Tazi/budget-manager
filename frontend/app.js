import { store } from "./store.js";

// Cette fonction gère l'ajout d'une transaction
async function handleAddTransaction() {
    const textEl = document.getElementById('text');
    const amountEl = document.getElementById('amount');
    const categoryEl = document.getElementById('category');
    const typeEl = document.getElementById('type');

    if (!textEl || !amountEl || !textEl.value || !amountEl.value) {
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
        // On rafraîchit la page pour tout mettre à jour proprement
        window.location.reload();
    } catch (err) {
        console.error("Erreur lors de l'ajout:", err);
        alert("Impossible d'ajouter l'opération.");
    }
}

// Cette fonction initialise l'affichage (KPI + Historique)
async function init() {
    try {
        await store.fetchTransactions();
        const tx = store.transactions;

        // 1. Calcul des chiffres (KPI)
        const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const total = income - expense;

        // Mise à jour visuelle des cartes (si elles existent sur la page)
        if(document.getElementById("kpiTotal")) document.getElementById("kpiTotal").innerText = `${total} MAD`;
        if(document.getElementById("kpiIncome")) document.getElementById("kpiIncome").innerText = income;
        if(document.getElementById("kpiExpense")) document.getElementById("kpiExpense").innerText = expense;

        // Score Santé : (Épargne / Revenus) * 100
        const scoreEl = document.getElementById("financeScore");
        if (scoreEl) {
            const score = income > 0 ? Math.max(0, Math.min(100, Math.round((total / income) * 100))) : 0;
            scoreEl.innerText = `${score}/100`;
            scoreEl.style.color = score > 70 ? "#1cc88a" : score > 40 ? "#f6c23e" : "#e74a3b";
        }

        // 2. Remplissage de l'historique (Dashboard ou Page Transactions)
        const listEl = document.getElementById("txList") || document.getElementById("txLive");
        if (listEl) {
            if (tx.length === 0) {
                listEl.innerHTML = "<p style='padding:20px; opacity:0.5;'>Aucune transaction enregistrée.</p>";
            } else {
                listEl.innerHTML = tx.map(t => `
                    <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">
                        <div>
                            <div style="font-weight:500;">${t.text}</div>
                            <small style="opacity:0.5;">${t.category}</small>
                        </div>
                        <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                            ${t.type === 'income' ? '+' : '-'}${t.amount} MAD
                        </b>
                    </div>
                `).join("");
            }
        }

        // 3. ATTACHER L'ÉVÉNEMENT AU BOUTON (La clé du problème)
        const btn = document.querySelector('button'); 
        if (btn) {
            // On enlève l'ancien événement pour éviter les doublons et on ajoute le nouveau
            btn.onclick = handleAddTransaction;
        }

    } catch (err) {
        console.error("Erreur d'initialisation:", err);
    }
}

// Lancement au chargement de la page
document.addEventListener("DOMContentLoaded", init);