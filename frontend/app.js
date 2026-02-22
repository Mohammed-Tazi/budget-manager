import { store } from "./store.js";

// --- SUPPRESSION GÉNÉRIQUE (Transactions & Objectifs) ---
// Cette fonction gère la suppression pour les deux types de données
window.handleDelete = async function(id, type) {
    if (!id || id === 'undefined') return alert("ID invalide.");
    if (!confirm(`Voulez-vous vraiment supprimer cet élément ?`)) return;

    try {
        if (type === 'goal') {
            // On tente deleteGoal, sinon deleteTransaction (selon votre API)
            if (store.deleteGoal) await store.deleteGoal(id);
            else await store.deleteTransaction(id);
        } else {
            await store.deleteTransaction(id);
        }
        await init(); // Recharge tout immédiatement
    } catch (err) {
        console.error("Erreur suppression:", err);
        alert("Erreur lors de la suppression.");
    }
};

// Aliases pour rester compatible avec votre HTML actuel
window.deleteTx = (id) => window.handleDelete(id, 'transaction');
window.deleteGoal = (id) => window.handleDelete(id, 'goal');

// --- AJOUT TRANSACTION ---
window.handleAdd = async function() {
    const textEl = document.getElementById('text');
    const amountEl = document.getElementById('amount');
    const categoryEl = document.getElementById('category');
    const typeEl = document.getElementById('type');

    if (!textEl?.value || !amountEl?.value) return alert("Champs obligatoires.");

    try {
        await store.saveTransaction({
            text: textEl.value,
            amount: Number(amountEl.value),
            category: categoryEl ? categoryEl.value : "Général",
            type: typeEl ? typeEl.value : "expense"
        });
        textEl.value = ""; amountEl.value = "";
        await init();
    } catch (err) { console.error(err); }
};

// --- ENREGISTRER UN OBJECTIF (GOAL) ---
window.handleSaveGoal = async function() {
    const titleEl = document.getElementById('goalName');
    const targetEl = document.getElementById('goalTarget');
    const currentEl = document.getElementById('goalSaved');

    if (!titleEl?.value || !targetEl?.value) return alert("Nom et cible requis.");

    try {
        await store.saveGoal({
            title: titleEl.value,
            target: Number(targetEl.value),
            current: Number(currentEl.value) || 0
        });
        titleEl.value = ""; targetEl.value = ""; currentEl.value = "";
        await init(); 
    } catch (err) { console.error(err); }
};

// --- MISE À JOUR DU GRAPHIQUE (DASHBOARD) ---
function updateChart(income, expense) {
    const ctx = document.getElementById('flowChart');
    if (!ctx) return;

    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    // Si pas de données, on affiche un cercle gris
    const dataValues = (income === 0 && expense === 0) ? [1, 0] : [income, expense];
    const colors = (income === 0 && expense === 0) ? ['#2c2c2c', '#e74a3b'] : ['#1cc88a', '#e74a3b'];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Revenus', 'Dépenses'],
            datasets: [{
                data: dataValues,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: { legend: { display: false } }
        }
    });
}

// --- INITIALISATION ET AFFICHAGE ---
async function init() {
    try {
        // Chargement des données depuis le store
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets(),
            store.fetchGoals()
        ]);

        const tx = store.transactions || [];
        const budgets = store.budgets || [];
        const goals = store.goals || [];

        // 1. Calculs des KPI et Score Santé
        const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const total = income - expense;

        if(document.getElementById("kpiTotal")) document.getElementById("kpiTotal").innerText = `${total} MAD`;
        if(document.getElementById("kpiIncome")) document.getElementById("kpiIncome").innerText = `${income} MAD`;
        if(document.getElementById("kpiExpense")) document.getElementById("kpiExpense").innerText = `${expense} MAD`;

        // Calcul Score Santé (Pourcentage d'épargne sur revenu)
        const scoreEl = document.getElementById("financeScore");
        if (scoreEl) {
            const score = income > 0 ? Math.max(0, Math.min(100, Math.round((total / income) * 100))) : 0;
            scoreEl.innerText = `${score}/100`;
            scoreEl.style.color = score > 60 ? "#1cc88a" : score > 30 ? "#f6c23e" : "#e74a3b";
        }

        updateChart(income, expense);

        // 2. Rendu des Budgets
        const budgetListEl = document.getElementById("budgetList");
        if (budgetListEl) {
            budgetListEl.innerHTML = budgets.map(b => {
                const spent = tx.filter(t => t.category === b.category && t.type === "expense").reduce((s, t) => s + t.amount, 0);
                const progress = Math.min(100, (spent / b.limit) * 100);
                return `
                    <div class="card">
                        <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                            <strong>${b.category}</strong>
                            <span>${spent}/${b.limit} MAD</span>
                        </div>
                        <div style="background:rgba(255,255,255,0.1); height:8px; border-radius:10px; overflow:hidden;">
                            <div style="background:${progress > 90 ? '#e74a3b' : '#3b82f6'}; width:${progress}%; height:100%;"></div>
                        </div>
                    </div>`;
            }).join("");
        }

        // 3. Rendu des Objectifs (Correction Suppression & 0%)
        const goalListEl = document.getElementById("goalList");
        if (goalListEl) {
            goalListEl.innerHTML = goals.map(g => {
                const id = g._id || g.id; // Récupération de l'ID MongoDB
                const title = g.title || g.name || "Objectif";
                const target = Number(g.target) || 0;
                const current = Number(g.current) || Number(g.saved) || 0;
                const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

                return `
                    <div class="card" style="margin-bottom:15px; position: relative;">
                        <button onclick="window.deleteGoal('${id}')" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #e74a3b; cursor: pointer; font-size: 16px;">✕</button>
                        <div style="margin-bottom:10px; padding-right: 25px;">
                            <strong>${title}</strong><br>
                            <small>${current} / ${target} MAD</small>
                        </div>
                        <div style="background:rgba(255,255,255,0.1); height:10px; border-radius:10px; overflow:hidden;">
                            <div style="background:#1cc88a; width:${progress}%; height:100%;"></div>
                        </div>
                        <p style="font-size:11px; margin-top:5px; opacity:0.6;">${progress.toFixed(0)}% atteint</p>
                    </div>`;
            }).join("");
        }

        // 4. Rendu des Transactions
        const listEl = document.getElementById("txList") || document.getElementById("txLive");
        if (listEl) {
            listEl.innerHTML = tx.map(t => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">
                    <div><strong>${t.text}</strong><br><small style="opacity:0.5;">${t.category}</small></div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">${t.amount}</b>
                        <button onclick="window.deleteTx('${t._id || t.id}')" style="background:none; border:none; color:#e74a3b; cursor:pointer;">✕</button>
                    </div>
                </div>`).join("");
        }
    } catch (err) { console.error("Erreur init:", err); }
}

document.addEventListener("DOMContentLoaded", init);