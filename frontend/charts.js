import { store } from "./store.js";

// Configuration des couleurs pour un rendu professionnel
const COLORS = {
    income: "#1cc88a",
    expense: "#e74a3b",
    chartBlue: "#3b82f6",
    text: "#9ca3af",
    grid: "rgba(255,255,255,0.05)",
    palette: ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"]
};

async function renderCharts() {
    const pieCtx = document.getElementById("pie");
    const barCtx = document.getElementById("bar");

    if (!pieCtx || !barCtx) return;

    try {
        await store.fetchTransactions();
        const transactions = store.transactions || [];

        // Gestion de l'état vide : On efface les graphiques si aucune donnée
        if (transactions.length === 0) {
            [pieCtx, barCtx].forEach(ctx => {
                const chart = Chart.getChart(ctx);
                if (chart) chart.destroy();
            });
            // Optionnel : Afficher un message "Aucune donnée" dans le DOM ici
            return;
        }

        // 1. PRÉPARATION DES DONNÉES (Un seul passage dans la liste pour la performance)
        let totalIncome = 0;
        let totalExpense = 0;
        const categoryData = {};

        transactions.forEach(t => {
            const amount = Number(t.amount) || 0;
            if (t.type === "income") {
                totalIncome += amount;
            } else {
                totalExpense += amount;
                const cat = t.category || "Autre";
                categoryData[cat] = (categoryData[cat] || 0) + amount;
            }
        });

        // 2. RENDU DU GRAPHIQUE CIRCULAIRE (Doughnut)
        renderPieChart(pieCtx, totalIncome, totalExpense);

        // 3. RENDU DU GRAPHIQUE EN BARRES (Catégories)
        renderBarChart(barCtx, categoryData);

    } catch (error) {
        console.error("🚀 Erreur Analytics:", error);
    }
}

function renderPieChart(ctx, income, expense) {
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: ["Revenus", "Dépenses"],
            datasets: [{
                data: [income, expense],
                backgroundColor: [COLORS.income, COLORS.expense],
                borderWidth: 2,
                borderColor: "#1a1a1a", // Séparateur discret entre les parts
                hoverOffset: 20,
                weight: 0.5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "75%", // Plus fin, plus moderne
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: COLORS.text, font: { family: 'Inter, sans-serif', size: 12 }, padding: 20 }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => ` ${context.label}: ${context.raw.toLocaleString()} MAD`
                    }
                }
            },
            animation: { animateScale: true, animateRotate: true }
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
                label: "Dépenses par catégorie",
                data: data,
                backgroundColor: COLORS.palette, // Palette multicolore automatique
                borderRadius: 6,
                maxBarThickness: 40
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: COLORS.text, callback: value => value + " MAD" },
                    grid: { color: COLORS.grid }
                },
                x: {
                    ticks: { color: COLORS.text },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 12,
                    displayColors: false
                }
            }
        }
    });
}

// Initialisation
document.addEventListener("DOMContentLoaded", renderCharts);
window.refreshCharts = renderCharts;