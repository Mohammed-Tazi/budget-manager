import { store } from "./store.js";

function renderCharts() {
    const pieCtx = document.getElementById("pie");
    const barCtx = document.getElementById("bar");

    // Vérification : si les éléments n'existent pas sur la page, on arrête
    if (!pieCtx || !barCtx) return;

    // 1. CALCULS DES DONNÉES
    const income = store.transactions
        .filter(t => t.type === "income")
        .reduce((s, t) => s + Number(t.amount), 0);
        
    const expense = store.transactions
        .filter(t => t.type === "expense")
        .reduce((s, t) => s + Number(t.amount), 0);

    // 2. GESTION DU GRAPHIQUE PIE (DOUGHNUT)
    // On détruit l'instance existante si elle existe
    const existingPie = Chart.getChart(pieCtx);
    if (existingPie) existingPie.destroy();

    if (income === 0 && expense === 0) {
        // Optionnel : afficher un texte si vide
        console.log("Analytics: Aucune donnée pour le doughnut");
    } else {
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
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Répartition Revenus / Dépenses' }
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
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });
    }
}

// Lancement au chargement du DOM
document.addEventListener("DOMContentLoaded", renderCharts);

// On expose la fonction pour pouvoir la rafraîchir si besoin
window.refreshCharts = renderCharts;