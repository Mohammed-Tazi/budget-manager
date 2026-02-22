import { store } from "./store.js";

async function initDashboard() {
    try {
        // 0. CHARGEMENT DES DONNÉES DEPUIS LE SERVEUR
        await Promise.all([
            store.fetchTransactions(),
            store.fetchBudgets()
        ]);

        const tx = store.transactions || [];
        const budgets = store.budgets || [];

        // 1. CALCULS DES TOTAUX
        const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
        const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

        // Mise à jour des KPI textuels
        document.getElementById("kpiTotal").innerText = (income - expense).toLocaleString() + " MAD";
        document.getElementById("kpiIncome").innerText = income.toLocaleString();
        document.getElementById("kpiExpense").innerText = expense.toLocaleString();

        // 2. GRAPHIQUE FLUX (Barres)
        const flowCtx = document.getElementById("flowChart");
        if (flowCtx) {
            const existing = Chart.getChart(flowCtx);
            if (existing) existing.destroy();

            new Chart(flowCtx, {
                type: "bar",
                data: {
                    labels: ["Revenus", "Dépenses"],
                    datasets: [{ 
                        data: [income, expense], 
                        backgroundColor: ["#1cc88a", "#e74a3b"],
                        borderRadius: 8
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } } }
                }
            });
        }

        // 3. GRAPHIQUE CATÉGORIES
        const catCtx = document.getElementById("categoryChart");
        if (catCtx) {
            const cats = {};
            tx.filter(t => t.type === "expense").forEach(t => {
                const name = t.category || "Autre";
                cats[name] = (cats[name] || 0) + Number(t.amount);
            });

            const existing = Chart.getChart(catCtx);
            if (existing) existing.destroy();

            if (Object.keys(cats).length > 0) {
                new Chart(catCtx, {
                    type: "doughnut",
                    data: {
                        labels: Object.keys(cats),
                        datasets: [{ 
                            data: Object.values(cats), 
                            backgroundColor: ["#3b82f6", "#1cc88a", "#f6c23e", "#e74a3b", "#8b5cf6"],
                            borderWidth: 0
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
        }

        // 4. LOGIQUE DES ALERTES
        const alertsEl = document.getElementById("alerts");
        if (alertsEl) {
            const activeAlerts = budgets.filter(b => {
                const spent = tx.filter(t => t.category === b.category && t.type === "expense")
                               .reduce((s, t) => s + Number(t.amount), 0);
                return spent > b.limit;
            }).map(b => `<div style="color: #e74a3b; margin-bottom: 5px;">⚠️ Budget <strong>${b.category}</strong> dépassé !</div>`);
            
            alertsEl.innerHTML = activeAlerts.length > 0 ? activeAlerts.join("") : "✅ Tous les budgets sont respectés.";
        }

        // 5. IA : PRÉVISION FIN DE MOIS
        const forecastEl = document.getElementById("forecast");
        if (forecastEl) {
            const now = new Date();
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const currentDay = now.getDate();
            
            if (expense > 0) {
                const estimatedTotal = Math.round((expense / currentDay) * daysInMonth);
                forecastEl.innerHTML = `${estimatedTotal.toLocaleString()} MAD`;
            } else {
                forecastEl.innerHTML = "--- MAD";
            }
        }

        // 6. LISTE DES TRANSACTIONS EN DIRECT
        const listEl = document.getElementById("txLive");
        if (listEl) {
            listEl.innerHTML = tx.slice(0, 5).map(t => `
                <div style="display:flex; justify-content:space-between; padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <span>${t.text || 'Sans titre'}</span>
                    <span style="color:${t.type === 'income' ? '#1cc88a' : '#e74a3b'}">${t.amount} MAD</span>
                </div>
            `).join("");
        }

    } catch (err) {
        console.error("Erreur Dashboard:", err);
    }
}

document.addEventListener("DOMContentLoaded", initDashboard);