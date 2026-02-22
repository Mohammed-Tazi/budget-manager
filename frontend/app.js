import { store } from "./store.js";

// Attacher les fonctions au window pour le HTML
window.addTransaction = async (tx) => {
    await store.saveTransaction(tx);
    location.reload();
};

window.addGoal = async (goal) => {
    await store.saveGoal(goal);
    location.reload();
};

window.deleteTx = async (id) => {
    if(confirm("Supprimer ?")) {
        await store.deleteTransaction(id);
        location.reload();
    }
};

async function init() {
    const path = window.location.pathname;

    // Charger les transactions partout
    await store.fetchTransactions();

    // Rendu spécifique selon la page
    if (path.includes("transactions.html")) {
        renderTransactions();
    } else if (path.includes("goals.html")) {
        await store.fetchGoals();
        renderGoals();
    } else {
        renderLiveFeed(); // Pour le Dashboard
    }
}

function renderTransactions() {
    const el = document.getElementById("txList");
    if (!el) return;
    el.innerHTML = store.transactions.map(t => `
        <div class="card" style="display:flex; justify-content:space-between; margin-bottom:10px;">
            <span>${t.text} (${t.category})</span>
            <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">${t.amount} MAD 
               <span onclick="deleteTx('${t._id}')" style="cursor:pointer; margin-left:10px;">🗑️</span>
            </b>
        </div>
    `).join("");
}

function renderGoals() {
    const el = document.getElementById("goalList");
    if (!el) return;
    el.innerHTML = store.goals.map(g => {
        const percent = Math.min(Math.round((g.saved / g.target) * 100), 100);
        return `
            <div class="card">
                <h4>${g.name}</h4>
                <p>${g.saved} / ${g.target} MAD (${percent}%)</p>
                <div style="background:#444; height:10px; border-radius:5px;">
                    <div style="background:#6366f1; width:${percent}%; height:100%; border-radius:5px;"></div>
                </div>
            </div>
        `;
    }).join("");
}

function renderLiveFeed() {
    const el = document.getElementById("txLive");
    if (el) {
        el.innerHTML = store.transactions.slice(0, 5).map(t => `
            <div style="padding:10px; border-bottom:1px solid #333;">${t.text} : ${t.amount} MAD</div>
        `).join("");
    }
}

document.addEventListener("DOMContentLoaded", init);