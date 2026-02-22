import { store } from "./store.js";

// --- INITIALISATION ---
async function init() {
    try {
        // Chargement des données
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets()
        ]);

        const tx = store.transactions || [];
        
        // Détection automatique de la page
        const isDashboard = document.getElementById('kpiTotal');
        const isTransactionPage = document.getElementById('txList');

        if (isDashboard) {
            renderDashboard(tx);
        }

        if (isTransactionPage) {
            renderTransactionPage(tx);
        }

    } catch (err) {
        console.error("Erreur lors du chargement :", err);
        const listEl = document.getElementById("txList");
        if (listEl) listEl.innerHTML = "<p style='color:red;'>Erreur de connexion au serveur.</p>";
    }
}

// --- RENDU PAGE TRANSACTIONS ---
function renderTransactionPage(tx) {
    const listEl = document.getElementById("txList");
    if (!listEl) return;

    if (tx.length === 0) {
        listEl.innerHTML = "<p style='padding:20px; opacity:0.5;'>Aucune transaction enregistrée.</p>";
        return;
    }

    // Affichage de l'historique (plus récent en haut)
    listEl.innerHTML = tx.slice().reverse().map(t => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom: 1px solid rgba(255,255,255,0.05);">
            <div>
                <strong style="font-size: 1.1em;">${t.text || 'Sans titre'}</strong><br>
                <small style="opacity:0.6;">${t.category || 'Général'}</small>
            </div>
            <div style="display:flex; align-items:center; gap:25px;">
                <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}; font-size: 1.1em;">
                    ${t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toLocaleString()} MAD
                </b>
                <button onclick="window.handleDelete('${t._id || t.id}')" 
                        style="background:none; border:none; color:#e74a3b; cursor:pointer; font-size:1.2em; padding:5px;">✕</button>
            </div>
        </div>
    `).join("");
}

// --- RENDU DASHBOARD ---
function renderDashboard(tx) {
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const balance = income - expense;

    const update = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
    
    update("kpiTotal", `${balance.toLocaleString()} MAD`);
    update("kpiIncome", `${income.toLocaleString()} MAD`);
    update("kpiExpense", `${expense.toLocaleString()} MAD`);

    // Score Santé
    const scoreEl = document.getElementById("financeScore");
    if (scoreEl) {
        const score = income > 0 ? Math.max(0, Math.min(100, Math.round((balance / income) * 100))) : 0;
        scoreEl.innerText = `${score}/100`;
    }
}

// --- ACTIONS GLOBALES (Attachées à Window) ---

// Fonction liée au bouton "Ajouter" de votre HTML
window.handleAdd = async function() {
    const textEl = document.getElementById('text');
    const amountEl = document.getElementById('amount');
    const categoryEl = document.getElementById('category');
    const typeEl = document.getElementById('type');

    // Validation
    if (!textEl.value || !amountEl.value) {
        return alert("Veuillez saisir au moins un libellé et un montant.");
    }

    const data = {
        text: textEl.value,
        amount: Number(amountEl.value),
        category: categoryEl.value || "Général",
        type: typeEl.value
    };

    try {
        await store.saveTransaction(data);
        // Reset des champs
        textEl.value = "";
        amountEl.value = "";
        categoryEl.value = "";
        // Rafraîchissement
        await init(); 
    } catch (err) {
        alert("Erreur lors de l'enregistrement.");
    }
};

window.handleDelete = async function(id) {
    if (!confirm("Voulez-vous supprimer cette transaction ?")) return;
    try {
        await store.deleteTransaction(id);
        await init();
    } catch (err) {
        alert("Erreur lors de la suppression.");
    }
};

// Lancement au chargement
document.addEventListener("DOMContentLoaded", init);