import { store } from "./store.js";

// --- SUPPRESSION TRANSACTION ---
// Correction : Support des IDs MongoDB (_id) ou standard (id)
window.deleteTx = async function(id) {
    if (!id || id === 'undefined') return;
    if (!confirm("Voulez-vous vraiment supprimer cette transaction ?")) return;
    try {
        await store.deleteTransaction(id);
        await init(); // Recharge les données et l'UI
    } catch (err) {
        console.error("Erreur lors de la suppression:", err);
        alert("Impossible de supprimer la transaction.");
    }
};

// --- AJOUT TRANSACTION ---
window.handleAdd = async function() {
    const textEl = document.getElementById('text');
    const amountEl = document.getElementById('amount');
    const categoryEl = document.getElementById('category');
    const typeEl = document.getElementById('type');

    if (!textEl?.value || !amountEl?.value) {
        return alert("Veuillez remplir le libellé et le montant.");
    }

    const data = {
        text: textEl.value,
        amount: Number(amountEl.value),
        category: categoryEl?.value || "Général",
        type: typeEl?.value || "expense"
    };

    try {
        await store.saveTransaction(data);
        // Nettoyage propre
        textEl.value = "";
        amountEl.value = "";
        await init();
    } catch (err) {
        console.error("Erreur ajout:", err);
    }
};

// --- ENREGISTRER UN OBJECTIF (GOAL) ---
// Amélioration : Utilisation de sélecteurs ID plus robustes si possible
window.handleSaveGoal = async function() {
    const titleEl = document.getElementById('goalName'); // Recommandé d'ajouter ces IDs dans votre HTML
    const targetEl = document.getElementById('goalTarget');
    const currentEl = document.getElementById('goalCurrent');

    // Fallback sur votre méthode querySelector si les IDs n'existent pas encore
    const titleVal = titleEl?.value || document.querySelectorAll('.card input')[0]?.value;
    const targetVal = targetEl?.value || document.querySelectorAll('.card input')[1]?.value;
    const currentVal = currentEl?.value || document.querySelectorAll('.card input')[2]?.value;

    if (!titleVal || !targetVal) {
        return alert("Veuillez remplir le nom et le montant cible.");
    }

    try {
        await store.saveGoal({
            title: titleVal,
            target: Number(targetVal),
            current: Number(currentVal) || 0
        });
        alert("Objectif enregistré !");
        
        // Nettoyage via les éléments ou la boucle
        if(titleEl) { titleEl.value = ""; targetEl.value = ""; currentEl.value = ""; }
        else { document.querySelectorAll('.card input').forEach(input => input.value = ""); }
        
        await init();
    } catch (err) {
        console.error("Erreur objectif:", err);
    }
};

// --- INITIALISATION GLOBALE ---
async function init() {
    try {
        // Chargement parallèle pour plus de rapidité
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets(),
            store.fetchGoals()
        ]);
        
        const tx = store.transactions || [];
        const budgets = store.budgets || [];
        const goals = store.goals || [];

        // 2. Calculs des KPI
        const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
        const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
        const total = income - expense;

        // Mise à jour sécurisée du DOM
        const updateText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        updateText("kpiTotal", `${total.toLocaleString()} MAD`);
        updateText("kpiIncome", `${income.toLocaleString()} MAD`);
        updateText("kpiExpense", `${expense.toLocaleString()} MAD`);

        // Score financier
        const scoreEl = document.getElementById("financeScore");
        if (scoreEl) {
            const score = income > 0 ? Math.max(0, Math.min(100, Math.round((total / income) * 100))) : 0;
            scoreEl.innerText = `${score}/100`;
            scoreEl.style.color = score > 70 ? "#1cc88a" : score > 40 ? "#f6c23e" : "#e74a3b";
        }

        updateChart(income, expense);

        // 3. Rendu des listes (Budgets, Goals, Transactions)
        renderBudgetList(budgets, tx);
        renderGoalList(goals);
        renderTransactionList(tx);

    } catch (err) {
        console.error("Erreur initialisation:", err);
    }
}

// --- FONCTIONS DE RENDU (Pour clarifier init) ---

function renderBudgetList(budgets, tx) {
    const el = document.getElementById("budgetList");
    if (!el) return;
    el.innerHTML = budgets.length === 0 ? 
        '<p style="opacity:0.5; grid-column: 1/-1;">Aucun budget défini.</p>' : 
        budgets.map(b => {
            const spent = tx.filter(t => t.category === b.category && t.type === "expense")
                            .reduce((s, t) => s + Number(t.amount), 0);
            const progress = Math.min(100, (spent / b.limit) * 100);
            return `
                <div class="card">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <strong>${b.category}</strong>
                        <span>${spent} / ${b.limit} MAD</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:10px; overflow:hidden;">
                        <div style="background:${progress > 90 ? '#e74a3b' : '#3b82f6'}; width:${progress}%; height:100%;"></div>
                    </div>
                </div>`;
        }).join("");
}

function renderTransactionList(tx) {
    const el = document.getElementById("txList") || document.getElementById("txLive");
    if (!el) return;
    el.innerHTML = tx.length === 0 ? '<p style="opacity:0.5; padding:10px;">Aucune transaction.</p>' : 
        tx.map(t => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">
                <div>
                    <div style="font-weight:500;">${t.text}</div>
                    <small style="opacity:0.5;">${t.category}</small>
                </div>
                <div style="display:flex; align-items:center; gap:15px;">
                    <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                        ${t.type === 'income' ? '+' : '-'}${Math.abs(t.amount)}
                    </b>
                    <button onclick="window.deleteTx('${t._id || t.id}')" style="background:none; border:none; color:#e74a3b; cursor:pointer; padding:5px;">✕</button>
                </div>
            </div>`).join("");
}

// Helper pour GoalList à ajouter selon le même modèle...

document.addEventListener("DOMContentLoaded", init);