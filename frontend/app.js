import { store } from "./store.js";

// --- INITIALISATION DU DASHBOARD ---
async function initDashboard() {
    try {
        // 1. Chargement des données depuis le store
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets()
        ]);

        const tx = store.transactions || [];
        const budgets = store.budgets || [];

        // 2. Calculs des KPI
        const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
        const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
        const balance = income - expense;

        // Mise à jour des éléments HTML (IDs de dashboard.html)
        const updateText = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.innerText = val;
        };

        updateText("kpiTotal", `${balance.toLocaleString()} MAD`);
        updateText("kpiIncome", income.toLocaleString());
        updateText("kpiExpense", expense.toLocaleString());

        // 3. Calcul du Score Santé (Correction du --/100)
        const scoreEl = document.getElementById("financeScore");
        if (scoreEl) {
            const score = income > 0 ? Math.max(0, Math.min(100, Math.round((balance / income) * 100))) : 0;
            scoreEl.innerText = `${score}/100`;
            scoreEl.style.color = score > 70 ? "#1cc88a" : score > 40 ? "#f6c23e" : "#e74a3b";
        }

        // 4. Graphique Flux Financier
        renderFlowChart(income, expense);

        // 5. Liste des Dernières Activités
        renderRecentActivities(tx);

    } catch (err) {
        console.error("Erreur d'initialisation du dashboard:", err);
    }
}

// --- RENDU DU GRAPHIQUE (FLOW) ---
function renderFlowChart(income, expense) {
    const ctx = document.getElementById("flowChart");
    if (!ctx) return;

    const existingChart = Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Revenus', 'Dépenses'],
            datasets: [{
                data: [income, expense],
                backgroundColor: ['#1cc88a', '#e74a3b'],
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// --- RENDU DES DERNIÈRES ACTIVITÉS ---
function renderRecentActivities(tx) {
    const listEl = document.getElementById("txLive");
    if (!listEl) return;

    // On prend les 5 dernières transactions (les plus récentes en premier)
    const recent = tx.slice().reverse().slice(0, 5);

    if (recent.length === 0) {
        listEl.innerHTML = '<p style="opacity:0.5; padding:10px;">Aucune activité récente.</p>';
        return;
    }

    listEl.innerHTML = recent.map(t => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:1px solid rgba(255,255,255,0.05);">
            <div>
                <div style="font-weight:500;">${t.text || 'Sans titre'}</div>
                <small style="opacity:0.5;">${t.category || 'Général'}</small>
            </div>
            <b style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">
                ${t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toLocaleString()} MAD
            </b>
        </div>
    `).join("");
}

// Lancement automatique au chargement de la page
document.addEventListener("DOMContentLoaded", initDashboard);