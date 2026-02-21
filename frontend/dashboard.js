import { store } from "./store.js";

function initDashboard() {
    const tx = store.transactions;
    const budgets = store.budgets;

    // 1. CALCULS DES TOTAUX
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

    // 2. GRAPHIQUE FLUX (Barres)
    const flowCtx = document.getElementById("flowChart");
    if (flowCtx) {
        // On détruit l'instance existante si nécessaire pour éviter les bugs au survol
        const existingChart = Chart.getChart(flowCtx);
        if (existingChart) existingChart.destroy();

        new Chart(flowCtx, {
            type: "bar",
            data: {
                labels: ["Revenus", "Dépenses"],
                datasets: [{ 
                    data: [income, expense], 
                    backgroundColor: ["#1cc88a", "#e74a3b"],
                    borderRadius: 5
                }]
            },
            options: { 
                responsive: true,
                plugins: { legend: { display: false } } 
            }
        });
    }

    // 3. GRAPHIQUE CATÉGORIES (Doughnut)
    const catCtx = document.getElementById("categoryChart");
    if (catCtx) {
        const cats = {};
        tx.filter(t => t.type === "expense").forEach(t => {
            cats[t.category] = (cats[t.category] || 0) + Number(t.amount);
        });

        const existingChart = Chart.getChart(catCtx);
        if (existingChart) existingChart.destroy();

        if (Object.keys(cats).length > 0) {
            new Chart(catCtx, {
                type: "doughnut",
                data: {
                    labels: Object.keys(cats),
                    datasets: [{ 
                        data: Object.values(cats), 
                        backgroundColor: ["#4e73df", "#1cc88a", "#36b9cc", "#f6c23e", "#e74a3b"] 
                    }]
                },
                options: { responsive: true }
            });
        }
    }

    // 4. LOGIQUE DES ALERTES (Dépassement de budget)
    const alertsEl = document.getElementById("alerts");
    if (alertsEl) {
        const activeAlerts = [];
        Object.entries(budgets).forEach(([cat, limit]) => {
            const spent = tx.filter(t => t.category === cat && t.type === "expense")
                           .reduce((s, t) => s + Number(t.amount), 0);
            if (spent > limit) {
                activeAlerts.push(`<div style="color:#e74a3b; margin-bottom:5px;">⚠️ Budget <strong>${cat}</strong> dépassé !</div>`);
            }
        });
        alertsEl.innerHTML = activeAlerts.length > 0 ? activeAlerts.join("") : "✅ Tous les budgets sont respectés.";
    }

    // 5. PRÉVISION FIN DE MOIS
    const forecastEl = document.getElementById("forecast");
    if (forecastEl) {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const currentDay = now.getDate();
        
        if (expense > 0) {
            const dailyAverage = expense / currentDay;
            const estimatedTotal = Math.round(dailyAverage * daysInMonth);
            forecastEl.innerHTML = `Basé sur vos dépenses actuelles, vous finirez à environ <strong>${estimatedTotal.toLocaleString()} MAD</strong>.`;
        } else {
            forecastEl.innerText = "Pas assez de données de dépenses pour estimer.";
        }
    }

    // 6. SCORE ET TIMELINE
    const scoreEl = document.getElementById("financeScore");
    if (scoreEl) {
        let score = 100;
        if (expense > income) score -= 40;
        if (Object.keys(budgets).length === 0) score -= 10;
        if (expense > (income * 0.8)) score -= 20; // Alerte si on dépense + de 80% des revenus
        scoreEl.innerText = Math.max(0, score) + "/100";
    }

    const timeline = document.getElementById("timeline");
    if (timeline) {
        timeline.innerHTML = tx.length > 0 
            ? tx.slice(-5).reverse().map(t => `
                <div class="row" style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #333;">
                    <span>${t.title}</span> 
                    <strong style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">${t.amount.toLocaleString()} MAD</strong>
                </div>`).join("")
            : "Aucune activité récente.";
    }
}

// On écoute l'événement DOMContentLoaded pour lancer le dashboard
document.addEventListener("DOMContentLoaded", initDashboard);