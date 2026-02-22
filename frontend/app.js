import { store } from "./store.js";

// --- INITIALISATION ---
async function init() {
    try {
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets(),
            store.fetchGoals()
        ]);

        updateDashboard();
        renderGoals();
        renderTransactions();
        renderBudgets();
    } catch (err) {
        console.error("Erreur d'initialisation :", err);
    }
}

// --- RENDU DES BUDGETS ---
function renderBudgets() {
    const listEl = document.getElementById("budgetList");
    if (!listEl) return;

    listEl.innerHTML = (store.budgets || []).map(b => {
        const id = b._id || b.id;
        return `
            <div class="card" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 15px;">
                <div>
                    <strong style="color: white;">${b.category}</strong><br>
                    <small style="opacity: 0.7;">Limite : ${b.limit} MAD</small>
                </div>
                <button onclick="handleDelete('${id}', 'budget')" 
                        style="color: #e74a3b; background: none; border: none; cursor: pointer; font-size: 1.2rem;">
                    ✕
                </button>
            </div>`;
    }).join("");
}

// --- ACTION ENREGISTRER BUDGET (Cible les IDs 'cat' et 'val') ---
window.handleSaveBudget = async function() {
    const categoryEl = document.getElementById('cat'); // Correspond à votre HTML
    const limitEl = document.getElementById('val');    // Correspond à votre HTML

    if (!categoryEl?.value || !limitEl?.value) {
        return alert("Veuillez remplir la catégorie et la limite.");
    }

    try {
        await store.saveBudget({
            category: categoryEl.value,
            limit: Number(limitEl.value)
        });
        
        categoryEl.value = ""; 
        limitEl.value = "";
        await init(); // Recharge l'affichage immédiatement
    } catch (err) {
        console.error("Erreur sauvegarde budget:", err);
    }
};

// --- RENDU DES OBJECTIFS ---
function renderGoals() {
    const listEl = document.getElementById("goalList");
    if (!listEl) return;
    listEl.innerHTML = (store.goals || []).map(g => {
        const id = g._id || g.id;
        const title = g.title || g.name || "Objectif";
        const target = Number(g.target) || 0;
        const current = Number(g.current) || 0;
        const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
        return `
            <div class="card" style="position: relative; margin-bottom: 15px; padding: 20px;">
                <button onclick="handleDelete('${id}', 'goal')" style="position: absolute; top: 10px; right: 10px; color: #e74a3b; background: none; border: none; cursor: pointer;">✕</button>
                <strong>${title}</strong><br>
                <small>${current} / ${target} MAD</small>
                <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 5px; margin: 10px 0; overflow: hidden;">
                    <div style="background: #1cc88a; width: ${progress}%; height: 100%;"></div>
                </div>
                <span style="font-size: 11px; color: #1cc88a;">${progress.toFixed(0)}% atteint</span>
            </div>`;
    }).join("");
}

// --- SUPPRESSION GÉNÉRALE ---
window.handleDelete = async function(id, type) {
    if (!id || id === 'undefined') return alert("Erreur : ID invalide.");
    if (!confirm("Voulez-vous vraiment supprimer cet élément ?")) return;

    try {
        if (type === 'goal') await store.deleteGoal(id);
        else if (type === 'budget') await store.deleteBudget(id);
        else await store.deleteTransaction(id);
        await init();
    } catch (err) {
        alert("Erreur lors de la suppression.");
    }
};

// --- AUTRES FONCTIONS (Dashboard, Transactions, etc.) ---
function updateDashboard() {
    const tx = store.transactions || [];
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const total = income - expense;

    const kpiTotal = document.getElementById("kpiTotal");
    if(kpiTotal) kpiTotal.innerText = `${total} MAD`;
    
    updateChart(income, expense);
}

function updateChart(income, expense) {
    const ctx = document.getElementById('flowChart');
    if (!ctx) return;
    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Revenus', 'Dépenses'],
            datasets: [{ data: [income, expense], backgroundColor: ['#1cc88a', '#e74a3b'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '80%', plugins: { legend: { display: false } } }
    });
}

function renderTransactions() {
    const listEl = document.getElementById("txList") || document.getElementById("txLive");
    if (!listEl) return;
    listEl.innerHTML = (store.transactions || []).map(t => `
        <div style="display:flex; justify-content:space-between; padding: 10px; border-bottom: 1px solid #ffffff11;">
            <span>${t.text}</span>
            <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">${t.amount} MAD</b>
        </div>`).join("");
}

window.handleReset = async function() {
    if (!confirm("⚠️ Tout réinitialiser ?")) return;
    try {
        await store.resetAllData();
        await init();
    } catch (err) { alert("Erreur reset"); }
};

window.handleSaveGoal = async function() {
    const title = document.getElementById('goalName')?.value;
    const target = document.getElementById('goalTarget')?.value;
    const current = document.getElementById('goalSaved')?.value || 0;
    if (!title || !target) return alert("Champs requis");
    await store.saveGoal({ title, target: Number(target), current: Number(current) });
    await init();
};

document.addEventListener("DOMContentLoaded", init);