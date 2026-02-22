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

// --- AJOUT TRANSACTION ---
window.handleAdd = async function() {
    const textEl = document.getElementById('text');
    const amountEl = document.getElementById('amount');
    const categoryEl = document.getElementById('category');
    const typeEl = document.getElementById('type');

    if (!textEl || !amountEl || !textEl.value || !amountEl.value) {
        return alert("Veuillez remplir le libellé et le montant.");
    }

    const data = {
        text: textEl.value,
        amount: Number(amountEl.value),
        category: categoryEl ? categoryEl.value : "Général",
        // On donne la priorité au menu déroulant s'il existe
        type: typeEl ? typeEl.value : (categoryEl?.value === 'Salaire' ? 'income' : 'expense')
    };

    try {
        await store.saveTransaction(data);
        textEl.value = "";
        amountEl.value = "";
        if (categoryEl) categoryEl.value = "";
        await init();
    } catch (err) {
        console.error("Erreur ajout:", err);
    }
};

// --- ENREGISTRER UN BUDGET (Version sécurisée par ID) ---
window.handleSaveBudget = async function() {
    // Il est préférable de mettre des ID (id="budgetCat" et id="budgetLimit") dans ton HTML
    const categoryEl = document.getElementById('budgetCat');
    const limitEl = document.getElementById('budgetLimit');

    // Fallback si tu n'as pas encore mis les IDs
    const catVal = categoryEl ? categoryEl.value : document.querySelectorAll('.card input')[0]?.value;
    const limitVal = limitEl ? limitEl.value : document.querySelectorAll('.card input')[1]?.value;

    if (!catVal || !limitVal) {
        return alert("Veuillez remplir la catégorie et la limite financière.");
    }

    try {
        await store.saveBudget({
            category: catVal,
            limit: Number(limitVal)
        }); 
        alert("Budget enregistré !");
        
        // Nettoyage
        if(categoryEl) categoryEl.value = "";
        if(limitEl) limitEl.value = "";
        
        await init(); 
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
                borderWidth: 0,
                hoverOffset: 10
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

// --- SYNCHRONISATION ---
async function init() {
    try {
        await store.fetchTransactions();
        const tx = store.transactions;

        const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const total = income - expense;

        if(document.getElementById("kpiTotal")) document.getElementById("kpiTotal").innerText = `${total} MAD`;
        if(document.getElementById("kpiIncome")) document.getElementById("kpiIncome").innerText = `${income} MAD`;
        if(document.getElementById("kpiExpense")) document.getElementById("kpiExpense").innerText = `${expense} MAD`;

        const scoreEl = document.getElementById("financeScore");
        if (scoreEl) {
            const score = income > 0 ? Math.max(0, Math.min(100, Math.round((total / income) * 100))) : 0;
            scoreEl.innerText = `${score}/100`;
            scoreEl.style.color = score > 70 ? "#1cc88a" : score > 40 ? "#f6c23e" : "#e74a3b";
        }

        updateChart(income, expense);

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
                        <button onclick="window.deleteTx('${t._id}')" style="background:none; border:none; color:#e74a3b; cursor:pointer; font-weight:bold; padding:5px;">✕</button>
                    </div>
                </div>
            `).join("");
        }
    } catch (err) {
        console.error("Erreur initialisation:", err);
    }
}

document.addEventListener("DOMContentLoaded", init);