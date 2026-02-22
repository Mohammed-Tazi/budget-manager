import { store } from "./store.js";

async function renderCharts() {
    const pieCtx = document.getElementById("pie");
    const barCtx = document.getElementById("bar");

    if (!pieCtx || !barCtx) return;

    try {
        // On récupère les données du serveur
        await store.fetchTransactions();

        // Sécurité : Si pas de transactions, on affiche un message ou on vide les canvas
        if (!store.transactions || store.transactions.length === 0) {
            console.log("Aucune donnée pour les graphiques.");
            return;
        }

        // 1. CALCULS DES DONNÉES
        const income = store.transactions
            .filter(t => t.type === "income")
            .reduce((s, t) => s + Number(t.amount), 0);
            
        const expense = store.transactions
            .filter(t => t.type === "expense")
            .reduce((s, t) => s + Number(t.amount), 0);

        // 2. GRAPHIQUE PIE
        const existingPie = Chart.getChart(pieCtx);
        if (existingPie) existingPie.destroy();

        new Chart(pieCtx, {
            type: "doughnut",
            data: {
                labels: ["Revenus", "Dépenses"],
                datasets: [{ 
                    data: [income, expense], 
                    backgroundColor: ["#1cc88a", "#e74a3b"],
                    borderWidth: 0, // Plus moderne sans bordure
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#9ca3af', padding: 20 } },
                }
            }
        });

        // 3. GRAPHIQUE BAR (Dépenses par catégorie)
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
                        label: "MAD", 
                        data: Object.values(cats), 
                        backgroundColor: "#3b82f6",
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        x: { ticks: { color: '#9ca3af' }, grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }
    } catch (error) {
        console.error("Erreur lors du rendu des graphiques:", error);
    }
}

document.addEventListener("DOMContentLoaded", renderCharts);
window.refreshCharts = renderCharts;