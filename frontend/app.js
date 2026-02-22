import { store } from "./store.js";

// --- INITIALISATION ---
async function init() {
    console.log("Initialisation du dashboard...");
    try {
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets()
        ]);

        const tx = store.transactions || [];
        const budgets = store.budgets || [];
        
        // Vérification de la page actuelle
        const isDashboard = document.getElementById('kpiTotal');
        const isTransactionPage = document.getElementById('txListFull') || document.getElementById('txList');
        const isBudgetPage = document.getElementById('budgetList');

        if (isDashboard) renderDashboard(tx);
        if (isTransactionPage) renderTransactionPage(tx);
        if (isBudgetPage) renderBudgetPage(budgets, tx);

    } catch (err) {
        console.error("Erreur d'initialisation :", err);
    }
}

// --- LOGIQUE BUDGETS ---
function renderBudgetPage(budgets, tx) {
    const listEl = document.getElementById("budgetList");
    if (!listEl) return;

    if (budgets.length === 0) {
        listEl.innerHTML = "<p style='opacity:0.5; padding:20px;'>Aucun budget défini.</p>";
        return;
    }

    listEl.innerHTML = budgets.map(b => {
        const spent = tx
            .filter(t => t.category === b.category && t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        
        const percent = Math.min(100, Math.round((spent / b.limit) * 100));
        const color = percent > 90 ? '#e74a3b' : percent > 70 ? '#f6c23e' : '#1cc88a';

        return `
            <div class="card" style="margin-bottom: 15px; border-left: 5px solid ${color}">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <strong>${b.category}</strong>
                    <span>${spent.toLocaleString()} / ${b.limit.toLocaleString()} MAD</span>
                </div>
                <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${percent}%; background: ${color}; height: 100%; transition: 0.3s;"></div>
                </div>
            </div>
        `;
    }).join("");
}

// --- ACTIONS GLOBALES (Attachées à Window) ---

window.handleSaveBudget = async function() {
    console.log("Tentative d'enregistrement du budget...");
    const catEl = document.getElementById('budgetCategory');
    const limitEl = document.getElementById('budgetLimit');

    // DEBUG : Vérifie si les éléments existent dans le DOM
    if (!catEl || !limitEl) {
        console.error("ERREUR : Les IDs budgetCategory ou budgetLimit sont introuvables dans le HTML !");
        return alert("Erreur technique : les champs de saisie sont introuvables.");
    }

    const category = catEl.value.trim();
    const limit = Number(limitEl.value);

    if (!category || !limit) {
        return alert("Veuillez remplir la catégorie et la limite.");
    }

    try {
        await store.saveBudget({ category, limit });
        console.log("Budget enregistré !");
        catEl.value = "";
        limitEl.value = "";
        await init(); 
    } catch (err) {
        console.error("Erreur store.saveBudget:", err);
        alert("Erreur lors de l'enregistrement.");
    }
};

window.handleAdd = async function() {
    const textEl = document.getElementById('text');
    const amountEl = document.getElementById('amount');
    const typeEl = document.getElementById('type');
    const catEl = document.getElementById('category');

    if (!textEl?.value || !amountEl?.value) return alert("Champs requis.");

    try {
        await store.saveTransaction({
            text: textEl.value,
            amount: Number(amountEl.value),
            type: typeEl?.value || 'expense',
            category: catEl?.value || 'Général'
        });
        textEl.value = "";
        amountEl.value = "";
        await init();
    } catch (err) {
        alert("Erreur ajout transaction.");
    }
};

window.handleDelete = async function(id) {
    if (!confirm("Supprimer ?")) return;
    try {
        await store.deleteTransaction(id);
        await init();
    } catch (err) {
        alert("Erreur suppression.");
    }
};

// --- DASHBOARD & GRAPHIQUE ---
function renderDashboard(tx) {
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const balance = income - expense;

    const update = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
    update("kpiTotal", `${balance.toLocaleString()} MAD`);
    update("kpiIncome", `${income.toLocaleString()} MAD`);
    update("kpiExpense", `${expense.toLocaleString()} MAD`);

    renderFlowChart(income, expense);
    
    const liveEl = document.getElementById("txLive");
    if (liveEl) {
        liveEl.innerHTML = tx.slice().reverse().slice(0, 5).map(t => `
            <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #222;">
                <span>${t.text}</span>
                <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">${t.amount} MAD</b>
            </div>
        `).join("");
    }
}

function renderFlowChart(inc, exp) {
    const ctx = document.getElementById("flowChart");
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Revenus', 'Dépenses'],
            datasets: [{ data: [inc, exp], backgroundColor: ['#1cc88a', '#e74a3b'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

document.addEventListener("DOMContentLoaded", init);