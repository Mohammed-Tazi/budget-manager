import { store } from "./store.js";

async function renderCharts() {
    const pieCtx = document.getElementById("pie");
    const barCtx = document.getElementById("bar");

    // Vérification : si les éléments n'existent pas sur la page, on arrête
    if (!pieCtx || !barCtx) return;

    // 0. CHARGEMENT ASYNCHRONE DES DONNÉES
    // On attend que les transactions soient récupérées depuis le serveur
    await store.fetchTransactions();

    // 1. CALCULS DES DONNÉES
    const income = store.transactions
        .filter(t => t.type === "income")
        .reduce((s, t) => s + Number(t.amount), 0);
        
    const expense = store.transactions
        .filter(t => t.type === "expense")
        .reduce((s, t) => s + Number(t.amount), 0);

    // 2. GESTION DU GRAPHIQUE PIE (DOUGHNUT)
    const existingPie = Chart.getChart(pieCtx);
    if (existingPie) existingPie.destroy();

    if (income > 0 || expense > 0) {
        new Chart(pieCtx, {
            type: "doughnut",
            data: {
                labels: ["Revenus", "Dépenses"],
                datasets: [{ 
                    data: [income, expense], 
                    backgroundColor: ["#1cc88a", "#e74a3b"],
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#e5e7eb' } },
                    title: { display: true, text: 'Répartition Revenus / Dépenses', color: '#fff' }
                }
            }
        });
    }

    // 3. GESTION DU GRAPHIQUE BAR
    const cats = {};
    store.transactions
        .filter(t => t.type === "expense")
        .forEach(t => {
            const catName = t.category || "Autre";
            cats[catName] = (cats[catName] || 0) + Number(t.amount);
        });

    const existingBar = Chart.getChart(barCtx);
    if (existingBar) existingBar.destroy();

    if (Object.keys(cats).length > 0) {
        new Chart(barCtx, {
            type: "bar",
            data: {
                labels: Object.keys(cats),
                datasets: [{ 
                    label: "Dépenses par catégorie (MAD)", 
                    data: Object.values(cats), 
                    backgroundColor: "#4e73df",
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { 
                        beginAtZero: true,
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#9ca3af' }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#9ca3af' }
                    }
                }
            }
        });
    }
}

// Lancement au chargement du DOM
document.addEventListener("DOMContentLoaded", renderCharts);

// On expose la fonction pour pouvoir la rafraîchir dynamiquement
window.refreshCharts = renderCharts;