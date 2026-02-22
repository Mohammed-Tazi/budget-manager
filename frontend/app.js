import { store } from "./store.js";

// --- CONSTANTES & UTILITAIRES ---
const formatMAD = (amount) => new Intl.NumberFormat('fr-MA', { 
    style: 'currency', 
    currency: 'MAD',
    maximumFractionDigits: 0 
}).format(amount);

// --- INITIALISATION ---
async function init() {
    const mainEl = document.querySelector('.main');
    if (mainEl) mainEl.style.opacity = "0.5"; 

    try {
        // Chargement initial des données depuis votre store actuel
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets(),
            store.fetchGoals()
        ]);
        refreshUI();
    } catch (err) {
        console.error("🚀 Erreur d'initialisation :", err);
    } finally {
        if (mainEl) mainEl.style.opacity = "1";
    }
}

function refreshUI() {
    updateDashboard(); // Gère les totaux et le graphique
    renderGoals();
    renderTransactions();
    renderBudgets();
}

// --- RENDU DES COMPOSANTS ---

function renderBudgets() {
    const listEl = document.getElementById("budgetList");
    if (!listEl) return;

    listEl.innerHTML = (store.budgets || []).map(b => `
        <div class="card" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-left: 4px solid #3b82f6;">
            <div>
                <strong style="text-transform: capitalize;">${b.category}</strong><br>
                <small style="opacity: 0.7;">Limite : ${formatMAD(b.limit)}</small>
            </div>
            <button onclick="handleDelete('${b._id || b.id}', 'budget')" style="color: #e74a3b; background: none; border: none; cursor: pointer; font-size: 1.2rem;">✕</button>
        </div>
    `).join("");
}

function renderGoals() {
    const listEl = document.getElementById("goalList");
    if (!listEl) return;

    listEl.innerHTML = (store.goals || []).map(g => {
        const target = Number(g.target) || 0;
        const current = Number(g.current) || 0;
        const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

        return `
            <div class="card" style="position: relative; margin-bottom: 15px; padding: 20px;">
                <button onclick="handleDelete('${g._id || g.id}', 'goal')" style="position: absolute; top: 10px; right: 10px; color: #e74a3b; background: none; border: none; cursor: pointer;">✕</button>
                <strong>${g.title || g.name || "Objectif"}</strong><br>
                <small>${formatMAD(current)} / ${formatMAD(target)}</small>
                <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 5px; margin: 10px 0; overflow: hidden;">
                    <div style="background: #1cc88a; width: ${progress}%; height: 100%;"></div>
                </div>
                <span style="font-size: 11px; color: #1cc88a;">${progress.toFixed(0)}% atteint</span>
            </div>`;
    }).join("");
}

function renderTransactions() {
    const listEl = document.getElementById("txList") || document.getElementById("txLive");
    if (!listEl) return;

    listEl.innerHTML = (store.transactions || []).map(t => `
        <div style="display:flex; justify-content:space-between; padding: 12px; border-bottom: 1px solid #ffffff11;">
            <span>${t.text} <br><small style="opacity:0.5">${t.category || 'Général'}</small></span>
            <div style="text-align: right;">
                <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                    ${t.type === 'income' ? '+' : '-'} ${formatMAD(t.amount)}
                </b>
            </div>
        </div>
    `).join("");
}

// --- LOGIQUE DASHBOARD & CHART ---

function updateDashboard() {
    const tx = store.transactions || [];
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const total = income - expense;

    const kpiTotal = document.getElementById("kpiTotal");
    if(kpiTotal) {
        kpiTotal.innerText = formatMAD(total);
        kpiTotal.style.color = total >= 0 ? "#1cc88a" : "#e74a3b";
    }
    
    // Appel de la fonction graphique (corrigée ci-dessous)
    updateChart(income, expense);
}

function updateChart(income, expense) {
    const ctx = document.getElementById('flowChart') || document.getElementById('pie');
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

// --- ACTIONS GLOBALES ---

window.handleSaveBudget = async function() {
    const catEl = document.getElementById('cat');
    const valEl = document.getElementById('val');

    if (!catEl?.value || !valEl?.value) return alert("⚠️ Remplissez les champs !");

    try {
        await store.saveBudget({ category: catEl.value, limit: Number(valEl.value) });
        catEl.value = ""; valEl.value = "";
        await init();
    } catch (err) { alert("Erreur lors de l'enregistrement"); }
};

window.handleSaveGoal = async function() {
    const titleEl = document.getElementById('goalName');
    const targetEl = document.getElementById('goalTarget');
    const currentEl = document.getElementById('goalSaved');

    if (!titleEl?.value || !targetEl?.value) return alert("⚠️ Nom et objectif requis.");

    try {
        await store.saveGoal({ 
            title: titleEl.value, 
            target: Number(targetEl.value), 
            current: Number(currentEl.value || 0) 
        });
        titleEl.value = ""; targetEl.value = ""; currentEl.value = "";
        await init();
    } catch (err) { alert("Erreur lors de l'enregistrement"); }
};

window.handleDelete = async function(id, type) {
    if (!id || id === 'undefined') return;
    if (!confirm("Voulez-vous vraiment supprimer cet élément ?")) return;

    try {
        if (type === 'goal') await store.deleteGoal(id);
        else if (type === 'budget') await store.deleteBudget(id);
        else await store.deleteTransaction(id);
        await init();
    } catch (err) { alert("Erreur lors de la suppression."); }
};

window.handleReset = async function() {
    if (!confirm("⚠️ Tout réinitialiser ?")) return;
    try {
        await store.resetAllData();
        await init();
    } catch (err) { alert("Erreur reset"); }
};

document.addEventListener("DOMContentLoaded", init);