import { store } from "./store.js";

async function init() {
    try {
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets(),
            store.fetchGoals()
        ]);
        renderBudgets();
        renderGoals();
        updateDashboard();
    } catch (err) { console.error(err); }
}

// --- RENDU BUDGETS (Correction image_2ee83e) ---
function renderBudgets() {
    const listEl = document.getElementById("budgetList");
    if (!listEl) return;
    listEl.innerHTML = (store.budgets || []).map(b => {
        const id = b._id || b.id;
        return `
            <div class="card" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 15px;">
                <div>
                    <strong style="color: white; text-transform: capitalize;">${b.category}</strong><br>
                    <small style="opacity: 0.7;">Limite : ${b.limit} MAD</small>
                </div>
                <button onclick="handleDelete('${id}', 'budget')" style="color: #e74a3b; background: none; border: none; cursor: pointer; font-size: 1.5rem;">✕</button>
            </div>`;
    }).join("");
}

// --- RENDU GOALS (Correction image_215fbc) ---
function renderGoals() {
    const listEl = document.getElementById("goalList");
    if (!listEl) return;
    listEl.innerHTML = (store.goals || []).map(g => {
        const id = g._id || g.id;
        const title = g.title || "Objectif sans nom";
        const progress = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
        return `
            <div class="card" style="position: relative; margin-bottom: 15px; padding: 20px;">
                <button onclick="handleDelete('${id}', 'goal')" style="position: absolute; top: 10px; right: 10px; color: #e74a3b; background: none; border: none; cursor: pointer; font-size: 1.2rem;">✕</button>
                <strong style="color: white;">${title}</strong><br>
                <small>${g.current || 0} / ${g.target} MAD</small>
                <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 5px; margin: 10px 0; overflow: hidden;">
                    <div style="background: #1cc88a; width: ${progress}%; height: 100%;"></div>
                </div>
            </div>`;
    }).join("");
}

// --- ACTIONS ---
window.handleSaveBudget = async function() {
    const cat = document.getElementById('cat')?.value;
    const val = document.getElementById('val')?.value;
    if (!cat || !val) return alert("Remplissez les champs !");
    await store.saveBudget({ category: cat, limit: Number(val) });
    document.getElementById('cat').value = ""; document.getElementById('val').value = "";
    await init();
};

window.handleDelete = async function(id, type) {
    if (!id || id === 'undefined') return alert("ID Invalide");
    if (!confirm("Voulez-vous vraiment supprimer cet élément ?")) return;
    try {
        if (type === 'budget') await store.deleteBudget(id);
        else if (type === 'goal') await store.deleteGoal(id);
        await init();
    } catch (err) { alert("Erreur lors de la suppression"); }
};

window.handleReset = async function() {
    if (!confirm("⚠️ Tout supprimer ?")) return;
    try {
        await store.resetAllData();
        await init();
    } catch (err) { alert("Erreur reset"); }
};

function updateDashboard() { /* Ta logique existante pour le graphique */ }
document.addEventListener("DOMContentLoaded", init);