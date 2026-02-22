import { store } from "./store.js";

async function initDashboard() {
    try {
        // 0. CHARGEMENT PARALLÈLE DES DONNÉES
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets()
        ]);

        const tx = store.transactions || [];
        const budgets = store.budgets || [];

        // 1. CALCULS DES TOTAUX (KPI)
        const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
        const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
        const balance = income - expense;

        const updateKPI = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        updateKPI("kpiTotal", `${balance.toLocaleString()} MAD`);
        updateKPI("kpiIncome", income.toLocaleString());
        updateKPI("kpiExpense", expense.toLocaleString());

        // 2. RENDU DES GRAPHIQUES (Chart.js)
        renderFlowChart(income, expense);
        renderCategoryChart(tx);

        // 3. ALERTES DE BUDGET
        const alertsEl = document.getElementById("alerts");
        if (alertsEl) {
            const activeAlerts = budgets.filter(b => {
                const spent = tx.filter(t => t.category === b.category && t.type === "expense")
                               .reduce((s, t) => s + Number(t.amount), 0);
                return spent > b.limit;
            }).map(b => `<div style="color: #e74a3b; margin-bottom: 5px;">⚠️ Budget <strong>${b.category}</strong> dépassé !</div>`);
            
            alertsEl.innerHTML = activeAlerts.length > 0 ? activeAlerts.join("") : "✅ Budgets respectés.";
        }

        // 4. LISTE DES TRANSACTIONS RÉCENTES
        const listEl = document.getElementById("txLive");
        if (listEl) {
            // Affichage des 5 dernières transactions (les plus récentes en haut)
            listEl.innerHTML = tx.length === 0 ? '<p style="opacity:0.5;">Aucune activité.</p>' :
                tx.slice().reverse().slice(0, 5).map(t => `
                    <div style="display:flex; justify-content:space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                        <span>${t.text || 'Sans titre'}</span>
                        <span style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                            ${t.type === 'income' ? '+' : '-'}${Math.abs(t.amount)} MAD
                        </span>
                    </div>
                `).join("");
        }

    } catch (err) {
        console.error("Erreur Dashboard:", err);
    }
}

// --- FONCTIONS HELPER POUR LE RENDU ---

function renderFlowChart(income, expense) {
    const ctx = document.getElementById("flowChart");
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Revenus", "Dépenses"],
            datasets: [{ 
                data: [income, expense], 
                backgroundColor: ["#1cc88a", "#e74a3b"],
                borderRadius: 8
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function renderCategoryChart(tx) {
    const ctx = document.getElementById("categoryChart");
    if (!ctx) return;
    
    const cats = {};
    tx.filter(t => t.type === "expense").forEach(t => {
        const name = t.category || "Autre";
        cats[name] = (cats[name] || 0) + Number(t.amount);
    });

    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    if (Object.keys(cats).length > 0) {
        new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: Object.keys(cats),
                datasets: [{ 
                    data: Object.values(cats), 
                    backgroundColor: ["#3b82f6", "#1cc88a", "#f6c23e", "#e74a3b", "#8b5cf6"],
                    borderWidth: 0 
                }]
            },
            options: { responsive: true, maintainAspectRatio: false, cutout: '70%' }
        });
    }
}

document.addEventListener("DOMContentLoaded", initDashboard);