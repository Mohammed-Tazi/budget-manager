import { store } from "./store.js";

async function initDashboard() {
    // 0. CHARGEMENT INDISPENSABLE
    // On attend que les données arrivent du serveur avant de calculer quoi que ce soit
    await Promise.all([
        store.fetchTransactions(),
        store.fetchBudgets()
    ]);

    const tx = store.transactions;
    const budgets = store.budgets;

    // 1. CALCULS DES TOTAUX
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

    // 2. GRAPHIQUE FLUX (Barres)
    const flowCtx = document.getElementById("flowChart");
    if (flowCtx) {
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
                maintainAspectRatio: false,
                plugins: { legend: { display: false } } 
            }
        });
    }

    // 3. GRAPHIQUE CATÉGORIES (Doughnut)
    const catCtx = document.getElementById("categoryChart");
    if (catCtx) {
        const cats = {};
        tx.filter(t => t.type === "expense").forEach(t => {
            const catName = t.category || "Autre";
            cats[catName] = (cats[catName] || 0) + Number(t.amount);
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
                options: { 
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    // 4. LOGIQUE DES ALERTES (Modification pour le format Array de MongoDB)
    const alertsEl = document.getElementById("alerts");
    if (alertsEl) {
        const activeAlerts = [];
        // On boucle sur le tableau de budgets venant de la base
        budgets.forEach(b => {
            const spent = tx.filter(t => t.category === b.category && t.type === "expense")
                           .reduce((s, t) => s + Number(t.amount), 0);
            if (spent > b.limit) {
                activeAlerts.push(`<div class="alert error">⚠️ Budget <strong>${b.category}</strong> dépassé !</div>`);
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
            const estimatedTotal = Math.round(dailyAverage * daysInMonth