import { store } from "./store.js";

async function init() {
    try {
        await Promise.all([store.fetchTransactions(), store.fetchGoals()]);
        renderGoals();
    } catch (err) { console.error("Erreur init:", err); }
}

function renderGoals() {
    const listEl = document.getElementById("goalList");
    if (!listEl) return;

    // On nettoie les cartes "Objectif" vides en utilisant des valeurs par défaut intelligentes
    listEl.innerHTML = (store.goals || []).map(g => {
        const id = g._id || g.id;
        const title = g.title || "Mon Objectif";
        const target = Number(g.target) || 0;
        const current = Number(g.current) || 0;
        const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

        return `
            <div class="card" style="position: relative; margin-bottom: 15px;">
                <button onclick="handleDelete('${id}')" 
                        style="position: absolute; top: 10px; right: 10px; color: #ff4d4d; background: none; border: none; cursor: pointer; font-size: 18px;">
                    ✕
                </button>
                <div style="margin-bottom: 10px;">
                    <strong>${title}</strong><br>
                    <small>${current} / ${target} MAD</small>
                </div>
                <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 5px; overflow: hidden;">
                    <div style="background: #1cc88a; width: ${progress}%; height: 100%;"></div>
                </div>
                <p style="font-size: 11px; margin-top: 5px; color: #1cc88a;">${progress.toFixed(0)}% atteint</p>
            </div>`;
    }).join("");
}

// --- LES FONCTIONS WINDOW (Pour tes boutons HTML) ---

window.handleSaveGoal = async function() {
    const title = document.getElementById('goalName').value;
    const target = document.getElementById('goalTarget').value;
    const current = document.getElementById('goalSaved').value || 0;

    if (!title || !target) return alert("Veuillez remplir le nom et le montant cible.");

    await store.saveGoal({ title, target: Number(target), current: Number(current) });
    // On vide les champs après l'ajout
    document.getElementById('goalName').value = "";
    document.getElementById('goalTarget').value = "";
    document.getElementById('goalSaved').value = "";
    await init();
};

window.handleDelete = async function(id) {
    if (!id || id === 'undefined') return alert("Impossible de supprimer : ID invalide.");
    if (!confirm("Voulez-vous vraiment supprimer cet élément ?")) return;

    try {
        await store.deleteGoal(id);
        await init(); // Recharge l'affichage immédiatement
    } catch (err) {
        alert("Erreur lors de la suppression. Vérifiez votre API.");
    }
};

window.handleReset = async function() {
    if (!confirm("⚠️ ATTENTION : Cela va effacer TOUT votre historique. Continuer ?")) return;
    try {
        await store.resetAllData();
        await init();
        alert("Historique réinitialisé !");
    } catch (err) { alert("Erreur lors de la réinitialisation."); }
};

document.addEventListener("DOMContentLoaded", init);