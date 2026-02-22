import { store } from "./store.js";

const COLORS = {
    income: "#1cc88a",
    expense: "#e74a3b",
    text: "#9ca3af",
    grid: "rgba(255,255,255,0.05)",
    // Palette étendue pour éviter les couleurs répétées si beaucoup de catégories
    palette: ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1", "#00d2d3", "#ff9f43"]
};

async function renderCharts() {
    const pieCtx = document.getElementById("pie");
    const barCtx = document.getElementById("bar");

    if (!pieCtx || !barCtx) return;

    try {
        // Correction : On s'assure que les données sont fraîches
        await store.fetchTransactions();
        const transactions = store.transactions || [];

        if (transactions.length === 0) {
            // Nettoyage propre des instances Chart.js
            [pieCtx, barCtx].forEach(ctx => {
                const chart = Chart.getChart(ctx);
                if (chart) chart.destroy();
            });
            return;
        }

        // 1. PRÉPARATION DES DONNÉES
        let totalIncome = 0;
        let totalExpense = 0;
        const categoryData = {};

        transactions.forEach(t => {
            // Conversion forcée en Number pour éviter les erreurs de type
            const amount = Math.abs(Number(t.amount)) || 0; 
            
            if (t.type === "income") {
                totalIncome += amount;
            } else {
                totalExpense += amount;
                const cat = t.category || "Autre";
                categoryData[cat] = (categoryData[cat] || 0) + amount;
            }
        });

        // 2. RENDU DES GRAPHIQUES
        renderPieChart(pieCtx, totalIncome, totalExpense);
        renderBarChart(barCtx, categoryData);

    } catch (error) {
        console.error("🚀 Erreur Analytics:", error);
    }
}

function renderPieChart(ctx, income, expense) {
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    // Empêcher un graphique vide si income et expense sont à 0
    if (income === 0 && expense === 0) return;

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Revenus", "Dépenses"],
            datasets: [{
                data: [income, expense],
                backgroundColor: [COLORS.income, COLORS.expense],
                borderWidth: 0, // Suppression des bordures pour un look plus "flat"
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "80%", 
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: COLORS.text, font: { size: 12 }, padding: 20 }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.label}: ${context.raw.toLocaleString()} MAD`
                    }
                }
            }
        }
    });
}

function renderBarChart(ctx, categoryData) {
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    const labels = Object.keys(categoryData);
    const data = Object.values(categoryData);

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Dépenses",
                data: data,
                backgroundColor: COLORS.palette,
                borderRadius: 8, // Bords plus arrondis
                maxBarThickness: 35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: COLORS.grid, drawBorder: false },
                    ticks: { color: COLORS.text, font: { size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: COLORS.text, font: { size: 10 } }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1f2937',
                    padding: 12
                }
            }
        }
    });
}

// Initialisation
document.addEventListener("DOMContentLoaded", renderCharts);
// Exposer la fonction pour pouvoir la rappeler après un ajout/suppression
window.refreshCharts = renderCharts;