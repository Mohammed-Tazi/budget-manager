import { store } from "./store.js";

// --- INITIALISATION ---
async function init() {
    try {
        await Promise.all([
            store.fetchTransactions(),
            store.fetchGoals()
        ]);
        renderGoals();
    } catch (err) { console.error(err); }
}

// --- AFFICHAGE DES OBJECTIFS (Correction titre et ID) ---
function renderGoals() {
    const listEl = document.getElementById("goalList");
    if (!listEl) return;

    listEl.innerHTML = (store.goals || []).map(g => {
        const id = g._id || g.id;
        // Correction : Utilise 'title' pour éviter d'afficher "Objectif" par défaut
        const displayTitle = g.title || g.name || "Sans titre";
        const target = Number(g.target) || 0;
        const current = Number(g.current) || 0;
        const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

        return `
            <div class="card" style="position: relative; margin-bottom: 15px; padding: 20px;">
                <button onclick="handleDelete('${id}', 'goal')" 
                        style="position: absolute; top: 15px; right: 15px; color: #e74a3b; background: none; border: none; cursor: pointer; font-size: 20px;">
                    ✕
                </button>
                <div style="margin-bottom: 10px;">
                    <strong style="font-size: 1.1em; color: white;">${displayTitle}</strong><br>
                    <small style="opacity: 0.7;">${current} / ${target} MAD</small>
                </div>
                <div style="background: rgba(255,255,255,0.1); height: 10px; border-radius: 5px; overflow: hidden;">
                    <div style="background: #1cc88a; width: ${progress}%; height: 100%;"></div>
                </div>
                <p style="font-size: 12px; margin-top: 8px; color: #1cc88a;">${progress.toFixed(0)}% atteint</p>
            </div>`;
    }).join("");
}

// --- ACTIONS ---
window.handleSaveGoal = async function() {
    const title = document.getElementById('goalName').value;
    const target = document.getElementById('goalTarget').value;
    const saved = document.getElementById('goalSaved').value || 0;

    if (!title || !target) return alert("Remplissez les champs !");

    await store.saveGoal({
        title: title, // On enregistre bien sous 'title'
        target: Number(target),
        current: Number(saved)
    });

    document.getElementById('goalName').value = "";
    document.getElementById('goalTarget').value = "";
    document.getElementById('goalSaved').value = "";
    await init(); // Recharge et affiche le vrai nom
};

window.handleDelete = async function(id, type) {
    if (!id || id === 'undefined') return alert("Erreur d'ID");
    if (!confirm("Supprimer cet élément ?")) return;

    try {
        if (type === 'goal') await store.deleteGoal(id);
        else await store.deleteTransaction(id);
        await init();
    } catch (err) { alert("Erreur lors de la suppression"); }
};

window.handleReset = async function() {
    if (!confirm("⚠️ Tout supprimer l'historique ?")) return;
    await store.resetAllData();
    await init();
};

document.addEventListener("DOMContentLoaded", init);