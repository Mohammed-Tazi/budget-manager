import { store } from "./store.js";

// --- SUPPRESSION ---
window.deleteTx = async function(id) {
    if (!confirm("Voulez-vous vraiment supprimer cette transaction ?")) return;
    try {
        await store.deleteTransaction(id);
        await init(); 
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

// --- FONCTION GRAPHIQUE ---
function updateChart(income, expense) {
    const ctx = document.getElementById('flowChart');
    if (!ctx) return; // Si on n'est pas sur le dashboard, on arrête

    // On détruit l'ancien graphique s'il existe pour éviter les bugs visuels
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Revenus', 'Dépenses'],
            datasets: [{
                data: [income, expense],
                backgroundColor: ['#1cc88a', '#e74a3b'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%', // Style anneau fin
            plugins: {
                legend: { display: false } // On cache la légende pour un look plus clean
            }
        }
    });
}

// --- SYNCHRONISATION & AFFICHAGE ---
async function init() {
    await store.fetchTransactions();
    const tx = store.transactions;

    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const total = income - expense;

    // Mise à jour des KPI
    if(document.getElementById("kpiTotal")) document.getElementById("kpiTotal").innerText = `${total} MAD`;
    if(document.getElementById("kpiIncome")) document.getElementById("kpiIncome").innerText = income;
    if(document.getElementById("kpiExpense")) document.getElementById("kpiExpense").innerText = expense;

    // Score Santé
    const scoreEl = document.getElementById("financeScore");
    if (scoreEl) {
        const score = income > 0 ? Math.max(0, Math.min(100, Math.round((total / income) * 100))) : 0;
        scoreEl.innerText = `${score}/100`;
    }

    // MISE À JOUR DU GRAPHIQUE
    updateChart(income, expense);

    // Affichage de l'historique
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
                    <button onclick="window.deleteTx('${t._id}')" style="width:auto; padding:5px 8px; background:#e74a3b; font-size:10px; border-radius:5px; color:white; border:none; cursor:pointer;">X</button>
                </div>
            </div>
        `).join("");
    }
}

document.addEventListener("DOMContentLoaded", init);