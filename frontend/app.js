import { store } from "./store.js";

// --- SUPPRESSION (AVEC NETTOYAGE D'AFFICHAGE) ---
window.handleDelete = async function(id, type) {
    if (!id || id === 'undefined') return alert("ID invalide.");
    if (!confirm(`Voulez-vous vraiment supprimer cet élément ?`)) return;

    try {
        if (type === 'goal') {
            await store.deleteGoal(id);
        } else {
            await store.deleteTransaction(id);
        }
        // Force le rechargement complet pour nettoyer l'écran
        await init(); 
    } catch (err) {
        console.error("Erreur suppression:", err);
    }
};

window.deleteTx = (id) => window.handleDelete(id, 'transaction');
window.deleteGoal = (id) => window.handleDelete(id, 'goal');

// --- AJOUT OBJECTIF (Correction des clés de données) ---
window.handleSaveGoal = async function() {
    const titleEl = document.getElementById('goalName');
    const targetEl = document.getElementById('goalTarget');
    const currentEl = document.getElementById('goalSaved');

    if (!titleEl?.value || !targetEl?.value) return alert("Nom et cible requis.");

    try {
        // IMPORTANT : Utiliser les mêmes noms que dans le rendu (init)
        await store.saveGoal({
            title: titleEl.value, // Utilise 'title'
            target: Number(targetEl.value), // Utilise 'target'
            current: Number(currentEl.value) || 0 // Utilise 'current'
        });
        
        titleEl.value = ""; targetEl.value = ""; currentEl.value = "";
        await init(); // Réaffiche tout immédiatement
    } catch (err) { console.error(err); }
};

// --- INITIALISATION (Rendu 100% correct) ---
async function init() {
    try {
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets(),
            store.fetchGoals()
        ]);

        const tx = store.transactions || [];
        const goals = store.goals || [];

        // Rendu des Objectifs
        const goalListEl = document.getElementById("goalList");
        if (goalListEl) {
            goalListEl.innerHTML = goals.map(g => {
                const id = g._id || g.id;
                // Correction : On utilise prioritairement 'title', 'target' et 'current'
                const title = g.title || g.name || "Objectif";
                const target = Number(g.target) || 0;
                const current = Number(g.current) || Number(g.saved) || 0;
                const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;

                return `
                    <div class="card" style="margin-bottom:15px; position: relative;">
                        <button onclick="window.deleteGoal('${id}')" style="position: absolute; top: 10px; right: 10px; background: #ff4d4d22; border: none; color: #ff4d4d; cursor: pointer; border-radius: 5px; padding: 2px 8px;">✕</button>
                        <div style="margin-bottom:10px;">
                            <strong style="font-size: 1.1em;">${title}</strong><br>
                            <span style="opacity: 0.8;">${current.toLocaleString()} / ${target.toLocaleString()} MAD</span>
                        </div>
                        <div style="background:rgba(255,255,255,0.1); height:12px; border-radius:10px; overflow:hidden;">
                            <div style="background:#1cc88a; width:${progress}%; height:100%; transition: width 0.5s;"></div>
                        </div>
                        <p style="font-size:12px; margin-top:5px; color:#1cc88a; font-weight: bold;">${progress.toFixed(0)}% atteint</p>
                    </div>`;
            }).join("");
        }
        
        // (Le reste de votre code init pour transactions et KPI ici...)
        
    } catch (err) { console.error("Erreur init:", err); }
}

document.addEventListener("DOMContentLoaded", init);