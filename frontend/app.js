import { store } from "./store.js";

// --- SUPPRESSION TRANSACTION ---
window.deleteTx = async function(id) {
    if (!confirm("Voulez-vous vraiment supprimer cette transaction ?")) return;
    try {
        await store.deleteTransaction(id);
        await init(); 
    } catch (err) {
        console.error("Erreur suppression:", err);
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

    try {
        await store.saveTransaction({
            text: textEl.value,
            amount: Number(amountEl.value),
            category: categoryEl ? categoryEl.value : "Général",
            type: typeEl ? typeEl.value : "expense"
        });
        textEl.value = "";
        amountEl.value = "";
        await init();
    } catch (err) {
        console.error("Erreur ajout tx:", err);
    }
};

// --- ENREGISTRER UN BUDGET ---
window.handleSaveBudget = async function() {
    const categoryEl = document.getElementById('cat');
    const limitEl = document.getElementById('val');

    if (!categoryEl?.value || !limitEl?.value) {
        return alert("Veuillez remplir la catégorie et la limite.");
    }

    try {
        await store.saveBudget({
            category: categoryEl.value,
            limit: Number(limitEl.value)
        }); 
        alert("Budget enregistré !");
        categoryEl.value = "";
        limitEl.value = "";
        await init(); 
    } catch (err) {
        console.error("Erreur budget:", err);
    }
};

// --- ENREGISTRER UN OBJECTIF (GOAL) ---
window.handleSaveGoal = async function() {
    const titleEl = document.getElementById('goalName');
    const targetEl = document.getElementById('goalTarget');
    const currentEl = document.getElementById('goalSaved');

    if (!titleEl?.value || !targetEl?.value) {
        return alert("Veuillez remplir le nom et le montant cible.");
    }

    try {
        await store.saveGoal({
            title: titleEl.value, // On utilise "title" comme clé
            target: Number(targetEl.value),
            current: Number(currentEl.value) || 0
        });
        alert("Objectif enregistré !");
        titleEl.value = "";
        targetEl.value = "";
        currentEl.value = "";
        await init(); 
    } catch (err) {
        console.error("Erreur objectif:", err);
    }
};

// --- GRAPHIQUE ---
function updateChart(income, expense) {
    const ctx = document.getElementById('flowChart');
    if (!ctx) return;
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Revenus', 'Dépenses'],
            datasets: [{
                data: [income, expense],
                backgroundColor: ['#1cc88a', '#e74a3b'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '80%', plugins: { legend: { display: false } } }
    });
}

// --- INITIALISATION GLOBALE ---
async function init() {
    try {
        await store.fetchTransactions();
        await store.fetchBudgets();
        await store.fetchGoals();
        
        const tx = store.transactions;
        const budgets = store.budgets;
        const goals = store.goals;

        // 1. KPI
        const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const total = income - expense;

        if(document.getElementById("kpiTotal")) document.getElementById("kpiTotal").innerText = `${total} MAD`;
        if(document.getElementById("kpiIncome")) document.getElementById("kpiIncome").innerText = `${income} MAD`;
        if(document.getElementById("kpiExpense")) document.getElementById("kpiExpense").innerText = `${expense} MAD`;

        // 2. Budgets
        const budgetListEl = document.getElementById("budgetList");
        if (budgetListEl) {
            budgetListEl.innerHTML = budgets.map(b => {
                const spent = tx.filter(t => t.category === b.category && t.type === "expense").reduce((s, t) => s + t.amount, 0);
                const progress = Math.min(100, (spent / b.limit) * 100);
                return `<div class="card">
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

        // 3. Objectifs (Correction "undefined" et "NaN")
        const goalListEl = document.getElementById("goalList");
        if (goalListEl) {
            goalListEl.innerHTML = goals.map(g => {
                const title = g.title || g.name || "Objectif";
                const target = Number(g.target) || 0;
                const current = Number(g.current) || 0;
                const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

                return `<div class="card" style="margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <strong>${title}</strong>
                        <span>${current} / ${target} MAD</span>
                    </div>
                    <div style="background:rgba(255,255,255,0.1); height:10px; border-radius:10px; overflow:hidden;">
                        <div style="background:#1cc88a; width:${progress}%; height:100%;"></div>
                    </div>
                    <p style="font-size:11px; margin-top:5px; opacity:0.6;">${progress.toFixed(0)}% atteint</p>
                </div>`;
            }).join("");
        }

        // 4. Transactions
        const listEl = document.getElementById("txList") || document.getElementById("txLive");
        if (listEl) {
            listEl.innerHTML = tx.map(t => `<div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">
                <div><strong>${t.text}</strong><br><small>${t.category}</small></div>
                <div><b style="color:${t.type==='income'?'#1cc88a':'#e74a3b'}">${t.amount}</b>
                <button onclick="window.deleteTx('${t._id}')" style="background:none; border:none; color:#e74a3b; cursor:pointer; margin-left:10px;">✕</button></div>
            </div>`).join("");
        }
        updateChart(income, expense);
    } catch (err) { console.error("Init error:", err); }
}

document.addEventListener("DOMContentLoaded", init);