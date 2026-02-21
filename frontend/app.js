import { store } from "./store.js";

/* ==========================================
   1. ATTACHEMENT DES FONCTIONS AU WINDOW
   Nécessaire pour que les onclick="" du HTML fonctionnent avec type="module"
========================================== */

window.addTransaction = (t) => {
    if (!t.title || !t.amount) return alert("Veuillez remplir le titre et le montant.");
    
    store.transactions.push({
        ...t,
        amount: Number(t.amount),
        date: new Date().toISOString(),
        id: Date.now()
    });
    
    store.save();
    clearInputs(["title", "amount", "category"]);
    render();
};

window.setBudget = (cat, val) => {
    if (!cat || !val) return alert("Remplissez tous les champs.");
    store.budgets[cat] = Number(val);
    store.save();
    clearInputs(["cat", "val"]);
    render();
};

window.addGoal = (g) => {
    if (!g.name || !g.target) return alert("Remplissez tous les champs.");
    store.goals.push({
        ...g,
        target: Number(g.target),
        saved: Number(g.saved || 0)
    });
    store.save();
    clearInputs(["name", "target"]);
    render();
};

window.deleteTransaction = (i) => {
    if(confirm("Supprimer cette transaction ?")) {
        store.transactions.splice(i, 1);
        store.save();
        render();
    }
};

// Fonction utilitaire pour vider les champs après ajout
function clearInputs(ids) {
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
}

/* ==========================================
   2. CALCULS ET LOGIQUE MÉTIER
========================================== */

function calculateTotals() {
    let income = 0, expense = 0;
    store.transactions.forEach(t => {
        const val = Number(t.amount) || 0;
        t.type === "income" ? income += val : expense += val;
    });
    return { income, expense, total: income - expense };
}

/* ==========================================
   3. MOTEUR DE RENDU UI
========================================== */

window.render = () => {
    const stats = calculateTotals();

    // Mise à jour des compteurs KPI (Dashboard)
    const update = (id, val, isCurrency = false) => {
        const el = document.getElementById(id);
        if (el) el.innerText = val.toLocaleString() + (isCurrency ? " MAD" : "");
    };

    update("kpiTotal", stats.total, true);
    update("kpiIncome", stats.income);
    update("kpiExpense", stats.expense);

    // Rendu des différentes sections
    renderTransactionsList();
    renderBudgetsUI();
    renderGoalsUI();
};

function renderTransactionsList() {
    // On cible soit txList (page dédiée) soit txLive (dashboard)
    const el = document.getElementById("txList") || document.getElementById("txLive");
    if (!el) return;
    
    if (store.transactions.length === 0) {
        el.innerHTML = `<p style="opacity:0.5; padding:15px;">Aucune donnée disponible.</p>`;
        return;
    }

    el.innerHTML = store.transactions.map((t, i) => `
        <div class="card transaction-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div>
                <strong>${t.title}</strong> 
                <br><small style="opacity:0.7">${t.category || 'Général'}</small>
            </div>
            <div style="text-align: right; display:flex; align-items:center; gap:15px;">
                <span style="font-weight:bold; color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                    ${t.type === 'income' ? '+' : '-'}${Number(t.amount).toLocaleString()} MAD
                </span>
                <button onclick="deleteTransaction(${i})" style="background:none; border:none; color:#ff4d4d; cursor:pointer; font-size:1.1rem;">✕</button>
            </div>
        </div>
    `).reverse().join("");
}

function renderBudgetsUI() {
    const el = document.getElementById("budgetList") || document.getElementById("budgetStatus");
    if (!el) return;

    const entries = Object.entries(store.budgets);
    if (entries.length === 0) {
        el.innerHTML = `<p style="opacity:0.5;">Aucun budget configuré.</p>`;
        return;
    }

    el.innerHTML = entries.map(([cat, limit]) => {
        const spent = store.transactions
            .filter(t => t.category === cat && t.type === "expense")
            .reduce((s, t) => s + Number(t.amount), 0);
        const p = Math.min(100, (spent / limit) * 100);
        
        return `
            <div class="card" style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong>${cat}</strong>
                    <span>${spent.toLocaleString()} / ${limit.toLocaleString()} MAD</span>
                </div>
                <div style="background:#333; height:8px; border-radius:4px; overflow:hidden;">
                    <div style="width:${p}%; background:${p >= 100 ? '#e74a3b' : '#1cc88a'}; height:100%; transition:0.3s;"></div>
                </div>
            </div>`;
    }).join("");
}

function renderGoalsUI() {
    const el = document.getElementById("goalList") || document.getElementById("goalStatus");
    if (!el) return;

    if (store.goals.length === 0) {
        el.innerHTML = `<p style="opacity:0.5;">Aucun objectif ajouté.</p>`;
        return;
    }

    el.innerHTML = store.goals.map(g => {
        const p = Math.min(100, (Number(g.saved) / Number(g.target)) * 100);
        return `
            <div class="card" style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                    <strong>${g.name}</strong>
                    <span>${Number(g.saved).toLocaleString()} / ${Number(g.target).toLocaleString()} MAD</span>
                </div>
                <div style="background:#333; height:8px; border-radius:4px; overflow:hidden;">
                    <div style="width:${p}%; background:#4e73df; height:100%; transition:0.3s;"></div>
                </div>
            </div>`;
    }).join("");
}

/* ==========================================
   4. SYSTÈME DE FILTRE ET RECHERCHE
========================================== */

const searchInput = document.getElementById("search");
const filterSelect = document.getElementById("filterType");

if (searchInput || filterSelect) {
    const runFilter = () => {
        const term = searchInput?.value.toLowerCase() || "";
        const type = filterSelect?.value || "all";

        const filtered = store.transactions.filter(t => {
            const matchesSearch = t.title.toLowerCase().includes(term) || t.category.toLowerCase().includes(term);
            const matchesType = type === "all" || t.type === type;
            return matchesSearch && matchesType;
        });

        // Mise à jour simplifiée de la liste pour les filtres
        const el = document.getElementById("txLive") || document.getElementById("txList");
        if (el) {
            el.innerHTML = filtered.map(t => `
                <div class="row" style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #333;">
                    <span>${t.title}</span>
                    <strong style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">${t.amount} MAD</strong>
                </div>
            `).reverse().join("");
        }
    };

    searchInput?.addEventListener("input", runFilter);
    filterSelect?.addEventListener("change", runFilter);
}

// Initialisation au chargement
document.addEventListener("DOMContentLoaded", render);