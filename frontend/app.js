import { store } from "./store.js";

// --- INITIALISATION PRINCIPALE ---
async function init() {
    try {
        // Chargement des données depuis le store
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets()
        ]);

        const tx = store.transactions || [];
        const budgets = store.budgets || [];
        
        // Détection de la page actuelle
        const isDashboard = document.getElementById('kpiTotal');
        const isTransactionPage = document.getElementById('txList');
        const isBudgetPage = document.getElementById('budgetList');

        // Exécution des rendus selon la page
        if (isDashboard) renderDashboard(tx);
        if (isTransactionPage) renderTransactionPage(tx);
        if (isBudgetPage) renderBudgetPage(budgets, tx);

    } catch (err) {
        console.error("Erreur d'initialisation :", err);
    }
}

// --- GESTION DES BUDGETS ---
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
            <div class="card" style="margin-bottom: 15px;">
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

// --- LOGIQUE DU DASHBOARD ---
function renderDashboard(tx) {
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const balance = income - expense;

    const update = (id, val) => { 
        const el = document.getElementById(id);
        if(el) el.innerText = val; 
    };
    
    update("kpiTotal", `${balance.toLocaleString()} MAD`);
    update("kpiIncome", `${income.toLocaleString()} MAD`);
    update("kpiExpense", `${expense.toLocaleString()} MAD`);

    const scoreEl = document.getElementById("financeScore");
    if (scoreEl) {
        const score = income > 0 ? Math.max(0, Math.min(100, Math.round((balance / income) * 100))) : 0;
        scoreEl.innerText = `${score}/100`;
        scoreEl.style.color = score > 70 ? "#1cc88a" : score > 40 ? "#f6c23e" : "#e74a3b";
    }

    renderFlowChart(income, expense);

    const liveEl = document.getElementById("txLive");
    if (liveEl) {
        const recent = tx.slice().reverse().slice(0, 5);
        liveEl.innerHTML = recent.length === 0 ? 
            "<p style='opacity:0.5; padding:20px;'>Aucune activité.</p>" :
            recent.map(t => `
                <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">
                    <span>${t.text || 'Sans titre'}</span>
                    <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                        ${t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toLocaleString()} MAD
                    </b>
                </div>
            `).join("");
    }
}

// --- LOGIQUE PAGE TRANSACTIONS ---
function renderTransactionPage(tx) {
    const listEl = document.getElementById("txList");
    if (!listEl) return;

    if (tx.length === 0) {
        listEl.innerHTML = "<p style='padding:20px; opacity:0.5;'>Aucune transaction enregistrée.</p>";
        return;
    }

    listEl.innerHTML = tx.slice().reverse().map(t => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div>
                <strong>${t.text || 'Sans titre'}</strong><br>
                <small style="opacity:0.5;">${t.category || 'Général'}</small>
            </div>
            <div style="display:flex; align-items:center; gap:20px;">
                <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                    ${t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toLocaleString()} MAD
                </b>
                <button onclick="window.handleDelete('${t._id || t.id}')" style="background:none; border:none; color:#e74a3b; cursor:pointer; font-size:18px;">✕</button>
            </div>
        </div>
    `).join("");
}

// --- ACTIONS GLOBALES (Attachées à window pour le HTML) ---

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
            category: categoryEl?.value || "Général",
            type: typeEl?.value || "expense"
        });
        
        // Reset des champs
        textEl.value = "";
        amountEl.value = "";
        if(categoryEl) categoryEl.value = "";
        
        await init(); 
    } catch (err) {
        alert("Erreur lors de l'ajout.");
    }
};

window.handleDelete = async function(id) {
    if (!confirm("Supprimer cette transaction ?")) return;
    try {
        await store.deleteTransaction(id);
        await init();
    } catch (err) {
        alert("Erreur lors de la suppression.");
    }
};

window.handleSaveBudget = async function() {
    const catEl = document.getElementById('budgetCategory'); 
    const limitEl = document.getElementById('budgetLimit');  

    if (!catEl?.value || !limitEl?.value) {
        return alert("Veuillez remplir la catégorie et la limite.");
    }

    try {
        await store.saveBudget({
            category: catEl.value,
            limit: Number(limitEl.value)
        });
        catEl.value = "";
        limitEl.value = "";
        await init();
    } catch (err) {
        alert("Erreur lors de l'enregistrement du budget.");
    }
};

// --- GRAPHIQUE ---
function renderFlowChart(income, expense) {
    const ctx = document.getElementById("flowChart");
    if (!ctx) return;
    
    // Si Chart.js est disponible
    if (typeof Chart !== 'undefined') {
        const existing = Chart.getChart(ctx);
        if (existing) existing.destroy();
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Revenus', 'Dépenses'],
                datasets: [{ data: [income, expense], backgroundColor: ['#1cc88a', '#e74a3b'], borderRadius: 5 }]
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } }
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", init);