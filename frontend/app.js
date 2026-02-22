import { store } from "./store.js";

window.handleAdd = async () => {
    const textEl = document.getElementById('text');
    const amountEl = document.getElementById('amount');
    const categoryEl = document.getElementById('category');

    if (!textEl.value || !amountEl.value) return alert("Remplissez les champs !");

    const data = {
        text: textEl.value,
        amount: Number(amountEl.value),
        category: categoryEl.value,
        type: categoryEl.value === 'Salaire' ? 'income' : 'expense'
    };

    await store.saveTransaction(data);
    textEl.value = "";
    amountEl.value = "";
    await initDashboard(); // Mise à jour instantanée
};

async function initDashboard() {
    await store.fetchTransactions();
    const tx = store.transactions;

    const income = tx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = tx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const total = income - expense;

    // Calcul Score Santé (Épargne/Revenus)
    let score = income > 0 ? Math.max(0, Math.min(100, Math.round((total / income) * 100))) : 0;

    // Mise à jour HTML
    document.getElementById("kpiTotal").innerText = total.toLocaleString() + " MAD";
    document.getElementById("kpiIncome").innerText = income.toLocaleString();
    document.getElementById("kpiExpense").innerText = expense.toLocaleString();
    
    const scoreEl = document.getElementById("financeScore");
    if (scoreEl) {
        scoreEl.innerText = `${score}/100`;
        scoreEl.style.color = score > 70 ? "#1cc88a" : score > 40 ? "#f6c23e" : "#e74a3b";
    }

    renderChart(income, expense);
}

function renderChart(income, expense) {
    const ctx = document.getElementById('flowChart');
    if (!ctx) return;
    const existing = Chart.getChart(ctx);
    if (existing) existing.destroy();

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Revenus', 'Dépenses'],
            datasets: [{ data: [income, expense], backgroundColor: ['#1cc88a', '#e74a3b'], borderWidth: 0 }]
        },
        options: { responsive: true, maintainAspectRatio: false, cutout: '80%' }
    });
}

document.addEventListener("DOMContentLoaded", initDashboard);