import { store } from "./store.js";

async function renderAnalytics() {
    await store.fetchTransactions();
    const tx = store.transactions;

    // 1. Données pour le graphique Pie (Revenus vs Dépenses)
    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

    const pieCtx = document.getElementById('pie');
    if (pieCtx) {
        new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: ['Revenus', 'Dépenses'],
                datasets: [{
                    data: [income, expense],
                    backgroundColor: ['#1cc88a', '#e74a3b'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    // 2. Données pour le graphique Bar (Par Catégorie)
    const categories = {};
    tx.filter(t => t.type === "expense").forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + Number(t.amount);
    });

    const barCtx = document.getElementById('bar');
    if (barCtx) {
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(categories),
                datasets: [{
                    label: 'Montant (MAD)',
                    data: Object.values(categories),
                    backgroundColor: '#6366f1',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", renderAnalytics);