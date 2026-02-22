import { store } from "./store.js";

// --- INITIALISATION PRINCIPALE ---
async function init() {
    try {
        // Chargement global des données
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets()
        ]);

        const tx = store.transactions || [];
        
        // 1. Détection de la page actuelle via les IDs du HTML
        const kpiTotalEl = document.getElementById('kpiTotal'); // Présent sur Dashboard
        const txListFullEl = document.getElementById('txListFull'); // Présent sur Transactions

        if (kpiTotalEl) {
            renderDashboard(tx);
        }

        if (txListFullEl) {
            renderTransactionPage(tx);
        }

    } catch (err) {
        console.error("Erreur d'initialisation :", err);
    }
}

// --- LOGIQUE DU DASHBOARD ---
function renderDashboard(tx) {
    // Calculs des KPI
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const balance = income - expense;

    // Mise à jour des textes
    const update = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
    
    update("kpiTotal", `${balance.toLocaleString()} MAD`);
    update("kpiIncome", `${income.toLocaleString()} MAD`);
    update("kpiExpense", `${expense.toLocaleString()} MAD`);

    // Score Santé
    const scoreEl = document.getElementById("financeScore");
    if (scoreEl) {
        const score = income > 0 ? Math.max(0, Math.min(100, Math.round((balance / income) * 100))) : 0;
        scoreEl.innerText = `${score}/100`;
        scoreEl.style.color = score > 70 ? "#1cc88a" : score > 40 ? "#f6c23e" : "#e74a3b";
    }

    // Graphique et Activités récentes
    renderFlowChart(income, expense);
    
    const liveEl = document.getElementById("txLive");
    if (liveEl) {
        liveEl.innerHTML = tx.slice().reverse().slice(0, 5).map(t => `
            <div style="display:flex; justify-content:space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                <span>${t.text || 'Sans titre'}</span>
                <span style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                    ${t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toLocaleString()} MAD
                </span>
            </div>
        `).join("");
    }
}

// --- LOGIQUE PAGE TRANSACTIONS ---
function renderTransactionPage(tx) {
    const listEl = document.getElementById("txListFull");
    if (!listEl) return;

    if (tx.length === 0) {
        listEl.innerHTML = "<p style='padding:20px; opacity:0.5;'>Aucune transaction.</p>";
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
                    ${Math.abs(t.amount).toLocaleString()} MAD
                </b>
                <button onclick="window.handleDelete('${t._id || t.id}')" style="background:none; border:none; color:#e74a3b; cursor:pointer;">✕</button>
            </div>
        </div>
    `).join("");
}

// --- ACTIONS GLOBALES ---
window.handleAddTransaction = async function() {
    const data = {
        text: document.getElementById('text')?.value,
        amount: Number(document.getElementById('amount')?.value),
        category: document.getElementById('category')?.value || "Général",
        type: document.getElementById('type')?.value || "expense"
    };

    if (!data.text || !data.amount) return alert("Champs obligatoires manquants.");

    try {
        await store.saveTransaction(data);
        document.getElementById('text').value = "";
        document.getElementById('amount').value = "";
        await init(); 
    } catch (err) { alert("Erreur lors de l'ajout."); }
};

window.handleDelete = async function(id) {
    if (!confirm("Supprimer ?")) return;
    try {
        await store.deleteTransaction(id);
        await init();
    } catch (err) { alert("Erreur suppression."); }
};

function renderFlowChart(income, expense) {
    const ctx = document.getElementById("flowChart");
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Revenus', 'Dépenses'],
            datasets: [{ data: [income, expense], backgroundColor: ['#1cc88a', '#e74a3b'], borderRadius: 5 }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

document.addEventListener("DOMContentLoaded", init);