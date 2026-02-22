import { store } from "./store.js";

// --- SUPPRESSION TRANSACTION ---
window.deleteTx = async function(id) {
    if (!confirm("Voulez-vous vraiment supprimer cette transaction ?")) return;
    try {
        await store.deleteTransaction(id);
        await init(); 
    } catch (err) {
        console.error("Erreur lors de la suppression:", err);
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
        category: categoryEl ? categoryEl.value : "Général",
        type: typeEl ? typeEl.value : "expense"
    };

    try {
        await store.saveTransaction(data);
        textEl.value = "";
        amountEl.value = "";
        await init();
    } catch (err) {
        console.error("Erreur ajout:", err);
    }
};

// --- ENREGISTRER UN BUDGET ---
window.handleSaveBudget = async function() {
    // On utilise les IDs 'cat' et 'val' de votre HTML
    const categoryEl = document.getElementById('cat');
    const limitEl = document.getElementById('val');

    if (!categoryEl?.value || !limitEl?.value) {
        return alert("Veuillez remplir la catégorie et la limite financière.");
    }

    try {
        await store.saveBudget({
            category: categoryEl.value,
            limit: Number(limitEl.value)
        }); 
        alert("Budget enregistré !");
        categoryEl.value = "";
        limitEl.value = "";
        await init(); // Recharge tout pour afficher la nouvelle carte
    } catch (err) {
        console.error("Erreur budget:", err);
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
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: { legend: { display: false } }
        }
    });
}

// --- INITIALISATION GLOBALE ---
async function init() {
    try {
        // 1. Charger toutes les données
        await store.fetchTransactions();
        await store.fetchBudgets();
        
        const tx = store.transactions;
        const budgets = store.budgets;

        // 2. Calculs des KPI
        const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const total = income - expense;

        // Mise à jour affichage KPI
        if(document.getElementById("kpiTotal")) document.getElementById("kpiTotal").innerText = `${total} MAD`;
        if(document.getElementById("kpiIncome")) document.getElementById("kpiIncome").innerText = `${income} MAD`;
        if(document.getElementById("kpiExpense")) document.getElementById("kpiExpense").innerText = `${expense} MAD`;

        // Score Santé
        const scoreEl = document.getElementById("financeScore");
        if (scoreEl) {
            const score = income > 0 ? Math.max(0, Math.min(100, Math.round((total / income) * 100))) : 0;
            scoreEl.innerText = `${score}/100`;
            scoreEl.style.color = score > 70 ? "#1cc88a" : score > 40 ? "#f6c23e" : "#e74a3b";
        }

        updateChart(income, expense);

        // 3. Affichage des Budgets (Page Budgets)
        const budgetListEl = document.getElementById("budgetList");
        if (budgetListEl) {
            budgetListEl.innerHTML = budgets.length === 0 ? 
                '<p style="opacity:0.5; grid-column: 1/-1;">Aucun budget défini.</p>' : 
                budgets.map(b => {
                    // Calcul de la barre de progression par catégorie
                    const spent = tx.filter(t => t.category === b.category && t.type === "expense")
                                    .reduce((s, t) => s + t.amount, 0);
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
                        </div>
                    `;
                }).join("");
        }

        // 4. Affichage des Transactions
        const listEl = document.getElementById("txList") || document.getElementById("txLive");
        if (listEl) {
            listEl.innerHTML = tx.length === 0 ? '<p style="opacity:0.5; padding:10px;">Aucune transaction.</p>' : 
            tx.map(t => `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">
                    <div>
                        <div style="font-weight:500;">${t.text}</div>
                        <small style="opacity:0.5;">${t.category}</small>
                    </div>
                    <div style="display:flex; align-items:center; gap:15px;">
                        <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                            ${t.type === 'income' ? '+' : '-'}${t.amount}
                        </b>
                        <button onclick="window.deleteTx('${t._id}')" style="background:none; border:none; color:#e74a3b; cursor:pointer;">✕</button>
                    </div>
                </div>
            `).join("");
        }
    } catch (err) {
        console.error("Erreur initialisation:", err);
    }
}

document.addEventListener("DOMContentLoaded", init);